'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ShieldAlert, ShieldCheck, Trash2, ChevronRight, AlertTriangle } from 'lucide-react';

export default function PrivacyConsentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleAgree = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증 정보가 없습니다.');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_consented: true, consented_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      alert('개인정보 수집 및 이용에 동의하셨습니다.');
      window.location.href = '/dashboard';
    }
    catch (err: any) {
      setError(err.message);
    }
    finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm('정말로 동의하지 않으십니까? 동의하지 않을 경우 보안 규정에 따라 귀하의 모든 계정 정보와 데이터가 즉시 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/account/delete', {
        method: 'POST',
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || '계정 삭제 처리 중 오류가 발생했습니다.');
      }

      alert('계정이 성공적으로 삭제되었습니다. 그동안 이용해 주셔서 감사합니다.');
      await supabase.auth.signOut();
      window.location.href = '/';
    }
    catch (err: any) {
      setError(err.message);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-xl w-full bg-gray-950 border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-red-950/30 border border-red-900/50 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-center mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
          개인정보 처리방침 개정 동의
        </h1>
        <p className="text-gray-400 text-center text-sm mb-8">
          서비스 고도화 및 보안 강화를 위해 개인정보 처리방침이 업데이트되었습니다.
        </p>

        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8 space-y-4 max-h-60 overflow-y-auto text-sm text-gray-300">
          <h3 className="font-bold text-white flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-blue-500" /> 수집하는 개인정보 항목
          </h3>
          <p>
            - 이메일, 코드네임, 소속 대학, Clash Royale 태그
            <br />
            - 서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보
          </p>

          <h3 className="font-bold text-white flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-blue-500" /> 수집 및 이용 목적
          </h3>
          <p>
            - 서비스 제공 및 관리자 승인 절차 수행
            <br />
            - 보안 위협 탐지 및 대응, 불량 이용자 차단
            <br />
            - 클랜원 간 원활한 커뮤니케이션 지원
          </p>

          <h3 className="font-bold text-white flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-blue-500" /> 보유 및 이용 기간
          </h3>
          <p className="text-red-400 font-semibold">
            - 이용자의 탈퇴 시점까지 또는 서비스 종료 시까지
            <br />
            - 단, 관계 법령에 의해 보존할 필요가 있는 경우 해당 기간까지 보관
          </p>

          <div className="p-4 bg-red-900/20 border border-red-900/30 rounded-xl mt-4">
            <p className="text-xs text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                본 약관에 동의하지 않으실 경우, CSE4Seoul의 보안 규정에 따라 서비스를 이용하실 수 없으며 **계정 및 관련 모든 데이터가 삭제**됩니다.
              </span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-xs text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleDecline}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-4 px-6 bg-transparent border border-gray-700 hover:bg-red-950/30 hover:border-red-900/50 rounded-2xl text-gray-400 hover:text-red-400 font-bold transition-all disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            동의하지 않음 (탈퇴)
          </button>
          <button
            onClick={handleAgree}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
          >
            {loading ? '처리 중...' : (
              <>
                <ShieldCheck className="w-5 h-5" />
                모든 약관에 동의
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
