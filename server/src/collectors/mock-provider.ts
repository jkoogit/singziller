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
        ? mockItems.filter((item) =>
            `${item.title} ${item.artist} ${item.songNumber}`.toLocaleLowerCase("ko-KR").includes(query),
          )
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
