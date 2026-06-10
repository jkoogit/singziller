import cors from "@fastify/cors";
import Fastify from "fastify";
import { mockManifest } from "./catalog/manifest.js";

export function 앱만들기() {
  const 앱 = Fastify({
    logger: true,
  });

  앱.register(cors, {
    origin: true,
  });

  앱.get("/health", async () => ({ ok: true }));
  앱.get("/catalog/manifest", async () => mockManifest());

  return 앱;
}
