'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveUser(formData: FormData) {
  const supabase = await createClient()

  // 1. 보안 검사
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return // 에러 메시지 대신 그냥 종료

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return // 권한 없으면 종료
  }

  // 2. 승인 처리
  const targetUserId = formData.get('userId') as string
  
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'approved' })
    .eq('id', targetUserId)

  if (error) {
    console.error('Approval failed:', error)
    return 
  }

  // 3. 새로고침
  revalidatePath('/admin')
  // return 값을 아예 없앰!
}

