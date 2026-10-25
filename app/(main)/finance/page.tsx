import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Wallet, Receipt, Percent, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react';

export default async function FinanceHubPage() {
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
              PERSONAL FINANCE HUB
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Wallet className="w-7 h-7 text-cyan-400" />
            개인 재무 & 자산 관리실
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            근로 소득, 프리랜서 원천징수(3.3%) 및 4대보험 실질급여 계산부터 세금 환급 혜택까지 체계적으로 관리하세요.
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

      {/* 2대 재무 핵심 도메인 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 1. 가계부 & 실질급여 카드 */}
        <div className="group relative rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-black to-neutral-950 p-6 sm:p-8 hover:border-cyan-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Receipt className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                CORE TOOL
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">실질급여 & 가계부 장부</h2>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              알바, 일당, 프리랜서 용역 및 정규 급여의 세전/세후 실지급액을 자동 역산하고 지출 내역을 월별/카테고리별로 기록·분석합니다.
            </p>
          </div>

          <Link
            href="/finance/account-book"
            className="w-full py-3 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white font-bold text-xs border border-cyan-500/40 flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/10 group-hover:scale-[1.01]"
          >
            <span>가계부 관리실 입장하기</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 2. 세금 납부 & 환급 트래커 카드 */}
        <div className="group relative rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 via-black to-neutral-950 p-6 sm:p-8 hover:border-indigo-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Percent className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                TAX SIMULATOR
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">세금 혜택 & 환급 비교 트래커</h2>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              연간 세금 납부 예상액과 청년/근로장려금, 연말정산 공제 혜택을 시뮬레이션하여 절세 플랜을 수립합니다.
            </p>
          </div>

          <Link
            href="/finance/tax"
            className="w-full py-3 px-4 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-white font-bold text-xs border border-indigo-500/40 flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/10 group-hover:scale-[1.01]"
          >
            <span>세금 혜택 트래커 입장하기</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
