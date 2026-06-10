import assert from "node:assert/strict";
import test from "node:test";
import { 환경설정읽기 } from "../src/config/env.js";

test("환경설정읽기는 기본 실행 환경을 development로 둔다", () => {
  const 설정 = 환경설정읽기({
    DATABASE_URL: "postgresql://devdbszusr:pw@postgres-dev:5432/singziller_dev",
  });

  assert.equal(설정.appEnv, "development");
  assert.equal(설정.host, "0.0.0.0");
  assert.equal(설정.port, 3000);
  assert.equal(설정.databaseUrl, "postgresql://devdbszusr:pw@postgres-dev:5432/singziller_dev");
});

test("환경설정읽기는 stg/main 환경명을 허용한다", () => {
  assert.equal(
    환경설정읽기({
      APP_ENV: "staging",
      DATABASE_URL: "postgresql://stgdbszusr:pw@postgres-stg:5432/singziller_stg",
    }).appEnv,
    "staging",
  );

  assert.equal(
    환경설정읽기({
      APP_ENV: "production",
      PORT: "8080",
      DATABASE_URL: "postgresql://prddbszusr:pw@postgres-prd:5432/singziller_prd",
    }).port,
    8080,
  );
});

test("환경설정읽기는 DATABASE_URL이 없으면 실패한다", () => {
  assert.throws(() => 환경설정읽기({}), /DATABASE_URL/);
});
