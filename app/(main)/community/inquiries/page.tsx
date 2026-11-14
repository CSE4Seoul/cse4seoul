import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import AdminContactWidget from '@/components/AdminContactWidget';
import InquiryCenter from '@/components/InquiryCenter';
import { createClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: '문의 센터 | CSE4Seoul',
};

type InquiryType = 'membership' | 'clan_battle';

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const [params, supabase] = await Promise.all([searchParams, createClient()]);
  const { data: { user } } = await supabase.auth.getUser();
  const initialType: InquiryType = params.type === 'clan_battle' ? 'clan_battle' : 'membership';

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="sticky top-16 z-30 mb-6 border-b border-white/10 bg-black/95 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/community/lobby#lobby-chat"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              로비 채팅으로 돌아가기
            </Link>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">CSE4SEOUL · COMMUNITY</p>
            <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">문의 센터</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
              가입 신청, 클랜 대항전 제안, 운영진 문의를 접수하고 처리 상태를 확인할 수 있습니다.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-neutral-300 transition hover:bg-white/5 hover:text-white"
          >
            <Home className="h-4 w-4" />
            홈으로
          </Link>
        </div>
      </header>

      <div className="space-y-6">
        <InquiryCenter isLoggedIn={Boolean(user)} initialType={initialType} />
        <div id="admin-contact" className="scroll-mt-36">
          <AdminContactWidget isLoggedIn={Boolean(user)} />
        </div>
      </div>
    </div>
  );
}
