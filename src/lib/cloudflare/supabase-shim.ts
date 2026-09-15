/**
 * Supabase-compatible client surface backed by D1 + R2 + Workers JWT.
 * Used when DATA_BACKEND=cloudflare (client and server).
 */
import { getDataBackend } from "./data-backend";
import { d1From } from "./d1/query-builder";
import { apiFrom } from "./d1/api-query-builder";
import { invokePurpleEdgeFunction } from "./invoke-edge";
import {
  clearCloudflareSession,
  getCloudflareSession,
  setCloudflareSession,
  type CloudflareSession,
} from "@/lib/auth/cloudflare-session";

export function isCloudflareClient(): boolean {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_DATA_BACKEND) {
    return getDataBackend({ DATA_BACKEND: import.meta.env.VITE_DATA_BACKEND as string }) === "cloudflare";
  }
  if (typeof process !== "undefined" && process.env?.DATA_BACKEND) {
    return getDataBackend(process.env) === "cloudflare";
  }
  return getDataBackend() === "cloudflare";
}

type AuthListener = (event: string, session: CloudflareSession | null) => void;

const authListeners = new Set<AuthListener>();

function notifyAuth(event: string, session: CloudflareSession | null) {
  for (const fn of authListeners) fn(event, session);
}

/** Used by design staging to establish a session without a password. */
export function applyCloudflareSessionFromBootstrap(session: CloudflareSession): void {
  setCloudflareSession(session);
  notifyAuth("SIGNED_IN", session);
}

async function apiAuth(path: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return { data: null, error: { message: (data.error as string) ?? res.statusText } };
  }
  return { data, error: null };
}

function toSupabaseSession(cf: CloudflareSession) {
  return {
    access_token: cf.access_token,
    refresh_token: cf.refresh_token ?? "",
    expires_in: cf.expires_in ?? 3600,
    token_type: "bearer",
    user: {
      id: cf.user.id,
      email: cf.user.email ?? undefined,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    },
  };
}

export function createCloudflareSupabaseShim(userId?: string) {
  const scopedUserId = userId;

  return {
    auth: {
      async getSession() {
        const cf = getCloudflareSession();
        if (!cf) return { data: { session: null }, error: null };
        return { data: { session: toSupabaseSession(cf) }, error: null };
      },
      async getUser() {
        const cf = getCloudflareSession();
        if (!cf) return { data: { user: null }, error: { message: "Not signed in" } };
        return {
          data: { user: toSupabaseSession(cf).user },
          error: null,
        };
      },
      async getClaims(token: string) {
        const res = await fetch("/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return { data: null, error: { message: "Invalid token" } };
        const body = (await res.json()) as { claims?: Record<string, unknown> };
        return { data: { claims: body.claims }, error: null };
      },
      onAuthStateChange(cb: AuthListener) {
        authListeners.add(cb);
        return {
          data: {
            subscription: {
              unsubscribe: () => authListeners.delete(cb),
            },
          },
        };
      },
      async signInWithPassword(opts: { email: string; password: string }) {
        const { data, error } = await apiAuth("sign-in", opts);
        if (error) return { data: { session: null, user: null }, error };
        const cf: CloudflareSession = {
          access_token: data.access_token as string,
          expires_in: (data.expires_in as number) ?? 3600,
          user: data.user as CloudflareSession["user"],
        };
        setCloudflareSession(cf);
        notifyAuth("SIGNED_IN", cf);
        return { data: { session: toSupabaseSession(cf), user: toSupabaseSession(cf).user }, error: null };
      },
      async signUp(opts: { email: string; password: string; options?: { emailRedirectTo?: string } }) {
        const { data, error } = await apiAuth("sign-up", {
          email: opts.email,
          password: opts.password,
        });
        if (error) return { data: { session: null, user: null }, error };
        const cf: CloudflareSession = {
          access_token: data.access_token as string,
          expires_in: (data.expires_in as number) ?? 3600,
          user: data.user as CloudflareSession["user"],
        };
        setCloudflareSession(cf);
        notifyAuth("SIGNED_IN", cf);
        return { data: { session: toSupabaseSession(cf), user: toSupabaseSession(cf).user }, error: null };
      },
      async signOut() {
        clearCloudflareSession();
        notifyAuth("SIGNED_OUT", null);
        return { error: null };
      },
      async resetPasswordForEmail(email: string, opts?: { redirectTo?: string }) {
        const { error } = await apiAuth("reset-request", {
          email,
          redirectTo: opts?.redirectTo,
        });
        return { data: {}, error };
      },
      async updateUser(_opts: { password?: string }) {
        const cf = getCloudflareSession();
        if (!cf?.access_token) return { data: { user: null }, error: { message: "Not signed in" } };
        const { data, error } = await apiAuth("update-password", {
          password: _opts.password,
        });
        if (error) return { data: { user: null }, error };
        return { data: { user: data.user }, error: null };
      },
      async signInWithOAuth(opts: { provider: string; options?: { redirectTo?: string } }) {
        if (
          typeof import.meta !== "undefined" &&
          import.meta.env?.VITE_DESIGN_PREVIEW === "1"
        ) {
          return {
            data: { provider: opts.provider, url: null },
            error: { message: "OAuth is disabled on the design staging host." },
          };
        }
        const redirectTo = opts.options?.redirectTo ?? (typeof window !== "undefined" ? window.location.origin : "");
        window.location.href = `/api/auth/oauth/${opts.provider}?redirect_to=${encodeURIComponent(redirectTo)}`;
        return { data: { provider: opts.provider, url: null }, error: null };
      },
      mfa: {
        async getAuthenticatorAssuranceLevel() {
          return { data: { currentLevel: "aal1", nextLevel: "aal1" }, error: null };
        },
        async listFactors() {
          return { data: { totp: [] }, error: null };
        },
      },
    },
    from(table: string) {
      if (typeof window === "undefined") {
        return d1From(table, scopedUserId);
      }
      return apiFrom(table);
    },
    rpc(fn: string, args: Record<string, unknown>) {
      const token = getCloudflareSession()?.access_token ?? "";
      return fetch("/api/data/rpc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fn, args }),
      }).then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return { data: null, error: { message: body.error ?? res.statusText } };
        return { data: body.data ?? body, error: null };
      });
    },
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, file: File | Blob | ArrayBuffer, opts?: { contentType?: string; upsert?: boolean }) {
            const session = getCloudflareSession();
            if (!session) return { data: null, error: { message: "Not signed in" } };
            const fd = new FormData();
            fd.append("bucket", bucket);
            fd.append("path", path);
            fd.append("file", file instanceof Blob ? file : new Blob([file]), path.split("/").pop() ?? "file");
            if (opts?.contentType) fd.append("contentType", opts.contentType);
            const res = await fetch("/api/storage/upload", {
              method: "POST",
              headers: { Authorization: `Bearer ${session.access_token}` },
              body: fd,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return { data: null, error: { message: data.error ?? res.statusText } };
            return { data: { path: data.path }, error: null };
          },
          async createSignedUrls(paths: string[], _expiresIn: number) {
            const session = getCloudflareSession();
            if (!session) return { data: null, error: { message: "Not signed in" } };
            const token = encodeURIComponent(session.access_token);
            const urls = paths.map((p) => ({
              path: p,
              signedUrl: `/api/storage/object?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(p.replace(/^\/+/, ""))}&token=${token}`,
            }));
            return { data: urls, error: null };
          },
          async remove(_paths: string[]) {
            return { data: [], error: null };
          },
        };
      },
    },
    functions: {
      invoke(name: string, opts?: { body?: Record<string, unknown> }) {
        const session = getCloudflareSession();
        return invokePurpleEdgeFunction(name, {
          body: opts?.body,
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        }).then(({ data, error }) => ({
          data,
          error: error ? { message: error.message } : null,
        }));
      },
    },
    channel(_name: string) {
      const handlers: Array<(payload: unknown) => void> = [];
      return {
        on(_event: string, _filter: unknown, cb: (payload: unknown) => void) {
          handlers.push(cb);
          return this;
        },
        subscribe() {
          return this;
        },
      };
    },
    removeChannel() {
      return Promise.resolve({ error: null });
    },
  };
}
