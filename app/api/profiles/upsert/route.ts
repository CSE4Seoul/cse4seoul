import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, is_consented, consented_at, username } = body || {};
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase.from('profiles').upsert({
      id,
      is_consented: !!is_consented,
      consented_at: consented_at ?? null,
      username: username ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'unknown' }, { status: 500 });
  }
}
