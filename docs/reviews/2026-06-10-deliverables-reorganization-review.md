# 산출문서 정리 리뷰

## 작업 목적

지금까지 검토한 정책, 설계, 작업 내용을 바탕으로 기획, 요구사항 정의, 화면 설계, 서비스 설계, 작업 일정 산출문서를 만들고 기존 문서를 업무별 폴더로 재배치한다.

## 변경 파일

- `docs/README.md`
- `docs/01-planning/서비스-기획서.md`
- `docs/02-requirements/요구사항-정의서.md`
- `docs/03-screen-design/화면-설계서.md`
- `docs/04-service-design/서비스-설계서.md`
- `docs/04-service-design/카탈로그-api.md`
- `docs/05-data/카탈로그-정책.md`
- `docs/05-data/postgresql-스키마.md`
- `docs/06-collection/곡정보-수집-모듈.md`
- `docs/07-development/개발-규칙.md`
- `docs/08-project-management/작업-일정.md`
- `docs/08-project-management/다음-작업-체크리스트.md`
- `docs/reviews/2026-06-10-deliverables-reorganization-review.md`
- `README.md`

## 의사결정

- 문서를 업무별 폴더로 관리한다.
- 기존 정책 문서는 삭제하지 않고 새 폴더로 이동한다.
- 기획/요구사항/화면/서비스/일정 산출문서를 별도 파일로 분리한다.
- 확정되지 않은 내용은 각 문서의 `의사결정 필요`와 `보완 필요`에 둔다.

## 테스트 / 검증

- 문서 구조 확인.
- README 링크 확인.
- 기존 `tests/sheets.test.js` 실행.
- `app.js` 문법 확인.

## 남은 위험

- 산출문서는 초안이며, 서버 스택과 수집 정책이 결정되면 개정이 필요하다.
- 화면 설계는 텍스트 중심 초안이라 실제 와이어프레임 보강이 필요하다.

## 다음 작업

- 서버 스택 결정.
- PostgreSQL migration 도구 결정.
- `server/` 골격 생성.
- IndexedDB 카탈로그 다운로드 설계 구현.
