import type pg from "pg";

export async function DB상태확인(pool: pg.Pool): Promise<boolean> {
  const 결과 = await pool.query<{ ok: number }>("select 1 as ok");
  return 결과.rows[0]?.ok === 1;
}
