'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  Cpu, 
  Wallet, 
  TrendingUp, 
  BookOpen, 
  MessageSquare, 
  Shield, 
  ChevronRight, 
  ArrowRight,
  ExternalLink,
  Receipt,
  Layers,
  Network,
  Sparkles,
  Code2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import LobbyChatWidget from '@/components/LobbyChatWidget';
import CosmicBackground from '@/components/CosmicBackground';
import DevelopersWidget from '../components/widgets/DevelopersWidget';

interface Post {
  id: string | number;
  title: string;
  author_name: string;
  created_at: string;
}

interface Notice {
  id: string;
  content: string;
  is_pinned: boolean;
  expires_at: string | null;
}

// 다국어 번역 딕셔너리
const contentData = {
  ko: {
    heroTag: "CSE4Seoul 커뮤니티",
    heroTitleLine1: "함께 만들고, 함께 성장하는",
    heroTitleLine2: "우리들의 공간",
    heroDesc: "Computer Science && Engineering for Seoul (CSE4Seoul) 커뮤니티는 클래시로얄 클랜을 기반으로 한 개발자 & 게이머 연합 플랫폼입니다. 개인 재무, 실시간 금융 지표, 지식 마인드맵, 암호화 통신을 결합한 통합 허브를 제공합니다.",
    systemBtn: "시스템 접속하기",
    dashboardBtn: "대시보드 허브 입장",
    showcaseBtn: "기능 쇼케이스 둘러보기",
    lobbyChatNav: "💬 로비 채팅 바로가기",
    lobbyChatTitle: "자유로운 로비 실시간 소통 & 미니 캔버스",
    lobbyChatStatus: "실시간 연결",
    featuresTitle: "✨ CSE4Seoul 핵심 기능 쇼케이스",
    financeTitle: "실질급여 계산 & 가계부 장부",
    financeDesc: "알바 주휴수당, 프리랜서 3.3% 원천징수, 4대보험 실지급액 역산 및 지출 내역 통계. 청년/근로장려금과 연말정산 공제 혜택을 시뮬레이션합니다.",
    financeLink: "재무 관리실 바로가기",
    marketTitle: "실시간 시장 & ETF iNAV 레이더",
    marketDesc: "원/달러 실시간 환율 및 미국 야간 선물 지수를 모니터링하며, 국내 상장 미국 ETF의 장 마감 후 실시간 추정 iNAV와 괴리율을 추적합니다.",
    marketLink: "시장 레이더 바로가기",
    knowledgeTitle: "지식 마인드맵 & 일일 학습 로그",
    knowledgeDesc: "무한 계층 캔버스에서 CS 개념과 커리어 로드맵을 시각화하고, 망각곡선 기반의 복습 알림 및 TXT 추출 기능을 갖춘 공부 기록실을 제공합니다.",
    knowledgeLink: "학습 허브 바로가기",
    communityTitle: "클랜 전술 기록 & 암호화 통신",
    communityDesc: "작전 회의록과 기술 분석을 공유하는 전술 게시판, AES-256 E2EE 종단간 암호화 실시간 통신실, 그리고 힐링 동물농장 미니게임을 제공합니다.",
    communityLink: "커뮤니티 라운지 바로가기",
    recentPostsTitle: "📢 최근 전술 게시글",
    recentPostsMore: "전체보기 →",
    recentPostsEmpty: "등록된 게시글이 없습니다.",
    clanTitle: "공식 클랜 연동",
    clanDesc: "CSE4Seoul 공식 클랜의 RoyaleAPI 실시간 전적, 멤버 트로피 변동 및 클랜전 승률을 스캔하여 모니터링합니다.",
    clanScore: "클랜 점수",
    clanWarRate: "전쟁 승률",
    clanBtn: "RoyaleAPI 전적 분석실 열기",
    privacyLink: "개인정보 처리방침",
    systemStatus: "시스템 정상 작동"
  },
  en: {
    heroTag: "CSE4Seoul Community",
    heroTitleLine1: "Co-creating and Growing Together",
    heroTitleLine2: "Our Space",
    heroDesc: "The Computer Science && Engineering for Seoul (CSE4Seoul) community is a developer & gamer platform rooted in a Clash Royale clan. Providing an all-in-one hub for personal finance, real-time market data, knowledge mind maps, and encrypted communications.",
    systemBtn: "Access System",
    dashboardBtn: "Enter Dashboard Hub",
    showcaseBtn: "Explore Capabilities",
    lobbyChatNav: "💬 Lobby Chat Quick Jump",
    lobbyChatTitle: "Public Lobby Real-time Chat & Canvas",
    lobbyChatStatus: "CONNECTED",
    featuresTitle: "✨ Key Capabilities Showcase",
    financeTitle: "Net Income Calculator & Account Book",
    financeDesc: "Calculates net wages for freelancers (3.3%) and full-time employment with insurance deductions. Simulates tax credits and incentives.",
    financeLink: "Enter Finance Hub",
    marketTitle: "Real-time Market & ETF iNAV Radar",
    marketDesc: "Monitors USD/KRW rates and US futures overnight, with live estimated iNAV and discrepancy tracking for US-indexed ETFs after market close.",
    marketLink: "Enter Market Radar",
    knowledgeTitle: "Knowledge Mind Map & Study Logs",
    knowledgeDesc: "Visualize CS concepts and career roadmaps on an infinite canvas, with Ebbinghaus spaced-repetition study logs and TXT exports.",
    knowledgeLink: "Enter Learning Hub",
    communityTitle: "Clan Tactical Boards & E2EE Chat",
    communityDesc: "Share technical briefs on tactical boards, access AES-256 encrypted chat rooms with 24-hour self-destruct timers, and play Animal Farm.",
    communityLink: "Enter Community Lounge",
    recentPostsTitle: "📢 Recent Tactical Briefs",
    recentPostsMore: "View All →",
    recentPostsEmpty: "No registered posts found.",
    clanTitle: "Official Clan Sync",
    clanDesc: "Real-time stats scan, live trophy fluctuations, and clan war win rates synced directly via RoyaleAPI.",
    clanScore: "Clan Score",
    clanWarRate: "War Win Rate",
    clanBtn: "Open RoyaleAPI Clan Analytics",
    privacyLink: "Privacy Policy",
    systemStatus: "ACTIVE"
  }
};

// Framer Motion 3D Hover Tilt Card
const HoverTiltCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-150, 150], [4, -4]);
  const rotateY = useTransform(x, [-150, 150], [-4, 4]);

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
      className={`group relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-neutral-900/60 to-black/80 p-6 backdrop-blur-xl hover:border-cyan-500/20 transition-all duration-500 shadow-xl overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default function LandingPage() {
  const { lang, toggleLanguage } = useLanguage();
  const currentLang = (lang === 'en' ? 'en' : 'ko') as 'ko' | 'en';
  const t = contentData[currentLang];

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ role?: string; is_admin?: boolean } | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role, is_admin')
          .eq('id', user.id)
          .single();
        setProfile(prof);
      }

      // 최신 공지사항 1건 조회
      try {
        const res = await fetch('/api/notice');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setNotices(data);
        }
      } catch (e) {
        console.error('Failed to load notices:', e);
      }

      // 최신 게시글 4건 경량 조회
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, author_name, created_at')
        .order('created_at', { ascending: false })
        .limit(4);
      if (posts) setRecentPosts(posts);
    };

    initData();
  }, [supabase]);

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-black text-white">
      {/* 🌌 별빛 우주 배경 (모듈화된 CosmicBackground) */}
      <CosmicBackground isFixed={true} showGrid={true} starSizeMultiplier={1.1} />

      {/* 최상단 공지 알림 바 (공지가 있을 때만 노출) */}
      {notices.length > 0 && (
        <div className="w-full relative overflow-hidden bg-cyan-950/40 border-b border-cyan-500/20 py-2 backdrop-blur-md z-30 flex items-center gap-3 px-6 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
          <span className="text-cyan-400 font-bold shrink-0">[NOTICE]</span>
          <span className="text-neutral-200 truncate">{notices[0].content}</span>
        </div>
      )}

      {/* 헤더 네비게이션 */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-black/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/20">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-widest text-white uppercase font-mono">CSE4Seoul</span>
              <span className="text-[9px] text-cyan-400 font-mono tracking-wider font-semibold">[{t.systemStatus}]</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* 세련된 슬라이딩 다국어 토글 버튼 (KO | EN) */}
            <button
              onClick={toggleLanguage}
              className="relative h-8 w-20 rounded-full bg-neutral-900 border border-white/10 p-0.5 transition-colors hover:border-white/20 flex items-center justify-between px-2.5 text-[10px] font-mono font-bold select-none cursor-pointer"
              aria-label="Language Toggle"
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`absolute top-0.5 bottom-0.5 w-9 rounded-full bg-cyan-500/20 border border-cyan-400/40 ${
                  currentLang === 'ko' ? 'left-0.5' : 'left-[38px]'
                }`}
              />
              <span className={`z-10 transition-colors ${currentLang === 'ko' ? 'text-cyan-300 font-black' : 'text-neutral-500'}`}>KO</span>
              <span className={`z-10 transition-colors ${currentLang === 'en' ? 'text-cyan-300 font-black' : 'text-neutral-500'}`}>EN</span>
            </button>

            {/* 접속 버튼 */}
            <Link
              href={user ? "/dashboard" : "/login"}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              <span>{user ? t.dashboardBtn : t.systemBtn}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 컨테이너 */}
      <div className="z-10 w-full max-w-6xl px-4 sm:px-6 py-12 md:py-16 flex flex-col gap-14 md:gap-18">
        
        {/* Hero Section */}
        <section className="text-center relative py-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3.5 py-1 text-[11px] font-mono font-bold tracking-widest text-cyan-300 backdrop-blur-md mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>[ {t.heroTag.toUpperCase()} ]</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight"
          >
            <span className="bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              {t.heroTitleLine1}
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
              {t.heroTitleLine2}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-xs sm:text-sm text-neutral-400 leading-relaxed font-light"
          >
            {t.heroDesc}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href={user ? "/dashboard" : "/login"}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-8 py-3.5 text-xs font-black tracking-widest text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <span>{user ? t.dashboardBtn.toUpperCase() : t.systemBtn.toUpperCase()}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#showcase"
              className="rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-6 py-3.5 text-xs font-bold text-neutral-300 hover:text-white transition-all"
            >
              {t.showcaseBtn}
            </a>

            <a
              href="#lobby-chat"
              className="rounded-full border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 px-6 py-3.5 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>{t.lobbyChatNav}</span>
            </a>
          </motion.div>
        </section>

        {/* Bento Showcase (4대 핵심 도메인 요약) */}
        <section id="showcase" className="scroll-mt-24 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">{t.featuresTitle}</h2>
            </div>
            <span className="text-xs text-neutral-400 font-mono">CORE CAPABILITIES</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. 개인 재무 도메인 */}
            <HoverTiltCard className="border-cyan-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800">
                    PERSONAL FINANCE
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t.financeTitle}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  {t.financeDesc}
                </p>
              </div>
              <Link
                href={user ? "/finance" : "/login"}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors pt-2 border-t border-white/5"
              >
                <span>{t.financeLink}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </HoverTiltCard>

            {/* 2. 시장 & ETF 분석 도메인 */}
            <HoverTiltCard className="border-emerald-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                    FINANCIAL RADAR
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t.marketTitle}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  {t.marketDesc}
                </p>
              </div>
              <Link
                href={user ? "/market" : "/login"}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors pt-2 border-t border-white/5"
              >
                <span>{t.marketLink}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </HoverTiltCard>

            {/* 3. 지식 & 마인드맵 도메인 */}
            <HoverTiltCard className="border-indigo-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Network className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800">
                    KNOWLEDGE SUITE
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t.knowledgeTitle}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  {t.knowledgeDesc}
                </p>
              </div>
              <Link
                href={user ? "/learning" : "/login"}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors pt-2 border-t border-white/5"
              >
                <span>{t.knowledgeLink}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </HoverTiltCard>

            {/* 4. 커뮤니티 & 보안 도메인 */}
            <HoverTiltCard className="border-pink-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-pink-950/60 text-pink-300 border border-pink-800">
                    COMMUNITY & E2EE
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t.communityTitle}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  {t.communityDesc}
                </p>
              </div>
              <Link
                href={user ? "/community" : "/login"}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors pt-2 border-t border-white/5"
              >
                <span>{t.communityLink}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </HoverTiltCard>
          </div>
        </section>

        {/* 최근 게시글 & 클랜 정보 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 최근 게시글 프리뷰 */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">{t.recentPostsTitle}</h3>
                </div>
                <Link
                  href={user ? "/board" : "/login"}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {t.recentPostsMore}
                </Link>
              </div>

              <div className="space-y-2.5">
                {recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={user ? `/board/${post.id}` : "/login"}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-colors group/item"
                    >
                      <span className="text-xs text-neutral-300 group-hover/item:text-cyan-300 truncate font-medium max-w-[75%]">
                        {post.title}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                        {post.author_name}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="text-xs text-neutral-500 py-6 text-center font-mono">
                    {t.recentPostsEmpty}
                  </div>
                )}
              </div>
            </div>

            <Link
              href={user ? "/board" : "/login"}
              className="mt-4 pt-3 border-t border-white/5 text-xs text-neutral-400 hover:text-white transition-colors text-center block"
            >
              {currentLang === 'ko' ? '게시판에서 전략 토론 참여하기 →' : 'Join discussion on board →'}
            </Link>
          </div>

          {/* 공식 클래시로얄 클랜 연동 안내 */}
          <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-black to-neutral-950 p-6 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">👑</span>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">{t.clanTitle}</h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400 font-bold">#RRG9U0C9</span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                {t.clanDesc}
              </p>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs mb-4">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-neutral-500 block">{t.clanScore}</span>
                  <span className="text-amber-400 font-bold text-sm mt-0.5 block">54,200+</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-neutral-500 block">{t.clanWarRate}</span>
                  <span className="text-teal-400 font-bold text-sm mt-0.5 block">68.4%</span>
                </div>
              </div>
            </div>

            <a
              href="https://royaleapi.com/clan/RRG9U0C9"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>{t.clanBtn}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 공개 로비 실시간 채팅 섹션 (#lobby-chat) */}
        <section id="lobby-chat" className="scroll-mt-24 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💬</span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">{t.lobbyChatTitle}</h2>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[9px] text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-full border border-cyan-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>{t.lobbyChatStatus}</span>
            </div>
          </div>

          <div className="relative group rounded-3xl border border-white/[0.08] hover:border-cyan-500/25 bg-black/40 backdrop-blur-xl shadow-2xl transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 left-5 right-5 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent z-10" />
            <LobbyChatWidget isAdminProp={profile?.role === 'admin' || profile?.is_admin === true} />
          </div>
        </section>

        <div className="flex justify-center">
          <DevelopersWidget />
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-mono">
          <div>
            © 2026 CSE4Seoul HQ. Built for Developers & Clashers.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-neutral-300 transition-colors underline"
            >
              {t.privacyLink}
            </button>
            <span>•</span>
            <Link href={user ? "/dashboard" : "/login"} className="hover:text-neutral-300 transition-colors">
              {user ? t.dashboardBtn : t.systemBtn}
            </Link>
          </div>
        </footer>
      </div>

      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        lang={currentLang}
      />
    </main>
  );
}
