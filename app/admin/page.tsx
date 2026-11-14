import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { approveUser } from './actions';
import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link';


export default async function AdminPage() {
  noStore();
  const supabase = await createClient();

  // 1. 관리자 권한 체크 (보안)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, is_admin')
    .eq('id', user.id)
    .single();

  // 관리자가 아니면 대시보드로 쫓아냄
  if (adminProfile?.role !== 'admin' && adminProfile?.is_admin !== true) {
    redirect('/dashboard');
  }

  // 2. 'pending' 상태인 유저들만 가져오기
  const { data: pendingUsers } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false }); // 최신순

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-red-500 flex items-center gap-2">
        👮‍♂️ Admin Control Center
      </h1>

      <Link
        href="/admin/inquiries"
        className="mb-6 inline-flex rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-600"
      >
        가입·대항전·관리자 문의함 →
      </Link>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold">Pending Approvals ({pendingUsers?.length || 0})</h2>
          <p className="text-gray-400 text-sm">승인 대기 중인 요원 목록입니다.</p>
        </div>

        {pendingUsers && pendingUsers.length > 0 ? (
          <ul className="divide-y divide-gray-800">
            {pendingUsers.map((user) => (
              <li
                key={user.id}
                className="p-6 flex justify-between items-center hover:bg-gray-800/50 transition-colors"
              >
                <div>
                  <p className="font-bold text-lg">{user.full_name || 'No Name'}</p>
                  <p className="text-gray-500 font-mono text-sm">{user.email}</p>
                  <p className="text-xs text-yellow-500 mt-1">Status: {user.status}</p>
                </div>

                <form action={approveUser}>
                  <input type="hidden" name="userId" value={user.id} />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                  >
                    Approve ✅
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-10 text-center text-gray-500">
            <p className="text-lg">🎉 No pending users!</p>
            <p className="text-sm">모든 요원이 승인되었습니다.</p>
          </div>
        )}
      </div>

      <a href="/dashboard" className="inline-block mt-8 text-gray-500 hover:text-white underline">
        ← Back to Dashboard
      </a>
    </div>
  );
}

