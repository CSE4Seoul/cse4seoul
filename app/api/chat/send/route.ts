import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { content, author_name, expires_at } = await req.json();

  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  // 게스트인 경우 레이트 리미트 체크
  if (!user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('lobby_messages')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', today.toISOString());

    if (!countError && (count || 0) >= 1) {
      return NextResponse.json({ error: 'GUEST_LIMIT_EXCEEDED' }, { status: 429 });
    }
  }

  // 메시지 저장
  const { data, error } = await supabase
    .from('lobby_messages')
    .insert({
      content,
      author_name,
      expires_at,
      ip_address: ip
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
