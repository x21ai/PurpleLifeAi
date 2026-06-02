
-- 1. Per-user hydration goal
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_water_goal_ml integer NOT NULL DEFAULT 2000
  CHECK (daily_water_goal_ml >= 250 AND daily_water_goal_ml <= 10000);

-- 2. Auto-link recent auras to a newly-logged seizure
CREATE OR REPLACE FUNCTION public.link_recent_aura_to_seizure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.aura_events
  SET linked_seizure_id = NEW.id,
      led_to_seizure = true
  WHERE user_id = NEW.user_id
    AND linked_seizure_id IS NULL
    AND occurred_at >= NEW.started_at - INTERVAL '30 minutes'
    AND occurred_at <= NEW.started_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_recent_aura_to_seizure ON public.seizure_events;
CREATE TRIGGER trg_link_recent_aura_to_seizure
AFTER INSERT ON public.seizure_events
FOR EACH ROW
EXECUTE FUNCTION public.link_recent_aura_to_seizure();
