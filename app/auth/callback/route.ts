import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // 🚨 Codespaces의 멍청한 포트 장난질을 원천 차단하는 진짜 외부 주소 추출법
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const realBaseUrl = `${protocol}://${host}`;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    
    // 멍청한 origin 대신, 우리가 직접 뽑아낸 찐 주소(realBaseUrl)로 강제 이동!
    return NextResponse.redirect(`${realBaseUrl}/auth/reset-password`);
  }

  return NextResponse.redirect(`${realBaseUrl}/auth/login?error=no_code`);
}