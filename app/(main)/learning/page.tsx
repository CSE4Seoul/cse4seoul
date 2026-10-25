import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Network, Clock, Bookmark, ChevronLeft, ArrowRight, Sparkles } from 'lucide-react';

export default async function LearningHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* 상단 네비게이션 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
              KNOWLEDGE & STUDY SUITE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-cyan-400" />
            지식 체계 & 학습 관리 허브
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            개인 컴퓨터공학 지식 마인드맵, 매일 학습 일지 작성 및 복습 주기, 독서 진도를 한곳에서 연계 관리하세요.
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

      {/* 3대 학습 도구 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 1. 마인드맵 스튜디오 */}
        <div className="group rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-black to-neutral-950 p-6 hover:border-cyan-500/40 transition-all flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Network className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                CANVAS
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">목표 & 지식 마인드맵</h2>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              무한 뎁스 계층형 트리 캔버스에서 CS 개념, 커리어 목표, 프로젝트 구조를 시각적으로 매핑하고 확장하세요.
            </p>
          </div>

          <Link
            href="/mindmap"
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-500/40 flex items-center justify-center gap-2 transition-all group-hover:scale-[1.01]"
          >
            <span>마인드맵 스튜디오 열기</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 2. 매일 공부 기록 */}
        <div className="group rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/20 via-black to-neutral-950 p-6 hover:border-blue-500/40 transition-all flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                DAILY LOG
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">매일 공부 기록 & TXT 추출</h2>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              오늘 학습한 내용과 코딩 노트를 기록하고 에빙하우스 망각곡선 기반의 복습 알림 및 TXT 백업을 지원합니다.
            </p>
          </div>

          <Link
            href="/learning/study"
            className="w-full py-2.5 px-4 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs border border-blue-500/40 flex items-center justify-center gap-2 transition-all group-hover:scale-[1.01]"
          >
            <span>공부 기록실 열기</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 3. 북 트래커 */}
        <div className="group rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-950/20 via-black to-neutral-950 p-6 hover:border-teal-500/40 transition-all flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Bookmark className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                BOOK LOG
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">북 트래커 & 독서 로그</h2>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              기술 서적과 전공 서적의 읽기 진도율을 추적하고 중요 구절 및 통찰을 템플릿별로 저장하세요.
            </p>
          </div>

          <Link
            href="/book-tracker"
            className="w-full py-2.5 px-4 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs border border-teal-500/40 flex items-center justify-center gap-2 transition-all group-hover:scale-[1.01]"
          >
            <span>북 트래커 열기</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
