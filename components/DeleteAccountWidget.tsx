"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ShieldAlert, Trash2, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function DeleteAccountWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const REQUIRED_CONFIRM_TEXT = "계정 영구 파기";

  const handleDeleteAccount = async () => {
    if (!isAgreed) {
      setError("탈퇴 및 데이터 파기 안내 동의 항목에 체크해야 합니다.");
      return;
    }
    if (confirmText !== REQUIRED_CONFIRM_TEXT) {
      setError(`확인 문구가 일치하지 않습니다. ('${REQUIRED_CONFIRM_TEXT}' 입력 필요)`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!resp.ok) {
        const body = await resp.json();
        throw new Error(body.error || "탈퇴 처리 중 서버 오류가 발생했습니다.");
      }

      alert("회원 탈퇴 및 계정 정보 파기가 완료되었습니다. 이용해 주셔서 감사합니다.");
      
      // Supabase 클라이언트 로그아웃 실행 후 로그인 페이지로 이동
      const supabase = createClient();
      await supabase.auth.signOut();
      
      router.push("/login?message=deleted");
      router.refresh();
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      setError(err.message || "처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-sm border border-red-950/60 rounded-2xl overflow-hidden shadow-xl mt-8">
      {/* 위젯 헤더 */}
      <div className="p-6 border-b border-red-950/50 flex justify-between items-center bg-red-950/10">
        <h3 className="text-red-400 text-sm font-bold tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          회원 탈퇴 및 보안 계정 파기 (ACCOUNT DESTRUCTION)
        </h3>
        <span className="text-[10px] text-red-500 font-mono border border-red-900/50 px-2 py-0.5 rounded bg-red-950/20 font-bold">DANGER ZONE</span>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-sm text-gray-300">
          이 조치는 귀하의 요원 신원 정보와 대시보드 데이터를 시스템에서 즉시 영구 파기합니다. 탈퇴 진행 시 다음 조항이 즉시 적용됩니다.
        </p>

        {/* 📋 관련 규정 사항 컴포넌트 */}
        <div className="bg-black/40 border border-gray-800 rounded-xl p-5 space-y-4 text-xs text-gray-400">
          <h4 className="text-gray-300 font-bold flex items-center gap-1.5 border-b border-gray-800/80 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            개인정보 파기 및 보관 규정 안내 (개인정보 보호법 제21조)
          </h4>
          
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              <div>
                <strong className="text-gray-300">프로필 데이터 즉시 파기:</strong>
                <p className="mt-0.5 leading-relaxed">계정 연동 해제 시 profiles 테이블에 등록된 코드네임(이름), 소속 대학, Clash Royale 태그, 그리고 동물농장(animal_farm_profiles, animals) 데이터는 복구가 불가능한 기술적 방법으로 즉시 영구 삭제됩니다.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              <div>
                <strong className="text-gray-300">E2E 암호화 대화 내역 영구 소멸:</strong>
                <p className="mt-0.5 leading-relaxed">클라이언트단에서 AES-256으로 암호화되어 저장된 모든 통신 메시지는 해당 계정의 고유 식별자 파기와 동시에 즉시 완전 소각되며 복호화가 원천 불가능해집니다.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 font-bold mt-0.5">•</span>
              <div>
                <strong className="text-yellow-400">통신사실확인자료 보관 (통신비밀보호법 제15조의2):</strong>
                <p className="mt-0.5 leading-relaxed">시스템 내부 보안 점검 및 불법적 접속 차단 목적의 접속 로그(IP 주소, 로그인 기록)는 법령 준수를 위해 탈퇴 후 3개월(90일)간 별도의 데이터베이스 테이블에 안전하게 분리 보존되며, 기간 만료 시 지체 없이 자동 영구 삭제됩니다.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* 탈퇴 실행 트리거 버튼 */}
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="px-5 py-2.5 bg-red-950/40 hover:bg-red-900/30 text-red-400 hover:text-red-300 text-xs font-bold rounded-lg border border-red-900/50 hover:border-red-700/50 transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Trash2 className="w-3.5 h-3.5" />
            계정 파기 절차 진행하기
          </button>
        ) : (
          <div className="bg-red-950/10 border border-red-900/40 p-5 rounded-xl space-y-4">
            <h4 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              계정 파기 절차 확인
            </h4>

            {/* 동의 체크박스 */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-1 rounded border-red-900 text-red-600 focus:ring-red-500 bg-black/50"
              />
              <span className="text-xs text-gray-300 leading-relaxed">
                위의 프로필 즉시 파기 및 법령에 따른 3개월 접속 로그 보존 안내 사항을 모두 확인하였으며, 이에 동의합니다.
              </span>
            </label>

            {/* 확인 문자 입력 */}
            <div className="space-y-1.5">
              <label className="block text-xs text-gray-400">
                실행을 위해 아래 빈칸에 <strong className="text-red-400 font-bold">&quot;{REQUIRED_CONFIRM_TEXT}&quot;</strong>를 정확히 입력해 주세요.
              </label>
              <input
                type="text"
                placeholder={REQUIRED_CONFIRM_TEXT}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full bg-black/60 border border-red-900/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors font-bold"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/50 p-2.5 rounded-lg flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading || !isAgreed || confirmText !== REQUIRED_CONFIRM_TEXT}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    보안 파기 중...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    계정 영구 파기 실행
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setConfirmText("");
                  setIsAgreed(false);
                  setError(null);
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors border border-gray-700/50"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
