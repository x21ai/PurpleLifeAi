
## Goal
On `/meds` (and `/meds/$medId`), let users **edit** any med (name, type, dosage form/amount/unit, per-time amounts, schedule times, refill threshold, prescriber, pharmacy, etc.), **archive** it, and from the Archive view **restore** or **delete permanently**.

## No DB migration
`medications.active` already serves as the archive flag (`true` = active, `false` = archived). Reuse it. Cascade deletes are done manually since there are no FKs.

## `src/components/meds/medication-form-sheet.tsx` — add edit mode
- New optional prop `editingMedId?: string | null`.
- When `open && editingMedId`, fetch the medication row and prefill all state (name, kind, dosage form/amount/unit, with_food, times + per-time amounts derived from `schedule` jsonb or `times_of_day`, pills_remaining, refill_threshold, prescriber_name, pharmacy_name, prescription_number).
- Sheet title becomes "Edit medication"; Save button label "Save changes".
- `handleSave` branches:
  - **Insert path** (current behavior) when no `editingMedId`.
  - **Update path** when editing: `UPDATE medications SET …` for the same fields. Then re-sync today's pending doses: `DELETE FROM medication_doses WHERE medication_id = ? AND status = 'pending' AND scheduled_at >= now()` and re-insert from the new `scheduleSlots` (mirrors the insert seeding logic). This keeps already-taken doses intact while reflecting the new schedule going forward.
- Reset effect: when the sheet closes OR `editingMedId` changes, reset/reload state accordingly.

## `src/routes/_app/meds.tsx` — list page
- Drop the `.eq("active", true)` filter; load both active and archived.
- Add an **Active / Archive** tab toggle (matching the journal styling), default Active.
  - Filter chips (`medication / supplement / vitamin / rescue`) remain but only apply within the Active tab. Hide them in Archive view (replaced by a simple list).
- In `MedRow`: add a kebab menu (DropdownMenu) in the top-right corner of the card. Stop click propagation so the row Link still works for the rest of the card.
  - **Active**: Edit (opens form sheet in edit mode) · Archive (sets `active: false`).
  - **Archived**: Restore (sets `active: true`) · Delete permanently (AlertDialog confirm → cascade delete `medication_doses`, `medication_side_effects`, then the `medications` row).
- Today's doses section + adherence card stay scoped to active meds only.
- Lift `editingMedId` state to `MedsPage` so the form sheet can be opened in edit mode from any row.

## `src/routes/_app/meds.$medId.tsx` — detail page
- Replace the bare "Archive medication" button with a small action bar:
  - **Edit** — opens `MedicationFormSheet` in edit mode (state local to this page; on save → reload).
  - **Archive** — current behavior (and label flips to **Restore** when `med.active === false`).
  - **Delete permanently** — only shown when `med.active === false`. AlertDialog confirm → cascade delete doses + side effects + the med row, then `navigate({ to: "/meds" })`.
- If a user lands on an archived med, show a small "Archived" pill near the title.

## Out of scope
- Editing historical taken/missed doses
- Bulk archive/delete
- Reassigning notifications for past schedules (we only re-seed future pending doses)
