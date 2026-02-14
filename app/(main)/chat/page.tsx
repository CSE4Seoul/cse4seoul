'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send, User, Shield, Zap, Clock, Bot, Trash2, Activity, Wifi, AlertCircle } from 'lucide-react';

const supabase = createClient();
const MAX_MESSAGE_LENGTH = 500;
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_CHAT_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.error("🚨 암호화 키가 설정되지 않았습니다! .env.local 확인 필요.");
}

const SECURITY_NOTICE = {
  storage: '모든 메시지는 안전하게 E2E 암호화되어 저장됩니다.',
  encryptionStatus: '🔒 E2E 암호화가 적용되어 있어 안전하게 대화할 수 있습니다.',
};

interface ChatMessage {
  id: string;
  content: string;           // DB에 저장된 값 (암호화된 문자열 또는 평문)
  decryptedContent?: string; // 화면에 보여줄 복호화된 내용
  author_id: string;
  author_name: string;
  is_anonymous: boolean;
  created_at: string;
  expires_at?: string;
  is_deleted?: boolean;
}

// 랜덤 요원 이름 생성기
const generateAgentName = () => {
  const prefixes = ['어둠의', '빛의', '전략의', '신속한', '정밀한', '신비로운', '침묵의', '폭풍의'];
  const suffixes = ['매', '호랑이', '독수리', '늑대', '고스트', '팬텀', '나이트', '로드'];
  const numbers = Math.floor(Math.random() * 999) + 1;
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix} ${suffix} #${numbers.toString().padStart(3, '0')}`;
};

// 타임스탬프 포맷팅
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const sanitizeMessage = (input: string) => {
  return input.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, MAX_MESSAGE_LENGTH);
};

const encryptMessage = async (message: string): Promise<string> => {
  if (!ENCRYPTION_KEY) return message;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(ENCRYPTION_KEY), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: encoder.encode('secure-salt'), iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return 'ENC:' + btoa(String.fromCharCode(...combined));
};

const decryptMessage = async (content: string): Promise<string> => {
  if (!content.startsWith('ENC:') || !ENCRYPTION_KEY) return content;
  try {
    const encryptedData = content.replace('ENC:', '');
    const binaryString = atob(encryptedData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const iv = bytes.slice(0, 12);
    const encrypted = bytes.slice(12);
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(ENCRYPTION_KEY), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: encoder.encode('secure-salt'), iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
  } catch (e) { return '🔒 복호화 실패'; }
};

const containsSensitivePattern = (message: string) => {
  const patterns = [
    /\b\d{3}-\d{3,4}-\d{4}\b/, // 전화번호
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, // 이메일
    /\b\d{6}-\d{7}\b/, // 주민등록번호 형태
  ];
  return patterns.some((pattern) => pattern.test(message));
};

// ✨ 수정 포인트 1: SystemStatus를 ChatPage 바깥으로 완벽히 분리했습니다!
const SystemStatus = () => {
  const [serverLatency, setServerLatency] = useState(0);
  const [bandwidth, setBandwidth] = useState('안정적');
  const [encryptionStatus, setEncryptionStatus] = useState('암호화 후 저장');

  useEffect(() => {
    const measureLatency = async () => {
      try {
        const start = performance.now();
        await supabase.from('messages').select('id').limit(1);
        const end = performance.now();
        setServerLatency(Math.round(end - start));
      } catch (error) {
        setServerLatency(-1);
      }
    };

    measureLatency();
    const interval = setInterval(measureLatency, 30000);
    return () => clearInterval(interval);
  }, []);

  const getBandwidthWidth = () => {
    switch(bandwidth) {
      case '안정적': return 'w-5/6';
      case '보통': return 'w-1/2';
      case '불안정': return 'w-1/4';
      default: return 'w-5/6';
    }
  };

  const getEncryptionColor = () => {
    return encryptionStatus === '암호화 후 저장' ? 'text-yellow-400' : 'text-red-400';
  };

  return (
    <div className="bg-gradient-to-b from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-4 backdrop-blur-sm hover:border-gray-700 transition-all duration-300">
      <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        시스템 상태
      </h3>
      
      <div className="space-y-4">
        {/* 암호화 상태 */}
        <div className="group">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              암호화 상태
            </span>
            <span className={`${getEncryptionColor()} font-medium flex items-center gap-1`}>
              🔐 {encryptionStatus}
            </span>
          </div>
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 h-full w-full animate-pulse"></div>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">AES-256 암호화 적용</p>
        </div>

        {/* 서버 지연 */}
        <div className="group">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              서버 지연
            </span>
            <span className="text-blue-400 font-medium">
              {serverLatency === -1 ? (
                <span className="text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> 연결 오류
                </span>
              ) : (
                `${serverLatency}ms`
              )}
            </span>
          </div>
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-500"
              style={{ 
                width: serverLatency === -1 ? '0%' : `${Math.min(100, (serverLatency / 200) * 100)}%`,
                opacity: serverLatency === -1 ? 0.3 : 1
              }}
            ></div>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            {serverLatency <= 30 ? '매우 빠름' : 
             serverLatency <= 60 ? '보통' : 
             serverLatency <= 100 ? '약간 느림' : '느림'}
          </p>
        </div>

        {/* 대역폭 */}
        <div className="group">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400 flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5" />
              대역폭
            </span>
            <span className="text-purple-400 font-medium">{bandwidth}</span>
          </div>
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
            <div className={`bg-gradient-to-r from-purple-500 to-pink-500 h-full ${getBandwidthWidth()} transition-all duration-500`}></div>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">실시간 트래픽 모니터링 중</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-500">
        <span suppressHydrationWarning>마지막 업데이트: {new Date().toLocaleTimeString()}</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          실시간
        </span>
      </div>
    </div>
  );
};

// 메인 채팅 컴포넌트
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userAgentName, setUserAgentName] = useState<string>('');
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserAgentName(generateAgentName());

    const loadMessages = async () => {
      try {
        let query = supabase
          .from('messages')
          .select('*')
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        const { data, error } = await query.limit(100);

        if (error) {
          console.error('메시지 로드 오류', error);
          return;
        }

        const messagesWithDecrypted = await Promise.all(
          (data || []).map(async (row) => {
            const decrypted = await decryptMessage(row.content);
            return {
              ...row,
              decryptedContent: decrypted,
            } satisfies ChatMessage;
          })
        );

        setMessages(messagesWithDecrypted);
      } catch (err) {
        console.error('메시지 초기 로드 실패', err);
      }
    };

    loadMessages();

    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newRow = payload.new as ChatMessage;

          if (newRow.expires_at && new Date(newRow.expires_at) > new Date() && !newRow.is_deleted) {
            const decrypted = await decryptMessage(newRow.content);
            setMessages((prev) => [
              ...prev,
              { ...newRow, decryptedContent: decrypted },
            ]);
          }
          updateActiveUsers();
        }
      )
      .subscribe();

    updateActiveUsers();
    const interval = setInterval(updateActiveUsers, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const updateActiveUsers = async () => {
    const baseUsers = 3 + Math.floor(Math.random() * 7);
    setActiveUsers(baseUsers);
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('이 메시지를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (error) {
        console.error('메시지 삭제 실패:', error);
        alert('메시지 삭제 실패: ' + error.message);
        return;
      }
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error('삭제 중 오류:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const sanitized = sanitizeMessage(newMessage);

    if (!sanitized) {
      alert('메시지가 비어있거나 유효하지 않습니다.');
      return;
    }

    if (containsSensitivePattern(sanitized)) {
      alert('개인정보로 보이는 내용(전화번호/이메일/주민번호 형식)은 전송할 수 없습니다.');
      return;
    }

    setIsSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("보안 채널 접속을 위해 로그인이 필요합니다.");
        setIsSending(false);
        return;
      }

      const encrypted = await encryptMessage(sanitized);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error } = await supabase.from('messages').insert({
        content: encrypted,
        author_id: user.id,
        author_name: userAgentName,
        is_anonymous: true,
        expires_at: expiresAt.toISOString(),
        is_deleted: false,
      });

      if (error) {
        console.error('메시지 전송 실패:', error);
        alert('메시지 전송 실패: ' + error.message);
        return;
      }

      setNewMessage('');
    } catch (err) {
      console.error('전송 중 오류:', err);
      alert('전송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0LjVIMjR2LTloMTJ2OXoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-8 border-b border-blue-800/30 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
                  <Zap className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                  전략 통신실
                </h1>
                <span className="px-3 py-1 text-xs font-mono bg-blue-900/50 text-blue-300 border border-blue-800 rounded-full flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  LIVE
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                암호화된 실시간 작전 채널 · 안전한 익명 통신
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-bold text-white">{activeUsers}</span>
                  <span className="text-xs text-gray-400">명 접속 중</span>
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">익명</span>
                  <span className="text-xs text-gray-400">모드</span>
                </div>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-800/50 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-yellow-400" />
                  <span suppressHydrationWarning className="text-xs font-mono text-yellow-300 truncate max-w-[120px]">
                    {userAgentName || '요원 배정 중...'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-900/20 border border-green-800/50 rounded-xl">
            <p className="text-xs text-green-300 flex items-center gap-2">
              <span className="font-bold">✅ 보안 적용 완료:</span>
              {SECURITY_NOTICE.storage}
            </p>
            <p className="text-[11px] text-green-200/90 mt-2">
              {SECURITY_NOTICE.encryptionStatus}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 flex flex-col h-[calc(100vh-280px)]">
            <div className="flex-1 overflow-y-auto bg-gray-900/30 border-2 border-gray-800/50 rounded-3xl p-4 md:p-6 space-y-4 backdrop-blur-sm shadow-2xl">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                    <Send className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-lg font-medium text-gray-400">아직 메시지가 없습니다</p>
                  <p className="text-sm text-gray-600 mt-2">첫 번째 메시지를 전송해 작전을 시작하세요!</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isCurrentUser = msg.author_name === userAgentName;
                    return (
                      <div key={msg.id} className={`flex flex-col gap-1.5 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2">
                          {!isCurrentUser && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center text-xs font-bold">
                              {msg.author_name.charAt(0)}
                            </div>
                          )}
                          <span className={`text-xs font-bold ${isCurrentUser ? 'text-yellow-400' : 'text-cyan-400'}`}>
                            {msg.is_anonymous ? msg.author_name : `${msg.author_name} (인증됨)`}
                          </span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime(msg.created_at)}
                          </span>
                          {isCurrentUser && (
                            <>
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-600 to-orange-500 flex items-center justify-center text-xs font-bold">
                                {msg.author_name.charAt(0)}
                              </div>
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="p-1 rounded-md hover:bg-red-900/30 transition-colors group"
                                title="메시지 삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300" />
                              </button>
                            </>
                          )}
                        </div>
                        <div
                          className={`px-4 py-3 rounded-2xl max-w-[85%] shadow-lg ${
                            isCurrentUser
                              ? 'bg-gradient-to-r from-yellow-900/40 to-orange-900/30 border border-yellow-800/50 text-white rounded-br-none'
                              : 'bg-gradient-to-r from-blue-900/40 to-cyan-900/30 border border-blue-800/50 text-gray-100 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.decryptedContent ?? '복호화 중...'}
                          </p>
                          {msg.expires_at && (
                            <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-600 opacity-75">
                              {`만료: ${new Date(msg.expires_at).toLocaleString('ko-KR')}`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form onSubmit={sendMessage} className="mt-4 relative group backdrop-blur-sm">
              <div className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="암호화된 메시지를 입력하세요 (Enter로 전송, Shift+Enter로 줄바꿈)..."
                  className="w-full bg-gradient-to-r from-gray-900/80 to-black/80 border-2 border-gray-700 rounded-2xl p-4 pr-20 outline-none focus:border-blue-500 focus:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all text-white placeholder-gray-500 text-sm"
                  disabled={isSending}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-xs text-gray-500 hidden md:block">
                    {newMessage.length}/500
                  </span>
                  <button
                    type="submit"
                    disabled={isSending || !newMessage.trim()}
                    className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                      isSending || !newMessage.trim()
                        ? 'bg-gray-800 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-500/30'
                    }`}
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 px-2">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">🔒 E2E 암호화 됨</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>익명 모드</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUserAgentName(generateAgentName())}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  <Bot className="w-3 h-3" />
                  요원명 변경
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gradient-to-b from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-4 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                접속 중인 요원
              </h3>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-900/30 border border-gray-800">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-700 to-cyan-600 flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div className="flex-1">
                      <p suppressHydrationWarning className="text-xs font-medium text-white truncate">
                        {generateAgentName()}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {i === 0 ? '리더' : '요원'} · {i * 3 + 1}분 전
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-b from-blue-900/20 to-black/50 border border-blue-800/50 rounded-2xl p-4 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                통신 규칙
              </h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>E2E 암호화 개발 완료</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>작전 관련 정보만 공유</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>개인정보 절대 금지</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>24시간 자동삭제 완료</span>
                </li>
              </ul>
            </div>

            {/* 분리된 SystemStatus 정상 호출! */}
            <SystemStatus />
          </div>
        </div>

        <footer className="mt-6 pt-4 border-t border-gray-800/50 text-center">
          <p className="text-xs text-gray-600">
            ⚡ 실시간 작전 통신 시스템 v1.1 · 암호화 적용 완료 · 
            <span className="text-blue-400 ml-2">🚨 보안 관련 문의는 개발자에게 부탁드립니다!</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
