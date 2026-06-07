
# Ask Purple → AI SDK rewrite + what's left

## What's left overall

1. **Ask Purple full AI-SDK rewrite** (this plan) — replace the `ai-orchestrator` Edge Function chat path with a TanStack streaming server route using the AI SDK, real tool calling, and provider routing through Lovable AI Gateway.
2. **Maya provider** — still blocked on you sharing endpoint URL + auth scheme.
3. **Responsive QA pass** — quick visual sweep of `/reports`, `/reports/$id`, `/biometrics/$metric` on mobile widths after the rewrite lands. No code unless something breaks.

Everything else from the prior plan (provider routing for `care-chat`, `insights-patterns`, `journal-recap`, `med-intelligence`, `condition-suggestions`, `feature-suggestions`, `medical-report`, trends-list polish) is done.

---

## Ask Purple rewrite

### Goals
- Stream replies token-by-token via AI SDK (`useChat` + `streamText`).
- Preserve the "propose action → confirm card" flow (no silent writes).
- Honor the user's `ai_provider` choice (Claude / Gemini / GPT-5 / Lovable default) through Lovable AI Gateway with one unified code path.
- Keep all the existing grounded tools (journal memory, biometrics, seizures, adherence, today's risk, research library).
- Keep system prompt + condition-awareness identical.
- No new persistence — chat stays in-memory per session (matches current UX). Flag for future if you want history.

### Architecture

```text
src/routes/_app/chat.tsx          ← uses @ai-sdk/react useChat, DefaultChatTransport
src/routes/api/chat.ts            ← streamText, tools, stopWhen, toUIMessageStreamResponse
src/lib/ai-gateway.server.ts      ← already exists (shared Lovable Gateway provider)
src/lib/purple-chat-tools.server.ts  (new)  ← tool definitions + execute() handlers
src/lib/purple-chat-prompt.server.ts (new)  ← SYSTEM_PROMPT + condition prelude builder
```

The existing `supabase/functions/ai-orchestrator/index.ts` stays only for its non-chat duty:
- `extract_behaviors_from_text` (service-role only, called by journal-processor).
- `execute_action` migrates to a `createServerFn` (`src/lib/purple-actions.functions.ts`) called from the confirm card — no need to keep that path on the Edge Function once chat moves.

### Tools (AI SDK `tool({ inputSchema, execute })`)
Ported 1:1 from the orchestrator's `runTool`, using Zod input schemas:
- `searchJournalMemory` (server-side embedding via existing OpenAI call, then `match_ai_memory` RPC)
- `getRecentBiometrics`
- `getSeizureEvents`
- `getMedicationAdherence`
- `getTodaysRisk`
- `searchResearchLibrary`
- `proposeAction` — `needsApproval: true`. Returns a structured proposal part; the client renders the existing `ActionConfirmCard`. Execution runs through the new `executePurpleAction` server fn, not as a tool result.

`stopWhen: stepCountIs(50)`.

### Provider routing
Inside the chat route, read the auth'd user's `profiles.ai_provider` (fallback `ai_model_preference`) and map to a Gateway model id:

| `ai_provider` | Model passed to gateway |
| --- | --- |
| `claude` | `anthropic/claude-sonnet-4-5` |
| `openai` | `openai/gpt-5-mini` |
| `gemini` (default) | `google/gemini-3-flash-preview` |
| `grok` | `xai/grok-...` (or fallback if not on gateway) |
| `lovable` | `google/gemini-3-flash-preview` |
| `maya` | fallback to gemini until endpoint is provided |

One code path, one set of tools — AI SDK handles tool calling uniformly across providers that support it. Gemini Flash supports tools, so the previous "no tools on Gemini" limitation goes away.

### Client (`src/routes/_app/chat.tsx`)
- Replace `useState<Msg[]>` + manual `supabase.functions.invoke` with `useChat({ id, transport: new DefaultChatTransport({ api: "/api/chat" }) })`.
- Render `message.parts`:
  - `text` parts → existing `Bubble` with `ReactMarkdown`.
  - `tool-proposeAction` part in `input-available` state → `ActionConfirmCard`. On confirm, call new `executePurpleAction` server fn and mark the part resolved via `addToolResult` (so the model sees the outcome if user keeps chatting).
- Keep mic, suggestion chips, follow-up chips, empty state — pure UI, no API change.
- Disable submit while `status === 'submitted' | 'streaming'`. Keep textarea focused after send / stream end.
- Surface 429 / 402 / generic errors via toast (same wording as today).

### Server fn for confirm
`src/lib/purple-actions.functions.ts` — `executePurpleAction` server fn, `requireSupabaseAuth` middleware, Zod-validated proposal, same logic as the orchestrator's `executeAction`. Confirm card calls this directly instead of round-tripping through the Edge Function.

### Edge Function cleanup
- Remove the chat + execute_action branches from `supabase/functions/ai-orchestrator/index.ts`.
- Keep `extract_behaviors_from_text` (background processor still calls it).
- Rename internally / leave name as-is (callers in journal-processor unchanged).

### Verification
- `/chat`: ask "how did I sleep this week?" → streams, calls `getRecentBiometrics`.
- "Add melatonin 5mg at 22:00" → proposal card appears, confirm writes a medication, follow-up message acknowledges.
- Switch provider in Settings → Gemini → ask same question → still streams + uses tools.
- Reload page → conversation clears (matches today's behavior, no regression).
- Network tab: single POST to `/api/chat`, SSE response, no Edge Function call for chat path.

### Out of scope (call out before starting if you want them in)
- Persisting conversations / thread list.
- Resumable streams.
- Maya provider wiring.
- Voice streaming changes (mic flow stays as-is).
