'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Code2,
  Cpu,
  ExternalLink,
  Gamepad2,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import MomentGallery from '@/components/widgets/MomentGallery';
import { createClient } from '@/utils/supabase/client';

interface Post {
  id: string | number;
  title: string;
  author_name: string;
  created_at: string;
}

interface Notice {
  id: string | number;
  content: string;
  is_pinned: boolean;
  expires_at: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNotice(value: unknown): value is Notice {
  return isRecord(value)
    && (typeof value.id === 'string' || typeof value.id === 'number')
    && typeof value.content === 'string'
    && typeof value.is_pinned === 'boolean'
    && (typeof value.expires_at === 'string' || value.expires_at === null);
}

const copy = {
  ko: {
    nav: ['클랜 소개', '서비스·도구', '클랜 소식', '구성원', '전적·아레나', '가입·문의'],
    login: '로그인',
    dashboard: '클랜 대시보드 입장',
    eyebrow: 'CSE4SEOUL // ENGINEERING & ARENA',
    title: ['코드와 전략을 융합하여', '새로운 플레이의 기준을', '함께 만들어갑니다'],
    description: 'CSE4Seoul은 개발자와 게이머가 기술과 전술을 공유하고, 함께 프로젝트를 구축하는 하이브리드 커뮤니티입니다.',
    chat: '암호화 로비 채팅',
    newsEyebrow: 'CLAN NEWS',
    newsTitle: '새 소식',
    newsDescription: '클랜의 최근 기록과 구성원들의 이야기를 확인하세요.',
    noticesTitle: '공지사항',
    postsTitle: '최근 게시글',
    all: '전체',
    clan: '클랜전',
    development: '개발·배포',
    events: '이벤트',
    viewAll: '더보기',
    noNotice: '등록된 공지가 없습니다.',
    noPosts: '아직 게시글이 없습니다.',
    quickTitle: '주요 서비스 바로가기',
    gallery: '영광의 갤러리',
    join: '클랜 가입 신청',
    footerText: '개발자와 게이머가 함께 만드는 기술·전술 커뮤니티',
    privacy: '개인정보 처리방침',
    searchPlaceholder: '공지와 게시글 검색',
  },
  en: {
    nav: ['About', 'Services & tools', 'Clan news', 'Members', 'Stats & arena', 'Join & contact'],
    login: 'Sign in',
    dashboard: 'Enter clan dashboard',
    eyebrow: 'CSE4SEOUL // ENGINEERING & ARENA',
    title: ['Code meets strategy.', 'A new standard for', 'play—built together.'],
    description: 'CSE4Seoul is a hybrid community where developers and gamers share technology and tactics, and build projects together.',
    chat: 'Encrypted lobby chat',
    newsEyebrow: 'CLAN NEWS',
    newsTitle: 'Latest updates',
    newsDescription: 'Explore recent clan records and stories from our members.',
    noticesTitle: 'Notices',
    postsTitle: 'Recent posts',
    all: 'All',
    clan: 'Clan',
    development: 'Dev & release',
    events: 'Events',
    viewAll: 'View all',
    noNotice: 'No notices yet.',
    noPosts: 'No posts yet.',
    quickTitle: 'Quick access',
    gallery: 'Hall of fame',
    join: 'Join the clan',
    footerText: 'A technology and tactics community built by developers and gamers',
    privacy: 'Privacy policy',
    searchPlaceholder: 'Search notices and posts',
  },
} as const;

const noticesCategories = [
  { id: 'all', ko: '전체', en: 'All', keywords: [] },
  { id: 'clan', ko: '클랜전', en: 'Clan', keywords: ['클랜', '전투', '전적', 'war', 'clan'] },
  { id: 'development', ko: '개발·배포', en: 'Dev & release', keywords: ['개발', '배포', '업데이트', '서비스', 'dev', 'release'] },
  { id: 'events', ko: '이벤트', en: 'Events', keywords: ['이벤트', '모집', '행사', 'event'] },
] as const;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date).replaceAll('. ', '/').replace('.', '');
}

export default function LandingPortal() {
  const { lang, toggleLanguage } = useLanguage();
  const currentLang = lang === 'en' ? 'en' : 'ko';
  const t = copy[currentLang];
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [noticeCategory, setNoticeCategory] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const primaryHref = user ? '/dashboard' : '/login';
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();

  useEffect(() => {
    let active = true;

    const loadNotices = async () => {
      try {
        const response = await fetch('/api/notice');
        if (!response.ok) throw new Error(`Notice request failed (${response.status})`);
        const body: unknown = await response.json();
        if (!isRecord(body) || !Array.isArray(body.notices)) {
          throw new Error('Notice response has an invalid format');
        }
        if (active) setNotices(body.notices.filter(isNotice));
      } catch (error) {
        console.error('Failed to load notices:', error);
      }
    };

    const loadRecentPosts = async () => {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, title, author_name, created_at')
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) {
        console.error('Failed to load recent posts:', error);
      } else if (active) {
        setRecentPosts(posts ?? []);
      }
    };

    const loadContent = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (active) setUser(currentUser);
      await Promise.all([loadNotices(), loadRecentPosts()]);
    };

    void loadContent().catch((error: unknown) => {
      console.error('Failed to load landing page content:', error);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const filteredNotices = useMemo(() => {
    const category = noticesCategories.find((item) => item.id === noticeCategory);
    return notices.filter((notice) => {
      const text = notice.content.toLocaleLowerCase();
      const matchesCategory = !category || category.keywords.length === 0
        || category.keywords.some((keyword) => text.includes(keyword));
      return matchesCategory && (!normalizedSearch || text.includes(normalizedSearch));
    });
  }, [noticeCategory, notices, normalizedSearch]);

  const filteredPosts = useMemo(() => recentPosts.filter((post) => (
    !normalizedSearch
    || post.title.toLocaleLowerCase().includes(normalizedSearch)
    || post.author_name.toLocaleLowerCase().includes(normalizedSearch)
  )), [normalizedSearch, recentPosts]);

  const featuredPost = filteredPosts[0];
  const secondaryPosts = filteredPosts.slice(1, 4);

  return (
    <main className="min-h-screen overflow-hidden bg-[#080c14] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#080c14]/80 backdrop-blur-md">
        <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="CSE4Seoul home">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/30 bg-blue-500/10 text-cyan-300 shadow-[0_0_24px_rgba(6,182,212,0.12)]">
              <Cpu className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-mono text-sm font-bold tracking-[0.13em] text-white">CSE4SEOUL</span>
              <span className="hidden text-[9px] tracking-[0.2em] text-slate-500 sm:block">DEV &amp; CLAN ARCHIVE</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-5 xl:flex">
            <Link href="/about" className="text-xs text-slate-300 transition hover:text-cyan-300">{t.nav[0]}</Link>
            <a href="#services" className="text-xs text-slate-300 transition hover:text-cyan-300">{t.nav[1]}</a>
            <a href="#updates" className="text-xs text-slate-300 transition hover:text-cyan-300">{t.nav[2]}</a>
            <Link href="/developers" className="text-xs text-slate-300 transition hover:text-cyan-300">{t.nav[3]}</Link>
            <Link href="/dashboard" className="text-xs text-slate-300 transition hover:text-cyan-300">{t.nav[4]}</Link>
            <Link href="/community/inquiries" className="text-xs text-slate-300 transition hover:text-cyan-300">{t.nav[5]}</Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {searchOpen && (
              <input
                autoFocus
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setSearchTerm('');
                    setSearchOpen(false);
                  }
                }}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                className="hidden w-36 rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/60 sm:block sm:w-52"
              />
            )}
            <button
              type="button"
              onClick={() => {
                if (searchOpen) setSearchTerm('');
                setSearchOpen(!searchOpen);
              }}
              aria-label={searchOpen ? 'Close search' : 'Search news'}
              className="hidden rounded-md p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-cyan-300 sm:block"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleLanguage}
              className="hidden font-mono text-[10px] font-semibold tracking-wider text-slate-400 transition hover:text-white sm:inline-flex"
              aria-label={currentLang === 'ko' ? 'Switch to English' : '한국어로 변경'}
            >
              <span className={currentLang === 'ko' ? 'text-white' : ''}>KO</span>
              <span className="px-1 text-slate-600">/</span>
              <span className={currentLang === 'en' ? 'text-white' : ''}>EN</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              className="rounded-md p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white xl:hidden"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 rounded-md border border-blue-400/30 bg-blue-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:border-cyan-300/50 hover:bg-blue-500 sm:px-4"
            >
              {user ? t.dashboard : t.login}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav aria-label="Mobile navigation" className="grid grid-cols-2 gap-1 border-t border-white/[0.07] px-4 py-3 sm:px-6 xl:hidden">
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-cyan-300">{t.nav[0]}</Link>
            <a href="#services" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-cyan-300">{t.nav[1]}</a>
            <a href="#updates" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-cyan-300">{t.nav[2]}</a>
            <Link href="/developers" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-cyan-300">{t.nav[3]}</Link>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-cyan-300">{t.nav[4]}</Link>
            <Link href="/community/inquiries" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-cyan-300">{t.nav[5]}</Link>
            <button type="button" onClick={toggleLanguage} className="rounded-md px-3 py-2.5 text-left font-mono text-[10px] text-slate-400 hover:bg-white/[0.05] hover:text-white">
              KO / EN
            </button>
            <button type="button" onClick={() => setSearchOpen(!searchOpen)} className="inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-white/[0.05] hover:text-cyan-300">
              <Search className="h-3.5 w-3.5" />{t.searchPlaceholder}
            </button>
            {searchOpen && (
              <input
                autoFocus
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                className="col-span-2 rounded-md border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/60 sm:hidden"
              />
            )}
          </nav>
        )}
      </header>

      <section id="hero" className="relative isolate border-b border-white/[0.07]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_30%,rgba(29,78,216,0.22),transparent_38%),radial-gradient(ellipse_at_15%_80%,rgba(6,182,212,0.09),transparent_35%)]" />
        <div className="absolute inset-0 -z-10 opacity-[0.13] [background-image:linear-gradient(rgba(148,163,184,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.24)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:gap-12 lg:px-10 lg:py-24 2xl:grid-cols-12">
          <div className="relative z-10 2xl:col-span-5">
            <p className="mb-6 flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-cyan-300 sm:text-xs">
              <span className="h-px w-7 bg-cyan-400" />{t.eyebrow}
            </p>
            <h1 className="max-w-3xl text-balance text-[clamp(1.5rem,6vw,3.25rem)] font-bold leading-[1.18] tracking-[-0.045em] text-white">
              {t.title.map((line, index) => (
                <span key={line} className={`block whitespace-nowrap ${index === 2 ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-sky-200' : ''}`}>
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-slate-400 sm:text-base sm:leading-8">
              {t.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={primaryHref} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(37,99,235,0.2)] transition hover:bg-blue-500">
                {t.dashboard}<ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/chat" className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.03] px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/[0.06]">
                <MessageSquare className="h-4 w-4 text-cyan-300" />{t.chat}
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/[0.08] pt-5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2"><Code2 className="h-3.5 w-3.5 text-blue-400" />Engineering</span>
              <span className="inline-flex items-center gap-2"><Gamepad2 className="h-3.5 w-3.5 text-cyan-400" />Arena</span>
              <span className="inline-flex items-center gap-2"><Users className="h-3.5 w-3.5 text-amber-400" />Community</span>
            </div>
          </div>

          <div className="relative 2xl:col-span-7">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-blue-500/10 blur-3xl" />
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b111c]/90 shadow-[0_24px_100px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-200">{t.gallery}</span>
                </div>
                <span className="font-mono text-[9px] tracking-[0.16em] text-cyan-400">MOMENT ARCHIVE</span>
              </div>
              <div className="home-moment-gallery">
                <MomentGallery />
              </div>
            </div>
            <Link href="/community/moments" className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-cyan-300">
              {currentLang === 'ko' ? '모든 순간 보기' : 'Explore all moments'}<ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <a href="#updates" aria-label="Scroll to clan news" className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-slate-600 transition hover:text-cyan-300 lg:block">
          <ArrowDown className="h-4 w-4" />
        </a>
      </section>

      <section id="updates" className="scroll-mt-24 border-b border-white/[0.07] bg-[#0a101a]">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-cyan-400">{t.newsEyebrow}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t.newsTitle}</h2>
              <p className="mt-2 text-sm text-slate-500">{t.newsDescription}</p>
            </div>
            <Link href="/community" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 transition hover:text-cyan-300">
              {t.viewAll}<ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <article className="group relative flex min-h-[310px] flex-col justify-end overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-blue-950 via-[#101a2b] to-[#0c111b] p-6 transition duration-300 hover:border-cyan-500/50 sm:p-8 lg:col-span-5 lg:min-h-[400px]">
              <div className="absolute right-[-35px] top-[-60px] h-64 w-64 rounded-full border border-blue-400/10 bg-blue-500/[0.04] shadow-[0_0_100px_rgba(37,99,235,0.12)]" />
              <div className="absolute right-10 top-12 hidden h-36 w-36 rotate-45 border border-cyan-300/15 sm:block">
                <div className="absolute inset-4 border border-blue-400/20" />
              </div>
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded border border-cyan-400/20 bg-cyan-400/[0.07] px-2.5 py-1 font-mono text-[9px] tracking-[0.12em] text-cyan-300">
                  <Sparkles className="h-3 w-3" />{featuredPost ? 'LATEST FROM THE BOARD' : 'CSE4SEOUL / COMMUNITY'}
                </span>
                <h3 className="mt-5 max-w-lg text-2xl font-semibold leading-snug text-white sm:text-3xl">
                  {featuredPost?.title ?? (currentLang === 'ko' ? '기술과 전술, 함께 쌓아가는 클랜의 기록' : 'A shared archive of technology and tactics')}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                  {featuredPost
                    ? `${featuredPost.author_name} · ${formatDate(featuredPost.created_at)}`
                    : (currentLang === 'ko' ? '전략 아카이브에서 최신 게시글과 클랜 소식을 만나보세요.' : 'Explore the latest posts and clan updates in our archive.')}
                </p>
                <Link href={featuredPost && user ? `/board/${featuredPost.id}` : user ? '/board' : '/login'} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition group-hover:gap-3">
                  {currentLang === 'ko' ? '게시글 확인하기' : 'Explore the post'}<ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {secondaryPosts.length > 0 ? secondaryPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={user ? `/board/${post.id}` : '/login'}
                  className="group flex min-h-[190px] flex-col justify-between rounded-xl border border-white/[0.09] bg-[#0c1420] p-5 transition duration-300 hover:border-cyan-500/50 hover:bg-[#0e1928]"
                >
                  <div className="flex items-center justify-between">
                    <span className={`rounded px-2 py-1 font-mono text-[9px] tracking-wider ${index === 0 ? 'bg-amber-400/10 text-amber-300' : 'bg-blue-400/10 text-blue-300'}`}>
                      {index === 0 ? 'CLAN LOG' : 'COMMUNITY'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
                  </div>
                  <div className="mt-8">
                    <h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-100">{post.title}</h3>
                    <p className="mt-3 font-mono text-[10px] text-slate-500">{formatDate(post.created_at)} <span className="px-1.5">/</span> {post.author_name}</p>
                  </div>
                </Link>
              )) : (
                <div className="flex min-h-[190px] flex-col justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.015] p-6 sm:col-span-2">
                  <p className="text-sm font-medium text-slate-300">
                    {featuredPost
                      ? (currentLang === 'ko' ? '추가 게시글이 없습니다.' : 'No additional posts yet.')
                      : t.noPosts}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {currentLang === 'ko' ? '구성원들의 새로운 소식이 이곳에 표시됩니다.' : 'New stories from members will appear here.'}
                  </p>
                  <Link href={user ? '/board' : '/login'} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                    {currentLang === 'ko' ? '전략 아카이브 둘러보기' : 'Explore the archive'}<ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 border-b border-white/[0.07]">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-10 lg:py-20">
          <section aria-labelledby="notices-heading" className="lg:col-span-7">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-blue-300">NOTICE / UPDATE</p>
                <h2 id="notices-heading" className="mt-2 text-2xl font-semibold text-white">{t.noticesTitle}</h2>
              </div>
              <Link href="/community" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-cyan-300">
                {t.viewAll}<ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div role="tablist" aria-label={t.noticesTitle} className="flex gap-5 overflow-x-auto border-b border-white/[0.07] py-3">
              {noticesCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={noticeCategory === category.id}
                  onClick={() => setNoticeCategory(category.id)}
                  className={`shrink-0 text-xs transition ${noticeCategory === category.id ? 'font-semibold text-cyan-300' : 'text-slate-500 hover:text-slate-200'}`}
                >
                  {currentLang === 'ko' ? category.ko : category.en}
                </button>
              ))}
            </div>
            {filteredNotices.length > 0 ? (
              <ul className="divide-y divide-white/[0.06]">
                {filteredNotices.slice(0, 5).map((notice) => (
                  <li key={notice.id}>
                    <Link href="/community" className="group flex items-center gap-4 py-4 transition hover:text-cyan-200">
                      <span className={`shrink-0 rounded px-2 py-1 text-[9px] font-semibold ${notice.is_pinned ? 'bg-amber-400/10 text-amber-300' : 'bg-white/[0.06] text-slate-400'}`}>
                        {notice.is_pinned ? (currentLang === 'ko' ? '중요' : 'PINNED') : (currentLang === 'ko' ? '공지' : 'NOTICE')}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-300 group-hover:text-white">{notice.content}</span>
                      <span className="shrink-0 font-mono text-[9px] text-slate-600">NOTICE</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-sm text-slate-500">{t.noNotice}</p>
            )}
          </section>

          <section aria-labelledby="quick-access-heading" className="lg:col-span-5">
            <div className="mb-5">
              <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-cyan-400">QUICK ACCESS</p>
              <h2 id="quick-access-heading" className="mt-2 text-2xl font-semibold text-white">{t.quickTitle}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: currentLang === 'ko' ? '전적 대시보드' : 'Clan dashboard', detail: '/dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'text-cyan-300' },
                { label: currentLang === 'ko' ? '전략 아카이브' : 'Strategy archive', detail: '/board', href: '/board', icon: BookOpen, color: 'text-blue-300' },
                { label: currentLang === 'ko' ? '비밀 통신 로비' : 'Secure lobby', detail: '/chat', href: '/chat', icon: Shield, color: 'text-emerald-300' },
                { label: t.gallery, detail: '/community/moments', href: '/community/moments', icon: Trophy, color: 'text-amber-300' },
                { label: currentLang === 'ko' ? '구성원 소개' : 'Our members', detail: '/developers', href: '/developers', icon: Users, color: 'text-violet-300' },
                { label: t.join, detail: '/community/inquiries', href: '/community/inquiries?type=membership', icon: MessageSquare, color: 'text-cyan-300' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.detail} href={item.href} className="group rounded-lg border border-white/[0.08] bg-[#0c1420] p-4 transition duration-300 hover:border-cyan-500/50 hover:bg-[#101b29]">
                    <div className="flex items-center justify-between">
                      <Icon className={`h-4 w-4 ${item.color}`} />
                      <ArrowRight className="h-3.5 w-3.5 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                    </div>
                    <p className="mt-4 text-xs font-semibold text-slate-200">{item.label}</p>
                    <p className="mt-1 font-mono text-[9px] text-slate-600">{item.detail}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </section>

      <section className="border-b border-white/[0.07] bg-[radial-gradient(ellipse_at_50%_100%,rgba(29,78,216,0.12),transparent_65%)]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-cyan-400">CSE4SEOUL CLAN</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{currentLang === 'ko' ? '함께 플레이하고, 함께 만들어갈 동료를 찾습니다.' : 'Looking for teammates to build and play together.'}</h2>
            <p className="mt-2 text-sm text-slate-400">{currentLang === 'ko' ? '클랜 가입 및 대항전 문의는 문의 센터에서 확인해 주세요.' : 'Visit the inquiry center for membership and clan battle requests.'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/community/inquiries?type=membership" className="inline-flex w-fit items-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-400/[0.06] px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/60 hover:bg-cyan-400/10">
              {t.join}<ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/community/inquiries#admin-contact" className="inline-flex w-fit items-center gap-2 rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-200">
              {currentLang === 'ko' ? '대항전 등 클랜 교류 문의' : 'Clan battle & exchange inquiry'}<ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#060a11]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:px-10">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300"><Cpu className="h-4 w-4" /></span>
              <span className="font-mono text-xs font-bold tracking-[0.14em] text-white">CSE4SEOUL</span>
            </Link>
            <p className="mt-4 max-w-sm text-xs leading-6 text-slate-500">{t.footerText}</p>
          </div>
          <div>
            <h3 className="font-mono text-[10px] font-bold tracking-[0.16em] text-slate-300">ABOUT</h3>
            <div className="mt-4 flex flex-col gap-3 text-xs text-slate-500">
              <Link href="/about" className="transition hover:text-cyan-300">{t.nav[0]}</Link>
              <Link href="/developers" className="transition hover:text-cyan-300">{t.nav[3]}</Link>
              <Link href="/community/inquiries" className="transition hover:text-cyan-300">{t.nav[5]}</Link>
            </div>
          </div>
          <div>
            <h3 className="font-mono text-[10px] font-bold tracking-[0.16em] text-slate-300">SERVICES</h3>
            <div className="mt-4 flex flex-col gap-3 text-xs text-slate-500">
              <Link href="/dashboard" className="transition hover:text-cyan-300">{t.nav[4]}</Link>
              <Link href="/board" className="transition hover:text-cyan-300">{currentLang === 'ko' ? '전략 아카이브' : 'Strategy archive'}</Link>
              <Link href="/chat" className="transition hover:text-cyan-300">{currentLang === 'ko' ? '비밀 통신 로비' : 'Secure lobby'}</Link>
            </div>
          </div>
          <div>
            <h3 className="font-mono text-[10px] font-bold tracking-[0.16em] text-slate-300">ARCHIVE &amp; CONNECT</h3>
            <div className="mt-4 flex flex-col gap-3 text-xs text-slate-500">
              <Link href="/community" className="transition hover:text-cyan-300">{t.nav[2]}</Link>
              <Link href="/community/moments" className="transition hover:text-cyan-300">{t.gallery}</Link>
              <a href="https://royaleapi.com/clan/RRG9U0C9" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition hover:text-cyan-300">
                RoyaleAPI<ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.07]">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-4 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
            <span>© {new Date().getFullYear()} CSE4SEOUL. {t.footerText}</span>
            <div className="flex items-center gap-5">
              <button type="button" onClick={() => setShowPrivacyModal(true)} className="transition hover:text-slate-300">{t.privacy}</button>
              <span className="font-mono">Powered by CSE4SEOUL Engine</span>
            </div>
          </div>
        </div>
      </footer>

      <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} lang={currentLang} />
    </main>
  );
}
