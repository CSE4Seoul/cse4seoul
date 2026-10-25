import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Activity, Cpu } from 'lucide-react';
import ValueScoreWidget from '@/components/ValueScoreWidget';
import TechnicalAnalysisWidget from '@/components/TechnicalAnalysisWidget';

export default async function MarketAnalysisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 상단 브레드크럼 & 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/market"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>마켓 허브</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            가치 투자 & 기술적 차트 분석실
          </h1>
        </div>

        <Link
          href="/dashboard"
          className="text-xs text-neutral-400 hover:text-white transition-colors"
        >
          대시보드로 가기 →
        </Link>
      </div>

      {/* 가치 평가 점수 위젯 */}
      <div className="w-full">
        <ValueScoreWidget />
      </div>

      {/* C++ WASM 기술적 분석 위젯 */}
      <div className="w-full">
        <TechnicalAnalysisWidget />
      </div>
    </div>
  );
}
