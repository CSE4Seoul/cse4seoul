# 🚀 자동삭제 기능 배포 가이드

## 📋 개요

다음은 자동삭제 기능을 프로덕션에 배포하기 위한 단계별 가이드입니다.

**배포 예상 시간:** 30분  
**난이도:** 중상  
**필수 권한:** Supabase Superuser / Service Role Key

---

## 📦 배포 구성

### 1️⃣ 클라이언트 코드 (✅ 완료됨)

**파일:** `/app/(main)/chat/page.tsx`

**수정사항:**
- [x] `expires_at`, `is_deleted` 필드가 메시지 생성 시 자동 설정
- [x] 만료된 메시지 필터링 (쿼리에 `.gt('expires_at', now())` 추가)
- [x] 실시간 구독에서 만료 체크
- [x] 메시지 렌더링에 만료 시간 표시
- [x] 본인 메시지 삭제 버튼 추가
- [x] Trash2 아이콘 import

**상태:** ✅ 준비됨

---

### 2️⃣ 데이터베이스 (마이그레이션 필요)

**파일:** `/supabase/migrations/001_add_auto_delete_feature.sql`

**스키마 변경:**
- [x] `messages.expires_at` 컬럼 추가 (기본값: 24시간)
- [x] `messages.is_deleted` 컬럼 추가 (소프트 삭제)
- [x] `deletion_logs` 테이블 생성
- [x] 관련 인덱스 생성
- [x] RLS 정책 구성
- [x] 트리거 설정

**상태:** ⏳ 수동 적용 필요

---

### 3️⃣ Edge Function (배포 필요)

**파일:** `/supabase/functions/delete-expired-messages/index.ts`

**기능:**
- [x] 만료된 메시지 자동 삭제 (`expires_at < now()`)
- [x] 소프트 삭제된 메시지 정리 (7일 이상)
- [x] 삭제 로그 기록
- [x] 에러 핸들링

**상태:** ⏳ Supabase에 배포 필요

---

### 4️⃣ Cron 작업 (설정 필요)

**Cron 표현식:** `0 * * * *` (매시간)

**상태:** ⏳ Supabase 콘솔에서 설정 필요

---

## 🛠️ 배포 단계

### Phase 1: 로컬 확인 (5분)

```bash
# 1. 코드 변경사항 확인
git status
# → app/(main)/chat/page.tsx 수정됨 ✓
# → supabase/ 디렉토리 추가됨 ✓
```

### Phase 2: 데이터베이스 마이그레이션 (10분)

#### 옵션 A: Supabase 콘솔을 통한 SQL 실행 (권장)

1. **Supabase 대시보드 접속**
   ```
   https://app.supabase.com/project/[PROJECT_ID]/
   ```

2. **SQL Editor 클릭**
   - 왼쪽 사이드바 → "SQL Editor" 클릭

3. **"Create new query" 클릭**

4. **마이그레이션 SQL 복사 및 붙여넣기**
   - 파일: `/supabase/migrations/001_add_auto_delete_feature.sql`
   - 전체 내용 복사

5. **쿼리 실행**
   ```sql
   -- 각 섹션별로 실행하거나 전체 한 번에 실행
   -- 진행 상황 확인: "Executing..." → "Completed"
   ```

6. **결과 확인**
   ```
   ✅ ALTER TABLE
   ✅ CREATE INDEX
   ✅ CREATE POLICY
   ✅ CREATE TABLE
   ✅ CREATE FUNCTION
   ✅ CREATE TRIGGER
   ✅ COMMENT
   ```

#### 옵션 B: Supabase CLI 사용

```bash
# 1. 프로젝트 링크 (첫 실행 시만)
supabase link --project-ref [PROJECT_ID]

# 2. 마이그레이션 적용
supabase db push

# 3. 상태 확인
supabase status
```

#### 옵션 C: 수동으로 각 SQL 섹션 실행

생략됨 (권장하지 않음 - 오류 가능성)

---

### Phase 3: Edge Function 배포 (10분)

#### 옵션 A: Supabase 콘솔

1. **Edge Functions 페이지 접속**
   ```
   https://app.supabase.com/project/[PROJECT_ID]/functions
   ```

2. **"Create new function" 클릭**

3. **이름 입력:** `delete-expired-messages`

4. **코드 복사 및 붙여넣기**
   - 파일: `/supabase/functions/delete-expired-messages/index.ts` 내용 전부

5. **"Deploy" 클릭**

6. **배포 확인**
   ```
   Deployment Status: ✅ Success
   Function URL: https://[PROJECT_ID].supabase.co/functions/v1/delete-expired-messages
   ```

#### 옵션 B: Supabase CLI

```bash
# 1. 로그인
supabase login

# 2. 함수 배포
supabase functions deploy delete-expired-messages

# 3. 배포 확인
# → "Deployed to https://..." 메시지 확인
```

---

### Phase 4: Cron 작업 설정 (8분)

#### 옵션 A: Supabase 콘솔 (권장)

1. **Edge Functions 페이지에서 함수 선택**
   ```
   delete-expired-messages
   ```

2. **"Scheduled Jobs" 또는 "Cron" 탭 클릭**

3. **"Add new cron job" 또는 같은 버튼 클릭**

4. **설정 입력**
   | 설정 | 값 |
   |------|-----|
   | **Enabled** | ✅ On |
   | **Cron** | `0 * * * *` |
   | **Timezone** | `UTC` |

5. **"Save" 또는 "Deploy" 클릭**

6. **상태 확인**
   ```
   Status: ✅ Active
   Next run: [시간]
   ```

#### 옵션 B: SQL을 통한 pg_cron

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'delete-expired-messages-hourly',
  '0 * * * *',
  'SELECT net.http_post(
    ''https://[PROJECT_ID].supabase.co/functions/v1/delete-expired-messages'',
    ''{}''::jsonb,
    jsonb_build_object(
      ''Authorization'',
      ''Bearer [SERVICE_ROLE_KEY]''
    )
  )'
);
```

⚠️ SERVICE_ROLE_KEY는 환경변수로 관리하세요!

---

## ✅ 배포 검증

### 1️⃣ 클라이언트 코드 테스트

```bash
# 1. 개발 서버 시작
npm run dev

# 2. 브라우저에서 테스트
# http://localhost:3000/(main)/chat
```

**테스트 체크리스트:**
- [ ] 메시지 전송 시 "만료: [날짜/시간]" 표시 확인
- [ ] 홈인 메시지에 작은 휴지통 아이콘이 보임
- [ ] 아이콘 호버 시 배경색 변함
- [ ] 삭제 클릭 → 확인 대화상자 나타남
- [ ] 삭제 후 메시지 화면에서 사라짐

### 2️⃣ 데이터베이스 검증

```sql
-- 1. 새 컬럼 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- 결과:
-- expires_at | timestamp with time zone | now() + INTERVAL '24:00:00'
-- is_deleted | boolean                  | false

-- 2. 테이블 구조 확인
\d messages

-- 3. 인덱스 확인
SELECT indexname FROM pg_indexes 
WHERE tablename = 'messages' AND indexname LIKE '%expires%';

-- 4. RLS 정책 확인
SELECT policyname FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'messages';

-- 5. 트리거 확인
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'messages';
```

### 3️⃣ Edge Function 테스트

```bash
# 함수 직접 호출
curl -X POST \
  'https://[PROJECT_ID].supabase.co/functions/v1/delete-expired-messages' \
  -H 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{}'

# 응답 예시:
# {
#   "success": true,
#   "message": "✅ 메시지 삭제 작업 완료",
#   "deleted": 5,
#   "soft_deleted_cleanup": 0,
#   "timestamp": "2026-02-11T15:30:00.000Z"
# }
```

**또는 Supabase 콘솔:**
1. Functions → delete-expired-messages → Logs
2. 최근 실행 기록 확인
3. Status: ✅ Success / ❌ Failed 확인

### 4️⃣ Cron 작업 테스트

```sql
-- Cron 작업 목록 확인
SELECT job_name, schedule, command FROM cron.job;

-- 최근 실행 로그 확인
SELECT job_name, last_run, return_message 
FROM cron.job_run_details 
WHERE job_name LIKE '%delete%'
ORDER BY end_time DESC 
LIMIT 5;
```

---

## 🐛 트러블슈팅

### 문제 1: "Function not found" 오류

**원인:** Edge Function이 배포되지 않음

**해결책:**
```bash
# 1. 함수 상태 확인
supabase functions list

# 2. 함수 재배포
supabase functions deploy delete-expired-messages

# 3. 콘솔에서 확인
# Functions → delete-expired-messages → Status: Active?
```

### 문제 2: 메시지가 deleteMessage되지 않음

**원인:** 데이터베이스 마이그레이션 미적용

**확인:**
```sql
-- 테이블 구조 확인
\d messages
-- expires_at, is_deleted 컬럼이 있는지 확인
```

**해결책:**
```bash
# 마이그레이션 다시 실행
supabase db push
```

### 문제 3: Cron 작업이 실행되지 않음

**원인:** 
- 활성화되지 않음
- 잘못된 cron 표현식
- 함수 오류

**해결책:**
```sql
-- 1. 상태 확인
SELECT * FROM cron.job WHERE jobname LIKE '%delete%';

-- 2. 활성화되지 않으면 활성화
UPDATE cron.job SET active = true WHERE jobname = 'delete-expired-messages-hourly';

-- 3. 실행 로그 확인
SELECT * FROM cron.job_run_details 
WHERE job_name = 'delete-expired-messages-hourly'
ORDER BY end_time DESC LIMIT 10;
```

---

## 📊 모니터링

### 삭제 통계

```sql
SELECT 
  date_trunc('day', executed_at) as date,
  SUM(deleted_count) as total_deleted,
  COUNT(*) as job_executions
FROM deletion_logs
WHERE executed_at > now() - interval '7 days'
GROUP BY date_trunc('day', executed_at)
ORDER BY date DESC;
```

### 메시지 수명 분석

```sql
SELECT 
  ROUND(EXTRACT(EPOCH FROM (expires_at - created_at))/3600) as ttl_hours,
  COUNT(*) as message_count
FROM messages
WHERE is_deleted = false
GROUP BY ttl_hours
ORDER BY message_count DESC;
```

---

## 🎯 최종 체크리스트

배포 전 확인하기:

- [ ] `app/(main)/chat/page.tsx` 수정됨
- [ ] `/supabase/migrations/001_add_auto_delete_feature.sql` 존재
- [ ] `/supabase/functions/delete-expired-messages/index.ts` 존재
- [ ] 데이터베이스 마이그레이션 실행됨
- [ ] Edge Function 배포됨
- [ ] Cron 작업 설정 완료
- [ ] 로컬 테스트 완료 ✅
- [ ] 메시지 삭제 기능 테스트 완료 ✅
- [ ] Edge Function 수동 호출 테스트 완료 ✅
- [ ] Production으로 배포 가능

---

## 🚀 프로덕션 배포

```bash
# 1. 커밋
git add .
git commit -m "feat: add auto-delete message functionality

- Add expires_at and is_deleted columns to messages table
- Implement message deletion function
- Deploy Supabase Edge Function for automatic cleanup
- Configure hourly cron job for message expiration
- Add UI for message deletion with Trash2 icon
"

# 2. 푸시
git push origin main

# 3. 배포 (Vercel 자동 배포)
# 또는 수동 배포:
vercel deploy --prod

# 4. Supabase 함수 배포 (별도)
supabase functions deploy delete-expired-messages
```

---

## 📞 지원

**문제 발생 시:**
1. `/SECURITY_AUDIT.md` - 보안 문제 확인
2. `/IMPLEMENTATION_GUIDE.md` - 상세 구현 가이드
3. `/CRON_SETUP_GUIDE.md` - Cron 작업 설정

---

**배포 완료 예상:** 2026-02-11  
**예상 가동 시간:** 24시간 이내 (첫 실행)

🎉 **자동삭제 기능 배포 완료!**
