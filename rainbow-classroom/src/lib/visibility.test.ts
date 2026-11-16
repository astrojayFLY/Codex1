import { describe, expect, it } from 'vitest';
import { builtInPrograms, isVisible } from './visibility';
describe('program visibility', () => {
  it('keeps existing programs visible until explicitly hidden', () => {
    expect(isVisible({}, 'existing')).toBe(true);
    expect(isVisible({ existing: false }, 'existing')).toBe(false);
    expect(isVisible({ existing: true }, 'existing')).toBe(true);
  });
  it('includes every builtin once so hidden items remain manageable', () => {
    expect(builtInPrograms.map(p => p.id)).toEqual(['builtin-virtue','builtin-pdf','builtin-draw','builtin-diary','builtin-math']);
    expect(new Set(builtInPrograms.map(p => p.id)).size).toBe(5);
  });
});
