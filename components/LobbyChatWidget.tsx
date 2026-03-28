'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { createClient } from '@/utils/supabase/client';
import { RiChat3Line, RiSendPlaneLine, RiAlertLine } from 'react-icons/ri';

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

  // 닉네임 상태: 초기값 null (서버 렌더링용)
  const [nickname, setNickname] = useState<string | null>(null);

  // 클라이언트에서만 localStorage 읽기
  useEffect(() => {
    const saved = localStorage.getItem('lobby_nickname');
    if (saved && saved.trim()) {
      setNickname(saved.trim());
    } else {
      setNickname('익명의 요원');
    }
  }, []);

  const changeNickname = () => {
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
        author_name: nickname || '익명의 요원', // fallback
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
          <span className="text-xs bg-cyan-600/30 text-cyan-300 px-2 py-0.5 rounded-full">익명</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm">
            <span className="text-gray-400">👤</span>
            <span className="text-cyan-300 font-mono">
              {nickname ?? '...'}   {/* 서버에서는 ... 표시 */}
            </span>
            <button
              onClick={changeNickname}
              className="ml-1 text-gray-500 hover:text-cyan-400 transition-colors"
              title="닉네임 변경"
            >
              ✏️
            </button>
          </div>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>

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