-- Migration: Add auto-delete functionality to messages table
-- Created: 2026-02-11
-- Description: 메시지 자동삭제 기능 구현을 위한 컬럼 추가 및 정책 설정

-- 1️⃣ messages 테이블에 새 컬럼 추가
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours'),
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 2️⃣ 성능을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_messages_expires_at 
ON messages(expires_at) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_messages_is_deleted 
ON messages(is_deleted, created_at DESC);

-- 3️⃣ RLS (Row Level Security) 정책 - 유효한 메시지만 조회
CREATE POLICY "Users can view non-expired messages"
ON messages
FOR SELECT
USING (
  -- 만료되지 않거나 삭제되지 않은 메시지만
  (expires_at > now() OR expires_at IS NULL)
  AND (is_deleted = false OR is_deleted IS NULL)
);

-- 4️⃣ RLS 정책 - 본인 메시지만 수정
CREATE POLICY "Users can update their own messages"
ON messages
FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- 5️⃣ RLS 정책 - 본인 메시지만 삭제 (소프트 삭제)
CREATE POLICY "Users can soft-delete their own messages"
ON messages
FOR DELETE
USING (auth.uid() = author_id);

-- 6️⃣ 삭제 로그 테이블 (Analytics/Audit)
CREATE TABLE IF NOT EXISTS deletion_logs (
  id bigserial primary key,
  event_type text NOT NULL,
  deleted_count integer DEFAULT 0,
  soft_deleted_count integer DEFAULT 0,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  success BOOLEAN DEFAULT true,
  error_message text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deletion_logs_executed_at 
ON deletion_logs(executed_at DESC);

-- 7️⃣ 트리거: 메시지 삽입 시 자동으로 expires_at 설정 (기본값 24시간)
CREATE OR REPLACE FUNCTION set_message_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_set_expiration ON messages;
CREATE TRIGGER message_set_expiration
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION set_message_expiration();

-- 8️⃣ 주석 추가 (테이블 문서화)
COMMENT ON COLUMN messages.expires_at IS '메시지 만료 시간 (기본값: 생성 시간 + 24시간)';
COMMENT ON COLUMN messages.is_deleted IS '소프트 삭제 플래그 (물리적 삭제 없이 표시)';
COMMENT ON TABLE deletion_logs IS '자동삭제 작업 로그 (감시/분석용)';

-- 마이그레이션 완료 메시지
SELECT now() as migration_completed, 'Auto-delete functionality added to messages table' as status;
