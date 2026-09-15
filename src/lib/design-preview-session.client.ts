import { applyCloudflareSessionFromBootstrap } from "@/lib/cloudflare/supabase-shim";
import { getCloudflareSession } from "@/lib/auth/cloudflare-session";
import { isDesignPreviewClient } from "@/lib/design-preview";

let bootstrapPromise: Promise<boolean> | null = null;

/**
 * Ensures a demo session exists on the design staging host (no password).
 * Safe to call on every _app navigation; dedupes concurrent bootstraps.
 */
export async function ensureDesignPreviewSession(): Promise<boolean> {
  if (!isDesignPreviewClient()) return false;
  if (typeof window === "undefined") return false;
  if (getCloudflareSession()?.access_token) return true;
  if (!bootstrapPromise) {
    bootstrapPromise = fetchDesignPreviewSession().finally(() => {
      bootstrapPromise = null;
    });
  }
  return bootstrapPromise;
}

async function fetchDesignPreviewSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/public/design-preview/session", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      user?: { id: string; email?: string | null; email_confirmed_at?: string | null };
    };
    if (!data.access_token || !data.user?.id) return false;
    applyCloudflareSessionFromBootstrap({
      access_token: data.access_token,
      expires_in: data.expires_in ?? 86400,
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
        email_confirmed_at: data.user.email_confirmed_at ?? null,
      },
    });
    return true;
  } catch {
    return false;
  }
}
