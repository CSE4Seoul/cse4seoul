import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { GUEST_DAILY_CHAT_LIMIT } from '@/lib/constants';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 로그인 사용자는 제한 없음
  if (user) {
    return NextResponse.json({ canChat: true, isGuest: false, sentCount: 0, maxLimit: GUEST_DAILY_CHAT_LIMIT });
  }

  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('lobby_messages')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', today.toISOString());

  if (error) {
    return NextResponse.json({ canChat: true, isGuest: true, sentCount: 0, maxLimit: GUEST_DAILY_CHAT_LIMIT });
  }

  const currentCount = count || 0;
  const canChat = currentCount < GUEST_DAILY_CHAT_LIMIT;

  return NextResponse.json({ 
    canChat, 
    isGuest: true, 
    sentCount: currentCount, 
    maxLimit: GUEST_DAILY_CHAT_LIMIT 
  });
}

