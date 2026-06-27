import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 1. 공지사항 조회 API (GET)
// 활성 공지사항(is_pinned = true 또는 expires_at > now)을 최신순으로 반환
export async function GET() {
  try {
    const supabase = await createClient();
    const nowISO = new Date().toISOString();

    const { data: notices, error } = await supabase
      .from('notices')
      .select('*')
      .or(`is_pinned.eq.true,expires_at.gt.${nowISO}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('공지사항 조회 실패:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notices });
  } catch (err: any) {
    console.error('공지사항 API 오류:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. 공지사항 생성 API (POST)
// 최고관리자(role === 'admin')만 생성 가능
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1) 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '보안 인가가 유효하지 않습니다.' }, { status: 401 });
    }

    // 2) 최고관리자 권한 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '최고관리자 권한이 없습니다.' }, { status: 403 });
    }

    // 3) 요청 바디 검증
    const body = await request.json();
    const { content, is_pinned, expires_in_hours } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: '공지사항 내용을 입력해주세요.' }, { status: 400 });
    }

    // 4) 만료 기한 계산
    let expiresAt: Date;
    if (is_pinned) {
      // 상단 고정인 경우 먼 미래(9999년)로 지정하여 만료되지 않게 함
      expiresAt = new Date('9999-12-31T23:59:59Z');
    } else {
      // 고정이 아닌 경우 지정한 시간(시간 단위) 혹은 기본 24시간 후로 지정
      const hours = expires_in_hours && expires_in_hours > 0 ? expires_in_hours : 24;
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);
    }

    // 5) DB 삽입
    const { data: newNotice, error: dbError } = await supabase
      .from('notices')
      .insert({
        content: content.trim(),
        is_pinned: !!is_pinned,
        expires_at: expiresAt.toISOString(),
        created_by: user.id
      })
      .select()
      .single();

    if (dbError) {
      console.error('공지사항 저장 실패:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, notice: newNotice }, { status: 201 });
  } catch (err: any) {
    console.error('공지사항 생성 API 오류:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. 공지사항 삭제 API (DELETE)
// 최고관리자(role === 'admin')만 삭제 가능
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // 1) 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '보안 인가가 유효하지 않습니다.' }, { status: 401 });
    }

    // 2) 최고관리자 권한 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '최고관리자 권한이 없습니다.' }, { status: 403 });
    }

    // 3) 요청 파라미터(id) 검증
    const { searchParams } = new URL(request.url);
    const noticeId = searchParams.get('id');

    if (!noticeId) {
      return NextResponse.json({ error: '삭제할 공지사항 ID가 필요합니다.' }, { status: 400 });
    }

    // 4) DB에서 삭제
    const { error: dbError } = await supabase
      .from('notices')
      .delete()
      .eq('id', noticeId);

    if (dbError) {
      console.error('공지사항 삭제 실패:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '공지사항이 정상적으로 삭제되었습니다.' });
  } catch (err: any) {
    console.error('공지사항 삭제 API 오류:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
