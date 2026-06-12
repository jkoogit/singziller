import { createMockProvider } from "./mock-provider.js";
import type { CollectRequest, CollectResult, CollectorProvider, ProviderCode } from "./provider.js";

function createStubProvider(code: ProviderCode, displayName: string, trustLevel: number): CollectorProvider {
  return {
    code,
    displayName,
    trustLevel,
    async collect(request: CollectRequest): Promise<CollectResult> {
      return {
        providerCode: code,
        collectedAt: request.requestedAt,
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
