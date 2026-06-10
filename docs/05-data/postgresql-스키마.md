# PostgreSQL Schema Draft

## 핵심 엔티티

```sql
create table source_providers (
  id bigserial primary key,
  code text not null unique,
  name text not null,
  provider_type text not null,
  base_url text,
  trust_level integer not null default 50,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table collection_runs (
  id bigserial primary key,
  provider_id bigint not null references source_providers(id),
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched_count integer not null default 0,
  error_message text
);

create table source_records (
  id bigserial primary key,
  provider_id bigint not null references source_providers(id),
  collection_run_id bigint references collection_runs(id),
  external_id text,
  source_url text,
  raw_payload jsonb not null,
  raw_hash text not null,
  fetched_at timestamptz not null default now(),
  unique(provider_id, raw_hash)
);

create table song_master (
  id uuid primary key,
  canonical_title text not null,
  canonical_artist text not null,
  normalized_title text not null,
  normalized_artist text not null,
  category text,
  status text not null default 'active',
  confidence integer not null default 0,
  manual_locked boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table song_brand_entries (
  id uuid primary key,
  song_id uuid not null references song_master(id),
  brand text not null,
  song_number text not null,
  version text not null default 'unknown',
  title text not null,
  artist text not null,
  status text not null default 'active',
  source_record_id bigint references source_records(id),
  confidence integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(brand, song_number, version)
);

create table song_links (
  id uuid primary key,
  song_id uuid not null references song_master(id),
  link_type text not null,
  url text not null,
  title text,
  channel_or_artist text,
  source_record_id bigint references source_records(id),
  confidence integer not null default 0,
  created_at timestamptz not null default now(),
  unique(song_id, link_type, url)
);

create table song_mappings (
  id uuid primary key,
  song_id uuid not null references song_master(id),
  tj_entry_id uuid references song_brand_entries(id),
  ky_entry_id uuid references song_brand_entries(id),
  status text not null default 'candidate',
  confidence integer not null default 0,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table catalog_versions (
  id bigserial primary key,
  version text not null unique,
  scope text not null,
  format text not null,
  checksum text not null,
  record_count integer not null,
  created_at timestamptz not null default now()
);

create table catalog_deltas (
  id bigserial primary key,
  from_version text not null,
  to_version text not null,
  scope text not null,
  checksum text not null,
  payload_url text not null,
  created_at timestamptz not null default now()
);
```

## 인덱스 초안

```sql
create index idx_song_master_normalized on song_master(normalized_title, normalized_artist);
create index idx_song_brand_entries_brand_number on song_brand_entries(brand, song_number);
create index idx_source_records_provider_external on source_records(provider_id, external_id);
create index idx_song_links_song_type on song_links(song_id, link_type);
create index idx_catalog_versions_scope_created on catalog_versions(scope, created_at desc);
```

## 의사결정 필요

- UUID 생성 위치를 DB에서 할지 애플리케이션에서 할지 결정해야 한다.
- 전문 검색을 PostgreSQL full-text로 시작할지, Meilisearch/OpenSearch 같은 별도 검색엔진을 붙일지 결정해야 한다.
- `category`를 자유 텍스트로 둘지 별도 코드 테이블로 둘지 결정해야 한다.
- catalog snapshot payload를 DB에 저장할지 object storage에 둘지 결정해야 한다.

## 확정된 환경 구성

- PostgreSQL은 Docker 기반으로 운영한다.
- 개발, 검증, 운영 환경은 브랜치 기준에 맞춰 DB 포트, DB 계정, Docker 볼륨, DB명을 분리한다.
- API 서버와 PostgreSQL은 Docker 내부 네트워크로 연결하며, DB 포트는 외부 인터넷에 공개하지 않는다.
- PostgreSQL 컨테이너 환경변수는 `/opt/singziller/postgres/dev/.env`, `/opt/singziller/postgres/stg/.env`, `/opt/singziller/postgres/prd/.env`에 둔다.
- 애플리케이션 서버의 `DATABASE_URL`은 PostgreSQL 환경변수를 바탕으로 배포 단계에서 만든다.
- 자세한 환경 매핑은 [DB 환경 구성](../08-project-management/DB-환경-구성.md)을 따른다.

## 보완 필요

- status/check constraint 목록 정의.
- 운영자 변경 이력 audit table 추가 여부 검토.
- 한국어 검색을 위한 trigram/형태소 전략 검토.
