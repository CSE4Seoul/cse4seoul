// app/actions.tsx
'use server';

import { createClient } from '@/utils/supabase/server'; // 하민 님 프로젝트의 supabase 설정 경로에 맞게 수정
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  
  const title = formData.get('title');
  const content = formData.get('content');

  // Supabase DB에 데이터 삽입
  const { error } = await supabase
    .from('posts')
    .insert([{ title, content }]);

  if (error) {
    console.error('글 작성 실패:', error);
    return;
  }

  // 작전 성공 시 게시판 목록으로 이동
  redirect('/board');
}