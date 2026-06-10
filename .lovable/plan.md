## What Apple would do (and what I recommend)

Apple Health surfaces a small, opinionated set of "vitals" on the home view, then lets people drill into categories. For Purple I recommend the same shape:

**Vitals row on Insights** (after Sleep / HRV / Resting HR):
- Weight
- Blood Pressure (sys/dia)
- Blood Glucose
- SpO₂ (oxygen saturation) — Apple-standard, already in `biometrics`
- Body Temperature — Apple-standard, already in `biometrics`
- Respiratory Rate — already in `biometrics`

All read from the existing `biometrics` table. Each tile is tappable → small sheet to log a value (Apple-style quick add). No new tables.

**Health Records hub** — new section on Insights, also reachable from `/my-health`:
- Blood work
- DNA / Genetics
- Imaging — MRI
- Imaging — CT
- Imaging — X-ray
- Imaging — Ultrasound
- Cardiology (ECG/EKG, Echo, Holter)
- Pathology (biopsy, cytology)
- Clinical notes (discharge, referral, prescription)
- Other

Each category links to `/reports/documents?category=<slug>` with its own icon and color.

## Phasing

**Phase 1 — Ship now (this turn)**
1. Add vitals tiles to Insights header (Weight, BP, Glucose, SpO₂, Temp, Resp). Read-only, "—" when empty, tap → metric detail page (existing `/biometrics/$metric`).
2. Add Health Records hub card grid on Insights linking to filtered Reports.
3. Reports list: add category icons, group by Year → Month → Day, add category filter chips.
4. Add `report_category` column to `report_documents` with a migration + simple filename-based auto-categorizer (mri/ct/xray/dna/blood/ecg keywords). Backfill existing rows.
5. Categorize existing DNA files (already in `dna_files`) under the DNA tile.

**Phase 2 — Quick-log + smarter categorization (next turn)**
- Quick-log sheets on each vitals tile (weight, BP, glucose, SpO₂, temp).
- AI-assisted categorization on upload (use Lovable AI to read filename + first PDF page text → category + suggested title).
- Per-record share button (signed URL, 7-day expiry) and download button.

**Phase 3 — Viewers + summaries (later turn)**
- Inline image viewer for MRI/CT/X-ray (DICOM is out of scope; we handle JPG/PNG/PDF exports).
- AI summary per record category ("what this lab panel says in plain English").
- Per-category trends (e.g. all glucose readings across all blood reports over time).

**Out of scope unless you ask**
- Real DICOM rendering (needs a heavy viewer library).
- HL7/FHIR import.
- Direct lab connectors (Quest, LabCorp).

## Technical notes (Phase 1)

- New migration: `ALTER TABLE report_documents ADD COLUMN report_category text;` + index. Server fn `categorizeReports()` walks existing rows and sets a category from filename keywords.
- `src/lib/report-categories.ts` — single source of truth: `{ slug, label, icon, color, keywords[] }` for all 10 categories. Used by the auto-categorizer, the hub tiles, and the filter chips.
- `src/routes/_app/reports.documents.tsx` — read `?category=` from search params, filter the list, group by date. Show icon per row.
- `src/routes/_app/insights.tsx` — add `<VitalsRow />` and `<HealthRecordsHub />` components above the existing tabs.
- DNA tile pulls count from `dna_files`; all others from `report_documents` filtered by `report_category`.

Approve and I'll ship Phase 1.