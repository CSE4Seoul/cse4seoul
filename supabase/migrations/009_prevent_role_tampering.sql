-- Migration: prevent unauthorized role or admin flag modifications on public.profiles

CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. 신규 회원가입(INSERT) 시에는 검사를 생략하고 허용
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- 2. 업데이트를 요청한 세션의 UID가 해당 프로필 소유자일 때
  -- 요청한 사람이 최고관리자(is_admin = true)가 아니라면, role 이나 is_admin 의 수정을 시도할 경우 강제로 OLD 값으로 되돌림
  IF NOT (
    SELECT COALESCE(is_admin, false) 
    FROM public.profiles 
    WHERE id = auth.uid()
  ) THEN
    NEW.role := OLD.role;
    NEW.is_admin := OLD.is_admin;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 트리거 설정
DROP TRIGGER IF EXISTS tr_prevent_role_change ON public.profiles;
CREATE TRIGGER tr_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_role_change();
