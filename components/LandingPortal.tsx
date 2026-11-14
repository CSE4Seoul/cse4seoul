'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Code2,
  Cpu,
  ExternalLink,
  MessageSquare,
  Shield,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
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
    nav: { about: '소개', services: '서비스', updates: '소식', members: '구성원', community: '커뮤니티', inquiry: '문의' },
    login: '로그인',
    dashboard: '대시보드',
    eyebrow: '개발과 게임을 함께하는 커뮤니티',
    titleLine1: '배우고 나누며,',
    titleLine2: '함께 성장하는 공간',
    description: 'CSE4Seoul은 개발자와 게이머가 지식과 관심사를 나누고, 함께 활동할 수 있도록 만든 커뮤니티 플랫폼입니다.',
    explore: '서비스 둘러보기',
    joinChat: '로비 채팅 참여',
    introTitle: '관심사를 연결하는 하나의 커뮤니티',
    introText: '학습 도구부터 커뮤니티 활동까지, 필요한 기능을 목적에 따라 찾고 사용할 수 있도록 구성했습니다.',
    servicesLabel: '서비스',
    servicesTitle: '필요한 기능을 한곳에서',
    servicesDescription: '개인 학습과 생활 관리, 시장 정보, 커뮤니티 활동을 지원합니다.',
    serviceItems: [
      { title: '개인 재무', description: '수입과 지출을 기록하고 급여·세금 관련 정보를 확인합니다.', href: '/finance', link: '재무 서비스 보기', icon: Wallet },
      { title: '시장 정보', description: '시장 지표와 관심 종목 정보를 한 화면에서 살펴봅니다.', href: '/market', link: '시장 정보 보기', icon: TrendingUp },
      { title: '학습 도구', description: '학습 목표와 기록을 관리하고 지식을 구조화합니다.', href: '/learning', link: '학습 도구 보기', icon: BookOpen },
      { title: '커뮤니티', description: '게시판과 실시간 로비에서 구성원들과 소통합니다.', href: '/community', link: '커뮤니티 둘러보기', icon: MessageSquare },
    ],
    updatesLabel: '커뮤니티 소식',
    updatesTitle: '공지와 최근 게시글',
    noticesTitle: '공지사항',
    postsTitle: '최근 게시글',
    viewAll: '전체 보기',
    noNotice: '등록된 공지가 없습니다.',
    noPosts: '아직 게시글이 없습니다.',
    chatTitle: '실시간 로비',
    chatText: '가벼운 인사부터 함께 나누는 이야기까지, 로비에서 자유롭게 대화해 보세요.',
    chatLink: '로비 입장',
    inquiryTitle: '가입 또는 대항전 문의',
    inquiryText: '가입 신청과 클랜 대항전 제안은 문의 센터에서 접수하고 진행 상태를 확인할 수 있습니다.',
    membership: '가입 문의',
    clanBattle: '대항전 문의',
    adminContact: '운영진에게 문의',
    clanTitle: '공식 클래시로얄 클랜',
    clanDescription: '클랜 가입과 활동에 대한 자세한 정보는 클랜 페이지에서 확인할 수 있습니다.',
    clanLink: 'RoyaleAPI에서 클랜 보기',
    aboutLabel: 'CSE4SEOUL',
    aboutTitle: '함께 만드는 건강한 기술 커뮤니티',
    aboutText: '개발과 학습, 게임이라는 공통 관심사를 중심으로 서로의 경험을 나누고 새로운 활동을 만들어 갑니다.',
    teamLink: '개발 구성원 소개',
    privacy: '개인정보 처리방침',
    footerText: '개발과 게임을 좋아하는 사람들을 위한 커뮤니티',
    announcement: '공지',
    pinned: '중요',
  },
  en: {
    nav: { about: 'About', services: 'Services', updates: 'Updates', members: 'Team', community: 'Community', inquiry: 'Inquiries' },
    login: 'Sign in',
    dashboard: 'Dashboard',
    eyebrow: 'A community for building and playing together',
    titleLine1: 'Learn, share, and',
    titleLine2: 'grow together',
    description: 'CSE4Seoul is a community platform where developers and gamers share knowledge, interests, and activities.',
    explore: 'Explore services',
    joinChat: 'Join the lobby',
    introTitle: 'One community for shared interests',
    introText: 'Find tools for learning and everyday workflows alongside community spaces for conversation and collaboration.',
    servicesLabel: 'Services',
    servicesTitle: 'Useful tools in one place',
    servicesDescription: 'Tools for personal learning, everyday finance, market information, and community activities.',
    serviceItems: [
      { title: 'Personal finance', description: 'Track income and expenses and review wage and tax information.', href: '/finance', link: 'Explore finance', icon: Wallet },
      { title: 'Market information', description: 'Review market indicators and watchlist information in one place.', href: '/market', link: 'Explore markets', icon: TrendingUp },
      { title: 'Learning tools', description: 'Organize learning goals, study records, and knowledge.', href: '/learning', link: 'Explore learning', icon: BookOpen },
      { title: 'Community', description: 'Connect with members through boards and the live lobby.', href: '/community', link: 'Explore community', icon: MessageSquare },
    ],
    updatesLabel: 'Community updates',
    updatesTitle: 'Announcements and recent posts',
    noticesTitle: 'Announcements',
    postsTitle: 'Recent posts',
    viewAll: 'View all',
    noNotice: 'No announcements yet.',
    noPosts: 'No posts yet.',
    chatTitle: 'Live lobby',
    chatText: 'Drop by the lobby to say hello and talk with the community.',
    chatLink: 'Enter the lobby',
    inquiryTitle: 'Membership and clan battle inquiries',
    inquiryText: 'Submit a membership request or clan battle proposal and follow its status in the inquiry center.',
    membership: 'Membership',
    clanBattle: 'Clan battle',
    adminContact: 'Contact the team',
    clanTitle: 'Official Clash Royale clan',
    clanDescription: 'Visit the clan page for details about membership and activities.',
    clanLink: 'View clan on RoyaleAPI',
    aboutLabel: 'CSE4SEOUL',
    aboutTitle: 'A community built around technology',
    aboutText: 'We bring people together around shared interests in development, learning, and games.',
    teamLink: 'Meet the team',
    privacy: 'Privacy policy',
    footerText: 'A community for people who enjoy building and playing',
    announcement: 'Announcement',
    pinned: 'Pinned',
  },
} as const;

export default function LandingPortal() {
  const { lang, toggleLanguage } = useLanguage();
  const currentLang = lang === 'en' ? 'en' : 'ko';
  const t = copy[currentLang];
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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

  const latestNotice = notices.find((notice) => notice.is_pinned) ?? notices[0];
  const primaryHref = user ? '/dashboard' : '/login';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {latestNotice && (
        <div className="border-b border-slate-200 bg-slate-100">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
            <span className="shrink-0 rounded bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">{t.announcement}</span>
            <p className="truncate text-slate-700">{latestNotice.content}</p>
            <Link href="/community" className="ml-auto hidden shrink-0 text-xs font-semibold text-slate-700 hover:text-sky-700 sm:inline">
              {t.viewAll}
            </Link>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="CSE4Seoul home">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Cpu className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.12em] text-slate-900">CSE4SEOUL</span>
              <span className="hidden text-[10px] tracking-wide text-slate-500 sm:block">Community platform</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
            <a href="#about" className="text-sm text-slate-600 transition hover:text-sky-700">{t.nav.about}</a>
            <a href="#services" className="text-sm text-slate-600 transition hover:text-sky-700">{t.nav.services}</a>
            <a href="#updates" className="text-sm text-slate-600 transition hover:text-sky-700">{t.nav.updates}</a>
            <Link href="/developers" className="text-sm text-slate-600 transition hover:text-sky-700">{t.nav.members}</Link>
            <Link href="/community" className="text-sm text-slate-600 transition hover:text-sky-700">{t.nav.community}</Link>
            <Link href="/community/inquiries" className="text-sm text-slate-600 transition hover:text-sky-700">{t.nav.inquiry}</Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              aria-label={currentLang === 'ko' ? 'Switch to English' : '한국어로 변경'}
            >
              {currentLang === 'ko' ? 'KO / EN' : 'EN / KO'}
            </button>
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 sm:px-4 sm:text-sm"
            >
              {user ? t.dashboard : t.login}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section id="about" className="scroll-mt-20 border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-sky-800">{t.eyebrow}</p>
            <h1 className="max-w-3xl text-balance text-3xl font-semibold leading-[1.25] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              <span className="block">{t.titleLine1}</span>
              <span className="block">{t.titleLine2}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg">
              {t.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#services" className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                {t.explore}<ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/community/lobby" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
                <MessageSquare className="h-4 w-4" />{t.joinChat}
              </Link>
              <Link href="/community/inquiries" className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-slate-700 transition hover:text-sky-800">
                {t.nav.inquiry}<ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-sky-800 ring-1 ring-slate-200">
                <Code2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">CSE4Seoul</p>
                <h2 className="mt-0.5 text-base font-semibold text-slate-900">{t.introTitle}</h2>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">{t.introText}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { label: currentLang === 'ko' ? '배우기' : 'Learn', detail: currentLang === 'ko' ? '학습 도구와 기록' : 'Tools and study records' },
                { label: currentLang === 'ko' ? '소통하기' : 'Connect', detail: currentLang === 'ko' ? '게시판과 실시간 로비' : 'Boards and live lobby' },
                { label: currentLang === 'ko' ? '함께하기' : 'Participate', detail: currentLang === 'ko' ? '가입·대항전 문의' : 'Membership and clan events' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-md bg-white px-4 py-3 ring-1 ring-slate-200">
                  <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                  <span className="text-right text-xs text-slate-500">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-800">{t.servicesLabel}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{t.servicesTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{t.servicesDescription}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.serviceItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.href} className="flex min-h-[230px] flex-col rounded-lg border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  <Link href={user ? item.href : '/login'} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-800 hover:text-sky-700">
                    {item.link}<ChevronRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="updates" className="scroll-mt-20 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-800">{t.updatesLabel}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{t.updatesTitle}</h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <section aria-labelledby="announcements-heading">
              <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 id="announcements-heading" className="text-base font-semibold text-slate-900">{t.noticesTitle}</h3>
                <Link href="/community" className="text-xs font-semibold text-sky-800 hover:text-sky-700">{t.viewAll}</Link>
              </div>
              {notices.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {notices.slice(0, 4).map((notice) => (
                    <li key={notice.id}>
                      <Link href="/community" className="flex items-start gap-3 py-3.5 text-sm leading-5 text-slate-700 hover:text-sky-800">
                        {notice.is_pinned && <span className="mt-0.5 shrink-0 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">{t.pinned}</span>}
                        <span className="line-clamp-2">{notice.content}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-sm text-slate-500">{t.noNotice}</p>
              )}
            </section>

            <section aria-labelledby="recent-posts-heading">
              <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 id="recent-posts-heading" className="text-base font-semibold text-slate-900">{t.postsTitle}</h3>
                <Link href={user ? '/board' : '/login'} className="text-xs font-semibold text-sky-800 hover:text-sky-700">{t.viewAll}</Link>
              </div>
              {recentPosts.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {recentPosts.map((post) => (
                    <li key={post.id}>
                      <Link href={user ? `/board/${post.id}` : '/login'} className="flex items-center justify-between gap-4 py-3.5 text-sm hover:text-sky-800">
                        <span className="truncate font-medium text-slate-700">{post.title}</span>
                        <span className="shrink-0 text-xs text-slate-500">{post.author_name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-sm text-slate-500">{t.noPosts}</p>
              )}
            </section>
          </div>
        </div>
      </section>

      <section id="community" className="scroll-mt-20">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8 lg:py-20">
          <article className="rounded-lg border border-slate-200 bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700"><MessageSquare className="h-5 w-5" /></span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{t.chatTitle}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{t.chatText}</p>
            <Link href="/community/lobby" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:text-sky-700">
              {t.chatLink}<ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700"><Shield className="h-5 w-5" /></span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{t.inquiryTitle}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{t.inquiryText}</p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-sky-800">
              <Link href="/community/inquiries?type=membership" className="hover:text-sky-700">{t.membership}</Link>
              <Link href="/community/inquiries?type=clan_battle" className="hover:text-sky-700">{t.clanBattle}</Link>
              <Link href="/community/inquiries#admin-contact" className="hover:text-sky-700">{t.adminContact}</Link>
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-slate-900 p-6 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-white"><Shield className="h-5 w-5" /></span>
            <h2 className="mt-4 text-lg font-semibold">{t.clanTitle}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-300">{t.clanDescription}</p>
            <a href="https://royaleapi.com/clan/RRG9U0C9" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-sky-200">
              {t.clanLink}<ExternalLink className="h-4 w-4" />
            </a>
          </article>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-800">{t.aboutLabel}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{t.aboutTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t.aboutText}</p>
          </div>
          <Link
            href="/developers"
            className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {t.teamLink}<ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="font-semibold tracking-wide text-white">CSE4SEOUL</p>
            <p className="mt-1 text-xs text-slate-400">{t.footerText}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <button type="button" onClick={() => setShowPrivacyModal(true)} className="hover:text-white">{t.privacy}</button>
            <Link href="/developers" className="hover:text-white">{t.nav.members}</Link>
            <Link href="/community/inquiries" className="hover:text-white">{t.nav.inquiry}</Link>
            <Link href={primaryHref} className="hover:text-white">{user ? t.dashboard : t.login}</Link>
          </div>
        </div>
      </footer>

      <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} lang={currentLang} />
    </main>
  );
}
