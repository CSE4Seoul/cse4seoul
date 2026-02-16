'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ChevronLeft, Send, User, Shield, Zap, Clock, Bot, Trash2, Activity, Wifi, AlertCircle, KeyRound, Lock, Unlock } from 'lucide-react';

const MAX_MESSAGE_LENGTH = 500;
const DEFAULT_KEY = process.env.NEXT_PUBLIC_CHAT_ENCRYPTION_KEY || 'fallback-public-key-2026';

if (!process.env.NEXT_PUBLIC_CHAT_ENCRYPTION_KEY) {
  console.warn("⚠️ 환경 변수(NEXT_PUBLIC_CHAT_ENCRYPTION_KEY)가 없어 임시 공개 키로 작동합니다.");
}

interface ChatMessage {
  id: string;
  content: string;
  decryptedContent?: string | null;
  author_id: string;
  author_name: string;
  is_anonymous: boolean;
  created_at: string;
  expires_at?: string;
  is_deleted?: boolean;
}

const generateAgentName = () => {
  const prefixes = ['어둠의', '빛의', '전략의', '신속한', '정밀한', '신비로운', '침묵의', '폭풍의'];
  const suffixes = ['매', '호랑이', '독수리', '늑대', '고스트', '팬텀', '나이트', '로드'];
  const numbers = Math.floor(Math.random() * 999) + 1;
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix} ${suffix} #${numbers.toString().padStart(3, '0')}`;
};

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

const encryptMessage = async (message: string, secretKey: string): Promise<string> => {
  if (!secretKey) return message;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  // 1. 매번 다르게 생성되는 랜덤 Salt (16바이트)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(secretKey), 'PBKDF2', false, ['deriveKey']);
  
  // 2. 랜덤 Salt를 넣어 진짜 키 생성
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, 
    keyMaterial, 
    { name: 'AES-GCM', length: 256 }, 
    false, 
    ['encrypt', 'decrypt']
  );
  
  // 3. 매번 다르게 생성되는 랜덤 IV (12바이트)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  
  // 4. [Salt(16)] + [IV(12)] + [암호문] 순서로 하나로 합치기!
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // 5. 안전한 Base64 인코딩 (긴 문자열도 버그 없이 처리)
  let binary = '';
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return 'ENC:' + btoa(binary);
};

const decryptMessage = async (encryptedData: string, secretKey: string): Promise<string | null> => {
  if (!secretKey || !encryptedData.startsWith('ENC:')) return encryptedData;

  try {
    const base64 = encryptedData.slice(4);
    const binaryStr = atob(base64);
    const combined = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      combined[i] = binaryStr.charCodeAt(i);
    }

    // 1. [Salt(16)], [IV(12)], [암호문] 정확히 썰어서 분리하기
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(secretKey), 'PBKDF2', false, ['deriveKey']);
    
    // 2. 암호문에 같이 배달 온 Salt를 써서 열쇠 복원
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, 
      keyMaterial, 
      { name: 'AES-GCM', length: 256 }, 
      false, 
      ['encrypt', 'decrypt']
    );

    // 3. 복호화 짠!
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    // 🔥 하민님의 완벽한 의도: 키가 틀리면 아예 '없는 메시지' 취급해버리기!
    return null; 
  }
};

const containsSensitivePattern = (message: string) => {
  const patterns = [
    /\b\d{3}-\d{3,4}-\d{4}\b/, 
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, 
    /\b\d{6}-\d{7}\b/, 
  ];
  return patterns.some((pattern) => pattern.test(message));
};

const SystemStatus = ({ isPublicMode }: { isPublicMode: boolean }) => {
  // ✨ 성능 고정 1: SystemStatus 내부의 클라이언트도 재생성 방지
  const [supabase] = useState(() => createClient());
  const [serverLatency, setServerLatency] = useState(0);
  const [bandwidth, setBandwidth] = useState('안정적');

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
  }, [supabase]);

  const getBandwidthWidth = () => {
    switch(bandwidth) {
      case '안정적': return 'w-5/6';
      case '보통': return 'w-1/2';
      case '불안정': return 'w-1/4';
      default: return 'w-5/6';
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-4 backdrop-blur-sm hover:border-gray-700 transition-all duration-300">
      <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        시스템 상태
      </h3>
      
      <div className="space-y-4">
        <div className="group">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              보안 등급
            </span>
            <span className={`${isPublicMode ? 'text-yellow-400' : 'text-green-400'} font-medium flex items-center gap-1`}>
              {isPublicMode ? '⚠️ 공개 광장' : '🔐 비밀 통신망'}
            </span>
          </div>
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
            <div className={`h-full w-full animate-pulse ${isPublicMode ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}></div>
          </div>
        </div>

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
              style={{ width: serverLatency === -1 ? '0%' : `${Math.min(100, (serverLatency / 200) * 100)}%`, opacity: serverLatency === -1 ? 0.3 : 1 }}
            ></div>
          </div>
        </div>

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

export default function ChatPage() {
  const router = useRouter();
  
  // ✨ 성능 고정 2: 타이핑할 때마다 통신망 끊기는 현상 원천 차단!
  const [supabase] = useState(() => createClient());
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userAgentName, setUserAgentName] = useState<string>('');
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [roomKeyInput, setRoomKeyInput] = useState<string>('');
  const [activeKey, setActiveKey] = useState<string>('');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  
  const isPublicMode = activeKey === DEFAULT_KEY;

  const handleJoin = (e: FormEvent) => {
    e.preventDefault();
    if (roomKeyInput.trim() === '') {
      setActiveKey(DEFAULT_KEY);
    } else {
      setActiveKey(roomKeyInput);
    }
    setIsJoined(true);
  };

  useEffect(() => {
    if (!isJoined || !activeKey) return;

    setUserAgentName(generateAgentName());

    const loadMessages = async () => {
      try {
        let query = supabase.from('messages').select('*').eq('is_deleted', false).order('created_at', { ascending: true });
        const { data, error } = await query.limit(100);

        if (error) return console.error('메시지 로드 오류', error);

        const messagesWithDecrypted = await Promise.all(
          (data || []).map(async (row) => {
            const decrypted = await decryptMessage(row.content, activeKey);
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

    // 이제 타이핑을 해도 이 통신망은 절대 끊어지지 않습니다.
    const channel = supabase
      .channel('realtime:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newRow = payload.new as ChatMessage;
          if (newRow.expires_at && new Date(newRow.expires_at) > new Date() && !newRow.is_deleted) {
            const decrypted = await decryptMessage(newRow.content, activeKey);
            setMessages((prev) => [...prev, { ...newRow, decryptedContent: decrypted }]);
          }
          updateActiveUsers();
        }
      ).subscribe();

    updateActiveUsers();
    const interval = setInterval(updateActiveUsers, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [isJoined, activeKey, supabase]);

  const updateActiveUsers = async () => {
    const baseUsers = 3 + Math.floor(Math.random() * 7);
    setActiveUsers(baseUsers);
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('이 메시지를 삭제하시겠습니까?')) return;

    setDeletingId(messageId); 

    try {
      const { error } = await supabase.from('messages').update({ is_deleted: true }).eq('id', messageId);
      if (error) throw error;
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null); 
    }
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const sanitized = sanitizeMessage(newMessage);
    if (!sanitized) return alert('메시지가 비어있거나 유효하지 않습니다.');
    if (containsSensitivePattern(sanitized)) return alert('개인정보 전송 불가');

    setIsSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("보안 채널 접속을 위해 로그인이 필요합니다.");

      const encrypted = await encryptMessage(sanitized, activeKey);
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

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
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

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0LjVIMjR2LTloMTJ2OXoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        <div className="z-10 bg-gray-900/80 p-8 rounded-3xl border border-gray-800 shadow-2xl backdrop-blur-md max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">전략 통신실 접속</h1>
          <p className="text-sm text-gray-400 mb-6">
            안전한 통신을 위해 작전 암호를 입력하세요.<br/>같은 암호를 입력한 요원끼리만 연결됩니다.
          </p>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={roomKeyInput}
                onChange={(e) => setRoomKeyInput(e.target.value)}
                placeholder="작전 통신망 암호 (선택)"
                className="w-full bg-black/50 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="text-xs text-left p-3 rounded-lg bg-yellow-900/20 border border-yellow-800/30 text-yellow-500/80">
              ⚠️ 아무 키도 입력하지 않으면 기본 키를 사용하며, 이는 공개된 키이기 때문에 대화 내용이 누구나 확인될 수 있는 <strong className="text-yellow-400">공개 채팅 모드</strong>로 접속됩니다.
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/50 transition-all"
            >
              통신망 접속 (JOIN)
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0LjVIMjR2LTloMTJ2OXoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-8 border-b border-blue-800/30 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <button 
                onClick={() => router.push('/dashboard')}
                className="group flex items-center gap-2 px-3 py-1.5 mb-3 text-xs font-medium text-gray-300 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg hover:bg-blue-900/30 hover:border-blue-700/50 hover:text-blue-300 transition-all duration-200 w-fit shadow-lg"
              >
                <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>대시보드 복귀</span>
                <span className="ml-1 text-[10px] text-gray-500 group-hover:text-blue-400/70">통제실</span>
              </button>
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
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-800/50 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-yellow-400" />
                  <span suppressHydrationWarning className="text-xs font-mono text-yellow-300 truncate max-w-[120px]">
                    {userAgentName || '요원 배정 중...'}
                  </span>
                </div>
              </div>
              <button onClick={() => { setIsJoined(false); setRoomKeyInput(''); }} className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 rounded-xl text-xs text-red-400 transition-colors">
                통신망 로그아웃
              </button>
            </div>
          </div>

          <div className={`mt-4 p-3 border rounded-xl ${isPublicMode ? 'bg-yellow-900/20 border-yellow-800/50' : 'bg-green-900/20 border-green-800/50'}`}>
            <p className={`text-xs flex items-center gap-2 ${isPublicMode ? 'text-yellow-400' : 'text-green-300'}`}>
              <span className="font-bold">
                {isPublicMode ? '⚠️ 공개 채팅 모드:' : '✅ 비밀 통신망 활성화:'}
              </span>
              {isPublicMode ? '기본 키를 사용 중입니다. 대화 내용이 다른 사용자에게 노출될 수 있습니다.' : '선택한 암호 키로 완벽하게 격리된 비밀 채팅방입니다.'}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 flex flex-col h-[calc(100vh-280px)]">
            <div className="flex-1 overflow-y-auto bg-gray-900/30 border-2 border-gray-800/50 rounded-3xl p-4 md:p-6 space-y-4 backdrop-blur-sm shadow-2xl">
              {messages.filter(m => m.decryptedContent !== null).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                    <Send className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-lg font-medium text-gray-400">이 주파수에는 아직 메시지가 없습니다.</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    if (msg.decryptedContent === null) return null;

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
                            {msg.is_anonymous ? msg.author_name : `${msg.author_name}`}
                          </span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime(msg.created_at)}
                          </span>
                          {isCurrentUser && (
                            <button onClick={() => deleteMessage(msg.id)} disabled={deletingId === msg.id} className="p-1 rounded-md hover:bg-red-900/30 transition-colors group disabled:cursor-not-allowed">
  {deletingId === msg.id ? (
    <div className="w-3.5 h-3.5 border-2 border-red-500/30 border-t-red-400 rounded-full animate-spin"></div>
  ) : (
    <Trash2 className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300" />
  )}
</button>
                          )}
                        </div>
                        <div className={`px-4 py-3 rounded-2xl max-w-[85%] shadow-lg ${isCurrentUser ? 'bg-gradient-to-r from-yellow-900/40 to-orange-900/30 border border-yellow-800/50 text-white rounded-br-none' : 'bg-gradient-to-r from-blue-900/40 to-cyan-900/30 border border-blue-800/50 text-gray-100 rounded-bl-none'}`}>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.decryptedContent}
                          </p>
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
                  placeholder="메시지를 입력하세요 (Enter로 전송)..."
                  className="w-full bg-gradient-to-r from-gray-900/80 to-black/80 border-2 border-gray-700 rounded-2xl p-4 pr-20 outline-none focus:border-blue-500 transition-all text-white placeholder-gray-500 text-sm"
                  disabled={isSending}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-xs text-gray-500 hidden md:block">{newMessage.length}/500</span>
                  <button
                    type="submit"
                    disabled={isSending || !newMessage.trim()}
                    className={`p-3 rounded-xl transition-all flex items-center justify-center ${isSending || !newMessage.trim() ? 'bg-gray-800 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500'}`}
                  >
                    {isSending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 px-2">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    {isPublicMode ? <Unlock className="w-3 h-3 text-yellow-400" /> : <Lock className="w-3 h-3 text-green-400" />}
                    <span className={isPublicMode ? "text-yellow-400" : "text-green-400"}>
                      {isPublicMode ? '공개망 접속 중' : '비밀망 접속 중'}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => setUserAgentName(generateAgentName())} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> 요원명 변경
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
            
            <SystemStatus isPublicMode={isPublicMode} />
          </div>
        </div>
      </div>
    </div>
  );
}
