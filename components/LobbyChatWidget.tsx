'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  RiChat3Line, RiSendPlaneLine, RiAlertLine, RiUserLine, RiEyeOffLine,
  RiGamepadLine, RiCloseLine, RiUserAddLine, RiLogoutCircleLine
} from 'react-icons/ri';

interface LobbyMessage {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
  expires_at: string;
}

// 게임 브로드캐스트 페이로드 타입
type GameStartPayload = { starter: string; startWord: string };
type GameJoinPayload = { player: string };
type GameLeavePayload = { player: string };
type GameWordPayload = { player: string; word: string; success: boolean; reason?: string };
type GameEndPayload = { reason: string };

const BANNED_WORDS = [
  '시발', '씨발', '개새끼', '병신', '미친', 'ㅅㅂ', 'ㅄ',
  'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'nigger',
];

// 간단한 단어 사전 (Set을 사용하여 O(1) 검색)
const COMMON_WORDS = new Set<string>([
  '가나다', '가방', '가을', '나무', '나비', '다리', '다음', '라디오', '마음', '모자',
  '바다', '바람', '사과', '사랑', '아이', '아침', '자동차', '자전거', '차량', '차례',
  '카메라', '컴퓨터', '타이어', '파도', '피아노', '하늘', '학교', '한국', '휴지',
  '기차', '고양이', '강아지', '사자', '호랑이', '토끼', '원숭이', '코끼리', '기린', '펭귄'
]);

const containsBadWord = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return BANNED_WORDS.some(word => lowerText.includes(word.toLowerCase()));
};

const isValidWordChain = (word: string, previousWord: string): boolean => {
  if (!previousWord) return true;
  if (word.length < 2) return false;
  const lastChar = previousWord[previousWord.length - 1];
  const firstChar = word[0];
  return lastChar === firstChar;
};

// 단어 유효성 검증 (로컬 Set + 필요시 DB 연동)
const isValidWord = async (word: string): Promise<boolean> => {
  // 로컬 사전에 있으면 true
  if (COMMON_WORDS.has(word)) return true;
  // TODO: Supabase words 테이블에서 검색 (선택)
  // const supabase = createClient();
  // const { data } = await supabase.from('words').select('word').eq('word', word).single();
  // return !!data;
  return false; // 현재는 로컬 사전에 없는 단어는 유효하지 않음
};

export default function LobbyChatWidget() {
  const supabase = createClient();
  const [messages, setMessages] = useState<LobbyMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterWarning, setFilterWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 로그인 상태
  const [userId, setUserId] = useState<string | null>(null);
  const [realName, setRealName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 닉네임 관련
  const [nickname, setNickname] = useState<string | null>(null);
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);
  const [randomAgentName, setRandomAgentName] = useState('');

  // 끝말잇기 게임 상태
  const [gameActive, setGameActive] = useState(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [currentPlayer, setCurrentPlayer] = useState<string>('');
  const [players, setPlayers] = useState<string[]>([]);
  const [gameMessage, setGameMessage] = useState<string>('');
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());

  const gameChannel = useRef<any>(null);
  const gameChannelReady = useRef(false);

  const generateRandomName = () => {
    const prefixes = ['어둠의', '빛의', '전략의', '신속한', '정밀한', '신비로운', '침묵의', '폭풍의'];
    const suffixes = ['매', '호랑이', '독수리', '늑대', '고스트', '팬텀', '나이트', '로드'];
    const numbers = Math.floor(Math.random() * 999) + 1;
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix} ${suffix} #${numbers.toString().padStart(3, '0')}`;
  };

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

  useEffect(() => {
    if (isLoggedIn && realName) {
      setNickname(realName);
      setIsAnonymousMode(false);
    } else if (isLoggedIn && !realName) {
      const saved = localStorage.getItem('lobby_nickname');
      if (saved && saved.trim()) {
        setNickname(saved.trim());
      } else {
        setNickname('익명의 요원');
      }
      setIsAnonymousMode(false);
    } else {
      const saved = localStorage.getItem('lobby_nickname');
      if (saved && saved.trim()) {
        setNickname(saved.trim());
      } else {
        setNickname('익명의 요원');
      }
      setIsAnonymousMode(true);
    }
    setRandomAgentName(generateRandomName());
  }, [isLoggedIn, realName]);

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

  const toggleAnonymousMode = () => {
    if (!isLoggedIn) {
      alert('로그인하지 않은 상태에서는 익명 모드만 가능합니다.');
      return;
    }
    setIsAnonymousMode(prev => !prev);
  };

  const displayName = isAnonymousMode ? randomAgentName : (nickname || '익명의 요원');


  const MAX_MESSAGES = 100;

// 메시지 로드 및 구독
useEffect(() => {
  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('lobby_messages')
        .select('*')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(MAX_MESSAGES);

      if (error) throw error;

      setMessages((data || []).reverse());
    } catch (err) {
      console.error('로비 채팅 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  loadMessages();

  const subscription = supabase
    .channel('lobby-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'lobby_messages' },
      (payload) => {
        const newMsg = payload.new as LobbyMessage;

        // 만료된 메시지 무시
        if (newMsg.expires_at && new Date(newMsg.expires_at) < new Date()) return;

        setMessages((prev: LobbyMessage[]) => {
          const newList = [...prev, newMsg];

          // 최신 MAX_MESSAGES개만 유지
          if (newList.length > MAX_MESSAGES) {
            newList.shift();
          }

          return newList;
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}, [supabase]);

  // 게임 브로드캐스트 채널 구독
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel('game:lobby', {
      config: { broadcast: { ack: false } }
    });

    channel
      .on('broadcast', { event: 'game_start' }, ({ payload }: { payload: GameStartPayload }) => {
        setGameActive(true);
        setCurrentWord(payload.startWord);
        setPlayers([payload.starter]);
        setCurrentPlayer(payload.starter);
        setUsedWords(new Set());
        setGameMessage(`🎮 게임이 시작되었습니다! 시작 단어: "${payload.startWord}"`);
      })
      .on('broadcast', { event: 'game_join' }, ({ payload }: { payload: GameJoinPayload }) => {
        setPlayers(prev => {
          if (prev.includes(payload.player)) return prev;
          return [...prev, payload.player];
        });
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
            const currentIdx = prevPlayers.findIndex(p => p === payload.player);
            if (currentIdx === -1) return prevPlayers;
            const nextIdx = (currentIdx + 1) % prevPlayers.length;
            const nextPlayer = prevPlayers[nextIdx];
            setCurrentPlayer(nextPlayer);
            setGameMessage(`✅ ${payload.player}님이 "${payload.word}" (으)로 이어갑니다! 다음은 ${nextPlayer}님 차례입니다.`);
            return prevPlayers;
          });
        } else {
          setGameMessage(`❌ ${payload.player}님의 단어 "${payload.word}" (은)는 잘못되었습니다. (${payload.reason})`);
        }
      })
      .on('broadcast', { event: 'game_end' }, ({ payload }: { payload: GameEndPayload }) => {
        setGameActive(false);
        setCurrentWord('');
        setCurrentPlayer('');
        setPlayers([]);
        setUsedWords(new Set());
        setGameMessage(`🏁 게임이 종료되었습니다. ${payload.reason || '종료되었습니다.'}`);
      });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        gameChannelReady.current = true;
      }
    });

    gameChannel.current = channel;

    return () => {
      channel.unsubscribe();
      gameChannel.current = null;
      gameChannelReady.current = false;
    };
  }, [supabase]);

  // players 변경 시 currentPlayer 유효성 검사
  useEffect(() => {
    if (!gameActive) return;
    if (players.length === 0) {
      setGameActive(false);
      setGameMessage('게임에 참여한 사람이 없어 종료됩니다.');
      return;
    }
    if (!players.includes(currentPlayer)) {
      setCurrentPlayer(players[0]);
      setGameMessage(`🔄 턴이 ${players[0]}님으로 자동 조정되었습니다.`);
    }
  }, [players, currentPlayer, gameActive]);

  const startGame = async () => {
    if (gameActive) {
      setGameMessage('이미 진행 중인 게임이 있습니다.');
      return;
    }
    const startWordRaw = prompt('시작 단어를 입력하세요 (2글자 이상)', '가나다');
    if (!startWordRaw || startWordRaw.trim().length < 2) {
      setGameMessage('시작 단어는 2글자 이상이어야 합니다.');
      return;
    }
    const startWord = startWordRaw.trim();
    const isValid = await isValidWord(startWord);
    if (!isValid) {
      setGameMessage(`"${startWord}" 은(는) 사전에 없는 단어입니다. 다른 단어를 선택하세요.`);
      return;
    }
    if (!gameChannel.current || !gameChannelReady.current) {
      setGameMessage('게임 채널이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    gameChannel.current.send({
      type: 'broadcast',
      event: 'game_start',
      payload: { starter: displayName, startWord }
    });
  };

  const joinGame = () => {
    if (!gameActive) {
      setGameMessage('먼저 게임을 시작해주세요. (게임시작 버튼 또는 /끝말잇기 시작)');
      return;
    }
    if (players.includes(displayName)) {
      setGameMessage('이미 참가 중입니다.');
      return;
    }
    if (!gameChannel.current || !gameChannelReady.current) return;
    gameChannel.current.send({
      type: 'broadcast',
      event: 'game_join',
      payload: { player: displayName }
    });
  };

  const leaveGame = () => {
    if (!gameActive) return;
    if (!gameChannel.current || !gameChannelReady.current) return;
    gameChannel.current.send({
      type: 'broadcast',
      event: 'game_leave',
      payload: { player: displayName }
    });
  };

  const endGame = () => {
    if (!gameActive) return;
    if (!gameChannel.current || !gameChannelReady.current) return;
    gameChannel.current.send({
      type: 'broadcast',
      event: 'game_end',
      payload: { reason: `${displayName}님이 게임을 종료했습니다.` }
    });
  };

  const submitWord = async (word: string) => {
    if (!gameActive) {
      setGameMessage('현재 활성화된 게임이 없습니다.');
      return false;
    }
    if (currentPlayer !== displayName) {
      setGameMessage(`지금은 ${currentPlayer}님의 차례입니다.`);
      return false;
    }
    if (usedWords.has(word)) {
      if (!gameChannel.current) return false;
      gameChannel.current.send({
        type: 'broadcast',
        event: 'game_word',
        payload: { player: displayName, word, success: false, reason: '이미 사용된 단어입니다.' }
      });
      return false;
    }
    if (!isValidWordChain(word, currentWord)) {
      if (!gameChannel.current) return false;
      gameChannel.current.send({
        type: 'broadcast',
        event: 'game_word',
        payload: { player: displayName, word, success: false, reason: `'${currentWord}'의 끝 글자와 맞지 않습니다.` }
      });
      return false;
    }
    // 사전 검증
    const isValid = await isValidWord(word);
    if (!isValid) {
      if (!gameChannel.current) return false;
      gameChannel.current.send({
        type: 'broadcast',
        event: 'game_word',
        payload: { player: displayName, word, success: false, reason: '사전에 없는 단어입니다.' }
      });
      return false;
    }
    // 성공
    if (!gameChannel.current) return false;
    gameChannel.current.send({
      type: 'broadcast',
      event: 'game_word',
      payload: { player: displayName, word, success: true }
    });
    return true;
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || isSending) {
      chatInputRef.current?.focus();
      return;
    }

    try {
      // 명령어 처리 (게임 모드와 무관하게 우선 처리)
      if (trimmed === '/끝말잇기 시작') {
        await startGame();
        setNewMessage('');
        return;
      }

      if (gameActive) {
        if (trimmed === '/끝말잇기 참여') {
          joinGame();
          setNewMessage('');
          return;
        } else if (trimmed === '/끝말잇기 나가기') {
          leaveGame();
          setNewMessage('');
          return;
        } else if (trimmed === '/끝말잇기 종료') {
          endGame();
          setNewMessage('');
          return;
        } else {
          await submitWord(trimmed);
          setNewMessage('');
          return;
        }
      }

      // 일반 채팅 (게임 미활성 시)
      if (containsBadWord(trimmed)) {
        setFilterWarning('⚠️ 부적절한 표현이 포함되어 있습니다.');
        return;
      }

      setIsSending(true);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);
      const { error } = await supabase.from('lobby_messages').insert({
        content: trimmed,
        author_name: displayName,
        expires_at: expiresAt.toISOString(),
      });
      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('로비 메시지 전송 실패:', err);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => chatInputRef.current?.focus());
      if (textareaRef.current) {
  textareaRef.current.style.height = 'auto';
}
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (filterWarning) {
      const timer = setTimeout(() => setFilterWarning(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [filterWarning]);

  return (
    <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
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
        <div className="flex items-center gap-2">
          <button
            onClick={startGame}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
              gameActive ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed' : 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30'
            }`}
            disabled={gameActive}
            title="끝말잇기 게임 시작"
          >
            <RiGamepadLine className="w-3 h-3" /> 게임시작
          </button>
          {gameActive && (
            <>
              <button
                onClick={joinGame}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/30 transition-colors"
                title="게임 참가"
              >
                <RiUserAddLine className="w-3 h-3" /> 참가
              </button>
              <button
                onClick={leaveGame}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-colors"
                title="게임 나가기"
              >
                <RiLogoutCircleLine className="w-3 h-3" /> 나가기
              </button>
              <button
                onClick={endGame}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-orange-600/20 text-orange-300 border border-orange-500/30 hover:bg-orange-600/30 transition-colors"
                title="게임 종료"
              >
                <RiCloseLine className="w-3 h-3" /> 종료
              </button>
            </>
          )}
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
            <span className="text-cyan-300 font-mono">{displayName}</span>
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

      {gameActive && (
        <div className="bg-purple-900/30 border-b border-purple-800/50 p-2 text-center text-sm">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="text-purple-200">🎮 끝말잇기 중</span>
            <span className="text-cyan-300 font-mono">현재 단어: <strong>{currentWord || '?'}</strong></span>
            <span className="text-yellow-200">🎤 차례: {currentPlayer}</span>
            <span className="text-gray-400">👥 {players.length}명 참여</span>
          </div>
          {gameMessage && (
            <div className="text-xs text-gray-300 mt-1 animate-pulse">{gameMessage}</div>
          )}
        </div>
      )}

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
          <textarea
  ref={(el) => {
    textareaRef.current = el;
    (chatInputRef as any).current = el;
  }}
  value={newMessage}
  onChange={(e) => setNewMessage(e.target.value)}
  onInput={(e) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  }}
  rows={1}
  placeholder={
    gameActive
      ? `끝말잇기: '${currentWord}'의 끝 글자로 시작하는 단어를 입력하세요`
      : "익명으로 메시지 보내기..."
  }
  className="flex-1 resize-none overflow-hidden bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all text-white placeholder-gray-500"
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
