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
