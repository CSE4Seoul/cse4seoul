-- Migration: handle null email for Kakao/OAuth users by generating a virtual email
-- This prevents DB insertion errors (NOT NULL constraint violations) on the profiles table.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  v_email := NEW.email;
  
  -- If email is missing (NULL or empty), generate a virtual email
  IF v_email IS NULL OR v_email = '' THEN
    -- Check if it's Kakao login using provider or issuer metadata
    IF (NEW.raw_app_meta_data->>'provider' = 'kakao') OR (NEW.raw_user_meta_data->>'iss' LIKE '%kakao%') THEN
      v_email := 'kakao_' || COALESCE(NEW.raw_user_meta_data->>'sub', NEW.id::text) || '@cse4seoul.kakao';
    ELSE
      -- Fallback for other providers or anonymous users
      v_email := 'user_' || NEW.id::text || '@cse4seoul.placeholder';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, is_consented, consented_at, role)
  VALUES (
    NEW.id, 
    v_email, 
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
