# Reports redesign plan

## Goal
Redesign Purple’s reports experience to follow the final reference set: a premium mobile-first health data system with two coordinated visual modes:
- **Dark report shell** for reports overview, upload, clinical report, marketplace/additional tests, disclaimers, and education
- **Light metric drilldowns** for individual biomarker detail, data records, scorecards, and AI follow-up prompts

The redesign will stay inside the existing reports/insights/biometrics surfaces and will not expand scope beyond what your references show.

## What will change

### 1) Reports overview becomes a guided report hub
Rework `/reports` into a more editorial, app-like report home:
- Dark background with soft green-teal wash at the top
- Hero summary block that highlights the latest uploaded report and overall counts/status
- Strong section hierarchy for:
  - Labs summary / latest report snapshot
  - Contributing tests / history
  - Pending tests
  - Upload/add-more-tests callout
  - Educational/privacy/disclaimer modules lower on the page
- Existing search and report listing stay, but get redesigned as high-contrast, large-tap cards instead of generic lists
- Trends section becomes more intentional and visually integrated instead of feeling appended

### 2) Upload flow becomes a polished intake experience
Rework `/reports/new` to match the references:
- Dark upload screen with a more premium dropzone and clearer “processing takes a few minutes” guidance
- Better staged communication:
  - upload state
  - processing state
  - privacy reassurance
  - medical disclaimer
- Uploaded file queue becomes more structured and readable
- Copy and layout will reflect a calmer, more productized experience

### 3) Report detail becomes a clinical report surface
Rework `/reports/$reportId` into a dark “clinical report” experience:
- Top summary card for reviewed insights / key findings
- Cleaner findings/impressions modules
- Metrics grouped in richer panel sections with stronger state color usage
- Expandable metric rows that feel like report insights rather than raw accordions
- Better visual treatment for processing / failed extraction states
- Lower-page privacy / disclaimer / educational blocks using the same language hierarchy as the references

### 4) Metric trend pages become light diagnostic drilldowns
Rework `/reports/trends/$metricKey` and align `/biometrics/$metric` visually with the reference metric pages:
- Light canvas with large metric title and status pill
- Reference-range chart area styled like the screenshots
- Dual stat cards for latest result + optimal range
- AI question prompt cards beneath the chart
- Cleaner readings/history list below
- Stronger distinction between out-of-range, normal, and optimal states

### 5) Biometrics metric pages align to the same light detail system
Update `/biometrics/$metric` so it visually matches the final reference direction:
- Same light diagnostic layout language as report trends
- Refined segmented controls/range controls
- More polished chart framing and stat cards
- Better continuity between reports-derived metrics and wearable metrics

### 6) Data records / biomarker catalog styling direction
Where applicable in current data/report-related screens, restyle list rows to match the “Data / Records” reference:
- Softer white cards
- Compact category + metric + value structure
- Right-aligned mini range indicators / trend marks
- Stronger visual grouping for repeated rows

### 7) Keep the epilepsy/seizures behavior already specified
Preserve the condition-aware logic already discussed:
- **Insights: Seizures tab + content render only when profile conditions include `epilepsy` or `seizures`**
- Otherwise default to **Trends**
- Users without those conditions, including `pmt@eigital.com`, should not see Seizures

## Design system direction to implement

### Dark report shell
- Deep charcoal/near-black base
- Teal-green atmospheric top glow only where used by the report shell
- Large uppercase navigation headers where appropriate
- Rounded modules with subtle inner contrast, not bright borders
- White typography with muted gray secondary text
- Status accents:
  - green/teal for optimal/positive
  - amber for caution
  - slate/gray for pending/inactive

### Light metric drilldowns
- Bright warm-white background
- Very soft card shadows and thin borders
- Pink/magenta for out-of-range markers
- Green for optimal range bands
- Yellow for “normal but not optimal” where applicable
- Large readable charts and oversized metric titles
- Question prompt cards styled as tappable AI follow-up actions

## Implementation approach

### Phase 1: foundation + tokens
- Extend shared tokens/styles so both dark report shell and light metric detail themes are supported cleanly
- Introduce reusable report-specific UI pieces instead of scattering one-off classes

### Phase 2: reports shell screens
- Rebuild `/reports`
- Rebuild `/reports/new`
- Rebuild `/reports/$reportId`

### Phase 3: metric detail system
- Rebuild `/reports/trends/$metricKey`
- Restyle `/biometrics/$metric` to the same design language

### Phase 4: supporting modules
- Upgrade trends list rows, metric cards, status pills, prompt cards, disclaimer cards, and upload/process states
- Align educational/privacy sections to the final references

### Phase 5: polish and responsive QA
- Mobile-first tuning based on your screenshots
- Make sure desktop/tablet scale gracefully without losing the mobile visual language
- Check contrast, overflow, long metric names, and loading/empty/error states

## Technical notes
- Reuse current routes and data flows; this is primarily a UI/UX redesign, not a backend rewrite
- Keep current private storage behavior and disclaimer requirements intact
- Likely files touched first:
  - `src/routes/_app/reports.tsx`
  - `src/routes/_app/reports.new.tsx`
  - `src/routes/_app/reports.$reportId.tsx`
  - `src/routes/_app/reports.trends.$metricKey.tsx`
  - `src/routes/_app/biometrics.$metric.tsx`
  - `src/components/reports/trends-section.tsx`
  - shared UI/token files as needed

## Expected result
A cohesive reports experience that feels much closer to your references: premium, clinical, mobile-native, and visually differentiated between overview/reporting screens and individual metric analysis screens.