
-- Phase C: itinerary-driven travel scheduling
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS legs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS shift_strategy text NOT NULL DEFAULT 'snap',
  ADD COLUMN IF NOT EXISTS shift_hours_per_day numeric NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS home_tz_snapshot text,
  ADD COLUMN IF NOT EXISTS schedule_generated_at timestamptz;

ALTER TABLE public.trips
  DROP CONSTRAINT IF EXISTS trips_shift_strategy_check;
ALTER TABLE public.trips
  ADD CONSTRAINT trips_shift_strategy_check
  CHECK (shift_strategy IN ('home','snap','gradual'));

-- Tag pending doses generated for a trip so we can regenerate cleanly.
ALTER TABLE public.medication_doses
  ADD COLUMN IF NOT EXISTS trip_id uuid;

CREATE INDEX IF NOT EXISTS medication_doses_trip_id_idx
  ON public.medication_doses(trip_id);
