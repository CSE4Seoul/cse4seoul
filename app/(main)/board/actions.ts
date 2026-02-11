'use server'

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createComment(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const postId = formData.get('postId') as string;
  const content = formData.get('content') as string;
  const isAnonymous = formData.get('is_anonymous') === 'on';

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    content,
    author_id: user.id,
    author_name: profile?.full_name || 'Unknown',
    is_anonymous: isAnonymous,
  });

  if (error) {
    console.error('Comment error:', error);
    return;
  }

  revalidatePath(`/board/${postId}`);
}

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

export async function deletePost(postId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id); // 본인 글인지 확인

  if (error) {
    console.error('Delete Post Error:', error);
    return;
  }

  revalidatePath('/board');
}

// [추가] 댓글 삭제 로직
export async function deleteComment(commentId: string, postId: string) {
  const supabase = await createClient();

  // 1. 현재 로그인한 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  // 2. 삭제 실행
  // RLS 정책이 이미 걸려있지만, 서버에서도 한 번 더 author_id를 체크해주면 보안상 완벽합니다.
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', user.id); 

  if (error) {
    console.error('Delete Comment Error:', error.message);
    return;
  }

  // 3. 해당 게시글 상세 페이지 캐시 갱신 (댓글이 바로 사라지게 함)
  revalidatePath(`/board/${postId}`);
}