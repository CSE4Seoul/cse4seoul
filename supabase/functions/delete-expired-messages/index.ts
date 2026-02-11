import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.2'

serve(async (req) => {
  try {
    // Supabase 클라이언트 초기화 (Service Role Key 사용)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('🗑️ 만료된 메시지 삭제 작업 시작...')

    // 1️⃣ 현재 시간보다 이전의 expires_at을 가진 메시지 삭제
    const { data: deletedData, error: deleteError } = await supabase
      .from('messages')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (deleteError) {
      console.error('❌ 삭제 오류:', deleteError)
      return new Response(
        JSON.stringify({ 
          error: deleteError.message,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        },
      )
    }

    const deletedCount = deletedData?.length || 0
    console.log(`✅ ${deletedCount}개의 만료된 메시지 삭제됨`)

    // 2️⃣ 소프트 삭제된 메시지 (is_deleted=true) 중 7일 이상 된 것 정리 (옵션)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: softDeleteData, error: softDeleteError } = await supabase
      .from('messages')
      .delete()
      .eq('is_deleted', true)
      .lt('created_at', sevenDaysAgo.toISOString())

    if (softDeleteError) {
      console.warn('⚠️ 소프트 삭제된 메시지 정리 중 오류:', softDeleteError)
    } else {
      const softDeleteCount = softDeleteData?.length || 0
      console.log(`✅ ${softDeleteCount}개의 소프트 삭제된 메시지 정리됨`)
    }

    // 3️⃣ 로그 기록 (Analytics용)
    const logData = {
      event_type: 'message_deletion',
      deleted_count: deletedCount,
      soft_deleted_count: softDeleteData?.length || 0,
      executed_at: new Date().toISOString(),
      success: true,
    }

    const { error: logError } = await supabase
      .from('deletion_logs')
      .insert([logData])
      .select()

    if (logError) {
      console.warn('⚠️ 로그 기록 중 오류:', logError.message)
      // 로그 기록 실패는 중대하지 않으므로 계속 진행
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: '✅ 메시지 삭제 작업 완료',
        deleted: deletedCount,
        soft_deleted_cleanup: softDeleteData?.length || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      },
    )
  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err)
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : '알 수 없는 오류',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      },
    )
  }
})
