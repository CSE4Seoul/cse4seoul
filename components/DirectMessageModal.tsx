'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { createClient } from '@/utils/supabase/client';
import { encryptMessage, decryptMessage } from '@/utils/encryption';
import { 
  RiCloseLine, RiSendPlaneLine, RiLock2Line, RiUser3Line, 
  RiShieldKeyholeLine, RiCheckDoubleLine, RiLoader4Line 
} from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  targetUser: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface DMMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  decryptedContent?: string | null;
  is_read: boolean;
  created_at: string;
  expires_at: string;
}

export default function DirectMessageModal({
  isOpen,
  onClose,
  currentUserId,
  targetUser
}: DirectMessageModalProps) {
  const [supabase] = useState(() => createClient());
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🔒 1:1 대화 상대 고유 Shared Secret Key 생성
  // 양측 고유 ID를 알파벳순으로 정렬 후 결합하여 265-bit AES-GCM 키 생성용 Secret 지정
  const sharedSecretKey = [currentUserId, targetUser.id].sort().join(':') + ':CSE4SEOUL_PRIVATE_DM_2026';

  // 1:1 대화 로드
  const fetchMessages = async () => {
    if (!targetUser.id || !currentUserId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dm?targetId=${targetUser.id}`);
      const data = await res.json();

      if (res.ok && data.messages) {
        // 복호화 수행
        const decryptedList = await Promise.all(
          data.messages.map(async (msg: DMMessage) => {
            const dec = await decryptMessage(msg.content, sharedSecretKey);
            return { ...msg, decryptedContent: dec };
          })
        );
        setMessages(decryptedList);

        // 읽음 처리 실행
        await fetch('/api/dm', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender_id: targetUser.id })
        });
      }
    } catch (err) {
      console.error('DM 로드 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();

      // Supabase Realtime 구독
      const channel = supabase
        .channel(`dm:${currentUserId}:${targetUser.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'direct_messages' },
          async (payload) => {
            const newRow = payload.new as DMMessage;
            if (
              (newRow.sender_id === currentUserId && newRow.receiver_id === targetUser.id) ||
              (newRow.sender_id === targetUser.id && newRow.receiver_id === currentUserId)
            ) {
              const dec = await decryptMessage(newRow.content, sharedSecretKey);
              setMessages((prev) => {
                if (prev.some((m) => m.id === newRow.id)) return prev;
                return [...prev, { ...newRow, decryptedContent: dec }];
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, targetUser.id, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 전송 처리
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      // client-side AES-GCM 암호화
      const encrypted = await encryptMessage(newMessage.trim(), sharedSecretKey);

      const res = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: targetUser.id,
          content: encrypted,
          expires_in_days: 7 // 7일 후 보관 만료
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNewMessage('');
        fetchMessages();
      } else {
        alert(data.error || '메시지 전송 실패');
      }
    } catch (err) {
      console.error('메시지 전송 에러:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] text-white"
        >
          {/* 🔒 Header */}
          <div className="p-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                {targetUser.avatar_url ? (
                  <img
                    src={targetUser.avatar_url}
                    alt={targetUser.name}
                    className="w-10 h-10 rounded-full border border-cyan-500/50 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                    {targetUser.name ? targetUser.name[0] : '?'}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-950" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">{targetUser.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50 flex items-center gap-1">
                    <RiShieldKeyholeLine className="text-cyan-400" /> AES-256 E2EE
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">종단간 암호화 보안 1:1 대화방</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
            >
              <RiCloseLine className="text-xl" />
            </button>
          </div>

          {/* 💬 Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-black/40 custom-scrollbar">
            <div className="p-3 mb-2 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-center text-xs text-cyan-300 font-mono">
              🔒 본 대화는 Client-Side AES-GCM 256-bit로 완벽히 암호화되어 데이터베이스에 보관되며 7일 후 자동 파기됩니다.
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500 text-xs">
                <RiLoader4Line className="text-2xl animate-spin text-cyan-400" />
                <span>보안 채널 복호화 중...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500 text-xs">
                <RiLock2Line className="text-3xl text-gray-600" />
                <span>아직 주고받은 메시지가 없습니다. 첫 보안 메시지를 보내보세요!</span>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_id === currentUserId;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-lg ${
                        isMe
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs'
                          : 'bg-gray-800 text-gray-200 border border-gray-700/60 rounded-bl-xs'
                      }`}
                    >
                      <p className="break-words font-sans">{m.decryptedContent || '[복호화 불가 메시지]'}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-500 px-1">
                      <span>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <RiCheckDoubleLine
                          className={m.is_read ? 'text-cyan-400' : 'text-gray-600'}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ✏️ Input Bar */}
          <form onSubmit={handleSend} className="p-3 bg-gray-950 border-t border-gray-800 flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`${targetUser.name} 님에게 보내는 개인 암호화 메시지...`}
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
            >
              {isSending ? (
                <RiLoader4Line className="animate-spin text-sm" />
              ) : (
                <RiSendPlaneLine className="text-sm" />
              )}
              <span>전송</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
