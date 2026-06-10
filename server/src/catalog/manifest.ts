export type CatalogScopeManifest = {
  scope: string;
  version: string;
  format: "json";
  recordCount: number;
  checksum: string;
  downloadUrl: string;
};

export type CatalogManifest = {
  latestVersion: string;
  scopes: CatalogScopeManifest[];
};

export function mockManifest(): CatalogManifest {
  const version = "2026.06.10.001";

  return {
    latestVersion: version,
    scopes: [
      {
        scope: "popular",
        version,
        format: "json",
        recordCount: 0,
        checksum: "sha256:mock",
        downloadUrl: `/catalog/snapshots/${version}/popular.json`,
      },
    ],
  };
}
