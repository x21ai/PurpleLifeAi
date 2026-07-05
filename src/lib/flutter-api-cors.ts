/**
 * CORS for Flutter web preview and other non-TanStack clients calling Worker
 * JSON routes cross-origin (e.g. http://127.0.0.1:8765 → www.purplelife.org).
 */

const FLUTTER_WEB_ORIGINS = new Set([
  "http://127.0.0.1:8765",
  "http://localhost:8765",
]);

/** Worker routes Flutter calls from a different origin than the site host. */
const FLUTTER_CORS_PATHS = new Set([
  "/api/health/whoop-config",
  "/api/health/whoop-exchange",
  "/api/health/whoop-sync",
]);

function isFlutterCorsPath(pathname: string): boolean {
  return FLUTTER_CORS_PATHS.has(pathname.replace(/\/+$/, "") || "/");
}

function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  if (FLUTTER_WEB_ORIGINS.has(origin)) return origin;
  const site = process.env.PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (site && origin === site) return origin;
  return null;
}

function corsHeaders(request: Request): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
  });
  const origin = allowedOrigin(request.headers.get("Origin"));
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return headers;
}

/** Short-circuit OPTIONS before TanStack SSR (which would return HTML). */
export function handleFlutterApiCorsPreflight(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  const url = new URL(request.url);
  if (!isFlutterCorsPath(url.pathname)) return null;
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function applyFlutterApiCors(request: Request, response: Response): Response {
  const url = new URL(request.url);
  if (!isFlutterCorsPath(url.pathname)) return response;

  const origin = allowedOrigin(request.headers.get("Origin"));
  if (!origin) return response;

  const next = new Response(response.body, response);
  for (const [key, value] of corsHeaders(request).entries()) {
    next.headers.set(key, value);
  }
  return next;
}
