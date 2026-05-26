## Why the error happens

`src/components/auth/social-sign-in-buttons.tsx` calls `supabase.auth.signInWithOAuth({ provider: "google" })` directly. That endpoint expects a Google Client ID + Secret to be configured in the backend Auth settings. None is set, so the backend returns `validation_failed: Unsupported provider: missing OAuth secret`. The same applies to Apple.

This is not the Lovable managed integration. The managed one lives at `lovable.auth.signInWithOAuth(...)` and routes through Lovable's broker — no credentials required.

## Plan

1. Run `supabase--configure_social_auth` with `providers: ["google", "apple"]`. This:
   - enables Google + Apple in the backend
   - generates / refreshes `src/integrations/lovable/` and installs `@lovable.dev/cloud-auth-js`

2. Rewrite `src/components/auth/social-sign-in-buttons.tsx` to call the managed broker:
   ```ts
   import { lovable } from "@/integrations/lovable";
   const result = await lovable.auth.signInWithOAuth(provider, {
     redirect_uri: window.location.origin,
   });
   if (result.error) { toast.error(...); return; }
   if (result.redirected) return;  // browser navigates away
   // tokens already in session — navigate home
   ```
   Keep the existing Apple + Google buttons, labels, and styling exactly as they are. Just swap the underlying call.

3. Keep `src/lib/auth-oauth.ts` (`isOAuthCallbackUrl`, `waitForOAuthSession`) and the `beforeLoad` handler in `src/routes/sign-in.tsx` — the managed broker returns to the same redirect URL and Supabase still parses the session, so this code continues to work.

4. Smoke test on the published URL (`purpledrw.lovable.app`):
   - Click **Continue with Google** → redirects to Google → returns signed in
   - Click **Continue with Apple** → redirects to Apple → returns signed in

## Notes

- No Google Cloud Console or Apple Developer setup needed.
- The old docs at `docs/oauth-provider-setup.md` (BYO credentials path) become optional — only needed if you later want your own branding on the consent screen. I'll leave that file untouched.
- No database changes.
