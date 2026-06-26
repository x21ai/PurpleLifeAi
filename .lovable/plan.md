## Problem
The circular icon indicators on the Timeline page are misaligned with the vertical border line. The current `absolute -left-[31px]` calculation is off by 5px, so each icon sits to the right of the border instead of being perfectly centered on it. This makes the timeline look unprofessional.

## Fix
In `src/routes/_app/timeline.tsx`, change the icon span positioning:
- **From:** `absolute -left-[31px] top-1.5 ...`
- **To:** `absolute -left-[36px] top-1.5 ...`

This centers the 24px-wide icon circle on the 1px border line (`pl-6` = 24px padding + 12px half-width = 36px).

## Verification
Open the Timeline page and confirm each icon circle is perfectly bisected by the vertical border line across all viewport sizes.
