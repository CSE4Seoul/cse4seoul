import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 1. 1:1 개인 메시지 목록 조회 (GET)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');

    if (!targetId) {
      return NextResponse.json({ error: '대화 상대 ID가 필요합니다.' }, { status: 400 });
    }

    // 로그인 한 사용자와 targetId 사이의 1:1 대화 내역 조회
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        is_read,
        created_at,
        expires_at
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${user.id})`)
      .eq('is_deleted', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('1:1 메시지 조회 실패:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error('DM GET API 오류:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. 1:1 개인 메시지 발송 (POST)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { receiver_id, content, expires_in_days } = body;

    if (!receiver_id || !content) {
      return NextResponse.json({ error: '수신자 ID와 메시지 내용을 입력해주세요.' }, { status: 400 });
    }

    const days = typeof expires_in_days === 'number' && expires_in_days > 0 ? expires_in_days : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const { data: message, error: dbError } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        receiver_id,
        content, // 이미 클라이언트에서 암호화된 메시지 string ("ENC:...")
        expires_at: expiresAt.toISOString(),
        is_deleted: false,
        is_read: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('1:1 메시지 발송 실패:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (err: any) {
    console.error('DM POST API 오류:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. 메시지 읽음 처리 (PUT)
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { sender_id } = body;

    if (!sender_id) {
      return NextResponse.json({ error: '송신자 ID가 필요합니다.' }, { status: 400 });
    }

    // 상대방이 나(user.id)에게 보낸 메시지들을 읽음(is_read=true) 처리
    const { error: dbError } = await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('sender_id', sender_id)
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    if (dbError) {
      console.error('1:1 메시지 읽음 처리 실패:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DM PUT API 오류:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
