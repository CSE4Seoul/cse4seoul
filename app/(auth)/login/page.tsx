'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

export default function LoginPage() {
  const { t, toggleLanguage, lang } = useLanguage();
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isAgreed, setIsAgreed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setError(error.message);
    setLoading(false);
  } else {
    router.push('/dashboard');
    router.refresh();
  }
};

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    setLoading(true);
    setError(null);
    if (!isAgreed) {
      setError(lang === 'ko' ? '개인정보 수집 및 이용에 동의해 주세요.' : 'Please agree to the collection and use of personal information.');
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard&consent=true`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    if (!isAgreed) {
      setError(lang === 'ko' ? '개인정보 수집 및 이용에 동의해 주세요.' : 'Please agree to the collection and use of personal information.');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
        data: {
          is_consented: true,
          consented_at: new Date().toISOString(),
        },
      },
    });
    if (error) {
      setError(error.message);
    } else {
      // persist consent server-side
      try {
        const userId = data?.user?.id;
        if (userId) {
          await fetch('/api/profiles/upsert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, is_consented: true, consented_at: new Date().toISOString() }),
          });
        }
      } catch (e) {
        console.error('Failed to persist consent:', e);
      }
      setError(lang === 'ko' ? '이메일을 확인해서 인증해주세요!' : 'Please check your email for verification!');
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetMessage(null);
    
    if (resetEmail.endsWith('@cse4seoul.kakao')) {
      setError(lang === 'ko' 
        ? '소셜 연동 계정(카카오)은 비밀번호를 설정/변경할 수 없습니다.' 
        : 'Socially linked accounts (Kakao) cannot set/change passwords.');
      setLoading(false);
      return;
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      // 🚨 이 부분을 톨게이트를 거치도록 수정하세요!
      redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
    });
    
    if (error) {
      setError(error.message);
    } else {
      setResetMessage(lang === 'ko' 
        ? '비밀번호 재설정 링크가 이메일로 전송되었습니다. 확인해주세요.' 
        : 'A password reset link has been sent to your email. Please check it.');
      setShowResetForm(false); // Optionally hide form after success
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
      {/* 배경 그라데이션 (기존 코드 유지) */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-black to-black z-0" />

      {/* 🌍 언어 변경 토글 버튼 (우측 상단) */}
      <button
        onClick={toggleLanguage}
        className="absolute top-6 right-6 z-20 px-4 py-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition"
      >
        {t('toggleLang')}
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-md p-8 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl"
      >
        <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          {showResetForm ? t('resetPassword') : t('systemAccess')}
        </h2>

        {!showResetForm ? (
          // 로그인 폼
          <form key="login-form" onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white"
              placeholder={t('emailPlaceholder')}
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white"
              placeholder={t('passwordPlaceholder')}
              required
            />
            {error && <div className="text-red-400 text-sm">⚠️ {error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all"
            >
              {loading ? t('accessing') : t('connect')}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="w-full py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {t('createNewIdentity')}
            </button>

            {/* 소셜 로그인 구분선 */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-800"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase">
                {lang === 'ko' ? '또는' : 'Or'}
              </span>
              <div className="flex-grow border-t border-gray-800"></div>
            </div>

            {/* 소셜 로그인 버튼들 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full py-2.5 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-2 border border-gray-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.927h6.6c-.29 1.5-.14 3.01-1.02 4.02l3.117 2.42c1.813-1.68 2.857-4.16 2.857-7.027z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.12-2.42c-.87.59-1.98.94-3.13.94-2.41 0-4.45-1.63-5.18-3.81l-3.23 2.51C4.8 21.84 8.16 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.82 15.8c-.19-.58-.3-1.2-.3-1.8s.11-1.22.3-1.8l-3.23-2.51C2.33 11.23 1.95 12.61 1.95 14s.38 2.77 1.05 4.31l3.82-2.51z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 8.16 0 4.8 2.16 3.01 5.37l3.81 2.96c.73-2.18 2.77-3.58 5.18-3.58z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('kakao')}
                disabled={loading}
                className="w-full py-2.5 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] font-semibold rounded-lg transition-all flex items-center justify-center gap-2 border-none"
              >
                <svg className="w-5 h-5 fill-[#191919]" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 3.185-9 7.11 0 2.507 1.656 4.707 4.156 5.862l-1.056 3.864c-.08.293.088.585.377.65.088.02.176.02.256-.008l4.545-2.996C11.517 17.65 11.758 17.67 12 17.67c4.97 0 9-3.185 9-7.11C21 6.185 17.03 3 12 3z" />
                </svg>
                Kakao
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                id="consent-login"
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="consent-login" className="text-sm text-gray-300">
                {t('privacyAgree')} (
                <button 
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="underline hover:text-blue-400 transition-colors"
                >
                  {t('privacyPolicy')}
                </button>
                )
              </label>
            </div>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowResetForm(true);
                  setResetEmail(email); // 로그인 이메일 미리 채우기
                  setError(null);
                }}
                className="text-sm text-blue-400 hover:underline focus:outline-none"
              >
                {t('forgotPassword')}
              </button>
            </div>
          </form>
        ) : (
          // 비밀번호 재설정 폼
          <form key="reset-form" onSubmit={handlePasswordReset} className="space-y-4">
            <p className="text-gray-300 text-sm mb-4">
              {t('resetDescription')}
            </p>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white"
              placeholder={t('emailPlaceholder')}
              required
            />
            {error && <div className="text-red-400 text-sm">⚠️ {error}</div>}
            {resetMessage && <div className="text-green-400 text-sm">✅ {resetMessage}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all"
            >
              {loading ? t('sending') : t('sendResetLink')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowResetForm(false);
                setError(null);
                setResetMessage(null);
              }}
              className="w-full py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {t('backToLogin')}
            </button>
          </form>
        )}
      </motion.div>

      {/* 🔐 개인정보 처리방침 모달 (한국 개인정보보호법 기준 보완) */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4 sticky top-0 bg-gray-900 z-10">
              <h3 className="text-xl font-bold text-white">개인정보 처리방침</h3>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
              <section>
                <h4 className="text-blue-400 font-semibold mb-2 text-base">1. 개인정보 보호책임자 지정</h4>
                <div className="bg-black/30 p-3 rounded-lg border border-gray-800">
                  <p>• 성명: [이름 입력 필요]</p>
                  <p>• 직책: 개인정보 보호책임자 (CPO)</p>
                  <p>• 연락처/이메일: [이메일 입력 필요]</p>
                </div>
              </section>

              <section>
                <h4 className="text-blue-400 font-semibold mb-2 text-base">2. 개인정보 파기 절차 및 방법</h4>
                <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li><strong>전자적 파일:</strong> 복구 불가능한 기술적 방법으로 영구 삭제</li>
                  <li><strong>출력물 등:</strong> 파쇄 또는 소각</li>
                </ul>
              </section>

              <section>
                <h4 className="text-blue-400 font-semibold mb-2 text-base">3. 법령상 보관 항목 및 기간</h4>
                <div className="overflow-x-auto">
                  <table className="w-full mt-2 border-collapse border border-gray-800 text-xs">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="border border-gray-700 p-2 text-left">항목</th>
                        <th className="border border-gray-700 p-2 text-left">보존 기간</th>
                        <th className="border border-gray-700 p-2 text-left">근거 법령</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-700 p-2 text-gray-200">계약 또는 청약철회 기록</td>
                        <td className="border border-gray-700 p-2">5년</td>
                        <td className="border border-gray-700 p-2">전자상거래법</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 p-2 text-gray-200">접속 로그 (Log-in)</td>
                        <td className="border border-gray-700 p-2">3개월</td>
                        <td className="border border-gray-700 p-2">통신비밀보호법</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 p-2 text-gray-200">소비자 불만/분쟁 기록</td>
                        <td className="border border-gray-700 p-2">3년</td>
                        <td className="border border-gray-700 p-2">전자상거래법</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h4 className="text-blue-400 font-semibold mb-2 text-base">4. 개인정보 처리방침 고지 방법</h4>
                <p>방침 변경 시 시행 최소 7일 전부터 이메일 또는 서비스 공지사항을 통해 개정 내용을 사전 고지합니다.</p>
              </section>

              <section>
                <h4 className="text-blue-400 font-semibold mb-2 text-base">5. 쿠키(Cookie) 관련 고지</h4>
                <p>회사는 개인화된 서비스를 제공하기 위해 쿠키를 사용합니다.</p>
                <ul className="list-disc ml-5 mt-2 space-y-1 text-xs">
                  <li><strong>목적:</strong> 세션 유지, 서비스 이용 통계 분석</li>
                  <li><strong>거부 방법:</strong> 브라우저 설정에서 쿠키 저장 거부 가능 (Chrome의 경우: 설정 &gt; 개인정보 및 보안)</li>
                  <li><strong>주의:</strong> 쿠키 저장을 거부할 경우 로그인이 필요한 서비스 이용이 제한될 수 있습니다.</li>
                </ul>
              </section>

              <section>
                <h4 className="text-blue-400 font-semibold mb-2 text-base">6. 정보주체의 권리 및 행사 절차</h4>
                <ul className="list-disc ml-5 space-y-1">
                  <li>요청 후 <strong>10일 이내</strong>에 처리 결과를 통보합니다.</li>
                  <li>법정 대리인이나 위임을 받은 자를 통해서도 권리 행사가 가능합니다.</li>
                  <li>권리 행사 거부 시 개인정보보호위원회 신고 등 불복 절차를 안내합니다.</li>
                </ul>
              </section>

              <section>
                <h4 className="text-blue-400 font-semibold mb-2 text-base">7. 개인정보 국외 이전 (Supabase)</h4>
                <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-800/50 text-xs">
                  <p>• <strong>이전 국가/수탁자:</strong> 미국 / Supabase, Inc.</p>
                  <p>• <strong>이전 목적:</strong> 글로벌 클라우드 인프라를 활용한 데이터 보관 및 서비스 제공</p>
                  <p>• <strong>이전 항목:</strong> 이메일, 계정 정보, 접속 로그</p>
                  <p>• <strong>보호 조치:</strong> 표준 계약 조항(SCC) 준수 및 보안 인증 관리</p>
                </div>
              </section>
            </div>

            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full mt-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20"
            >
              확인 및 닫기
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}