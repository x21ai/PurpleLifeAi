# Superpower → Purple feature matrix

Design reference for the multi-screen preview at
`docs/previews/personalized-dashboard-preview.html` (serve at
http://127.0.0.1:8766/personalized-dashboard-preview.html).

**Status:** Preview only — **Merged layout approved (2026-07-06)**; full page parity in Merged mode. **Light mode accent pass approved (2026-07-06)** — subtle `purplePrimary` / `purpleSoft` / `purpleDeep` accents on nav, chips, Maya card, protocol/rec cards, CTAs, search focus (light only; dark unchanged). **Typography (2026-07-06):** preview + production tokens use Apple SF Pro system stack (no Inter / Source Serif 4 in signed-in shell). Production implementation pending (Flutter P0).

---

## Screen mapping

| Superpower screen | Purple equivalent | Route / surface | Status | Priority | Data dependencies |
|---|---|---|---|---|---|
| Home score gauge + bio age | Readiness + sleep score hero (no bio age) | `/today`, Flutter `#/today` | **Partial** — scores exist; dual gauge hero + protocol strip at bottom is **net-new layout** | **P0** | `biometrics.oura_readiness_score`, `biometrics.sleep_score`, `biometrics.sleep_total_min`; `getScoreSnapshot` / risk forecaster |
| Biomarkers summary bar (105/43/42/20) | Lab flag counts from uploads | `/reports`, `/reports/trends` | **Partial** — per-metric flags exist; aggregate optimal/normal/out bar is **net-new** | **P0** | `report_metrics.flag` (`normal`, `high`, `low`, `abnormal`); count query grouped by user |
| Data tab biomarker rows | Biometrics hub + lab trends | `/biometrics`, `/reports/trends/$metricKey` | **Partial** — rows + sparklines on trends; unified searchable Data tab with status dot + range bar is **net-new** | **P0** | `report_metrics` + `biometrics`; `METRICS` registry in `src/lib/biometric-metrics.ts` |
| Vitamin D detail + optimal band | Metric drilldown with reference band | `/biometrics/$metric`, `/reports/trends/$metricKey` | **Exists** for wearables (`MetricShell`, `ReferenceArea`); lab optimal band styling needs parity | **P1** | `reference_low`, `reference_high`, `flag`; Recharts on web, Flutter chart TBD |
| Protocol numbered cards | Maya protocol / daily insight cards | **Net-new** tab or Today section | **Net-new** | **P0** | `/api/ai/daily-insight-cards`, `profiles.ai_care_profile`, `profiles.conditions`, Maya prompt for numbered protocol items |
| Ask Superpower AI + prompt chips | Ask Maya + starters | `/chat`, condition pages | **Partial** — chat + `askMayaStarters` exist; chip rail + upload CTA layout is **net-new** | **P1** | `ai_care_profile.askMayaStarters` via `care-profile.functions.ts`; chat route |
| Upload past labs | Reports upload | `/reports` upload flow | **Exists** | **P2** (polish) | `report_documents`, extraction pipeline, `report_metrics` insert |
| Import AI memory | External memory import | — | **Future / skip** | **P2** | No table yet; note in gap matrix only |
| Onboarding 1/3 checklist | Wearables + labs + conditions | Onboarding / Settings | **Partial** — pieces exist separately; unified checklist UI **net-new** | **P1** | `oura_tokens` / `whoop_tokens`, `report_documents` count, `profiles.conditions` |
| Text Care Team chat | Caregiver chat | `/care`, care API routes | **Partial** — care APIs deployed; dedicated chat UI vs Ask Maya tab switcher **net-new** | **P1** | `/api/care/*`, `care_relationships`, caregiver scopes |
| Marketplace | **Purple "Recommended for you"** (not ASC shop) | New tab or Today section | **Preview** — condition-ranked cards in HTML mock; production **net-new** | **P1** | `profiles.conditions`, `traitsForConditions`, `feature_suggestions`, `FEATURE_CATALOG`, tools registry (`/tools`), Maya weekly refresh |
| **Order blood panel** | Lab order hero + 3-step modal | Recommended tab, Data empty state | **Preview** — panel picker, collection, Stripe placeholder; production **net-new** | **P1** | `lab_orders` (net-new), Stripe lab SKUs (net-new), partner API; ingest via `report_metrics` |
| Bottom nav (5 tabs) | Today / Data / FAB / Plan / Ask | App shell | **Net-new** nav model | **P0** | Router + Flutter GoRouter shell; may replace or augment current bottom nav |
| Personalization (sleep+heart focus) | Condition-driven ordering | Today, Data, Protocol | **Partial** — `ai_care_profile` + traits; focus toggle ordering **net-new** | **P0** | `profiles.conditions`, `traitsForConditions`, `getDailyInsightCardsForUser` |
| HRV / sleep metric detail chart | Wearable drilldown with **dated readings** (`recorded_at` / `measured_at`) | `/biometrics/hrv_rmssd_ms` etc. | **Preview** — HTML mock shows latest card, chart x-axis dates, history list | **P1** | `biometrics` time series, `classifyValue`, `MetricShell` |

---

## Top P0 after approval (implementation order)

1. **Dual-score Today hero** — `oura_readiness_score` + `sleep_score` gauges; condition-aware metric strip order.
2. **Unified Data tab** — merge `/biometrics` wearables + `report_metrics` labs with summary bar and search.
3. **Protocol section** — numbered Maya cards from `/api/ai/daily-insight-cards` + conditions; surface on Today + dedicated Protocol tab.
4. **Biomarker summary bar** — aggregate `report_metrics.flag` counts (optimal / in-range / out-of-range).
5. **Shell nav refresh** — Today · Data · FAB · Plan · Ask Maya pattern (Flutter + TanStack), preserving burger drawer for Account/Settings.

---

## P1 (post-P0)

- **Recommended for you** — trait-ranked cards from `profiles.conditions` + `feature_suggestions` + tools registry; Learn more / Open in Tools CTAs only (no fake SKUs).
- **Order blood panel** — condition-ranked hero + 3-step modal (panel, collection, Stripe placeholder); Data empty state CTA. Spec: `docs/previews/LAB-ORDERING-SPEC.md`. Phase 1 = concierge/deep link; Phase 2 = in-app Stripe + partner API.
- Lab metric detail parity with wearable `MetricShell` optimal band styling.
- Ask Maya chip rail + upload-labs CTA on same screen.
- Onboarding checklist (wearables connected, labs uploaded, conditions set).
- Care Team vs Ask Maya tab switcher on chat surface.

---

## P2 / deferred

- Import AI memory (no schema; preview chip only).
- Generic e-commerce marketplace — **do not build**; Purple "Recommended" is informational + tools routing only.
- Bio age — **do not build** unless a validated field exists in schema.

---

## What NOT to build

| Item | Reason |
|---|---|
| Marketplace / supplements shop | Out of scope; use Purple "Recommended for you" (condition-driven, no prices) |
| Biological age | No `bio_age` or equivalent in `biometrics` / `report_metrics` |
| Superpower orange brand | Use Purple tokens from `design/tokens.json` |
| Fake lab values in prod | Preview uses mock data; prod uses real uploads only |
| In-app lab checkout without partner | Phase 1 = concierge/deep link only; see `LAB-ORDERING-SPEC.md` |

---

## Preview screens (HTML)

Three layout modes (toolbar segmented control; persisted in `sessionStorage` as `previewLayoutMode`):

| Mode | Description |
|---|---|
| **Classic** | Nori-style calm Today (date eyebrow, greeting, sleep/HRV strip, single Maya narrative, Ask Maya chips, quick actions). Stats tab: collapsible Sleep + Cardio (expanded), Activity (collapsed), sparklines + source badges. Side-by-side Today + Stats phones on wide viewports (toggle off for tab-only). |
| **Expanded** | Full 6-tab Superpower-inspired preview (default). |
| **Merged** | **Approved direction (2026-07-06).** Classic calm Today (strip + narrative + 1 protocol card + recommended teaser). Bottom nav: Today · Data · FAB · Plan · Ask Maya. **Plan** tab uses Protocol \| Recommended segmented sub-nav (full parity with Expanded). Toolbar adds direct jumps: Today, Data, Plan, Recommended, Ask Maya, Metric detail. Lab order modal from Data / Recommended / Plan. |

| # | Screen | Merged access | Superpower inspiration |
|---|---|---|---|
| 1 | Today | Bottom nav **Today** (default); calm strip + narrative + 1 protocol card + recommended teaser | Home gauge (Expanded) or strip (Classic/Merged) + Maya narrative |
| 2 | Data / Stats | Bottom nav **Data**; biomarker bar, search, lab rows, empty state + order CTA | Biomarker bar + searchable rows (Data) or collapsible sections (Classic Stats) |
| 3 | Protocol / Plan | Bottom nav **Plan** → **Protocol** segment; onboarding checklist + numbered cards | Numbered focus cards + onboarding checklist |
| 4 | Ask Maya | Bottom nav **Ask Maya**; chips, upload labs, Care Team tab | Prompt chips + Care Team tab + upload CTA |
| 5 | **Recommended** | Plan → **Recommended** segment; toolbar **Recommended** tab; Today teaser → Plan/Recommended | Purple "Recommended for you" grid + **Order blood panel** hero |
| 6 | Metric detail | Tap Data row or Today strip chip; toolbar **Metric detail**; back → Data | HRV/wearable optimal band chart with dated x-axis |
| 7 | Lab order modal | Data empty state, Recommended hero, Plan Recommended segment | 3-step: panel → collection → Stripe placeholder |

**Lab ordering spec:** `docs/previews/LAB-ORDERING-SPEC.md`

---

## Verification

```bash
cd docs/previews && python3 -m http.server 8766 --bind 127.0.0.1
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8766/personalized-dashboard-preview.html
```

Open in Cursor browser; toggle dark/light, sleep+heart focus, and all three layout modes (Classic / Expanded / Merged).
