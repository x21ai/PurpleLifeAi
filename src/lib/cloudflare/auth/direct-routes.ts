/**
 * Worker routes that must run before the TanStack page router:
 * refresh, care-chat poll, and Apple's form_post OAuth callback.
 */
import { verifyJwt } from "./jwt";
import { rotateRefreshToken } from "./sessions";
import { exchangeAppleCode } from "./apple-exchange";
import { nativeOAuthHandoffUrl } from "@/lib/auth/native-oauth-handoff";
import { listCareMessagesSince } from "../realtime/care-live";
import { getBindings } from "../bindings";
import { isCloudflareBackend } from "../data-backend";

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export async function handleWorkerDirect(
  request: Request,
  pathname: string,
): Promise<Response | null> {
  if (pathname === "/api/auth/refresh" && request.method === "POST") {
    return handleRefresh(request);
  }
  if (pathname === "/api/realtime/care-messages" && request.method === "POST") {
    return handleCarePoll(request);
  }
  if (pathname === "/oauth/apple/callback" && request.method === "POST") {
    return handleAppleFormPost(request);
  }
  return null;
}

async function handleRefresh(request: Request): Promise<Response> {
  if (!isCloudflareBackend(getBindings())) {
    return json({ error: "Use Supabase auth" }, 400);
  }
  let body: { refresh_token?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!body.refresh_token) return json({ error: "refresh_token required" }, 400);
  const session = await rotateRefreshToken(body.refresh_token);
  if (!session) return json({ error: "Invalid refresh token" }, 401);
  return json(session);
}

async function handleCarePoll(request: Request): Promise<Response> {
  if (!isCloudflareBackend(getBindings())) {
    return json({ error: "Use Supabase realtime" }, 400);
  }
  const secret = getBindings().AUTH_JWT_SECRET ?? process.env.AUTH_JWT_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!secret || !token) return json({ error: "Unauthorized" }, 401);
  const claims = await verifyJwt(secret, token);
  if (!claims?.sub) return json({ error: "Unauthorized" }, 401);

  let body: { threadId?: string; since?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const result = await listCareMessagesSince({
    userId: claims.sub,
    threadId: body.threadId ?? "",
    since: body.since,
  });
  if ("error" in result && "status" in result) {
    return json({ error: result.error }, result.status);
  }
  return json({ messages: result });
}

async function handleAppleFormPost(request: Request): Promise<Response> {
  if (!isCloudflareBackend(getBindings())) {
    return json({ error: "Use Supabase OAuth" }, 400);
  }
  const origin = new URL(request.url).origin;
  const fail = `${origin}/sign-in?error=oauth_failed`;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.redirect(fail, 302);
  }
  const code = String(form.get("code") ?? "");
  const state = String(form.get("state") ?? "/today");
  const user = form.get("user");
  if (!code) return Response.redirect(fail, 302);

  const result = await exchangeAppleCode({
    code,
    redirectUri: `${origin}/oauth/apple/callback`,
    user: typeof user === "string" ? user : null,
  });
  if ("error" in result) return Response.redirect(fail, 302);

  const native = nativeOAuthHandoffUrl(state, result);
  if (native) return Response.redirect(native, 302);

  let next = "/today";
  try {
    const decoded = decodeURIComponent(state);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) next = decoded;
  } catch {
    next = "/today";
  }
  const hash = new URLSearchParams({
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    expires_in: String(result.expires_in),
    user_id: result.user.id,
    email: result.user.email ?? "",
    next,
  });
  return Response.redirect(`${origin}/oauth/apple/callback#${hash.toString()}`, 302);
}
