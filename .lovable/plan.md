## Smoke test — findings

I navigated every primary surface logged in as your account (mobile 390×844) and cross-checked the DB. Good news first: **no mock or seeded data is being shown anywhere**. The numbers on Patterns (5h 13m sleep, HRV 18, RHR 62) are real — 184 rows in `biometrics` from your connected Oura. The `mock/sample` grep only matched the email preview route (intended). `/settings/travel` and `/settings/sharing` now load correctly.

### Bugs found (ranked)

**1. "Heart health" really did get saved — but to the wrong column (HIGH)**
Your profile in the DB has `conditions: []` and `conditions_note: "Heart Health"`. That value came from the old onboarding (`welcome.tsx`) which writes free text into `profiles.conditions_note`. The new Settings chip UI only reads/writes `profiles.conditions` (array), so anything already in `conditions_note` is invisible and uneditable from Settings. That's why it "didn't save" from your point of view.

**2. Account section lost the signed-in email (MEDIUM)**
Settings → Account now shows just a "Sign out" button. The "Signed in as pmt@eigital.com" line you referenced earlier was removed in the IA reshuffle.

**3. Grok missing from AI models (MEDIUM)**
You asked for ChatGPT, Claude, Grok, and Maya. Current options are Gemini Flash, GPT‑5 mini, Claude Sonnet, Gemini Pro, GPT‑5, Gemini 2.5 Pro. Grok is not wired. "Maya" needs a definition before I add it — see Question.

**4. Journal entry shows AI text where user text should be (HIGH)**
Latest entry renders: *"I don't see a journal entry provided to analyze. I'm ready to help structure any entry you'd like to share."* That's the model's reply leaking into the visible `text`/`ai_summary` field. Likely the `journal-analyze` server fn writes the assistant message back into `journal_entries.text` (or `ai_summary` is rendered as content) when the original capture is empty.

**5. AI model `SelectContent` uses plain `<div>` wrappers (LOW)**
`preferences-section.tsx` wraps each group in `<div>` instead of Radix `SelectGroup` + `SelectLabel`. Dropdown opens, but on first paint the trigger occasionally renders blank (saw it once) and screen readers don't get group semantics.

**6. SSR hydration mismatch on `<html className="dark">` (LOW)**
`__root.tsx` ships `className="dark"` server-side but the client root toggles theme classes, causing the React hydration warning in console on every load.

**7. PWA `manifest.json` 401 (LOW)**
Manifest fetch is gated behind auth in the preview, so the "Add to home screen" prompt that the Today banner advertises actually fails on first visit.

**8. `DialogContent` missing `aria-describedby` (LOW, a11y)**
Several dialogs (settings sections, journal new) trigger the Radix warning.

### Non-issues
- `/settings/travel`, `/settings/sharing`, `/settings/how-purple-thinks` — all render.
- `/journal`, `/meds`, `/insights`, `/chat`, `/today`, `/settings` — all reachable.
- Tokens: Oura connected (2 rows), Whoop none — UI honors this.

---

## Plan — fixes I propose (one batch)

1. **Migrate + merge `conditions_note` into `conditions[]`**
   - In `preferences-section.tsx` load path: if `conditions_note` is non‑empty, split on commas/semicolons, append unique values into the chips state, then write back `{ conditions: merged, conditions_note: null }` so the legacy column is drained the first time you open Settings. Your "Heart Health" will appear as a chip immediately.
   - Same merge in `welcome.tsx` save path going forward: free‑text entries get parsed into chips on submit; stop writing `conditions_note`.

2. **Re-add "Signed in as <email>" in Account**
   - Pull `session.user.email` and render under the Account heading, above Sign out. Apple-tight: muted-foreground, small caps eyebrow already used elsewhere.

3. **Add Grok + clarify "Maya"**
   - Add `xai/grok-4-fast-reasoning` under Balanced (the gateway supports it).
   - Need your confirmation on what Maya means — see Question.

4. **Fix journal entry showing AI text**
   - In the journal-analyze server fn (and `journal.new.tsx`), stop writing assistant output into `text`. AI summary goes into `ai_summary` only; the list card renders `text` (or transcript) and falls back to "Voice note" / "Photo entry" when those are empty, never the model reply.
   - Backfill: one-shot SQL to null out `ai_summary` rows that start with "I don't see a journal entry" pattern so the list cleans up.

5. **Polish (same batch)**
   - Replace the `<div>` wrappers in the AI model `SelectContent` with `SelectGroup` + `SelectLabel`.
   - Move the `dark` class from server `<html>` to a client-only `useEffect` to kill the hydration warning.
   - Add `aria-describedby` (or `<DialogDescription className="sr-only">`) to the dialogs that warn.
   - Make `manifest.json` publicly readable so the "Add to home screen" banner actually works.

6. **Verify**
   - Re-run the same route sweep on mobile + desktop, confirm the conditions chip shows "Heart Health", the email is visible, Grok appears, the journal card no longer shows assistant text, and no hydration warning fires.

### Out of scope (call out, don't touch)
- Sharing invite/accept end-to-end (no second account available in preview).
- Travel schedule generation (no trip created yet — needs you to add one to test live).

---

## Question before I implement

**What is "Maya"?** It came up as a model name from another Lovable project. Options:
- (a) Maya = a named persona that wraps an existing model (e.g. Claude Sonnet with a warm system prompt) — I add it as a UI option that maps to that model.
- (b) Maya = a specific third-party model not in the Lovable AI Gateway — needs an API key (Anthropic/xAI/etc.) and I'll ask for it.
- (c) Skip Maya for now.
