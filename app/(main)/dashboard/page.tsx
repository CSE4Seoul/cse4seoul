import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Zap, ChevronLeft, UserCircle } from 'lucide-react';
import { Settings } from 'lucide-react';
import LobbyChatWidget from '@/components/LobbyChatWidget';
import WatchlistSection from '@/components/WatchlistSection';
import ValueScoreWidget from '@/components/ValueScoreWidget';
import TechnicalAnalysisWidget from '@/components/TechnicalAnalysisWidget';
import EtfTrackerWidget from '@/components/EtfTrackerWidget';
import DeleteAccountWidget from '@/components/DeleteAccountWidget';

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. 로그인 체크
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  // 2. 프로필 정보 가져오기
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden">
      {/* 동물농장 플로팅 위젯 */}
      <Link
        href="/animal-farm"
        className="fixed bottom-10 right-10 z-50 group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-110"
      >
        <div className="relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-pink-600 text-[10px] font-black px-2 py-1 rounded-full shadow-lg border border-pink-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            놀러와! 🐾
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 border-4 border-white shadow-[0_0_20px_rgba(236,72,153,0.4)] flex items-center justify-center text-3xl group-hover:animate-bounce transition-all">
            🐶
          </div>
        </div>
        <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-pink-600 border border-pink-100 shadow-sm">
          동물농장
        </span>
      </Link>

      {/* 배경 데코레이션 */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] -z-10" />

      <div className="max-w-5xl mx-auto z-10 relative">
        {/* 상단 네비게이션 바 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="group flex items-center gap-2 px-4 py-2 text-sm text-gray-300 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg hover:bg-blue-900/30 hover:border-blue-700/50 hover:text-blue-300 transition-all duration-200 w-fit shadow-lg"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>메인 페이지로</span>
          </Link>

          {/* 실시간 상태 표시 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-lg">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-gray-400">실시간 업데이트 중</span>
          </div>
        </div>

        {/* 헤더 섹션 */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-gray-800 pb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Command Center
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-900/50 text-blue-300 border border-blue-800">
                KERNEL v1.0
              </span>
            </div>
            <p className="text-gray-400">
              Welcome back, Operator {profile?.full_name || user.email?.split('@')[0]}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* 소속 대학 뱃지 */}
            {profile?.university && (
              <span className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm font-bold text-gray-200 shadow-lg flex items-center gap-2">
                🏫 {profile.university}
              </span>
            )}

            {/* 채팅 바로가기 버튼 */}
            <Link
              href="/chat"
              className="px-4 py-2 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-500 hover:to-cyan-500 border border-blue-500/50 rounded-lg text-sm font-medium text-white shadow-lg flex items-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>전략 통신실</span>
            </Link>

            <span className="px-3 py-1 bg-green-950/50 text-green-400 text-xs rounded-full border border-green-900 flex items-center gap-2 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
              System Online
            </span>
          </div>
        </header>

        {/* 메인 대시보드 그리드 (2열로 축소 조정) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. 내 프로필 카드 */}
          <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 p-8 rounded-2xl hover:border-blue-500/30 transition-all duration-300 group shadow-xl relative">
            <Link 
              href="/profile-setup" 
              className="absolute top-6 right-6 p-2 bg-gray-800/50 hover:bg-emerald-600/20 text-gray-400 hover:text-emerald-400 rounded-lg transition-colors border border-transparent hover:border-emerald-500/30"
              title="프로필 설정"
            >
              <Settings className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold shadow-lg text-white">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-mono text-gray-500 bg-black/40 px-2 py-1 rounded border border-gray-800 w-fit">
                  UID: {user?.id ? `${user.id.slice(0, 8)}...` : 'Loading...'}
                </span>
              </div>
            </div>

            <h3 className="text-gray-500 text-xs font-bold tracking-wider mb-1">OPERATOR IDENTITY</h3>
            <div className="text-2xl font-bold text-white mb-1">{profile?.full_name || 'Unknown Agent'}</div>
            <div className="text-blue-400 text-sm font-medium mb-6">{profile?.role || 'No Role Assigned'}</div>

            <div className="space-y-3 pt-4 border-t border-gray-800/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">University</span>
                <span className="text-gray-300">{profile?.university || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-300">{profile?.email || '-'}</span>
              </div>
              {profile?.clash_royale_tag && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">CR Tag</span>
                  <span className="text-yellow-400 font-mono">{profile.clash_royale_tag}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. 시스템 로그 */}
          <div className="bg-black/60 border border-gray-800 p-8 rounded-2xl flex flex-col font-mono text-xs shadow-xl min-h-[300px]">
            <h3 className="text-gray-500 font-bold mb-6 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> SYSTEM LOGS
            </h3>
            <div className="flex-1 space-y-4 text-gray-400 overflow-hidden text-xs">
              <p>
                <span className="text-blue-500">[INFO]</span> Secure connection established.
              </p>
              <p>
                <span className="text-green-500">[SUCCESS]</span> Operator profile session loaded.
              </p>
              <p>
                <span className="text-purple-500">[DB]</span> Connection verified for user profiles.
              </p>
              <p>
                <span className="text-cyan-500">[MONITOR]</span> Real-time ETF iNAV calculator active.
              </p>
            </div>
          </div>
        </div>

        {/* 전술 기록 및 작전 채널 (전체 너비) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 동물농장 카드 */}
          <Link
            href="/animal-farm"
            className="group flex flex-col p-6 rounded-2xl bg-gradient-to-br from-pink-900/20 to-rose-900/20 border border-pink-800/50 hover:border-pink-500/60 transition-all hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl group-hover:animate-bounce">🐾</span>
              <span className="text-xs text-pink-400 group-hover:translate-x-1 transition-transform">
                입장하기 →
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">조의ver 동물농장</h3>
            <p className="text-sm text-gray-400">지친 일상 속, 나만의 동물 친구들과 함께하는 힐링 타임.</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-pink-500 font-bold">
              <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse"></span>
              NEW 콘텐츠 오픈!
            </div>
          </Link>

          {/* 게시판 카드 */}
          <Link
            href="/board"
            className="group flex flex-col p-6 rounded-2xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/50 hover:border-blue-500/60 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">📋</span>
              <span className="text-xs text-blue-400 group-hover:translate-x-1 transition-transform">
                바로가기 →
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">전술 기록 게시판</h3>
            <p className="text-sm text-gray-400">작전 회의록, 전략 분석, 병력 배치 계획을 공유하세요.</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              실시간 업데이트
            </div>
          </Link>

          {/* 북 트래커 카드 */}
          <Link
            href="/book-tracker"
            className="group flex flex-col p-6 rounded-2xl bg-gradient-to-br from-cyan-900/20 to-teal-900/20 border border-cyan-850 hover:border-cyan-500/60 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl group-hover:rotate-12 transition-transform">📖</span>
              <span className="text-xs text-cyan-400 group-hover:translate-x-1 transition-transform">
                보안 접속 →
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">북 트래커 & 학습 로그</h3>
            <p className="text-sm text-gray-400">독서 진도를 기록하고, 핵심 구절과 나의 생각을 보안 공간에 정리하세요.</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-cyan-500">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
              공부용 템플릿 지원
            </div>
          </Link>

          {/* 채팅 카드 */}
          <Link
            href="/chat"
            className="group flex flex-col p-6 rounded-2xl bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-800/50 hover:border-green-500/60 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">💬</span>
              <span className="text-xs text-green-400 group-hover:translate-x-1 transition-transform">
                바로가기 →
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">실시간 작전 채널</h3>
            <p className="text-sm text-gray-400">암호화된 실시간 통신으로 즉각적인 작전 지시와 논의가 가능합니다.</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              접속자 대기 중
            </div>
          </Link>
        </div>

        <div className="mt-8">
          <LobbyChatWidget isAdminProp={profile?.role === 'admin' || profile?.is_admin === true} />
        </div>

        {/* ETF 실시간 iNAV 추적 위젯 */}
        <EtfTrackerWidget userId={user.id} />

        {/* 관심 종목 섹션 */}
        <WatchlistSection userId={user.id} />

        {/* 가치 투자 분석 위젯 */}
        <ValueScoreWidget />

        {/* 기술적 트레이딩 분석 위젯 */}
        <TechnicalAnalysisWidget />

        {/* 회원 탈퇴 및 계정 영구 파기 */}
        <DeleteAccountWidget />

        {/* 하단 로그아웃 */}
        <form action="/auth/signout" method="post" className="mt-12 flex justify-center">
          <button className="px-6 py-2 rounded-full border border-red-900/50 text-red-400 text-sm hover:bg-red-950/30 hover:text-red-300 transition-colors flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Disconnect Secure Session
          </button>
        </form>
      </div>
    </div>
  );
}