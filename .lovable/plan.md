# Plan — Finish the report stack

Five workstreams. All additive; no breaking changes to existing reports/journal flows. Uploaded PDFs are only for visual reference for me while building — they will NOT be checked in, used as fixtures, or attached to any user other than `pmt@eigital.com`.

---

## 1) Scheduled monthly auto-reports

A user can opt in to receive a Medical History PDF on the 1st of each month (last 30 days), emailed to themselves and any caregivers they choose.

- New table `medical_report_schedules` (user_id, cadence `monthly`, day_of_month, sections jsonb, recipients jsonb [{email, name}], active, last_run_at, timezone). RLS owner-only.
- Settings UI on `/reports/medical-history`: "Auto-send monthly" toggle + recipient picker (self / care contacts / custom email) + section toggles reusing the existing generator.
- New public cron route `src/routes/api/public/cron/medical-reports.ts` (apikey-gated, `/api/public/*`). Iterates due schedules, calls existing `generateMedicalReport` server fn internals, emails via the existing `medical-report-share` template.
- pg_cron job daily at 06:00 UTC hitting that route.

## 2) Public read-only clinician share link

A user generates a one-time signed URL that opens a read-only HTML view of a generated report (no login).

- New table `medical_report_public_links` (report_id, token, expires_at, revoked_at, opened_count, last_opened_at, viewer_label). RLS owner-only writes; reads via server route only.
- New public route `src/routes/share/report.$token.tsx` — fetches via a server fn that validates token+expiry, increments `opened_count`, returns report metadata + signed PDF URL (60s). Page shows: patient name (first name only by default, full toggleable), date range, sections, embedded PDF viewer, "Download PDF" button. No app chrome / no auth.
- Owner UI on the medical-history page: "Create share link" → modal with expiry (24h / 7d / 30d) + optional viewer label → copyable URL + revoke button.
- Audit row in existing `phi_access_log` on each view.

## 3) Richer charts in the PDF

Upgrade `src/lib/medical-report.server.ts`:

- Multi-source overlay line charts (Oura vs Whoop vs Apple Health vs manual) per biometric, with a tiny legend.
- Weekly averages + 7-day rolling line on top of daily dots for sleep, HRV, RHR, SpO2, steps.
- Seizure event markers as vertical ticks on the relevant biometric charts (HRV/sleep) so clinicians can see the temporal relationship.
- Adherence sparkline per medication (last 30 days) next to the table row.
- Lab metrics trend mini-chart for each canonical metric that has ≥2 historical points (reusing `report_metrics` time series), with the reference band shaded.

## 4) Smarter report intake — categorized panels (Oura-style)

Today, extracted values render as one flat list. Make the report detail page (and a new dashboard) feel like Oura's tiled summary.

- Extend `metric_dictionary` with a `panel` column (`cardiometabolic | lipids | thyroid | liver | kidney | hematology | hormones | vitamins | inflammation | imaging | other`) and `unit_si`. Backfill known keys.
- Extend `report_documents` with `summary` (text) and `panel_keys` (text[]). The AI extractor already returns `report_type`; also ask for a 2-3 sentence plain-language synopsis and the dominant panels.
- New `/reports` overview: grouped tiles per panel, each showing latest value + delta vs previous + sparkline (tap → opens full trend). Mirrors `src/components/ui-oura/v2/metric-card.tsx`.
- Report detail: group extracted values by panel with a synopsis card at the top. Existing flat list stays as a fallback for `other`.
- Imaging/narrative reports (CT, MRI, ultrasound): extractor returns `summary` + `findings[]` + `impressions[]` instead of numeric metrics; render as a narrative card.
- Robustness: accept PDF / JPG / PNG / HEIC / WEBP (already in place), enlarge max to 25 MB, and add a server-side re-process button on failed extractions with model fallback (`gemini-2.5-pro` → `gpt-5`).

## 5) Journal → report auto-routing

When a journal entry includes an attached PDF/image that looks like a medical report, route it to Reports automatically.

- After upload to `journal-media`, a classifier server fn calls Lovable AI with the file to decide `is_medical_report` + suggested title + report_date.
- If yes: copy the file into `reports` bucket, create a `report_documents` row, kick off the same extraction pipeline, and add a small inline card on the journal entry: "Saved to Reports → [title]".
- User can undo from the journal entry (deletes the report row + file copy, keeps the journal entry).

---

## Technical notes

- All server logic uses `createServerFn` (no new edge functions). Cron via `pg_net` → `/api/public/cron/medical-reports` with `apikey` header.
- New migrations: `medical_report_schedules`, `medical_report_public_links`, `ALTER metric_dictionary ADD panel, unit_si`, `ALTER report_documents ADD summary, panel_keys`. GRANTs + RLS per project conventions; service_role-only writes from cron.
- Shared chart helper extracted from `medical-report.server.ts` into `src/lib/report-charts.server.ts` so both PDF and on-screen tiles use the same series math.
- No third-party trackers. Public share link page sets `noindex`.
- All uploaded sample PDFs treated confidentially — used only for local visual QA, never persisted to repo or attached to any non-`pmt@eigital.com` account.

## Out of scope

- Native HealthKit/CGM ingestion
- DICOM image rendering for imaging reports (we'll show extracted narrative only)
- Multi-tenant clinician portal — share links are per-report, single-use-ish

## Suggested order

1. Smarter intake + panels (4) — biggest UX lift, unlocks better PDFs.
2. Richer PDF charts (3) — depends on series helpers from #4.
3. Clinician share link (2).
4. Monthly auto-reports (1).
5. Journal → report routing (5).