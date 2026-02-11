# 🤖 Supabase Cron Job 설정 가이드

## 📋 개요

`delete-expired-messages` Edge Function을 정기적으로 실행하기 위한 Cron 작업 설정 방법입니다.

---

## 1️⃣ 방법 A: Supabase 대시보드를 통한 설정 (권장)

### 단계 1: Supabase 프로젝트 대시보드 접속
```
https://app.supabase.com/project/[PROJECT_ID]/
```

### 단계 2: 왼쪽 사이드바에서 "Edge Functions" 클릭

### 단계 3: `delete-expired-messages` 함수 선택

### 단계 4: 오른쪽 상단의 "Cron" 탭 클릭

### 단계 5: 다음 설정 입력

| 항목 | 값 |
|------|-----|
| **Enabled** | ✅ On |
| **Cron Expression** | `0 * * * *` |
| **Timezone** | `UTC` (또는 서버 시간대) |

**Cron Expression 설명:**
- `0 * * * *` = 매시간 정각 (00분)
- `0 0 * * *` = 매일 자정
- `0 */4 * * *` = 4시간마다
- `0 0 * * 0` = 매주 일요일 자정

**권장값:** `0 * * * *` (매시간 실행)

### 단계 6: "Deploy" 클릭하여 저장

---

## 2️⃣ 방법 B: Supabase CLI를 통한 설정

### 설치 확인
```bash
supabase --version
# v1.100.0 이상 필요
```

### 함수 배포
```bash
supabase functions deploy delete-expired-messages
```

### Cron 설정 (CLI)
```bash
# 프로젝트 링크
supabase link --project-ref [PROJECT_ID]

# 함수에 Cron 설정 추가
supabase functions update delete-expired-messages \
  --cron "0 * * * *"
```

---

## 3️⃣ 방법 C: SQL을 통한 Cron 설정 (고급)

Supabase PostgreSQL에서 직접 `pg_cron` 확장을 사용:

```sql
-- pg_cron 확장 활성화 (Superuser 권한 필요)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cron 작업 생성
SELECT cron.schedule(
  'delete-expired-messages-hourly',
  '0 * * * *',  -- 매시간
  $$
    SELECT net.http_post(
      'https://[PROJECT_ID].supabase.co/functions/v1/delete-expired-messages',
      to_jsonb('{}'),
      jsonb_build_object(
        'Authorization',
        'Bearer [SERVICE_ROLE_KEY]'
      )
    );
  $$
);

-- 설정 확인
SELECT * FROM cron.job WHERE jobname = 'delete-expired-messages-hourly';
```

⚠️ **주의:** SERVICE_ROLE_KEY는 환경변수로 관리하세요 (코드에 직접 입력 금지)

---

## 4️⃣ 테스트 방법

### 직접 함수 호출
```bash
curl -X POST \
  'https://[PROJECT_ID].supabase.co/functions/v1/delete-expired-messages' \
  -H 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### 응답 예시
```json
{
  "success": true,
  "message": "✅ 메시지 삭제 작업 완료",
  "deleted": 42,
  "soft_deleted_cleanup": 5,
  "timestamp": "2026-02-11T15:30:45.123Z"
}
```

### Supabase 로그 확인
```
Supabase Dashboard → Edge Functions → delete-expired-messages → Logs
```

---

## 5️⃣ 모니터링 및 청리싱

### 삭제 로그 조회
```sql
-- 최근 삭제 작업 조회
SELECT 
  executed_at,
  deleted_count,
  soft_deleted_count,
  success
FROM deletion_logs
ORDER BY executed_at DESC
LIMIT 10;

-- 시간대별 삭제 통계
SELECT 
  date_trunc('hour', executed_at) as hour,
  SUM(deleted_count) as total_deleted,
  COUNT(*) as executions
FROM deletion_logs
WHERE success = true
  AND executed_at > now() - interval '7 days'
GROUP BY date_trunc('hour', executed_at)
ORDER BY hour DESC;
```

### 실패한 작업 조회
```sql
SELECT 
  executed_at,
  error_message,
  deleted_count
FROM deletion_logs
WHERE success = false
ORDER BY executed_at DESC;
```

---

## 6️⃣ 설정 확인 체크리스트

- [ ] Supabase 프로젝트에 Edge Function 배포됨
- [ ] Cron 작업이 "Enabled" 상태
- [ ] Cron Expression이 올바름 (`0 * * * *`)
- [ ] 데이터베이스 마이그레이션 적용됨
- [ ] RLS 정책 활성화됨
- [ ] 테스트 호출 성공 ✅

---

## 7️⃣ 트러블슈팅

### 문제: "Function not found"
**해결책:**
```bash
# 함수 재배포
supabase functions deploy delete-expired-messages
```

### 문제: "Unauthorized" (401)
**해결책:**
- SERVICE_ROLE_KEY가 올바른지 확인
- Supabase 프로젝트에서 새 키 생성

### 문제: 메시지가 삭제되지 않음
**해결책:**
```sql
-- 수동으로 삭제 실행
DELETE FROM messages 
WHERE expires_at < now() AND is_deleted = false;

-- 삭제된 행 수 확인
-- "DELETE X" 메시지 확인
```

### 문제: Cron 작업이 실행되지 않음
**해결책:**
```sql
-- pg_cron 로그 확인
SELECT job_name, last_run, return_message 
FROM cron.job_run_details 
WHERE job_name = 'delete-expired-messages-hourly'
ORDER BY end_time DESC 
LIMIT 5;
```

---

## 8️⃣ 성능 최적화

### 대량 메시지 삭제 시 배치 처리 권장
```sql
-- Edge Function에서 배치 삭제
WITH deleted AS (
  DELETE FROM messages
  WHERE expires_at < now()
    AND is_deleted = false
  LIMIT 10000  -- 한 번에 10,000개만 처리
  RETURNING id
)
SELECT COUNT(*) as deleted_count FROM deleted;
```

### 인덱스 최적화
```sql
-- 자주 조회되는 패턴에 맞춘 인덱스
CREATE INDEX idx_messages_active 
ON messages(created_at DESC) 
WHERE is_deleted = false 
  AND expires_at > now();
```

---

## 9️⃣ 비용 절감 팁

- **실행 빈도**: 매시간 실행 (충분함)
  - 더 자주 실행하면 비용 증가 ❌
- **배치 크기**: 10,000개 단위 삭제
  - 한 번에 모두 삭제하면 DB 부하 증가 ❌
- **로그 보관**: 최근 30일만 보관
  ```sql
  DELETE FROM deletion_logs WHERE created_at < now() - interval '30 days';
  ```

---

## 🔟 다음 단계

1. ✅ 위의 설정 완료
2. ✅ 데이터베이스 마이그레이션 실행
3. ✅ Edge Function 배포
4. ✅ Cron 작업 설정
5. ✅ 테스트 (수동 호출)
6. ✅ 모니터링 대시보드 구성

---

**자동삭제 기능이 성공적으로 설정되었습니다! 🎉**

생성 날짜: 2026-02-11  
최종 업데이트: 2026-02-11
