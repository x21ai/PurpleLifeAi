## What we're fixing

Your screenshots and message cover 7 distinct things. This plan groups them into shipping order so each piece is testable on its own.

---

### 1. Photos + voice + video on every journal entry

Today `journal_entries.media_urls` (text[]) exists and the `journal-media` storage bucket is already created — they're just not wired into the UI.

- **Capture sheet** (`capture-sheet.tsx`) gets a single "+ Attach" tray with three sources:
  - Photo (camera + library, `accept="image/*"`, capture on mobile)
  - Video (`accept="video/*"`, capture on mobile, 60s soft cap, 50 MB hard cap)
  - Voice clip (uses existing `use-voice-capture` but saves the recording instead of only transcribing — transcript still extracted for AI)
- Uploads go to `journal-media/{user_id}/{entry_id}/{uuid}.{ext}` with signed-URL reads. Bucket stays private.
- `entry-card.tsx` renders an inline media strip: square photo thumbs, video thumb with play overlay, audio waveform pill. Tap → lightbox / inline player.
- Same media tray on the seizure log form (`seizure_events` already has `photo_urls`, `video_url`).

### 2. Inline edit on the journal list (no more route jump)

- Delete the full-screen `/journal/$entryId/edit` route from primary nav.
- Tapping an entry expands it in place: text becomes editable, media tray appears, Save / Cancel pinned to the card. Optimistic update via TanStack Query.
- The `…` menu keeps Archive / Delete.

### 3. App-wide theme + chrome cleanup

- **One theme, one mode.** Today is light, Patterns is light, Ask is dark, the edit sheet was dark — that's the inconsistency you saw. We standardize on the light Oura-style theme for the whole signed-in app. Ask gets a tinted lavender background instead of full dark so it still feels distinct.
- **No site footer inside the app.** `site-footer.tsx` stays on marketing routes only. The `_app` shell already shouldn't render it; we audit and strip the stray Charter/Privacy/Terms/Contact/GitHub row visible at the bottom of Today/Journal/Patterns.
- **Settings duplicates.** The About card on Settings repeats links that already live in the in-app footer. We remove the duplicate footer and keep About as the single source.

### 4. Floating Ask Purple

- Settings → Preferences gets a "Floating Ask button" toggle (default ON on desktop/tablet, OFF on mobile because the bottom nav already has Ask).
- When ON, a small purple chat-bubble FAB appears bottom-right on every `_app` route, opens the Ask sheet without leaving the current page.

### 5. Choose your AI model in Settings

- Settings → AI gets a model picker with three options:
  - Gemini 2.5 Flash (fast, default — via Lovable AI)
  - Gemini 2.5 Pro (deeper reasoning — via Lovable AI)
  - Claude (Sonnet 4.5 — via your existing `ANTHROPIC_API_KEY` secret, since Claude is not on the Lovable AI Gateway)
- Stored on `profiles.ai_model_preference`. `ai-orchestrator` reads it per request and routes to the right provider.

### 6. History import — both conversational AND form

- **Conversational** (primary). You can say "I was on Keppra 500mg twice a day from Jan 2022 to March 2024, switched to Lamictal 100mg since then, and had 3 seizures last summer — June 12, July 3, August 20." Purple parses it, shows a stacked **Confirm card per item** (using the propose/execute pattern we already built), you tick which to save. Past meds get `end_date` filled, archived. Past seizures get `started_at` set to your stated date.
- **Manual form** (backstop) under Settings → Medications → "Add past medication" and Seizures → "Log past event." Both accept arbitrary historical dates.

### 7. Timeline — day / week / month / year + search

New `/timeline` route (added to bottom nav, replacing Patterns? — see Decisions below) showing:

- Date range tabs: Day · Week · Month · Year
- Vertical timeline mixing seizures, journal entries, doses taken/missed, biometric anomalies, alerts
- Search bar across journal text, AI tags, med names, seizure notes (Postgres `tsvector` on a generated `search_doc` column)
- Date jumper (calendar picker → scroll to date)

### 8. "How does the AI know to act?"

This is a question, not a build item — but worth answering in the product. We add a short **"How Purple thinks" page** under Settings explaining:

- Purple reads, never writes silently. Every action (add med, log seizure, archive) is a Confirm card you tap.
- Pattern detection runs nightly: it compares the last 24h against your personal 30-day baseline across 8 signals (sleep, HRV, HR, temp, readiness, stress, cycle, dose adherence). 2+ stacked → gentle nudge. 4+ → "Tell me more" link.
- The chat sees: last 7d biometrics, 14d journal, 90d seizures, current meds, latest risk forecast. Nothing else leaves your device unless you explicitly share.

This page replaces hand-wavy "AI" copy with a concrete contract the user can trust.

---

## Decisions I need from you

1. **Bottom nav slot for /timeline** — do we (a) replace Patterns, (b) replace Ask (since Ask becomes a floating FAB), or (c) keep 5 items and add Timeline as the 6th?
2. **Claude model exact name** — "Claude 4.7" doesn't exist yet; the current Anthropic flagship is **Claude Sonnet 4.5**. OK to use that and label it "Claude (most thoughtful)" in the picker?
3. **Video storage cap** — 50 MB / 60s per clip OK? Higher = more Lovable Cloud storage cost.

---

## Technical details

- **DB migration**: add `profiles.ai_model_preference text default 'gemini-flash'`; add `profiles.floating_ask_enabled boolean default true`; add generated `search_doc tsvector` columns + GIN indexes on `journal_entries`, `seizure_events`, `medications`.
- **Storage policies**: `journal-media` bucket gets per-user read/write policies scoped to `{user_id}/...` path prefix.
- **Edge functions**:
  - `ai-orchestrator`: branch on `profile.ai_model_preference` → Lovable AI Gateway (Gemini) or direct Anthropic call with `ANTHROPIC_API_KEY`. Same tool-calling schema for both.
  - New `journal-media-sign` for short-lived signed URLs on read.
- **New routes**: `/timeline`, `/settings/ai`, `/settings/how-purple-thinks`. Delete `/journal/$entryId/edit`.
- **New components**: `media-tray.tsx`, `media-strip.tsx`, `media-lightbox.tsx`, `ask-fab.tsx`, `history-import-card.tsx`, `timeline-row.tsx`, `date-range-tabs.tsx`.
- **Edits**: `capture-sheet.tsx`, `entry-card.tsx`, `journal.index.tsx` (inline edit), `app-shell.tsx` (footer audit + FAB mount), `chat.tsx` (model badge), `settings.tsx` (remove duplicate About footer, add AI + Floating Ask sections), `seizures.new.tsx` (media tray).
- **Responsive**: every new component checked at 390 (mobile), 768 (tablet), 1280 (desktop) per the workspace rule.

---

## Out of scope (call out, don't build)

- Real-time multi-device sync of in-progress edits
- AI-generated video summaries
- Editing past biometric values
- Push notifications for the gentle nudge (still in-app only)
