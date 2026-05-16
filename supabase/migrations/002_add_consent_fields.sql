-- Migration: add consent fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_consented boolean DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consented_at timestamptz;

-- Optional: ensure index on consented_at for queries
CREATE INDEX IF NOT EXISTS idx_profiles_consented_at ON public.profiles (consented_at);
