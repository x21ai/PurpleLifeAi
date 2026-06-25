-- Remove duplicate medication_doses for same (medication_id, scheduled_at).
-- Keep the row with highest status rank; tie-break by most recently updated/created.
WITH ranked AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY medication_id, scheduled_at
      ORDER BY
        CASE status
          WHEN 'taken' THEN 4
          WHEN 'missed' THEN 3
          WHEN 'skipped' THEN 2
          WHEN 'pending' THEN 1
          ELSE 0
        END DESC,
        COALESCE(taken_at, created_at) DESC NULLS LAST,
        created_at DESC
    ) AS rn
  FROM public.medication_doses
)
DELETE FROM public.medication_doses d
USING ranked r
WHERE d.id = r.id AND r.rn > 1;

-- Prevent recurrence at the DB level.
CREATE UNIQUE INDEX IF NOT EXISTS medication_doses_unique_med_slot
  ON public.medication_doses (medication_id, scheduled_at);