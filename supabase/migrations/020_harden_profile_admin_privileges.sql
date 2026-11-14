-- Prevent users from recreating their profile with administrator privileges.
REVOKE DELETE, TRUNCATE ON TABLE public.profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL AND NOT public.check_is_admin(auth.uid()) THEN
      NEW.role := 'outsider';
      NEW.is_admin := false;
    END IF;
    RETURN NEW;
  END IF;

  IF NOT public.check_is_admin(auth.uid()) THEN
    NEW.role := OLD.role;
    NEW.is_admin := OLD.is_admin;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_prevent_role_change ON public.profiles;
CREATE TRIGGER tr_prevent_role_change
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_role_change();
