"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCloseLine } from "react-icons/ri";

interface Notice {
  id: string;
  content: string;
  is_pinned?: boolean;
  expires_at?: string;
  created_at: string;
}

interface NoticeModalProps {
  notices: Notice[];
  lang: "ko" | "en";
  isAdmin?: boolean;
  onDeleteNotice?: (id: string) => void;
}

export default function NoticeModal({
  notices,
  lang,
  isAdmin = false,
  onDeleteNotice,
}: NoticeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isKo = lang === "ko";

  const currentNotice = notices && notices.length > 0 ? notices[0] : null;

  useEffect(() => {
    if (currentNotice) {
      const noticeId = currentNotice.id;
      
      // 1. 다시 보지 않기 여부 체크
      const isPermanentlyHidden = localStorage.getItem(`notice_hide_permanently_${noticeId}`) === "true";
      
      // 2. 오늘 하루 보지 않기 여부 체크
      const hideTodayExpiry = localStorage.getItem(`notice_hide_today_${noticeId}`);
      const isTodayHidden = hideTodayExpiry && new Date(hideTodayExpiry) > new Date();

      if (!isPermanentlyHidden && !isTodayHidden) {
        setIsOpen(true);
      }
    }
  }, [currentNotice]);

  if (!currentNotice) return null;

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleHideToday = () => {
    const noticeId = currentNotice.id;
    const expiry = new Date();
    // 오늘 밤 23:59:59.999 까지 보존
    expiry.setHours(23, 59, 59, 999);
    localStorage.setItem(`notice_hide_today_${noticeId}`, expiry.toISOString());
    setIsOpen(false);
  };

  const handleHidePermanently = () => {
    const noticeId = currentNotice.id;
    localStorage.setItem(`notice_hide_permanently_${noticeId}`, "true");
    setIsOpen(false);
  };

  const getExpiryLabel = (expiresAtStr?: string) => {
    if (!expiresAtStr) return isKo ? "무기한 고지" : "Indefinite notice";
    const expDate = new Date(expiresAtStr);
    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffHours <= 0) return isKo ? "만료됨" : "Expired";
    if (diffHours < 24) return isKo ? `${diffHours}시간 후 만료` : `Expires in ${diffHours}h`;
    const diffDays = Math.ceil(diffHours / 24);
    return isKo ? `${diffDays}일 후 만료` : `Expires in ${diffDays}d`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          {/* 뒷배경 페이드 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={handleClose}
          />

          {/* 모달 팝업 바디 */}
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="relative max-w-lg w-full bg-gradient-to-br from-[#1a1410] via-[#0f0c0a] to-black rounded-3xl p-[2px] shadow-2xl shadow-amber-500/10 text-gray-300"
          >
            {/* 내부 카드 */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#1f1a16] to-black p-6 md:p-8 flex flex-col gap-5 overflow-hidden">
              {/* 상단 장식 라이트 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

              {/* 상단 헤더 */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
                    {currentNotice.is_pinned ? "📌" : "📢"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold leading-tight tracking-tight">
                      <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                        {currentNotice.is_pinned
                          ? isKo ? "중요 공지사항" : "Important Notice"
                          : isKo ? "새로운 알림" : "New Notice"}
                      </span>
                    </h2>
                    <p className="text-[11px] text-amber-500/60 font-medium tracking-wider">
                      {new Date(currentNotice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
                >
                  <RiCloseLine className="text-2xl" />
                </button>
              </div>

              {/* 본문 콘텐츠 */}
              <div className="py-1 relative">
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-500/50 to-transparent rounded-full" />
                <p className="pl-4 text-[15px] text-gray-200 leading-relaxed font-light tracking-wide whitespace-pre-wrap">
                  {currentNotice.content}
                </p>
                {!currentNotice.is_pinned && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      {getExpiryLabel(currentNotice.expires_at)}
                    </span>
                  </div>
                )}
              </div>

              {/* 하단 제어 & 닫기 옵션 */}
              <div className="flex flex-col gap-4 mt-2 pt-4 border-t border-white/5">
                {/* 그만보기 체크 제어줄 */}
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <button
                    onClick={handleHideToday}
                    className="hover:text-amber-400 transition-colors flex items-center gap-1 focus:outline-none"
                  >
                    <span>🔲 {isKo ? "오늘 하루 보지 않기" : "Do not show today"}</span>
                  </button>
                  <button
                    onClick={handleHidePermanently}
                    className="hover:text-amber-400 transition-colors flex items-center gap-1 focus:outline-none"
                  >
                    <span>🚫 {isKo ? "다시 보지 않기" : "Do not show again"}</span>
                  </button>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center justify-end gap-2">
                  {isAdmin && onDeleteNotice && (
                    <button
                      onClick={() => {
                        onDeleteNotice(currentNotice.id);
                        handleClose();
                      }}
                      className="group px-3.5 py-2.5 rounded-xl bg-red-950/30 border border-red-900/30 text-red-400 hover:bg-red-900/40 hover:border-red-700/50 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5"
                    >
                      <span className="group-hover:scale-110 transition-transform">🗑️</span>
                      {isKo ? "삭제" : "Delete"}
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl text-black font-bold text-xs shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] tracking-wide"
                  >
                    {isKo ? "닫기" : "Close"}
                  </button>
                </div>
              </div>
            </div>

            {/* 하단 글로우 장식 */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
