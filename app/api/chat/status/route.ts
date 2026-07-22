import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const VALID_STATUSES = ['NORMAL', 'FLAGGED', 'WARNING', 'HIDDEN', 'MUTED'] as const;
export type MessageStatus = (typeof VALID_STATUSES)[number];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: '로그인이 필요합니다.' }, { status: 401 });
  }

  // Check if user is admin (supports both role === 'admin' and is_admin === true)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single();

  const isAdminUser = profile?.is_admin === true || profile?.role === 'admin';

  if (profileError || !isAdminUser) {
    return NextResponse.json({ error: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' }, { status: 403 });
  }

  const { messageId, status } = await req.json();

  if (!messageId || !status || !VALID_STATUSES.includes(status as MessageStatus)) {
    return NextResponse.json({ error: 'INVALID_PARAMS', message: '올바르지 않은 매개변수입니다.' }, { status: 400 });
  }

  // Update status in lobby_messages
  const { data, error } = await supabase
    .from('lobby_messages')
    .update({ message_status: status })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
