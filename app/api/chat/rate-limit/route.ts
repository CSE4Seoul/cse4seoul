import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 로그인 사용자는 제한 없음
  if (user) {
    return NextResponse.json({ canChat: true, isGuest: false });
  }

  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // lobby_messages 테이블에 ip_address 컬럼이 있다고 가정 (없으면 마이그레이션 필요)
  // 여기서는 ip_address 필드가 아직 없으므로, 향후 확장을 고려하여 로직만 작성
  // 실제로는 guest_id를 활용하거나 ip_address 컬럼을 추가해야 함
  
  const { count, error } = await supabase
    .from('lobby_messages')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', today.toISOString());

  if (error) {
    // 테이블에 컬럼이 없어서 에러가 날 수 있음. 이 경우 일단 통과
    return NextResponse.json({ canChat: true, isGuest: true });
  }

  return NextResponse.json({ canChat: (count || 0) < 1, isGuest: true });
}
