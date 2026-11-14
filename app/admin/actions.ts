'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveUser(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('로그인이 필요합니다.')

  const { data: adminProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_admin')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError
  if (adminProfile?.role !== 'admin' && adminProfile?.is_admin !== true) {
    throw new Error('관리자 권한이 필요합니다.')
  }

  const targetUserId = formData.get('userId')
  if (
    typeof targetUserId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId)
  ) {
    throw new Error('승인 대상 사용자가 올바르지 않습니다.')
  }
  
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'approved' })
    .eq('id', targetUserId)

  if (error) {
    console.error('Approval failed:', error)
    throw error
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
}

