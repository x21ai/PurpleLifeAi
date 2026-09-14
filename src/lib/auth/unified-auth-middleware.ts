/**
 * Unified auth middleware: Supabase JWT (default) or Workers JWT (cloudflare backend).
 * Use in new server functions; existing code can migrate incrementally.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getDataBackend } from "@/lib/cloudflare/data-backend";
import { getBindings } from "@/lib/cloudflare/bindings";
import { verifyJwt } from "@/lib/cloudflare/auth/jwt";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AuthContext = {
  userId: string;
  email?: string;
  /** Supabase client with user JWT (supabase backend only) */
  supabase?: ReturnType<typeof createClient<Database>>;
  claims?: Record<string, unknown>;
  backend: "supabase" | "cloudflare";
};

type MiddlewareContext = {
  userId: string;
  email?: string;
  supabase?: ReturnType<typeof createClient<Database>>;
  claims?: Record<string, unknown>;
  backend: "supabase" | "cloudflare";
};

export const requireAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Unauthorized: Bearer token required");
    }
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) throw new Error("Unauthorized: Empty token");

    const backend = getDataBackend(getBindings());

    if (backend === "cloudflare") {
      const secret = getBindings().AUTH_JWT_SECRET;
      if (!secret) throw new Error("AUTH_JWT_SECRET not configured");
      const claims = await verifyJwt(secret, token);
      if (!claims) throw new Error("Unauthorized: Invalid token");
      const ctx: MiddlewareContext = {
        userId: claims.sub,
        email: claims.email,
        claims: claims as unknown as Record<string, unknown>,
        backend: "cloudflare",
      };
      return next({ context: ctx });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) {
      throw new Error("Unauthorized: Invalid token");
    }

    const ctx: MiddlewareContext = {
      supabase,
      userId: data.claims.sub,
      email: typeof data.claims.email === "string" ? data.claims.email : undefined,
      claims: data.claims as Record<string, unknown>,
      backend: "supabase",
    };
    return next({ context: ctx });
  },
);
