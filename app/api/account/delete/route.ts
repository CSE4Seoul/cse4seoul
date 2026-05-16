import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    // get current user from cookies
    const serverSupabase = await createServerClient();
    const { data: userData, error: userErr } = await serverSupabase.auth.getUser();
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });
    const user = userData.user;
    if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

    const supabaseAdmin = createAdminClient();
    // delete profile record
    const { error: delErr } = await supabaseAdmin.from('profiles').delete().eq('id', user.id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    // delete auth user via admin REST endpoint
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user.id}`;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const resp = await fetch(url, {
      method: 'DELETE',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: `failed deleting auth user: ${text}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'unknown' }, { status: 500 });
  }
}
