import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, MessageSquare } from 'lucide-react';
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
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            로비 채팅
          </h1>
        </div>

        <Link
          href="/dashboard"
          className="text-xs text-neutral-400 hover:text-white transition-colors"
        >
          대시보드로 가기 →
        </Link>
      </div>

      <section className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-white">가입·대항전 문의</h2>
          <p className="mt-1 text-xs text-neutral-400">문의 내용과 진행 상태는 별도 문의 센터에서 확인할 수 있습니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/community/inquiries?type=membership"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-neutral-200 transition hover:bg-white/10"
          >
            가입 문의 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/community/inquiries?type=clan_battle"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-neutral-200 transition hover:bg-white/10"
          >
            대항전 문의 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/community/inquiries#admin-contact"
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-600"
          >
            운영진 문의 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <div id="lobby-chat" className="w-full scroll-mt-24">
        <LobbyChatWidget isAdminProp={isAdmin} />
      </div>
    </div>
  );
}
