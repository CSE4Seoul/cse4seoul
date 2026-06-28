-- Migration: Create qnas table and configure RLS policies for Q&A widget
CREATE TABLE IF NOT EXISTS public.qnas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  reply text,
  status text DEFAULT 'PENDING' NOT NULL, -- PENDING, POSTED, HOLD
  author_name text DEFAULT 'Anonymous' NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  replied_at timestamptz,
  replied_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.qnas ENABLE ROW LEVEL SECURITY;

-- 1) Anyone (guests, users, admins) can view POSTED Q&As. 
--    Additionally, authors can view their own pending/held questions, and admins can view everything.
DROP POLICY IF EXISTS "Allow select qnas" ON public.qnas;
CREATE POLICY "Allow select qnas" ON public.qnas
  FOR SELECT
  USING (
    status = 'POSTED' OR 
    (auth.uid() IS NOT NULL AND auth.uid() = created_by) OR 
    public.check_is_admin(auth.uid())
  );

-- 2) Anyone can submit/insert questions
DROP POLICY IF EXISTS "Allow insert qnas" ON public.qnas;
CREATE POLICY "Allow insert qnas" ON public.qnas
  FOR INSERT
  WITH CHECK (true);

-- 3) Only admins can manage (update/delete) Q&A entries
DROP POLICY IF EXISTS "Allow admin to manage qnas" ON public.qnas;
CREATE POLICY "Allow admin to manage qnas" ON public.qnas
  FOR ALL
  USING (public.check_is_admin(auth.uid()))
  WITH CHECK (public.check_is_admin(auth.uid()));
