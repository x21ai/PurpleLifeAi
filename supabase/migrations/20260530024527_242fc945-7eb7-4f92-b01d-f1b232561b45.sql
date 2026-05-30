-- 1. Auto-clear invite_token once a care relationship leaves 'pending' status.
CREATE OR REPLACE FUNCTION public.care_clear_invite_token_on_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'pending' AND NEW.invite_token IS NOT NULL THEN
    NEW.invite_token := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_care_clear_invite_token ON public.care_relationships;
CREATE TRIGGER trg_care_clear_invite_token
BEFORE INSERT OR UPDATE ON public.care_relationships
FOR EACH ROW EXECUTE FUNCTION public.care_clear_invite_token_on_accept();

-- Backfill: clear tokens on all non-pending relationships
UPDATE public.care_relationships
SET invite_token = NULL
WHERE status <> 'pending' AND invite_token IS NOT NULL;

-- 2. Tighten realtime topic policies: require a fixed "user:<uid>" prefix
--    instead of a loose suffix match anywhere in the topic name.
DROP POLICY IF EXISTS realtime_own_topic_select ON realtime.messages;
DROP POLICY IF EXISTS realtime_own_topic_insert ON realtime.messages;

CREATE POLICY realtime_own_topic_select
ON realtime.messages
FOR SELECT
TO authenticated
USING (realtime.topic() = ('user:' || (auth.uid())::text));

CREATE POLICY realtime_own_topic_insert
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (realtime.topic() = ('user:' || (auth.uid())::text));