import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createInquirySessionToken,
  getInquiryIdentity,
  getInquirySessionToken,
  hashInquirySessionToken,
  INQUIRY_SESSION_COOKIE,
  verifyInquiryPassword,
} from '@/lib/inquiries/server';

function responseWithSession(
  body: Record<string, unknown>,
  status: number,
  token: string,
) {
  const response = NextResponse.json(body, { status });
  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set(INQUIRY_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
  return response;
}

export async function POST(request: Request) {
  let token = await getInquirySessionToken();
  token ??= createInquirySessionToken();
  const sessionHash = hashInquirySessionToken(token);

  try {
    const identity = await getInquiryIdentity();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return responseWithSession({ error: '요청 데이터 형식이 올바르지 않습니다.' }, 400, token);
    }

    if (
      typeof body !== 'object'
      || body === null
      || Array.isArray(body)
      || !('inquiryId' in body)
      || !('password' in body)
      || typeof body.inquiryId !== 'string'
      || typeof body.password !== 'string'
      || body.password.length < 1
      || body.password.length > 128
    ) {
      return responseWithSession({ error: '문의 ID와 비밀번호를 확인해 주세요.' }, 400, token);
    }

    const adminClient = createAdminClient();
    const { data: inquiry, error: inquiryError } = await adminClient
      .from('inquiries')
      .select('id, created_by, password_hash')
      .eq('id', body.inquiryId)
      .maybeSingle();

    if (inquiryError) {
      console.error('문의 비밀번호 대상 조회 실패:', inquiryError);
      return responseWithSession({ error: '문의 열람을 확인하지 못했습니다.' }, 500, token);
    }
    if (!inquiry?.password_hash) {
      return responseWithSession({ error: '비밀번호가 설정된 문의를 찾을 수 없습니다.' }, 404, token);
    }

    if (identity.isAdmin || (identity.user && inquiry.created_by === identity.user.id)) {
      return responseWithSession({ success: true }, 200, token);
    }

    const { data: attemptAllowed, error: attemptError } = await adminClient.rpc(
      'consume_inquiry_password_attempt',
      { p_inquiry_id: inquiry.id, p_session_hash: sessionHash },
    );
    if (attemptError) {
      console.error('문의 비밀번호 시도 제한 확인 실패:', attemptError);
      return responseWithSession({ error: '비밀번호를 확인하지 못했습니다.' }, 500, token);
    }
    if (attemptAllowed !== true) {
      return responseWithSession({
        error: '이 세션의 비밀번호 입력 횟수(5회)를 초과했습니다.',
      }, 429, token);
    }

    const valid = await verifyInquiryPassword(body.password, inquiry.password_hash);
    if (!valid) {
      return responseWithSession({ error: '비밀번호가 일치하지 않습니다.' }, 401, token);
    }

    const { error: grantError } = await adminClient
      .from('inquiry_access_grants')
      .upsert({
        inquiry_id: inquiry.id,
        session_hash: sessionHash,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'inquiry_id,session_hash' });

    if (grantError) {
      console.error('문의 열람 권한 저장 실패:', grantError);
      return responseWithSession({ error: '문의 열람 권한을 저장하지 못했습니다.' }, 500, token);
    }

    return responseWithSession({ success: true }, 200, token);
  } catch (error) {
    console.error('문의 비밀번호 확인 API 오류:', error);
    return responseWithSession({ error: '문의 비밀번호를 확인하지 못했습니다.' }, 500, token);
  }
}
