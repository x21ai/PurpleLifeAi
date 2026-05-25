-- Enable RLS on realtime.messages and restrict topic access to channels ending with the user's own ID
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realtime_own_topic_select" ON realtime.messages;
DROP POLICY IF EXISTS "realtime_own_topic_insert" ON realtime.messages;

CREATE POLICY "realtime_own_topic_select"
ON realtime.messages
FOR SELECT
TO authenticated
USING (realtime.topic() LIKE '%' || auth.uid()::text);

CREATE POLICY "realtime_own_topic_insert"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (realtime.topic() LIKE '%' || auth.uid()::text);