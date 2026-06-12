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
