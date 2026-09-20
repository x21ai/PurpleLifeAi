import type { StagingEnv } from "./env";
import { handleDesignPreviewSession } from "./design-preview-session";

// Astro SSR handler (built output). Resolved at bundle time by wrangler.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error generated at build time
import astroHandler from "../dist/server/entry.mjs";

const SESSION_PATH = "/api/public/design-preview/session";

export default {
  async fetch(request: Request, env: StagingEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    if (pathname === SESSION_PATH) {
      return handleDesignPreviewSession(env);
    }

    // Same-origin /api/* on staging → prod `purplelife` Worker (shared prod D1/R2 logic).
    if (pathname.startsWith("/api/")) {
      return env.PROD.fetch(request);
    }

    // Astro assets + prerendered pages + SSR fallbacks.
    return astroHandler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<StagingEnv>;
