# 🔒 보안 감시 보고서 (Security Audit Report)

**감시 대상:** CSE4Seoul Chat 시스템
**감시 일시:** 2026-02-11
**심각도:** 🔴 **높음 (High)**

---

## 📌 요약 (Executive Summary)

현재 코드에서 **암호화와 자동삭제 로직이 구현되지 않았습니다**. UI에는 보안 기능이 명시되어 있으나 **실제 기능이 존재하지 않습니다.** 이는 사용자에게 거짓 보안 감각(False Sense of Security)을 제공하는 심각한 문제입니다.

---

## 1. 🔐 암호화 문제

### 현재 상태
- **UI 표시:** "E2E 암호화", "AES-256 암호화 강도" 표시
- **실제 구현:** ❌ **없음**

### 문제점

#### 1-1. 암호화 라이브러리 부재
```json
// package.json - 현재 상태
"dependencies": {
  "@supabase/supabase-js": "^2.95.3",
  // ❌ libsodium, TweetNaCl, crypto-js 등 암호화 라이브러리 없음
}
```

#### 1-2. 메시지 평문 저장
```typescript
// app/(main)/chat/page.tsx (Line 128-135)
const { error } = await supabase.from('messages').insert({
  content: newMessage.trim(),  // ❌ 평문(Plain Text) 저장!
  author_id: user.id,
  author_name: userAgentName,
  is_anonymous: true,
});
```

**문제:** 메시지가 암호화되지 않고 평문으로 Supabase 데이터베이스에 저장됨

#### 1-3. 데이터베이스에서 암호화되지 않은 상태로 전송
```typescript
// app/(main)/chat/page.tsx (Line 52-64)
const fetchMessages = async () => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(100);
  
  setMessages(data || []);  // ❌ 평문 메시지 클라이언트에 전송
};
```

#### 1-4. 메시지 출력 시 XSS 취약점
```typescript
// app/(main)/chat/page.tsx (Line 267)
<p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
```

**문제:** 사용자 입력을 직접 렌더링하면 XSS 공격 가능
- 예: `<img src=x onerror="alert('XSS')">`를 메시지로 보낼 수 있음

---

## 2. ⏰ 24시간 자동삭제 기능

### 현재 상태
- **UI 표시:** "24시간 후 자동 삭제" (Line 382)
- **실제 구현:** ❌ **없음**

### 문제점

#### 2-1. 데이터베이스에서 자동삭제 정책 없음
```typescript
// 메시지 저장 로직에서
await supabase.from('messages').insert({
  content: newMessage.trim(),
  author_id: user.id,
  author_name: userAgentName,
  is_anonymous: true,
  // ❌ created_at 기반 자동삭제 정책 없음
  // ❌ TTL(Time To Live) 설정 없음
  // ❌ expires_at 컬럼 없음
});
```

#### 2-2. 자동삭제 스케줄러 부재
```
❌ Cron Job 없음
❌ Database Triggers 없음
❌ Cloud Function 없음
❌ 클라이언트 사이드 삭제 로직 없음
```

#### 2-3. 메시지가 무한정 저장됨
**현실:**
- 메시지는 Supabase에 무한정 저장됨
- 사용자가 수동으로 삭제해야 함
- 개인정보 보호 정책 위반 가능성

---

## 3. 📊 상세 코드 분석

### 3-1 Chat Page 문제점
| 항목 | 상태 | 파일 | 라인 |
|------|------|------|------|
| 암호화 구현 | ❌ | `app/(main)/chat/page.tsx` | 128-135 |
| 자동삭제 | ❌ | 전체 | - |
| XSS 방지 | ❌ | `app/(main)/chat/page.tsx` | 267 |
| 입력 검증 | ⚠️ | `app/(main)/chat/page.tsx` | 128 |

### 3-2 Board 페이지도 동일한 문제
```typescript
// app/(main)/board/actions.ts (Line 50-65)
const { error } = await supabase.from('posts').insert({
  title,
  content,  // ❌ 평문 저장
  author_id: user.id,
  author_name: profile?.full_name || 'Unknown',
  is_anonymous,
});
```

---

## 4. 🛠️ 권장 해결 방안

### 우선순위 1: 암호화 구현 🔴 (긴급)

**방안 A: 클라이언트 사이드 암호화 (권장)**
```bash
# 라이브러리 설치
npm install tweetnacl-js libsodium.js
```

```typescript
import { box, randomBytes } from 'tweetnacl-js';
import { encodeUTF8, encodeBase64 } from 'tweetnacl-util';

// 메시지 암호화
const publicKey = new Uint8Array([...]); // 서버 공개키
const encrypted = box(
  encodeUTF8(message),
  randomBytes(24),
  publicKey,
  secretKey
);
```

**방안 B: Supabase pgcrypto 확장 (서버 사이드)**
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE messages (
  id bigserial primary key,
  content text NOT NULL,
  encrypted_content bytea, -- 암호화 컬럼
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone -- 자동삭제용
);

-- 트리거: 자동 암호화
CREATE TRIGGER encrypt_message_trigger
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION crypt_message();
```

---

### 우선순위 2: 자동삭제 기능 🔴 (긴급)

**방안: Supabase 정책 + Edge Function**

```sql
-- 1. expires_at 컬럼 추가
ALTER TABLE messages 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE 
DEFAULT (now() + interval '24 hours');

-- 2. RLS 정책으로 만료된 메시지 제한
CREATE POLICY "Prevent reading expired messages"
ON messages
FOR SELECT
USING (expires_at > now());

-- 3. Cron 작업으로 자동 삭제
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'delete_expired_messages',
  '0 * * * *', -- 매시간
  $$DELETE FROM messages WHERE expires_at < now()$$
);
```

---

### 우선순위 3: XSS 방지 🟡 (높음)

```typescript
// React에서 자동 이스케이프 (현재는 잘 작동)
<p>{msg.content}</p>  // ✅ 안전

// 하지만 DOMPurify 추가 권장
import DOMPurify from 'dompurify';

<p>{DOMPurify.sanitize(msg.content)}</p>
```

---

### 우선순위 4: RLS 정책 🟡 (높음)

```sql
-- 메시지 조회: 본인과 익명 메시지만
CREATE POLICY "Users can view their own and public messages"
ON messages
FOR SELECT
USING (
  auth.uid() = author_id 
  OR is_anonymous = true
);

-- 메시지 변경: 본인만
CREATE POLICY "Users can only modify their own messages"
ON messages
FOR UPDATE
USING (auth.uid() = author_id);

-- 메시지 삭제: 본인만
CREATE POLICY "Users can only delete their own messages"
ON messages
FOR DELETE
USING (auth.uid() = author_id);
```

---

## 5. 📋 구현 체크리스트

- [ ] 암호화 라이브러리 설치 (tweetnacl-js)
- [ ] 메시지 암호화 로직 구현
- [ ] `expires_at` 컬럼 추가
- [ ] Supabase 자동삭제 정책 설정
- [ ] RLS 정책 구현
- [ ] DOMPurify 라이브러리 추가
- [ ] 입력 검증 강화
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 수행
- [ ] 보안 감시 재점검

---

## 6. 🚨 즉시 조치 사항

**현재 UI에서 "암호화됨" / "24시간 자동삭제" 표시 제거 필요:**

```typescript
// 임시 조치: 거짓 광고 제거
<div className="flex items-center gap-1">
  <Shield className="w-3 h-3" />
  <span>E2E 암호화</span> {/* ❌ 제거 또는 "준비 중" 으로 변경 */}
</div>

<li className="flex items-start gap-2">
  <span className="text-yellow-500 mt-0.5">⚠️</span> {/* 🔴 →  ⚠️로 변경 */}
  <span>24시간 후 자동 삭제 (구현 예정)</span>
</li>
```

---

## 결론

| 항목 | 현재 | 필요 | 우선순위 |
|------|------|------|----------|
| 메시지 암호화 | ❌ | ✅ | 🔴 긴급 |
| 자동삭제 기능 | ❌ | ✅ | 🔴 긴급 |
| XSS 방지 | ⚠️ | ✅ | 🟡 높음 |
| RLS 정책 | ❌ | ✅ | 🟡 높음 |
| 입력 검증 | ⚠️ | ✅ | 🟡 높음 |

**조치 후 재감시 필수입니다.**

---

*Report Generated: 2026-02-11*
*Next Audit: 2026-02-18*
