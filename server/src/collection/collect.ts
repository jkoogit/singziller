import type { CollectRequest, CollectorProvider } from "../collectors/provider.js";
import type { CollectionRun, createInMemoryCollectionRepository } from "./in-memory-repository.js";
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
      collectedCount: result.items.length,
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
