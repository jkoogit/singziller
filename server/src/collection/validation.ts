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
