'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Network, 
  Sparkles, 
  Share2, 
  ShieldCheck, 
  FolderTree, 
  Database,
  ArrowRight
} from 'lucide-react';
import TreeWidget from '@/components/widgets/TreeWidget';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export default function MindMapPage() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
      {/* Background glow orb */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.08),transparent_70%)]" />

      <div className="relative z-10 w-full max-w-7xl flex flex-col gap-6">
        {/* 상단 헤더 및 뒤로가기 내비게이션 */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all font-mono text-xs border border-white/10"
            >
              <ChevronLeft size={16} />
              <span>대시보드로 돌아가기</span>
            </Link>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Network className="text-cyan-400" />
                  KNOWLEDGE & GOAL TREE STUDIO
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                  INTERACTIVE MIND-MAP
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                개인 목표, 컴퓨터공학 지식 체계 및 프로젝트 로드맵을 무한 계층으로 설계하고 관리하세요.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/10 text-neutral-400">
              {user ? `OPERATOR: ${user.email}` : 'GUEST MODE (LOCAL SYNC)'}
            </div>
          </div>
        </div>

        {/* 메인 트리 위젯 컴포넌트 */}
        <TreeWidget isStandalone={true} />

        {/* 하단 기술 스펙 및 안내 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-5 rounded-2xl bg-neutral-950/60 border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold mb-2">
              <Database size={14} />
              <span>POSTGRESQL RECURSIVE CTE</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-light">
              Supabase <code>tree_nodes</code> 테이블의 Parent-Child 외래키와 재귀 공통 테이블 표현식(Recursive CTE)으로 무한 뎁스 계층을 고속 쿼리합니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-950/60 border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-violet-400 font-mono text-xs font-bold mb-2">
              <FolderTree size={14} />
              <span>DUAL INTERACTIVE VIEWS</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-light">
              SVG 베지에 곡선 기반의 <strong>Mind-Map Canvas</strong> 뷰와 폴더 트리 형태의 <strong>Tree Outline</strong> 뷰를 자유롭게 토글하여 목표를 구조화합니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-950/60 border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold mb-2">
              <ShieldCheck size={14} />
              <span>SEAMLESS LIVE SYNC</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-light">
              실시간 드래그 앤 드롭 재부모화(Reparenting), 세부 계획 마크다운 메모, 참고 리소스 링크 및 서브태스크 진행률이 자동 동기화됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
