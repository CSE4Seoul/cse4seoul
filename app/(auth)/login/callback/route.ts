import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // 서버용 클라이언트 경로 확인!

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // next 파라미터가 있으면 거기로, 없으면 대시보드로 보냅니다.
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    
    // 💡 여기서 1회용 코드를 진짜 로그인 세션으로 교환합니다!
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 교환 성공 시, 목적지(비밀번호 재설정 페이지 등)로 안전하게 리다이렉트
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 에러가 났거나 코드가 없으면 로그인 페이지로 튕겨냅니다.
  return NextResponse.redirect(`${origin}/auth/login?error=auth_code_error`);
}