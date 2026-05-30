## What's actually wrong

**1. Google button text is invisible** — `social-sign-in-buttons.tsx:84` uses `text-foreground` on a `bg-white` button. On the dark sign-in page, `--foreground` is near-white, so white-on-white. Apple button is fine because it correctly uses `text-black`.

**2. Sign-in order is backwards** — `sign-in.tsx:192-203` renders `<SocialSignInButtons />` first, then an "or continue with email" divider, then the email form. Apple's pattern (Health, iCloud, App Store sign-in sheets) is the opposite: the primary credential form is up top, alternate identity providers sit beneath a divider as "Other ways to sign in."

**3. Settings links** — every route the page links to exists in `src/routes/` (`/meds`, `/settings/sharing`, `/settings/travel`, `/reports`, `/community`, `/contact`, `/admin`, `/seizures/new`). The earlier "nothing happens on Travel mode" was a stale SSR/HMR error in `push.functions.ts` that crashed the whole `_app/settings` route — that one was cleared by restarting the dev server in the previous turn. I have not, however, hand-clicked every link in the current build. The user is right that I should — that's part of this plan.

**4. Slow loading** — `_app/settings.tsx` eagerly imports `OuraConnection`, `DataSection`, `AboutSection`, `PreferencesSection`, `PhoneAlarmsSection`, plus the auth context fetch + a `profiles.conditions` read, all on first paint. Every section ships its own data hooks. Settings is below-the-fold for most of these, so they should code-split.

## What I'll change

### A. Sign-in screen — Apple-style order + fix Google
- Move `<SocialSignInButtons />` **below** the email/password form.
- The first thing under the headline becomes: tabs (Sign in / Create account) → email → password → Sign in button → "Forgot password?"
- Below that: a thin divider with the label **"Or use another account"** (not "or continue with email" — that label only makes sense when social is on top).
- The social block keeps Apple + Google but with the helper line **"Quick sign-in with"** instead of "Sign in with the account you already have."
- Force both social buttons to `text-black` (and remove the misleading `text-foreground` on Google). Match Apple's exact treatment so they read identically on dark and light themes.

### B. Settings link audit — click every row end-to-end
On mobile viewport (390×715), with the dev sandbox open, walk each row in `/settings`, click it, confirm the destination renders, then come back. Specifically:

```
/settings → /meds                 (Medications card + Old medications card)
/settings → /settings/sharing     (Sharing & access)
/settings → /settings/travel      (Travel mode)
/settings → /reports              (Lab reports)
/settings → /community            (Community)
/settings → /contact              (Contact the team)
/settings → /admin                (only if admin)
/settings → /seizures/new         (Past episodes, only if seizure user)
/settings → /settings/how-purple-thinks (How Purple thinks row in Preferences)
About section → /charter, /privacy, GitHub external link
Data section → Export everything (downloads zip), Delete everything (opens type-to-confirm)
Phone alarms → Enable phone alarms
Connections → Oura Sync / Disconnect / Auto-sync select
```

For any link that fails to navigate, I'll trace whether it's:
- a wrong `to=` path (fix the prop),
- a missing route file (create it or remove the link),
- a click intercept from the bottom dock / overlay sheet (fix z-index or pointer-events),
- a runtime error that swallows the click (fix the underlying error).

I'll report each row's status in the closing summary, not just say "audited."

### C. Settings page perf — lazy-load heavy sections
The first paint only needs the heading, Account card, and the main link list. Everything from Appearance downward (Phone alarms, Preferences, Data, About) loads via `React.lazy` + `<Suspense>` with a small skeleton. This:
- gets the link cards on screen and tappable in one render,
- removes the OneSignal / push subscription probe from blocking initial paint,
- removes the Lovable AI model fetch and Oura status fetch from the critical path.

The `profiles.conditions` fetch in `SettingsPage` stays (it gates the "Past episodes" link visibility) but moves into a `useQuery` so it's not blocking and gets cached for the rest of the session.

### D. Done across mobile + tablet + desktop
Per workspace rules, the sign-in reorder and Settings audit are verified at 390px, 768px, and 1280px viewports before I close out.

## Out of scope
- I'm not redesigning the sign-in hero, copy, or branding — only the form/social order and the Google text color.
- I'm not changing what each Settings row links to or how each destination page works (Sharing, Travel, Reports, etc. — those landed in previous turns). Only making sure the links actually work and the page feels fast.
- Soft-delete, restore banner, condition gating, and Trip Banner CTAs from the previous turns stay as they are.
