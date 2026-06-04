-- lobby_messages 테이블에 ip_address 컬럼 추가
ALTER TABLE lobby_messages ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- IP 주소와 생성일 기준 인덱스 추가 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_lobby_messages_ip_created_at ON lobby_messages(ip_address, created_at);

-- RLS 정책 업데이트 (필요한 경우)
-- 기본적으로 서버 측에서 insert하므로 별도의 정책 없이도 작동할 수 있으나,
-- 클라이언트에서 직접 insert하는 경우 ip_address를 조작할 수 없도록 주의가 필요함.
-- 여기서는 일단 컬럼 추가만 진행.
