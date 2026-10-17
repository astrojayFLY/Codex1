import { describe, expect, it } from 'vitest';
import { parseRoster, randomIndex } from './draw';
describe('draw', () => {
  it('normalizes pasted rosters and removes empty and duplicate entries', () => {
    expect(parseRoster(' 1번\r\n2번, 3번\n\n1번, ')).toEqual(['1번','2번','3번']);
  });
  it('rejects empty pools and handles the last remaining person', () => {
    expect(() => randomIndex(0)).toThrow();
    expect(randomIndex(1)).toBe(0);
    for(let i=0;i<100;i++) expect(randomIndex(24)).toBeLessThan(24);
  });
});
