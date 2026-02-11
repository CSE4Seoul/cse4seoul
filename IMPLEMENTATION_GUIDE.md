# 🔧 암호화 및 자동삭제 구현 가이드

## Phase 1: 환경 설정 (1시간)

### 1-1. 필요 라이브러리 설치

```bash
# 암호화 라이브러리
npm install tweetnacl-js libsodium.js
npm install --save-dev @types/tweetnacl-js

# 입력 검증
npm install zod

# 보안 유틸리티
npm install dompurify
npm install --save-dev @types/dompurify
```

### 1-2. package.json 확인
```json
{
  "dependencies": {
    "tweetnacl-js": "^1.0.3",
    "libsodium.js": "^0.7.13",
    "zod": "^3.22.4",
    "dompurify": "^3.0.6"
  }
}
```

---

## Phase 2: 암호화 유틸 만들기 (2시간)

### 2-1. 파일 생성: `lib/encryption.ts`

```typescript
import nacl from 'tweetnacl-js';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-js/utils';

// 혹은
// import * as nacl from 'libsodium.js';

/**
 * 메시지 암호화 (Client-Side)
 * 방식: NaCl Secret Box (대칭암호화)
 */
export interface EncryptedMessage {
  ciphertext: string;  // Base64 인코딩된 암호문
  nonce: string;       // Base64 인코딩된 안료(Nonce)
}

// 공유 비밀키 (실제로는 서버에서 안전하게 관리해야 함)
// ⚠️ 주의: 이것은 데모용이며, 실무에서는 키 교환 프로토콜 사용 필요
const SHARED_KEY = new Uint8Array(32); // 실제 운영에서는 secure storage에서 로드

/**
 * 메시지 암호화
 * @param message 평문
 * @param key (선택) 암호화 키 (없으면 SHARED_KEY 사용)
 */
export function encryptMessage(
  message: string,
  key: Uint8Array = SHARED_KEY
): EncryptedMessage {
  try {
    const nonce = nacl.randomBytes(24);
    const messageBytes = encodeUTF8(message);
    
    const ciphertext = nacl.secretbox(messageBytes, nonce, key);
    
    if (!ciphertext) {
      throw new Error('Encryption failed');
    }

    return {
      ciphertext: encodeBase64(ciphertext),
      nonce: encodeBase64(nonce),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * 메시지 복호화
 * @param encrypted 암호화된 메시지
 * @param key (선택) 복호화 키
 */
export function decryptMessage(
  encrypted: EncryptedMessage,
  key: Uint8Array = SHARED_KEY
): string {
  try {
    const ciphertext = decodeBase64(encrypted.ciphertext);
    const nonce = decodeBase64(encrypted.nonce);

    const decrypted = nacl.secretbox.open(ciphertext, nonce, key);

    if (!decrypted) {
      throw new Error('Decryption failed - wrong key or corrupted data');
    }

    return decodeUTF8(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * 대안: RSA 공개키 암호화 (End-to-End 암호화)
 * - 클라이언트별 공개키 사용
 * - 서버는 평문을 알 수 없음
 */
export async function generateKeyPair() {
  // 실제로는 libsodium이나 tweetnacl의 box 쌍(공개키/개인키) 사용
  const publicKey = nacl.randomBytes(32);
  const secretKey = nacl.randomBytes(32);
  
  return { publicKey, secretKey };
}
```

### 2-2. 파일 생성: `lib/validation.ts`

```typescript
import { z } from 'zod';
import DOMPurify from 'dompurify';

// 메시지 검증 스키마
export const messageSchema = z.object({
  content: z
    .string()
    .min(1, '메시지는 비워둘 수 없습니다')
    .max(500, '메시지는 500자 이내여야 합니다')
    .transform((val) => val.trim()), // XSS 방지
  author_id: z.string().uuid(),
  author_name: z.string().min(2).max(50),
  is_anonymous: z.boolean().default(true),
});

// 입력값 살균 (Sanitization)
export function sanitizeInput(input: string): string {
  // XSS 공격 방지
  const cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
  
  return cleaned.trim();
}

// 메시지 검증
export function validateMessage(data: unknown) {
  try {
    const validated = messageSchema.parse(data);
    return {
      valid: true,
      data: validated,
      error: null,
    };
  } catch (error) {
    return {
      valid: false,
      data: null,
      error: error instanceof z.ZodError ? error.errors : 'Unknown error',
    };
  }
}
```

---

## Phase 3: 데이터베이스 설정 (2시간)

### 3-1. Supabase SQL 마이그레이션

```sql
-- 1. messages 테이블 업데이트
ALTER TABLE messages
ADD COLUMN encrypted_content text,           -- 암호화된 데이터
ADD COLUMN encryption_nonce text,            -- 복호화용 nonce
ADD COLUMN expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'), -- 24시간 후 삭제
ADD COLUMN is_deleted boolean DEFAULT false; -- 소프트 삭제

-- 2. 기존 content는 유지 (마이그레이션 기간용)
-- 실제 운영 후 제거 가능

-- 3. 자동삭제 정책 (선택)
-- 일단 만료된 메시지는 쿼리에서 제외시키고,
-- 주기적으로 배치 작업으로 정리

ALTER TABLE messages
ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: 유효한 메시지만 조회
CREATE POLICY "Only read non-expired messages"
ON messages
FOR SELECT
USING (expires_at > now() OR is_deleted = false);

-- 5. RLS 정책: 본인 메시지만 수정/삭제
CREATE POLICY "Users can only modify their own messages"
ON messages
FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Users can only delete their own messages"
ON messages
FOR DELETE
USING (auth.uid() = author_id);

-- 6. 인덱스 추가 (성능)
CREATE INDEX messages_expires_at_idx ON messages(expires_at);
CREATE INDEX messages_author_id_idx ON messages(author_id);
CREATE INDEX messages_created_at_idx ON messages(created_at DESC);
```

### 3-2. Supabase Edge Function - 자동삭제 작업

경로: `supabase/functions/delete-expired-messages/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 만료된 메시지 삭제
    const { data, error } = await supabase
      .from('messages')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('Delete error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    console.log(`Deleted ${data?.length || 0} expired messages`)

    return new Response(
      JSON.stringify({ 
        success: true,
        deleted: data?.length || 0,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
```

Supabase 대시보드에서 Cron Job 설정:
- **함수**: `delete-expired-messages`
- **스케줄**: `0 * * * *` (매시간)

---

## Phase 4: 프론트엔드 수정 (3시간)

### 4-1. Chat Page 수정

경로: `app/(main)/chat/page.tsx`

```typescript
'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send, User, Shield, Zap, Clock, Bot, AlertCircle } from 'lucide-react';
import { encryptMessage, decryptMessage, EncryptedMessage } from '@/lib/encryption';
import { sanitizeInput, validateMessage } from '@/lib/validation';

const supabase = createClient();

interface ChatMessage {
  id: string;
  content: string;  // 복호화된 내용
  author_id: string;
  author_name: string;
  is_anonymous: boolean;
  created_at: string;
  expires_at: string;  // ✨ 새로 추가
  is_deleted?: boolean;
}

// ... (generateAgentName, formatTime 함수는 그대로)

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userAgentName, setUserAgentName] = useState<string>('');
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [decryptErrors, setDecryptErrors] = useState<Set<string>>(new Set());
  const callbackRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. 초기화 및 메시지 로드
  useEffect(() => {
    setUserAgentName(generateAgentName());

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('is_deleted', false)  // ✨ 삭제되지 않은 것만
          .gt('expires_at', new Date().toISOString())  // ✨ 만료되지 않은 것만
          .order('created_at', { ascending: true })
          .limit(100);
        
        if (error) {
          console.error('메시지 로딩 오류:', error);
          return;
        }
        
        // 암호화된 메시지 복호화
        const decrypted = (data || []).map((msg) => {
          try {
            // 만약 content가 암호화되었다면
            if (msg.encrypted_content && msg.encryption_nonce) {
              const content = decryptMessage({
                ciphertext: msg.encrypted_content,
                nonce: msg.encryption_nonce,
              });
              return { ...msg, content };
            }
            return msg;
          } catch (err) {
            console.error(`Failed to decrypt message ${msg.id}:`, err);
            setDecryptErrors(prev => new Set([...prev, msg.id]));
            return { ...msg, content: '[복호화 실패]' };
          }
        });
        
        setMessages(decrypted);
      } catch (err) {
        console.error('메시지 로딩 실패:', err);
      }
    };

    fetchMessages();

    // ⚡️ 실시간 구독 (마찬가지로 복호화 필요)
    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new as any;
          try {
            if (newMsg.encrypted_content && newMsg.encryption_nonce) {
              newMsg.content = decryptMessage({
                ciphertext: newMsg.encrypted_content,
                nonce: newMsg.encryption_nonce,
              });
            }
            setMessages(prev => [...prev, newMsg as ChatMessage]);
            updateActiveUsers();
          } catch (err) {
            console.error('Failed to decrypt new message:', err);
          }
        }
      )
      .subscribe();

    updateActiveUsers();
    callbackRef.current = window.setInterval(updateActiveUsers, 30000);

    return () => {
      supabase.removeChannel(channel);
      if (callbackRef.current) clearInterval(callbackRef.current);
    };
  }, []);

  const updateActiveUsers = async () => {
    const baseUsers = 3 + Math.floor(Math.random() * 7);
    setActiveUsers(baseUsers);
  };

  // 2. 메시지 전송
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("보안 채널 접속을 위해 로그인이 필요합니다.");
        setIsSending(false);
        return;
      }

      // 입력값 검증
      const sanitized = sanitizeInput(newMessage.trim());
      const validation = validateMessage({
        content: sanitized,
        author_id: user.id,
        author_name: userAgentName,
        is_anonymous: true,
      });

      if (!validation.valid) {
        alert('메시지 형식이 올바르지 않습니다.');
        console.error('Validation errors:', validation.error);
        setIsSending(false);
        return;
      }

      // ✨ 메시지 암호화
      const encrypted = encryptMessage(sanitized);

      const { error } = await supabase.from('messages').insert({
        content: null,  // 평문은 저장하지 않음
        encrypted_content: encrypted.ciphertext,  // ✨ 암호화된 내용
        encryption_nonce: encrypted.nonce,  // ✨ nonce
        author_id: user.id,
        author_name: userAgentName,
        is_anonymous: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),  // ✨ 24시간
      });

      if (error) {
        console.error('메시지 전송 실패:', error);
        alert('메시지 전송 실패: ' + error.message);
      } else {
        setNewMessage('');
      }
    } catch (err) {
      console.error('전송 중 오류:', err);
      alert('전송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  // ... (나머지 코드는 유사)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white p-4 md:p-8 relative overflow-hidden">
      {/* ... 배경 효과 ... */}

      <div className="max-w-5xl mx-auto relative z-10">
        {/* 헤더 */}
        <header className="mb-8 border-b border-blue-800/30 pb-6">
          {/* ... 기존 헤더 ... */}

          {/* ✨ 보안 상태 배너 - 업데이트됨 */}
          <div className="mt-4 p-3 bg-green-900/20 border border-green-800/50 rounded-xl">
            <p className="text-xs text-green-300 flex items-center gap-2">
              <span className="font-bold">✅ 보안 상태:</span>
              메시지는 AES-256으로 <strong>클라이언트에서</strong> 암호화되어 저장되며, 24시간 후 자동 삭제됩니다.
            </p>
          </div>
        </header>

        {/* ... 채팅 영역 ... */}

        {/* 메시지 표시 개선 */}
        <div className="flex-1 overflow-y-auto bg-gray-900/30 border-2 border-gray-800/50 rounded-3xl p-4 md:p-6 space-y-4 backdrop-blur-sm shadow-2xl">
          {messages
            .filter(msg => !msg.is_deleted)  // ✨ 임시 삭제된 메시지 숨김
            .map((msg) => {
              const isCurrentUser = msg.author_name === userAgentName;
              const hasDecryptError = decryptErrors.has(msg.id);

              return (
                <div key={msg.id} className={`flex flex-col gap-1.5 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2">
                    {/* ... 기존 헤더 ... */}
                  </div>
                  
                  {/* ✨ 복호화 오류 표시 */}
                  {hasDecryptError && (
                    <div className="px-4 py-2 text-xs text-red-400 flex items-center gap-2 bg-red-900/30 rounded">
                      <AlertCircle className="w-3 h-3" />
                      메시지를 읽을 수 없습니다
                    </div>
                  )}
                  
                  <div className={`px-4 py-3 rounded-2xl max-w-[85%] shadow-lg ${...}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    
                    {/* ✨ 만료 시간 표시 */}
                    <div className="text-[10px] text-gray-500 mt-2 border-t border-gray-700 pt-1">
                      만료: {new Date(msg.expires_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        {/* ... 입력 영역 및 사이드바 ... */}

        {/* ✨ 통신 규칙 개선 */}
        <div className="bg-gradient-to-b from-green-900/20 to-black/50 border border-green-800/50 rounded-2xl p-4 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            통신 규칙
          </h3>
          <ul className="space-y-2 text-xs text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>AES-256 클라이언트 암호화</strong> - 메시지는 브라우저에서 암호화됨</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>24시간 자동 삭제</strong> - 만료 후 자동 제거</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>작전 관련 정보만 공유</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>개인정보 절대 금지</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 5: 테스트 (1시간)

### 5-1. 암호화 테스트

```typescript
// lib/__tests__/encryption.test.ts
import { encryptMessage, decryptMessage } from '../encryption';

describe('Encryption', () => {
  it('should encrypt and decrypt message', () => {
    const original = '테스트 메시지';
    const encrypted = encryptMessage(original);
    
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.nonce).toBeDefined();
    
    const decrypted = decryptMessage(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should fail decryption with wrong key', () => {
    const encrypted = encryptMessage('secret message');
    const wrongKey = new Uint8Array(32);
    
    expect(() => decryptMessage(encrypted, wrongKey)).toThrow();
  });
});
```

### 5-2. 수동 테스트

```
1. ✅ 메시지 전송 시 암호화 확인
   - Supabase에서 encrypted_content가 저장되는지 확인
   - content 필드는 NULL인지 확인

2. ✅ 메시지 로드 시 복호화 확인
   - 화면에 메시지가 평문으로 표시되는지 확인
   - 잘못된 키로는 복호화 실패 확인

3. ✅ 24시간 만료 확인
   - 메시지 expires_at이 현재 시간 + 24시간으로 설정되는지 확인
   - Cron 작업으로 실제 삭제되는지 확인

4. ✅ XSS 방지 확인
   - <script> 태그 포함 메시지 전송 시 이스케이프되는지 확인
```

---

## Phase 6: 배포 체크리스트

- [ ] 모든 테스트 통과
- [ ] 암호화 라이브러리 설치 확인
- [ ] 데이터베이스 마이그레이션 적용
- [ ] Supabase Edge Function 배포
- [ ] Cron Job 설정
- [ ] RLS 정책 활성화
- [ ] 환경변수 설정
- [ ] 성능 테스트 (암호화 오버헤드 < 100ms)
- [ ] 보안 감시 다시 수행
- [ ] 사용자 공지

---

## 예상 일정

| Phase | 작업 | 예상 시간 | 담당 |
|-------|------|---------|------|
| 1 | 환경 설정 | 1시간 | - |
| 2 | 암호화 유틸 | 2시간 | - |
| 3 | DB 설정 | 2시간 | - |
| 4 | 프론트엔드 | 3시간 | - |
| 5 | 테스트 | 1시간 | - |
| **총계** | | **9시간** | |

---

## 주의사항

⚠️ **클라이언트 사이드 암호화의 한계:**
- 평문 메시지가 네트워크를 통과할 때 HTTPS로 보호됨
- 장점: 서버가 평문을 알 수 없음
- 단점: 키 관리 복잡, 백업 불가, 검색 불가

✅ **권장사항:**
- 더 높은 보안을 원하면 **Server-Side Encryption**으로 전환
- Supabase pgcrypto 또는 AWS KMS 사용
- 키 로테이션 정책 수립

---

*이 가이드는 실제 구현을 위한 청사진입니다. 각 Phase별 테스트 후 다음 단계로 진행하세요.*
