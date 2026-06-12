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
