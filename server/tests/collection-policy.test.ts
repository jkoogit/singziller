import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSourceProbe } from "../src/collection/source-probe.js";
import { decideCollectionSchedule } from "../src/collection/schedule-policy.js";
import { validateCollectedSong } from "../src/collection/validation.js";

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

test("schedule policy chooses weekly on one percent or higher sampled changes", () => {
  assert.equal(
    decideCollectionSchedule({
      sampleDays: 14,
      totalSampledRecords: 1000,
      changedRecords: 10,
      newSongChangesDetected: 0,
      parserFailureCount: 0,
      blockingFailureCount: 0,
    }),
    "weekly",
  );
});

test("schedule policy chooses monthly when samples are stable and no new songs changed", () => {
  assert.equal(
    decideCollectionSchedule({
      sampleDays: 14,
      totalSampledRecords: 1000,
      changedRecords: 1,
      newSongChangesDetected: 0,
      parserFailureCount: 0,
      blockingFailureCount: 0,
    }),
    "monthly",
  );
});

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
