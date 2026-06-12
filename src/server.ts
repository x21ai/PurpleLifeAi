import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

// Marketing pages render identically for every visitor (auth state lives in
// localStorage, so SSR output never varies by user). Cache their HTML at the
// edge for a short window to cut TTFB. Kept short so freshly deployed HTML
// (which references new hashed asset URLs) propagates quickly.
const CACHEABLE_MARKETING_PATHS = new Set([
  "/",
  "/about",
  "/features",
  "/pricing",
  "/charter",
  "/contact",
  "/privacy",
  "/terms",
  "/how-purple-thinks",
]);
const MARKETING_CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

function isCacheableMarketingRequest(request: Request): boolean {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  return CACHEABLE_MARKETING_PATHS.has(url.pathname.replace(/\/+$/, "") || "/");
}

function getEdgeCache(): Cache | null {
  if (typeof caches === "undefined") return null;
  return (caches as unknown as { default?: Cache }).default ?? null;
}

// Cloudflare Cron Triggers (wrangler.deploy.jsonc) fan out to the app's cron
// endpoints. Each endpoint validates CRON_SECRET itself. The email queue pump
// stays on Supabase pg_cron (5s interval, sub-minute latency for auth emails).
const CRON_ENDPOINTS: Record<string, string[]> = {
  "* * * * *": ["/api/public/cron/dose-reminders"],
  "0 * * * *": [
    "/api/public/cron/oura-sync-all",
    "/api/public/cron/whoop-sync-all",
    "/api/public/cron/seed-doses",
  ],
  "0 6 * * *": [
    "/api/public/cron/care-daily-digest",
    "/api/public/cron/medical-reports",
    "/api/public/cron/purge-deleted-accounts",
  ],
  "0 15 * * 0": ["/api/public/cron/weekly-recap"],
};

type CronEnv = {
  CRON_SECRET?: string;
  PUBLIC_SITE_URL?: string;
  SELF?: { fetch: (request: Request) => Promise<Response> };
};

async function runScheduledEndpoints(cron: string, env: CronEnv): Promise<void> {
  const secret = env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET not configured; skipping scheduled run");
    return;
  }
  const base = env.PUBLIC_SITE_URL || "https://www.purplelife.org";
  const paths = CRON_ENDPOINTS[cron] ?? [];
  await Promise.all(
    paths.map(async (path) => {
      const request = new Request(`${base}${path}`, {
        method: "POST",
        headers: { "x-cron-secret": secret },
      });
      try {
        // Prefer the self service binding; a plain fetch to our own hostname
        // would be a same-zone subrequest back into this worker.
        const res = env.SELF ? await env.SELF.fetch(request) : await fetch(request);
        if (!res.ok) {
          console.error(`[cron] ${path} responded ${res.status}`);
        }
      } catch (error) {
        console.error(`[cron] ${path} failed`, error);
      }
    }),
  );
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"}, try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const cacheable = isCacheableMarketingRequest(request);
      const edgeCache = cacheable ? getEdgeCache() : null;

      if (edgeCache) {
        const hit = await edgeCache.match(request).catch(() => null);
        if (hit) return hit;
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);

      if (
        cacheable &&
        normalized.status === 200 &&
        (normalized.headers.get("content-type") ?? "").includes("text/html") &&
        !normalized.headers.has("set-cookie")
      ) {
        const cachedResponse = new Response(normalized.body, normalized);
        cachedResponse.headers.set("cache-control", MARKETING_CACHE_CONTROL);
        if (edgeCache) {
          const waitUntil = (ctx as { waitUntil?: (p: Promise<unknown>) => void })?.waitUntil;
          const put = edgeCache.put(request, cachedResponse.clone()).catch(() => undefined);
          if (typeof waitUntil === "function") waitUntil.call(ctx, put);
        }
        return cachedResponse;
      }

      return normalized;
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },

  async scheduled(controller: { cron: string }, env: unknown, ctx: unknown) {
    const run = runScheduledEndpoints(controller.cron, (env ?? {}) as CronEnv);
    const waitUntil = (ctx as { waitUntil?: (p: Promise<unknown>) => void })?.waitUntil;
    if (typeof waitUntil === "function") {
      waitUntil.call(ctx, run);
    } else {
      await run;
    }
  },
};
