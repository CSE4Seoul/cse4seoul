'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  RiChat3Line, RiSendPlaneLine, RiAlertLine, RiUserLine, RiEyeOffLine,
  RiGamepadLine, RiCloseLine, RiUserAddLine, RiLogoutCircleLine, RiRefreshLine,
  RiEmotionLine, RiImageLine, RiArrowDownSLine, RiArrowUpSLine,
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
// Game Types & Constants
// ─────────────────────────────────────────────

import wordData from './word_map.json';
const WORD_MAP: Record<string, string[]> = wordData;

interface GamePlayer {
  id: string;
  name: string;
}

type GameStatus = 'IDLE' | 'WAITING' | 'PLAYING' | 'ENDED';

interface GameState {
  status: GameStatus;
  hostId: string;
  players: GamePlayer[];
  currentTurnIndex: number;
  currentWord: string;
  usedWords: string[];
  turnTimeLimit: number;
  remainingTime: number;
  winner?: string;
}

const INITIAL_GAME_STATE: GameState = {
  status: 'IDLE',
  hostId: '',
  players: [],
  currentTurnIndex: 0,
  currentWord: '',
  usedWords: [],
  turnTimeLimit: 10,
  remainingTime: 0,
};

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
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('lobby_auto_scroll') !== 'false';
  });

  // AI 상태
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiModel, setAiModel] = useState('qwen2.5:1.5b');
  const [isAiMode, setIsAiMode] = useState(false); 

  // ── 끝말잇기 상태 ──
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [wordSets, setWordSets] = useState<Record<string, Set<string>>>({});
  const [showRecruitmentPopup, setShowRecruitmentPopup] = useState(false);

  const gameChannel      = useRef<RealtimeChannel | null>(null);
  const gameChannelReady = useRef(false);
  const gameTimerRef     = useRef<NodeJS.Timeout | null>(null);

  const displayName = isAnonymousMode ? randomAgentName : (nickname || '익명의 요원');
  const currentUserId = userId || randomAgentName; // Fallback to name for anon

  useEffect(() => {
    const sets: Record<string, Set<string>> = {};
    for (const char in WORD_MAP) {
      sets[char] = new Set(WORD_MAP[char]);
    }
    setWordSets(sets);
  }, []);

  useEffect(() => {
    localStorage.setItem('lobby_auto_scroll', autoScrollEnabled ? 'true' : 'false');
  }, [autoScrollEnabled]);

  // ── AI 통신 ... (생략 가능하지만 유지) ───────────────────────
  const askOllama = async (prompt: string) => {
    if (prompt.startsWith('🤖')) return null;
    setIsAiProcessing(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: aiModel, prompt: prompt }),
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`서버가 올바르지 않은 응답을 보냈습니다.`);
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.content);
      return data.content;
    } catch (err: any) {
      return `⚠️ AI 연결 실패: ${err.message}`;
    } finally {
      setIsAiProcessing(false);
    }
  };

  const sendAiMessage = async (content: string) => {
    if (!content) return;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    try {
      await supabase.from('lobby_messages').insert({ 
        content, author_name: `🤖 AI Assistant (${aiModel})`, 
        message_type: 'text', expires_at: expiresAt.toISOString() 
      });
    } catch (err) { console.error(err); }
  };

  // ── 유저 초기화 ──────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        setUserId(user.id);
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (profile?.full_name) setRealName(profile.full_name);
      } else {
        setIsLoggedIn(false); setUserId(null); setRealName(null);
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
    }
  };

  const toggleAnonymousMode = () => {
    if (!isLoggedIn) { alert('로그인하지 않은 상태에서는 익명 모드만 가능합니다.'); return; }
    setIsAnonymousMode(prev => !prev);
  };

  // ── 끝말잇기 게임 로직 ───────────────────────

  const broadcastGameSync = useCallback((state: GameState) => {
    if (gameChannel.current && gameChannelReady.current) {
      gameChannel.current.send({
        type: 'broadcast',
        event: 'game_sync',
        payload: state,
      });
    }
  }, []);

  const handleGameInit = () => {
    if (gameState.status !== 'IDLE' && gameState.status !== 'ENDED') {
      setFilterWarning('이미 끝말잇기 게임이 진행 중입니다.');
      return;
    }
    const newState: GameState = {
      ...INITIAL_GAME_STATE,
      status: 'WAITING',
      hostId: currentUserId,
      players: [{ id: currentUserId, name: displayName }],
      remainingTime: 15,
      turnTimeLimit: 10,
    };
    setGameState(newState);
    broadcastGameSync(newState);
    setShowRecruitmentPopup(true);
  };

  const handleGameJoin = () => {
    if (gameState.status !== 'WAITING') return;
    if (gameState.players.some(p => p.id === currentUserId)) return;

    const newState = {
      ...gameState,
      players: [...gameState.players, { id: currentUserId, name: displayName }],
    };
    setGameState(newState);
    broadcastGameSync(newState);
  };

  const handleUpdateTimeLimit = (limit: number) => {
    if (gameState.status !== 'WAITING' || gameState.hostId !== currentUserId) return;
    const newState = { ...gameState, turnTimeLimit: limit };
    setGameState(newState);
    broadcastGameSync(newState);
  };

  const sendSystemMessage = useCallback(async (content: string) => {
    if (gameState.hostId !== currentUserId) return;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    try {
      await supabase.from('lobby_messages').insert({ 
        content: `📢 ${content}`, author_name: '시스템', 
        message_type: 'text', expires_at: expiresAt.toISOString() 
      });
    } catch (err) { console.error(err); }
  }, [supabase, gameState.hostId, currentUserId]);

  const startPlaying = useCallback(async () => {
    if (gameState.hostId !== currentUserId) return;
    
    if (gameState.players.length < 2) {
      const endState: GameState = { ...gameState, status: 'ENDED', winner: '인원 부족으로 취소' };
      setGameState(endState);
      broadcastGameSync(endState);
      return;
    }

    const allChars = Object.keys(WORD_MAP);
    const randomChar = allChars[Math.floor(Math.random() * allChars.length)];
    const words = WORD_MAP[randomChar];
    const startWord = words[Math.floor(Math.random() * words.length)];

    const newState: GameState = {
      ...gameState,
      status: 'PLAYING',
      currentTurnIndex: 0,
      currentWord: startWord,
      usedWords: [startWord],
      remainingTime: gameState.turnTimeLimit,
    };
    setGameState(newState);
    broadcastGameSync(newState);
    await sendSystemMessage(`게임 시작! 시작 단어: [${startWord}]`);
  }, [gameState, currentUserId, broadcastGameSync, sendSystemMessage]);

  const handleTimeout = useCallback(async () => {
    if (gameState.hostId !== currentUserId) return;

    if (gameState.status === 'WAITING') {
      await startPlaying();
    } else if (gameState.status === 'PLAYING') {
      const currentPlayer = gameState.players[gameState.currentTurnIndex];
      const remainingPlayers = gameState.players.filter(p => p.id !== currentPlayer.id);

      await sendSystemMessage(`${currentPlayer.name}님 시간 초과로 탈락!`);

      if (remainingPlayers.length === 1) {
        const endState: GameState = {
          ...gameState,
          status: 'ENDED',
          players: remainingPlayers,
          winner: remainingPlayers[0].name,
        };
        setGameState(endState);
        broadcastGameSync(endState);
        await sendSystemMessage(`게임 종료! 우승자: ${remainingPlayers[0].name}`);
      } else {
        const nextIndex = gameState.currentTurnIndex % remainingPlayers.length;
        const newState: GameState = {
          ...gameState,
          players: remainingPlayers,
          currentTurnIndex: nextIndex,
          remainingTime: gameState.turnTimeLimit,
        };
        setGameState(newState);
        broadcastGameSync(newState);
      }
    }
  }, [gameState, currentUserId, startPlaying, broadcastGameSync, sendSystemMessage]);

  useEffect(() => {
    if (gameState.status === 'IDLE' || gameState.status === 'ENDED') {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      return;
    }

    gameTimerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.remainingTime <= 0) {
          if (prev.hostId === currentUserId) {
            // Host handles the actual logic in handleTimeout which is called by another effect
          }
          return prev;
        }
        return { ...prev, remainingTime: prev.remainingTime - 1 };
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [gameState.status, currentUserId]);

  // Host-only effect to handle transitions
  useEffect(() => {
    if (gameState.hostId === currentUserId && gameState.remainingTime <= 0) {
      if (gameState.status === 'WAITING' || gameState.status === 'PLAYING') {
        handleTimeout();
      }
    }
  }, [gameState.remainingTime, gameState.status, gameState.hostId, currentUserId, handleTimeout]);

  const validateWord = (word: string): string | null => {
    if (word.length < 2) return '2글자 이상 입력해주세요.';
    if (!/^[가-힣]+$/.test(word)) return '한글만 입력 가능합니다.';
    
    const lastChar = gameState.currentWord[gameState.currentWord.length - 1];
    if (word[0] !== lastChar) return `'${lastChar}'로 시작해야 합니다.`;
    
    if (gameState.usedWords.includes(word)) return '이미 사용된 단어입니다.';
    
    const firstChar = word[0];
    if (!wordSets[firstChar]?.has(word)) return '사전에 없는 단어입니다.';
    
    return null;
  };

  const submitWord = (word: string) => {
    if (gameState.status !== 'PLAYING') return;
    const currentPlayer = gameState.players[gameState.currentTurnIndex];
    if (currentPlayer.id !== currentUserId) return;

    const error = validateWord(word);
    if (error) {
      setFilterWarning(error);
      return;
    }

    const nextIndex = (gameState.currentTurnIndex + 1) % gameState.players.length;
    const newState: GameState = {
      ...gameState,
      currentWord: word,
      usedWords: [...gameState.usedWords, word],
      currentTurnIndex: nextIndex,
      remainingTime: gameState.turnTimeLimit,
    };
    setGameState(newState);
    broadcastGameSync(newState);
  };

  // ── 실시간 채팅 & 게임 채널 구독 ─────────────────────────
  useEffect(() => {
    const epoch = ++chatEffectEpochRef.current;
    let disposed = false;
    const isStale = () => disposed || chatEffectEpochRef.current !== epoch;

    const loadMessages = async () => {
      try {
        const { data } = await supabase.from('lobby_messages').select('*')
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false }).limit(MAX_MESSAGES);
        if (!isStale()) setMessages((data || []).reverse());
      } catch (err) { console.error(err); }
      finally { if (!isStale()) setIsLoading(false); }
    };

    const subscribeChat = async () => {
      const ch = supabase.channel('lobby:messages:realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lobby_messages' }, (payload) => {
          if (isStale()) return;
          setMessages(prev => [...prev, payload.new as LobbyMessage].slice(-MAX_MESSAGES));
        }).subscribe();
      chatChannel.current = ch;
    };

    const subscribeGame = () => {
      const ch = supabase.channel('game:lobby');
      ch.on('broadcast', { event: 'game_sync' }, ({ payload }: { payload: GameState }) => {
        if (isStale()) return;
        setGameState(payload);
        // Only show popup if status is WAITING and I'm not in the player list yet
        if (payload.status === 'WAITING' && !payload.players.some(p => p.id === currentUserId)) {
          setShowRecruitmentPopup(true);
        }
        // If game ended or started, hide recruitment popup
        if (payload.status !== 'WAITING') {
          setShowRecruitmentPopup(false);
        }
      }).subscribe(status => { gameChannelReady.current = status === 'SUBSCRIBED'; });
      gameChannel.current = ch;
    };

    loadMessages();
    subscribeChat();
    subscribeGame();

    return () => {
      disposed = true;
      if (chatChannel.current) supabase.removeChannel(chatChannel.current);
      if (gameChannel.current) supabase.removeChannel(gameChannel.current);
    };
  }, [supabase, currentUserId]); // Removed gameState dependency to avoid loops

  // ── 이모티콘 선택 핸들러 ─────────────────────
  const handleEmoticonSend = async (keyword: string) => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    setIsSending(true);

    const content = `[emoticon:${keyword}]`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    try {
      await supabase.from('lobby_messages').insert({
        content,
        author_name: displayName,
        message_type: 'emoticon',
        expires_at: expiresAt.toISOString(),
      });
      setNewMessage('');
    } catch {
      setFilterWarning('⚠️ 이모티콘 전송에 실패했습니다.');
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  // ── 메시지 전송 ──────────────────────────────
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || isSendingRef.current) return;

    if (trimmed === '/끝말잇기') {
      handleGameInit();
      setNewMessage('');
      return;
    }

    if (gameState.status === 'PLAYING' && gameState.players[gameState.currentTurnIndex].id === currentUserId) {
      submitWord(trimmed);
      setNewMessage('');
      return;
    }

    const emoticonKeyword = matchEmoticonCommand(trimmed);
    if (emoticonKeyword) {
      await handleEmoticonSend(emoticonKeyword);
      return;
    }

    if (containsBadWord(trimmed)) {
      setFilterWarning('⚠️ 부적절한 표현이 포함되어 있습니다.');
      return;
    }

    isSendingRef.current = true;
    setIsSending(true);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    
    try {
      const { data, error } = await supabase.from('lobby_messages').insert({ 
        content: trimmed, author_name: displayName, message_type: 'text', 
        expires_at: expiresAt.toISOString() 
      }).select().single();
      
      if (!error && data) {
        // AI Response Logic
        if (gameState.status !== 'PLAYING') {
          if (trimmed.startsWith('/ai ')) {
            const aiResponse = await askOllama(trimmed.replace('/ai ', ''));
            await sendAiMessage(aiResponse);
          } else if (isAiMode && !isAiProcessing) {
            const aiResponse = await askOllama(trimmed);
            await sendAiMessage(aiResponse);
          }
        }
      }
    } catch {
      setFilterWarning('⚠️ 메시지 전송에 실패했습니다.');
    } finally {
      setNewMessage('');
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (autoScrollEnabled && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, autoScrollEnabled]);

  useEffect(() => {
    if (filterWarning) {
      const t = setTimeout(() => setFilterWarning(null), 3000);
      return () => clearTimeout(t);
    }
  }, [filterWarning]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!e.nativeEvent.isComposing) e.currentTarget.form?.requestSubmit();
    }
  };

  // ── Render Helpers ───────────────────────────

  const RecruitmentPopup = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-purple-500/50 rounded-2xl p-6 shadow-2xl w-80 text-center">
        <RiGamepadLine className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-bounce" />
        <h4 className="text-xl font-bold text-white mb-2">끝말잇기 모집 중!</h4>
        <p className="text-gray-400 text-sm mb-6">함께 게임을 즐기시겠습니까?</p>
        <div className="flex gap-3">
          <button
            onClick={() => { handleGameJoin(); setShowRecruitmentPopup(false); }}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl font-bold transition-colors"
          >
            참여하기
          </button>
          <button
            onClick={() => setShowRecruitmentPopup(false)}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl transition-colors"
          >
            <RiCloseLine className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );

  const GameHUD = () => {
    const isMyTurn = gameState.status === 'PLAYING' && gameState.players[gameState.currentTurnIndex]?.id === currentUserId;
    
    return (
      <div className="bg-purple-900/40 border-b border-purple-500/30 p-3">
        {gameState.status === 'WAITING' ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-purple-200 font-bold">
              <span className="animate-pulse">모집 중...</span>
              <span className="bg-purple-600/50 px-2 py-0.5 rounded text-xs">{gameState.remainingTime}초 남음</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">참가자: {gameState.players.length}명</span>
              {gameState.hostId === currentUserId && (
                <div className="flex items-center gap-2 bg-gray-800 px-2 py-1 rounded-lg border border-gray-700">
                  <span className="text-[10px] text-gray-400">제한시간:</span>
                  <input
                    type="range" min="5" max="30" step="5"
                    value={gameState.turnTimeLimit}
                    onChange={(e) => handleUpdateTimeLimit(Number(e.target.value))}
                    className="w-20 h-1 accent-purple-500"
                  />
                  <span className="text-[10px] text-purple-300 w-6">{gameState.turnTimeLimit}s</span>
                </div>
              )}
            </div>
          </div>
        ) : gameState.status === 'PLAYING' ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-300 font-bold">현재 단어:</span>
                <span className="text-lg text-white font-black tracking-widest">{gameState.currentWord}</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${isMyTurn ? 'bg-yellow-500 text-black animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
                {isMyTurn ? '내 차례!' : `${gameState.players[gameState.currentTurnIndex]?.name}님 차례`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${gameState.remainingTime < 4 ? 'bg-red-500' : 'bg-purple-500'}`}
                  style={{ width: `${(gameState.remainingTime / gameState.turnTimeLimit) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-purple-300 w-4">{gameState.remainingTime}s</span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-sm font-bold text-yellow-400">
              {gameState.winner === '인원 부족으로 취소' ? '참가 인원이 부족하여 게임이 취소되었습니다.' : `🎉 ${gameState.winner}님 우승!`}
            </span>
            <button 
              onClick={() => setGameState(INITIAL_GAME_STATE)}
              className="ml-3 text-[10px] bg-gray-800 px-2 py-1 rounded hover:bg-gray-700 text-gray-400 transition-colors"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
      {showRecruitmentPopup && gameState.status === 'WAITING' && <RecruitmentPopup />}
      
      {/* ── Header ── */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <RiChat3Line className="text-cyan-400 text-xl" />
          <h3 className="text-gray-400 text-sm font-bold tracking-wider">로비 채팅</h3>
          <span className="text-xs bg-cyan-600/30 text-cyan-300 px-2 py-0.5 rounded-full">
            {isAnonymousMode ? '익명 모드' : (isLoggedIn ? '실명 모드' : '게스트')}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGameInit}
            disabled={gameState.status !== 'IDLE' && gameState.status !== 'ENDED'}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
              (gameState.status !== 'IDLE' && gameState.status !== 'ENDED')
                ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30'
            }`}
          >
            <RiGamepadLine className="w-3 h-3" /> 끝말잇기
          </button>

          <button
            type="button"
            onClick={() => setAutoScrollEnabled(prev => !prev)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
              autoScrollEnabled ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30'
                                : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            {autoScrollEnabled ? '스크롤 ON' : '스크롤 OFF'}
          </button>

          {/* AI 모드 토글 */}
          <button
            type="button"
            onClick={() => {
              if (!isLoggedIn) {
                alert('AI 기능은 로그인한 회원만 이용할 수 있습니다.');
                return;
              }
              setIsAiMode(prev => !prev);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
              isAiMode ? 'bg-pink-600/20 text-pink-300 border border-pink-500/30 hover:bg-pink-600/30'
                       : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
            }`}
            title={isAiMode ? 'AI 자동 응답 끄기' : 'AI 자동 응답 켜기'}
          >
            <span className={isAiMode ? 'animate-bounce' : ''}>🤖</span>
            {isAiMode ? 'AI ON' : 'AI OFF'}
          </button>

          <div className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm">
            <span className="text-gray-400">👤</span>
            <span className="text-cyan-300 font-mono">{displayName}</span>
          </div>

          <button onClick={() => setReconnectTrigger(t => t+1)}
            className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200 border ${
              connectionStatus === 'connected' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }`}
          >
            <RiRefreshLine className="w-3 h-3" />
            {connectionStatus === 'connected' ? 'LIVE' : 'CONNECTING...'}
          </button>
        </div>
      </div>

      {gameState.status !== 'IDLE' && <GameHUD />}

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
      </div>

      {/* ── 입력창 ── */}
      <form onSubmit={sendMessage} className="border-t border-white/10 p-4 bg-black/30">
        <div className="flex gap-2 items-end relative">
          {showEmoticonPicker && (
            <EmoticonPicker
              onSelect={handleEmoticonSend}
              onClose={() => setShowEmoticonPicker(false)}
            />
          )}

          <button
            type="button"
            onClick={() => setShowEmoticonPicker(prev => !prev)}
            className="flex-shrink-0 p-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-cyan-300 hover:border-cyan-500/30 bg-gray-800/50"
          >
            <RiEmotionLine className="w-5 h-5" />
          </button>

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
              gameState.status === 'PLAYING' && gameState.players[gameState.currentTurnIndex]?.id === currentUserId
                ? `'${gameState.currentWord[gameState.currentWord.length - 1]}'로 시작하는 단어 입력!`
                : '메시지 입력... (/끝말잇기 로 시작)'
            }
            className="flex-1 resize-none overflow-hidden bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all text-white placeholder-gray-500"
          />

          {/* AI 처리 중 표시 */}
          {isAiProcessing && (
            <div className="absolute -top-8 left-0 flex items-center gap-2 text-pink-400 text-xs animate-pulse">
              <span className="flex h-2 w-2 rounded-full bg-pink-500"></span>
              AI가 생각 중입니다 ({aiModel})...
            </div>
          )}

          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="flex-shrink-0 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-5 py-2.5 transition-all duration-200"
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
      </form>
    </div>
  );
}
