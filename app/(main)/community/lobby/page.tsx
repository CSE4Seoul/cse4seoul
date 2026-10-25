import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import LobbyChatWidget from '@/components/LobbyChatWidget';

export default async function LobbyChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_admin')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'admin' || profile?.is_admin === true;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* 상단 브레드크럼 & 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/community"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>커뮤니티 라운지</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            익명 로비 실시간 채팅 & 미니 캔버스
          </h1>
        </div>

        <Link
          href="/dashboard"
          className="text-xs text-neutral-400 hover:text-white transition-colors"
        >
          대시보드로 가기 →
        </Link>
      </div>

      <div className="w-full">
        <LobbyChatWidget isAdminProp={isAdmin} />
      </div>
    </div>
  );
}
