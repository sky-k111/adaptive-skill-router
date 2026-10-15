import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { setImmediate as nextTurn } from 'node:timers/promises';

const run = promisify(execFile);
const maxBytes = 512 * 1024;
const sizeError = 'Registry response exceeds the size limit.';
const helpers = ['adaptive-workflow', 'adaptive-skill-router'].map(name =>
  new URL(`../skills/${name}/scripts/search-skills.mjs`, import.meta.url));

test('canonical and portable search helpers are byte-identical', async () => {
  assert.deepEqual(await readFile(helpers[0]), await readFile(helpers[1]));
});

for (const helper of helpers) {
  const { searchRemoteSkills } = await import(helper.href);
  const label = helper.pathname.includes('/adaptive-workflow/') ? 'canonical' : 'portable';

  test(`${label}: HTTP cleanup failures preserve status diagnostics without retries`, async () => {
    let calls = 0;
    await assert.rejects(searchRemoteSkills({ query: 'node cli' }, async () => {
      calls++;
      return { ok: false, status: 503, body: { cancel: async () => { throw Error('PRIVATE_CANCEL'); } } };
    }), error => /HTTP 503/.test(error.message) && !/PRIVATE/.test(error.message));
    assert.equal(calls, 1);
  });

  test(`${label}: redirect cleanup failures do not suppress valid results`, async () => {
    let calls = 0;
    const result = await searchRemoteSkills({ query: 'node cli' }, async () => {
      if (++calls === 1) return { status: 307, headers: new Headers({ location: '/api/search' }), body: { cancel: async () => { throw Error('PRIVATE_CANCEL'); } } };
      return Response.json({ skills: [] });
    });
    assert.equal(calls, 2);
    assert.deepEqual(result.candidates, []);
  });

  for (const mode of ['transport', 'body', 'retry']) {
    test(`${label}: ${mode} failures do not expose raw errors or retry bodies`, async () => {
      let calls = 0;
      await assert.rejects(searchRemoteSkills({ query: 'node cli' }, async () => {
        calls++;
        if (mode === 'transport') throw Error('PRIVATE_TRANSPORT');
        if (mode === 'retry') {
          if (calls === 1) throw new TypeError('PRIVATE_FIRST_ATTEMPT');
          throw Error('PRIVATE_SECOND_ATTEMPT');
        }
        return new Response(new ReadableStream({ start(controller) { controller.error(Error('PRIVATE_BODY')); } }));
      }), error => /Registry (network request failed|response could not be read)/.test(error.message) && !/PRIVATE/.test(error.message));
      assert.equal(calls, mode === 'retry' ? 2 : 1);
    });
  }

  for (const cleanupRejects of [false, true]) {
    test(`${label}: oversized Content-Length awaits cancellation (${cleanupRejects ? 'rejects' : 'resolves'}) without reading or retrying`, async t => {
      const cleanup = Promise.withResolvers();
      t.after(() => cleanup.resolve());
      let calls = 0, cancellations = 0, pulls = 0, settled = false;
      const body = new ReadableStream({
        pull() { pulls++; },
        async cancel() {
          cancellations++;
          assert.equal(body.locked, false);
          await cleanup.promise;
          if (cleanupRejects) throw new TypeError('PRIVATE_CLEANUP_FAILURE');
        }
      }, { highWaterMark: 0 });
      const request = searchRemoteSkills({ query: 'node cli' }, async () => {
        calls++;
        return new Response(body, { headers: { 'content-length': String(maxBytes + 1) } });
      });
      const observed = request.then(
        value => { settled = true; return { value }; },
        error => { settled = true; return { error }; }
      );

      await nextTurn();
      assert.equal(cancellations, 1, 'must cancel before reporting the size rejection');
      assert.equal(settled, false, 'must wait for cancellation to finish');
      assert.equal(pulls, 0, 'must not consume the rejected body');
      assert.equal(calls, 1);

      cleanup.resolve();
      const result = await observed;
      assert.equal(result.error?.message, sizeError);
      assert.equal(cancellations, 1);
      assert.equal(pulls, 0);
      assert.equal(calls, 1, 'cleanup TypeErrors must not trigger a connection retry');
    });

    test(`${label}: standalone CLI preserves exit code and JSON error after cleanup ${cleanupRejects ? 'rejects' : 'resolves'}`, async () => {
      // Inject a local transport before running the real CLI entry point; no network is used.
      const preload = `
        import assert from 'node:assert/strict';
        import { setImmediate as nextTurn } from 'node:timers/promises';
        let calls = 0, cancellations = 0, pulls = 0, cleaned = false;
        globalThis.fetch = async () => {
          calls++;
          return new Response(new ReadableStream({
            pull() { pulls++; },
            async cancel() {
              cancellations++;
              await nextTurn();
              cleaned = true;
              ${cleanupRejects ? "throw new TypeError('PRIVATE_CLEANUP_FAILURE');" : ''}
            }
          }, { highWaterMark: 0 }), { headers: { 'content-length': '${maxBytes + 1}' } });
        };
        process.on('beforeExit', () => {
          assert.equal(cleaned, true);
          assert.equal(calls, 1);
          assert.equal(cancellations, 1);
          assert.equal(pulls, 0);
        });
      `;
      const env = { ...process.env };
      delete env.ASR_HTTPS_PROXY;
      await assert.rejects(run(process.execPath, [
        '--unhandled-rejections=strict', '--import', `data:text/javascript,${encodeURIComponent(preload)}`,
        fileURLToPath(helper), '--query', 'node cli'
      ], { env, windowsHide: true, timeout: 5000 }), error => {
        assert.equal(error.code, 1);
        assert.equal(error.stdout, '');
        assert.equal(error.stderr, `${JSON.stringify({ error: sizeError })}\n`);
        return true;
      });
    });
  }

  test(`${label}: oversized Content-Length with no body retains the size error and is not retried`, async () => {
    let calls = 0;
    await assert.rejects(searchRemoteSkills({ query: 'node cli' }, async () => {
      calls++;
      return new Response(null, { headers: { 'content-length': String(maxBytes + 1) } });
    }), { message: sizeError });
    assert.equal(calls, 1);
  });

  test(`${label}: Content-Length exactly at the limit still returns ordinary search results`, async () => {
    const row = { id: 'example/skills/node-cli', source: 'example/skills', name: 'node-cli', installs: 7 };
    const json = JSON.stringify({ skills: [row] });
    const payload = json.padEnd(maxBytes, ' ');
    assert.equal(Buffer.byteLength(payload), maxBytes);
    let calls = 0;
    const result = await searchRemoteSkills({ query: 'node cli' }, async () => {
      calls++;
      return new Response(payload, { headers: { 'content-length': String(maxBytes) } });
    });
    assert.equal(calls, 1);
    assert.equal(result.candidates.length, 1);
    assert.equal(result.candidates[0].id, `skills.sh:${row.id}`);
    assert.equal(result.candidates[0].installs, 7);
    assert.deepEqual(result.diagnostics, []);
  });
}
