ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS refer_code text;
CREATE UNIQUE INDEX IF NOT EXISTS friendships_refer_code_unique ON public.friendships (refer_code) WHERE refer_code IS NOT NULL;
ALTER TABLE public.friendships ALTER COLUMN invite_email DROP NOT NULL;