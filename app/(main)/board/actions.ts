'use server'

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const supabase = await createClient();

  // 1. 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  // 사용자 프로필에서 이름 가져오기
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const is_anonymous = formData.get('is_anonymous') === 'on';

  // 2. DB에 데이터 삽입
  const { error } = await supabase.from('posts').insert({
    title,
    content,
    author_id: user.id,
    author_name: profile?.full_name || 'Unknown',
    is_anonymous,
  });

  if (error) {
    console.error(error);
    return;
  }

  // 3. 캐시 갱신 및 리다이렉트
  revalidatePath('/board');
  redirect('/board');
}