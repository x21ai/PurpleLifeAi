ALTER TABLE public.care_thread_participants
  ADD COLUMN IF NOT EXISTS muted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS muted_until timestamptz;

-- Allow participants to delete (leave) their own membership row.
DROP POLICY IF EXISTS care_thread_participants_self_delete ON public.care_thread_participants;
CREATE POLICY care_thread_participants_self_delete
  ON public.care_thread_participants
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());