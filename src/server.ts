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
};
