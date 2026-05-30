-- Profile reminder preferences (wake/sleep window + snooze duration)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wake_time time NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS sleep_time time NOT NULL DEFAULT '23:00',
  ADD COLUMN IF NOT EXISTS snooze_minutes int NOT NULL DEFAULT 10;

-- Per-medication reminder style: 'standard' = single notification, 'critical' = persistent alarm
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS reminder_style text NOT NULL DEFAULT 'standard'
  CHECK (reminder_style IN ('standard', 'critical'));

-- Trips: planned travel to another timezone (schedule still anchors to profile home tz)
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text,
  destination_tz text NOT NULL,
  depart_at timestamptz NOT NULL,
  return_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','ended','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trips_user_dates ON public.trips(user_id, depart_at, return_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY trips_all_own ON public.trips
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
