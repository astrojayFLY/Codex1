export const builtInPrograms = [
  { id: 'builtin-virtue', title: '오늘의 미덕', description: '하루 한 가지 미덕으로 마음이 자라는 교실을 만들어요.', url: '/virtue' },
  { id: 'builtin-pdf', title: 'PDF 글자 수', description: 'PDF의 공백 포함·제외 글자 수를 확인해요.', url: '/pdf-counter/index.html' },
  { id: 'builtin-draw', title: '빠른 뽑기', description: '명단과 중복 제외 설정으로 다음 주인공을 뽑아요.', url: '/draw' },
  { id: 'builtin-diary', title: '나의 하루 · 일기장', description: '오늘의 기분과 소중한 순간을 나만 볼 수 있게 기록해요.', url: '/diary' },
  { id: 'builtin-math', title: '무지개 수학', description: '수와 연산, 구구단, 시각과 길이를 게임으로 배워요.', url: 'https://astrojayfly.github.io/Codex1/math-play/' },
] as const;
export type Visibility = Record<string, boolean>;
export function isVisible(settings: Visibility, id: string) { return settings[id] !== false; }
