# Overnight verification report

Generated on the fully stacked tip of `cursor/overnight-verification-f977` (PRs 1–11 of the hardening pass).

## Stack merge order

Merge **bottom to top**. PRs #14–#19 (Devyn stack) remain **draft** on GitHub; merge those first when marked ready, then merge #20–#30.

| # | Branch | PR |
|---|--------|-----|
| 14–19 | `cursor/launch-decisions-f977` … `cursor/devyn-gaps-f977` | #14–#19 (draft) |
| 20 | `cursor/travel-tz-banner-f977` | #20 |
| 21 | `cursor/security-hardening-f977` | #21 |
| 22 | `cursor/clinical-tests-f977` | #22 |
| 23 | `cursor/native-dialogs-f977` | #23 |
| 24 | `cursor/a11y-pass-f977` | #24 |
| 25 | `cursor/empty-states-f977` | #25 |
| 26 | `cursor/i18n-completeness-f977` | (open on push) |
| 27 | `cursor/seo-metadata-f977` | (open on push) |
| 28 | `cursor/format-lint-f977` | (open on push) |
| 29 | `cursor/docs-launch-f977` | (open on push) |
| 30 | `cursor/overnight-verification-f977` | (this report) |

## Verification suite (2026-06-12)

| Suite | Result |
|-------|--------|
| `check:em-dash` | Pass |
| `check:i18n-es` | Pass (354 en/es keys, 273 used ids) |
| `check:live-data` | Pass |
| `check:unique-images` | Pass (17 assets) |
| `lint` | Pass (0 errors, 197 warnings) |
| Unit tests | **33 / 33** pass |
| `tsc --noEmit` | Pass |
| `build` | Pass |
| `check:entry-budget` | Pass (246119 B gzipped, budget 269000) |
| E2E routes-smoke (5 viewports) | **80 / 80** pass |
| Axe smoke (8 routes, warn-only) | **8 / 8** pass; color-contrast findings logged |

## Unit test count

| Before hardening pass | After |
|----------------------|-------|
| 10 tests (timezone only) | **33 tests** (+ travel banner, Oura mapping, adherence, snooze, travel scheduler) |

## Axe findings (warn-only, not fixed in this PR)

Primary violation: **color-contrast (serious)** on authenticated routes when logged out (redirect pages still render shell chrome). Counts per route on mobile-375: `/` 0, `/sign-in` 0, `/today` 7, `/journal` 5, `/meds` 7, `/timeline` 8, `/insights` 38, `/biometrics` 17.

## es.json coverage

354 keys parity with en.json; CI gate `bun run check:i18n-es` enforces completeness for 273 dynamically resolved used ids.

## Human decisions surfaced

1. **PRs #14–#19**: Still draft; cannot auto-merge. Mark ready and merge before #20–#30.
2. **Community author display**: Documented in `docs/SECURITY-FINDINGS.md`.
3. **Friend invite tokens**: Same hardening as care invites deferred (friends dark-launched).
4. **Axe color-contrast on marketing/auth shells**: Token-layer pass needed on `--text-tertiary` vs `--bg-secondary` in light mode (follow-up).
5. **ESLint warnings (197)**: Mostly `@typescript-eslint/no-explicit-any`; errors gate is clean.

## Integration fixes at stack tip

None required; all suites green with zero code changes beyond this report.
