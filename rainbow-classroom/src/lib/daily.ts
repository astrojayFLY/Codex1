import type { Virtue } from '../data/virtues';
export function seoulDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function dailyIndex(date: string, count: number): number {
  if (count < 1) throw new Error('표시할 미덕이 없어요.');
  const [year, month, day] = date.split('-').map(Number);
  const serial = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  if (!Number.isFinite(serial)) throw new Error('날짜를 확인해 주세요.');
  return ((serial % count) + count) % count;
}
export function otherIndex(current: number, count: number, random = Math.random): number {
  if (count < 2) return current;
  const choice = Math.min(count - 2, Math.max(0, Math.floor(random() * (count - 1))));
  return choice >= current ? choice + 1 : choice;
}
export function todayVirtue(items: Virtue[], date: string) { return items[dailyIndex(date, items.length)]; }
export function prettyDate(date: string) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'UTC', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(`${date}T00:00:00Z`));
}
