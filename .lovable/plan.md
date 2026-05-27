# Purple — Wave 2 Plan: QA, Marketing, Admin, Community

Four workstreams. Each is independent, so we can ship them in order without blocking.

---

## 1) End-to-end QA pass (mobile / tablet / desktop)

**Goal:** every existing route renders cleanly at 375px, 768px, and 1280px, with no console errors, no overflow, no theme mismatches.

**Routes audited:** `/`, `/journal`, `/journal/new`, `/timeline`, `/insights`, `/meds`, `/meds/:id`, `/seizures/new`, `/chat`, `/settings`, `/settings/how-purple-thinks`, `/biometrics`, `/vitals`, `/my-health`, `/charter`, `/privacy`, `/terms`, `/welcome`, `/sign-in`, `/reset-password`.

**Checks per route:**
- Layout: no horizontal scroll, tap targets ≥ 44px, bottom-nav clearance (`pb-24` on mobile).
- Theme: only semantic tokens (`bg-background`, `text-foreground`, …) — no stray `bg-white` / `text-black`.
- Empty / loading / error states present.
- Forms validate and submit; toasts fire.
- Browser/console errors captured and fixed.

**Functional flows tested end-to-end** (preview browser):
1. Sign up → onboarding → first journal entry (text + photo + voice + video ≤50 MB/60 s).
2. Log a seizure (with backdating) → see it on Timeline within filter.
3. Add a medication → mark dose taken → adherence updates.
4. Ask Purple a question via FAB → response renders → "How Purple thinks" link works.
5. Settings: change AI model, toggle floating Ask, switch to "How Purple thinks".
6. Timeline: Day/Week/Month/Year filter + search.

Fixes done inline as found. Final deliverable: short report of what was checked + what was fixed.

---

## 2) Public marketing site + sign-up funnel

Currently the app is auth-gated end-to-end. We'll add a public surface.

**New public routes** (outside `_authenticated`):
- `/` becomes the marketing home (hero, problem, how Purple helps, screenshots, testimonials placeholder, CTA).
- `/features` — media journal, AI patterns, timeline, meds, biometrics.
- `/how-it-works` — 3-step explainer.
- `/pricing` — single free tier for now (placeholder for future).
- `/about` — mission, who it's for (people with epilepsy + caregivers).
- `/contact` — simple form → stored in `contact_messages` table.

Authenticated app moves under `/app` (Today/Journal/Timeline/etc. all reparent). Sign-in stays at `/sign-in`, sign-up gets a dedicated `/sign-up` page linked from every marketing CTA.

Each route gets its own `head()` with title/description/og:title/og:description (per project SEO rules). Single H1, semantic HTML, alt text on all images. Sitemap + robots.txt updated.

**Design direction:** matches existing in-app aesthetic (serif headings, warm palette, calm tone) so the transition into the app feels seamless.

---

## 3) Super-admin console

**Roles:** create `app_role` enum (`user`, `admin`, `super_admin`) and a `user_roles` table with the security-definer `has_role()` pattern (per project rules — never store roles on `profiles`).

**New route group:** `/admin/*` gated by `has_role(auth.uid(), 'super_admin')` in `beforeLoad`.
- `/admin` — dashboard (total users, active last 7d, seizures logged, journal entries, signups chart).
- `/admin/users` — searchable table; view profile, recent activity, suspend, reset password.
- `/admin/messages` — broadcast or 1:1 message to users (stored in new `admin_messages` table; user sees it as a banner on Today + in a new `/inbox` route).
- `/admin/contact` — inbound `/contact` form submissions.
- `/admin/feedback` — feedback inbox (new `feedback` table; "Send feedback" link in user Settings).

**Migrations:** `user_roles`, `admin_messages`, `admin_message_recipients`, `contact_messages`, `feedback`. All with RLS + GRANTs.

Server functions (`createServerFn` + `requireSupabaseAuth` + role check in handler) for every admin read/write. No client-side admin checks.

---

## 4) Community hub

**Goal:** safe space for people with epilepsy + caregivers to talk, share, and find resources. Moderated, not anonymous-by-default, opt-in.

**New routes** (in-app, behind auth, behind a "Join community" opt-in in Settings):
- `/community` — feed of recent posts, filterable by topic (Seizures, Meds, Triggers, Caregiving, Wins, Questions).
- `/community/new` — compose post (text + optional photo, no medical-advice disclaimer at top).
- `/community/:postId` — post + threaded comments + reactions (❤️ 🤝 💡).
- `/community/resources` — curated resource library (epilepsy foundations, hotlines, research summaries — seeded from existing `research_sources`).
- `/community/profile/:userId` — public-facing display name + bio + post history (everything user opts to show).

**Safety:**
- Reports → `community_reports` table → surfaced in `/admin/community`.
- Auto-flag for crisis keywords ("suicide", "overdose") with immediate resource banner.
- "Not medical advice" disclaimer on every post.
- Block / mute per user.

**Migrations:** `community_posts`, `community_comments`, `community_reactions`, `community_reports`, `community_blocks`, plus `community_display_name` + `community_bio` + `community_opted_in` on `profiles`.

---

## Sequencing

1. **QA pass** (fast, no schema) — fix what's broken before adding surface area.
2. **Marketing site + `/app` reparent** — biggest structural change; do it before admin/community so new routes nest cleanly.
3. **Super admin** — needed to moderate community, so ships before community goes live.
4. **Community** — last, builds on roles + admin moderation.

## Technical notes

- All server-side reads/writes use `createServerFn` (not Edge Functions).
- Roles via `has_role()` security-definer function — never queried from client without the function.
- Every new public-schema table gets explicit GRANTs in the migration.
- Marketing routes use relative canonicals (no project URL hardcoded).
- Admin messages + community posts trigger realtime channels for live updates.
- Custom instruction respected: every UI change verified at mobile / tablet / desktop.

---

## Open questions before I start

1. **Scope for this round** — all four workstreams, or start with QA + marketing and queue admin + community for next wave? (Community especially is a big surface.)
2. **Marketing home** — do you want me to ask the visual-design questions (palette / typography / layout) for the public site, or keep it visually identical to the in-app aesthetic?
3. **Admin access** — who's the first super_admin? I can either (a) seed your user ID directly in the migration if you tell me the email, or (b) build a one-time "claim super admin" page that the very first signup can use.
4. **Community** — public posts visible to logged-out visitors (better for SEO + growth), or members-only (safer, more intimate)?