import { createMiddleware } from '@tanstack/react-start'
import { isCloudflareClient } from '@/lib/cloudflare/supabase-shim'
import { getCloudflareSession } from '@/lib/auth/cloudflare-session'

async function getBearerToken(): Promise<string | undefined> {
  if (isCloudflareClient()) {
    return getCloudflareSession()?.access_token;
  }
  const { supabase } = await import('./client');
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
export const attachSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    const token = await getBearerToken();
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
)
