## Goal
Get the Oura "Connect" flow working end-to-end and capture enough signal to diagnose the 400 if it fails again.

## Pre-flight (you do this in the Oura developer portal)
1. Open https://cloud.ouraring.com/oauth/applications → your app.
2. Confirm the **Redirect URIs** list contains **exactly**:
   - `https://id-preview--f43135c6-2e21-4f4c-9c81-6a19bf99587f.lovable.app/oauth/oura/callback`
   - (and the published URL's callback once we publish)
   No trailing slash, no typos, scheme must be `https`.
3. Confirm the **Client ID** in the portal matches the value stored as `OURA_CLIENT_ID` secret.

## Plan
1. **Add temporary diagnostics** to `supabase/functions/oura-sync/index.ts` so we log the exact authorize URL it builds (client_id prefix, redirect_uri, scope) before redirecting. This is the single most useful signal — Oura's 400 page does not tell us which parameter it rejected.
2. **Trim the scope** to a known-safe set (`email personal daily heartrate workout tag session spo2Daily sleep`) and drop `ring_configuration`, which is the most common cause of a hard 400 on apps that weren't explicitly approved for it. If the connect succeeds, we'll add `ring_configuration` back behind a feature check.
3. **Trigger the flow** in the preview: open Settings → Connect Oura. I'll watch:
   - `supabase--edge_function_logs` for the built authorize URL.
   - browser network for the redirect target Oura returns.
4. **If still 400:** the logs will show whether it's `redirect_uri_mismatch`, `invalid_scope`, or `invalid_client`, and we fix that specific field. If everything looks right in the logs but Oura still 400s, the most likely remaining cause is the preview-environment limitation — we'd then publish the project and re-test on the published URL (per known platform behavior: preview and published can have different OAuth configs).
5. **On success:** remove the diagnostic logging, confirm `oura_sync` row + token are stored, and you're done.

## Technical notes
- Only `supabase/functions/oura-sync/index.ts` changes; no schema, no client changes.
- Diagnostic logs are stripped before we call it done.
- No new secrets needed — `OURA_CLIENT_ID` and `OURA_CLIENT_SECRET` are already set.

Approve and I'll switch to build mode and add the diagnostics + scope fix.