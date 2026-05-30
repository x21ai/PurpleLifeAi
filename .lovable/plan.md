
## Part 1 — Why we can't hook into the phone's native Alarm/Clock app

Short answer: web apps (even installed PWAs) are sandboxed by iOS and Android. Neither Safari, Chrome, nor any browser exposes an API to create entries in the system **Clock / Alarm** app. That app is a privileged native app — only a native iOS (Swift) or Android (Kotlin) app, signed and installed via the App Store / Play Store, can schedule entries that ring with the phone on silent, override Do-Not-Disturb (with the user's permission), or wake the device from a cold state.

What a web app *can* do is the closest legal substitute on each OS:

| Capability | iOS Safari / PWA | Android Chrome / PWA |
|---|---|---|
| In-app alarm while tab open | ✅ (today) | ✅ (today) |
| Push notification when closed | ✅ iOS 16.4+, installed to home screen only | ✅ reliable |
| Notification with custom sound | ⚠️ short default tone only | ✅ custom short sound |
| Override silent / DND | ❌ | ❌ |
| Schedule months ahead offline | ❌ | ⚠️ limited |
| Native Clock app entry | ❌ | ❌ |

The only way to *truly* land in the system alarm is `.ics` calendar export — the user imports it once, and iOS/Android Calendar fires native alerts (and those *can* override DND if the user allows). That's why option (c) matters: it's the only path to OS-level reliability without shipping a native app.

If full native alarms are non-negotiable later, the path is a thin React Native / Capacitor wrapper around this same web app — out of scope for now but worth flagging.

---

## Part 2 — Build "All of the above" (a + b + c)

### (a) Custom beep picker
- New `src/lib/alarm-sounds.ts` — Web Audio presets: `gentle-chime`, `classic-beep`, `urgent-pulse`, `rooster`, `vibrate-only` (uses `navigator.vibrate`), `silent`.
- Per-medication: add `alarm_sound` column to `medications`. Default falls back to a global preference.
- Global default: add `default_alarm_sound` to `profiles`, edited in **Settings → Reminders**.
- Med form: dropdown with **Preview** button next to the existing critical-alarm toggle.
- Update `reminder-alarm-sheet.tsx` `useBeeper` to read the chosen preset.

### (b) PWA push notifications
- `public/sw.js` already exists — extend with `push` + `notificationclick` handlers.
- New `push_subscriptions` table (user_id, endpoint, p256dh, auth, user_agent).
- Server fn `subscribePush` / `unsubscribePush` + `sendDueReminders` (Web Push via VAPID).
- Add `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` secrets.
- pg_cron (every minute) → `/api/public/hooks/dispatch-reminders` → sends push for any `pending` dose within the next minute that the in-app modal hasn't already fired.
- Settings toggle: **Enable phone notifications** (prompts "Add to Home Screen" on iOS first).

### (c) .ics calendar export
- New `src/lib/ics.ts` builder (RFC 5545, with `VALARM` triggers).
- Per-trip and per-medication "Export to Calendar" button → downloads `.ics`.
- Anchors to the user's **home timezone** so doses stay aligned during travel (matches the existing travel-mode logic).
- Settings → Travel → "Export trip schedule (.ics)" — generates the full trip's dose schedule in one file.

---

## Part 3 — Reports hub

New section accessible from bottom nav / sidebar: **Reports**.

### Data model
- `report_documents` — id, user_id, title, report_type, report_date, file_path (Supabase Storage), file_mime, ocr_text, status (`processing` / `ready` / `failed`).
- `report_metrics` — id, report_id, user_id, metric_key (e.g. `vitamin_d`, `ldl`, `hba1c`, `tsh`), value numeric, unit, reference_low, reference_high, flag (`low` / `normal` / `high`).
- `metric_dictionary` (seeded) — canonical metric keys, display names, typical units, default reference ranges, category (lipids / thyroid / vitamins / CBC / liver / kidney / hormones / glucose / inflammation / EEG-relevant…), and supplement/lifestyle hints.
- New private Storage bucket `reports` with strict per-user folder RLS (`{auth.uid()}/...`).

### Upload + parse flow
1. User uploads PDF or JPG via `reports.new` route.
2. Server fn `processReport`:
   - PDF → text via `pdfjs-dist` (already Worker-safe).
   - JPG/scanned PDF → Lovable AI Gateway (`google/gemini-2.5-pro` vision) for OCR + structured extraction.
   - Extraction prompt returns `{ report_type, report_date, metrics: [{key, value, unit, ref_low, ref_high}] }` matched against `metric_dictionary`.
3. Rows written to `report_metrics`; status flipped to `ready`.
4. User can review/correct extracted values (audit trail kept).

### Comparative trends UI
- **Reports list** — grouped by `report_type` (e.g. "Blood Panel · 4 reports").
- **Report detail** — extracted values + raw file preview.
- **Trend view** — when ≥2 reports of the same type exist:
  - Line chart per metric over time (Recharts).
  - Reference-range band shaded.
  - Delta vs previous + delta vs first.
  - Plain-language summary (Lovable AI): "Your Vitamin D rose from 18 → 32 ng/mL over 6 months — moving from deficient toward sufficient."
  - Supplement / lifestyle suggestions pulled from `metric_dictionary.hints` (e.g. "Low ferritin often improves with iron + vitamin C; ask your doctor before supplementing").

### Medical safety wrapper (non-negotiable, on every AI-generated panel)
- Persistent banner: **"Educational only — not medical advice. Always consult your medical practitioner before changing treatment or adding supplements."**
- Every supplement suggestion card has a **"Discuss with my doctor"** button that drops the metric + value into a shareable note (PDF export reusing existing share infra).
- AI prompt enforces: no diagnoses, no dosages, always recommend clinician follow-up for any flagged metric.

---

## Part 4 — HIPAA compliance

**Important context** — true HIPAA compliance is *operational*, not just technical. We can make the app **HIPAA-ready** in code, but you (the covered entity / business associate) also need:

1. **BAA (Business Associate Agreement)** with every vendor touching PHI:
   - Supabase (Lovable Cloud) → BAA available on Team/Enterprise plan. **You will need to upgrade and sign one.**
   - Lovable AI Gateway → confirm BAA coverage; if not available, route PHI-touching AI calls to a BAA-covered provider (OpenAI / Anthropic / Google all offer BAAs on paid tiers — we'd swap the gateway for direct calls with the secret keys you already have).
   - Any push / email vendor → BAA required if PHI in payloads (we'll keep notifications PHI-free: "Time for your dose" — never the med name in push body).
2. **Breach notification process** — documented runbook (we'll add a `docs/hipaa-breach-response.md`).
3. **Workforce training & access policies** — your responsibility.

### What we'll build in code (technical safeguards)
- **Encryption at rest** — already on (Supabase default AES-256). Storage bucket `reports` will be private with signed-URL access only (60s TTL).
- **Encryption in transit** — already HTTPS-only.
- **Audit log** — new `phi_access_log` table writing on every read/write of `report_documents`, `report_metrics`, `medications`, `seizure_events`, `journal_entries`, `biometrics`. Captures user_id, actor_id, action, resource, ip, user_agent, at. Append-only RLS.
- **Access controls** — already RLS-per-user; add explicit deny for `anon` on all PHI tables (audit + tighten existing grants).
- **Minimum necessary** — caregiver sharing already scope-gated; we'll audit `care_scopes` to confirm Reports is opt-in per scope, not bundled.
- **Session safeguards** — auto-logout after configurable idle (default 15 min) for PHI routes; require re-auth for export/share actions.
- **Data export & deletion** — extend existing data-export to include reports; add a "Delete all my data" button (right-to-erasure flow, soft-delete + 30-day purge job).
- **Notification privacy** — push payloads strip PHI ("Time for your medication" — full details only inside the app).
- **No PHI in logs / Sentry** — add PHI scrubber to `src/lib/error-capture.ts`.
- **No PHI in URLs** — audit existing routes; any `?token=` style sharing uses opaque one-time tokens (already pattern in `care.accept`).
- **MFA available** — enable in Supabase Auth settings (toggle via Settings → Security).
- **HIPAA settings page** — `settings.privacy-security.tsx` showing: BAA status, idle-timeout slider, MFA toggle, export, delete, audit-log download.

### Disclaimers wired everywhere PHI is shown
- Reports section banner.
- AI summaries everywhere (Today insights, chat, risk forecast, supplements).
- Onboarding consent checkbox: "I understand this app is educational and not a substitute for medical care."

---

## Phased delivery

**Phase 1 (this build)** — reminders complete (a+b+c) and Reports MVP (upload, OCR, list, single-metric trend chart) + HIPAA banners + audit log + private storage.

**Phase 2 (next)** — multi-metric dashboards, AI narrative summaries, supplement suggestion engine, .ics for full trips, push notifications, idle-timeout, MFA UI, data deletion flow.

**Phase 3** — BAA paperwork checklist UI, PHI scrubbing in logs, full breach runbook doc.

Splitting like this keeps each turn shippable and reviewable.

---

## Technical details (for the engineer view)

- **Tables** (new): `push_subscriptions`, `report_documents`, `report_metrics`, `metric_dictionary`, `phi_access_log`. All with RLS scoped to `auth.uid()`, explicit `GRANT` to `authenticated` only, `service_role` for server fns. No `anon` grants.
- **Columns added**: `medications.alarm_sound text`, `profiles.default_alarm_sound text`, `profiles.idle_timeout_minutes int default 15`.
- **Storage**: bucket `reports` (private), policy `{auth.uid()}/*`, signed URLs only.
- **Server fns** (new in `src/lib/`): `reports.functions.ts` (upload, process, list, trends), `push.functions.ts` (subscribe, unsubscribe, dispatch), `phi-audit.functions.ts` (log write helper used by all PHI fns).
- **Server routes**: `/api/public/hooks/dispatch-reminders` (cron, CRON_SECRET-guarded).
- **AI**: OCR + extraction via `google/gemini-2.5-pro`; narrative summaries via `google/gemini-2.5-flash` (cheaper); all PHI-bearing calls gated behind BAA-confirmed provider once confirmed.
- **Libraries to add**: `pdfjs-dist`, `web-push`, `ics` (or hand-rolled — small).
- **Secrets to add (Phase 2)**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.

Approve and I'll start with Phase 1.
