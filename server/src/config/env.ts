export type AppEnv = "development" | "staging" | "production";

export type 환경설정 = {
  appEnv: AppEnv;
  host: string;
  port: number;
  databaseUrl: string;
};

type EnvSource = Record<string, string | undefined>;

const 허용환경 = new Set<AppEnv>(["development", "staging", "production"]);

export function 환경설정읽기(env: EnvSource = process.env): 환경설정 {
  const appEnv = env.APP_ENV || "development";
  if (!허용환경.has(appEnv as AppEnv)) {
    throw new Error(`APP_ENV must be development, staging, or production: ${appEnv}`);
  }

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const port = Number(env.PORT || "3000");
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT must be a positive integer: ${env.PORT}`);
  }

  return {
    appEnv: appEnv as AppEnv,
    host: env.HOST || "0.0.0.0",
    port,
    databaseUrl: env.DATABASE_URL,
  };
}
