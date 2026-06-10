# Progress Report

## 2026-06-11 - Branch Policy Alignment

### Completed

- Fetched `origin` with prune.
- Confirmed local `main` matches `origin/main` at `acd4429`.
- Checked remote branch heads:
  - `origin/main`: `acd4429`
  - `origin/stg`: `cbd7cc4`
  - `origin/dev`: `d2d92ff`
- Confirmed `origin/dev`, `origin/stg`, and `origin/main` are not currently aligned.
- Renamed local branches:
  - `codex/2-operations-keyword-branch` -> `task/2-operations-keyword-branch` at `fe184d0`
  - `codex/server-db-foundation` -> `task/server-db-foundation`
- Recreated matching remote branches:
  - `origin/task/2-operations-keyword-branch` at `fe184d0`
  - `origin/task/server-db-foundation`
- Removed old remote `codex/*` branches.
- Added persistent repository instructions in `AGENTS.md` to use `task/*` going forward.

### Current Notes

- Local `dev` is not aligned with `origin/dev`:
  - local `dev`: `005c697`
  - `origin/dev`: `d2d92ff`
- No feature promotion was performed in this phase because this phase only changed branch policy and verified branch state.

## 2026-06-11 - Collection Source Policy

### Completed

- 조사 기준을 공식 홈페이지 검색, 공식 최신곡/차트, 개인 API/오픈소스, 수동 보정으로 분리했다.
- TJ Media는 새 공식 경로 `/song/accompaniment`, `/song/recent_song`을 우선 평가 대상으로 정했다.
- KY Entertainment는 공식 검색 경로가 확정될 때까지 자동 서비스 반영 대상에서 제외하는 것으로 분류했다.
- 개인 구현 후보를 서비스 원천이 아니라 후보/검증/설계 참고로 제한했다.
- 역할별 의사결정 모델을 Data Steward, Collector Engineer, Validation Lead, Operations Lead, Compliance Reviewer로 정리했다.
- 초기 수집 주기는 최신곡/차트 주간, 전체 재검증 월간의 혼합 정책으로 잡고, 2주 샘플 지표 후 확정하기로 했다.

### Documents

- `docs/superpowers/specs/2026-06-11-collection-source-policy-design.md`
- `docs/06-collection/수집-소스-평가-정책.md`
- `docs/08-project-management/수집-검증-운영계획.md`
