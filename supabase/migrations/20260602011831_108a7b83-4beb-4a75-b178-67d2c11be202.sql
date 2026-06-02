
-- Care chat: 1:1 + optional group threads between owners and caregivers

CREATE TABLE public.care_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('direct', 'group')),
  relationship_id uuid REFERENCES public.care_relationships(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX care_threads_direct_unique
  ON public.care_threads(owner_id, relationship_id)
  WHERE kind = 'direct';
CREATE UNIQUE INDEX care_threads_group_unique
  ON public.care_threads(owner_id)
  WHERE kind = 'group';

CREATE TABLE public.care_thread_participants (
  thread_id uuid NOT NULL REFERENCES public.care_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'caregiver')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  PRIMARY KEY (thread_id, user_id)
);
CREATE INDEX care_thread_participants_user_idx
  ON public.care_thread_participants(user_id);

CREATE TABLE public.care_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.care_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX care_messages_thread_idx
  ON public.care_messages(thread_id, created_at DESC);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_threads TO authenticated;
GRANT ALL ON public.care_threads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_thread_participants TO authenticated;
GRANT ALL ON public.care_thread_participants TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_messages TO authenticated;
GRANT ALL ON public.care_messages TO service_role;

-- RLS
ALTER TABLE public.care_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_messages ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a participant in a thread?
CREATE OR REPLACE FUNCTION public.is_care_thread_participant(_thread_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.care_thread_participants
    WHERE thread_id = _thread_id AND user_id = _user_id
  );
$$;

-- care_threads policies
CREATE POLICY care_threads_select ON public.care_threads
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.is_care_thread_participant(id, auth.uid())
  );

CREATE POLICY care_threads_owner_all ON public.care_threads
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- care_thread_participants policies
CREATE POLICY care_thread_participants_select ON public.care_thread_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.care_threads t
      WHERE t.id = care_thread_participants.thread_id AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY care_thread_participants_owner_write ON public.care_thread_participants
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.care_threads t WHERE t.id = thread_id AND t.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.care_threads t WHERE t.id = thread_id AND t.owner_id = auth.uid())
  );

CREATE POLICY care_thread_participants_self_update ON public.care_thread_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- care_messages policies
CREATE POLICY care_messages_select ON public.care_messages
  FOR SELECT TO authenticated
  USING (public.is_care_thread_participant(thread_id, auth.uid()));

CREATE POLICY care_messages_insert ON public.care_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_care_thread_participant(thread_id, auth.uid())
  );

CREATE POLICY care_messages_soft_delete ON public.care_messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Trigger: bump care_threads.last_message_at on new message
CREATE OR REPLACE FUNCTION public.bump_care_thread_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.care_threads
    SET last_message_at = NEW.created_at
    WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER care_messages_bump_thread
  AFTER INSERT ON public.care_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_care_thread_last_message();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.care_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.care_threads;
