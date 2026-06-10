# Collection Source Policy Design

## Goal

Singziller는 공식 노래 API가 없다는 전제를 기준으로, 공식 홈페이지 검색 결과와 검증된 개인 구현 소스를 조합해 곡정보를 수집한다. 이 설계는 실제 수집기를 만들기 전, 어떤 소스를 어떤 신뢰도로 사용할지, 샘플 수집 후 수집 주기를 어떻게 결정할지, 수집된 곡정보를 어떤 절차로 검증할지 고정한다.

## Current Context

- 서버 기반은 Node.js/TypeScript/Fastify와 PostgreSQL로 잡혀 있다.
- `source_providers`, `collection_runs`, `source_records` migration이 이미 있다.
- 기존 문서는 TJ/KY 공식 페이지, YouTube, 개인 API, Google Sheet, 수동 입력을 원천 소스로 정의한다.
- 실제 외부 수집기는 아직 구현하지 않았고, 공식 TJ/KY 호출은 robots.txt와 약관 확인 전까지 mock/stub으로 제한되어 있다.

## External Findings

### TJ Media

- `https://www.tjmedia.com/robots.txt`는 전체 허용에 가깝고 `/error/`, `/upload/`, `/resources/admin/`만 제외한다.
- 공식 페이지에 `https://www.tjmedia.com/song/accompaniment` 반주곡 검색이 있다.
- 검색 UI는 곡번호, 곡제목, 가수, 작사가, 작곡가를 지원한다.
- `https://www.tjmedia.com/song/recent_song` 최신곡 페이지가 있고 내부 호출 후보로 `/legacy/api/newSongOfMonth`가 노출된다.
- 구형 `/tjsong/song_search*.asp` 경로는 현재 서비스 점검 페이지로 응답하므로 새 `/song/*` 경로를 우선 평가한다.

### KY Entertainment

- `https://www.kyentertainment.kr/robots.txt`는 `/_program/`, `/adm/`, `/lib/`를 제외한다.
- 공개 홈페이지에는 노래방 플랫폼 페이지와 반주곡 신청 게시판이 노출된다.
- 일반 곡번호 검색용 공개 엔드포인트는 이번 샘플 조사에서 확정되지 않았다.
- KY는 공식 검색 경로가 확정될 때까지 자동 서비스 반영 대상에서 제외한다. 이 기간에는 개인 구현/수동 보정/외부 후보를 낮은 신뢰도 원천으로 저장하고 검수 큐에서만 사용한다.

### Personal and Open Source Candidates

- `Alfex4936/tj-media-karaoke-api`
  - MIT 라이선스.
  - TJ 곡 DB를 미리 다운로드해 자체 검색한다고 설명한다.
  - README에 TJ미디어 요청 시 삭제될 수 있다는 경고가 있다.
  - 활용 방침: 구현 참고와 샘플 검증 후보로만 사용하고, 서비스 기준 원천으로 직접 의존하지 않는다.
- `ghkim887/karaoke-search`
  - MIT 라이선스.
  - TJ/KY/JOYSOUND 번호를 포함하지만 일본곡/보컬로이드 중심이다.
  - 주간 크롤과 검증 파이프라인 구조가 있다.
  - 활용 방침: 아키텍처 참고, 일본곡 영역 보조 검증, crawler 설계 참고로 사용한다.
- `Hyper4j/KaraokeAPI`
  - MIT 라이선스.
  - Java 기반 TJ 검색 API 성격이다.
  - 활용 방침: 공식 호출 방식 추정용 참고 후보로만 둔다.

## Role-Based Decision Model

### Data Steward

- 소스별 신뢰 등급을 승인한다.
- 공식 소스와 개인 구현 소스의 충돌 시 우선순위를 결정한다.
- 운영자 확정값이 자동 수집값보다 우선한다는 원칙을 유지한다.

### Collector Engineer

- provider adapter를 구현한다.
- robots.txt, 요청 간격, 오류 재시도, parser 변경 감지를 코드에 반영한다.
- 샘플 수집은 반드시 제한된 쿼리 세트와 dry-run 로그로 시작한다.

### Validation Lead

- raw record 중복 제거, 정규화, 매칭 후보, 신뢰도 점수를 검증한다.
- 낮은 신뢰도 record를 운영자 검수 큐로 보낸다.
- 검수 결과를 회귀 테스트 fixture로 남긴다.

### Operations Lead

- 수집 주기와 실패 알림 정책을 관리한다.
- 주간/월간 전환 기준을 샘플 수집 지표로 결정한다.
- 외부 페이지 구조 변경, 차단, 응답 지연을 운영 이슈로 관리한다.

### Compliance Reviewer

- robots.txt, 이용약관, 요청량, 저작권/데이터 재배포 위험을 검토한다.
- 공식 페이지 수집은 공개 검색 결과 metadata만 대상으로 제한한다.
- lyrics, 음원, 영상, 팬 콘텐츠 원문은 수집하지 않는다는 경계를 유지한다.

## Source Trust Tiers

### Tier 1: Official Search Results

- TJ/KY 공식 홈페이지의 공개 검색 결과.
- 곡번호, 제목, 가수, 작사가, 작곡가, 버전, 국가/분류만 수집한다.
- 서비스 반영 전 parser 테스트와 샘플 검증을 통과해야 한다.

### Tier 2: Official New Song and Chart Pages

- TJ 최신곡, TOP/HOT 차트, KY 공지/신곡/신청 게시판 등 공식 페이지.
- 신곡 탐지와 변경 감지에 사용한다.
- 전체 카탈로그 확정 근거로 쓰기보다 후보 생성에 사용한다.

### Tier 3: Personal APIs and Open Source Data

- 공개 GitHub 프로젝트, 개인 API, 정적 JSON 데이터.
- 라이선스가 명확하고 출처가 추적되는 경우에만 후보로 저장한다.
- 공식 결과와 일치하거나 운영자 검수된 뒤에만 service catalog 반영이 가능하다.

### Tier 4: Google Sheet and Manual Input

- 운영자가 관리하는 보정 데이터.
- 수동 확정값은 자동 수집이 덮어쓰지 않는다.
- 자동 수집과 충돌하면 `manual_override` 상태로 유지한다.

## Collection Phases

### Phase A: Discovery

- 각 후보 URL의 robots.txt, 약관, sitemap, 검색 폼, 내부 API 후보를 기록한다.
- 실제 수집 없이 HEAD/GET 샘플과 HTML 구조만 확인한다.
- 산출물: `source_probe` 로그와 소스 평가 문서.

### Phase B: Sample Collection

- TJ: 20개 이하의 고정 검색어로 검색 결과 parser를 검증한다.
- KY: 공식 검색 URL이 확정되기 전까지 게시판/공식 페이지 구조만 수집한다.
- 개인 API: 데이터 파일 schema, 라이선스, 최신성, 공식 소스 일치율을 검증한다.
- 샘플은 `source_records`에 저장하되 `candidate_only`로 표시한다.

### Phase C: Schedule Decision

- 2주 동안 샘플 수집 결과로 변경량, 실패율, 응답 시간, parser 변경 여부를 본다.
- 기준:
  - 주간 수집: 신곡/차트 변경이 주 1회 이상 감지되거나 변경량이 전체 샘플의 1% 이상일 때.
  - 월간 수집: 변경량이 작고 parser 안정성이 높을 때.
  - 혼합 수집: 최신곡/차트는 주간, 전체 검색 재검증은 월간.
- 초기 기본값은 혼합 수집이다.

### Phase D: Production Collection

- provider별 요청 제한과 backoff를 적용한다.
- `collection_runs`에 시작, 성공, 실패, 경고, 수집 건수, parser version을 기록한다.
- parser 변경 감지 또는 실패율 급증 시 자동 반영을 중단하고 검수 대기로 보낸다.

## Validation Process

1. Raw ingest
   - provider, source URL, fetched timestamp, payload hash, parser version을 저장한다.
2. Deduplication
   - provider별 `payload_hash`와 `external_id`로 중복 저장을 막는다.
3. Normalization
   - 제목, 가수, 곡번호, 버전, 국가/분류, 작사가, 작곡가를 표준 필드로 변환한다.
4. Cross-source matching
   - 같은 브랜드 내 번호 일치, 제목/가수 정규화 일치, 공식/개인 후보 일치 여부를 비교한다.
5. Confidence scoring
   - 공식 검색 결과: 기본 80점 이상.
   - 공식 최신곡/차트: 70점 이상.
   - 개인 API/오픈소스: 40~60점에서 시작.
   - 공식 소스와 교차 일치하면 가산한다.
6. Review queue
   - 점수 부족, 필수 필드 누락, 브랜드 간 매핑 충돌, 삭제/변경 감지는 운영자 검수로 보낸다.
7. Catalog promotion
   - 검증 통과 record만 candidate catalog로 승격한다.
   - 운영자 확정 또는 충분한 공식 근거가 있을 때 master catalog에 반영한다.

## Data and Audit Requirements

- 모든 source record는 원본 URL과 수집 시각을 가진다.
- parser version과 source policy version을 같이 저장한다.
- 자동 수집 결과와 운영자 보정 결과는 별도 provenance를 가진다.
- 외부 개인 API 결과는 provider license, repo URL, commit SHA 또는 fetched version을 기록한다.
- 삭제 요청, 차단, 약관 변경이 발생하면 해당 provider를 `paused`로 바꾼다.

## Error Handling

- HTTP 403/429: provider를 즉시 pause하고 다음 실행을 중단한다.
- HTML 구조 변경: parser mismatch로 기록하고 검수 큐에 보낸다.
- 필수 필드 누락: raw만 저장하고 normalized candidate 생성은 중단한다.
- 개인 API schema 변경: 해당 provider trust score를 낮추고 재평가한다.

## Testing Strategy

- parser는 fixture HTML/JSON으로 단위 테스트한다.
- 샘플 수집은 네트워크 없는 테스트와 네트워크 있는 manual verification을 분리한다.
- deduplication은 같은 payload, 같은 external id, 다른 provider의 같은 곡을 각각 테스트한다.
- validation scoring은 공식/개인/수동 충돌 케이스를 fixture로 둔다.
- schedule policy는 샘플 지표 입력값에 따라 weekly/monthly/mixed가 결정되는 순수 함수로 테스트한다.

## Decisions

- 공식 홈페이지 검색 결과를 최우선 소스로 둔다.
- 개인 API와 오픈소스 데이터는 직접 서비스 원천이 아니라 후보/검증/설계 참고로 둔다.
- 초기 수집 주기는 `mixed`: 최신곡/차트 주간, 전체 재검증 월간으로 둔다.
- 실제 주기 확정은 2주 샘플 수집 지표 후 Data Steward와 Operations Lead가 결정한다.
- 검증 통과 전에는 PWA catalog에 자동 반영하지 않는다.

## Implementation Planning Inputs

- `source_records`에 `source_url`, `parser_version`, `policy_version`, `candidate_status`가 충분한지 schema 재검토.
- `collection_runs`에 `warning_count`, `parser_version`, `paused_reason`이 필요한지 검토.
- 공식 TJ 검색 parser fixture 수집.
- KY 공식 검색 URL은 별도 probe task로 처리하고, 확정 전까지 production collector를 만들지 않는다.
- 개인 API 후보별 license/source metadata 저장 방식 정의.
