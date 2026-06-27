'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// 프로필 업데이트를 처리하는 보안 서버 액션
export async function updateProfile(formData: {
  full_name: string;
  university: string;
  clash_royale_tag: string;
  role?: string;
}) {
  try {
    const supabase = await createClient()

    // 1. 사용자 로그인 인증 검증
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '보안 인가가 유효하지 않습니다.' }
    }

    // 2. 현재 로그인한 사용자의 프로필 조회
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !currentProfile) {
      return { success: false, error: '신원 정보를 가져오는 데 실패했습니다.' }
    }

    // 3. 화이트리스트 기반의 안전한 업데이트 객체 구성
    // 일반 유저는 role 이나 is_admin 컬럼에 대한 값을 보낼 수 없음
    const updateData: any = {
      id: user.id,
      email: user.email,
      full_name: formData.full_name.trim(),
      university: formData.university.trim(),
      clash_royale_tag: formData.clash_royale_tag.trim(),
      updated_at: new Date().toISOString(),
    }

    // 4. 권한 검증: 현재 사용자가 최고관리자(admin) 등급인 경우에만 role 필드 업데이트를 허용
    if (currentProfile.role === 'admin' && formData.role) {
      updateData.role = formData.role.trim()
    }

    // 5. DB Upsert
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(updateData)

    if (upsertError) {
      console.error('프로필 업데이트 DB 저장 실패:', upsertError)
      return { success: false, error: upsertError.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('프로필 업데이트 액션 오류:', err)
    return { success: false, error: err.message || '알 수 없는 오류' }
  }
}
