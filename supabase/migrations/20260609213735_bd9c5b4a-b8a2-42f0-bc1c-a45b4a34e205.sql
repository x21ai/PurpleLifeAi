-- Friendships: zero-data social connections, fully separate from caregivers.
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,              -- smaller uuid (canonical order)
  user_b uuid,                       -- larger uuid; null until invitee joins
  requested_by uuid NOT NULL,        -- who sent the invite
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','blocked')),
  invite_email text,                 -- invitee email (until they accept)
  invite_token text,                 -- one-time accept token, cleared on accept
  note_a text,                       -- user_a's private nickname for the friendship
  note_b text,                       -- user_b's private nickname for the friendship
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

CREATE UNIQUE INDEX friendships_pair_unique
  ON public.friendships (user_a, user_b)
  WHERE user_b IS NOT NULL;

CREATE INDEX friendships_user_a_idx ON public.friendships (user_a);
CREATE INDEX friendships_user_b_idx ON public.friendships (user_b);
CREATE INDEX friendships_invite_token_idx ON public.friendships (invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX friendships_invite_email_idx ON public.friendships (lower(invite_email)) WHERE invite_email IS NOT NULL;

-- Canonical-order trigger: keep user_a < user_b so the pair is unique.
CREATE OR REPLACE FUNCTION public.friendships_normalize_pair()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_b IS NOT NULL AND NEW.user_a > NEW.user_b THEN
    -- swap
    DECLARE
      tmp_id uuid := NEW.user_a;
      tmp_note text := NEW.note_a;
    BEGIN
      NEW.user_a := NEW.user_b;
      NEW.user_b := tmp_id;
      NEW.note_a := NEW.note_b;
      NEW.note_b := tmp_note;
    END;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER friendships_normalize_pair_trg
BEFORE INSERT OR UPDATE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.friendships_normalize_pair();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- SELECT: only participants can see the row.
CREATE POLICY "Friends can read their own friendships"
ON public.friendships
FOR SELECT
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b OR auth.uid() = requested_by);

-- INSERT: only the inviter, and they must be one of user_a/user_b (or user_b null for email invite).
CREATE POLICY "Users can create their own friendship invites"
ON public.friendships
FOR INSERT
TO authenticated
WITH CHECK (
  requested_by = auth.uid()
  AND (auth.uid() = user_a OR auth.uid() = user_b OR user_b IS NULL)
);

-- UPDATE: participants only (accept, change nickname, block).
CREATE POLICY "Participants can update friendship"
ON public.friendships
FOR UPDATE
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b OR auth.uid() = requested_by)
WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b OR auth.uid() = requested_by);

-- DELETE: either side can remove the friendship.
CREATE POLICY "Participants can delete friendship"
ON public.friendships
FOR DELETE
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b OR auth.uid() = requested_by);