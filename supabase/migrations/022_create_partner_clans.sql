CREATE TABLE IF NOT EXISTS public.partner_clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  royaleapi_url text NOT NULL CHECK (char_length(royaleapi_url) <= 500),
  collaboration_activities text NOT NULL
    CHECK (char_length(btrim(collaboration_activities)) BETWEEN 1 AND 5000),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_clans_created_at
  ON public.partner_clans(created_at DESC);

ALTER TABLE public.partner_clans ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.partner_clans FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.partner_clans TO service_role;
