-- Migration: create notices table and configure RLS
CREATE TABLE IF NOT EXISTS public.notices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  is_pinned boolean DEFAULT false NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '1 day') NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 1) Anyone can view notices
DROP POLICY IF EXISTS "Allow public read notices" ON public.notices;
CREATE POLICY "Allow public read notices" ON public.notices
  FOR SELECT
  USING (true);

-- 2) Only admin profiles can create/update/delete notices
DROP POLICY IF EXISTS "Allow admin to manage notices" ON public.notices;
CREATE POLICY "Allow admin to manage notices" ON public.notices
  FOR ALL
  USING (public.check_is_admin(auth.uid()))
  WITH CHECK (public.check_is_admin(auth.uid()));
