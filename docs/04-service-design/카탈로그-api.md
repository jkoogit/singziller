# Catalog API Draft

## 목적

PWA는 PostgreSQL을 직접 조회하지 않는다. 서버 API를 통해 카탈로그 manifest, snapshot, delta, 온라인 검색 결과를 받는다.

## 엔드포인트 초안

### Manifest

```http
GET /catalog/manifest
```

응답:

```json
{
  "latestVersion": "2026.06.10.001",
  "scopes": [
    {
      "scope": "popular",
      "version": "2026.06.10.001",
      "format": "json",
      "recordCount": 500,
      "checksum": "sha256:...",
      "downloadUrl": "/catalog/snapshots/2026.06.10.001/popular.json"
    }
  ]
}
```

### Snapshot

```http
GET /catalog/snapshots/latest?scope=kpop
GET /catalog/snapshots/{version}/{scope}.json
```

### Delta

```http
GET /catalog/delta?from=2026.06.10.001&to=latest&scope=kpop
```

### Search

```http
GET /search?q=ditto&brand=TJ&category=K-POP&version=mr
```

온라인 검색은 PostgreSQL 카탈로그를 기준으로 하며, 응답에는 로컬 IndexedDB에 저장 가능한 정규화 레코드를 포함한다.

### Source Status

```http
GET /sources/status
GET /sources/runs?provider=tj&limit=20
```

운영 화면 또는 점검용으로 수집 상태를 확인한다.

## PWA 동기화 흐름

1. 앱 시작 시 `/catalog/manifest`를 호출한다.
2. 로컬 `installedVersion`과 서버 `latestVersion`을 비교한다.
3. 설치된 scope별 delta가 있으면 delta를 우선 적용한다.
4. delta 적용 실패 또는 checksum 불일치 시 snapshot을 다시 다운로드한다.
5. 적용 완료 후 IndexedDB의 `catalog_meta`를 갱신한다.

## 의사결정 필요

- API 인증을 공개 read-only로 시작할지, 익명 rate limit을 둘지 결정해야 한다.
- snapshot 파일을 서버 API가 직접 내려줄지 CDN/object storage로 넘길지 결정해야 한다.
- delta를 JSON Patch로 할지 자체 add/update/delete 포맷으로 할지 결정해야 한다.
- 검색 API에 pagination과 ranking explain을 어느 수준까지 노출할지 결정해야 한다.

## 보완 필요

- 에러 코드 표준화.
- checksum 검증 방식 정의.
- gzip/br 압축 적용 여부 확인.
- CORS 허용 origin 정책 정의.
