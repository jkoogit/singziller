import assert from "node:assert/strict";
import test from "node:test";
import { createMockProvider } from "../src/collectors/mock-provider.js";
import { createProviderRegistry } from "../src/collectors/registry.js";
import { collectFromProvider } from "../src/collection/collect.js";
import { createInMemoryCollectionRepository } from "../src/collection/in-memory-repository.js";
import { createRawRecordInput, stablePayloadHash } from "../src/collection/raw-record.js";

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

test("collectFromProvider records total collected count even when records are duplicates", async () => {
  const repository = createInMemoryCollectionRepository();
  const request = {
    query: "Ditto",
    limit: 2,
    requestedAt: new Date("2026-06-11T00:00:00.000Z"),
  };

  await collectFromProvider({
    provider: createMockProvider(),
    repository,
    request,
  });
  const second = await collectFromProvider({
    provider: createMockProvider(),
    repository,
    request,
  });

  assert.equal(second.insertedCount, 0);
  assert.equal(second.duplicateCount, 2);
  assert.equal(second.run.collectedCount, 2);
  assert.equal(repository.sourceRecords().length, 2);
});
