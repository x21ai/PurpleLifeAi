import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  applyFlutterApiCors,
  handleFlutterApiCorsPreflight,
} from "./lib/flutter-api-cors";
import {
  isFlutterAppPath,
  isFlutterStaticAsset,
  isFlutterWebCutoverEnabled,
  isMarketingTanStackPath,
  normalizePathname,
  rewriteFlutterAssetPath,
} from "./lib/flutter-web-routing";
import { setRequestBindings } from "./lib/cloudflare/bindings";
import type { PurpleWorkerBindings } from "./lib/cloudflare/env";

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
// endpoints. Each endpoint validates CRON_SECRET itself.
const CRON_ENDPOINTS: Record<string, string[]> = {
  "* * * * *": ["/api/public/cron/dose-reminders", "/api/public/cron/journal-reprocess"],
  "0 * * * *": ["/api/public/cron/oura-sync-all", "/api/public/cron/whoop-sync-all"],
  "0 6 * * *": [
    "/api/public/cron/care-daily-digest",
    "/api/public/cron/medical-reports",
    "/api/public/cron/purge-deleted-accounts",
  ],
  "0 15 * * 7": ["/api/public/cron/weekly-recap"],
};

// The email queue processor authenticates with the service role (not CRON_SECRET)
// and is invoked directly each minute. It used to be reached through
// /api/public/cron/email-queue-pump, which performed a same-zone plain fetch
// back into this worker; that nested self-subrequest never ran, so auth mail
// (signup, password reset) sat pending until its token expired.
const EMAIL_QUEUE_PROCESSOR = "/api/email/queue/process";
const EMAIL_PUMP_CRON = "* * * * *";
const EMAIL_PUMP_MAX_ITERATIONS = 3;

type AssetsBinding = {
  fetch: (request: Request) => Promise<Response>;
};

type CronEnv = {
  CRON_SECRET?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  PUBLIC_SITE_URL?: string;
  SELF?: { fetch: (request: Request) => Promise<Response> };
};

type WorkerEnv = CronEnv &
  Partial<Pick<PurpleWorkerBindings, "DB" | "STORAGE" | "CACHE" | "DATA_BACKEND" | "AUTH_JWT_SECRET">> & {
  ASSETS?: AssetsBinding;
  /** When "true" or "1", signed-in app paths serve Flutter web SPA from _flutter/index.html. */
  FLUTTER_WEB_CUTOVER?: string;
};

// Prefer the self service binding; a plain fetch to our own hostname is a
// same-zone subrequest back into this worker and is not reliable.
function dispatch(env: CronEnv, request: Request): Promise<Response> {
  return env.SELF ? env.SELF.fetch(request) : fetch(request);
}

async function pumpEmailQueue(base: string, env: CronEnv): Promise<void> {
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) {
    console.error("[cron] SUPABASE_SERVICE_ROLE_KEY not configured; skipping email pump");
    return;
  }
  // Drain in a few passes so a short backlog clears within the minute. The
  // processor reports how many it sent; stop as soon as a pass sends nothing.
  for (let i = 0; i < EMAIL_PUMP_MAX_ITERATIONS; i++) {
    try {
      const res = await dispatch(
        env,
        new Request(`${base}${EMAIL_QUEUE_PROCESSOR}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRole}`,
            "Content-Type": "application/json",
          },
          body: "{}",
        }),
      );
      if (!res.ok) {
        console.error(`[cron] ${EMAIL_QUEUE_PROCESSOR} responded ${res.status}`);
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { processed?: number };
      if (!body.processed || body.processed <= 0) return;
    } catch (error) {
      console.error(`[cron] ${EMAIL_QUEUE_PROCESSOR} failed`, error);
      return;
    }
  }
}

async function runScheduledEndpoints(cron: string, env: CronEnv): Promise<void> {
  const base = env.PUBLIC_SITE_URL || "https://www.purplelife.org";
  const tasks: Promise<void>[] = [];

  const secret = env.CRON_SECRET;
  const paths = CRON_ENDPOINTS[cron] ?? [];
  if (paths.length > 0) {
    if (secret) {
      for (const path of paths) {
        tasks.push(
          (async () => {
            try {
              const res = await dispatch(
                env,
                new Request(`${base}${path}`, {
                  method: "POST",
                  headers: { "x-cron-secret": secret },
                }),
              );
              if (!res.ok) {
                console.error(`[cron] ${path} responded ${res.status}`);
              }
            } catch (error) {
              console.error(`[cron] ${path} failed`, error);
            }
          })(),
        );
      }
    } else {
      console.error("[cron] CRON_SECRET not configured; skipping secret-guarded endpoints");
    }
  }

  // Email delivery is independent of CRON_SECRET so auth mail keeps flowing
  // even if the secret is missing.
  if (cron === EMAIL_PUMP_CRON) {
    tasks.push(pumpEmailQueue(base, env));
  }

  await Promise.all(tasks);
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
async function serveFlutterAsset(
  request: Request,
  env: WorkerEnv,
  pathname: string,
): Promise<Response | null> {
  const assets = env.ASSETS;
  if (!assets) return null;

  const url = new URL(request.url);
  url.pathname = rewriteFlutterAssetPath(pathname);
  const assetRequest = new Request(url.toString(), request);
  const response = await assets.fetch(assetRequest);
  if (response.status === 404) return null;
  return response;
}

async function serveFlutterSpaFallback(
  request: Request,
  env: WorkerEnv,
): Promise<Response | null> {
  const assets = env.ASSETS;
  if (!assets) return null;

  const url = new URL(request.url);
  url.pathname = "/_flutter/index.html";
  const spaRequest = new Request(url.toString(), {
    method: "GET",
    headers: request.headers,
  });
  const response = await assets.fetch(spaRequest);
  if (response.status === 404) return null;
  return response;
}

async function handleTanStackRequest(
  request: Request,
  env: unknown,
  ctx: unknown,
): Promise<Response> {
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
}

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
      setRequestBindings(env);
      const preflight = handleFlutterApiCorsPreflight(request);
      if (preflight) return preflight;

      const workerEnv = (env ?? {}) as WorkerEnv;
      const pathname = normalizePathname(new URL(request.url).pathname);

      // Worker API routes and OAuth token exchange stay on TanStack handlers.
      if (pathname.startsWith("/api/") || pathname.startsWith("/oauth/")) {
        return applyFlutterApiCors(request, await handleTanStackRequest(request, env, ctx));
      }

      if (request.method === "GET") {
        if (isFlutterStaticAsset(pathname)) {
          const asset = await serveFlutterAsset(request, workerEnv, pathname);
          if (asset) return asset;
        }

        if (
          isFlutterWebCutoverEnabled(workerEnv) &&
          isFlutterAppPath(pathname) &&
          !isMarketingTanStackPath(pathname)
        ) {
          const spa = await serveFlutterSpaFallback(request, workerEnv);
          if (spa) return spa;
        }
      }

      // Marketing and legacy TanStack _app/* SSR (default until FLUTTER_WEB_CUTOVER is on).
      return applyFlutterApiCors(request, await handleTanStackRequest(request, env, ctx));
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
