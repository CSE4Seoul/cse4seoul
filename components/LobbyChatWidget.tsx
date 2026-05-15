'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  RiChat3Line, RiSendPlaneLine, RiAlertLine, RiUserLine, RiEyeOffLine,
  RiGamepadLine, RiCloseLine, RiUserAddLine, RiLogoutCircleLine, RiRefreshLine,
  RiEmotionLine, RiImageLine,
} from 'react-icons/ri';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface LobbyMessage {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
  expires_at: string;
  /**
   * 'text'     → 일반 텍스트 메시지
   * 'emoticon' → 이모티콘 메시지  (content = "[emoticon:키워드]")
   * 'image'    → 향후 사진 업로드 확장용 (현재 미사용)
   */
  message_type?: 'text' | 'emoticon' | 'image';
  /** 향후 사진 업로드 시 사용할 미디어 URL (현재 미사용) */
  media_url?: string;
}

type GameStartPayload = { starter: string; startWord: string };
type GameJoinPayload  = { player: string };
type GameLeavePayload = { player: string };
type GameWordPayload  = { player: string; word: string; success: boolean; reason?: string };
type GameEndPayload   = { reason: string };

// ─────────────────────────────────────────────
// Emoticon registry
// ─────────────────────────────────────────────

/**
 * 사용 가능한 이모티콘 목록.
 * 파일 경로: /emotions/e_{keyword}.{ext}
 * 새 이모티콘 추가 시 이 배열에만 등록하면 됩니다.
 *
 * 향후 확장:
 *   - 이모티콘 디렉토리를 API로 스캔해 동적으로 목록 구성
 *   - 카테고리(인사, 감정, 게임…)별 그루핑
 *   - 사용자 정의 이모티콘 업로드 (부적절 콘텐츠 필터 준비 후)
 */
export const EMOTICONS: { keyword: string; label: string; ext?: string }[] = [
  { keyword: '멍',     label: '멍',     ext: 'jpg' },
  { keyword: '신나',   label: '신나',   ext: 'png' },
  { keyword: '음',     label: '음',     ext: 'png' },
  { keyword: '헐',     label: '헐',     ext: 'jpg' },
  { keyword: '부끄러워', label: '부끄러워', ext: 'png' },
  { keyword: '화났어', label: '화났어', ext: 'png' },
  { keyword: '졸려',   label: '졸려',   ext: 'jpg' },
  { keyword: '찡긋',   label: '찡긋',   ext: 'png' },
  { keyword: '배고파', label: '배고파', ext: 'png' },
  { keyword: '냠냠',   label: '냠냠',   ext: 'jpg' },
  { keyword: '사랑해', label: '사랑해', ext: 'png' },
  { keyword: '응',     label: '응',     ext: 'png' },
  { keyword: '화이팅', label: '화이팅', ext: 'png' },
  { keyword: '장난',   label: '장난',   ext: 'jpg' },
  { keyword: '힝',     label: '힝',     ext: 'png' },
];

/** keyword → 이미지 경로 변환 */
const emoticonSrc = (keyword: string, ext = 'jpg') =>
  `/emotions/e_${keyword}.${ext}`;

/**
 * 텍스트에서 [emoticon:키워드] 토큰을 찾아 이미지 src로 변환합니다.
 * 없으면 null을 반환합니다.
 */
const parseEmoticonToken = (content: string): string | null => {
  const m = content.match(/^\[emoticon:(.+?)\]$/);
  if (!m) return null;
  const keyword = m[1];
  const meta = EMOTICONS.find(e => e.keyword === keyword);
  return meta ? emoticonSrc(meta.keyword, meta.ext) : null;
};

/**
 * 사용자가 /키워드 형식으로 입력했는지 확인하고
 * 매칭되는 이모티콘 keyword를 반환합니다. 없으면 null.
 */
const matchEmoticonCommand = (text: string): string | null => {
  if (!text.startsWith('/')) return null;
  const keyword = text.slice(1).trim();
  const meta = EMOTICONS.find(e => e.keyword === keyword);
  return meta ? meta.keyword : null;
};

// ─────────────────────────────────────────────
// Profanity / game utils (unchanged)
// ─────────────────────────────────────────────

const BANNED_WORDS = [
  '시발', '씨발', '개새끼', '병신', '미친', 'ㅅㅂ', 'ㅄ',
  'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'nigger',
];
const COMMON_WORDS = new Set<string>([
  '가나다', '가방', '가을', '나무', '나비', '다리', '다음', '라디오', '마음', '모자',
  '바다', '바람', '사과', '사랑', '아이', '아침', '자동차', '자전거', '차량', '차례',
  '카메라', '컴퓨터', '타이어', '파도', '피아노', '하늘', '학교', '한국', '휴지',
  '기차', '고양이', '강아지', '사자', '호랑이', '토끼', '원숭이', '코끼리', '기린', '펭귄',
]);
const containsBadWord  = (t: string) => BANNED_WORDS.some(w => t.toLowerCase().includes(w.toLowerCase()));
const isValidWordChain = (word: string, prev: string) => {
  if (!prev) return true;
  if (word.length < 2) return false;
  return prev[prev.length - 1] === word[0];
};
const isValidWord = async (word: string): Promise<boolean> => COMMON_WORDS.has(word);

const generateRandomName = () => {
  const prefixes = ['어둠의','빛의','전략의','신속한','정밀한','신비로운','침묵의','폭풍의'];
  const suffixes = ['매','호랑이','독수리','늑대','고스트','팬텀','나이트','로드'];
  const n = Math.floor(Math.random() * 999) + 1;
  return `${prefixes[Math.floor(Math.random()*prefixes.length)]} ${suffixes[Math.floor(Math.random()*suffixes.length)]} #${n.toString().padStart(3,'0')}`;
};

const MAX_MESSAGES = 100;

// ─────────────────────────────────────────────
// EmoticonPicker sub-component
// ─────────────────────────────────────────────

interface EmoticonPickerProps {
  onSelect: (keyword: string) => void;
  onClose: () => void;
}

function EmoticonPicker({ onSelect, onClose }: EmoticonPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 z-50
                 bg-gray-900 border border-gray-700 rounded-2xl p-3 shadow-2xl
                 w-64 animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">이모티콘</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
          <RiCloseLine className="w-4 h-4" />
        </button>
      </div>

      {/* Emoticon grid */}
      <div className="grid grid-cols-4 gap-2">
        {EMOTICONS.map(({ keyword, label, ext }) => (
          <button
            key={keyword}
            onClick={() => { onSelect(keyword); onClose(); }}
            className="flex flex-col items-center gap-1 p-1.5 rounded-xl
                       hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30
                       transition-all duration-150 group"
            title={`/${keyword}`}
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={emoticonSrc(keyword, ext)}
                alt={label}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-150"
                onError={(e) => {
                  // 이미지 없을 때 placeholder 텍스트
                  const el = e.currentTarget;
                  el.style.display = 'none';
                  el.parentElement!.innerHTML = `<span class="text-xs text-gray-500">${label}</span>`;
                }}
              />
            </div>
            <span className="text-[9px] text-gray-500 group-hover:text-cyan-400 transition-colors truncate w-full text-center">
              /{keyword}
            </span>
          </button>
        ))}
      </div>

      {/* Hint */}
      <p className="text-[9px] text-gray-600 mt-2 text-center">
        채팅창에 <span className="text-cyan-600">/키워드</span> 입력으로도 사용 가능
      </p>

      {/*
        ── 향후 확장 포인트 ──────────────────────────────────────────
        이 영역에 "사진 업로드" 버튼을 추가할 예정입니다.
        부적절 이미지 필터(서버사이드 Vision API 또는 클라이언트 NSFWJS)
        준비 완료 후 구현합니다.
        ────────────────────────────────────────────────────────────
      */}
      <div className="mt-2 pt-2 border-t border-gray-800 flex items-center gap-2 opacity-40 cursor-not-allowed select-none">
        <RiImageLine className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[9px] text-gray-500">사진 업로드 (준비 중)</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MessageBubble sub-component
// ─────────────────────────────────────────────

function MessageBubble({ msg }: { msg: LobbyMessage }) {
  const emoticonSrcVal = parseEmoticonToken(msg.content);

  return (
    <div className="group flex items-start gap-3 hover:bg-white/5 rounded-xl p-2 transition-all duration-200">
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/50 flex items-center justify-center">
          <span className="text-xs font-bold text-cyan-300">?</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-cyan-300">{msg.author_name}</span>
          <span className="text-[10px] text-gray-500">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {emoticonSrcVal ? (
          /* ── 이모티콘 메시지 ── */
          <div className="mt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={emoticonSrcVal}
              alt={msg.content}
              className="w-20 h-20 object-cover rounded-xl border border-gray-700
                         hover:scale-125 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-900/30
                         transition-all duration-200 cursor-pointer"
              title={msg.content.replace(/^\[emoticon:(.+?)\]$/, '/$1')}
            />
          </div>
        ) : (
          /* ── 일반 텍스트 메시지 ── */
          <p className="text-gray-200 text-sm break-words mt-0.5 leading-relaxed">
            {msg.content}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function LobbyChatWidget() {
  const [supabase] = useState(() => createClient());
  const [messages, setMessages]       = useState<LobbyMessage[]>([]);
  const [newMessage, setNewMessage]   = useState('');
  const [isSending, setIsSending]     = useState(false);
  const isSendingRef                  = useRef(false);
  const [isLoading, setIsLoading]     = useState(true);
  const [filterWarning, setFilterWarning] = useState<string | null>(null);
  const messagesEndRef                = useRef<HTMLDivElement>(null);
  const scrollContainerRef            = useRef<HTMLDivElement>(null);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  const chatChannel         = useRef<RealtimeChannel | null>(null);
  const reconnectTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEffectEpochRef  = useRef(0);
  const visibilityHandlerRef= useRef<(() => void) | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<'connecting'|'connected'|'error'>('connecting');
  const [userId,     setUserId]     = useState<string | null>(null);
  const [realName,   setRealName]   = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);
  const [nickname,         setNickname]         = useState<string | null>(null);
  const [isAnonymousMode,  setIsAnonymousMode]  = useState(false);
  const [randomAgentName,  setRandomAgentName]  = useState('');

  // 이모티콘 피커 상태
  const [showEmoticonPicker, setShowEmoticonPicker] = useState(false);

  // 끝말잇기 상태
  const [gameActive,     setGameActive]     = useState(false);
  const [currentWord,    setCurrentWord]    = useState('');
  const [currentPlayer,  setCurrentPlayer]  = useState('');
  const [players,        setPlayers]        = useState<string[]>([]);
  const [gameMessage,    setGameMessage]    = useState('');
  const [usedWords,      setUsedWords]      = useState<Set<string>>(new Set());

  const gameChannel      = useRef<RealtimeChannel | null>(null);
  const gameChannelReady = useRef(false);
  const afkTimerRef      = useRef<NodeJS.Timeout | null>(null);

  const displayName = isAnonymousMode ? randomAgentName : (nickname || '익명의 요원');

  // ── 유저 초기화 ──────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles').select('full_name').eq('id', user.id).single();
        if (profile?.full_name) setRealName(profile.full_name);
      } else {
        setIsLoggedIn(false);
        setUserId(null);
        setRealName(null);
      }
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    if (isLoggedIn && realName) {
      setNickname(realName);
      setIsAnonymousMode(false);
    } else if (isLoggedIn && !realName) {
      const saved = localStorage.getItem('lobby_nickname');
      setNickname(saved?.trim() || '익명의 요원');
      setIsAnonymousMode(false);
    } else {
      const saved = localStorage.getItem('lobby_nickname');
      setNickname(saved?.trim() || '익명의 요원');
      setIsAnonymousMode(true);
    }
    setRandomAgentName(generateRandomName());
  }, [isLoggedIn, realName]);

  const changeNickname = () => {
    if (isAnonymousMode) { alert('익명 모드에서는 닉네임을 변경할 수 없습니다.'); return; }
    const newName = prompt('새 닉네임을 입력하세요 (최대 20자)', nickname || '익명의 요원');
    if (newName && newName.trim()) {
      const t = newName.trim().slice(0, 20);
      setNickname(t);
      localStorage.setItem('lobby_nickname', t);
    } else if (newName === '') {
      setNickname('익명의 요원');
      localStorage.setItem('lobby_nickname', '익명의 요원');
    }
  };

  const toggleAnonymousMode = () => {
    if (!isLoggedIn) { alert('로그인하지 않은 상태에서는 익명 모드만 가능합니다.'); return; }
    setIsAnonymousMode(prev => !prev);
  };

  // ── AFK 타이머 ───────────────────────────────
  const resetAfkTimer = useCallback(() => {
    if (afkTimerRef.current) { clearTimeout(afkTimerRef.current); afkTimerRef.current = null; }
    if (gameActive && currentPlayer === displayName && players.length > 0) {
      afkTimerRef.current = setTimeout(() => {
        if (gameActive && currentPlayer === displayName && gameChannel.current && gameChannelReady.current) {
          gameChannel.current.send({
            type: 'broadcast', event: 'game_word',
            payload: { player: displayName, word: '', success: false, reason: '시간 초과로 턴이 넘어갑니다.' }
          });
        }
        afkTimerRef.current = null;
      }, 35000);
    }
  }, [gameActive, currentPlayer, displayName, players.length]);

  useEffect(() => {
    resetAfkTimer();
    return () => { if (afkTimerRef.current) { clearTimeout(afkTimerRef.current); afkTimerRef.current = null; } };
  }, [resetAfkTimer]);

  // ── 실시간 채팅 구독 ─────────────────────────
  useEffect(() => {
    const epoch = ++chatEffectEpochRef.current;
    let disposed   = false;
    let retryCount = 0;
    const MAX_RETRIES = 8;
    let isSubscribing = false;

    const isStale = () => disposed || chatEffectEpochRef.current !== epoch;
    const clearTimer = () => { if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; } };

    const teardown = async () => {
      clearTimer();
      const ch = chatChannel.current;
      if (!ch) return;
      chatChannel.current = null;
      await supabase.removeChannel(ch);
    };

    const loadMessages = async () => {
      if (isStale()) return;
      try {
        const { data, error } = await supabase
          .from('lobby_messages')
          .select('*')
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(MAX_MESSAGES);
        if (error) throw error;
        if (!isStale()) setMessages((data || []).reverse());
      } catch (err) {
        console.error('로비 채팅 로드 실패:', err);
      } finally {
        if (!isStale()) setIsLoading(false);
      }
    };

    const scheduleReconnect = () => {
      if (isStale()) return;
      if (retryCount >= MAX_RETRIES) { setConnectionStatus('error'); return; }
      retryCount++;
      const ms = Math.min(10000, Math.pow(2, retryCount) * 1000);
      clearTimer();
      reconnectTimerRef.current = setTimeout(() => { if (!isStale()) void subscribe(); }, ms);
    };

    const subscribe = async () => {
      if (isStale() || isSubscribing) return;
      isSubscribing = true;
      await teardown();
      if (isStale()) { isSubscribing = false; return; }
      setConnectionStatus('connecting');

      const ch = supabase
        .channel('lobby:messages:realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lobby_messages' }, (payload) => {
          if (isStale()) return;
          const newMsg = payload.new as LobbyMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg].slice(-MAX_MESSAGES);
          });
        })
        .subscribe((status) => {
          if (isStale()) { isSubscribing = false; return; }
          if (chatChannel.current !== ch) { isSubscribing = false; return; }
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
            retryCount = 0;
            isSubscribing = false;
          } else if (['CHANNEL_ERROR','CLOSED','TIMED_OUT'].includes(status)) {
            setConnectionStatus('error');
            void teardown().then(() => { isSubscribing = false; scheduleReconnect(); });
          } else {
            isSubscribing = false;
          }
        });

      chatChannel.current = ch;
    };

    void loadMessages();
    void subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !isStale() && connectionStatus !== 'connected') {
        retryCount = 0;
        void subscribe();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    visibilityHandlerRef.current = handleVisibility;

    return () => {
      disposed = true;
      clearTimer();
      if (visibilityHandlerRef.current) {
        window.removeEventListener('visibilitychange', visibilityHandlerRef.current);
        visibilityHandlerRef.current = null;
      }
      void teardown();
    };
  }, [supabase, reconnectTrigger, connectionStatus]);

  // ── 게임 채널 구독 ───────────────────────────
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel('game:lobby', { config: { broadcast: { ack: false } } });

    ch
      .on('broadcast', { event: 'game_start' }, ({ payload }: { payload: GameStartPayload }) => {
        setGameActive(true); setCurrentWord(payload.startWord);
        setPlayers([payload.starter]); setCurrentPlayer(payload.starter);
        setUsedWords(new Set());
        setGameMessage(`🎮 게임이 시작되었습니다! 시작 단어: "${payload.startWord}"`);
      })
      .on('broadcast', { event: 'game_join' }, ({ payload }: { payload: GameJoinPayload }) => {
        setPlayers(prev => prev.includes(payload.player) ? prev : [...prev, payload.player]);
        setGameMessage(`✨ ${payload.player}님이 게임에 참가했습니다!`);
      })
      .on('broadcast', { event: 'game_leave' }, ({ payload }: { payload: GameLeavePayload }) => {
        setPlayers(prev => prev.filter(p => p !== payload.player));
        setGameMessage(`👋 ${payload.player}님이 게임을 떠났습니다.`);
      })
      .on('broadcast', { event: 'game_word' }, ({ payload }: { payload: GameWordPayload }) => {
        if (payload.success) {
          setCurrentWord(payload.word);
          setUsedWords(prev => new Set(prev).add(payload.word));
          setPlayers(prevPlayers => {
            const idx = prevPlayers.findIndex(p => p === payload.player);
            if (idx === -1) return prevPlayers;
            const next = prevPlayers[(idx + 1) % prevPlayers.length];
            setCurrentPlayer(next);
            setGameMessage(`✅ ${payload.player}님이 "${payload.word}" (으)로 이어갑니다! 다음은 ${next}님 차례입니다.`);
            return prevPlayers;
          });
        } else {
          setPlayers(prevPlayers => {
            const idx = prevPlayers.findIndex(p => p === payload.player);
            if (idx === -1) return prevPlayers;
            const next = prevPlayers[(idx + 1) % prevPlayers.length];
            setCurrentPlayer(next);
            setGameMessage(`❌ ${payload.player}님의 "${payload.word}" 실패 (${payload.reason}) → 다음은 ${next}님 차례입니다.`);
            return prevPlayers;
          });
        }
      })
      .on('broadcast', { event: 'game_end' }, ({ payload }: { payload: GameEndPayload }) => {
        setGameActive(false); setCurrentWord(''); setCurrentPlayer('');
        setPlayers([]); setUsedWords(new Set());
        setGameMessage(`🏁 게임 종료. ${payload.reason || ''}`);
      });

    ch.subscribe(status => { gameChannelReady.current = status === 'SUBSCRIBED'; });
    gameChannel.current = ch;
    return () => { gameChannelReady.current = false; ch.unsubscribe(); gameChannel.current = null; };
  }, [supabase]);

  useEffect(() => {
    if (!gameActive) return;
    if (players.length === 0) { setGameActive(false); setGameMessage('게임에 참여한 사람이 없어 종료됩니다.'); return; }
    if (!players.includes(currentPlayer)) {
      setCurrentPlayer(players[0]);
      setGameMessage(`🔄 턴이 ${players[0]}님으로 자동 조정되었습니다.`);
    }
  }, [players, currentPlayer, gameActive]);

  // ── 게임 액션 ────────────────────────────────
  const startGame = async () => {
    if (gameActive) { setGameMessage('이미 진행 중인 게임이 있습니다.'); return; }
    const raw = prompt('시작 단어를 입력하세요 (2글자 이상)', '가나다');
    if (!raw || raw.trim().length < 2) { setGameMessage('시작 단어는 2글자 이상이어야 합니다.'); return; }
    const startWord = raw.trim();
    if (!await isValidWord(startWord)) { setGameMessage(`"${startWord}"은(는) 사전에 없는 단어입니다.`); return; }
    if (!gameChannel.current || !gameChannelReady.current) { setGameMessage('게임 채널이 준비되지 않았습니다.'); return; }
    gameChannel.current.send({ type: 'broadcast', event: 'game_start', payload: { starter: displayName, startWord } });
  };

  const joinGame = () => {
    if (!gameActive) { setGameMessage('먼저 게임을 시작해주세요.'); return; }
    if (players.includes(displayName)) { setGameMessage('이미 참가 중입니다.'); return; }
    if (!gameChannel.current || !gameChannelReady.current) { setGameMessage('게임 채널이 준비되지 않았습니다.'); return; }
    gameChannel.current.send({ type: 'broadcast', event: 'game_join', payload: { player: displayName } });
  };
  const leaveGame = () => {
    if (!gameActive || !gameChannel.current || !gameChannelReady.current) return;
    gameChannel.current.send({ type: 'broadcast', event: 'game_leave', payload: { player: displayName } });
  };
  const endGame = () => {
    if (!gameActive || !gameChannel.current || !gameChannelReady.current) return;
    gameChannel.current.send({ type: 'broadcast', event: 'game_end', payload: { reason: `${displayName}님이 게임을 종료했습니다.` } });
  };

  const submitWord = async (word: string) => {
    if (!gameActive) { setGameMessage('현재 활성화된 게임이 없습니다.'); return false; }
    if (currentPlayer !== displayName) { setGameMessage(`지금은 ${currentPlayer}님의 차례입니다.`); return false; }
    const fail = (reason: string) => {
      gameChannel.current?.send({ type: 'broadcast', event: 'game_word', payload: { player: displayName, word, success: false, reason } });
      return false;
    };
    if (usedWords.has(word))           return fail('이미 사용된 단어입니다.');
    if (!isValidWordChain(word, currentWord)) return fail(`'${currentWord}'의 끝 글자와 맞지 않습니다.`);
    if (!await isValidWord(word))      return fail('사전에 없는 단어입니다.');
    gameChannel.current?.send({ type: 'broadcast', event: 'game_word', payload: { player: displayName, word, success: true } });
    return true;
  };

  // ── 이모티콘 선택 핸들러 ─────────────────────
  /**
   * 이모티콘 피커에서 keyword가 선택되거나 /keyword 타이핑 시 호출됩니다.
   * DB content: "[emoticon:키워드]"  message_type: 'emoticon'
   */
  const handleEmoticonSend = async (keyword: string) => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    setIsSending(true);

    const content   = `[emoticon:${keyword}]`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    const tempId    = crypto.randomUUID();

    const optimistic: LobbyMessage = {
      id: tempId, content, author_name: displayName, message_type: 'emoticon',
      created_at: new Date().toISOString(), expires_at: expiresAt.toISOString(),
    };
    setMessages(prev => [...prev, optimistic].slice(-MAX_MESSAGES));
    setNewMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    let attempt = 0;
    let success = false;
    while (attempt < 2 && !success) {
      try {
        const { data, error } = await supabase
          .from('lobby_messages')
          .insert({ content, author_name: displayName, message_type: 'emoticon', expires_at: expiresAt.toISOString() })
          .select().single();
        if (error) throw error;
        setMessages(prev => prev.map(m => m.id === tempId ? (data as LobbyMessage) : m));
        success = true;
      } catch {
        attempt++;
        if (attempt === 2) {
          setMessages(prev => prev.filter(m => m.id !== tempId));
          setFilterWarning('⚠️ 이모티콘 전송에 실패했습니다.');
        } else {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }
    isSendingRef.current = false;
    setIsSending(false);
  };

  // ── 메시지 전송 ──────────────────────────────
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || isSendingRef.current) return;

    // 이모티콘 커맨드 감지 (/키워드)
    const emoticonKeyword = matchEmoticonCommand(trimmed);
    if (emoticonKeyword) {
      await handleEmoticonSend(emoticonKeyword);
      return;
    }

    // 게임 커맨드
    if (trimmed === '/끝말잇기 시작') { await startGame(); setNewMessage(''); return; }
    if (gameActive) {
      if (trimmed === '/끝말잇기 참여')  { joinGame();  setNewMessage(''); return; }
      if (trimmed === '/끝말잇기 나가기') { leaveGame(); setNewMessage(''); return; }
      if (trimmed === '/끝말잇기 종료')  { endGame();   setNewMessage(''); return; }
      await submitWord(trimmed);
      setNewMessage('');
      return;
    }

    // 욕설 필터
    if (containsBadWord(trimmed)) {
      setFilterWarning('⚠️ 부적절한 표현이 포함되어 있습니다.');
      return;
    }

    // 일반 텍스트 전송
    isSendingRef.current = true;
    setIsSending(true);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    const tempId = crypto.randomUUID();
    const optimistic: LobbyMessage = {
      id: tempId, content: trimmed, author_name: displayName, message_type: 'text',
      created_at: new Date().toISOString(), expires_at: expiresAt.toISOString(),
    };
    setMessages(prev => [...prev, optimistic].slice(-MAX_MESSAGES));
    setNewMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    let attempt = 0, success = false;
    while (attempt < 2 && !success) {
      try {
        const { data, error } = await supabase
          .from('lobby_messages')
          .insert({ content: trimmed, author_name: displayName, message_type: 'text', expires_at: expiresAt.toISOString() })
          .select().single();
        if (error) throw error;
        setMessages(prev => prev.map(m => m.id === tempId ? (data as LobbyMessage) : m));
        success = true;
      } catch {
        attempt++;
        if (attempt === 2) {
          setMessages(prev => prev.filter(m => m.id !== tempId));
          setFilterWarning('⚠️ 메시지 전송에 실패했습니다. 네트워크를 확인해 주세요.');
        } else {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }
    isSendingRef.current = false;
    setIsSending(false);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // 사용자가 현재 채팅창 하단에 있을 때만 자동 스크롤

    /*
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;

    자동스크롤 기능 일시 비활성화 - UX 개선을 위해 새 메시지가 도착해도 사용자가 스크롤 위치를 유지하도록 변경
   */
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  useEffect(() => {
    if (filterWarning) {
      const t = setTimeout(() => setFilterWarning(null), 3000);
      return () => clearTimeout(t);
    }
  }, [filterWarning]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (e.nativeEvent.isComposing) return;
      e.currentTarget.form?.requestSubmit();
    }
  };

  const manualReconnect = () => {
    setConnectionStatus('connecting');
    setReconnectTrigger(prev => prev + 1);
  };

  // ── Render ────────────────────────────────────
  return (
    <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
      {/* ── Header ── */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <RiChat3Line className="text-cyan-400 text-xl" />
          <h3 className="text-gray-400 text-sm font-bold tracking-wider">로비 채팅</h3>
          <span className="text-xs bg-cyan-600/30 text-cyan-300 px-2 py-0.5 rounded-full">
            {isAnonymousMode ? '익명 모드' : (isLoggedIn ? '실명 모드' : '게스트')}
          </span>
          {gameActive && (
            <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <RiGamepadLine className="w-3 h-3" /> 끝말잇기 진행중
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 게임 버튼 */}
          <button
            onClick={startGame} disabled={gameActive}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
              gameActive ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30'
            }`}
            title="끝말잇기 게임 시작"
          >
            <RiGamepadLine className="w-3 h-3" /> 게임시작
          </button>
          {gameActive && (<>
            <button onClick={joinGame}  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/30 transition-colors"><RiUserAddLine className="w-3 h-3" /> 참가</button>
            <button onClick={leaveGame} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-colors"><RiLogoutCircleLine className="w-3 h-3" /> 나가기</button>
            <button onClick={endGame}   className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-orange-600/20 text-orange-300 border border-orange-500/30 hover:bg-orange-600/30 transition-colors"><RiCloseLine className="w-3 h-3" /> 종료</button>
          </>)}

          {isLoggedIn && (
            <button onClick={toggleAnonymousMode}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                isAnonymousMode ? 'bg-gray-800/80 text-gray-400 hover:text-cyan-300'
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
            <span className="text-cyan-300 font-mono">{displayName}</span>
            {!isAnonymousMode && (
              <button onClick={changeNickname} className="ml-1 text-gray-500 hover:text-cyan-400 transition-colors" title="닉네임 변경">✏️</button>
            )}
          </div>

          <button onClick={manualReconnect} disabled={connectionStatus === 'connecting'}
            className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200 border ${
              connectionStatus === 'connected' ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
              : connectionStatus === 'error'   ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                               : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 cursor-wait'
            }`}
            title="클릭하여 서버 수동 재연결"
          >
            <RiRefreshLine className="w-3 h-3 mr-0.5" />
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse'
              : connectionStatus === 'error'   ? 'bg-red-500'
                                               : 'bg-yellow-500 animate-bounce'
            }`} />
            {connectionStatus === 'connected' ? 'LIVE' : connectionStatus === 'error' ? '연결 끊김' : '연결 중...'}
          </button>
        </div>
      </div>

      {/* ── 게임 HUD ── */}
      {gameActive && (
        <div className="bg-purple-900/30 border-b border-purple-800/50 p-2 text-center text-sm">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="text-purple-200">🎮 끝말잇기 중</span>
            <span className="text-cyan-300 font-mono">현재 단어: <strong>{currentWord || '?'}</strong></span>
            <span className="text-yellow-200">🎤 차례: {currentPlayer}</span>
            <span className="text-gray-400">👥 {players.length}명 참여</span>
          </div>
          {gameMessage && <div className="text-xs text-gray-300 mt-1 animate-pulse">{gameMessage}</div>}
        </div>
      )}

      {/* ── 메시지 목록 ── */}
      <div 
        ref={scrollContainerRef}
        className="h-[550px] overflow-y-auto p-4 space-y-3 custom-scrollbar"
      >
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
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── 입력창 ── */}
      <form onSubmit={sendMessage} className="border-t border-white/10 p-4 bg-black/30">
        <div className="flex gap-2 items-end relative">
          {/* 이모티콘 피커 */}
          {showEmoticonPicker && (
            <EmoticonPicker
              onSelect={handleEmoticonSend}
              onClose={() => setShowEmoticonPicker(false)}
            />
          )}

          {/* 이모티콘 버튼 */}
          <button
            type="button"
            onClick={() => setShowEmoticonPicker(prev => !prev)}
            className={`flex-shrink-0 p-2.5 rounded-xl border transition-all duration-200 ${
              showEmoticonPicker
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-cyan-300 hover:border-cyan-500/30'
            }`}
            title="이모티콘 선택"
          >
            <RiEmotionLine className="w-5 h-5" />
          </button>

          {/* 텍스트 입력 */}
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              gameActive
                ? `끝말잇기: '${currentWord}'의 끝 글자로 시작하는 단어 입력`
                : '메시지 입력... (이모티콘: /안녕, /감사 …)'
            }
            className="flex-1 resize-none overflow-hidden bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all text-white placeholder-gray-500"
          />

          {/* 전송 버튼 */}
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="flex-shrink-0 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-5 py-2.5 transition-all duration-200 shadow-lg shadow-cyan-900/20"
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
