-- 1. Grant basic schema and table permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Create a SECURITY DEFINER function to check admin status
-- This avoids "infinite recursion" in RLS policies because SECURITY DEFINER 
-- functions bypass RLS for queries inside the function.
CREATE OR REPLACE FUNCTION public.check_is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$;

-- 3. Create or replace the trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_consented, consented_at, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE((NEW.raw_user_meta_data->>'is_consented')::boolean, false),
    (NEW.raw_user_meta_data->>'consented_at')::timestamptz,
    'outsider'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    is_consented = COALESCE(EXCLUDED.is_consented, profiles.is_consented),
    consented_at = COALESCE(EXCLUDED.consented_at, profiles.consented_at);
  RETURN NEW;
END;
$$;

-- 4. Set up the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Fix RLS policies to prevent recursion
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove the old recursive policy
DROP POLICY IF EXISTS "profiles_owner_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual insert during signup" ON public.profiles;

-- Create separate, non-recursive policies
CREATE POLICY "profiles_owner_access"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_access"
  ON public.profiles
  FOR ALL
  USING (public.check_is_admin(auth.uid()));

-- Policy for insertion (handled by trigger but good to have for client-side fallback)
CREATE POLICY "profiles_insert_during_signup"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
