# Collection Source Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first testable collector policy foundation: provider interfaces, mock collection, raw record hashing, source probe records, schedule policy, and validation scoring.

**Architecture:** Keep external scraping out of the first implementation. Build pure TypeScript modules with fixtures and in-memory repositories so policy behavior is testable without network or PostgreSQL access. Later tasks can replace the in-memory repository with PostgreSQL writes and add real TJ/KY provider adapters.

**Tech Stack:** Node.js, TypeScript, Fastify server package, Node test runner, `tsx`, PostgreSQL schema already represented by migrations.

---

## File Structure

- Create: `server/src/collectors/provider.ts`  
  Defines the collector provider contract and normalized raw source item shape.
- Create: `server/src/collectors/mock-provider.ts`  
  Provides deterministic sample records for tests and dry-run development.
- Create: `server/src/collectors/registry.ts`  
  Registers known provider stubs and exposes lookup helpers.
- Create: `server/src/collection/raw-record.ts`  
  Builds stable payload hashes and raw record inputs.
- Create: `server/src/collection/in-memory-repository.ts`  
  Stores collection runs and source records for tests without PostgreSQL.
- Create: `server/src/collection/collect.ts`  
  Orchestrates a provider run into raw records.
- Create: `server/src/collection/source-probe.ts`  
  Captures source probe results and pause decisions.
- Create: `server/src/collection/schedule-policy.ts`  
  Decides `weekly`, `monthly`, `mixed`, or `paused` from sample metrics.
- Create: `server/src/collection/validation.ts`  
  Scores collected song records and classifies review actions.
- Test: `server/tests/collectors.test.ts`  
  Verifies provider contract, registry, raw hash, run logging, and dedup behavior.
- Test: `server/tests/collection-policy.test.ts`  
  Verifies source probe pause rules, schedule decisions, and validation scoring.
- Modify: `docs/08-project-management/progress-report.md`  
  Add implementation phase progress after code is complete.
- Create: `docs/reviews/2026-06-11-collection-policy-foundation-review.md`  
  Record verification and remaining risks for the PR.

## Task 1: Provider Contract and Mock Provider

**Files:**
- Create: `server/src/collectors/provider.ts`
- Create: `server/src/collectors/mock-provider.ts`
- Test: `server/tests/collectors.test.ts`

- [ ] **Step 1: Write the failing provider test**

Create `server/tests/collectors.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { createMockProvider } from "../src/collectors/mock-provider.js";

test("mock provider returns deterministic source items", async () => {
  const provider = createMockProvider();

  assert.equal(provider.code, "mock-provider");
  assert.equal(provider.trustLevel, 30);

  const result = await provider.collect({
    limit: 2,
    query: "Ditto",
    requestedAt: new Date("2026-06-11T00:00:00.000Z"),
  });

  assert.equal(result.providerCode, "mock-provider");
  assert.equal(result.items.length, 2);
  assert.deepEqual(result.items[0], {
    externalId: "mock-tj-82802",
    brand: "TJ",
    title: "Ditto",
    artist: "NewJeans",
    songNumber: "82802",
    category: "K-POP",
    version: "반주",
    sourceUrl: "mock://songs/tj/82802",
    payload: {
      brand: "TJ",
      title: "Ditto",
      artist: "NewJeans",
      songNumber: "82802",
      category: "K-POP",
      version: "반주",
    },
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server
npm test -- collectors.test.ts
```

Expected: FAIL because `../src/collectors/mock-provider.js` does not exist.

- [ ] **Step 3: Implement provider types**

Create `server/src/collectors/provider.ts`:

```ts
export type ProviderCode =
  | "tj-official"
  | "ky-official"
  | "youtube"
  | "personal-api"
  | "google-sheet"
  | "mock-provider";

export type SongBrand = "TJ" | "KY" | "YOUTUBE" | "PERSONAL" | "GOOGLE_SHEET";

export type CollectRequest = {
  query?: string;
  limit?: number;
  requestedAt: Date;
};

export type SourceSongItem = {
  externalId: string;
  brand: SongBrand;
  title: string;
  artist: string;
  songNumber: string;
  category?: string;
  version?: string;
  lyricist?: string;
  composer?: string;
  sourceUrl: string;
  payload: Record<string, unknown>;
};

export type CollectResult = {
  providerCode: ProviderCode;
  collectedAt: Date;
  items: SourceSongItem[];
  warnings: string[];
};

export type CollectorProvider = {
  code: ProviderCode;
  displayName: string;
  trustLevel: number;
  collect(request: CollectRequest): Promise<CollectResult>;
};
```

- [ ] **Step 4: Implement mock provider**

Create `server/src/collectors/mock-provider.ts`:

```ts
import type { CollectRequest, CollectResult, CollectorProvider, SourceSongItem } from "./provider.js";

const mockItems: SourceSongItem[] = [
  {
    externalId: "mock-tj-82802",
    brand: "TJ",
    title: "Ditto",
    artist: "NewJeans",
    songNumber: "82802",
    category: "K-POP",
    version: "반주",
    sourceUrl: "mock://songs/tj/82802",
    payload: {
      brand: "TJ",
      title: "Ditto",
      artist: "NewJeans",
      songNumber: "82802",
      category: "K-POP",
      version: "반주",
    },
  },
  {
    externalId: "mock-ky-95763",
    brand: "KY",
    title: "Ditto",
    artist: "NewJeans",
    songNumber: "95763",
    category: "K-POP",
    version: "반주",
    sourceUrl: "mock://songs/ky/95763",
    payload: {
      brand: "KY",
      title: "Ditto",
      artist: "NewJeans",
      songNumber: "95763",
      category: "K-POP",
      version: "반주",
    },
  },
];

export function createMockProvider(): CollectorProvider {
  return {
    code: "mock-provider",
    displayName: "Mock Provider",
    trustLevel: 30,
    async collect(request: CollectRequest): Promise<CollectResult> {
      const query = request.query?.trim().toLocaleLowerCase("ko-KR");
      const filtered = query
        ? mockItems.filter((item) => `${item.title} ${item.artist} ${item.songNumber}`.toLocaleLowerCase("ko-KR").includes(query))
        : mockItems;
      const limit = request.limit ?? filtered.length;

      return {
        providerCode: "mock-provider",
        collectedAt: request.requestedAt,
        items: filtered.slice(0, limit),
        warnings: [],
      };
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
cd server
npm test -- collectors.test.ts
```

Expected: PASS for `mock provider returns deterministic source items`.

- [ ] **Step 6: Commit**

```bash
git add server/src/collectors/provider.ts server/src/collectors/mock-provider.ts server/tests/collectors.test.ts
git commit -m "기반: mock 수집 provider 추가"
```

## Task 2: Provider Registry

**Files:**
- Create: `server/src/collectors/registry.ts`
- Modify: `server/tests/collectors.test.ts`

- [ ] **Step 1: Add failing registry tests**

Append to `server/tests/collectors.test.ts`:

```ts
import { createProviderRegistry } from "../src/collectors/registry.js";

test("provider registry exposes known provider stubs", () => {
  const registry = createProviderRegistry();

  assert.deepEqual(registry.codes(), [
    "tj-official",
    "ky-official",
    "youtube",
    "personal-api",
    "google-sheet",
    "mock-provider",
  ]);
  assert.equal(registry.get("mock-provider").displayName, "Mock Provider");
  assert.equal(registry.get("tj-official").trustLevel, 80);
  assert.throws(() => registry.get("unknown-provider"), /Unknown provider/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server
npm test -- collectors.test.ts
```

Expected: FAIL because `registry.ts` does not exist.

- [ ] **Step 3: Implement registry**

Create `server/src/collectors/registry.ts`:

```ts
import { createMockProvider } from "./mock-provider.js";
import type { CollectRequest, CollectResult, CollectorProvider, ProviderCode } from "./provider.js";

function createStubProvider(code: ProviderCode, displayName: string, trustLevel: number): CollectorProvider {
  return {
    code,
    displayName,
    trustLevel,
    async collect(_request: CollectRequest): Promise<CollectResult> {
      return {
        providerCode: code,
        collectedAt: _request.requestedAt,
        items: [],
        warnings: [`${code} is registered but not implemented for live collection`],
      };
    },
  };
}

export function createProviderRegistry() {
  const providers: CollectorProvider[] = [
    createStubProvider("tj-official", "TJ 공식", 80),
    createStubProvider("ky-official", "KY 공식", 80),
    createStubProvider("youtube", "YouTube", 60),
    createStubProvider("personal-api", "개인 API", 50),
    createStubProvider("google-sheet", "Google Sheet", 70),
    createMockProvider(),
  ];
  const byCode = new Map(providers.map((provider) => [provider.code, provider]));

  return {
    codes(): ProviderCode[] {
      return providers.map((provider) => provider.code);
    },
    get(code: string): CollectorProvider {
      const provider = byCode.get(code as ProviderCode);
      if (!provider) {
        throw new Error(`Unknown provider: ${code}`);
      }
      return provider;
    },
  };
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
cd server
npm test -- collectors.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/collectors/registry.ts server/tests/collectors.test.ts
git commit -m "기반: 수집 provider registry 추가"
```

## Task 3: Raw Record Hashing and Deduplication

**Files:**
- Create: `server/src/collection/raw-record.ts`
- Create: `server/src/collection/in-memory-repository.ts`
- Modify: `server/tests/collectors.test.ts`

- [ ] **Step 1: Add failing raw record tests**

Append to `server/tests/collectors.test.ts`:

```ts
import { createRawRecordInput, stablePayloadHash } from "../src/collection/raw-record.js";
import { createInMemoryCollectionRepository } from "../src/collection/in-memory-repository.js";

test("stablePayloadHash is stable regardless of object key order", () => {
  const first = stablePayloadHash({ title: "Ditto", artist: "NewJeans", songNumber: "82802" });
  const second = stablePayloadHash({ songNumber: "82802", artist: "NewJeans", title: "Ditto" });

  assert.equal(first, second);
  assert.match(first, /^sha256:[a-f0-9]{64}$/);
});

test("repository deduplicates records by provider and payload hash", () => {
  const repository = createInMemoryCollectionRepository();
  const run = repository.startRun({
    providerCode: "mock-provider",
    startedAt: new Date("2026-06-11T00:00:00.000Z"),
  });
  const input = createRawRecordInput({
    providerCode: "mock-provider",
    collectionRunId: run.id,
    item: {
      externalId: "mock-tj-82802",
      brand: "TJ",
      title: "Ditto",
      artist: "NewJeans",
      songNumber: "82802",
      sourceUrl: "mock://songs/tj/82802",
      payload: { title: "Ditto", artist: "NewJeans", songNumber: "82802" },
    },
    collectedAt: new Date("2026-06-11T00:00:00.000Z"),
  });

  const first = repository.saveSourceRecord(input);
  const second = repository.saveSourceRecord(input);

  assert.equal(first.inserted, true);
  assert.equal(second.inserted, false);
  assert.equal(repository.sourceRecords().length, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server
npm test -- collectors.test.ts
```

Expected: FAIL because collection modules do not exist.

- [ ] **Step 3: Implement raw record helpers**

Create `server/src/collection/raw-record.ts`:

```ts
import { createHash } from "node:crypto";
import type { ProviderCode, SourceSongItem } from "../collectors/provider.js";

export type RawRecordInput = {
  providerCode: ProviderCode;
  collectionRunId: number;
  externalId: string;
  sourceUrl: string;
  payloadHash: string;
  payload: Record<string, unknown>;
  collectedAt: Date;
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function stablePayloadHash(payload: Record<string, unknown>): string {
  return `sha256:${createHash("sha256").update(stableStringify(payload)).digest("hex")}`;
}

export function createRawRecordInput(params: {
  providerCode: ProviderCode;
  collectionRunId: number;
  item: SourceSongItem;
  collectedAt: Date;
}): RawRecordInput {
  return {
    providerCode: params.providerCode,
    collectionRunId: params.collectionRunId,
    externalId: params.item.externalId,
    sourceUrl: params.item.sourceUrl,
    payloadHash: stablePayloadHash(params.item.payload),
    payload: params.item.payload,
    collectedAt: params.collectedAt,
  };
}
```

- [ ] **Step 4: Implement in-memory repository**

Create `server/src/collection/in-memory-repository.ts`:

```ts
import type { ProviderCode } from "../collectors/provider.js";
import type { RawRecordInput } from "./raw-record.js";

export type CollectionRunStatus = "running" | "success" | "failed";

export type CollectionRun = {
  id: number;
  providerCode: ProviderCode;
  status: CollectionRunStatus;
  startedAt: Date;
  finishedAt?: Date;
  collectedCount: number;
  warningCount: number;
  errorMessage?: string;
};

export type SourceRecord = RawRecordInput & {
  id: number;
};

export function createInMemoryCollectionRepository() {
  let nextRunId = 1;
  let nextRecordId = 1;
  const runs: CollectionRun[] = [];
  const records: SourceRecord[] = [];

  return {
    startRun(input: { providerCode: ProviderCode; startedAt: Date }): CollectionRun {
      const run: CollectionRun = {
        id: nextRunId++,
        providerCode: input.providerCode,
        status: "running",
        startedAt: input.startedAt,
        collectedCount: 0,
        warningCount: 0,
      };
      runs.push(run);
      return run;
    },
    finishRun(input: {
      runId: number;
      status: CollectionRunStatus;
      finishedAt: Date;
      collectedCount: number;
      warningCount: number;
      errorMessage?: string;
    }): CollectionRun {
      const run = runs.find((candidate) => candidate.id === input.runId);
      if (!run) {
        throw new Error(`Unknown collection run: ${input.runId}`);
      }
      run.status = input.status;
      run.finishedAt = input.finishedAt;
      run.collectedCount = input.collectedCount;
      run.warningCount = input.warningCount;
      run.errorMessage = input.errorMessage;
      return run;
    },
    saveSourceRecord(input: RawRecordInput): { inserted: boolean; record: SourceRecord } {
      const existing = records.find(
        (record) => record.providerCode === input.providerCode && record.payloadHash === input.payloadHash,
      );
      if (existing) {
        return { inserted: false, record: existing };
      }
      const record = { id: nextRecordId++, ...input };
      records.push(record);
      return { inserted: true, record };
    },
    runs(): CollectionRun[] {
      return [...runs];
    },
    sourceRecords(): SourceRecord[] {
      return [...records];
    },
  };
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
cd server
npm test -- collectors.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/collection/raw-record.ts server/src/collection/in-memory-repository.ts server/tests/collectors.test.ts
git commit -m "기반: raw record hash와 중복 방지 추가"
```

## Task 4: Collection Orchestration

**Files:**
- Create: `server/src/collection/collect.ts`
- Modify: `server/tests/collectors.test.ts`

- [ ] **Step 1: Add failing orchestration test**

Append to `server/tests/collectors.test.ts`:

```ts
import { collectFromProvider } from "../src/collection/collect.js";

test("collectFromProvider logs a run and stores unique source records", async () => {
  const repository = createInMemoryCollectionRepository();
  const result = await collectFromProvider({
    provider: createMockProvider(),
    repository,
    request: {
      query: "Ditto",
      limit: 2,
      requestedAt: new Date("2026-06-11T00:00:00.000Z"),
    },
  });

  assert.equal(result.run.status, "success");
  assert.equal(result.insertedCount, 2);
  assert.equal(result.duplicateCount, 0);
  assert.equal(repository.runs().length, 1);
  assert.equal(repository.sourceRecords().length, 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server
npm test -- collectors.test.ts
```

Expected: FAIL because `collect.ts` does not exist.

- [ ] **Step 3: Implement collection orchestration**

Create `server/src/collection/collect.ts`:

```ts
import type { CollectRequest, CollectorProvider } from "../collectors/provider.js";
import type { createInMemoryCollectionRepository, CollectionRun } from "./in-memory-repository.js";
import { createRawRecordInput } from "./raw-record.js";

type CollectionRepository = ReturnType<typeof createInMemoryCollectionRepository>;

export type CollectFromProviderResult = {
  run: CollectionRun;
  insertedCount: number;
  duplicateCount: number;
};

export async function collectFromProvider(input: {
  provider: CollectorProvider;
  repository: CollectionRepository;
  request: CollectRequest;
}): Promise<CollectFromProviderResult> {
  const run = input.repository.startRun({
    providerCode: input.provider.code,
    startedAt: input.request.requestedAt,
  });

  try {
    const result = await input.provider.collect(input.request);
    let insertedCount = 0;
    let duplicateCount = 0;

    for (const item of result.items) {
      const saved = input.repository.saveSourceRecord(
        createRawRecordInput({
          providerCode: input.provider.code,
          collectionRunId: run.id,
          item,
          collectedAt: result.collectedAt,
        }),
      );
      if (saved.inserted) {
        insertedCount += 1;
      } else {
        duplicateCount += 1;
      }
    }

    const finishedRun = input.repository.finishRun({
      runId: run.id,
      status: "success",
      finishedAt: result.collectedAt,
      collectedCount: insertedCount,
      warningCount: result.warnings.length,
    });

    return { run: finishedRun, insertedCount, duplicateCount };
  } catch (error) {
    const finishedRun = input.repository.finishRun({
      runId: run.id,
      status: "failed",
      finishedAt: new Date(input.request.requestedAt.getTime()),
      collectedCount: 0,
      warningCount: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown collection error",
    });
    return { run: finishedRun, insertedCount: 0, duplicateCount: 0 };
  }
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
cd server
npm test -- collectors.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/collection/collect.ts server/tests/collectors.test.ts
git commit -m "기반: provider 수집 실행 흐름 추가"
```

## Task 5: Source Probe and Schedule Policy

**Files:**
- Create: `server/src/collection/source-probe.ts`
- Create: `server/src/collection/schedule-policy.ts`
- Create: `server/tests/collection-policy.test.ts`

- [ ] **Step 1: Write failing policy tests**

Create `server/tests/collection-policy.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSourceProbe } from "../src/collection/source-probe.js";
import { decideCollectionSchedule } from "../src/collection/schedule-policy.js";

test("source probe pauses providers on blocking status codes", () => {
  assert.deepEqual(
    evaluateSourceProbe({
      providerCode: "tj-official",
      checkedAt: new Date("2026-06-11T00:00:00.000Z"),
      robotsAllowed: true,
      statusCode: 429,
      parserMatched: true,
    }),
    {
      providerCode: "tj-official",
      checkedAt: new Date("2026-06-11T00:00:00.000Z"),
      decision: "pause",
      reason: "HTTP 429 indicates rate limiting or blocking",
    },
  );
});

test("schedule policy chooses mixed for stable low-volume full catalog with active new-song changes", () => {
  assert.equal(
    decideCollectionSchedule({
      sampleDays: 14,
      totalSampledRecords: 1000,
      changedRecords: 5,
      newSongChangesDetected: 2,
      parserFailureCount: 0,
      blockingFailureCount: 0,
    }),
    "mixed",
  );
});

test("schedule policy pauses on blocking failures", () => {
  assert.equal(
    decideCollectionSchedule({
      sampleDays: 14,
      totalSampledRecords: 1000,
      changedRecords: 1,
      newSongChangesDetected: 0,
      parserFailureCount: 0,
      blockingFailureCount: 1,
    }),
    "paused",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server
npm test -- collection-policy.test.ts
```

Expected: FAIL because policy modules do not exist.

- [ ] **Step 3: Implement source probe**

Create `server/src/collection/source-probe.ts`:

```ts
import type { ProviderCode } from "../collectors/provider.js";

export type SourceProbeInput = {
  providerCode: ProviderCode;
  checkedAt: Date;
  robotsAllowed: boolean;
  statusCode: number;
  parserMatched: boolean;
};

export type SourceProbeDecision = {
  providerCode: ProviderCode;
  checkedAt: Date;
  decision: "allow-sample" | "pause";
  reason: string;
};

export function evaluateSourceProbe(input: SourceProbeInput): SourceProbeDecision {
  if (!input.robotsAllowed) {
    return {
      providerCode: input.providerCode,
      checkedAt: input.checkedAt,
      decision: "pause",
      reason: "robots.txt does not allow the target path",
    };
  }
  if (input.statusCode === 403 || input.statusCode === 429) {
    return {
      providerCode: input.providerCode,
      checkedAt: input.checkedAt,
      decision: "pause",
      reason: `HTTP ${input.statusCode} indicates rate limiting or blocking`,
    };
  }
  if (!input.parserMatched) {
    return {
      providerCode: input.providerCode,
      checkedAt: input.checkedAt,
      decision: "pause",
      reason: "Parser did not match required fields",
    };
  }
  return {
    providerCode: input.providerCode,
    checkedAt: input.checkedAt,
    decision: "allow-sample",
    reason: "Source is allowed for limited sample collection",
  };
}
```

- [ ] **Step 4: Implement schedule policy**

Create `server/src/collection/schedule-policy.ts`:

```ts
export type CollectionSchedule = "weekly" | "monthly" | "mixed" | "paused";

export type SampleCollectionMetrics = {
  sampleDays: number;
  totalSampledRecords: number;
  changedRecords: number;
  newSongChangesDetected: number;
  parserFailureCount: number;
  blockingFailureCount: number;
};

export function decideCollectionSchedule(metrics: SampleCollectionMetrics): CollectionSchedule {
  if (metrics.blockingFailureCount > 0 || metrics.parserFailureCount > 0) {
    return "paused";
  }

  const changeRate =
    metrics.totalSampledRecords === 0 ? 0 : metrics.changedRecords / metrics.totalSampledRecords;

  if (metrics.newSongChangesDetected > 0 && changeRate < 0.01) {
    return "mixed";
  }
  if (changeRate >= 0.01 || metrics.newSongChangesDetected >= Math.max(1, Math.floor(metrics.sampleDays / 7))) {
    return "weekly";
  }
  return "monthly";
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
cd server
npm test -- collection-policy.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/collection/source-probe.ts server/src/collection/schedule-policy.ts server/tests/collection-policy.test.ts
git commit -m "정책: 수집 probe와 주기 결정 추가"
```

## Task 6: Validation Scoring

**Files:**
- Create: `server/src/collection/validation.ts`
- Modify: `server/tests/collection-policy.test.ts`

- [ ] **Step 1: Add failing validation tests**

Append to `server/tests/collection-policy.test.ts`:

```ts
import { validateCollectedSong } from "../src/collection/validation.js";

test("validation approves strong official records", () => {
  assert.deepEqual(
    validateCollectedSong({
      providerType: "official-search",
      brand: "TJ",
      title: "Ditto",
      artist: "NewJeans",
      songNumber: "82802",
      officialCrossMatch: true,
      manualOverride: false,
      conflictCount: 0,
    }),
    {
      score: 95,
      action: "promote-candidate",
      reasons: ["official search source", "official cross-match"],
    },
  );
});

test("validation sends personal api conflicts to review", () => {
  assert.deepEqual(
    validateCollectedSong({
      providerType: "personal-api",
      brand: "TJ",
      title: "Ditto",
      artist: "NewJeans",
      songNumber: "82802",
      officialCrossMatch: false,
      manualOverride: false,
      conflictCount: 1,
    }),
    {
      score: 30,
      action: "review",
      reasons: ["personal or open source candidate", "source conflict"],
    },
  );
});

test("validation preserves manual overrides", () => {
  assert.equal(
    validateCollectedSong({
      providerType: "official-search",
      brand: "KY",
      title: "Ditto",
      artist: "NewJeans",
      songNumber: "95763",
      officialCrossMatch: true,
      manualOverride: true,
      conflictCount: 0,
    }).action,
    "manual-review",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server
npm test -- collection-policy.test.ts
```

Expected: FAIL because `validation.ts` does not exist.

- [ ] **Step 3: Implement validation scoring**

Create `server/src/collection/validation.ts`:

```ts
import type { SongBrand } from "../collectors/provider.js";

export type ProviderEvidenceType = "official-search" | "official-new-song" | "personal-api" | "manual";

export type ValidationInput = {
  providerType: ProviderEvidenceType;
  brand: SongBrand;
  title: string;
  artist: string;
  songNumber: string;
  officialCrossMatch: boolean;
  manualOverride: boolean;
  conflictCount: number;
};

export type ValidationAction = "promote-candidate" | "review" | "manual-review";

export type ValidationResult = {
  score: number;
  action: ValidationAction;
  reasons: string[];
};

export function validateCollectedSong(input: ValidationInput): ValidationResult {
  const reasons: string[] = [];
  let score = 0;

  if (input.providerType === "official-search") {
    score += 80;
    reasons.push("official search source");
  } else if (input.providerType === "official-new-song") {
    score += 70;
    reasons.push("official new-song source");
  } else if (input.providerType === "personal-api") {
    score += 40;
    reasons.push("personal or open source candidate");
  } else {
    score += 100;
    reasons.push("manual source");
  }

  if (input.officialCrossMatch) {
    score += 15;
    reasons.push("official cross-match");
  }

  if (!input.title.trim() || !input.artist.trim() || !input.songNumber.trim()) {
    score -= 40;
    reasons.push("missing required field");
  }

  if (input.conflictCount > 0) {
    score -= input.conflictCount * 10;
    reasons.push("source conflict");
  }

  const boundedScore = Math.max(0, Math.min(100, score));

  if (input.manualOverride) {
    return { score: boundedScore, action: "manual-review", reasons };
  }

  return {
    score: boundedScore,
    action: boundedScore >= 80 ? "promote-candidate" : "review",
    reasons,
  };
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
cd server
npm test -- collection-policy.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/collection/validation.ts server/tests/collection-policy.test.ts
git commit -m "정책: 수집 데이터 검증 점수화 추가"
```

## Task 7: Documentation and Full Verification

**Files:**
- Modify: `docs/08-project-management/progress-report.md`
- Create: `docs/reviews/2026-06-11-collection-policy-foundation-review.md`

- [ ] **Step 1: Update progress report**

Append to `docs/08-project-management/progress-report.md`:

```md
## 2026-06-11 - Collection Policy Foundation

### Completed

- Added collector provider interface, mock provider, and provider registry.
- Added raw record hash creation and in-memory deduplication.
- Added collection run orchestration for provider dry runs.
- Added source probe pause rules and collection schedule decision policy.
- Added validation scoring for official, personal API, and manual override cases.

### Verification

- `node tests\sheets.test.js`
- `cd server && npm test`
- `cd server && npm run build`
```

- [ ] **Step 2: Create review document**

Create `docs/reviews/2026-06-11-collection-policy-foundation-review.md`:

```md
# Collection Policy Foundation Review

## Summary

Implemented the first testable collection policy foundation without live scraping. The code covers mock provider collection, provider registry, raw payload hashing, duplicate prevention, run logging, source probe decisions, schedule policy, and validation scoring.

## Verification

- `node tests\sheets.test.js`
- `cd server && npm test`
- `cd server && npm run build`

## Remaining Risks

- Live TJ/KY scraping is not implemented.
- KY official search URL still requires a dedicated probe task before production collection.
- PostgreSQL repository integration is not implemented in this slice.
- Actual schedule policy must be recalibrated after two weeks of sample collection metrics.
```

- [ ] **Step 3: Run full verification**

Run:

```bash
node tests\sheets.test.js
cd server
npm test
npm run build
```

Expected:

- `sheets tests passed`
- Server tests all pass
- TypeScript build exits 0

- [ ] **Step 4: Commit**

```bash
git add docs/08-project-management/progress-report.md docs/reviews/2026-06-11-collection-policy-foundation-review.md
git commit -m "문서: 수집 정책 기반 작업 리뷰 추가"
```

## PR and Promotion Checklist

- [ ] Push `task/collection-source-policy`.
- [ ] Update PR #8 summary if implementation tasks were added to the same branch.
- [ ] Confirm PR mergeability.
- [ ] Merge to `stg` after tests pass.
- [ ] Fetch and verify `origin/stg`.
- [ ] Merge to `main` after stg verification.
- [ ] Fetch and fast-forward local `main`.
- [ ] Confirm `git status --short --branch` is clean.

## Self-Review

- Spec coverage: Covers role-based decisions, source tiering, sample collection, schedule policy, and validation process from the approved design.
- Placeholder scan: The plan has concrete commands, expected results, and code snippets; KY uncertainty is represented as an explicit blocked production condition and separate probe task.
- Type consistency: Provider codes, source item fields, run fields, schedule outputs, and validation actions are defined before use and reused consistently.
