# Finish the outstanding items

Two things left from the original plan:

## 1. Rewire remaining AI callers to `callAIForUser`

These files still hit the Lovable Gateway directly. Migrate each to the shared multi-provider router (same pattern already used in `reports.functions.ts`, `journal-classify.functions.ts`, `food.server.ts`, `med-recognition.server.ts`):

- `src/lib/care-chat.functions.ts` — caregiver chat
- `src/lib/insights-patterns.functions.ts` — pattern detection
- `src/lib/journal-recap.functions.ts` — weekly recap
- `src/lib/med-intelligence.functions.ts` — med interaction cards
- `src/lib/condition-suggestions.functions.ts` — onboarding condition picker assist
- `src/lib/feature-suggestions.functions.ts` — admin feature triage
- `src/lib/medical-report.functions.ts` — narrative report generation

Rules per file:
- Preserve prompts verbatim.
- Pass `supabase` + `userId` from the auth middleware context into `callAIForUser`.
- Keep existing JSON/Zod parse paths; switch tool-calling to JSON mode where the provider router doesn't support tools.
- Preserve 429/402 error surfaces.

Background processors (`journal-processor`, `risk-forecaster`) stay on fixed models — they're system jobs, not user-facing.

## 2. Trends list rows polish

- `src/components/reports/trends-section.tsx` — update the list rows to match the dark report shell already shipped on `/reports/$reportId` (token + spacing parity, no new behavior).

## Skipped (already noted in plan as out of scope)

- Maya endpoint — still waiting on URL/auth from you.
- Ask Purple chat (`supabase/functions/ai-orchestrator`) — already provider-aware via `ai_model_preference` mapping shipped earlier; full AI-SDK rewrite would be a separate task.
- Responsive QA pass — manual verification, will call out anything that needs a follow-up after the rewires.

Reply **go** and I'll ship it.
