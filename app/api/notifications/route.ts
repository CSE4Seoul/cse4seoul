import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getInquiryIdentity } from '@/lib/inquiries/server';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function GET() {
  try {
    const identity = await getInquiryIdentity();
    if (!identity.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('user_notifications')
      .select('id, inquiry_id, event_type, message, created_at, read_at')
      .eq('user_id', identity.user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('알림 조회 실패:', error);
      return NextResponse.json({ error: '알림을 불러오지 못했습니다.' }, { status: 500 });
    }

    const response = NextResponse.json({ notifications: data || [] });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('알림 API 오류:', error);
    return NextResponse.json({ error: '알림을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const identity = await getInquiryIdentity();
    if (!identity.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '요청 데이터 형식이 올바르지 않습니다.' }, { status: 400 });
    }
    if (!isRecord(body)) {
      return NextResponse.json({ error: '요청 데이터 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    let query = adminClient
      .from('user_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', identity.user.id)
      .is('read_at', null);

    if (body.id !== undefined) {
      if (typeof body.id !== 'string') {
        return NextResponse.json({ error: '알림 ID가 올바르지 않습니다.' }, { status: 400 });
      }
      query = query.eq('id', body.id);
    }

    const { error } = await query;
    if (error) {
      console.error('알림 읽음 처리 실패:', error);
      return NextResponse.json({ error: '알림을 읽음 처리하지 못했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('알림 읽음 처리 API 오류:', error);
    return NextResponse.json({ error: '알림을 처리하지 못했습니다.' }, { status: 500 });
  }
}
