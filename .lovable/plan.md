## Goal
Remove every em dash (—) from user-facing content across the platform, replacing each one with a more appropriate connector: `,`, `and`, `or`, `:`, `.`, parentheses, or a simple space — chosen per sentence so the copy still reads naturally. Going forward, em dashes will not be used anywhere.

## Scope
About **352 occurrences across ~149 files**, spread across:

- **Routes / pages** (marketing + app): `index.tsx`, `features.tsx`, `pricing.tsx`, `privacy.tsx`, `terms.tsx`, `contact.tsx`, `sign-in.tsx`, `community.tsx`, `community.resources.tsx`, `care.accept.tsx`, `reset-password.tsx`, `share.report.$token.tsx`, `oauth.*.callback.tsx`, `_app.tsx`, `__root.tsx`, etc.
- **Components**: today/journal/meds/care/chat/biometrics/locale/account/conditions/ui-oura/layout/common.
- **i18n strings**: `src/i18n/locales/en.json` and `es.json` (the largest concentration of user-visible copy).
- **Server/email/cron files** with copy strings: `lib/medical-report.server.ts`, `email-templates/*`, `routes/api/public/cron/*`, `routes/lovable/email/*`, `routes/email/unsubscribe.ts`, `lib/travel-scheduler.ts` (any user-visible strings), etc.
- **Misc**: `public/sw.js` (offline copy), `src/styles.css` (only if used in `content:` rules — will inspect; CSS comments left alone).

Code-only occurrences (comments, JSDoc, internal log messages never shown to users) will also be normalized so the rule is uniform and easy to enforce later — replaced with `,` / `:` / `-` as fits.

## Replacement rules (applied per sentence, not blindly)
1. Parenthetical aside → wrap in commas, or split into two sentences. Example: `Purple listens — and remembers.` → `Purple listens, and remembers.`
2. List/definition lead-in → use `:`. Example: `Three things — sleep, HRV, mood.` → `Three things: sleep, HRV, mood.`
3. "X — Y" appositive label → use `,` or `.`. Example: `Purple — a quiet journal` → `Purple, a quiet journal`.
4. Range/connector between clauses → use `and` / `or` as appropriate.
5. Numeric/date ranges (`9—5`, `Mon—Fri`) → use `–` is NOT allowed either per spec; use `to`. (`9 to 5`, `Mon to Fri`.)
6. Title/eyebrow ornaments like `— Purple` suffix in `<title>` → drop the dash, use `· Purple` or `| Purple` (will pick one consistent separator, default `· Purple` to match existing tone).

## Execution approach
- **Manual, file-by-file pass** (NOT a blanket sed) so each replacement reads naturally. Em dashes appear in copy where punctuation matters; a global substitution would produce awkward sentences.
- Batched by area to keep diffs reviewable:
  1. i18n locale files (`en.json`, `es.json`) — biggest single win.
  2. Marketing routes (`index`, `features`, `pricing`, `privacy`, `terms`, `contact`, `sign-in`, `community*`).
  3. App routes + components (today, journal, meds, care, biometrics, chat, account, locale, conditions, ui-oura, layout, common).
  4. Email templates + server/cron user-visible strings.
  5. `<title>` / meta separators standardized to `·`.
  6. Remaining code comments and internal strings.
- After each batch, re-run `rg -c "—"` to confirm count drops, ending at **0**.

## Guardrail to prevent reintroduction
Add a tiny check to `scripts/check-no-test-data.mjs` (or a new sibling script `scripts/check-no-em-dash.mjs` wired into the same npm script) that greps the repo for `—` and fails the build if any are found in `src/` or `public/`. This makes the "never use it" rule enforceable.

## Out of scope
- Translations of meaning — only punctuation/connector swaps; no rewording beyond what's needed for the new connector to read correctly.
- Auto-generated files (`routeTree.gen.ts`, `integrations/supabase/*`, `.env`, `supabase/config.toml`) — left untouched per project rules.
- En dashes (`–`) and hyphens (`-`) — only the em dash `—` (U+2014) is removed.

## Deliverable
Zero `—` characters anywhere under `src/` and `public/`, plus a guardrail script that keeps it that way.
