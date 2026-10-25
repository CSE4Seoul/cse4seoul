import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { 
  MessageSquare, 
  FileText, 
  Shield, 
  Sparkles, 
  AlertTriangle, 
  Trophy, 
  ChevronLeft, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default async function CommunityHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* 상단 네비게이션 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-950/60 text-pink-400 border border-pink-800/50">
              CLAN & COMMUNITY HUB
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-pink-400" />
            클랜 & 커뮤니티 라운지
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            CSE4Seoul 클랜원들의 전략 전술 토론, 보안 채팅, 자유 로비 및 클랜 명예의 전당 공간입니다.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-medium transition-all w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>대시보드로 돌아가기</span>
        </Link>
      </div>

      {/* 4대 주요 커뮤니티 섹션 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* 1. 전술 게시판 */}
        <Link
          href="/board"
          className="group rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/20 via-black to-neutral-950 p-6 hover:border-blue-500/40 transition-all flex flex-col justify-between shadow-xl"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2 flex items-center justify-between">
              <span>전술 기록 게시판</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              작전 회의록, 개발 아키텍처 토론 및 클랜 덱 전략을 영구 보존하고 공유합니다.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/5 text-[11px] font-mono text-blue-400 font-bold">
            게시판 바로가기 →
          </div>
        </Link>

        {/* 2. 보안 전략 통신실 */}
        <Link
          href="/chat"
          className="group rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-black to-neutral-950 p-6 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-xl"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2 flex items-center justify-between">
              <span>보안 전략 통신실</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              AES-256 종단간 암호화와 24시간 자동 폭파 타이머가 적용된 익명 작전 회의실입니다.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/5 text-[11px] font-mono text-emerald-400 font-bold">
            암호화 통신실 입장 →
          </div>
        </Link>

        {/* 3. 익명 로비 채팅 */}
        <Link
          href="/community/lobby"
          className="group rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-black to-neutral-950 p-6 hover:border-cyan-500/40 transition-all flex flex-col justify-between shadow-xl"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2 flex items-center justify-between">
              <span>익명 로비 채팅실</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              로그인 여부와 상관없이 자유롭게 실시간 수다와 캔버스 그림 퀴즈를 즐기는 로비입니다.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/5 text-[11px] font-mono text-cyan-400 font-bold">
            로비 채팅 입장 →
          </div>
        </Link>

        {/* 4. 동물농장 */}
        <Link
          href="/animal-farm"
          className="group rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/20 via-black to-neutral-950 p-6 hover:border-rose-500/40 transition-all flex flex-col justify-between shadow-xl"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl mb-4">
              🐾
            </div>
            <h2 className="text-lg font-bold text-white mb-2 flex items-center justify-between">
              <span>조의ver 동물농장</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              나만의 동물 친구들과 함께하는 힐링 미니게임 공간. 탐험, 상점, 포인트 육성을 즐기세요.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/5 text-[11px] font-mono text-rose-400 font-bold">
            동물농장 놀러가기 →
          </div>
        </Link>

        {/* 5. 영광의 순간 갤러리 */}
        <Link
          href="/community/moments"
          className="group rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-black to-neutral-950 p-6 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-xl"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2 flex items-center justify-between">
              <span>영광의 순간 갤러리</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              클랜 리그전 우승 및 전설 승급 순간의 하이라이트 스크린샷 아카이브입니다.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/5 text-[11px] font-mono text-amber-400 font-bold">
            갤러리 감상하기 →
          </div>
        </Link>

        {/* 6. 비매너 박제소 (Hall of Shame) */}
        <Link
          href="/community/shame"
          className="group rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/20 via-black to-neutral-950 p-6 hover:border-red-500/40 transition-all flex flex-col justify-between shadow-xl"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2 flex items-center justify-between">
              <span>비매너 박제소 (Hall of Shame)</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              잠수, 클랜전 불참, 트롤링 행위를 영구 박제하여 건전한 클랜 문화를 수호합니다.
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-white/5 text-[11px] font-mono text-red-400 font-bold">
            블랙리스트 조회 →
          </div>
        </Link>
      </div>
    </div>
  );
}
