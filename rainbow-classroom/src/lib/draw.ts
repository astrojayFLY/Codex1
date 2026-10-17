export function parseRoster(text: string): string[] {
  return [...new Set(text.split(/[\n,]/).map(s => s.trim()).filter(Boolean))];
}
export function randomIndex(length: number): number {
  if (!Number.isInteger(length) || length < 1) throw new Error('뽑을 사람이 없어요.');
  const range = 0x100000000;
  const limit = range - range % length;
  const value = new Uint32Array(1);
  do { crypto.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % length;
}
