# Agent Workflow Handoff Review

## 작업 목적

다음 세션에서 에이전트가 기획, 설계, 코딩, 리뷰, 테스트, 평가, 일정관리 흐름으로 작업을 이어갈 수 있도록 운영 문서와 인수인계 문서를 정리했다.

## 변경 파일

- `docs/08-project-management/에이전트-작업-운영.md`
- `docs/08-project-management/다음-세션-인수인계.md`
- `docs/08-project-management/다음-작업-체크리스트.md`
- `docs/README.md`
- `docs/reviews/2026-06-11-agent-workflow-handoff-review.md`

## 의사결정

- GitHub Issue를 실행 단위로 사용한다.
- 문서는 기획, 설계, 운영 기준을 담당한다.
- PR은 구현 결과와 검토 단위로 사용한다.
- 리뷰 문서는 검증 결과와 남은 위험을 남기는 기록으로 사용한다.
- 다음 구현 작업은 수집 모듈 골격으로 둔다.

## 테스트/검증

- 문서 변경이므로 코드 동작 변경은 없다.
- 기존 테스트와 서버 빌드를 실행해 영향이 없는지 확인한다.

## 남은 위험

- 실제 TJ/KY 수집은 robots.txt와 이용약관 확인 전까지 진행하면 안 된다.
- 수집 모듈은 mock-first로 시작해야 외부 의존성에 막히지 않는다.
- DB 통합 테스트는 개발 DB 상태와 네트워크 접근 가능성에 의존한다.

## 다음 작업

1. `CollectorProvider` 인터페이스 작성.
2. mock provider 작성.
3. raw payload hash와 중복 저장 방지 테스트 작성.
4. collection run log 저장 흐름 작성.
5. 작업 결과를 PR 또는 후속 PR에 기록.
