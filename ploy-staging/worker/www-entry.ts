import type { WwwEnv } from "./www-env";
import { getWwwRouteTarget } from "./www-routing";

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

export default {
  async fetch(request: Request, env: WwwEnv, ctx: ExecutionContext): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    const target = getWwwRouteTarget(pathname);

    if (target === "assets") {
      return env.ASSETS.fetch(request);
    }

    if (target === "tanstack") {
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
