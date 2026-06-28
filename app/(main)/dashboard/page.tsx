import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getClanInfo } from '@/utils/clash';
import Link from 'next/link';
import { Zap, ChevronLeft, UserCircle } from 'lucide-react';
import { Settings } from 'lucide-react';
import LobbyChatWidget from '@/components/LobbyChatWidget';
import WatchlistSection from '@/components/WatchlistSection';
import ValueScoreWidget from '@/components/ValueScoreWidget';
import TechnicalAnalysisWidget from '@/components/TechnicalAnalysisWidget';
import ChangelogWidget from '@/components/ChangelogWidget';
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

  const clanData = await getClanInfo();

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
        {/* 상단 네비게이션 바 (추가됨) */}
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
              Welcome back, Agent {profile?.full_name || user.email?.split('@')[0]}
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

            {/* 시스템 상태 (중복 제거) */}
            {/* 이미 상단에 실시간 표시가 있으므로 여기서는 제거하거나 유지 가능, 일단 유지 */}
            <span className="px-3 py-1 bg-green-950/50 text-green-400 text-xs rounded-full border border-green-900 flex items-center gap-2 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
              System Online
            </span>
          </div>
        </header>

        {/* 메인 대시보드 그리드 (3열) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. 내 프로필 카드 */}
<div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 p-8 rounded-2xl hover:border-blue-500/30 transition-all duration-300 group shadow-xl relative">
  
  {/* 🔥 개선된 프로필 수정 버튼 (우측 상단 톱니바퀴) */}
  <Link 
    href="/profile-setup" 
    className="absolute top-6 right-6 p-2 bg-gray-800/50 hover:bg-emerald-600/20 text-gray-400 hover:text-emerald-400 rounded-lg transition-colors border border-transparent hover:border-emerald-500/30"
    title="프로필 설정"
  >
    <Settings className="w-5 h-5" />
  </Link>

  {/* 아바타 & UID 영역 */}
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

  {/* 하단 상세 정보 리스트 */}
  <div className="space-y-3 pt-4 border-t border-gray-800/50">
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">University</span>
      <span className="text-gray-300">{profile?.university || '-'}</span>
    </div>
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">Email</span>
      <span className="text-gray-300">{profile?.email || '-'}</span>
    </div>
    {/* Clash Royale Tag 영역 (있을 때만 보여주기) */}
    {profile?.clash_royale_tag && (
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">CR Tag</span>
        <span className="text-yellow-400 font-mono">{profile.clash_royale_tag}</span>
      </div>
    )}
  </div>
</div>

          {/* 2. 클랜 상태 카드 */}
          <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 p-8 rounded-2xl hover:border-purple-500/30 transition-all duration-300 group shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-500 text-xs font-bold tracking-wider group-hover:text-purple-400 transition-colors">
                CLAN STATUS
              </h3>
              <span
                className={`text-xs px-2 py-1 rounded border ${
                  clanData
                    ? 'text-purple-500 bg-purple-900/20 border-purple-900/50'
                    : 'text-red-500 bg-red-900/20 border-red-900/50'
                }`}
              >
                {clanData ? 'Live' : 'Offline'}
              </span>
            </div>

            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-bold text-white tracking-tighter">
                {clanData ? clanData.members : '-'}
              </span>
              <span className="text-gray-400 mb-2 font-medium">/ 50</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">Active Members</p>

            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-500 h-full shadow-[0_0_10px_rgba(147,51,234,0.5)] transition-all duration-1000"
                style={{ width: `${((clanData?.members || 0) / 50) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* 3. 시스템 로그 */}
          <div className="bg-black/60 border border-gray-800 p-6 rounded-2xl flex flex-col font-mono text-xs shadow-xl">
            <h3 className="text-gray-500 font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span> SYSTEM LOGS
            </h3>
            <div className="flex-1 space-y-3 text-gray-400 overflow-hidden">
              <p>
                <span className="text-blue-500">[INFO]</span> Secure connection established.
              </p>
              <p>
                <span className="text-green-500">[SUCCESS]</span> User profile loaded.
              </p>
              <p>
                <span className="text-purple-500">[DB]</span> Profiles table connected.
              </p>
              <p>
                <span className="text-yellow-500 animate-pulse">[WAIT]</span> Waiting for Clash Royale API...
              </p>
            </div>
          </div>
        </div>

        {/* 전술 기록 및 작전 채널 (전체 너비) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 동물농장 카드: 신규 추가 */}
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
              접속자 {Math.floor(Math.random() * 5) + 3}명
            </div>
          </Link>
        </div>

        <div className="mt-8">
          <LobbyChatWidget />
        </div>

        {/* 관심 종목 섹션 추가 */}
        <WatchlistSection userId={user.id} />

        {/* 가치 투자 분석 위젯 추가 */}
        <ValueScoreWidget />

        {/* 기술적 트레이딩 분석 위젯 추가 */}
        <TechnicalAnalysisWidget />

        {/* 멤버 목록 테이블 */}
        <div className="mt-8 bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-gray-400 text-sm font-bold tracking-wider">MEMBER ROSTER</h3>
            <span className="text-xs text-gray-500 font-mono">TOP 5 AGENTS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-900/50 text-xs uppercase font-medium text-gray-500">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Trophies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
  {clanData?.memberList && clanData.memberList.length > 0 ? (
    clanData.memberList.slice(0, 5).map((member: any, index: number) => (
      <tr key={member.tag} className="hover:bg-white/5 transition-colors">
        <td className="px-6 py-4 font-mono text-gray-500">#{index + 1}</td>
        <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
          {index === 0 && <span className="text-yellow-500">👑</span>}
          {member.name}
        </td>
        <td className="px-6 py-4">
          <span
            className={`px-2 py-1 rounded text-[10px] border ${
              member.role === 'leader'
                ? 'border-yellow-900/50 text-yellow-500 bg-yellow-900/20'
                : member.role === 'coLeader'
                ? 'border-purple-900/50 text-purple-400 bg-purple-900/20'
                : 'border-gray-700 text-gray-400 bg-gray-800'
            }`}
          >
            {member.role.toUpperCase()}
          </span>
        </td>
        <td className="px-6 py-4 text-right text-yellow-500 font-mono">🏆 {member.trophies}</td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
        클랜 정보를 불러올 수 없습니다.
      </td>
    </tr>
  )}
</tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-800 text-center">
            <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View All Agents →</button>
          </div>
        </div>

        {/* 시스템 체인지로그 위젯 */}
        <ChangelogWidget />

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