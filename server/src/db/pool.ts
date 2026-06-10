import pg from "pg";
import type { 환경설정 } from "../config/env.js";

export function 풀만들기(설정: Pick<환경설정, "databaseUrl">) {
  return new pg.Pool({
    connectionString: 설정.databaseUrl,
  });
}
