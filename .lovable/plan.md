## Plan to fix Oura OAuth

### What I found
- The app is receiving Oura client ID `d0fdde6e-...` from the backend, but your Oura settings screenshot shows client ID `d0fdde6e-1fe2-43b7-868d-779dddb8091b`. The visible screenshot ID and the app-returned ID are close but not identical, so the configured backend secret may be wrong or stale.
- Oura’s current authentication docs list `spo2` as the valid scope, not `spo2Daily`. The app currently sends `spo2Daily`, which can cause Oura’s authorization page to fail before redirecting back.
- The redirect URI must match exactly. Your screenshot includes the published URL `https://purpledrw.lovable.app` but not the published callback `https://purpledrw.lovable.app/oauth/oura/callback`. It also includes the preview callback, which is correct for preview testing.

### Implementation steps
1. Update the frontend Oura scope string to match Oura’s current docs:
   - `email personal daily heartrate workout tag session spo2`
   - Keep `ring_configuration`, `stress`, `heart_health`, and other non-documented OAuth scopes out of the request for now.
2. Improve the Oura authorize diagnostics temporarily so the console prints:
   - client ID prefix/suffix
   - exact redirect URI
   - exact scope string
   - full authorization URL
3. Add safer callback error handling so if Oura redirects back with `error` / `error_description`, the app shows the detailed reason instead of a generic failure.
4. Verify the deployed Oura backend config returns the exact client ID from your screenshot.
   - If it still returns the wrong ID after code changes, the Oura client ID secret must be updated in Lovable Cloud to match the screenshot.
5. Test the preview flow again using this exact redirect URI:
   - `https://id-preview--f43135c6-2e21-4f4c-9c81-6a19bf99587f.lovable.app/oauth/oura/callback`
6. If preview still fails but the authorize URL is correct, publish and test on the published site after adding this exact Oura redirect URI:
   - `https://purpledrw.lovable.app/oauth/oura/callback`

### Technical notes
- No database schema changes are needed.
- I won’t change the OAuth callback path.
- I won’t re-add broad Oura scopes until the base connection works.
- If the backend secret is stale, I’ll ask you to update the Oura client ID/secret securely rather than hardcoding it.