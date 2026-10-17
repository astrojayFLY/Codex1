# 무지개 교실과 무지개 수학

교실에서 사용하는 교육 도구 두 개를 함께 보관하는 소스 저장소입니다.

- [무지개 교실](rainbow-classroom/README.md): React·TypeScript·Vite 기반 프로그램 허브, 미덕, 뽑기, 로컬 일기, PDF 글자 수 도구.
- [무지개 수학](math-play/README.md): 설치 없이 실행할 수 있는 초등 2학년 수학 게임.

각 폴더의 README에서 실행 방법을 확인하세요. 브라우저 검증 스크립트는 별도로 설치한 `playwright` 패키지와 Microsoft Edge를 사용합니다.

배포 주소: [교실 도구 허브](https://astrojayfly.github.io/Codex1/) · [무지개 수학](https://astrojayfly.github.io/Codex1/math-play/) · [무지개 교실](https://rainbow-classroom-astrojay.web.app/).

허브와 수학 앱은 GitHub Pages, 무지개 교실은 Firebase Hosting을 사용합니다. 무지개 교실의 백엔드는 Firebase Authentication·Firestore입니다. 일기는 Google 계정별로 분리해 서울 리전에 저장합니다. 실제 학생 개인정보를 입력하지 마세요. 미덕 콘텐츠는 교사 검토 전 초안입니다. 이전 로컬 일기 API는 배포 앱에 연결하지 않습니다.

[공개 전 보안 검토](PUBLIC_SECURITY_REVIEW.md)를 참고하세요. 환경파일, 실제 일기, 백업, 참고 원본, 의존성 및 빌드 산출물은 공개 대상에서 제외했습니다.

PDF.js 및 함께 배포한 폰트·WASM의 기존 라이선스는 `rainbow-classroom/public/pdf-counter/vendor/`에 보존했습니다.
