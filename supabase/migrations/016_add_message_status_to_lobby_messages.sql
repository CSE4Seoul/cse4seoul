-- Migration 016: Add message_status column to lobby_messages and RLS for Admin actions

-- 1) Add message_status column with constraint
ALTER TABLE public.lobby_messages 
ADD COLUMN IF NOT EXISTS message_status TEXT DEFAULT 'NORMAL' 
CHECK (message_status IN ('NORMAL', 'FLAGGED', 'WARNING', 'HIDDEN', 'MUTED'));

-- 2) Index for performance when querying flagged or warning messages
CREATE INDEX IF NOT EXISTS idx_lobby_messages_status 
ON public.lobby_messages(message_status);

-- 3) Enable RLS on lobby_messages if not enabled
ALTER TABLE public.lobby_messages ENABLE ROW LEVEL SECURITY;

-- 4) RLS policies for lobby_messages
-- Anyone can view non-deleted lobby messages
DROP POLICY IF EXISTS "Anyone can view lobby messages" ON public.lobby_messages;
CREATE POLICY "Anyone can view lobby messages"
ON public.lobby_messages
FOR SELECT
USING (true);

-- Anyone can insert messages (service or client)
DROP POLICY IF EXISTS "Anyone can insert lobby messages" ON public.lobby_messages;
CREATE POLICY "Anyone can insert lobby messages"
ON public.lobby_messages
FOR INSERT
WITH CHECK (true);

-- Only admins can update lobby messages (e.g. changing message_status)
DROP POLICY IF EXISTS "Admins can update lobby messages" ON public.lobby_messages;
CREATE POLICY "Admins can update lobby messages"
ON public.lobby_messages
FOR UPDATE
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Only admins can delete lobby messages
DROP POLICY IF EXISTS "Admins can delete lobby messages" ON public.lobby_messages;
CREATE POLICY "Admins can delete lobby messages"
ON public.lobby_messages
FOR DELETE
USING (public.check_is_admin(auth.uid()));
