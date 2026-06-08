# Three fixes

## 1. Metrics page renders blank

`src/components/reports/trends-section.tsx` returns `null` when loading and when the list is empty, so the Metrics tab shows nothing if you have no extracted metrics yet (e.g. all reports were rejected or still processing). Fix:

- Show a loading skeleton (3 placeholder cards) while `isLoading`.
- Show a friendly empty state when `metrics.length === 0`: short copy explaining "No lab values yet" + a primary button linking to `/reports/new` to upload a report, and a secondary link to the Reports tab.
- Keep the section heading visible in both states so the page never looks broken.

No data-layer changes. `listTrendMetrics` is already correct.

## 2. Identity approval: remember the decision + apply it to future uploads

Today every uploaded report is identity-checked against `profiles.first_name/last_name/date_of_birth` independently. If you approve a doc with name "AKASH OP, AURORA" / DOB 1973-08-10, the next upload with the same printed name still shows the banner. Fix it so an approval is sticky for that identity, and so the user understands what's happening with many docs.

### Data
New table `public.report_identity_aliases` (with GRANTs, RLS, `auth.uid()` policies):

- `id uuid pk`, `user_id uuid` (auth.users), `name_normalized text`, `dob date null`, `source` (`'approval' | 'profile'`), `created_at`.
- Unique `(user_id, name_normalized, dob)`.

### Server
`src/lib/reports.functions.ts`:

- In `setReportIdentityDecision` when `decision === "approve"`: look up the report's `patient_name` + `patient_dob`, insert a normalized alias row (lowercase, trimmed, collapsed whitespace).
- In `processReport` identity step: before flagging `mismatch`, check `report_identity_aliases` for `(user_id, name_normalized, dob)` match. If hit → `identity_status = 'verified'` and skip the banner. Profile name/DOB still wins first.
- `getReport` (the report detail loader) returns a new `aliasCount` so the banner can show "Approving will also remember this name/DOB so future uploads with the same identity skip this check."

### UI
`src/routes/_app/reports.$reportId.tsx` identity banner copy:

- Replace current single-sentence explanation with a two-line block:
  1. "Found on the document: NAME, DOB YYYY-MM-DD. Its metrics are hidden from your trends until you confirm."
  2. "Approving remembers this name and DOB. Future uploads that match will skip this check automatically. Rejecting deletes this report and blocks re-uploads of the same readings."
- Keep the two buttons but rename without em dashes (see §3).

`src/routes/_app/reports.new.tsx` upload result toast: when one of N uploaded files is flagged as identity mismatch, surface a count ("2 of 5 reports need you to confirm the patient identity") with a link to `/reports/documents`. This answers the "what happens with 10 different names" question: each unique identity prompts once, after which it's remembered.

### Settings surface (lightweight)
Add a section in `src/routes/_app/settings.sharing.tsx` (or a new `settings.identities.tsx` if cleaner) listing remembered identities with a delete button, so a caregiver who approved the wrong alias can revoke it.

## 3. Purge em dashes project-wide

The `mem://constraint/no-em-dash` rule exists and `scripts/check-no-em-dash.mjs` exists, but it's only wired as an npm script, not run in any build step, so regressions slipped in.

- Run `npm run check:em-dash`, fix every hit in `src/` and `public/` by replacing per the rule (`,` / `:` / `and` / split sentence / `·` for title separators).
- High-traffic hits I already see: `reports.$reportId.tsx` ("This is me — approve" / "Not me — delete"), `trends-section.tsx` status chips ("Out of range — high/low"), `reports.trends.$metricKey.tsx`, `reports.functions.ts` error messages, `reports.new.tsx` toast, `purple-chat-prompt.server.ts`, many marketing/intake sheets.
- Add `bun run check:em-dash` to the `prebuild` script in `package.json` so any future em dash fails CI.

## Files touched (summary)

- New migration: `report_identity_aliases` table + grants + policies.
- `src/lib/reports.functions.ts` — sticky alias logic on approve + match check in processReport, return `aliasCount`.
- `src/components/reports/trends-section.tsx` — loading skeleton + empty state.
- `src/routes/_app/reports.$reportId.tsx` — clearer banner copy + em dash fix.
- `src/routes/_app/reports.new.tsx` — identity-needs-review toast + em dash fix.
- `src/routes/_app/settings.sharing.tsx` (or new file) — remembered identities list.
- Sweep across `src/` + `public/` for em dashes.
- `package.json` — add `prebuild` hook running `check:em-dash`.

No new external services, no AI changes, no schema changes beyond the one alias table.
