import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 1. Q&A 조회 API (GET)
// 관리자는 모든 질문을 보고, 일반 유저는 승인된(POSTED) 질문과 자신이 등록한 질문을 봅니다.
// my=true 쿼리 파라미터 전달 시 본인이 작성한 질문 목록만 조회합니다.
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(request.url);
    const myOnly = searchParams.get('my') === 'true';

    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile && profile.role === 'admin') {
        isAdmin = true;
      }
    }

    // 마이페이지 1대1 문의 전용 조회
    if (myOnly) {
      if (!user) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
      }
      const { data: myQnas, error: myError } = await supabase
        .from('qnas')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (myError) {
        return NextResponse.json({ error: myError.message }, { status: 500 });
      }
      return NextResponse.json({ qnas: myQnas || [] });
    }

    let query = supabase.from('qnas').select('*');

    if (isAdmin) {
      // 최고관리자는 모든 질문을 최신순 조회
      query = query.order('created_at', { ascending: false });
    } else if (user) {
      // 일반 로그인 유저는 게시된(POSTED) 질문 및 본인이 등록한 질문 조회
      query = query.or(`status.eq.POSTED,created_by.eq.${user.id}`).order('created_at', { ascending: false });
    } else {
      // 비로그인 방문자는 답변 완료(POSTED)되며 비밀글이 아닌(is_private = false 또는 null) 질문만 조회
      query = query.eq('status', 'POSTED').or('is_private.eq.false,is_private.is.null').order('created_at', { ascending: false });
    }

    let { data: qnas, error } = await query;

    // Supabase DB 스키마에 is_private 컬럼이 미생성된 경우 fallback 처리
    if (error && error.message.includes('is_private')) {
      const fallbackQuery = isAdmin
        ? supabase.from('qnas').select('*').order('created_at', { ascending: false })
        : (user 
            ? supabase.from('qnas').select('*').or(`status.eq.POSTED,created_by.eq.${user.id}`).order('created_at', { ascending: false })
            : supabase.from('qnas').select('*').eq('status', 'POSTED').order('created_at', { ascending: false }));
      const fallbackRes = await fallbackQuery;
      qnas = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      console.error('Q&A 조회 실패:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 비밀글인 경우 본인 작성자가 아니고 관리자가 아니면 내용을 마스킹 처리
    const processedQnas = (qnas || []).map((qna: any) => {
      if (qna.is_private && (!user || (qna.created_by !== user.id && !isAdmin))) {
        return {
          ...qna,
          content: '🔒 작성자와 관리자만 볼 수 있는 1대1 개인 비밀 문의입니다.',
          author_name: '비밀 문의'
        };
      }
      return qna;
    });

    return NextResponse.json({ qnas: processedQnas });
  } catch (err: any) {
    console.error('Q&A API 오류:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. Q&A 등록 API (POST)
// 비로그인 방문자 또는 회원이 질문을 작성할 수 있습니다. (is_private 선택 가능)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { content, author_name, is_private } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: '질문 내용을 입력해주세요.' }, { status: 400 });
    }

    const insertData: any = {
      content: content.trim(),
      status: 'PENDING',
      author_name: author_name && author_name.trim() !== '' ? author_name.trim() : 'Anonymous',
      is_private: Boolean(is_private)
    };

    if (user) {
      insertData.created_by = user.id;
      if (insertData.author_name === 'Anonymous') {
        insertData.author_name = user.email ? user.email.split('@')[0] : 'User';
      }
    }

    let { error: dbError } = await supabase
      .from('qnas')
      .insert(insertData);

    // Supabase DB에 is_private 컬럼이 아직 없는 경우 is_private 키 제거 후 재시도
    if (dbError && dbError.message.includes('is_private')) {
      delete insertData.is_private;
      const retryRes = await supabase.from('qnas').insert(insertData);
      dbError = retryRes.error;
    }

    if (dbError) {
      console.error('Q&A 저장 실패:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error('Q&A 등록 API 오류:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. Q&A 수정 API (PUT)
// 최고관리자(role === 'admin')만 답변 추가 및 질문 상태 제어가 가능합니다.
export async function PUT(request: Request) {
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

    // 3) 요청 데이터 검증
    const body = await request.json();
    const { id, reply, status } = body;

    if (!id) {
      return NextResponse.json({ error: '수정할 Q&A ID가 필요합니다.' }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status; // PENDING, POSTED, HOLD
    }
    if (reply !== undefined) {
      updateData.reply = reply;
      updateData.replied_at = new Date().toISOString();
      updateData.replied_by = user.id;
    }

    // 4) DB 업데이트
    const { data: updatedQna, error: dbError } = await supabase
      .from('qnas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      console.error('Q&A 수정 실패:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, qna: updatedQna });
  } catch (err: any) {
    console.error('Q&A 수정 API 오류:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4. Q&A 삭제 API (DELETE)
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

    // 3) 요청 파라미터 검증
    const { searchParams } = new URL(request.url);
    const qnaId = searchParams.get('id');

    if (!qnaId) {
      return NextResponse.json({ error: '삭제할 Q&A ID가 필요합니다.' }, { status: 400 });
    }

    // 4) DB에서 삭제
    const { error: dbError } = await supabase
      .from('qnas')
      .delete()
      .eq('id', qnaId);

    if (dbError) {
      console.error('Q&A 삭제 실패:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Q&A가 정상적으로 삭제되었습니다.' });
  } catch (err: any) {
    console.error('Q&A 삭제 API 오류:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
