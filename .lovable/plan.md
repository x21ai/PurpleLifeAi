## What's still left to build (quick answer)

Nothing big in core flows — the major systems are in: Today, Journal, My Body (biometrics/intake/meds/timeline), Insights/Reports, Care/sharing, Community, Travel, Apple Health import, friend circle, invite codes, PWA. What's outstanding is mostly polish + the rough edges you're catching now:

- The sidebar/account/menu cleanup below (this plan)
- Gender field (this plan)
- A short "what does Purple track for my condition?" onboarding nudge after sign-up (not in this plan)
- Pricing/billing wiring (not started — you haven't asked)
- The "fun/social-only" friend permission tiers we discussed last turn (data model done, UI for granting "social tier" not built)

Everything else is iteration on what exists. If you want a written backlog file I can drop one in `/docs/whats-left.md` next round.

---

## Your 5 questions — what I'll change

### 1. "Account" vs "My account" — they mean different things

- **Sidebar → Account** = the settings hub (Profile / Settings / Sharing / Privacy).
- **Top-right menu → "My account"** = a *role switch* back to viewing your own data, shown only when you're also a caregiver for someone else. It's not a page, it's "stop looking at Devyn's data, show mine."

Both labels say "account" so it reads like duplicate links. Fix:

- Rename the role-switch row from **"My account / Your own data"** → **"View as myself / Your own data"**.
- Keep the bottom **Account** link in the dropdown (it opens `/account`) as-is.
- Apple does the same thing in Family Sharing — that row says "Use This iPhone with your Apple ID," not "My account."

### 2. Purple circle at top of collapsed sidebar + icon misalignment

- The round purple circle is the **Purple logomark** for the collapsed (md, 64px) rail. It's a placeholder I dropped in when there wasn't a real mark. Remove it. Show the wordmark "P" in the same typeface as the expanded "PURPLE" wordmark instead — quieter and on-brand. (Branding rule: PURPLE wordmark stands alone, no controls next to it — a single-letter mark in the same face is the cleanest collapsed form.)
- Icon misalignment: group rows use `pl-3 pr-1` even when the rail is collapsed, so the icon sits left of center while leaf rows are centered. Switch the collapsed rail to symmetric padding (`px-0` + `justify-center`) for both group and leaf rows. All icons line up on the same vertical axis.

### 3. Account page redesign + drop pronouns, add gender

Restructure `/account` to the order Apple uses (identity → security → preferences → session):

````text
PROFILE
  Avatar + name + email (read-only with "change email" link) + phone

IDENTITY            ← new section name
  Gender (Female / Male / Non-binary / Prefer not to say / Self-describe)
  Date of birth (already collected at onboarding — surface read-only here)

SECURITY
  Password
  Two-factor

REGION & LANGUAGE
  (unchanged)

APPEARANCE
  (unchanged)

INVITE
  Get an invite code  (unchanged — but only ONE card, the duplicate "INVITE" labels in your screenshot are an empty state of the same card rendering 3x; fix that bug)

SESSION
  Signed in as · Sign out
  Delete account  (move from settings to here, it belongs with sign-out)
````

- **Remove** the Pronouns field everywhere it appears (account, profile, caregiver-visible profile). Drop the `pronouns` column from `profiles` in a new migration.
- **Add** `gender` text column to `profiles` with the five-option select above (free-text when "Self-describe"). Autosaves like the other fields.
- Fix the **triple "INVITE" headers** rendering bug — that's a layout issue where `SheetSectionLabel` is being rendered alongside the card's own header. Render the label once.

### 4. Open (expanded) sidebar is confusing — fixes

From your screenshots:

- Account group has too many cousins (Profile, Settings, Sharing, Privacy) — collapse to **Profile, Settings, Sharing**. Privacy is content-policy info, move it to the Settings page footer where Privacy/Terms/Charter already live.
- "Caregiver" pill at the bottom — leave it. It's role-specific and the right place.
- Insights only has `Reports` and `Medical history PDF` (which is also a Report). Merge them: keep `Reports` as a single link, drop `Medical history PDF` from the rail (it's reachable from inside Reports).
- Community → currently only has `Resources`. Promote Community itself to a leaf link, drop the child.
- Tools → keep `Apple Health import` + `Travel`. Fine.
- **Bug in screenshot 1 (account page sidebar shows "My Body" repeated ~30 times):** that's the collapsed-sidebar's icon-only rows getting the same tooltip label rendered as visible text on a viewport between md and lg. The `RailTooltip` shouldn't render `TooltipContent` inline. Fix by gating `TooltipContent` with `lg:hidden` *and* ensuring it only mounts on hover (already Radix default — likely a `pointerEvents` regression). I'll verify and patch.

### 5. Skin temperature card — value collides with status pill

`MetricCard` renders the value (e.g. `-0.27°C`) in a `min-w-0` left column and the status pill (`PAY ATTENTION`) in a `shrink-0` right column, same flex row. With a long-format pill ("PAY ATTENTION" = 12 chars) the pill eats the right gutter and the value's serif `text-6xl` glyphs cross under it. Fix:

- Move the status pill to its **own line above** the value (eyebrow → pill on the eyebrow row), so the value gets the full card width.
- For skin temperature specifically, format as `−0.3°C` (1 decimal) — the second decimal is noise on a baseline-delta metric.
- Add `whitespace-nowrap` to the value and a smaller responsive type ramp when the formatted string is > 6 chars.

---

## Files I'll touch

- `src/components/layout/profile-menu.tsx` — relabel "My account" → "View as myself"
- `src/components/layout/sidebar-nav.tsx` — replace purple circle with wordmark "P", symmetric padding on collapsed rail, fix RailTooltip leak
- `src/components/layout/nav-items.ts` — collapse Account/Insights/Community children
- `src/routes/_app/account.tsx` + `src/components/account/profile-fields.tsx` — new section order, gender field, drop pronouns, dedupe INVITE label, add Delete account row
- `src/components/biometrics/metric-card.tsx` — pill on eyebrow row, responsive value sizing
- `src/lib/biometric-metrics.ts` — skin temp 1-decimal format
- New migration: add `gender text`, drop `pronouns` from `profiles`

## Out of scope (ask if you want them)

- Avatar redesign / new logomark file
- Friend-tier permission UI (separate plan)
- Pricing/billing
- Backfilling existing `pronouns` data anywhere (it's just dropped)
