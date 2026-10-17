export interface ProgramInput { title: string; description: string; url: string }
export interface Program extends ProgramInput { id: string; created_at: string; updated_at: string }
export type FieldErrors = Partial<Record<keyof ProgramInput, string>>;
export function validUrl(value: string): boolean {
  try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password && value.length <= 2048; } catch { return false; }
}
export function cleanProgram(input: ProgramInput): ProgramInput {
  const value = { title: input.title.trim(), description: input.description.trim(), url: input.url.trim() };
  if (validUrl(value.url)) value.url = new URL(value.url).href;
  return value;
}
export function validateProgram(input: ProgramInput): FieldErrors {
  const e: FieldErrors = {};
  if (!input.title.trim() || [...input.title.trim()].length > 60) e.title = '제목은 1~60자로 입력해 주세요.';
  if (!input.description.trim() || [...input.description.trim()].length > 200) e.description = '설명은 1~200자로 입력해 주세요.';
  if (!validUrl(input.url.trim())) e.url = 'https://로 시작하는 인터넷 주소를 입력해 주세요. 계정·비밀번호가 들어간 주소는 사용할 수 없어요.';
  return e;
}
