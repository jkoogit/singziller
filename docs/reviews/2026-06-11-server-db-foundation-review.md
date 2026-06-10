# Server DB Foundation Review

## 작업 목적

Issue #5와 PR #4 범위에서 PostgreSQL 기반 카탈로그 서버의 첫 골격을 만들고, 개발 DB에서 migration과 seed provider를 검증했다.

## 변경 파일

- `server/package.json`
- `server/package-lock.json`
- `server/tsconfig.json`
- `server/.gitignore`
- `server/.env.example`
- `server/src/config/env.ts`
- `server/src/app.ts`
- `server/src/server.ts`
- `server/src/catalog/manifest.ts`
- `server/src/db/pool.ts`
- `server/src/db/health.ts`
- `server/tests/env.test.ts`
- `server/tests/manifest.test.ts`
- `server/migrations/1749513600000_create_source_ingestion_tables.js`
- `server/migrations/1749513601000_seed_source_providers.js`
- `.gitignore`
- `docs/08-project-management/DB-환경-구성.md`
- `docs/08-project-management/보안-환경변수-샘플.md`
- `docs/08-project-management/에이전트-작업-운영.md`
- `docs/08-project-management/다음-세션-인수인계.md`
- `docs/08-project-management/다음-작업-체크리스트.md`
- `docs/superpowers/plans/2026-06-10-server-db-foundation.md`

## 의사결정

- 서버 런타임은 Node.js/TypeScript로 시작한다.
- API 프레임워크는 Fastify를 사용한다.
- migration 도구는 node-pg-migrate를 사용한다.
- Node 26과 ESM 환경에서 CJS CLI 문제가 있어 `node-pg-migrate-esm`을 사용한다.
- PostgreSQL 컨테이너 환경변수는 `/opt/singziller/postgres/{dev,stg,prd}/.env`에서 관리한다.
- 실제 비밀번호와 secret은 `.env`, `.env.*`에만 두고 Git에는 커밋하지 않는다.
- 공식 TJ/KY 수집은 robots.txt와 이용약관 확인 전까지 stub 또는 mock으로만 진행한다.

## 테스트 / 검증

로컬 검증:

```bash
node tests\sheets.test.js
cd server
npm test
npm run build
npm audit --omit=dev
```

결과:

- 기존 PWA sheets 테스트 통과.
- 서버 테스트 4개 통과.
- TypeScript build 통과.
- runtime audit 취약점 0건 확인.

개발 DB 검증:

```text
current_user: devdbszusr
current_database: singziller_dev
migrations:
- 1749513600000_create_source_ingestion_tables
- 1749513601000_seed_source_providers
providers:
- google-sheet
- ky-official
- personal-api
- tj-official
- youtube
```

## 남은 위험

- 개발 PostgreSQL 컨테이너는 기존 `pdfowers` 컨테이너를 함께 사용하고 있어 운영 명칭과 실제 컨테이너 명칭이 다르다.
- `stg`와 `prd` DB에는 아직 Singziller migration을 적용하지 않았다.
- 실제 외부 수집기는 아직 구현하지 않았다.
- `DATABASE_URL`에 특수문자 비밀번호가 들어가면 URL encoding이 필요하다.
- Windows 로컬에서는 Docker 내부 hostname인 `postgres-dev`가 해석되지 않으므로 직접 점검 시 host port를 사용해야 한다.

## 다음 작업

1. `CollectorProvider` 인터페이스 작성.
2. mock provider 작성.
3. provider registry 작성.
4. raw record hash 생성과 중복 저장 방지 흐름 작성.
5. collection run log 저장 흐름 작성.
6. `PWA`에서 `/catalog/manifest` 조회 후 서버 연결 상태 표시.
