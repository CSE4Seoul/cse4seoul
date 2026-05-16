-- Migration: add is_admin column, helper function, and example RLS policies

-- 1) add is_admin flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2) helper function to check admin status
CREATE OR REPLACE FUNCTION public.is_user_admin(uid uuid) RETURNS boolean
  LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(is_admin, false) FROM public.profiles WHERE id = uid;
$$;

-- 3) enable RLS on profiles and create a policy allowing owner or admin access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_owner_or_admin ON public.profiles;
CREATE POLICY profiles_owner_or_admin
  ON public.profiles
  FOR ALL
  USING (
    auth.uid() = id OR public.is_user_admin(auth.uid()::uuid)
  )
  WITH CHECK (
    auth.uid() = id OR public.is_user_admin(auth.uid()::uuid)
  );

-- 4) Example: If you have a "posts" or "messages" table, create a similar policy.
-- Replace table_name and owner_col as appropriate.
--
-- ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY posts_owner_or_admin
--   ON public.posts
--   FOR ALL
--   USING ( owner_id = auth.uid() OR public.is_user_admin(auth.uid()::uuid) )
--   WITH CHECK ( owner_id = auth.uid() OR public.is_user_admin(auth.uid()::uuid) );

-- 5) If you prefer Postgres role grants (not recommended for web clients), you can grant
-- privileges to a DB role named "admin". Be cautious: this may bypass RLS if role is
-- allowed to connect directly.
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO admin;
