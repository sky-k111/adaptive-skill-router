const STOP_WORDS = new Set('a an and are as at be been before by can do for from has have if in is it its of on or our that the their then these this to use used using was we when where which with you your'.split(' '));

export function metadataTokens(text: string): Set<string> {
  const normalized = text.toLowerCase();
  // Retain compound identities while matching ordinary phrases to hyphenated names.
  const words = normalized.match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
  const out = new Set(words.flatMap(word => [word, ...word.split('-')]).filter(word => !STOP_WORDS.has(word)));
  for (const group of normalized.match(/[\p{Script=Han}]+/gu) ?? []) {
    if (group.length === 1) out.add(group);
    for (let i = 0; i < group.length - 1; i++) out.add(group.slice(i, i + 2));
  }
  return out;
}
