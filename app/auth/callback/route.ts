import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/protected';

  // 🚨 Codespaces의 포트 장난질을 원천 차단하는 진짜 외부 주소 추출법
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const realBaseUrl = `${protocol}://${host}`;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const user = data?.user || data?.session?.user;
      const consent = searchParams.get('consent') === 'true';
      
      if (user && consent) {
        // 동의 이력을 DB에 업데이트합니다.
        await supabase
          .from('profiles')
          .update({
            is_consented: true,
            consented_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }
    }
    
    // next 파라미터(예: /protected 또는 /auth/reset-password)로 이동!
    return NextResponse.redirect(`${realBaseUrl}${next}`);
  }

  return NextResponse.redirect(`${realBaseUrl}/login?error=no_code`);
}