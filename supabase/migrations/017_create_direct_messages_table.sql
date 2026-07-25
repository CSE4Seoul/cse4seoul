-- Migration 017: Create direct_messages table for encrypted 1:1 private chats (DM)
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL, -- AES-GCM 암호화된 메시지 본문 ("ENC:...")
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '7 days') NOT NULL,
  is_deleted boolean DEFAULT false NOT NULL
);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- 1) SELECT: 본인이 송신자(sender)이거나 수신자(receiver)인 개설 대화의 메시지만 조회 가능
DROP POLICY IF EXISTS "Allow users to read own direct messages" ON public.direct_messages;
CREATE POLICY "Allow users to read own direct messages" ON public.direct_messages
  FOR SELECT
  USING (
    (auth.uid() = sender_id OR auth.uid() = receiver_id) AND
    (is_deleted = false) AND
    (expires_at > now())
  );

-- 2) INSERT: 본인의 sender_id로만 개인 메시지 발송 가능
DROP POLICY IF EXISTS "Allow users to insert own direct messages" ON public.direct_messages;
CREATE POLICY "Allow users to insert own direct messages" ON public.direct_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
  );

-- 3) UPDATE: 송신자 또는 수신자만 읽음 처리(is_read) 및 소프트 삭제(is_deleted) 가능
DROP POLICY IF EXISTS "Allow users to update own direct messages" ON public.direct_messages;
CREATE POLICY "Allow users to update own direct messages" ON public.direct_messages
  FOR UPDATE
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  )
  WITH CHECK (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- 4) DELETE: 송신자 또는 수신자만 메시지 삭제 가능
DROP POLICY IF EXISTS "Allow users to delete own direct messages" ON public.direct_messages;
CREATE POLICY "Allow users to delete own direct messages" ON public.direct_messages
  FOR DELETE
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- 성능 최적화 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation 
  ON public.direct_messages(sender_id, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_read 
  ON public.direct_messages(receiver_id, is_read) 
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_direct_messages_expires_at 
  ON public.direct_messages(expires_at) 
  WHERE is_deleted = false;
