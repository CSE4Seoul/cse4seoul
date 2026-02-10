
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getClanInfo } from '@/utils/clash';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. 로그인 체크
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  // 2. 프로필 정보 가져오기 (방금 만든 테이블에서!)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

    const clanData = await getClanInfo();
  return (
    
    <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden">
      {/* 배경 데코레이션 */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] -z-10" />

      <div className="max-w-5xl mx-auto z-10 relative">
        {/* 헤더 섹션 */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 border-b border-gray-800 pb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Command Center
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-900/50 text-blue-300 border border-blue-800">
                KERNEL v1.0
              </span>
            </div>
            <p className="text-gray-400">Welcome back, Agent {profile?.full_name || user.email?.split('@')[0]}</p>
          </div>
          
          <div className="flex items-center gap-4">
             {/* 소속 대학 뱃지 (DB에서 가져옴) */}
             {profile?.university && (
               <span className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm font-bold text-gray-200 shadow-lg flex items-center gap-2">
                 🏫 {profile.university}
               </span>
             )}
             <span className="px-3 py-1 bg-green-950/50 text-green-400 text-xs rounded-full border border-green-900 flex items-center gap-2 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                System Online
             </span>
          </div>
        </header>

        {/* 메인 대시보드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* 게시판 바로가기 버튼 추가 */}
<div className="mt-8 mb-4">
  <Link 
    href="/board" 
    className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 hover:border-blue-500/60 transition-all group"
  >
    <div className="flex items-center gap-3">
      <span className="text-2xl">🖋️</span>
      <div>
        <h3 className="font-bold text-white">전략 게시판 (Strategy Board)</h3>
        <p className="text-xs text-gray-400">클랜원들과 작전 및 정보를 공유하세요.</p>
      </div>
    </div>
    <span className="text-blue-400 group-hover:translate-x-1 transition-transform">
      Enter →
    </span>
  </Link>
</div>
          
          {/* 1. 내 프로필 카드 */}
          <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 p-8 rounded-2xl hover:border-blue-500/30 transition-all duration-300 group shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg">
                {profile?.full_name ? profile.full_name[0] : 'U'}
              </div>
              <span className="text-xs font-mono text-gray-500 border border-gray-800 px-2 py-1 rounded">UID: {user.id.slice(0, 4)}...</span>
            </div>
            
            <h3 className="text-gray-500 text-xs font-bold tracking-wider mb-1">OPERATOR IDENTITY</h3>
            <div className="text-2xl font-bold text-white mb-1">{profile?.full_name || "Unknown Agent"}</div>
            <div className="text-blue-400 text-sm font-medium mb-4">{profile?.role || "Member"}</div>
            
            <div className="space-y-2 pt-4 border-t border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">University</span>
                <span className="text-gray-300">{profile?.university || "Not Set"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-300">{user.email}</span>
              </div>
            </div>
          </div>

          {/* 2. 클랜 상태 카드 */}
          <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 p-8 rounded-2xl hover:border-purple-500/30 transition-all duration-300 group shadow-xl">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-gray-500 text-xs font-bold tracking-wider group-hover:text-purple-400 transition-colors">CLAN STATUS</h3>
               <span className={`text-xs px-2 py-1 rounded border ${clanData ? 'text-purple-500 bg-purple-900/20 border-purple-900/50' : 'text-red-500 bg-red-900/20 border-red-900/50'}`}>
                 {clanData ? 'Live' : 'Offline'}
               </span>
             </div>
             
             <div className="flex items-end gap-2 mb-2">
                {/* ⚡️ 실제 멤버 수 표시 */}
                <span className="text-5xl font-bold text-white tracking-tighter">
                  {clanData ? clanData.members : '-'}
                </span>
                <span className="text-gray-400 mb-2 font-medium">/ 50</span>
             </div>
             <p className="text-sm text-gray-500 mb-6">Active Members</p>
             
             {/* ⚡️ 게이지 바 자동 조절 */}
             <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-blue-500 h-full shadow-[0_0_10px_rgba(147,51,234,0.5)] transition-all duration-1000"
                  style={{ width: `${(clanData?.members || 0) / 50 * 100}%` }}
                ></div>
             </div>
          </div>

          {/* 3. 시스템 로그 (터미널 느낌) */}
          <div className="bg-black/60 border border-gray-800 p-6 rounded-2xl md:col-span-1 flex flex-col font-mono text-xs shadow-xl">
            <h3 className="text-gray-500 font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span> SYSTEM LOGS
            </h3>
            <div className="flex-1 space-y-3 text-gray-400 overflow-hidden">
              <p><span className="text-blue-500">[INFO]</span> Secure connection established.</p>
              <p><span className="text-green-500">[SUCCESS]</span> User profile loaded.</p>
              <p><span className="text-purple-500">[DB]</span> Profiles table connected.</p>
              <p><span className="text-yellow-500 animate-pulse">[WAIT]</span> Waiting for Clash Royale API...</p>
            </div>
          </div>

        </div>

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
                {clanData?.memberList?.slice(0, 5).map((member: any, index: number) => (
                  <tr key={member.tag} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-500">#{index + 1}</td>
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                      {index === 0 && <span className="text-yellow-500">👑</span>}
                      {member.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] border ${
                        member.role === 'leader' ? 'border-yellow-900/50 text-yellow-500 bg-yellow-900/20' :
                        member.role === 'coLeader' ? 'border-purple-900/50 text-purple-400 bg-purple-900/20' :
                        'border-gray-700 text-gray-400 bg-gray-800'
                      }`}>
                        {member.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-yellow-500 font-mono">
                      🏆 {member.trophies}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* 전체보기 버튼 (장식용) */}
          <div className="p-4 border-t border-gray-800 text-center">
            <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              View All Agents →
            </button>
          </div>
        </div>
        
        {/* 하단 로그아웃 */}
        <form action="/auth/signout" method="post" className="mt-12 flex justify-center">
           <button className="px-6 py-2 rounded-full border border-red-900/50 text-red-400 text-sm hover:bg-red-950/30 hover:text-red-300 transition-colors flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             Disconnect Secure Session
           </button>
        </form>
      </div>
    </div>
  );
}