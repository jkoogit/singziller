# Server DB Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first PostgreSQL-backed server foundation for Singziller with environment-specific DB configuration, initial migrations, seed providers, and a mock catalog manifest API.

**Architecture:** Keep the existing static PWA untouched and add an independent `server/` Node.js package. The server exposes Fastify routes, reads DB settings from environment files, uses `pg` for connectivity, and uses `node-pg-migrate` for schema changes.

**Tech Stack:** Node.js, TypeScript, Fastify, pg, node-pg-migrate, Node test runner.

---

## File Structure

- Create: `server/package.json`  
  Defines server scripts, runtime dependencies, dev dependencies, and migration commands.
- Create: `server/tsconfig.json`  
  TypeScript configuration for `src` and `tests`.
- Create: `server/.gitignore`  
  Prevents real `.env.*`, build output, and dependency directories from being committed.
- Create: `server/.env.example`  
  Documents safe example values for app runtime variables. PostgreSQL container variables are managed on Ubuntu at `/opt/singziller/postgres/{dev,stg,prd}/.env`.
- Create: `server/src/config/env.ts`  
  Parses environment variables and selects the runtime environment.
- Create: `server/src/db/pool.ts`  
  Builds a PostgreSQL connection pool from `DATABASE_URL`.
- Create: `server/src/db/health.ts`  
  Checks database connectivity with `select 1`.
- Create: `server/src/catalog/manifest.ts`  
  Produces the initial mock catalog manifest.
- Create: `server/src/app.ts`  
  Builds the Fastify app and registers routes.
- Create: `server/src/server.ts`  
  Starts the HTTP server.
- Create: `server/migrations/1749513600000_create_source_ingestion_tables.js`  
  Creates `source_providers`, `collection_runs`, and `source_records`.
- Create: `server/migrations/1749513601000_seed_source_providers.js`  
  Seeds source provider rows.
- Create: `server/tests/manifest.test.ts`  
  Verifies `/catalog/manifest`.
- Create: `server/tests/env.test.ts`  
  Verifies environment parsing.
- Modify: `docs/08-project-management/DB-환경-구성.md`  
  Keep this as the canonical DB environment document.

## Task 1: Server Package Skeleton

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/.gitignore`
- Create: `server/.env.example`

- [ ] **Step 1: Create `server/package.json`**

```json
{
  "name": "singziller-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx src/server.ts",
    "start": "node dist/server.js",
    "test": "node --test --import tsx tests/*.test.ts",
    "migrate:up": "node-pg-migrate up --migrations-dir migrations",
    "migrate:down": "node-pg-migrate down --migrations-dir migrations"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "fastify": "^4.28.1",
    "pg": "^8.12.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "@types/pg": "^8.11.6",
    "node-pg-migrate": "^7.9.1",
    "tsx": "^4.16.2",
    "typescript": "^5.5.3"
  }
}
```

- [ ] **Step 2: Create `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

- [ ] **Step 3: Create `server/.gitignore`**

```gitignore
node_modules/
dist/
.env
.env.*
!.env.example
```

- [ ] **Step 4: Create `server/.env.example`**

```env
APP_ENV=development
HOST=0.0.0.0
PORT=3000
DATABASE_URL=postgresql://devdbszusr:change-me@postgres-dev:5432/singziller_dev
```

PostgreSQL container environment files are managed outside the repository:

```text
/opt/singziller/postgres/dev/.env
/opt/singziller/postgres/stg/.env
/opt/singziller/postgres/prd/.env
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
cd server
npm install
```

Expected: `package-lock.json` is created and install exits with code `0`.

- [ ] **Step 6: Commit**

```bash
git add server/package.json server/package-lock.json server/tsconfig.json server/.gitignore server/.env.example
git commit -m "기반: 서버 패키지 골격 추가"
```

## Task 2: Environment Configuration

**Files:**
- Create: `server/src/config/env.ts`
- Create: `server/tests/env.test.ts`

- [ ] **Step 1: Write failing env tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { 환경설정읽기 } from "../src/config/env.js";

test("환경설정읽기는 기본 실행 환경을 development로 둔다", () => {
  const 설정 = 환경설정읽기({
    DATABASE_URL: "postgresql://devdbszusr:pw@postgres-dev:5432/singziller_dev",
  });

  assert.equal(설정.appEnv, "development");
  assert.equal(설정.host, "0.0.0.0");
  assert.equal(설정.port, 3000);
  assert.equal(설정.databaseUrl, "postgresql://devdbszusr:pw@postgres-dev:5432/singziller_dev");
});

test("환경설정읽기는 stg/main 환경명을 허용한다", () => {
  assert.equal(
    환경설정읽기({
      APP_ENV: "staging",
      DATABASE_URL: "postgresql://stgdbszusr:pw@postgres-stg:5432/singziller_stg",
    }).appEnv,
    "staging",
  );

  assert.equal(
    환경설정읽기({
      APP_ENV: "production",
      PORT: "8080",
      DATABASE_URL: "postgresql://prddbszusr:pw@postgres-prd:5432/singziller_prd",
    }).port,
    8080,
  );
});

test("환경설정읽기는 DATABASE_URL이 없으면 실패한다", () => {
  assert.throws(() => 환경설정읽기({}), /DATABASE_URL/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server
npm test
```

Expected: FAIL because `server/src/config/env.ts` does not exist.

- [ ] **Step 3: Implement `server/src/config/env.ts`**

```ts
export type AppEnv = "development" | "staging" | "production";

export type 환경설정 = {
  appEnv: AppEnv;
  host: string;
  port: number;
  databaseUrl: string;
};

type EnvSource = Record<string, string | undefined>;

const 허용환경 = new Set<AppEnv>(["development", "staging", "production"]);

export function 환경설정읽기(env: EnvSource = process.env): 환경설정 {
  const appEnv = env.APP_ENV || "development";
  if (!허용환경.has(appEnv as AppEnv)) {
    throw new Error(`APP_ENV must be development, staging, or production: ${appEnv}`);
  }

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const port = Number(env.PORT || "3000");
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT must be a positive integer: ${env.PORT}`);
  }

  return {
    appEnv: appEnv as AppEnv,
    host: env.HOST || "0.0.0.0",
    port,
    databaseUrl: env.DATABASE_URL,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd server
npm test
```

Expected: PASS for `env.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add server/src/config/env.ts server/tests/env.test.ts
git commit -m "기반: 서버 환경 설정 추가"
```

## Task 3: Fastify App and Manifest API

**Files:**
- Create: `server/src/catalog/manifest.ts`
- Create: `server/src/app.ts`
- Create: `server/src/server.ts`
- Create: `server/tests/manifest.test.ts`

- [ ] **Step 1: Write failing manifest test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { 앱만들기 } from "../src/app.js";

test("GET /catalog/manifest returns the initial catalog manifest", async () => {
  const 앱 = 앱만들기();

  const 응답 = await 앱.inject({
    method: "GET",
    url: "/catalog/manifest",
  });

  assert.equal(응답.statusCode, 200);
  assert.deepEqual(JSON.parse(응답.body), {
    latestVersion: "2026.06.10.001",
    scopes: [
      {
        scope: "popular",
        version: "2026.06.10.001",
        format: "json",
        recordCount: 0,
        checksum: "sha256:mock",
        downloadUrl: "/catalog/snapshots/2026.06.10.001/popular.json",
      },
    ],
  });

  await 앱.close();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server
npm test
```

Expected: FAIL because `server/src/app.ts` does not exist.

- [ ] **Step 3: Implement `server/src/catalog/manifest.ts`**

```ts
export type CatalogScopeManifest = {
  scope: string;
  version: string;
  format: "json";
  recordCount: number;
  checksum: string;
  downloadUrl: string;
};

export type CatalogManifest = {
  latestVersion: string;
  scopes: CatalogScopeManifest[];
};

export function mockManifest(): CatalogManifest {
  const version = "2026.06.10.001";

  return {
    latestVersion: version,
    scopes: [
      {
        scope: "popular",
        version,
        format: "json",
        recordCount: 0,
        checksum: "sha256:mock",
        downloadUrl: `/catalog/snapshots/${version}/popular.json`,
      },
    ],
  };
}
```

- [ ] **Step 4: Implement `server/src/app.ts`**

```ts
import cors from "@fastify/cors";
import Fastify from "fastify";
import { mockManifest } from "./catalog/manifest.js";

export function 앱만들기() {
  const 앱 = Fastify({
    logger: true,
  });

  앱.register(cors, {
    origin: true,
  });

  앱.get("/health", async () => ({ ok: true }));
  앱.get("/catalog/manifest", async () => mockManifest());

  return 앱;
}
```

- [ ] **Step 5: Implement `server/src/server.ts`**

```ts
import { 앱만들기 } from "./app.js";
import { 환경설정읽기 } from "./config/env.js";

const 설정 = 환경설정읽기();
const 앱 = 앱만들기();

await 앱.listen({
  host: 설정.host,
  port: 설정.port,
});
```

- [ ] **Step 6: Run test and build**

Run:

```bash
cd server
npm test
npm run build
```

Expected: both commands exit with code `0`.

- [ ] **Step 7: Commit**

```bash
git add server/src/catalog/manifest.ts server/src/app.ts server/src/server.ts server/tests/manifest.test.ts
git commit -m "기반: 카탈로그 manifest API 추가"
```

## Task 4: Database Pool and Health Check

**Files:**
- Create: `server/src/db/pool.ts`
- Create: `server/src/db/health.ts`

- [ ] **Step 1: Create `server/src/db/pool.ts`**

```ts
import pg from "pg";
import type { 환경설정 } from "../config/env.js";

export function 풀만들기(설정: Pick<환경설정, "databaseUrl">) {
  return new pg.Pool({
    connectionString: 설정.databaseUrl,
  });
}
```

- [ ] **Step 2: Create `server/src/db/health.ts`**

```ts
import type pg from "pg";

export async function DB상태확인(pool: pg.Pool): Promise<boolean> {
  const 결과 = await pool.query<{ ok: number }>("select 1 as ok");
  return 결과.rows[0]?.ok === 1;
}
```

- [ ] **Step 3: Build**

Run:

```bash
cd server
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add server/src/db/pool.ts server/src/db/health.ts
git commit -m "기반: PostgreSQL 연결 헬퍼 추가"
```

## Task 5: Initial Migrations and Seed Providers

**Files:**
- Create: `server/migrations/1749513600000_create_source_ingestion_tables.js`
- Create: `server/migrations/1749513601000_seed_source_providers.js`

- [ ] **Step 1: Create ingestion migration**

```js
export async function up(pgm) {
  pgm.createTable("source_providers", {
    id: "id",
    code: { type: "text", notNull: true, unique: true },
    name: { type: "text", notNull: true },
    provider_type: { type: "text", notNull: true },
    base_url: { type: "text" },
    trust_level: { type: "integer", notNull: true, default: 50 },
    enabled: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.createTable("collection_runs", {
    id: "id",
    provider_id: {
      type: "integer",
      notNull: true,
      references: "source_providers(id)",
      onDelete: "restrict",
    },
    status: { type: "text", notNull: true },
    started_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    finished_at: { type: "timestamptz" },
    fetched_count: { type: "integer", notNull: true, default: 0 },
    error_message: { type: "text" },
  });

  pgm.createTable("source_records", {
    id: "id",
    provider_id: {
      type: "integer",
      notNull: true,
      references: "source_providers(id)",
      onDelete: "restrict",
    },
    collection_run_id: {
      type: "integer",
      references: "collection_runs(id)",
      onDelete: "set null",
    },
    external_id: { type: "text" },
    source_url: { type: "text" },
    raw_payload: { type: "jsonb", notNull: true },
    raw_hash: { type: "text", notNull: true },
    fetched_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint("source_records", "source_records_provider_hash_unique", {
    unique: ["provider_id", "raw_hash"],
  });
  pgm.createIndex("source_records", ["provider_id", "external_id"], {
    name: "idx_source_records_provider_external",
  });
}

export async function down(pgm) {
  pgm.dropTable("source_records");
  pgm.dropTable("collection_runs");
  pgm.dropTable("source_providers");
}
```

- [ ] **Step 2: Create seed migration**

```js
const providers = [
  ["tj-official", "TJ 공식", "official", "https://www.tjmedia.com/", 80],
  ["ky-official", "금영 공식", "official", "https://kysing.kr/", 80],
  ["youtube", "YouTube", "external-api", "https://www.googleapis.com/youtube/v3", 60],
  ["personal-api", "개인 API", "personal-api", null, 50],
  ["google-sheet", "Google Sheet", "manual-sheet", null, 70],
];

export async function up(pgm) {
  for (const [code, name, providerType, baseUrl, trustLevel] of providers) {
    pgm.sql(`
      insert into source_providers (code, name, provider_type, base_url, trust_level)
      values ('${code}', '${name}', '${providerType}', ${baseUrl ? `'${baseUrl}'` : "null"}, ${trustLevel})
      on conflict (code) do nothing
    `);
  }
}

export async function down(pgm) {
  pgm.sql(`
    delete from source_providers
    where code in ('tj-official', 'ky-official', 'youtube', 'personal-api', 'google-sheet')
  `);
}
```

- [ ] **Step 3: Run migrations against development DB**

Run with the real development `DATABASE_URL` generated from `/opt/singziller/postgres/dev/.env`:

```bash
cd server
npm run migrate:up
```

Expected: `source_providers`, `collection_runs`, and `source_records` are created in `singziller_dev`.

- [ ] **Step 4: Commit**

```bash
git add server/migrations/1749513600000_create_source_ingestion_tables.js server/migrations/1749513601000_seed_source_providers.js
git commit -m "기반: 수집 원천 테이블 migration 추가"
```

## Task 6: Documentation Review and Final Verification

**Files:**
- Modify if needed: `docs/08-project-management/DB-환경-구성.md`
- Modify if needed: `docs/08-project-management/다음-작업-체크리스트.md`
- Modify if needed: `docs/08-project-management/작업-일정.md`

- [ ] **Step 1: Verify branch and DB mapping in docs**

Run:

```bash
rg "singziller_dev|singziller_stg|singziller_prd|/opt/singziller/postgres" docs
```

Expected: DB names and env file locations appear in project management and PostgreSQL schema docs.

- [ ] **Step 2: Run all existing root tests**

Run from repository root:

```bash
node tests/sheets.test.js
```

Expected: `sheets tests passed`.

- [ ] **Step 3: Run all server checks**

Run:

```bash
cd server
npm test
npm run build
```

Expected: tests and build pass.

- [ ] **Step 4: Commit documentation touch-ups**

```bash
git add docs server
git commit -m "문서: 서버 DB 기반 작업 계획 정리"
```

## Self-Review

- Spec coverage: The plan covers environment files, DB branch mapping, server skeleton, migration setup, provider seed data, and `/catalog/manifest`.
- Placeholder scan: No placeholder markers or open-ended implementation steps remain.
- Type consistency: Korean function names are consistent across tests and implementation: `환경설정읽기`, `앱만들기`, `풀만들기`, `DB상태확인`.
- Scope control: This plan does not implement real collectors, snapshot publishing, IndexedDB download, or search ranking. Those remain later phase work.
