# 프로그램 표시 관리

선생님 공간에서 기본 프로그램 5개와 외부 프로그램을 함께 표시합니다. 각 항목의 ‘숨기기’는 초기 화면의 카드만 숨기며, ‘다시 표시’로 복구합니다. 직접 주소와 기존 일기 등 저장 데이터에는 영향을 주지 않습니다. 숨김은 접근 차단 기능이 아닙니다.

기본 프로그램의 고정 ID는 `src/lib/visibility.ts`에 있습니다. 외부 프로그램은 기존 URL 해시 ID를 사용합니다. `classroom-live`의 `program_visibility/{id}`에 `visible: boolean`, `updated_at: timestamp`만 저장하며 지정된 Google 관리자만 변경할 수 있습니다. 일반 방문자는 공개 표시 상태를 읽습니다. URL 수정과 프로그램 삭제 시 관련 상태도 함께 이동하거나 정리합니다.

열려 있는 초기 화면에 즉시 반영해야 하므로 기존 Firestore 실시간 리스너 방식을 유지합니다. 프로그램 목록의 내용은 여전히 공개 데이터이며, 숨김 설정은 기밀성을 제공하지 않습니다. 교실 도구 허브(GitHub Pages)는 별도의 화면이므로 이 설정의 대상에 포함하지 않습니다.

검증: TypeScript/Vite 프로덕션 빌드 통과, Vitest 20개 통과. 기존 격리 Firestore 권한 테스트에 표시 설정의 관리자 쓰기, 익명 읽기, 일반 사용자 쓰기 거부, 잘못된 ID·필드·자료형·시각 거부, 관리자 해제 후 쓰기 거부 사례를 추가했습니다. 아직 Firestore 규칙 컴파일 및 에뮬레이터 실행, 실제 브라우저 저장·복구 검증과 배포는 완료되지 않았습니다.

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for administrator-only visibility changes, bounded public preference reads, and strict boolean/timestamp validation. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.

배포 순서: Firebase 로그인 → `pnpm dlx firebase-tools deploy --only firestore:rules --dry-run` → 격리 에뮬레이터에서 `scripts/firestore-rules-check.mjs` → `pnpm run build` → `pnpm dlx firebase-tools deploy --only firestore:rules,hosting` → 관리자/방문자 창을 분리해 숨기기, 새로고침 유지, 다시 표시 확인.
