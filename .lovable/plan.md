## 1. Dashboard flashes before redirect to /sign-in

**Cause:** `src/routes/_app.tsx` `beforeLoad` short-circuits during SSR (`if (typeof window === "undefined") return;`), so the server pre-renders `AppShell` and the Today page HTML. On the client, the session check then runs and redirects to `/sign-in` — producing the visible flash of the dashboard.

**Fix:** Gate `AppShell` rendering on a client-side `useAuthReady` check. Render nothing (or a minimal full-screen skeleton matching the bg color) until `supabase.auth.getSession()` resolves. If no session, the existing `beforeLoad` redirect fires; if session exists, render `<AppShell />`. Also stop relying on `localStorage` as the auth gate (keep it only for the onboarding hint).

## 2. Oura integration broken — `400 invalid_request` from cloud.ouraring.com

**Cause:** The authorize URL is built client-side using `OURA_CLIENT_ID` fetched from the edge function. `400 invalid_request` from Oura at the `/oauth/authorize` step almost always means the `client_id` is empty/wrong or the `redirect_uri` is not whitelisted on the Oura app. Custom domain `purple.x21.com/oauth/oura/callback` is most likely not in the Oura app's allowed redirect URIs.

**Fix:**
- Add diagnostic surfacing: if `cfg.client_id` is missing, show a clear "Oura not configured" toast instead of opening a broken popup.
- Document the required Oura developer-portal config: add `https://purple.x21.com/oauth/oura/callback`, `https://purpledrw.lovable.app/oauth/oura/callback`, and the preview URL to the Oura app's allowed redirect URIs. (User action — we cannot do this for them.)
- Verify the `OURA_CLIENT_ID` / `OURA_CLIENT_SECRET` secrets are set on the edge function; if missing, prompt the user via `add_secret`.

## 3. Medication name dictionary — add Keppra XR variants

Expand `src/lib/med-dictionary.ts` with the brand/formulation variants DRW actually uses:
- "Levetiracetam Extended Release (Keppra XR)" — aliases: keppra xr, keppra extended release, levetiracetam er, levetiracetam xr
- Plus other common AED ER forms (Lamictal XR, Trileptal XR, Depakote ER, Tegretol XR, Oxtellar XR) so search picks them up immediately.

## 4. Per-time dosage amounts (e.g. 500 mg @ 10:00, 750 mg @ 19:00)

**Schema change:** `medications.times_of_day` is currently `text[]` (just "HH:MM" strings). Replace with a richer per-time structure while keeping back-compat.

```text
ALTER TABLE medications ADD COLUMN schedule jsonb DEFAULT '[]'::jsonb;
-- schedule = [{ "time": "10:00", "amount": 500, "unit": "mg" }, ...]
```

Backfill `schedule` from existing `times_of_day` + `dosage_amount`/`dosage_unit` so nothing breaks. Keep `times_of_day` populated (derived from `schedule[].time`) so existing reads and the dose-scheduler keep working.

**Form change (`medication-form-sheet.tsx`):** Replace the single "Amount + Unit + times[]" UI with a repeatable row: `[time picker] [amount] [unit dropdown] [remove]` + "Add another dose time". Default unit carries over from the first row. Validate each row.

**Dose generation (`scheduleMedications` / today-doses):** When creating `medication_doses` for today, write the per-time amount into the dose row so the Today screen shows "750 mg" at 7pm vs "500 mg" at 10am.
- Add `medication_doses.amount numeric` and `medication_doses.unit text` columns; populate from `schedule[i]` when generating.
- Today screen renders per-dose amount when present, falls back to medication-level dosage string.

## 5. Phone with country code, persisted across visits on /welcome

**Cause:** `welcome.tsx` uses a plain `<Input type="tel">`. No country code UI, and on re-entry the field re-shows because we only check `first_name` to mark onboarded — DRW gets re-prompted because the form value isn't being read back consistently.

**Fix:**
- Add a lightweight intl phone input: a country-code `<Select>` (with ~20 common countries + flag emoji + dial code, default US `+1` based on locale) next to the number input. Store the full E.164 string (`+15551234567`) in `profiles.emergency_contact_phone`.
- On load, parse stored value back into `{ country, national }` so the field repopulates correctly.
- Also fix the onboarding gate in `src/routes/_app.tsx` to honor `onboarded_at` reliably and not re-trigger /welcome on every device by syncing `localStorage` only after a successful DB write (already partially done — verify).

## Files touched

- `src/routes/_app.tsx` — auth-ready gate, remove SSR render of authed shell
- `src/components/layout/app-shell.tsx` — render skeleton until ready (small)
- `src/components/connections/oura-connection.tsx` — better error surfacing when client_id missing
- `docs/oauth-provider-setup.md` — add Oura redirect URI checklist
- `src/lib/med-dictionary.ts` — add Keppra XR + other AED ER variants
- `src/components/meds/medication-form-sheet.tsx` — per-time schedule rows
- `src/components/meds/today-doses.tsx` — render per-dose amount
- `src/lib/med-notifications.ts` — schedule per-time payloads
- `src/routes/_app/welcome.tsx` — country-code phone input + parse on load
- New components: `src/components/ui/phone-input.tsx`
- DB migration: add `medications.schedule jsonb`, `medication_doses.amount`, `medication_doses.unit`; backfill from existing data

## Test on /meds and /welcome (mobile 743px viewport per current preview)

- Reload site signed-out → goes straight to /sign-in, no dashboard flash.
- Click "Connect Oura" with no `OURA_CLIENT_ID` → see clear error toast (not Oura's 400 page).
- Type "Keppra XR" → autocomplete matches.
- Edit a med → add two rows (500mg 10:00, 750mg 19:00) → save → Today shows both with correct amounts.
- /welcome → enter +44 7… → save → revisit → country=GB, number preserved, no re-prompt.