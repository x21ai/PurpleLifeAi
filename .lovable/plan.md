Three fixes plus one new admin area. Scoped tightly — no metric-card visual rewrite.

## 1. Why "% Saturation" shows two readings on the same date

Two uploads ("Comprehensive Blood Panel (Quest)" and "Quest Comprehensive Health Panel" on 2025-11-08) both extracted the same value. Today nothing dedupes them and nothing verifies the report belongs to the signed-in user.

### Extract patient identity on every report

- Extend report extraction (`src/lib/medical-report.server.ts` / report processor) so the AI returns `patient_name` and `patient_dob` (ISO date) alongside the existing fields.
- Add columns on `report_documents`: `patient_name text`, `patient_dob date`, `identity_status text default 'unverified'` (`'verified' | 'mismatch' | 'unverified' | 'manual_approved'`), `duplicate_of uuid null references report_documents(id)`.
- After extraction, compare normalized `patient_name` + `patient_dob` against `profiles.full_name` + `profiles.date_of_birth`:
  - Match → `identity_status = 'verified'`, metrics flow into trends normally.
  - Mismatch or missing → `identity_status = 'mismatch'`, metrics are stored but **excluded** from `listTrendMetrics` / `getMetricSeries` until the user resolves it.
- Surface a yellow banner on the report detail page and on `/reports/documents` for any report with `identity_status != 'verified'`, with two actions: "This is me — approve" (sets `manual_approved`) or "Not me — delete".

### Duplicate detection

- After identity check, look for an existing report with the same `(user_id, patient_dob, report_date)` and ≥60% overlap of `(metric_key, value)` pairs. If found, set `duplicate_of` and `identity_status='manual_approved'` is **not** auto-applied — instead show a "Possible duplicate of X" prompt on the document row with "Keep both / Replace older / Delete this".
- `listTrendMetrics` filters out metrics whose `report_id.duplicate_of IS NOT NULL` so the saturation card stops double-counting.

## 2. Dropdown looks wrong (white OS chrome on dark page)

The Trends sort uses a native `<select>`, which the OS renders with white background and dark text — that's what's in the screenshot.

- Replace it in `src/components/reports/trends-section.tsx` with the existing shadcn `Select` (`@/components/ui/select`) so it inherits the dark `report-card` styling: dark `#0F1418` bg, white text, hover row in `bg-white/8`, border `white/10`.
- Sweep `rg "<select"` across the app: only one other native select in `src/routes/_app/community-new.tsx` — convert that one too so the rule holds platform-wide.

## 3. AI Insights — on-demand, not auto

Today `getMetricInsight` runs in `useQuery` on every detail-page visit, burning credits and showing "Insights unavailable right now" before it resolves or when the user has only 2 readings.

- Remove the auto `useQuery` for insights in `src/routes/_app/reports.trends.$metricKey.tsx`.
- Replace the panel with an empty state: "Get an AI read on your latest %Saturation trend" + **Run AI insights** button.
- Clicking calls `getMetricInsight` once via `useMutation`. The server fn already considers the full series with the latest reading as anchor — that stays.
- Cache the result in a new `metric_insights` table keyed by `(user_id, metric_key, latest_at)` so re-opens within the same latest reading don't re-bill. Old readings get no insight UI — only the latest reading shows the button.
- If credits fail (402) or rate-limited (429), show the actual reason inline instead of the generic "unavailable".

## 4. Platform rules admin area

New super-admin section at `/admin/rules` (gated by existing `has_role(_, 'admin')`).

- New table `platform_rules`: `id`, `scope text` (`'platform' | 'role' | 'user'`), `scope_value text null` (role name or user_id when scoped), `key text`, `value jsonb`, `enabled boolean`, audit cols.
- Seed it with the first rule the user just asked for: `require_identity_match_for_metrics = true`. The report processor reads this rule before deciding to gate metrics on identity match.
- Admin UI: list rules grouped by scope, add / edit / toggle. Three scope pickers (Platform-wide / By role / By user), key+value editor with JSON validation.
- A `usePlatformRule(key, { scope, scopeValue })` server fn resolves rules with precedence user > role > platform.

## Files to touch

**Migrations**
- `report_documents`: add `patient_name`, `patient_dob`, `identity_status`, `duplicate_of`.
- New `metric_insights` table (`user_id`, `metric_key`, `latest_at`, payload jsonb).
- New `platform_rules` table + GRANTs + RLS (admins write, authenticated read where enabled).
- Seed `require_identity_match_for_metrics=true`.

**Server**
- `src/lib/medical-report.server.ts` — extract & save identity fields, run identity match + duplicate detection.
- `src/lib/report-trends.functions.ts` — filter out unverified + duplicate reports; cache AI insights via `metric_insights`.
- New `src/lib/platform-rules.functions.ts` — get/set/list rules; helper `getRule(key, ctx)`.

**Client**
- `src/components/reports/trends-section.tsx` — swap native `<select>` for shadcn `Select`.
- `src/routes/_app/community-new.tsx` — same swap.
- `src/routes/_app/reports.trends.$metricKey.tsx` — on-demand "Run AI insights" button, latest-only.
- `src/routes/_app/reports.documents.tsx` + `reports.$reportId.tsx` — identity / duplicate banners + actions.
- `src/routes/_app/reports.new.tsx` — show identity check result after upload.
- New `src/routes/_app/admin.rules.tsx` + small `RulesEditor` component.

No changes to brand, nav order, or metric card layout.