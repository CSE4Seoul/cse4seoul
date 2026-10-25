import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { TrendingUp, Layers, Eye, Activity, ChevronLeft, ArrowRight } from 'lucide-react';
import ExchangeRateWidget from '@/components/ExchangeRateWidget';

export default async function MarketHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* 상단 네비게이션 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
              GLOBAL MARKET & ETF RADAR
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            시장 & 투자 분석 허브
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            원/달러 실시간 환율, 미국 야간 선물 지표, ETF 실시간 추정 iNAV와 기술적 차트 분석을 제공합니다.
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

      {/* 3대 투자 분석실 바로가기 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Link
          href="/market/etf"
          className="group rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] p-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-lg"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
              <span>ETF 실시간 iNAV</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-neutral-400 line-clamp-2">
              장 마감 후 및 야간 시간대의 실시간 추정 iNAV와 괴리율을 추적합니다.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-emerald-400 font-bold">
            실시간 괴리율 분석 →
          </div>
        </Link>

        <Link
          href="/market/watchlist"
          className="group rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] p-5 hover:border-cyan-500/40 transition-all flex flex-col justify-between shadow-lg"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
              <span>관심 종목 워치리스트</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-neutral-400 line-clamp-2">
              개인 맞춤형 미국/한국 관심 주식을 등록하고 가격 변동을 모니터링합니다.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-cyan-400 font-bold">
            개인 워치리스트 →
          </div>
        </Link>

        <Link
          href="/market/analysis"
          className="group rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] p-5 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-lg"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
              <span>가치 & 기술적 분석실</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-neutral-400 line-clamp-2">
              C++ WASM 기반의 고속 기술 지표 계산과 밸류에이션 펀더멘털 스코어를 제공합니다.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-purple-400 font-bold">
            심층 차트 분석 →
          </div>
        </Link>
      </div>

      {/* 실시간 환율 및 마켓 지표 위젯 */}
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 sm:p-6 shadow-2xl">
        <ExchangeRateWidget lang="ko" />
      </div>
    </div>
  );
}
