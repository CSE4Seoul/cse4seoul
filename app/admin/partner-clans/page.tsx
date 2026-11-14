import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminPartnerClansManager from '@/components/AdminPartnerClansManager';

export default async function AdminPartnerClansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (error || (profile?.role !== 'admin' && profile?.is_admin !== true)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="mb-5 inline-flex text-xs text-neutral-400 hover:text-white">
          ← 관리자 페이지
        </Link>
        <AdminPartnerClansManager />
      </div>
    </div>
  );
}
