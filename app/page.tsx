'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  RiChat3Line, 
  RiFileList3Line, 
  RiGroupLine, 
  RiLock2Line,
  RiFlashlightLine,
  RiInformationLine,
  RiCloseLine
} from 'react-icons/ri';
import LobbyChatWidget from '@/components/LobbyChatWidget';
import ExchangeRateWidget from '@/components/ExchangeRateWidget';
import QAWidget from '@/components/QAWidget';

// DB에서 가져올 게시글 타입 정의
interface Post {
  id: string | number;
  title: string;
  author_name: string;
  created_at: string;
}

// 다국어 번역 딕셔너리
const contentData = {
  ko: {
    heroTag: "CSE4Seoul 커뮤니티",
    heroTitleLine1: "함께 만들고, 함께 성장하는",
    heroTitleLine2: "우리들의 공간",
    heroDesc: "Computer Science && Engineering for Seoul (CSE4Seoul) 커뮤니티는 클래시로얄 클랜을 기반으로 한 개발자 & 게이머 그룹입니다.",
    systemBtn: "시스템 접속하기",
    infoBtn: "자세한 기능 소개",
    featuresTitle: "✨ CSE4Seoul 주요 기능",
    featureChatTitle: "자유로운 채팅방",
    featureChatDesc: "클랜원들과의 자유롭고 빠른 실시간 소통을 지원합니다. 일상 수다부터 전략 교류까지 자유롭게 참여하세요.",
    featureBoardTitle: "활발한 내전 및 교류",
    featureBoardDesc: "정기적인 클랜 친목 내전 매치와 다양한 토너먼트를 개최하여 클랜원 간 활발한 전략 게임 교류를 진행합니다.",
    featureNetworkTitle: "클랜원 네트워크",
    featureNetworkDesc: "현재 활발하게 활동 중인 정예 클랜원들과 연결되어 클래시 로얄을 함께 플레이할 든든한 동료를 찾을 수 있습니다.",
    recentPostsTitle: "📢 최근 게시글",
    recentPostsMore: "더 보기 →",
    recentPostsLoading: "통신망 스캔 중...",
    recentPostsEmpty: "아직 등록된 게시글이 없습니다.",
    securityTitle: "보안을 최우선으로",
    securityDesc: "로비 채팅을 제외한 채팅은 암호화되어 저장되며, 24시간 후 자동 삭제되어 익명성이 완벽하게 보장됩니다.",
    modalTitle: "✨ CSE4Seoul 주요 기능",
    modalChatTitle: "암호화 채팅",
    modalChatBullet1: "AES-256 암호화로 로그인 한 유저들의 내부 채팅 메시지를 보호합니다.",
    modalChatBullet2: "24시간 후 자동 삭제되어 보안성을 높입니다.",
    modalLobbyTitle: "익명 로비 채팅",
    modalLobbyBullet1: "로그인 없이 참여 가능한 공개 채팅 공간입니다.",
    modalCloseBtn: "닫기",
    noticeBadgePinned: "📌 고정",
    noticeBadgeTemp: "📢 공지",
    adminPanelTitle: "🛠️ 최고관리자 공지 제어판",
    adminPanelDesc: "메인 화면 상단의 공지사항을 등록/수정/삭제합니다.",
    adminInputPlaceholder: "메인 페이지 상단에 노출할 공지 내용을 입력하세요.",
    adminPinCheck: "📌 상단에 영구 고정",
    adminPeriodLabel: "노출 기간:",
    adminPeriod1h: "1시간",
    adminPeriod6h: "6시간",
    adminPeriod12h: "12시간",
    adminPeriod24h: "24시간 (1일)",
    adminPeriod72h: "72시간 (3일)",
    adminSubmitBtn: "공지사항 게시하기",
    adminSubmitting: "게시 중...",
    adminListTitle: "현재 게시 중인 공지 목록",
    deleteBtn: "삭제",
    deleteConfirm: "이 공지사항을 삭제하시겠습니까?",
    deleteSuccess: "공지사항이 삭제되었습니다.",
    createSuccess: "공지사항이 등록되었습니다! 🎉",
    expiredLabel: "만료됨",
    expiresInH: "시간 후 만료",
    expiresInM: "분 후 만료",
    expiresInH_en: "h left",
    expiresInM_en: "m left",
    hourUnit: "시간",
    minUnit: "분"
  },
  en: {
    heroTag: "CSE4Seoul Community",
    heroTitleLine1: "Co-creating and Growing Together",
    heroTitleLine2: "Our Space",
    heroDesc: "The Computer Science && Engineering for Seoul (CSE4Seoul) community is a developer & gamer group based on a Clash Royale clan.",
    systemBtn: "Access System",
    infoBtn: "Detailed Features",
    featuresTitle: "✨ Key Features of CSE4Seoul",
    featureChatTitle: "Free Chat Room",
    featureChatDesc: "Supports free and fast real-time communication with clan members. Feel free to join from daily chats to strategy talk.",
    featureBoardTitle: "Active Friendly Matches",
    featureBoardDesc: "We host regular clan friendly matches and various tournaments to promote active strategic game exchanges among members.",
    featureNetworkTitle: "Clan Member Network",
    featureNetworkDesc: "Connect with active elite clan members to find reliable teammates to play Clash Royale together.",
    recentPostsTitle: "📢 Recent Posts",
    recentPostsMore: "More →",
    recentPostsLoading: "Scanning communication network...",
    recentPostsEmpty: "No posts have been registered yet.",
    securityTitle: "Security First",
    securityDesc: "All chats except lobby chats are encrypted and stored, then automatically deleted after 24 hours to ensure complete anonymity.",
    modalTitle: "✨ CSE4Seoul Main Features",
    modalChatTitle: "Encrypted Chat",
    modalChatBullet1: "Protects messages with AES-256 encryption.",
    modalChatBullet2: "Automatically deleted after 24 hours to enhance security.",
    modalLobbyTitle: "Anonymous Lobby Chat",
    modalLobbyBullet1: "A public chat space accessible without logging in.",
    modalCloseBtn: "Close",
    noticeBadgePinned: "📌 Pinned",
    noticeBadgeTemp: "📢 Notice",
    adminPanelTitle: "🛠️ Super Admin Notice Panel",
    adminPanelDesc: "Register, modify, or delete notices on the main screen.",
    adminInputPlaceholder: "Enter the notice content to display on the main page.",
    adminPinCheck: "📌 Permanently pin on top",
    adminPeriodLabel: "Duration:",
    adminPeriod1h: "1 hour",
    adminPeriod6h: "6 hours",
    adminPeriod12h: "12 hours",
    adminPeriod24h: "24 hours (1 day)",
    adminPeriod72h: "72 hours (3 days)",
    adminSubmitBtn: "Publish Notice",
    adminSubmitting: "Publishing...",
    adminListTitle: "Currently Active Notices",
    deleteBtn: "Delete",
    deleteConfirm: "Are you sure you want to delete this notice?",
    deleteSuccess: "Notice deleted successfully.",
    createSuccess: "Notice published successfully! 🎉",
    expiredLabel: "Expired",
    expiresInH: "hours left",
    expiresInM: "minutes left",
    expiresInH_en: "h left",
    expiresInM_en: "m left",
    hourUnit: "h",
    minUnit: "m"
  }
};

export default function Home() {
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // 권한 및 다국어, 공지사항을 위한 추가 상태
  const [profile, setProfile] = useState<any | null>(null);
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [notices, setNotices] = useState<any[]>([]);
  const [isNoticeLoading, setIsNoticeLoading] = useState(true);
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false); // 공지사항 팝업 모달 상태

  const supabase = createClient();
  const t = contentData[lang];

  // 사용자 및 추가 프로필 정보 불러오기
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (prof) {
          setProfile(prof);
        }
      }
    };
    fetchUserAndProfile();
  }, [supabase]);

  // 공지사항 불러오기
  const fetchNotices = async () => {
    setIsNoticeLoading(true);
    try {
      const res = await fetch('/api/notice');
      const data = await res.json();
      if (data.notices) {
        setNotices(data.notices);
        // 활성화된 공지가 존재할 때만 최초 진입 팝업 오픈
        if (data.notices.length > 0) {
          setIsNoticeModalOpen(true);
        }
      }
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
    } finally {
      setIsNoticeLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // 공지 작성
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeContent.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNoticeContent,
          is_pinned: isPinned,
          expires_in_hours: isPinned ? undefined : expiresInHours,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(t.createSuccess);
        setNewNoticeContent('');
        setIsPinned(false);
        setExpiresInHours(24);
        fetchNotices();
        // 새 공지 등록 완료 시 즉시 팝업으로 노출
        setIsNoticeModalOpen(true);
      } else {
        alert(data.error || 'Failed');
      }
    } catch (error) {
      console.error('공지사항 생성 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 공지 삭제
  const handleDeleteNotice = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/notice?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(t.deleteSuccess);
        fetchNotices();
      } else {
        alert(data.error || 'Failed');
      }
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
    }
  };

  // 공지사항 남은 만료 시간 계산 라벨
  const getNoticeExpiryLabel = (expiresAtStr: string) => {
    const expiresAt = new Date(expiresAtStr);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    if (diffMs <= 0) return t.expiredLabel;
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours >= 1) {
      return lang === 'ko' 
        ? `${diffHours}${t.expiresInH}` 
        : `${diffHours}${t.hourUnit} left`;
    }
    return lang === 'ko' 
      ? `${diffMins}${t.expiresInM}` 
      : `${diffMins}${t.minUnit} left`;
  };

  // 시간 표시 함수
  const timeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (lang === 'ko') {
      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      if (diffDays === 1) return '어제';
      return `${diffDays}일 전`;
    } else {
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    }
  };

  // 최신 게시글 불러오기
  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, author_name, created_at')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        if (data) setRecentPosts(data);
      } catch (error) {
        console.error('최신 게시글 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentPosts();
  }, [supabase]);

  const closeModal = () => setIsModalOpen(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-black text-white">
      {/* 배경 그라디언트 & 그리드 */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.15),transparent_70%)]" />
      <div className="pointer-events-none absolute left-[15%] top-[10%] z-0 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.02] blur-[120px]" />
      <div className="pointer-events-none absolute right-[15%] top-[30%] z-0 h-[600px] w-[600px] rounded-full bg-violet-500/[0.02] blur-[150px]" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:40px_40px]" />

      {/* 1. Sleek Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-black/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <RiGroupLine className="text-lg text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-wider">CSE4Seoul</span>
          </div>
          
          <div className="flex items-center gap-4">
            <p className="hidden md:inline-block text-xs text-gray-400">
              {user 
                ? (lang === 'ko' ? `${user.email} 님 환영합니다` : `Welcome, ${user.email}`) 
                : (lang === 'ko' ? '현재 비로그인 상태입니다' : 'Not logged in')}
            </p>
            
            <div className="flex items-center gap-2.5">
              {/* 다국어 변환 토글 */}
              <button
                onClick={() => setLang(l => l === 'ko' ? 'en' : 'ko')}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/[0.08] text-xs font-semibold hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-white/70 flex items-center gap-1 shadow-sm"
              >
                🌐 {lang === 'ko' ? 'EN' : 'KO'}
              </button>

              {user ? (
                <button
                  onClick={handleSignOut}
                  className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/[0.08] text-xs font-medium text-white/80 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  {lang === 'ko' ? '로그아웃' : 'Logout'}
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-1.5 rounded-full bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/20"
                  >
                    {lang === 'ko' ? '로그인' : 'Login'}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="z-10 w-full max-w-7xl px-4 py-12 md:py-16 flex flex-col gap-16 md:gap-24">
        
        {/* 히어로 섹션 */}
        <div className="text-center mt-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {t.heroTag}
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tighter md:text-7xl lg:text-8xl bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent leading-[1.1] md:leading-[1.05]">
            {t.heroTitleLine1}
            <br />
            <span className="inline-block mt-2 bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">{t.heroTitleLine2}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm md:text-base text-white/60 leading-relaxed font-light">
            {t.heroDesc}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="rounded-full bg-white px-8 py-3.5 font-semibold text-black transition-all hover:bg-white/90 hover:scale-[1.02] shadow-[0_4px_20px_rgba(255,255,255,0.25)] hover:shadow-[0_4px_30px_rgba(255,255,255,0.4)] flex items-center justify-center text-sm md:text-base"
            >
              {t.systemBtn}
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-full border border-white/10 bg-transparent px-6 py-3.5 font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/5 hover:text-white hover:border-white/20 hover:scale-[1.02] flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <RiInformationLine className="text-xl" />
              {t.infoBtn}
            </button>
          </div>
        </div>

        {/* 기능 카드 섹션 */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="group rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-xl hover:bg-white/[0.04] hover:border-cyan-500/20 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/5">
              <RiChat3Line className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">{t.featureChatTitle}</h3>
            <p className="mt-3 text-sm text-white/50 leading-relaxed font-light">
              {t.featureChatDesc}
            </p>
          </div>
          <div className="group rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-xl hover:bg-white/[0.04] hover:border-violet-500/20 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/5">
              <RiFileList3Line className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">{t.featureBoardTitle}</h3>
            <p className="mt-3 text-sm text-white/50 leading-relaxed font-light">
              {t.featureBoardDesc}
            </p>
          </div>
          <div className="group rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-xl hover:bg-white/[0.04] hover:border-pink-500/20 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/5">
              <RiGroupLine className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">{t.featureNetworkTitle}</h3>
            <p className="mt-3 text-sm text-white/50 leading-relaxed font-light">
              {t.featureNetworkDesc}
            </p>
          </div>
        </div>

        {/* 인터랙티브 포털 레이아웃 (2단 그리드) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* 메인 콘텐츠 영역 (로비 채팅 & Q&A) - 12칸 중 8칸 차지 */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* 최고관리자 공지사항 관리 위젯 (어드민 전용) */}
            {profile?.role === 'admin' && (
              <div className="w-full">
                <div className="rounded-3xl border border-red-500/10 bg-red-950/[0.02] p-6 md:p-8 backdrop-blur-xl hover:border-red-500/20 transition-all duration-500 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                      <span className="text-white text-lg">🛠️</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{t.adminPanelTitle}</h3>
                      <p className="text-xs text-gray-400">{t.adminPanelDesc}</p>
                    </div>
                  </div>

                  <form onSubmit={handleCreateNotice} className="flex flex-col gap-4">
                    <textarea
                      className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500/50 resize-none placeholder-gray-500"
                      placeholder={t.adminInputPlaceholder}
                      value={newNoticeContent}
                      onChange={(e) => setNewNoticeContent(e.target.value)}
                    />
                    
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                          <input
                            type="checkbox"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                            className="rounded border-white/20 bg-black text-red-600 focus:ring-0 focus:ring-offset-0"
                          />
                          {t.adminPinCheck}
                        </label>

                        {!isPinned && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{t.adminPeriodLabel}</span>
                            <select
                              value={expiresInHours}
                              onChange={(e) => setExpiresInHours(Number(e.target.value))}
                              className="bg-black border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500/50 cursor-pointer"
                            >
                              <option value={1}>{t.adminPeriod1h}</option>
                              <option value={6}>{t.adminPeriod6h}</option>
                              <option value={12}>{t.adminPeriod12h}</option>
                              <option value={24}>{t.adminPeriod24h}</option>
                              <option value={72}>{t.adminPeriod72h}</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || !newNoticeContent.trim()}
                        className="px-5 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 rounded-xl text-white text-xs font-bold transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                      >
                        {isSubmitting ? t.adminSubmitting : t.adminSubmitBtn}
                      </button>
                    </div>
                  </form>

                  {/* 게재 목록 */}
                  {notices.length > 0 && (
                    <div className="mt-5 border-t border-white/10 pt-4">
                      <h4 className="text-xs font-bold text-gray-400 mb-2">{t.adminListTitle}</h4>
                      <div className="space-y-2">
                        {notices.map((n) => (
                          <div key={n.id} className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/5 text-xs">
                            <div className="flex items-center gap-2 text-gray-300 max-w-[80%]">
                              <span>{n.is_pinned ? '📌' : '⏰'}</span>
                              <span className="truncate">{n.content}</span>
                              {!n.is_pinned && (
                                <span className="text-[10px] text-amber-500 font-medium whitespace-nowrap">
                                  ({getNoticeExpiryLabel(n.expires_at)})
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteNotice(n.id)}
                              className="px-2 py-0.5 bg-red-950/60 border border-red-900/40 text-red-400 hover:bg-red-900/40 rounded text-[11px] font-bold transition-all"
                            >
                              {t.deleteBtn}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🔥 로비 채팅 위젯 */}
            <div className="w-full">
              <LobbyChatWidget />
            </div>

            {/* 💬 Q&A & Suggestions 위젯 */}
            <div className="w-full">
              <QAWidget user={user} profile={profile} lang={lang} />
            </div>
          </div>

          {/* 사이드바 영역 (시세, 최근 글, 보안 배너) - 12칸 중 4칸 차지 */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            
            {/* 👑 Clash Royale Clan Widget */}
            <div className="group relative rounded-3xl border border-amber-500/10 bg-amber-950/[0.02] p-6 backdrop-blur-xl hover:border-amber-500/25 transition-all duration-500 shadow-2xl overflow-hidden flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white text-lg shadow-lg shadow-amber-500/20">
                  👑
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {lang === 'ko' ? '클래시 로얄 클랜 정보' : 'Clash Royale Clan'}
                  </h3>
                  <p className="text-[10px] text-amber-500/80 font-mono font-bold">#RRG9U0C9</p>
                </div>
              </div>
              
              <p className="text-xs text-white/50 leading-relaxed font-light">
                {lang === 'ko' 
                  ? 'CSE4Seoul 공식 클랜 RoyaleAPI 연동 정보입니다. 전적 스캔, 실시간 멤버 트로피 변동 및 전투 덱 분석을 확인할 수 있습니다.' 
                  : 'RoyaleAPI integration for the official CSE4Seoul clan. View stats scan, live member trophies, and battle deck analytics.'}
              </p>
              
              <a
                href="https://royaleapi.com/clan/RRG9U0C9"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-400 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/5 hover:scale-[1.01]"
              >
                {lang === 'ko' ? '클랜 전적 분석실 입장 ↗' : 'Enter Clan Analysis ↗'}
              </a>
            </div>

            {/* 2. 환율 / 나스닥 / S&P 500 위젯 */}
            <div className="w-full">
              <ExchangeRateWidget lang={lang} />
            </div>

            {/* 최근 활동 미리보기 */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-white">{t.recentPostsTitle}</h2>
                <Link href={user ? "/board" : "/login"} className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                  {t.recentPostsMore}
                </Link>
              </div>
              <div className="divide-y divide-white/[0.08] rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-xl">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">{t.recentPostsLoading}</div>
                ) : recentPosts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">{t.recentPostsEmpty}</div>
                ) : (
                  recentPosts.map((post) => (
                    <Link 
                      href={user ? `/board/${post.id}` : "/login"}
                      key={post.id} 
                      className="flex items-center justify-between p-5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="font-semibold text-white tracking-tight">{post.title}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          {post.author_name} · {timeAgo(post.created_at)}
                        </p>
                      </div>
                      <RiLock2Line className="text-gray-500" />
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* 보안 강조 */}
            <div className="relative overflow-hidden flex flex-col items-center rounded-3xl border border-violet-500/20 bg-gradient-to-b from-violet-950/10 to-transparent p-10 text-center shadow-[0_8px_30px_rgba(139,92,246,0.05)] backdrop-blur-xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-300 mb-5 shadow-lg shadow-violet-500/10">
                <RiFlashlightLine className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white tracking-tight">{t.securityTitle}</h3>
              <p className="max-w-lg text-white/60 mb-8 text-sm leading-relaxed font-light">
                {t.securityDesc}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <span className="rounded-full bg-white/[0.02] px-4 py-1.5 text-xs font-medium text-cyan-300 border border-cyan-500/20 backdrop-blur-sm">AES-256</span>
                <span className="rounded-full bg-white/[0.02] px-4 py-1.5 text-xs font-medium text-cyan-300 border border-cyan-500/20 backdrop-blur-sm">E2EE</span>
                <span className="rounded-full bg-white/[0.02] px-4 py-1.5 text-xs font-medium text-cyan-300 border border-cyan-500/20 backdrop-blur-sm">{lang === 'ko' ? '자동 삭제 (24h)' : '24h Auto Delete'}</span>
              </div>
            </div>

          </div>

        </div>

        {/* 설립자 정보 */}
        <div className="text-center text-sm text-gray-500 pb-10 border-t border-white/5 pt-10">
          <p>Founder: 조하민 (Developer) · <a href="https://hamin-portfolio.vercel.app/" target="_blank" rel="noreferrer" className="text-cyan-400 underline decoration-cyan-400/70 hover:text-cyan-300">포트폴리오 ↗</a></p>
          <p className="mt-2"><a href="https://royaleapi.com/clan/RRG9U0C9" target="_blank" rel="noreferrer" className="text-cyan-400 underline decoration-cyan-400/70 hover:text-cyan-300">Clash Royale - CSE4seoul ↗</a></p>
          <p className="mt-2"><a href="https://www.statiz.co.kr/" target="_blank" rel="noreferrer" className="text-cyan-400 underline decoration-cyan-400/70 hover:text-cyan-300">KBO 기록 - 스탯티즈 ↗</a></p>
          <div className="mt-6 flex justify-center">
            <a href="https://chatanalyze.vercel.app/" target="_blank" rel="noreferrer" className="group w-full max-w-md rounded-2xl border border-cyan-400/30 bg-gray-900/60 p-5 backdrop-blur-md transition-all hover:scale-[1.02] hover:border-cyan-400/60 hover:shadow-cyan-400/20 shadow-lg">
              <div className="flex items-center justify-between text-left">
                <div>
                  <p className="font-semibold text-white">카카오톡 채팅 분석 서비스</p>
                  <p className="text-sm text-gray-400 mt-1">대화 데이터를 업로드하고 통계·패턴을 분석해보세요</p>
                </div>
                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">↗</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* 기능 소개 팝업 모달 */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="relative max-w-2xl w-full bg-gradient-to-b from-gray-900 to-black border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
              <button onClick={closeModal} className="absolute right-4 top-4 z-10 p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"><RiCloseLine className="text-2xl" /></button>
              <div className="overflow-y-auto p-6 md:p-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-6">
                  {t.modalTitle}
                </h2>
                <div className="space-y-6">
                  <div className="border-l-4 border-cyan-500 pl-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2"><RiChat3Line className="text-cyan-400" /> {t.modalChatTitle}</h3>
                    <ul className="mt-2 space-y-2 text-gray-300 text-sm">
                      <li>• <strong>AES-256 암호화</strong>로 {t.modalChatBullet1}</li>
                      <li>• <strong>24시간 후 자동 삭제</strong>되어 {t.modalChatBullet2}</li>
                    </ul>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2"><RiChat3Line className="text-green-400" /> {t.modalLobbyTitle}</h3>
                    <ul className="mt-2 space-y-2 text-gray-300 text-sm">
                      <li>• {t.modalLobbyBullet1}</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button onClick={closeModal} className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl text-white">
                    {t.modalCloseBtn}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. 공지사항 팝업 모달 (페이지 로드시 팝업) */}
      {/* 4. 공지사항 팝업 모달 (페이지 로드시 팝업) */}
<AnimatePresence mode="wait">
  {isNoticeModalOpen && notices.length > 0 && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 30, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className="relative max-w-lg w-full bg-gradient-to-br from-[#1a1410] via-[#0f0c0a] to-black rounded-3xl p-[2px] shadow-2xl shadow-amber-500/10"
      >
        {/* 내부 카드 (실제 컨텐츠) */}
        <div className="relative rounded-3xl bg-gradient-to-b from-[#1f1a16] to-black p-6 md:p-8 flex flex-col gap-5 overflow-hidden">
          
          {/* 상단 장식 라이트 (데코레이션) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
          
          {/* 상단 타이틀 영역 */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
                {notices[0].is_pinned ? '📌' : '📢'}
              </div>
              <div>
                <h2 className="text-xl font-bold leading-tight tracking-tight">
                  <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                    {notices[0].is_pinned
                      ? lang === 'ko' ? '중요 공지사항' : 'Important Notice'
                      : lang === 'ko' ? '새로운 알림' : 'New Notice'}
                  </span>
                </h2>
                <p className="text-[11px] text-amber-500/60 font-medium tracking-wider">
                  {new Date(notices[0].created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNoticeModalOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
            >
              <RiCloseLine className="text-2xl" />
            </button>
          </div>

          {/* 본문 */}
          <div className="py-1 relative">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-500/50 to-transparent rounded-full" />
            <p className="pl-4 text-[15px] text-gray-200 leading-relaxed font-light tracking-wide whitespace-pre-wrap">
              {notices[0].content}
            </p>
            {!notices[0].is_pinned && (
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {getNoticeExpiryLabel(notices[0].expires_at)}
                </span>
              </div>
            )}
          </div>

          {/* 하단 액션 영역 */}
          <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
            <span className="text-[10px] text-gray-500 font-medium tracking-wider">
              {lang === 'ko' ? '⏳ 페이지 진입 시 노출' : '⏳ Appears on access'}
            </span>
            <div className="flex items-center gap-2">
              {profile?.role === 'admin' && (
                <button
                  onClick={() => {
                    handleDeleteNotice(notices[0].id);
                    setIsNoticeModalOpen(false);
                  }}
                  className="group px-3.5 py-2 rounded-xl bg-red-950/30 border border-red-900/30 text-red-400 hover:bg-red-900/40 hover:border-red-700/50 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5"
                >
                  <span className="group-hover:scale-110 transition-transform">🗑️</span>
                  {t.deleteBtn}
                </button>
              )}
              <button
                onClick={() => setIsNoticeModalOpen(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl text-black font-bold text-xs shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] tracking-wide"
              >
                {t.modalCloseBtn}
              </button>
            </div>
          </div>

          {/* 하단 글로우 장식 */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </main>
  );
}
