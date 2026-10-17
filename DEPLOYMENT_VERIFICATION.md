# 배포 검증 — 2026-10-17

- 허브: https://astrojayfly.github.io/Codex1/
- 무지개 수학: https://astrojayfly.github.io/Codex1/math-play/
- 무지개 교실: https://rainbow-classroom-astrojay.web.app/
- 소스: https://github.com/astrojayFLY/Codex1

GitHub Pages는 GitHub Actions에서 `hub`와 수학 HTML·CSS·JS만 패키징합니다. Firebase Hosting은 Vite `dist`만 배포합니다. 두 호스팅은 서로 연결하며, 허브의 추가 프로그램 목록은 공개 Firestore 목록을 최대 100개 조회합니다.

Firebase Authentication의 Google 공급자 활성화와 실제 Google 로그인을 확인했습니다. 본인 Google 계정은 UID로 관리자 허용 목록에 등록하며, 실제 이메일과 UID는 공개 문서에 적지 않습니다. 일기는 계정 소유자만 접근하고, 프로그램 관리 권한이 있어도 다른 사람의 일기를 읽을 수 없습니다.

Firestore Enterprise Native `classroom-live`의 서울 리전, 실시간 모드 ENABLED, freeTier=true를 확인했습니다. 결제 계정은 연결하지 않았습니다. 날짜·수정 시각 내림차순 일기 인덱스는 READY 상태입니다.

## 완료한 검사

- TypeScript 프로젝트 검사, 프로덕션 빌드, 단위 테스트 18개 통과.
- 공식 Firebase 규칙 검증기에서 컴파일 오류 없음.
- Java 21의 격리된 Firestore 에뮬레이터에서 접근 검사 37개 통과: 소유자 CRUD, 익명·다른 계정·관리자의 타인 일기 접근 거부, 관리자 목록 변조 거부, 일반 사용자 프로그램 쓰기 거부, 역할 해제 후 쓰기 거부, 길이·자료형·URL·생성 시각 변조 거부. 에뮬레이터는 Standard 엔진이므로 Enterprise 실서비스 설정은 별도로 검증했습니다.
- 실서비스에서 비로그인 공개 프로그램 조회 성공, 비로그인 일기 조회·목록·프로그램 쓰기 거부 확인.
- 실서비스 Google 로그인 후 개인정보 없는 합성 일기 저장·수정 및 새로고침 후 목록 유지 확인.
- Firebase의 `/`, `/diary`, `/admin`, `/draw`, `/virtue`, `/pdf-counter/index.html`에서 HTTPS 200 응답과 nosniff 헤더 확인.
- GitHub Pages 허브와 수학 앱 HTTPS 200 응답 확인. 실제 브라우저에서 수학 게임 6개 표시, 문제 시작, 정답 처리 확인.

기존 로컬 일기는 읽거나 업로드하지 않았습니다. 개인 지원 이메일·Firebase CLI 자격·개인키·로컬 설정·의존성·검증 산출물은 Git에서 제외했습니다. 브라우저에서 필요한 Firebase API 키는 공개 식별 설정이며 데이터 접근 권한을 주지 않습니다.

미덕 콘텐츠는 교사 검토 전 초안 안내를 유지합니다. 이 검증은 포괄적 침투 테스트나 온라인 의존성 취약점 전수검사를 대신하지 않습니다.
