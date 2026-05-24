-- Restrict Realtime channel access to topics that end with the authenticated user's ID.
-- Wrapped in DO block because realtime.messages may not exist on every project version.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'realtime' AND c.relname = 'messages'
  ) THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can only access their own realtime channels" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "Users can only access their own realtime channels"
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING ( realtime.topic() LIKE '%' || (auth.uid())::text )
    $p$;

    EXECUTE 'DROP POLICY IF EXISTS "Users can only broadcast on their own realtime channels" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "Users can only broadcast on their own realtime channels"
      ON realtime.messages
      FOR INSERT
      TO authenticated
      WITH CHECK ( realtime.topic() LIKE '%' || (auth.uid())::text )
    $p$;
  END IF;
END
$$;