# TestFlight beta feedback (screenshot, ASC, Luciq)

How Purple collects and triages TestFlight tester feedback. Agent runbook pairs with
`.cursor/rules/flutter-testflight-observability.mdc`.

## "Share Beta Feedback..." from screenshots

When a tester takes a screenshot **while a TestFlight beta app is in the foreground**,
iOS shows a thumbnail, then after Markup → **Done**, a **Share Beta Feedback...**
option (speech-bubble icon) can appear alongside Save to Photos, Save to Files, etc.

### Requirements (Apple)

| Requirement | Detail |
|-------------|--------|
| **TestFlight app** | **2.3 or later** on iPhone/iPad ([ASC help](https://developer.apple.com/help/app-store-connect/test-a-beta-version/view-tester-feedback/)) |
| **iOS/iPadOS** | Screenshot-in-app feedback needs a supported iOS version with TestFlight 2.3+. Apple states testers on **"earlier versions of iOS"** (pre-screenshot era) must use the **Feedback Email** from Test Information instead ([TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)). Practical floor: **iOS 14+** with current TestFlight; **iOS 13 and below** → email-only path. |
| **Beta app foreground** | Screenshot must be taken inside the **TestFlight-installed** app (TestFlight badge visible). Screenshots from other apps do not offer Share Beta Feedback. |
| **Developer opt-in** | ASC → TestFlight → group → Settings → **Tester Feedback** must be **Enabled**. Developer can disable in-app screenshot feedback per group. |
| **Internal vs external** | **No difference.** Both internal and external testers get the same screenshot flow when the above conditions are met. |

### Why some testers do NOT see "Share Beta Feedback"

Most common causes (not internal-vs-external gating):

1. **Outdated TestFlight app** (< 2.3) — update TestFlight from the App Store.
2. **Older iOS** — screenshot feedback unavailable; use TestFlight app → Send Beta Feedback (email).
3. **Feedback disabled for their group** — ASC group setting; or tester is in **multiple groups** and **any one** has feedback disabled (Apple FAQ: they can only submit via TestFlight app email).
4. **Screenshot not taken inside the beta app** — home screen, Settings, or another app will not show the option.
5. **Skipped Markup flow** — tap thumbnail → optionally Markup → **Done**; Share Beta Feedback appears on the share sheet after Done (sometimes also in the Markup share row on newer iOS).

**iOS 26 beta:** Operators on current iOS + TestFlight betas see Share Beta Feedback reliably (matches user report at 14:03 with TestFlight badge). Testers on iOS 17/18 stable with an old TestFlight build are the usual gap.

### Alternatives when screenshot feedback is unavailable

Tell external testers to use **any** of these (document in release notes / Founding Team onboarding):

| Method | Steps |
|--------|--------|
| **TestFlight app** | Open **TestFlight** → **Purple for Life** → **Send Beta Feedback** → add comment, optionally attach screenshot from Photos. Works on all supported iOS versions; email goes to ASC Feedback Email in Test Information. |
| **Luciq shake report** | Shake device while Purple is open (TF16+ with `LUCIQ_APP_TOKEN`). Opens in-app bug report with optional screenshot. Crashes upload on **next launch**. |
| **ASC Feedback Email** | Email address configured in ASC → TestFlight → Test Information → **Feedback Email** (visible to testers on legacy paths). |
| **Contact page** | `https://www.purplelife.org/contact` for non-crash product feedback (not wired into ASC pipeline). |

**Recommended external group minimum:** **iOS 16+** and latest **TestFlight** from the App Store, so screenshot and in-app paths align with Apple's current TestFlight docs.

## Agent access (ASC API)

```bash
doppler run --project purple-life --config prd -- bun run ios:check-tf-feedback
# ASC only:
doppler run --project purple-life --config prd -- node scripts/asc-list-testflight-feedback.mjs
```

Endpoints: `betaFeedbackScreenshotSubmissions`, `betaFeedbackCrashSubmissions` (app Apple ID `6787298041`).

**2026-07-06 snapshot:** 18 screenshot submissions (mostly `a@arora.net`), **0** crash-log submissions via ASC API. Screenshot feedback does not always attach symbolicated crash logs (`tf-crash-report` in `docs/OPEN-ISSUES.md`).

## Luciq (crashes + shake)

Dashboard: **Flutter - Purple - Beta** (`flutter-purple` slug, mode `beta`). Capacitor-era iOS app: `purple` slug.

Agent triage: Luciq MCP `list_crashes`, `list_bugs` (REST API returns 401 for MCP token; expected).

**2026-07-06 TF21:** Luciq MCP returns **zero open crashes** and **zero bugs** for both `flutter-purple` and `purple` beta apps.

See `mem/observability/crash-reporting.md`.

## Triage workflow (every TestFlight build)

1. After ASC build **VALID**: `bun run ios:check-tf-feedback` + Luciq MCP for new crashes since prior build.
2. Map ASC comments to `docs/OPEN-ISSUES.md` or fix in-tree.
3. Do not mark build "ready for wider external" until P0 feedback and new crash regressions are addressed or explicitly deferred in OPEN-ISSUES.
