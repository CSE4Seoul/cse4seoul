import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // 1. 세션 종료 (로그아웃)
  await supabase.auth.signOut();

  // 2. 로그인 페이지로 튕겨내기
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  
  // 3. 페이지 캐시 날리기 (중요)
  revalidatePath('/', 'layout');

  return NextResponse.redirect(url, {
    status: 301,
  });
}
