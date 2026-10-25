'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  Cpu, 
  Wallet, 
  TrendingUp, 
  BookOpen, 
  MessageSquare, 
  Settings, 
  LogOut, 
  ChevronDown,
  LayoutDashboard,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  matchPrefix: string;
  badge?: string;
  subItems?: { name: string; href: string; desc: string }[];
}

export default function MainNavbar() {
  const rawPathname = usePathname();
  const pathname = rawPathname || '';
  const [user, setUser] = useState<User | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const navItems: NavItem[] = [
    {
      name: '대시보드',
      href: '/dashboard',
      matchPrefix: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      name: '개인 재무',
      href: '/finance',
      matchPrefix: '/finance',
      icon: <Wallet className="w-4 h-4" />,
      subItems: [
        { name: '가계부 & 실질급여', href: '/finance/account-book', desc: '세금 공제 계산 및 지출 통계' },
        { name: '세금 혜택 트래커', href: '/finance/tax', desc: '환급 및 공제 혜택 모니터링' },
      ]
    },
    {
      name: '시장 & 투자',
      href: '/market',
      matchPrefix: '/market',
      icon: <TrendingUp className="w-4 h-4" />,
      subItems: [
        { name: '시장 종합 개요', href: '/market', desc: '원/달러 환율 및 주요 지표' },
        { name: 'ETF 실시간 iNAV', href: '/market/etf', desc: '실시간 추정 괴리율 추적기' },
        { name: '관심 종목', href: '/market/watchlist', desc: '개인화 주식 워치리스트' },
        { name: '가치 & 기술 분석', href: '/market/analysis', desc: '스코어링 및 보조지표 차트' },
      ]
    },
    {
      name: '지식 & 학습',
      href: '/learning',
      matchPrefix: '/learning',
      icon: <BookOpen className="w-4 h-4" />,
      subItems: [
        { name: '학습 허브 홈', href: '/learning', desc: '오늘의 학습 목표 및 진행 현황' },
        { name: '목표 & 지식 마인드맵', href: '/mindmap', desc: '무한 계층형 트리 스튜디오' },
        { name: '매일 공부 기록', href: '/learning/study', desc: '복습 주기 및 TXT 추출' },
        { name: '북 트래커', href: '/book-tracker', desc: '독서 진도 및 핵심 구절' },
      ]
    },
    {
      name: '커뮤니티',
      href: '/community',
      matchPrefix: '/community',
      icon: <MessageSquare className="w-4 h-4" />,
      subItems: [
        { name: '커뮤니티 라운지', href: '/community', desc: '클랜 소식 및 활동 현황' },
        { name: '전술 기록 게시판', href: '/board', desc: '작전 회의록 및 지식 공유' },
        { name: '보안 전략 통신실', href: '/chat', desc: 'AES-256 암호화 실시간 채팅' },
        { name: '익명 로비 채팅', href: '/community/lobby', desc: '자유로운 실시간 로비' },
        { name: '동물농장 🐾', href: '/animal-farm', desc: '나만의 동물 친구 힐링 공간' },
      ]
    }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-black/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* 로고 & 메인 링크 */}
        <div className="flex items-center gap-6">
          <Link 
            href={user ? "/dashboard" : "/"} 
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30 group-hover:scale-105 transition-transform">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-widest text-white uppercase font-mono">CSE4SEOUL</span>
              <span className="text-[9px] text-cyan-400 font-mono tracking-wider font-semibold">HQ CONTROL</span>
            </div>
          </Link>

          {/* 데스크톱 네비게이션 링크 */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.matchPrefix !== '/dashboard' && pathname.startsWith(item.matchPrefix));
              const hasDropdown = Boolean(item.subItems && item.subItems.length > 0);

              return (
                <div 
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => hasDropdown && setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive 
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                    {hasDropdown && (
                      <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                    )}
                  </Link>

                  {/* 서브 드롭다운 메뉴 */}
                  {hasDropdown && activeDropdown === item.name && (
                    <div className="absolute top-full left-0 pt-2 w-64 z-50">
                      <div className="rounded-xl border border-white/10 bg-neutral-950/95 backdrop-blur-2xl p-2 shadow-2xl flex flex-col gap-1">
                        {item.subItems?.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => setActiveDropdown(null)}
                              className={`p-2.5 rounded-lg text-left transition-all ${
                                isSubActive
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'hover:bg-white/[0.06] text-neutral-300 hover:text-white'
                              }`}
                            >
                              <div className="text-xs font-semibold">{sub.name}</div>
                              <div className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{sub.desc}</div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* 우측 유저 액션 & 설정 */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/settings"
                className={`p-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 border ${
                  pathname.startsWith('/settings')
                    ? 'bg-neutral-800 text-white border-neutral-600'
                    : 'bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] border-white/10'
                }`}
                title="설정 및 계정 관리"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">설정</span>
              </Link>

              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="p-2 rounded-lg text-xs bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-800/40 transition-colors flex items-center gap-1.5"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">로그아웃</span>
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all"
            >
              로그인 / 시스템 접속
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
