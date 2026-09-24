import type { WwwEnv } from "./www-env";

// Ploy Astro SSR + static assets (built output). Resolved at bundle time by wrangler.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error generated at build time
import astroHandler from "../dist/server/entry.mjs";

// TanStack Start server bundle (API, OAuth, crons). Built by `bun run build:prod`.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error generated at build time
import tanstackModule from "../../dist/server/server.js";

type WorkerHandler = ExportedHandler<WwwEnv>;

const tanstackWorker = (tanstackModule as { default?: WorkerHandler }).default ?? tanstackModule;

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

function isTanStackRoute(pathname: string): boolean {
  return pathname.startsWith("/api/") || pathname.startsWith("/oauth/");
}

export default {
  async fetch(request: Request, env: WwwEnv, ctx: ExecutionContext): Promise<Response> {
    const pathname = normalizePathname(new URL(request.url).pathname);

    if (isTanStackRoute(pathname)) {
      return tanstackWorker.fetch!(request, env, ctx);
    }

    return astroHandler.fetch(request, env, ctx);
  },

  async scheduled(controller: ScheduledController, env: WwwEnv, ctx: ExecutionContext) {
    if (typeof tanstackWorker.scheduled === "function") {
      return tanstackWorker.scheduled(controller, env, ctx);
    }
  },
} satisfies WorkerHandler;
