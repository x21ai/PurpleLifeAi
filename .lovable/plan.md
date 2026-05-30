## What's wrong today

Going through each complaint after reading the code and the screenshots:

### 1. Sharing & Travel mode crash to "This page didn't load" / "Not Found"
- Both routes call `createServerFn` functions wrapped with `requireSupabaseAuth` (`care.functions.ts`, `travel.functions.ts`).
- If `attachSupabaseAuth` isn't firing globally in `src/start.ts`, or any of those server fns throw during render, the route's `errorComponent` renders the "This page didn't load" fallback (screenshot 1) and a stale link in the menu / footer renders "Not Found" (screenshot 2).
- Need to: (a) confirm `attachSupabaseAuth` is registered, (b) wrap each `useQuery` call in defensive error handling so a single failing server fn doesn't blow up the whole page, (c) add proper empty/error states.

### 2. "Heart Health" typed into the textbox doesn't save anywhere meaningful
- That field is `profiles.conditions_note` — a free-text note, NOT a condition tag. The user (correctly) expects typing "Heart Health" to add it as a chip and tailor prompts.
- Fix: turn the textbox into a real "Add custom condition" input that pushes the value into the `conditions` array as a chip (with an X to remove). Keep the note field separate, lower, labeled "Anything else?" — or drop it entirely. Custom conditions get passed into Ask Purple's system prompt just like the built-ins.

### 3. AI model list is too short
- Today: only Gemini Flash, Gemini Pro, Claude Sonnet.
- Add (all already supported by Lovable AI Gateway):
  - **GPT-5** (OpenAI) — flagship reasoning
  - **GPT-5 mini** — fast OpenAI
  - **Gemini 2.5 Pro** — Google's deepest
- Group them under labels: *Fast*, *Balanced*, *Deepest*. Add a one-line "Why pick this" hint.
- Grok and a "Maya" persona aren't on the Lovable AI Gateway model list, so they can't be added without a separate API key. I'll call this out and ask before wiring anything custom.

### 4. Settings IA is messy — not Apple-grade
Restructure the Settings hub the way iOS Settings does — grouped, scannable, no orphan rows:

```text
ACCOUNT
  pmt@eigital.com  ›  (tap → account detail)
  Sign out

YOUR HEALTH
  Focus & conditions  ›
  Medications  ›
  Past episodes  ›   (only if seizure-relevant)
  Lab reports  ›

PEOPLE
  Sharing & access  ›
  Community  ›

APP
  Travel mode  ›
  Connections (Oura, …)  ›
  Notifications & alarms  ›
  Appearance  ›
  How Purple thinks  ›
  AI model  ›

DATA
  Export        (icon + label, small)
  Delete        (destructive icon, no long paragraph)

HELP
  Contact  ›
  Charter  ›  Privacy  ›  Terms  ›

(Admin console — only visible to admins, lives at the very bottom under its own ADMIN group)
```

- "Contact the team" and "Admin console" stop sitting in the main list as if they're equal to Travel; Contact moves to Help, Admin gets its own admin-only group at the bottom.
- "Delete everything" becomes a small destructive icon-button with a tooltip ("Delete account") and an `aria-label`. All the warning text moves into the confirmation dialog where it belongs — that already has DELETE + password gating + 60-day restore window.
- "Export everything" becomes a small icon-button next to it, matching the Apple "quiet utility" pattern.

### 5. "Not Found" on certain pages (screenshot 2)
- Likely a stale link in the footer/menu (e.g. `/lovable/...` or an old route id). I'll audit `nav-items.ts`, the site footer, and the mobile menu and remove or fix every dead link.

## Technical work

Files I'll touch:

- `src/components/settings/preferences-section.tsx`
  - Replace the freeform "Anything else" textarea with a custom-condition chip input ("+ Add your own"). Save to `profiles.conditions` array. Keep a small optional note below.
  - Expand `MODEL_OPTIONS` to include GPT-5, GPT-5 mini, Gemini 2.5 Pro, grouped by speed/depth.

- `src/components/settings/data-section.tsx`
  - Collapse the two big buttons into two small icon buttons (`Download`, `Trash2`) with `aria-label` + tooltip. Keep the dialog flow as-is (it already has DELETE + password + 60-day restore).

- `src/routes/_app/settings.tsx`
  - Re-group sections into ACCOUNT / YOUR HEALTH / PEOPLE / APP / DATA / HELP / ADMIN as above.
  - Move Contact under HELP, Admin into its own gated group.
  - Lazy-load order kept; just regrouped.

- `src/routes/_app/settings.sharing.tsx` & `src/routes/_app/settings.travel.tsx`
  - Wrap each `useQuery` so a server-fn failure renders a friendly inline empty state, not the full-page error boundary.
  - Verify `attachSupabaseAuth` is wired in `src/start.ts`; if not, add it.

- `src/lib/condition-prompts.ts`
  - Helper already exists; just make sure custom-added conditions are merged into the Ask Purple system prompt.

- `src/components/layout/nav-items.ts`, `src/components/layout/site-footer.tsx`, `src/components/layout/sidebar-nav.tsx`
  - Audit every link; remove or fix anything that 404s.

- Mobile, tablet, and desktop layouts all updated (workspace rule).

## Out of scope (will ask first)

- Adding **Grok** or **Maya** — these need an external API key / custom integration, not just a model-name change. Want me to wire that up after we ship the rest, or skip it for now?
- Renaming "Seizure" globally — already gated on the epilepsy condition in earlier rounds; leaving as-is unless you want a different label everywhere.

If you approve, I'll implement in that order: (1) fix the broken Sharing/Travel pages and dead links, (2) custom condition chips + expanded AI models, (3) Settings re-grouping + Apple-style icon buttons for Export/Delete.