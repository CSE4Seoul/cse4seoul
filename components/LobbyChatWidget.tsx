'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  RiChat3Line, 
  RiSendPlaneLine, 
  RiAlertLine, 
  RiUserLine, 
  RiEyeOffLine   // 익명 모드용 아이콘으로 대체
} from 'react-icons/ri';

interface LobbyMessage {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
  expires_at: string;
}

const BANNED_WORDS = [
  '시발', '씨발', '개새끼', '병신', '미친', 'ㅅㅂ', 'ㅄ',
  'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'nigger',
];

const containsBadWord = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return BANNED_WORDS.some(word => lowerText.includes(word.toLowerCase()));
};

export default function LobbyChatWidget() {
  const supabase = createClient();
  const [messages, setMessages] = useState<LobbyMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterWarning, setFilterWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 로그인 상태 및 프로필 정보
  const [userId, setUserId] = useState<string | null>(null);
  const [realName, setRealName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 닉네임 관련 상태
  const [nickname, setNickname] = useState<string | null>(null);
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);
  const [randomAgentName, setRandomAgentName] = useState('');

  // 랜덤 에이전트명 생성 (익명 모드용)
  const generateRandomName = () => {
    const prefixes = ['어둠의', '빛의', '전략의', '신속한', '정밀한', '신비로운', '침묵의', '폭풍의'];
    const suffixes = ['매', '호랑이', '독수리', '늑대', '고스트', '팬텀', '나이트', '로드'];
    const numbers = Math.floor(Math.random() * 999) + 1;
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix} ${suffix} #${numbers.toString().padStart(3, '0')}`;
  };

  // 로그인 사용자 정보 및 프로필 조회
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) {
          setRealName(profile.full_name);
        }
      } else {
        setIsLoggedIn(false);
        setUserId(null);
        setRealName(null);
      }
    };
    fetchUser();
  }, [supabase]);

  // 닉네임 초기화 (로그인 여부에 따라)
  useEffect(() => {
    if (isLoggedIn && realName) {
      // 로그인 + 프로필 이름 있으면 그걸 기본으로
      setNickname(realName);
      setIsAnonymousMode(false);
    } else if (isLoggedIn && !realName) {
      // 로그인했지만 프로필 이름 없음 → 로컬스토리지에서 불러오거나 기본값
      const saved = localStorage.getItem('lobby_nickname');
      if (saved && saved.trim()) {
        setNickname(saved.trim());
      } else {
        setNickname('익명의 요원');
      }
      setIsAnonymousMode(false);
    } else {
      // 비로그인 → 로컬스토리지 또는 기본값
      const saved = localStorage.getItem('lobby_nickname');
      if (saved && saved.trim()) {
        setNickname(saved.trim());
      } else {
        setNickname('익명의 요원');
      }
      setIsAnonymousMode(true); // 비로그인은 강제 익명
    }
    // 익명 모드용 랜덤 이름 미리 생성
    setRandomAgentName(generateRandomName());
  }, [isLoggedIn, realName]);

  // 닉네임 변경 (로그인 유저도 변경 가능하지만, 저장은 localStorage에만)
  const changeNickname = () => {
    if (isAnonymousMode) {
      alert('익명 모드에서는 닉네임을 변경할 수 없습니다.');
      return;
    }
    const newName = prompt('새 닉네임을 입력하세요 (최대 20자)', nickname || '익명의 요원');
    if (newName && newName.trim()) {
      const trimmed = newName.trim().slice(0, 20);
      setNickname(trimmed);
      localStorage.setItem('lobby_nickname', trimmed);
    } else if (newName === '') {
      setNickname('익명의 요원');
      localStorage.setItem('lobby_nickname', '익명의 요원');
    }
  };

  // 익명 모드 전환
  const toggleAnonymousMode = () => {
    if (!isLoggedIn) {
      alert('로그인하지 않은 상태에서는 익명 모드만 가능합니다.');
      return;
    }
    setIsAnonymousMode(prev => !prev);
    if (!isAnonymousMode) {
      // 익명 모드로 전환 시, 현재 닉네임을 저장해두고 익명 이름 사용
      // 기존 nickname은 localStorage에 그대로 두고, 보낼 때는 randomAgentName 사용
    } else {
      // 실명 모드로 돌아갈 때는 기존 nickname(realName) 사용
      if (realName) setNickname(realName);
    }
  };

  // 실제 채팅에 보여질 표시 이름 (익명 모드면 랜덤, 아니면 nickname)
  const displayName = isAnonymousMode ? randomAgentName : (nickname || '익명의 요원');

  // 메시지 로드 및 실시간 구독
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('lobby_messages')
          .select('*')
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('로비 채팅 로드 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    const subscription = supabase
      .channel('lobby-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lobby_messages' }, (payload) => {
        const newMsg = payload.new as LobbyMessage;
        if (newMsg.expires_at && new Date(newMsg.expires_at) < new Date()) return;
        setMessages(prev => [...prev, newMsg]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [supabase]);

  // 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 경고 메시지 자동 사라짐
  useEffect(() => {
    if (filterWarning) {
      const timer = setTimeout(() => setFilterWarning(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [filterWarning]);

  // 메시지 전송
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || isSending) return;

    if (containsBadWord(trimmed)) {
      setFilterWarning('⚠️ 부적절한 표현이 포함되어 있습니다.');
      return;
    }

    setIsSending(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      const { error } = await supabase.from('lobby_messages').insert({
        content: trimmed,
        author_name: displayName,  // 현재 모드에 따라 결정된 이름
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('로비 메시지 전송 실패:', err);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <RiChat3Line className="text-cyan-400 text-xl" />
          <h3 className="text-gray-400 text-sm font-bold tracking-wider">로비 채팅</h3>
          <span className="text-xs bg-cyan-600/30 text-cyan-300 px-2 py-0.5 rounded-full">
            {isAnonymousMode ? '익명 모드' : (isLoggedIn ? '실명 모드' : '게스트')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* 실명/익명 토글 버튼 */}
          {isLoggedIn && (
            <button
  onClick={toggleAnonymousMode}
  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
    isAnonymousMode
      ? 'bg-gray-800/80 text-gray-400 hover:text-cyan-300'
      : 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
  }`}
  title={isAnonymousMode ? '실명 모드로 전환' : '익명 모드로 전환'}
>
  {isAnonymousMode ? <RiEyeOffLine className="w-3 h-3" /> : <RiUserLine className="w-3 h-3" />}
  {isAnonymousMode ? '익명' : '실명'}
</button>
          )}

          <div className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm">
            <span className="text-gray-400">👤</span>
            <span className="text-cyan-300 font-mono">
              {displayName}
            </span>
            {!isAnonymousMode && (
              <button
                onClick={changeNickname}
                className="ml-1 text-gray-500 hover:text-cyan-400 transition-colors"
                title="닉네임 변경"
              >
                ✏️
              </button>
            )}
          </div>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>

      {/* 메시지 영역 (동일) */}
      <div className="h-80 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            <div className="animate-pulse">메시지 로딩 중...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
            <RiChat3Line className="text-4xl opacity-30" />
            <p className="text-sm">첫 메시지를 남겨보세요!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="group flex items-start gap-3 hover:bg-white/5 rounded-xl p-2 transition-all duration-200">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/50 flex items-center justify-center">
                  <span className="text-xs font-bold text-cyan-300">?</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-cyan-300">{msg.author_name}</span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-200 text-sm break-words mt-0.5 leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 폼 (동일) */}
      <form onSubmit={sendMessage} className="border-t border-white/10 p-4 bg-black/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="익명으로 메시지 보내기..."
            className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all text-white placeholder-gray-500"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-5 py-2.5 transition-all duration-200 shadow-lg shadow-cyan-900/20"
          >
            <RiSendPlaneLine className="text-white w-5 h-5" />
          </button>
        </div>

        {filterWarning && (
          <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-800/30 rounded-lg px-3 py-1.5">
            <RiAlertLine className="w-3.5 h-3.5" />
            {filterWarning}
          </div>
        )}

        <div className="flex justify-between items-center mt-2 px-1">
          <p className="text-[10px] text-gray-500">⚡ 모든 메시지는 24시간 후 자동 삭제됩니다.</p>
          <p className="text-[10px] text-gray-600">#{messages.length} messages</p>
        </div>
      </form>
    </div>
  );
}