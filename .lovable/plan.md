# Multi-provider AI + finish reports redesign

## Goals

1. Route every AI call (report extraction, chat, insights, journal/med classify, recaps, suggestions) through a shared provider layer.
2. Default provider = **Anthropic Claude**.
3. Let each user pick their provider in Settings → AI (Claude / OpenAI / Gemini / Grok / Lovable AI). **Maya** added as a stub, disabled until you give the endpoint.
4. Finish the light-mode metric drilldown polish from the previous turn (light `/biometrics/$metric`, trends list rows, responsive QA).

## 1. Shared AI provider layer

New file `src/lib/ai-provider.server.ts`:
- Exports `getProviderForUser(userId)` → reads `profiles.ai_provider` (new column) with fallback to `'claude'`.
- Exports `callAI({ userId, task, messages, jsonMode, image })` — wraps the AI SDK with `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, OpenAI-compatible adapter for Grok (`https://api.x.ai/v1`), and Lovable Gateway fallback.
- Each provider reads its own key from `process.env` (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY`, `MAYA_API_KEY`, plus existing `LOVABLE_API_KEY`).
- Maya: stubbed to throw `provider_not_configured` until endpoint is supplied.
- Default models per provider (override-able later): Claude `claude-sonnet-4-5`, OpenAI `gpt-5-mini`, Gemini `gemini-2.5-pro`, Grok `grok-4`, Lovable `google/gemini-3-flash-preview`.

## 2. Database

One migration:
- Add `profiles.ai_provider text` with check constraint in `('claude','openai','gemini','grok','maya','lovable')` and default `'claude'`.

## 3. Rewire AI call sites to use the shared layer

Touch these files so they call `callAI(...)` instead of hitting the gateway directly:
- `src/lib/reports.functions.ts` (extraction — keep image/PDF multimodal support, route per user)
- `src/lib/care-chat.functions.ts` and Ask Purple chat endpoint
- `src/lib/insights-patterns.functions.ts`
- `src/lib/journal-classify.functions.ts`, `src/lib/journal-recap.functions.ts`
- `src/lib/med-recognition.functions.ts`, `src/lib/med-intelligence.functions.ts`
- `src/lib/condition-suggestions.functions.ts`, `src/lib/feature-suggestions.functions.ts`
- `src/lib/medical-report.functions.ts`

Keep prompts identical; only swap the transport. Preserve existing error handling (429 / 402) and translate provider errors into the same surface codes.

## 4. Settings UI

New section in `src/routes/_app/settings.tsx` (or `settings.how-purple-thinks.tsx`):
- "AI Provider" card with 6 radio options (Claude default, OpenAI, Gemini, Grok, Maya [disabled], Lovable AI).
- Saves to `profiles.ai_provider` via new server fn `setAiProvider`.
- Small explainer: "Your reports, chat, and insights run on the provider you pick. Keys are stored server-side."

## 5. Finish reports redesign (carryover)

- `src/routes/_app/biometrics.$metric.tsx` → light `MetricShell` treatment matching `/reports/trends/$metricKey`.
- `src/components/reports/trends-section.tsx` → update list rows to match new dark report shell.
- Responsive QA pass on `/reports`, `/reports/new`, `/reports/$reportId`, `/reports/trends/$metricKey`, `/biometrics/$metric` at mobile + desktop.

## 6. Out of scope (this round)

- Maya wiring (waiting on endpoint).
- Per-feature provider override (one provider per user, all features).
- BYO-key (users pasting their own keys).

## Dependencies to install

`@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`. Grok uses the existing `@ai-sdk/openai-compatible` already in the project.

---

Reply **go** to start. I'll do the migration first, wait for approval, then rewire and ship the Settings card.
