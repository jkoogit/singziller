import assert from "node:assert/strict";
import test from "node:test";
import { 앱만들기 } from "../src/app.js";

test("GET /catalog/manifest returns the initial catalog manifest", async () => {
  const 앱 = 앱만들기();

  const 응답 = await 앱.inject({
    method: "GET",
    url: "/catalog/manifest",
  });

  assert.equal(응답.statusCode, 200);
  assert.deepEqual(JSON.parse(응답.body), {
    latestVersion: "2026.06.10.001",
    scopes: [
      {
        scope: "popular",
        version: "2026.06.10.001",
        format: "json",
        recordCount: 0,
        checksum: "sha256:mock",
        downloadUrl: "/catalog/snapshots/2026.06.10.001/popular.json",
      },
    ],
  });

  await 앱.close();
});
