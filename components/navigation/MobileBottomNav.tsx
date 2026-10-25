'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  BookOpen, 
  MessageSquare, 
  Settings 
} from 'lucide-react';

export default function MobileBottomNav() {
  const rawPathname = usePathname();
  const pathname = rawPathname || '';

  // 로그인 화면이나 공개 소개(특정 랜딩 페이지) 등에서는 표시하지 않을 수도 있지만,
  // 메인 애플리케이션 진입 후 모바일 내비게이션을 위해 lg 미만에서 표시
  if (pathname === '/login' || pathname.startsWith('/auth')) {
    return null;
  }

  const items = [
    {
      name: '홈',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard'
    },
    {
      name: '재무',
      href: '/finance',
      icon: Wallet,
      active: pathname.startsWith('/finance')
    },
    {
      name: '마켓',
      href: '/market',
      icon: TrendingUp,
      active: pathname.startsWith('/market')
    },
    {
      name: '학습',
      href: '/learning',
      icon: BookOpen,
      active: pathname.startsWith('/learning') || pathname.startsWith('/mindmap') || pathname.startsWith('/book-tracker')
    },
    {
      name: '소통',
      href: '/community',
      icon: MessageSquare,
      active: pathname.startsWith('/community') || pathname.startsWith('/board') || pathname.startsWith('/chat')
    },
    {
      name: '설정',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings')
    }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/[0.08] px-2 py-1.5 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                item.active
                  ? 'text-cyan-400 font-bold scale-105'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${item.active ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : ''}`} />
              <span className="text-[10px] tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
