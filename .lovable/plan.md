# Plan: Phases 4, 6, 7 — AI, Power Features, Vitals Depth

Building on the Insights/Reports work already shipped. Three phases, sequenced so each is independently shippable.

---

## Phase 4 — AI Summaries & Insights

**Goal:** Every report and every vital tells the user what it *means*, in plain English.

### 4.1 Per-report AI summary
- New server fn `summarizeReport` in `src/lib/reports.functions.ts` (auth-gated).
  - Pulls `report_documents` row + `report_metrics` for that report.
  - Calls Lovable AI (`google/gemini-3-flash-preview`) with a Purple-tone system prompt + medical disclaimer rule.
  - Returns `{ summary, flagged: [{metric, value, concern}], plain_english_findings }`.
  - Caches result on `report_documents.ai_summary` (jsonb) + `ai_summary_at`.
- UI: "Explain this report" button on `reports.$reportId.tsx`. Shows summary card, flagged-values list, and the standard medical disclaimer.

### 4.2 Cross-report trend insight
- New server fn `getMetricInsight(metricKey)` — pulls last 3–6 readings for a metric from `report_metrics` + `vitals_log` + `biometrics`, asks AI to describe the trend in one sentence.
- Persists to existing `metric_insights` table (already exists in schema).
- UI: "What changed?" link on each metric trend card in Insights.

### 4.3 Insights home auto-cards
- New server fn `getDailyInsightCards` — runs once/day per user (cached in `metric_insights` with a `card_kind` tag), surfaces 2–3 top observations ("LDL up across last 3 reports", "BP trending higher in mornings").
- UI: New "For you" row at the top of `/insights`, above the vitals row.

---

## Phase 6 — Polish & Power Features

**Goal:** Make Reports feel like a real records vault.

### 6.1 Timeline view on Reports
- New tab toggle on `/reports/documents`: **List** (current) | **Timeline**.
- Timeline groups by Year → Month → Day, with the category icon + title per row. Pure presentation, reuses existing query.

### 6.2 Bulk download
- New server fn `bulkDownloadReports({ category?, from?, to? })` — generates short-lived signed URLs server-side, zips on the client using `client-zip` (browser-friendly, Worker-compatible — no native deps).
- UI: "Download all" button on category-filtered Reports views.

### 6.3 OCR fallback for scanned PDFs / photo reports
- Update `processReport` in `src/lib/reports.functions.ts`: when text extraction yields <50 chars from a PDF, route the file through Gemini multimodal (image/PDF input) to OCR + extract metrics.
- No new tables; reuses the existing parser output path.

### 6.4 Share-with-doctor flow (refinement)
- Phase 2 already added "Copy share link". Phase 6 adds:
  - Choice of expiry (1 day / 7 days / 30 days) when generating the link.
  - "Shared links" panel in report detail showing active links + revoke button.
  - Access log surfaced from existing `phi_access_log` table ("Viewed 2 times").

### 6.5 Care-circle sharing
- Reuse `care_relationships`. Add `report_documents` RLS policy: a caregiver with `read_reports` scope in `care_scopes` can SELECT reports for that user.
- UI: "Share with care circle" toggle per report.

---

## Phase 7 — Vitals Depth

**Goal:** Vitals stop being a snapshot and become a story.

### 7.1 Trend charts per vital
- New route `/_app/vitals/$metric` (e.g. `/vitals/weight`, `/vitals/bp`).
- Reuses existing `getMetricTrend` server fn. Renders 30d / 90d / 1y toggles with a recharts line chart (BP gets dual-line systolic/diastolic).
- Tap any vital tile on `/insights` to drill in.

### 7.2 Goals / targets
- New table `vital_goals` (user_id, metric_key, target_min, target_max, note). RLS scoped to `auth.uid()`.
- UI: "Set target" on each vital detail page. Tile shows a small ✓ / ⚠ badge against the latest reading.
- Gentle: no streaks, no scolding. Purple tone.

### 7.3 Apple Health auto-sync (foundation only)
- `apple_health_tokens` table already exists. Add server fn `syncAppleHealthVitals` that pulls weight/BP/glucose/HR and inserts into `vitals_log` with `source='apple_health'`.
- Triggered manually from a "Sync now" button in Settings (full background cron is out of scope for this phase).
- Google Fit deferred — not in current schema.

---

## Sequencing & Migrations

Three migrations, one per phase:
1. `report_documents.ai_summary jsonb`, `ai_summary_at timestamptz`; `metric_insights.card_kind text`.
2. `report_documents` RLS update for care-circle reads; `report_share_links` table (expiry + revoke + access count) — replaces ad-hoc signed-URL approach.
3. `vital_goals` table with grants + RLS + updated_at trigger.

## Technical notes
- All AI calls go through `createServerFn` (no edge functions).
- All signed URLs remain short-lived; buckets stay private (per core memory).
- Medical disclaimer included on every AI-generated card.
- DICOM (Phase 5) stays parked.

## Suggested build order
Phase 4 first (highest user-visible value), then 7 (charts make 4 feel even better), then 6 (polish). Want me to follow that order, or interleave?