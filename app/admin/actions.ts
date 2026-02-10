'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveUser(formData: FormData) {
  const supabase = await createClient();

  // 1. 보안 검사: 요청한 사람이 진짜 'admin'인지 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    return { error: 'Access Denied: You are not an admin.' };
  }

  // 2. 승인 처리
  const targetUserId = formData.get('userId') as string;

  const { error } = await supabase
    .from('profiles')
    .update({ status: 'approved' })
    .eq('id', targetUserId);

  if (error) {
    console.error('Approval failed:', error);
    return { error: 'Failed to approve' };
  }

  // 3. 새로고침
  revalidatePath('/admin');
  return { success: true };
}

