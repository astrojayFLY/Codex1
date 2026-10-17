import { describe, expect, it } from 'vitest';
import { dailyIndex, otherIndex, seoulDate } from './daily';
import { cleanProgram, validateProgram, validUrl } from './programs';
import { validateVirtues, virtues } from '../data/virtues';

describe('서울 날짜별 선정', () => {
  it('서울 자정 경계와 윤일을 정확히 처리한다', () => {
    expect(seoulDate(new Date('2026-10-16T14:59:59Z'))).toBe('2026-10-16');
    expect(seoulDate(new Date('2026-10-16T15:00:00Z'))).toBe('2026-10-17');
    expect(seoulDate(new Date('2024-02-28T15:00:00Z'))).toBe('2024-02-29');
  });
  it('같은 순간을 서로 다른 시간대 입력으로 표현해도 같다', () => {
    expect(seoulDate(new Date('2026-10-17T08:00:00+09:00'))).toBe(seoulDate(new Date('2026-10-16T16:00:00-07:00')));
  });
  it('연속한 날짜는 다음 미덕, 빈 목록은 오류', () => {
    expect(dailyIndex('2026-10-18', 24)).toBe((dailyIndex('2026-10-17', 24) + 1) % 24);
    expect(() => dailyIndex('2026-10-17', 0)).toThrow();
  });
  it('임시 변경에서 현재 항목이 다시 선택되지 않는다', () => {
    for (let current = 0; current < 24; current++) for (let seed = 0; seed < 100; seed++) {
      const next = otherIndex(current, 24, () => seed / 100);
      expect(next).not.toBe(current); expect(next).toBeGreaterThanOrEqual(0); expect(next).toBeLessThan(24);
    }
    expect(otherIndex(0, 1)).toBe(0);
  });
});
describe('프로그램 입력 경계', () => {
  it.each(['javascript:alert(1)', 'data:text/html,<script>', 'http://example.com/', '/relative', 'https://user:secret@example.com', 'https://'])('금지 주소 %s', value => expect(validUrl(value)).toBe(false));
  it('주소 정규화와 공백 정리, 중복 검사용 정규화', () => {
    expect(cleanProgram({ title: ' 제목 ', description: ' 설명 ', url: 'https://EXAMPLE.com' })).toEqual({ title: '제목', description: '설명', url: 'https://example.com/' });
  });
  it('길이 초과와 필수 값 검증', () => {
    expect(Object.keys(validateProgram({ title: ' ', description: '가'.repeat(201), url: 'wrong' }))).toHaveLength(3);
    expect(validateProgram({ title: '가'.repeat(60), description: '나'.repeat(200), url: 'https://example.com/' })).toEqual({});
  });
});
describe('미덕 콘텐츠', () => {
  it('24개 고유 항목과 자료 구조를 검증한다', () => {
    expect(virtues).toHaveLength(24); expect(() => validateVirtues(virtues)).not.toThrow();
    expect(virtues.every(v => v.sourceRefs.length > 0 && v.examples.length === 3)).toBe(true);
  });
  it('중복과 누락 자료를 거절한다', () => {
    expect(() => validateVirtues([virtues[0], virtues[0]])).toThrow();
    expect(() => validateVirtues([{ ...virtues[0], description: '' }])).toThrow();
  });
});
