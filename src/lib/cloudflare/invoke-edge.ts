/**
 * Client-side edge function invoke that routes to Supabase or in-Worker handlers.
 */
import { getDataBackend } from "./data-backend";

type InvokeOptions = {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
};

export async function invokePurpleEdgeFunction(
  name: string,
  options: InvokeOptions = {},
): Promise<{ data: unknown; error: Error | null }> {
  const backend =
    typeof window !== "undefined"
      ? (import.meta.env.VITE_DATA_BACKEND as string | undefined)
      : process.env.DATA_BACKEND;

  if (getDataBackend({ DATA_BACKEND: backend }) === "cloudflare") {
    const res = await fetch("/api/cloudflare/edge/invoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify({ name, ...(options.body ?? {}) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: new Error((data as { error?: string }).error ?? res.statusText) };
    }
    return { data, error: null };
  }

  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase.functions.invoke(name, { body: options.body });
  return { data, error: error ? new Error(error.message) : null };
}
