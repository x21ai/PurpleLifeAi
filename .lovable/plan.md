
## Step 1 — Connect this Lovable project to `AstroAii/purpledrw` (you do this, not me)

I can't perform the GitHub link from inside the agent — it's an OAuth flow that has to happen in your browser. Walk through:

**Desktop**
1. In the Lovable editor, click the **Plus (+)** button at the bottom-left of the chat input.
2. Choose **GitHub → Connect project**.
3. Authorize the Lovable GitHub App if you haven't before. Pick the **AstroAii** account/org when prompted.
4. Lovable will offer to **Create Repository**. Since `AstroAii/purpledrw` already exists, this is the awkward part:
   - Lovable's GitHub integration **creates a new repo from the Lovable project**. It does **not** import an existing GitHub repo into Lovable.
   - So you have three realistic options:
     - **(a) Let Lovable create a new repo** (e.g. `purpledrw-lovable`) and treat *that* as the source of truth going forward. Archive the old `AstroAii/purpledrw` or merge its history manually.
     - **(b) Keep `AstroAii/purpledrw` as source of truth**, do not connect Lovable to GitHub, and instead manually port the three PRs' changes into Lovable (I can do this — see "Alternative" below).
     - **(c)** Connect, let Lovable make `AstroAii/purpledrw-lovable`, then push your old repo's history into it as a separate branch and cherry-pick. This is a manual git operation on your machine.

Once connected (option a or c), the sync is **bidirectional and automatic** — future merges to `main` on GitHub flow into Lovable in real time, and vice versa. No manual "pull" needed.

**Mobile:** Plus (+) → GitHub → same flow.

→ **Tell me which option (a/b/c) you want, and confirm when the repo is linked.** I'll wait.

## Step 2 — Apply pending migrations

Nothing for me to do manually. Any file under `supabase/migrations/` is applied to Lovable Cloud automatically on commit. After GitHub sync lands, I'll:
- List `supabase/migrations/` and report what's present.
- Run `supabase--linter` and a quick `read_query` against `information_schema.tables` to confirm new tables (e.g. `research_sources`) exist.

## Step 3 — Redeploy edge functions

`ai-orchestrator` and `med-dose-action` redeploy automatically on file change, but I'll force a clean redeploy via `supabase--deploy_edge_functions` for both, then pull recent logs to confirm no boot errors.

## Step 4 — Verify `research_sources` row count

Run:
```sql
select count(*) from research_sources;
```
via `supabase--read_query` and report the number back. Expected ≈ 30.

> Note: per your instruction we're **skipping the seed run** (step 3 of your original list). If the table comes back with 0 rows after the GitHub sync, I'll flag it and ask whether to run `bun run seed:research` from the sandbox — that needs `OPENAI_API_KEY` (already a project secret) and the service role (also set).

## Step 5 — Smoke test ai-orchestrator with curl

Call the deployed function with:
```json
{ "message": "what does the research say about levetiracetam" }
```
via `supabase--curl_edge_functions` (auth will use my preview session). Report:
- HTTP status
- The assistant text
- Whether the response includes `citations` / `sources` / tool-call evidence of `search_research_library`

If citations are missing, pull `supabase--edge_function_logs` for `ai-orchestrator` filtered by `search_research_library` to diagnose whether the tool was registered, called, or returned empty.

## Alternative if you pick option (b) above

I port the three PRs' contents from `AstroAii/purpledrw` into Lovable by hand. You'd need to either (i) paste the diffs / file contents into chat, or (ii) push the repo to a public location so I can fetch raw files. Then I'd run the same verification (steps 4 & 5). Say the word and I'll switch to this plan.

---

**Waiting on you:** pick option **a / b / c** for the GitHub linkage, then confirm when ready. Once you say go, I'll execute steps 2 → 5 in one pass.
