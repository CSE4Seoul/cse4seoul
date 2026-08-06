'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiQuestionAnswerLine, RiCheckLine, RiEyeOffLine, RiDeleteBin6Line, RiLoader4Line } from 'react-icons/ri';

interface QnaItem {
  id: string;
  content: string;
  reply: string | null;
  status: 'PENDING' | 'POSTED' | 'HOLD';
  author_name: string;
  created_at: string;
  created_by: string | null;
  is_private?: boolean;
}

interface QAWidgetProps {
  user: any; // Supabase user profile
  profile: any; // Profile table record
  lang: 'ko' | 'en';
}

const widgetI18n = {
  ko: {
    userTitle: "💬 Q&A 문의 및 건의사항",
    adminTitle: "📥 Q&A 관리자 제어판 (최고관리자)",
    placeholder: "질문이나 건의사항을 여기에 입력해주세요...",
    authorPlaceholder: "닉네임 (미입력 시 익명)",
    submitBtn: "질문 제출",
    statusPosted: "게시됨",
    statusPending: "대기 중",
    statusHold: "보류됨",
    qTitle: "Q",
    aTitle: "A",
    replyPlaceholder: "답변 내용을 입력하세요...",
    replyPostBtn: "답변 & 게시하기",
    holdBtn: "보류하기",
    approveBtn: "답변 없이 바로 게시",
    deleteBtn: "삭제",
    noQuestions: "아직 등록된 질문이 없습니다. 첫 질문을 남겨보세요!",
    loading: "보안 통신망 연결 중...",
    submitSuccess: "질문이 전송되었습니다! 관리자 검토 및 답변 완료 후 게시됩니다.",
    deleteConfirm: "이 질문을 영구 삭제하시겠습니까?",
    privateLabel: "🔒 1대1 개인 비밀 문의 (작성자와 관리자만 확인 가능)",
    privateBadge: "🔒 비밀 문의"
  },
  en: {
    userTitle: "💬 Q&A & Suggestions",
    adminTitle: "📥 Q&A Admin Dashboard (Super Admin)",
    placeholder: "Type your question or suggestion here...",
    authorPlaceholder: "Name (Optional)",
    submitBtn: "Submit Question",
    statusPosted: "Posted",
    statusPending: "Pending",
    statusHold: "On Hold",
    qTitle: "Q",
    aTitle: "A",
    replyPlaceholder: "Type admin reply here...",
    replyPostBtn: "Reply & Post",
    holdBtn: "Hold",
    approveBtn: "Post Without Reply",
    deleteBtn: "Delete",
    noQuestions: "No questions submitted yet. Be the first to ask!",
    loading: "Establishing secure link...",
    submitSuccess: "Submitted! It will be visible once reviewed and answered by admin.",
    deleteConfirm: "Are you sure you want to delete this question permanently?",
    privateLabel: "🔒 1:1 Private Inquiry (Visible only to you and admin)",
    privateBadge: "🔒 Private Inquiry"
  }
};

export default function QAWidget({ user, profile, lang }: QAWidgetProps) {
  const [qnas, setQnas] = useState<QnaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');

  const t = widgetI18n[lang];
  const isAdmin = profile?.role === 'admin';

  // Q&A 리스트 로드
  const fetchQnas = async () => {
    try {
      const res = await fetch('/api/qna');
      const data = await res.json();
      if (res.ok && data.qnas) {
        setQnas(data.qnas);
      }
    } catch (error) {
      console.error('Q&A 로딩 에러:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQnas();
  }, [user, profile]);

  // [유저] 질문 작성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/qna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newQuestion,
          author_name: authorName.trim() || undefined,
          is_private: isPrivate,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(t.submitSuccess);
        setNewQuestion('');
        setAuthorName('');
        setIsPrivate(false);
        fetchQnas();
      } else {
        alert(data.error || 'API Error');
      }
    } catch (error) {
      console.error('질문 제출 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // [관리자] 답변 작성 및 게시
  const handleReplyAndPost = async (id: string) => {
    const replyText = replyInputs[id]?.trim() || '';
    if (!replyText) return;

    try {
      const res = await fetch('/api/qna', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          reply: replyText,
          status: 'POSTED',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReplyInputs(prev => ({ ...prev, [id]: '' }));
        fetchQnas();
      } else {
        alert(data.error || 'Failed to update Q&A');
      }
    } catch (error) {
      console.error('Q&A 답변 등록 실패:', error);
    }
  };

  // [관리자] 답변 없이 바로 게시 (승인)
  const handleApproveWithoutReply = async (id: string) => {
    try {
      const res = await fetch('/api/qna', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'POSTED',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchQnas();
      } else {
        alert(data.error || 'Failed to approve');
      }
    } catch (error) {
      console.error('Q&A 승인 실패:', error);
    }
  };

  // [관리자] 보류 상태로 변경
  const handleHold = async (id: string) => {
    try {
      const res = await fetch('/api/qna', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'HOLD',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchQnas();
      } else {
        alert(data.error || 'Failed to hold Q&A');
      }
    } catch (error) {
      console.error('Q&A 보류 변경 실패:', error);
    }
  };

  // [관리자] 삭제
  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      const res = await fetch(`/api/qna?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchQnas();
      } else {
        alert(data.error || 'Failed to delete Q&A');
      }
    } catch (error) {
      console.error('Q&A 삭제 실패:', error);
    }
  };

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-8 backdrop-blur-xl hover:border-white/[0.12] transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col gap-6 w-full relative z-10">
      
      {/* 💬 Header with Title and Tab Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-lg shadow-lg shadow-cyan-500/20">
            <RiQuestionAnswerLine className="text-xl" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {isAdmin && activeTab === 'admin' ? t.adminTitle : t.userTitle}
          </h2>
        </div>

        {isAdmin && (
          <div className="flex bg-white/5 p-1 rounded-full border border-white/[0.08] shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('user')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'user'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {lang === 'ko' ? '피드 보기' : 'Feed'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {lang === 'ko' ? '관리 콘솔' : 'Admin Console'}
            </button>
          </div>
        )}
      </div>

      {/* 📥 VIEW 1: 최고관리자(admin) 전용 제어 대시보드 뷰 */}
      {isAdmin && activeTab === 'admin' ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-gray-400">대기 중인 문의를 모니터링하고 답변을 게시하거나 보류/삭제합니다.</p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500 gap-2">
              <RiLoader4Line className="text-xl animate-spin text-cyan-500" />
              {t.loading}
            </div>
          ) : qnas.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 border border-white/5 rounded-2xl bg-black/10">
              {t.noQuestions}
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {qnas.map((q) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="border border-white/5 rounded-2xl bg-white/[0.01] p-4 flex flex-col gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-300 bg-white/5 px-2.5 py-1 rounded-full">
                          👤 {q.author_name}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(q.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* 상태 배지 */}
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        q.status === 'POSTED' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : q.status === 'HOLD'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {q.status === 'POSTED' ? t.statusPosted : q.status === 'HOLD' ? t.statusHold : t.statusPending}
                      </span>
                    </div>

                    <div className="text-sm text-gray-200 bg-black/20 p-3.5 rounded-xl leading-relaxed border border-white/5">
                      {q.content}
                    </div>

                    {q.reply && (
                      <div className="text-xs text-cyan-300 bg-cyan-950/10 border border-cyan-500/10 p-3 rounded-xl leading-relaxed">
                        <span className="font-bold">A:</span> {q.reply}
                      </div>
                    )}

                    {/* 답변 입력창 및 관리자 제어 버튼 */}
                    <div className="flex flex-col gap-2 mt-1">
                      <input
                        type="text"
                        placeholder={t.replyPlaceholder}
                        value={replyInputs[q.id] || ''}
                        onChange={(e) => setReplyInputs({ ...replyInputs, [q.id]: e.target.value })}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/30"
                      />
                      
                      <div className="flex gap-2 justify-end text-[10px]">
                        <button
                          onClick={() => handleReplyAndPost(q.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-1 shadow-md shadow-emerald-600/10"
                        >
                          <RiCheckLine className="text-xs" />
                          {t.replyPostBtn}
                        </button>
                        
                        {q.status !== 'POSTED' && (
                          <button
                            onClick={() => handleApproveWithoutReply(q.id)}
                            className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/40 rounded-lg font-semibold transition-all"
                          >
                            {t.approveBtn}
                          </button>
                        )}

                        {q.status !== 'HOLD' && (
                          <button
                            onClick={() => handleHold(q.id)}
                            className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 rounded-lg font-semibold transition-all flex items-center gap-1"
                          >
                            <RiEyeOffLine className="text-xs" />
                            {t.holdBtn}
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(q.id)}
                          className="px-3 py-1.5 bg-red-950/60 border border-red-900/30 text-red-400 hover:bg-red-900/40 rounded-lg font-semibold transition-all flex items-center gap-1"
                        >
                          <RiDeleteBin6Line className="text-xs" />
                          {t.deleteBtn}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      ) : (
        /* 💬 VIEW 2: 일반 유저 전용 질문 등록 및 게시글 피드 뷰 */
        <div className="flex flex-col gap-6">
          
          {/* 질문 작성 폼 */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder={t.authorPlaceholder}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="sm:w-1/3 bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 transition-all text-white placeholder-white/30"
              />
              <input
                type="text"
                placeholder={t.placeholder}
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                required
                className="flex-1 bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 transition-all text-white placeholder-white/30"
              />
            </div>
            
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500/40"
                />
                <span>{t.privateLabel}</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !newQuestion.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <RiLoader4Line className="text-sm animate-spin inline mr-1" />
                ) : null}
                {t.submitBtn}
              </button>
            </div>
          </form>

          {/* 게시판 영역 (게시됨(POSTED) 상태의 질문들 노출) */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-500 border-b border-white/5 pb-2 uppercase tracking-wider">
              💡 Answered Q&A
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-gray-500 gap-2">
                <RiLoader4Line className="text-lg animate-spin text-cyan-500" />
                {t.loading}
              </div>
            ) : qnas.filter(q => q.status === 'POSTED').length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500 font-light">
                {t.noQuestions}
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {qnas.filter(q => q.status === 'POSTED').map((q) => (
                  <div 
                    key={q.id} 
                    className="p-4 border border-white/[0.04] rounded-2xl bg-white/[0.01] hover:bg-white/[0.02] transition-colors flex flex-col gap-2.5"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-cyan-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        👤 {q.author_name}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(q.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-white/90 leading-relaxed pl-1">
                      <span className="text-cyan-400 font-black mr-1">{t.qTitle}</span> {q.content}
                    </p>

                    {q.reply && (
                      <div className="text-sm text-gray-300 pl-4 py-1.5 border-l-2 border-violet-500/50 bg-violet-950/10 rounded-r-xl">
                        <p className="leading-relaxed">
                          <span className="text-violet-400 font-black mr-1">{t.aTitle}</span> {q.reply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
