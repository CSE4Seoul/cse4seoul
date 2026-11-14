CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL CHECK (request_type IN ('membership', 'clan_battle', 'admin_contact')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public boolean NOT NULL DEFAULT false,
  nickname text,
  royaleapi_profile_url text,
  clan_name text,
  royaleapi_clan_url text,
  participant_proposal text,
  battle_format text,
  subject text,
  inquiry_content text,
  contact text,
  password_hash text,
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'reviewing', 'approved', 'rejected')),
  admin_reply text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (request_type = 'membership'
      AND nickname IS NOT NULL
      AND royaleapi_profile_url IS NOT NULL
      AND inquiry_content IS NOT NULL)
    OR
    (request_type = 'clan_battle'
      AND clan_name IS NOT NULL
      AND royaleapi_clan_url IS NOT NULL
      AND participant_proposal IS NOT NULL
      AND battle_format IS NOT NULL)
    OR
    (request_type = 'admin_contact'
      AND subject IS NOT NULL
      AND inquiry_content IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_inquiries_public_created
  ON public.inquiries(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_by_created
  ON public.inquiries(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status_created
  ON public.inquiries(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.inquiry_password_attempts (
  inquiry_id uuid NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  session_hash text NOT NULL,
  attempt_count smallint NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 1 AND 5),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (inquiry_id, session_hash)
);

CREATE TABLE IF NOT EXISTS public.inquiry_access_grants (
  inquiry_id uuid NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  session_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (inquiry_id, session_hash)
);
CREATE INDEX IF NOT EXISTS idx_inquiry_access_grants_expiry
  ON public.inquiry_access_grants(expires_at);

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('new_inquiry', 'inquiry_update')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
  ON public.user_notifications(user_id, created_at DESC);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_password_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.inquiries,
  public.inquiry_password_attempts,
  public.inquiry_access_grants,
  public.user_notifications
FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE
  public.inquiries,
  public.inquiry_password_attempts,
  public.inquiry_access_grants,
  public.user_notifications
TO service_role;

CREATE OR REPLACE FUNCTION public.consume_inquiry_password_attempt(
  p_inquiry_id uuid,
  p_session_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  reserved_attempt smallint;
BEGIN
  INSERT INTO public.inquiry_password_attempts (
    inquiry_id,
    session_hash,
    attempt_count,
    expires_at
  )
  VALUES (p_inquiry_id, p_session_hash, 1, now() + interval '24 hours')
  ON CONFLICT (inquiry_id, session_hash) DO UPDATE
  SET
    attempt_count = CASE
      WHEN inquiry_password_attempts.expires_at <= now() THEN 1
      ELSE inquiry_password_attempts.attempt_count + 1
    END,
    expires_at = CASE
      WHEN inquiry_password_attempts.expires_at <= now() THEN now() + interval '24 hours'
      ELSE inquiry_password_attempts.expires_at
    END
  WHERE inquiry_password_attempts.expires_at <= now()
     OR inquiry_password_attempts.attempt_count < 5
  RETURNING attempt_count INTO reserved_attempt;

  RETURN reserved_attempt IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_inquiry_password_attempt(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_inquiry_password_attempt(uuid, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.notify_inquiry_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_notifications (user_id, inquiry_id, event_type, message)
    SELECT
      profile.id,
      NEW.id,
      'new_inquiry',
      '새 문의가 접수되었습니다.'
    FROM public.profiles AS profile
    WHERE profile.role = 'admin' OR profile.is_admin = true;
  ELSIF NEW.created_by IS NOT NULL
    AND (
      NEW.status IS DISTINCT FROM OLD.status
      OR NEW.admin_reply IS DISTINCT FROM OLD.admin_reply
    )
  THEN
    INSERT INTO public.user_notifications (user_id, inquiry_id, event_type, message)
    VALUES (
      NEW.created_by,
      NEW.id,
      'inquiry_update',
      '문의 상태 또는 관리자 답변이 변경되었습니다.'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_notify_inquiry_change ON public.inquiries;
CREATE TRIGGER tr_notify_inquiry_change
  AFTER INSERT OR UPDATE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_inquiry_change();
