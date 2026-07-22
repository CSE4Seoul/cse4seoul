'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
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
  RiCloseLine,
  RiGamepadLine,
  RiShieldLine,
  RiPulseLine,
  RiExternalLinkLine
} from 'react-icons/ri';
import { 
  Terminal, 
  Cpu, 
  Shield, 
  TrendingUp, 
  Zap, 
  Lock, 
  AlertTriangle,
  Flame,
  Globe,
  LogOut,
  ChevronRight,
  Activity,
  Layers,
  Database
} from 'lucide-react';
import LobbyChatWidget from '@/components/LobbyChatWidget';
import ExchangeRateWidget from '@/components/ExchangeRateWidget';
import QAWidget from '@/components/QAWidget';
import ChangelogWidget from '@/components/ChangelogWidget';
import NoticeModal from '@/components/NoticeModal';
import { useLanguage } from '@/contexts/LanguageContext';

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
    featureBoardTitle: "실시간 금융 데이터 위젯",
    featureBoardDesc: "원/달러 실시간 환율, 미국 야간 선물 지수, 그리고 장 마감 이후의 실시간 추정 iNAV와 괴리율을 모니터링할 수 있는 개인화 대시보드 위젯을 로그인 시 이용할 수 있습니다.",
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
    minUnit: "분",
    
    // 추가된 UI 번역 키
    clanWidgetTitle: "클래시 로얄 클랜 정보",
    clanWidgetDesc: "CSE4Seoul 공식 클랜 RoyaleAPI 연동 정보입니다. 전적 스캔, 실시간 멤버 트로피 변동 및 전투 덱 분석을 확인할 수 있습니다.",
    clanBtn: "클랜 전적 분석실 입장 ↗",
    clanTag: "공식 클랜 연동",
    clanStatus: "스캔 완료",
    securityBadge: "보안 강화",
    securityStatus: "활성화됨",
    postsWidgetTitle: "최근 데이터 스캔",
    postsWidgetStatus: "실시간",
    systemStatus: "정상 작동",
    connectionEncrypted: "보안 통신망",
    exchangeStatus: "연동 중",
    lobbyChatStatus: "실시간 연결",
    qaStatus: "질의 응답",
    changelogStatus: "시스템 로그",
    changelogTitle: "📋 시스템 체인지로그"
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
    featureBoardTitle: "Real-time Financial Widgets",
    featureBoardDesc: "Monitor USD/KRW exchange rates, US overnight index futures, and real-time estimated iNAV with discrepancy rates after market hours on your personalized dashboard upon logging in.",
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
    minUnit: "m",
    
    // 추가된 UI 번역 키
    clanWidgetTitle: "Clash Royale Clan",
    clanWidgetDesc: "RoyaleAPI integration for the official CSE4Seoul clan. View stats scan, live member trophies, and battle deck analytics.",
    clanBtn: "Enter Clan Analysis ↗",
    clanTag: "Official Clan Sync",
    clanStatus: "SCANNED",
    securityBadge: "SECURITY SHIELD",
    securityStatus: "SECURE",
    postsWidgetTitle: "Recent Data Scans",
    postsWidgetStatus: "LIVE",
    systemStatus: "ACTIVE",
    connectionEncrypted: "ENCRYPTED",
    exchangeStatus: "SYNCING",
    lobbyChatStatus: "CONNECTED",
    qaStatus: "Q&A PORTAL",
    changelogStatus: "HISTORY",
    changelogTitle: "📋 System Changelog"
  }
};

// 1. WebGL 스타일의 Canvas 인터랙티브 배경
const BackgroundCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const numParticles = Math.min(60, Math.floor((width * height) / 25000));

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: i % 3 === 0 ? 'rgba(6, 182, 212, 0.4)' : i % 3 === 1 ? 'rgba(139, 92, 246, 0.4)' : 'rgba(236, 72, 153, 0.3)',
      });
    }

    let mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Cyber Grid Background overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw particles & connect
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            p.x += dx * 0.008;
            p.y += dy * 0.008;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.12;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
};

// 2. Framer Motion 3D Hover Tilt Card (스큐어모피즘 및 광택 효과)
const HoverTiltCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-150, 150], [5, -5]);
  const rotateY = useTransform(x, [-150, 150], [-5, 5]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left - width / 2;
    const mouseY = event.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`group relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-neutral-900/60 to-black/80 p-6 backdrop-blur-xl hover:border-cyan-500/20 transition-all duration-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_8px_30px_rgba(0,0,0,0.8)] overflow-hidden ${className}`}
    >
      {/* Gloss sweep shine background */}
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.02)_55%,transparent_65%)] bg-[length:200%_100%] bg-no-repeat bg-[position:-200%_0] group-hover:bg-[position:200%_0] transition-all duration-1000 ease-in-out pointer-events-none -z-10 rounded-3xl" />
      {children}
    </motion.div>
  );
};

export default function Home() {
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // 권한 및 다국어, 공지사항을 위한 추가 상태
  const [profile, setProfile] = useState<any | null>(null);
  const { lang, toggleLanguage } = useLanguage();
  const [notices, setNotices] = useState<any[]>([]);
  const [isNoticeLoading, setIsNoticeLoading] = useState(true);
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      {/* 1. WebGL 스타일 인터랙티브 백그라운드 canvas */}
      <BackgroundCanvas />

      {/* 2. Glow Blur Background Orbs */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.18),transparent_70%)]" />
      <motion.div
        animate={{
          x: [0, 15, -15, 0],
          y: [0, -15, 15, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="pointer-events-none absolute left-[10%] top-[8%] z-0 h-[600px] w-[600px] rounded-full bg-cyan-500/[0.03] blur-[150px]"
      />
      <motion.div
        animate={{
          x: [0, -20, 20, 0],
          y: [0, 20, -20, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="pointer-events-none absolute right-[10%] top-[25%] z-0 h-[700px] w-[700px] rounded-full bg-violet-500/[0.03] blur-[180px]"
      />

      {/* 3. alert ticker marquee bar (공지 활성화 시 자동 표시) */}
      {notices.length > 0 && (
        <div className="w-full relative overflow-hidden bg-red-950/20 border-b border-red-500/20 py-2.5 backdrop-blur-md z-30 flex items-center gap-4 px-6 font-mono text-[10px]">
          <div className="flex items-center gap-1.5 text-red-500 font-black shrink-0 uppercase tracking-widest animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>[SYSTEM_ALERT]</span>
          </div>
          <div className="overflow-hidden relative w-full h-4">
            <div className="animate-marquee">
              {[...notices, ...notices].map((n, idx) => (
                <span key={`${n.id}-${idx}`} className="text-white/80 flex items-center gap-3 pr-12">
                  <span className="text-red-400">⚡</span>
                  <span className="font-bold">{n.content}</span>
                  <span className="text-[9px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    {n.is_pinned ? (lang === 'ko' ? '📌 고정' : '📌 PINNED') : getNoticeExpiryLabel(n.expires_at)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Sleek Navigation Header (스큐어모피즘 및 glassmorphism) */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-black/45 backdrop-blur-lg backdrop-saturate-150 shadow-[0_1px_1px_rgba(255,255,255,0.05)_inset]">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/20">
              <Cpu className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-widest text-white uppercase">CSE4Seoul</span>
              <span className="text-[8px] text-cyan-400 font-mono tracking-wider font-semibold">[{t.systemStatus}]</span>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <p className="hidden md:inline-block text-[10px] font-mono text-white/40 tracking-wider">
              {user 
                ? (lang === 'ko' ? `${user.email} 님 로그인됨` : `CONNECTED: ${user.email}`) 
                : (lang === 'ko' ? '게스트 상태' : 'GUEST STATUS')}
            </p>
            
            <div className="flex items-center gap-3">
              {/* 세련된 슬라이딩 다국어 토글 버튼 */}
              <button
                onClick={toggleLanguage}
                className="relative h-8 w-20 rounded-full bg-neutral-900 border border-white/10 p-0.5 transition-colors hover:border-white/20"
                aria-label="Language Toggle"
              >
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-[3px] bottom-[3px] rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow shadow-cyan-500/50"
                  style={{
                    left: lang === 'ko' ? '4px' : 'calc(50% + 2px)',
                    right: lang === 'ko' ? 'calc(50% + 2px)' : '4px',
                  }}
                />
                <div className="absolute inset-0 flex justify-between px-3 items-center text-[9px] font-black text-white/90 tracking-widest font-mono pointer-events-none select-none">
                  <span className={lang === 'ko' ? 'text-black' : 'text-white/50'}>KO</span>
                  <span className={lang === 'en' ? 'text-black' : 'text-white/50'}>EN</span>
                </div>
              </button>

              {user ? (
                <button
                  onClick={handleSignOut}
                  className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/[0.08] text-[10px] font-bold text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all flex items-center gap-1 uppercase tracking-wider font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                >
                  <LogOut className="w-3 h-3" />
                  {lang === 'ko' ? '로그아웃' : 'Logout'}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="px-4.5 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <Lock className="w-3 h-3" />
                  {lang === 'ko' ? '로그인' : 'Login'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="z-10 w-full max-w-7xl px-6 py-12 md:py-20 flex flex-col gap-12 md:gap-20">
        
        {/* Cinematic Hero Section */}
        <div className="text-center relative py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-gradient-to-r from-cyan-950/20 to-indigo-950/20 px-4 py-1.5 text-[10px] font-bold tracking-widest text-cyan-300 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_15px_rgba(6,182,212,0.1)] mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>[ {t.heroTag.toUpperCase()} ]</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
            className="text-4xl font-black tracking-tight md:text-7xl lg:text-8xl leading-[1.05] md:leading-[1]"
          >
            <span className="bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              {t.heroTitleLine1}
            </span>
            <br />
            <span className="inline-block mt-3 bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-500 bg-clip-text text-transparent hover:scale-[1.01] transition-transform duration-500 select-none cursor-default drop-shadow-[0_0_35px_rgba(6,182,212,0.2)]">
              {t.heroTitleLine2}
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
            className="mx-auto mt-8 max-w-2xl text-xs md:text-sm text-neutral-400 leading-relaxed font-light tracking-wide"
          >
            {t.heroDesc}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href={user ? "/dashboard" : "/login"}
              className="group relative rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-8 py-3.5 text-xs font-black tracking-widest text-white transition-all hover:from-cyan-400 hover:to-indigo-500 hover:scale-[1.03] shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center justify-center gap-1.5 border border-cyan-400/20"
            >
              <span>{t.systemBtn.toUpperCase()}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-full border border-white/10 bg-white/[0.02] px-7 py-3.5 text-xs font-bold tracking-widest text-white/80 backdrop-blur-sm transition-all hover:bg-white/5 hover:text-white hover:border-white/20 hover:scale-[1.03] flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <RiInformationLine className="text-base text-cyan-400" />
              <span>{t.infoBtn.toUpperCase()}</span>
            </button>
          </motion.div>
        </div>

        {/* 5. Asymmetrical Interactive Bento Grid (3 Features) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <HoverTiltCard className="p-8 group/card">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mb-6 group-hover/card:scale-110 group-hover/card:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-300">
              <RiChat3Line className="text-2xl" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">{t.featureChatTitle}</h3>
            <p className="mt-3 text-xs text-neutral-400 leading-relaxed font-light">
              {t.featureChatDesc}
            </p>
          </HoverTiltCard>

          <HoverTiltCard className="p-8 group/card">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 mb-6 group-hover/card:scale-110 group-hover/card:shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-all duration-300">
              <RiGamepadLine className="text-2xl" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">{t.featureBoardTitle}</h3>
            <p className="mt-3 text-xs text-neutral-400 leading-relaxed font-light">
              {t.featureBoardDesc}
            </p>
          </HoverTiltCard>

          <HoverTiltCard className="p-8 group/card">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/25 flex items-center justify-center text-pink-400 mb-6 group-hover/card:scale-110 group-hover/card:shadow-[0_0_15px_rgba(236,72,153,0.2)] transition-all duration-300">
              <RiGroupLine className="text-2xl" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">{t.featureNetworkTitle}</h3>
            <p className="mt-3 text-xs text-neutral-400 leading-relaxed font-light">
              {t.featureNetworkDesc}
            </p>
          </HoverTiltCard>
        </div>

        {/* 6. Command Center Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
          
          {/* LEFT HUB: Chat, QA & Controls (takes 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* 최고관리자 공지사항 관리 (어드민 전용 - 원자력 제어반 스타일) */}
            {profile?.role === 'admin' && (
              <div className="relative rounded-3xl border border-red-500/15 bg-red-950/[0.01] p-6 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(45deg,#b91c1c,#b91c1c_10px,#000_10px,#000_20px)] opacity-60" />

                <div className="flex items-center gap-3 mb-5 mt-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-500/20 border border-red-500/20">
                    <Terminal className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{t.adminPanelTitle}</h3>
                    <p className="text-[10px] text-red-400 font-mono">{t.adminPanelDesc}</p>
                  </div>
                </div>

                <form onSubmit={handleCreateNotice} className="flex flex-col gap-4">
                  <div className="relative">
                    <span className="absolute top-3.5 left-4 text-[10px] text-red-500/80 font-mono font-black">CMD &gt;</span>
                    <textarea
                      className="w-full h-24 bg-black/60 border border-white/10 rounded-xl pl-16 pr-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-red-500/50 resize-none placeholder-red-900/40"
                      placeholder={t.adminInputPlaceholder}
                      value={newNoticeContent}
                      onChange={(e) => setNewNoticeContent(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                    <div className="flex flex-wrap items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-white/70 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={isPinned}
                          onChange={(e) => setIsPinned(e.target.checked)}
                          className="rounded border-white/10 bg-black text-red-600 focus:ring-0 focus:ring-offset-0"
                        />
                        {t.adminPinCheck}
                      </label>

                      {!isPinned && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">{t.adminPeriodLabel}</span>
                          <select
                            value={expiresInHours}
                            onChange={(e) => setExpiresInHours(Number(e.target.value))}
                            className="bg-black border border-white/10 rounded-lg px-2.5 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-red-500/50 cursor-pointer"
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
                      className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 rounded-xl text-white text-xs font-bold transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 hover:scale-[1.01]"
                    >
                      {isSubmitting ? t.adminSubmitting : t.adminSubmitBtn}
                    </button>
                  </div>
                </form>

                {/* 게재 목록 */}
                {notices.length > 0 && (
                  <div className="mt-5 border-t border-white/5 pt-4">
                    <h4 className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-wider mb-2.5">{t.adminListTitle}</h4>
                    <div className="space-y-2">
                      {notices.map((n) => (
                        <div key={n.id} className="flex items-center justify-between bg-black/45 p-3 rounded-lg border border-white/5 text-xs font-mono">
                          <div className="flex items-center gap-2 text-white/70 max-w-[80%]">
                            <span>{n.is_pinned ? '📌' : '⏰'}</span>
                            <span className="truncate">{n.content}</span>
                            {!n.is_pinned && (
                              <span className="text-[9px] text-amber-500 font-bold whitespace-nowrap">
                                ({getNoticeExpiryLabel(n.expires_at)})
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteNotice(n.id)}
                            className="px-2.5 py-1 bg-red-950/40 border border-red-900/40 text-red-400 hover:bg-red-900/40 rounded text-[10px] font-bold transition-all shrink-0"
                          >
                            {t.deleteBtn}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 로비 채팅 위젯 - 고해상도 디자인 프레임 내에 마운트 */}
            <div className="relative group rounded-3xl border border-white/[0.08] hover:border-cyan-500/25 bg-black/30 backdrop-blur-xl shadow-2xl transition-all duration-500">
              <div className="absolute top-0 left-5 right-5 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent z-10" />
              <div className="absolute top-3 right-5 flex items-center gap-1.5 font-mono text-[9px] text-cyan-400 select-none bg-cyan-950/20 px-2.5 py-0.5 rounded border border-cyan-800/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>{t.lobbyChatStatus}</span>
              </div>
              <LobbyChatWidget isAdminProp={profile?.role === 'admin' || profile?.is_admin === true} />
            </div>

            {/* Q&A & Suggestions 위젯 */}
            <div className="relative group rounded-3xl border border-white/[0.08] hover:border-violet-500/25 bg-black/30 backdrop-blur-xl shadow-2xl transition-all duration-500">
              <div className="absolute top-0 left-5 right-5 h-[1px] bg-gradient-to-r from-transparent via-violet-500/25 to-transparent z-10" />
              <div className="absolute top-3 right-5 flex items-center gap-1.5 font-mono text-[9px] text-violet-400 select-none bg-violet-950/20 px-2.5 py-0.5 rounded border border-violet-800/30">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                <span>{t.qaStatus}</span>
              </div>
              <QAWidget user={user} profile={profile} lang={lang} />
            </div>
          </div>

          {/* RIGHT SIDEBAR: Stats, Updates, Security (takes 4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* 👑 Clash Royale Clan Widget (고해상도 게임 터미널 스킨) */}
            <HoverTiltCard className="border-amber-500/10">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white text-lg shadow-lg shadow-amber-500/25 border border-amber-400/20 font-bold">
                      👑
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-tight">{t.clanWidgetTitle}</h4>
                      <p className="text-[10px] text-amber-500 font-mono font-bold tracking-wider">#RRG9U0C9</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
                    {t.clanStatus}
                  </span>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  {t.clanWidgetDesc}
                </p>

                <div className="grid grid-cols-2 gap-3 py-1 font-mono">
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[9px] text-neutral-400 uppercase tracking-wider">{lang === 'ko' ? '클랜 점수' : 'Clan Trophies'}</span>
                    <span className="text-base font-black text-amber-400 mt-1">54,200+</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[9px] text-neutral-400 uppercase tracking-wider">{lang === 'ko' ? '전쟁 승률' : 'War Rate'}</span>
                    <span className="text-base font-black text-teal-400 mt-1">68.4%</span>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-3 font-mono text-[9px] text-neutral-400 space-y-1">
                  <div className="flex justify-between">
                    <span>[SYNC_SERVICE]</span>
                    <span className="text-teal-400">ACTIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>[WAR_STANCE]</span>
                    <span className="text-amber-500">COMPETITIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>[MEMBERSHIP]</span>
                    <span className="text-white/80">48 / 50</span>
                  </div>
                </div>

                <a
                  href="https://royaleapi.com/clan/RRG9U0C9"
                  target="_blank"
                  rel="noreferrer"
                  className="group/btn relative w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-600/10 hover:from-amber-500 hover:to-yellow-600 border border-amber-500/30 hover:border-amber-400 text-amber-400 hover:text-black font-bold text-xs transition-all duration-300 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/5"
                >
                  <span>{t.clanBtn}</span>
                  <RiExternalLinkLine className="text-xs group-hover/btn:scale-110 transition-transform" />
                </a>
              </div>
            </HoverTiltCard>

            {/* 환율 / 나스닥 / S&P 500 위젯 */}
            <div className="relative group rounded-3xl border border-white/[0.08] hover:border-cyan-500/25 bg-black/30 backdrop-blur-xl shadow-2xl transition-all duration-500">
              <div className="absolute top-0 left-5 right-5 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent z-10" />
              <div className="absolute top-3 right-5 flex items-center gap-1.5 font-mono text-[9px] text-cyan-400 select-none bg-cyan-950/20 px-2.5 py-0.5 rounded border border-cyan-800/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>{t.exchangeStatus}</span>
              </div>
              <ExchangeRateWidget lang={lang} />
            </div>

            {/* 최근 활동 미리보기 */}
            <HoverTiltCard>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{t.recentPostsTitle}</h4>
                  </div>
                  <Link href={user ? "/board" : "/login"} className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider font-mono">
                    {t.recentPostsMore}
                  </Link>
                </div>

                <div className="flex flex-col gap-2.5">
                  {isLoading ? (
                    <div className="py-6 text-center text-xs text-white/40 font-mono">{t.recentPostsLoading}</div>
                  ) : recentPosts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-white/40 font-mono">{t.recentPostsEmpty}</div>
                  ) : (
                    recentPosts.map((post) => (
                      <Link 
                        href={user ? `/board/${post.id}` : "/login"}
                        key={post.id} 
                        className="group/item flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] hover:border-cyan-500/25 transition-all duration-300 cursor-pointer font-mono"
                      >
                        <div className="min-w-0 max-w-[85%]">
                          <p className="text-xs font-bold text-white group-hover/item:text-cyan-400 transition-colors truncate">{post.title}</p>
                          <p className="text-[9px] text-white/45 mt-1">
                            BY: {post.author_name} // {timeAgo(post.created_at)}
                          </p>
                        </div>
                        <RiLock2Line className="text-white/30 group-hover/item:text-cyan-400 transition-colors shrink-0 text-xs" />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </HoverTiltCard>

            {/* E2EE 보안 정보 */}
            <HoverTiltCard className="border-violet-500/10 relative overflow-hidden">
              {/* Scanline overlay sweep */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/10 to-transparent h-[40%] w-full animate-scan -z-10" />

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-lg shadow-lg shadow-violet-500/25 border border-violet-400/20 relative">
                    <RiFlashlightLine className="text-xl text-violet-300" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500 border border-black"></span>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-tight">{t.securityTitle}</h4>
                    <p className="text-[10px] text-violet-400 font-mono font-bold tracking-wider">{t.securityBadge}</p>
                  </div>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  {t.securityDesc}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded bg-teal-950/30 text-teal-400 border border-teal-500/20 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    AES-256
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded bg-teal-950/30 text-teal-400 border border-teal-500/20 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    E2EE SECURE
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded bg-violet-950/30 text-violet-400 border border-violet-500/20 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    {lang === 'ko' ? '24시간 자동삭제' : '24H AUTO DELETE'}
                  </span>
                </div>
              </div>
            </HoverTiltCard>

          </div>

        </div>

        {/* 설립자 정보 및 카카오톡 서비스 */}
        <div className="mt-16 border-t border-white/5 pt-10 text-center text-xs text-white/40 font-mono flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-white/50">
            <span>FOUNDER: <a href="https://hamin-portfolio.vercel.app/" target="_blank" rel="noreferrer" className="text-cyan-400 underline decoration-cyan-400/30 hover:text-cyan-300 transition-colors">조하민 (DEVELOPER) ↗</a></span>
            <span>•</span>
            <span>CLAN: <a href="https://royaleapi.com/clan/RRG9U0C9" target="_blank" rel="noreferrer" className="text-cyan-400 underline decoration-cyan-400/30 hover:text-cyan-300 transition-colors">CSE4SEOUL ↗</a></span>
            <span>•</span>
            <span>BASEBALL: <a href="https://www.statiz.co.kr/" target="_blank" rel="noreferrer" className="text-cyan-400 underline decoration-cyan-400/30 hover:text-cyan-300 transition-colors">KBO STATIZ ↗</a></span>
          </div>
          
          <div className="w-full max-w-xl">
            <a 
              href="https://chatanalyze.vercel.app/" 
              target="_blank" 
              rel="noreferrer" 
              className="group flex items-center justify-between text-left p-5 rounded-2xl border border-cyan-500/20 bg-neutral-950/40 backdrop-blur-md hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:scale-[1.01] transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-800/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
                  💬
                </div>
                <div>
                  <p className="font-bold text-white text-sm">카카오톡 채팅 분석 서비스</p>
                  <p className="text-[10px] text-white/50 mt-1">대화 데이터를 업로드하고 통계 및 패턴을 상세히 분석해보세요</p>
                </div>
              </div>
              <ChevronRight className="text-cyan-400 group-hover:translate-x-1 transition-transform w-5 h-5 shrink-0" />
            </a>
          </div>

          <p className="text-[9px] text-white/20 mt-4 uppercase tracking-widest">
            © 2026 CSE4SEOUL HQ. ALL SYSTEMS OPERATIONAL.
          </p>
        </div>
      </div>

      {/* 기능 소개 팝업 모달 */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }} 
              onClick={(e) => e.stopPropagation()} 
              className="relative max-w-2xl w-full bg-gradient-to-b from-[#18181b] to-black border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* top accent light edge */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/80 to-transparent" />
              <button onClick={closeModal} className="absolute right-5 top-5 z-10 p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"><RiCloseLine className="text-2xl" /></button>
              
              <div className="overflow-y-auto p-6 md:p-10">
                <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-6 tracking-tight">
                  {t.modalTitle}
                </h2>
                <div className="space-y-6">
                  <div className="border-l-2 border-cyan-500 pl-4 font-mono">
                    <h3 className="text-base font-bold flex items-center gap-2 text-white"><RiChat3Line className="text-cyan-400" /> {t.modalChatTitle}</h3>
                    <ul className="mt-3 space-y-2 text-neutral-300 text-xs font-light leading-relaxed">
                      <li>• <strong>AES-256 암호화</strong>로 {t.modalChatBullet1}</li>
                      <li>• <strong>24시간 후 자동 삭제</strong>되어 {t.modalChatBullet2}</li>
                    </ul>
                  </div>
                  <div className="border-l-2 border-green-500 pl-4 font-mono">
                    <h3 className="text-base font-bold flex items-center gap-2 text-white"><RiChat3Line className="text-green-400" /> {t.modalLobbyTitle}</h3>
                    <ul className="mt-3 space-y-2 text-neutral-300 text-xs font-light leading-relaxed">
                      <li>• {t.modalLobbyBullet1}</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-10 flex justify-end">
                  <button onClick={closeModal} className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl text-white text-xs font-bold transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    {t.modalCloseBtn}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📢 공지사항 팝업 모달 */}
      <NoticeModal
        notices={notices}
        lang={lang}
        isAdmin={profile?.role === 'admin'}
        onDeleteNotice={handleDeleteNotice}
      />

      {/* 📋 시스템 체인지로그 */}
      <div className="max-w-6xl mx-auto px-6 pb-20 relative z-10 w-full">
        <ChangelogWidget />
      </div>

      {/* 7. CSS 스타일 시트 주입 (Marquee 및 Scanline 애니메이션) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(250%); }
        }
        .animate-scan {
          animation: scan 6s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </main>
  );
}
