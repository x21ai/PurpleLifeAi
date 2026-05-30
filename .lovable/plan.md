# Phased Completion Plan

We'll do this in 3 phases. After each phase I'll stop, we verify, then move to the next.

---

## Phase 1 — True phone alarms (push notifications)

**Goal:** Medication reminders fire even when the app is closed or the screen is off.

**Approach:** Web Push (works on installed PWA across iOS 16.4+, Android, desktop). No app-store submission needed. If you later want native iOS/Android, we wrap with Capacitor — but Web Push covers 95% of the need now.

**What I'll build:**
1. PWA manifest + service worker (`/sw.js`) registered on app load
2. "Enable notifications" prompt in Settings → Reminders
3. Server function `subscribe_push` storing VAPID subscription per user/device in a new `push_subscriptions` table
4. Server function `schedule_dose_reminder` + a cron-triggered route `/api/public/cron/dose-reminders` that runs every minute, finds doses due in the next 1 min, and sends a push via Web Push API
5. Service worker handles the push → shows native OS notification with "Taken / Snooze 10m" actions
6. Add `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` secrets (I'll request them via add_secret)
7. Install-to-home-screen banner so users get the PWA experience

**Stop & verify:** Install PWA on your phone, set a reminder 2 min out, lock phone, confirm notification fires.

---

## Phase 2 — Full QA pass

I'll execute the test plan via the browser tool + targeted code reads, on mobile (473px), tablet (768px), and desktop (1280px) viewports:

1. **Auth** — signup, email confirm, login, Google OAuth, logout
2. **Meds** — create / edit / delete med, schedule, mark dose taken/missed, adherence %
3. **Reports** — upload PDF + JPG, parse, view single report, upload 2nd same-type → verify trend graph, supplement suggestions, medical disclaimer visible
4. **Care sharing** — invite, accept, scope enforcement, invite_token cleared post-accept
5. **Travel/timezone** — change tz, verify dose times shift
6. **Journal + AI memory** — write entry, verify processing, semantic recall
7. **Phone alarms (Phase 1)** — end-to-end push fires
8. **Security** — re-run security scan, confirm 0 findings, run DB linter
9. **Responsive** — every screen at 3 viewports
10. **Console/network** — zero errors on each route

Output: a checklist with pass/fail and any bugs I fix inline.

---

## Phase 3 — HIPAA hardening (production posture)

**What's already in place:** PHI access logging, owner checks, RLS on all PHI tables, invite-token clearing, realtime scoping, email rate limits, medical disclaimers, encrypted-at-rest storage.

**What's missing for true HIPAA compliance:**
1. **Audit log UI** — user-facing page at `/settings/audit` showing who accessed their PHI, when, from where
2. **Data export** — "Download all my data" (JSON + files zip) — required under HIPAA right of access
3. **Account deletion with PHI purge** — hard delete + cascade, with 30-day grace
4. **Session timeout** — auto-logout after 15 min idle (configurable)
5. **Failed-login lockout** — 5 attempts → 15 min lock (HIPAA technical safeguard)
6. **Encryption-at-rest disclosure** + privacy policy + Terms of Service pages
7. **Breach notification email infrastructure** — admin tool to notify affected users
8. **BAA reminder** — banner in admin settings: "Signed BAA required with Lovable Cloud/Supabase before going live with real PHI" + link to request one

**Out of scope** (requires your action, not code):
- Signing BAA with Supabase (paid plan required)
- HIPAA risk assessment documentation
- Staff training records
- Physical safeguards (your laptop, etc.)

---

## Order of operations

```
Phase 1 (push alarms)  →  you test on phone  →  approve
Phase 2 (QA pass)      →  I report findings  →  fix bugs  →  approve
Phase 3 (HIPAA)        →  you review legal items  →  publish
```

Reply "approve" and I'll start Phase 1.
