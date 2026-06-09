# What's left before launch

All feature waves are shipped. The remaining work is verification + two small UI fixes I previously flagged but haven't built. Nothing structural, no migrations, no new server logic.

## 1. Two open UI fixes (from Wave 6 plan, not yet built)

- **Today screen top clipping** — vitals strip labels (TEMP Δ, RESP, MIN, SPO₂) collide with the safe-area / sticky header. Add `pt-[env(safe-area-inset-top)] + mt-2` on the vitals strip and matching top padding on the page container.
- **Today FAB vs tab labels** — the capture FAB toolbar obscures "Journal" / "Patterns" labels on the bottom tab bar. Shift FAB to `bottom-20` so labels stay readable.

Files: `src/routes/_app/today.tsx`, `src/components/today/*` (FAB position only).

## 2. Launch QA sweep (read-only)

- Run the three guards: `check-no-em-dash`, `check-no-test-data`, `check-unique-route-images`.
- Walk the 13 surfaces at 390 / 820 / 1440 widths — log ✓ / ⚠ / ✗:
  Today, Journal, Patterns/Insights, Reports (Metrics + Documents), Meds, Hydration, Care, Chat, My Health, My Health DNA, Settings, Account, Admin.
- Smoke-check the auth flow (email + Google), onboarding redirect, condition picker → Care Profile generation.
- Verify private storage signed URLs work (journal-media, reports buckets) — this is the "images broken" symptom you reported earlier.
- Re-run the Supabase linter + security scan — confirm 0 high/critical.

## 3. Publish

- Frontend changes go live only after clicking **Update** in the publish dialog. Backend (edge functions, migrations) is already live.

## Out of scope unless you ask

- Native apps, glucose-meter SDKs, flight APIs, multi-trip overlap (per project rules).
- Reordering metric categories per user, per-category themes.

Reply **go** to build the two Today fixes and run the QA sweep, or tell me which to skip.