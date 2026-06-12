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
