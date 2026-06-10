# Singziller Documentation Index

## 문서 관리 규칙

- 문서는 업무 성격별 폴더에 둔다.
- 새 기능이나 정책 변경 작업은 관련 산출문서와 `docs/reviews/` 리뷰 문서를 함께 갱신한다.
- 개발 코드 변경은 테스트를 먼저 작성하고, 검증 결과를 리뷰 문서에 남긴다.
- 확정되지 않은 내용은 `의사결정 필요` 또는 `보완 필요` 섹션에 명시한다.
- 외부 API 계약, DB 컬럼, 표준 Web API는 영어 이름을 유지하고, 내부 도메인 설명과 코드명은 가능한 한글을 우선한다.

## 폴더 구조

```text
docs/
  01-planning/             기획 산출물
  02-requirements/         요구사항 정의
  03-screen-design/        화면 설계
  04-service-design/       서비스/API 설계
  05-data/                 데이터/카탈로그 정책
  06-collection/           곡정보 수집 관리
  07-development/          개발 규칙
  08-project-management/   일정/작업 관리
  reviews/                 작업별 리뷰
```

## 주요 산출문서

- [서비스 기획서](01-planning/서비스-기획서.md)
- [요구사항 정의서](02-requirements/요구사항-정의서.md)
- [화면 설계서](03-screen-design/화면-설계서.md)
- [서비스 설계서](04-service-design/서비스-설계서.md)
- [작업 일정](08-project-management/작업-일정.md)
- [브랜치 운영 프로세스](08-project-management/브랜치-운영-프로세스.md)

## 관리 문서

- [카탈로그 정책](05-data/카탈로그-정책.md)
- [PostgreSQL 스키마 초안](05-data/postgresql-스키마.md)
- [곡정보 수집 모듈 계획](06-collection/곡정보-수집-모듈.md)
- [카탈로그 API 초안](04-service-design/카탈로그-api.md)
- [개발 규칙](07-development/개발-규칙.md)
- [다음 작업 체크리스트](08-project-management/다음-작업-체크리스트.md)
- [브랜치 운영 프로세스](08-project-management/브랜치-운영-프로세스.md)
- [작업 리뷰 템플릿](reviews/review-template.md)
