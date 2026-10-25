import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Settings, UserCheck, Shield, ChevronLeft, ArrowRight, LogOut, Key } from 'lucide-react';
import DeleteAccountWidget from '@/components/DeleteAccountWidget';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* 상단 브레드크럼 & 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-900 text-neutral-400 border border-neutral-700">
              OPERATOR SETTINGS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-neutral-400" />
            계정 & 보안 환경설정
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            프로필 정보, 보안 세션 확인 및 계정 관리 작업을 수행합니다.
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

      <div className="space-y-6">
        {/* 프로필 정보 카드 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{profile?.full_name || '이름 미설정'}</h2>
                <p className="text-xs text-neutral-400 font-mono">{user.email}</p>
              </div>
            </div>

            <Link
              href="/profile-setup"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all flex items-center gap-1.5"
            >
              <span>프로필 수정</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/5 font-mono text-xs">
            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
              <span className="text-neutral-500 text-[10px] block">소속 대학교</span>
              <span className="text-white font-bold">{profile?.university || '미입력'}</span>
            </div>
            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
              <span className="text-neutral-500 text-[10px] block">클래시로얄 태그</span>
              <span className="text-amber-400 font-bold">{profile?.clash_royale_tag || '미연동'}</span>
            </div>
            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
              <span className="text-neutral-500 text-[10px] block">권한 등급</span>
              <span className="text-cyan-400 font-bold">{profile?.role || '일반 요원'}</span>
            </div>
          </div>
        </div>

        {/* 시스템 보안 세션 카드 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            보안 세션 & 접속 관리
          </h3>
          <div className="space-y-3 font-mono text-xs text-neutral-400">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span>통신 보안 프로토콜</span>
              <span className="text-emerald-400 font-bold">AES-256 E2EE 활성</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span>현재 접속 계정 ID</span>
              <span className="text-neutral-300">{user.id.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>세션 로그아웃</span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-800/40 transition-colors text-xs font-bold"
                >
                  보안 세션 종료 (로그아웃)
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 회원 탈퇴 위젯 */}
        <div className="pt-4">
          <DeleteAccountWidget />
        </div>
      </div>
    </div>
  );
}
