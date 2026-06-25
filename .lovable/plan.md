## Fix date fields on Medical History report

**Problem:** The From/To date fields on `/reports/medical-history` use native `<input type="date">` inputs. In dark mode, the browser-native calendar icon is invisible (shows blank). Additionally, clicking the field does not reliably open a calendar picker.

**Solution:** Replace both native date inputs with a Shadcn Popover + Calendar date picker, following the existing `DateTimePicker` pattern but date-only (no time). This gives full control over the trigger icon styling and ensures the calendar opens on click.

### What will change

1. **Create `src/components/ui/date-picker.tsx`** — A reusable date-only picker component wrapping `Popover`, `Button`, and `Calendar` (same pattern as `date-time-picker.tsx` but without the time portion). Uses a `CalendarIcon` with `text-foreground` so it inherits the theme color (white in dark mode, dark in light mode). Clicking the button opens the calendar Popover.

2. **Update `src/routes/_app/reports.medical-history.tsx`** — Replace the two `<Input type="date">` fields with the new `<DatePicker>` components. Wire `from` / `to` string values through `new Date(...)` and `toISOString().slice(0,10)` conversions.

### Acceptance criteria
- Calendar icon is visible and matches the text color in both light and dark modes.
- Clicking either From or To field opens a calendar picker.
- Both fields share the same height, border, and typography as surrounding inputs (shadcn `Button variant="outline"` trigger).
- Preset buttons (30 days, 90 days, etc.) continue to work as before.
- Generate PDF continues to use the same `from`/`to` values.

### Out of scope
- No changes to other pages with native `type="date"` inputs (`today-panel.tsx`, `medication-form-sheet.tsx`).
- No changes to the existing `DateTimePicker` component.