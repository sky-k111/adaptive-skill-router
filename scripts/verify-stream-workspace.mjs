import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

if (!process.argv[2]) throw new Error('Provide a streaming workspace to verify.');
const strict = process.argv[3] === '--strict';
if (process.argv[3] && !strict) throw new Error('Unknown verification option.');
const { importRecords } = await import(pathToFileURL(join(resolve(process.argv[2]), 'importer.js')).href);
const read = chunks => importRecords(chunks, ...(strict ? [{ invalidUtf8: 'replace' }] : []));
const check = (name, body) => test(name, { timeout: 3000 }, body);
const encode = value => Buffer.from(value, 'utf8');

await check('every split of Unicode JSON values and a BOM preserves values and input', async () => {
  const values = [{ id: '租户😀/é', body: 'quote" and\nline' }, null, false, 0, ['汉字', '𐐷']];
  const bytes = encode('\ufeff' + values.map(JSON.stringify).join('\r\n'));
  const before = Buffer.from(bytes);
  for (let split = 0; split <= bytes.length; split++) {
    const chunks = [new Uint8Array(bytes.subarray(0, split)), new Uint8Array(), new Uint8Array(bytes.subarray(split))];
    const originals = chunks.map(chunk => chunk.slice());
    assert.deepEqual(await read(chunks), { records: values, errors: [] }, 'Byte split ' + split);
    assert.deepEqual(chunks, originals, 'Import must not mutate supplied chunks');
  }
  assert.deepEqual(await read([...bytes].map(byte => new Uint8Array([byte]))), { records: values, errors: [] });
  assert.deepEqual(bytes, before);
});
await check('physical numbering, blank lines, malformed JSON and recovery at EOF', async () => {
  const result = await read([encode('\n \t\r\n{"id":1}\r\n{broken}\n\nfalse\n"tail"')]);
  assert.deepEqual(result.records, [{ id: 1 }, false, 'tail']);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].line, 4);
  assert.equal(typeof result.errors[0].message, 'string');
  assert.ok(result.errors[0].message.length > 0);
  const tail = await read([encode('true\n{bad}')]);
  assert.deepEqual(tail.records, [true]);
  assert.equal(tail.errors[0].line, 2);
});
await check('replacement decoding is independent of malformed-byte chunk boundaries', async () => {
  const samples = [Buffer.from([0xff]), Buffer.from([0xc3, 0x28]), Buffer.from([0xe2, 0x82])];
  for (const sample of samples) {
    const bytes = Buffer.concat([encode('{"id":"'), sample, encode('"}\n')]);
    const expected = JSON.parse(new TextDecoder().decode(bytes).trim());
    for (let split = 0; split <= bytes.length; split++) {
      assert.deepEqual(await read([bytes.subarray(0, split), bytes.subarray(split)]), { records: [expected], errors: [] });
    }
  }
  const unfinished = Buffer.concat([encode('{"id":"ok"}\n'), Buffer.from([0xe2, 0x82])]);
  const result = await read([unfinished]);
  assert.deepEqual(result.records, [{ id: 'ok' }]);
  assert.equal(result.errors.length, 1, 'Decoder remainder must be consumed at EOF');
  assert.equal(result.errors[0].line, 2);
});
await check('interleaved async sources keep decoding and line state separate', async () => {
  let entered, resume;
  const started = new Promise(resolve => { entered = resolve; });
  const gate = new Promise(resolve => { resume = resolve; });
  const bytes = encode('{"id":"汉"}');
  async function* source() { yield bytes.subarray(0, 8); entered(); await gate; yield bytes.subarray(8); }
  const first = read(source());
  await started;
  assert.deepEqual(await read([encode('false\n{"other":2}\n')]), { records: [false, { other: 2 }], errors: [] });
  resume();
  assert.deepEqual(await first, { records: [{ id: '汉' }], errors: [] });
});
await check('original iterator failure propagates after partial input', async () => {
  const failure = new Error('source failed');
  async function* source() { yield encode('{"id":"first"}\n'); throw failure; }
  await assert.rejects(read(source()), error => error === failure);
});
await check('empty inputs and terminal blank lines emit no spurious records', async () => {
  for (const text of ['', '\ufeff', '\n\r\n  \t', '{}\n\n']) {
    const expected = text.startsWith('{}') ? [{}] : [];
    assert.deepEqual(await read([encode(text)]), { records: expected, errors: [] });
  }
  assert.deepEqual(await read([]), { records: [], errors: [] });
});

if (strict) {
  await check('default and explicit strict mode reject malformed UTF-8 at any split', async () => {
    const malformed = [Buffer.from([0xff]), Buffer.from([0xc3, 0x28]), Buffer.from([0xe2, 0x82]), Buffer.from([0xed, 0xa0, 0x80])];
    for (const payload of malformed) {
      const bytes = Buffer.concat([encode('{"id":"good"}\n{"id":"'), payload, encode('"}\n')]);
      for (let split = 0; split <= bytes.length; split++) {
        for (const options of [undefined, { invalidUtf8: 'reject' }]) {
          await assert.rejects(async () => importRecords([bytes.subarray(0, split), bytes.subarray(split)], options));
        }
      }
    }
    await assert.rejects(importRecords([encode('true\n'), Buffer.from([0xe2, 0x82])]));
  });
  await check('strict mode preserves valid byte splits, JSON error recovery and source errors', async () => {
    const bytes = encode('\ufeff{"id":"汉😀"}\r\n{bad}\nfalse');
    for (let split = 0; split <= bytes.length; split++) {
      const result = await importRecords([bytes.subarray(0, split), bytes.subarray(split)]);
      assert.deepEqual(result.records, [{ id: '汉😀' }, false]);
      assert.equal(result.errors.length, 1);
      assert.equal(result.errors[0].line, 2);
    }
    const failure = new Error('upstream');
    async function* source() { yield encode('true\n'); throw failure; }
    await assert.rejects(importRecords(source()), error => error === failure);
  });
  await check('invalid mode is rejected before consuming the source', async () => {
    for (const mode of ['', 'ignore', null, 1]) {
      let calls = 0;
      const source = { [Symbol.asyncIterator]() { calls++; return { async next() { return { done: true }; } }; } };
      await assert.rejects(async () => importRecords(source, { invalidUtf8: mode }));
      assert.equal(calls, 0);
    }
  });
}
