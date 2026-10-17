# 무지개 교실

[교실 도구 허브](https://astrojayfly.github.io/Codex1/) · [무지개 교실](https://rainbow-classroom-astrojay.web.app/) · [무지개 수학](https://astrojayfly.github.io/Codex1/math-play/)

React·TypeScript·Vite로 만든 교실 프로그램입니다. 오늘의 미덕, 빠른 뽑기, PDF 글자 수, Google 로그인과 개인 일기, 관리자 프로그램 목록을 제공합니다.

## 실행 및 검증

Node.js 24와 pnpm을 준비한 뒤 이 폴더에서 실행합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
```

브라우저 검증 스크립트에는 별도로 설치한 Playwright와 Microsoft Edge가 필요합니다. `src/firebase-config.json`은 웹앱의 공개 Firebase 식별 설정이며 서버 비밀키가 아닙니다. 개인키·서비스 계정 JSON·OAuth 비밀값을 소스나 VITE 환경변수에 넣지 마세요. 이 앱에는 Analytics SDK가 없습니다.

## 백엔드와 로그인

- Firebase 프로젝트: `rainbow-classroom-astrojay`
- Firestore: Enterprise Native, `classroom-live`, 서울 `asia-northeast3`, 실시간 조회 사용.
- Google 로그인: Firebase Authentication. 공용 기기를 고려해 브라우저 세션에만 로그인 상태를 보관합니다.
- 공개 `programs` 목록: 최대 100개. 로그인하지 않아도 조회할 수 있습니다.
- `admin_users/{uid}`: `enabled: true`가 등록된 Google 계정만 프로그램을 추가·수정·삭제합니다. 이 허용 목록은 클라이언트가 수정할 수 없습니다. 계정의 로그인 UUID를 확인한 운영자가 Firebase 관리 도구로 등록합니다. 이메일·UUID를 공개 README에 적지 않습니다.
- `users/{uid}/entries/{id}`: 로그인한 본인의 일기만 읽고 수정·삭제합니다. 관리자를 포함해 다른 사용자의 일기 접근은 차단됩니다. 화면은 날짜 내림차순 최근 500개를 표시하고 검색합니다.

프로그램과 일기는 열린 화면에 변경 사항을 전달하기 위해 실시간 snapshot 조회를 사용합니다. 실시간 표시가 필요한 이 두 흐름에는 일반 snapshot 쿼리를 사용하고, 불필요한 파이프라인 조회는 추가하지 않았습니다. Firestore 캐시는 메모리에서만 유지합니다. 계정을 바꾸면 일기 화면도 새로 생성해 이전 계정의 기록을 지웁니다.

일기는 Google Cloud에 저장되며 종단 간 암호화 저장소는 아닙니다. 학생 개인정보·주민번호·민감한 기록을 입력하지 마세요. 삭제 기능과 로그아웃을 제공하며, 기존 `data/diary.json`은 읽거나 자동 업로드하지 않습니다. 이전 로컬 일기 API 스크립트는 과거 로컬 검증용으로 남아 있지만 Vite와 배포 앱에는 연결되지 않습니다. 이전 Supabase SQL·내보내기 스크립트도 현재 운영 백엔드에서 사용하지 않습니다.

## 보안 규칙 검증

`firestore.rules`에 허용 필드, 자료형·길이, 소유자, 관리자 권한, 생성 시각 불변성과 서버 수정 시각 검증을 둡니다. `scripts/firestore-rules-check.mjs`는 합성 자료만 사용하며 `FIRESTORE_EMULATOR_HOST`가 없으면 실행을 거부합니다. Java 21 이상과 Firebase CLI의 에뮬레이터에서 실행하세요. 실제 프로젝트를 지정해 테스트하지 마세요.

규칙 검증은 에뮬레이터에서 수행하므로, Enterprise 실서비스의 인덱스·실시간 모드·인증 공급자 설정은 배포 후 별도로 확인합니다. 관리자 허용 목록을 해제하면 기존 로그인 세션도 다시 쓰지 못해야 합니다. 이 규칙은 초기 운영용이며 기능이나 데이터 구조가 바뀌면 재검토하세요.

## 배포

```sh
pnpm build
npx -y firebase-tools@latest deploy --only firestore,hosting --project rainbow-classroom-astrojay
```

`firebase.json`은 빌드된 `dist`만 Hosting에 올립니다. SPA 경로는 `index.html`로 연결하고, HTTPS·보안 헤더와 정적 자산 캐시를 설정합니다. 소스·환경파일·일기·백업은 Hosting에 포함하지 않습니다.

Google 공급자 초기 활성화에는 다음 형태의 **Git 제외 로컬 설정** `firebase.local.json`을 사용합니다. 공개 `firebase.json`에 개인 지원 이메일을 넣지 않습니다.

```json
{"auth":{"providers":{"googleSignIn":{"oAuthBrandDisplayName":"Rainbow Classroom","supportEmail":"본인의-지원-이메일"}}}}
```

```sh
npx -y firebase-tools@latest deploy --only auth --config firebase.local.json --project rainbow-classroom-astrojay
```

미덕 24개 콘텐츠는 교사 검토 전 초안으로 표시됩니다. [콘텐츠 검토본](CONTENT_REVIEW.md)을 확인하고 실제 검토 후에만 `VITE_CONTENT_APPROVED=true`로 빌드하세요. PDF.js·폰트·WASM의 라이선스는 `public/pdf-counter/vendor/`에 보존합니다.
