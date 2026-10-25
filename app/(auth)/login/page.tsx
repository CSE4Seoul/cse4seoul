'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Cpu, 
  ShieldCheck, 
  Receipt, 
  TrendingUp, 
  Network, 
  Lock, 
  Loader2 
} from 'lucide-react';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import CosmicBackground from '@/components/CosmicBackground';

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
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
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
      setError(lang === 'ko' 
        ? '회원가입을 진행하려면 개인정보 수집 및 이용에 동의해 주세요.' 
        : 'Please agree to the collection and use of personal information to sign up.');
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
      setError(lang === 'ko' ? '인증 이메일을 확인해 주세요! (스팸함 확인 포함)' : 'Please check your email for verification!');
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
      redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
    });
    
    if (error) {
      setError(error.message);
    } else {
      setResetMessage(lang === 'ko' 
        ? '비밀번호 재설정 링크가 이메일로 전송되었습니다. 메일함을 확인해주세요.' 
        : 'A password reset link has been sent to your email. Please check it.');
      setShowResetForm(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col justify-between overflow-x-hidden">
      {/* 🌌 별빛 우주 배경 (모듈화된 CosmicBackground) */}
      <CosmicBackground isFixed={true} showGrid={false} starSizeMultiplier={0.9} />

      {/* 상단 액션 바: 홈으로 가기 & 언어 토글 */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/80 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-white/10 transition-colors text-xs font-medium backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('backToHome')}</span>
        </Link>

        <button
          onClick={toggleLanguage}
          className="px-3.5 py-1.5 rounded-full bg-neutral-900/80 text-neutral-300 hover:text-white border border-white/10 text-xs font-mono transition-colors"
        >
          {t('toggleLang')}
        </button>
      </div>

      {/* 메인 스플릿 영역 */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 my-auto">
        
        {/* 좌측 패널: 가치 제안 (PC에서만 노출, 모바일에서는 폼 우선을 위해 숨김) */}
        <div className="hidden lg:flex flex-col flex-1 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3.5 py-1 text-[11px] font-mono font-bold tracking-widest text-cyan-300 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>CSE4SEOUL HQ SYSTEM</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            개발자와 게이머를 위한 <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
              통합 올인원 커맨드 센터
            </span>
          </h1>

          <p className="text-xs text-neutral-400 leading-relaxed font-light">
            로그인하여 개인화된 금융 대시보드, 지식 마인드맵 스튜디오, 암호화 작전 통신실 및 클랜 전적 모니터링을 이용하세요.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <Receipt className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">실질소득 가계부 & 세금 환급 계산</h4>
                <p className="text-[11px] text-neutral-400">알바/프리랜서 원천징수(3.3%) 및 4대보험 실지급액 역산</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">ETF 실시간 iNAV & 야간 괴리율</h4>
                <p className="text-[11px] text-neutral-400">장 마감 이후 실시간 추정 지수 및 관심 종목 레이더</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <Network className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">무한 계층 지식 마인드맵 & 학습 일지</h4>
                <p className="text-[11px] text-neutral-400">CS 개념 구조화 트리 캔버스 및 에빙하우스 복습 주기</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <ShieldCheck className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">AES-256 E2EE 종단간 암호화 보안</h4>
                <p className="text-[11px] text-neutral-400">24시간 후 자동 파기되는 익명 작전 통신실</p>
              </div>
            </div>
          </div>
        </div>

        {/* 우측 패널: 로그인 / 가입 / 비밀번호 폼 카드 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md p-6 sm:p-8 bg-neutral-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {showResetForm ? t('resetPassword') : t('systemAccess')}
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">OPERATOR AUTHENTICATION</p>
            </div>
          </div>

          {!showResetForm ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">이메일 계정</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder-neutral-600"
                  placeholder={t('emailPlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder-neutral-600"
                  placeholder={t('passwordPlaceholder')}
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-400 text-xs font-medium">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? t('accessing') : t('connect')}</span>
              </button>

              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="w-full py-2.5 border border-white/10 text-neutral-300 hover:text-white rounded-xl hover:bg-white/[0.05] transition-colors text-xs font-semibold"
              >
                {t('createNewIdentity')}
              </button>

              {/* 소셜 로그인 구분선 */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-neutral-500 text-[10px] uppercase font-mono">
                  {lang === 'ko' ? '간편 소셜 연동' : 'Or Social'}
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              {/* 소셜 로그인 버튼들 */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading}
                  className="w-full py-2.5 bg-white hover:bg-neutral-100 text-black font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  className="w-full py-2.5 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 fill-[#191919]" viewBox="0 0 24 24">
                    <path d="M12 3c-4.97 0-9 3.185-9 7.11 0 2.507 1.656 4.707 4.156 5.862l-1.056 3.864c-.08.293.088.585.377.65.088.02.176.02.256-.008l4.545-2.996C11.517 17.65 11.758 17.67 12 17.67c4.97 0 9-3.185 9-7.11C21 6.185 17.03 3 12 3z" />
                  </svg>
                  Kakao
                </button>
              </div>

              {/* 약관 동의 체크박스 */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="consent-login"
                  type="checkbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="rounded border-white/20 bg-black text-cyan-500 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="consent-login" className="text-xs text-neutral-400">
                  {t('privacyAgree')}{' '}
                  <span className="text-[10px] text-cyan-400 font-bold">
                    {lang === 'ko' ? '(회원가입 시 필수)' : '(Sign Up only)'}
                  </span>{' '}
                  (
                  <button 
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="underline hover:text-cyan-400 transition-colors"
                  >
                    {t('privacyPolicy')}
                  </button>
                  )
                </label>
              </div>

              {/* 하단 링크 */}
              <div className="pt-2 text-center flex items-center justify-center gap-3 text-xs text-neutral-400">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(true);
                    setResetEmail(email);
                    setError(null);
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  {t('forgotPassword')}
                </button>
                <span className="text-neutral-700">|</span>
                <Link
                  href="/"
                  className="hover:text-white transition-colors"
                >
                  {t('backToHome')}
                </Link>
              </div>
            </form>
          ) : (
            // 비밀번호 재설정 폼
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <p className="text-neutral-300 text-xs leading-relaxed">
                {t('resetDescription')}
              </p>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">등록된 이메일</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500/60"
                  placeholder={t('emailPlaceholder')}
                  required
                />
              </div>

              {error && <div className="text-red-400 text-xs">⚠️ {error}</div>}
              {resetMessage && <div className="text-emerald-400 text-xs">✅ {resetMessage}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
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
                className="w-full py-2.5 border border-white/10 text-neutral-300 rounded-xl hover:bg-white/[0.05] transition-colors text-xs"
              >
                {t('backToLogin')}
              </button>
            </form>
          )}
        </motion.div>
      </div>

      <div className="relative z-20 py-4 text-center text-[11px] text-neutral-600 font-mono">
        © 2026 CSE4Seoul. All rights reserved.
      </div>

      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        lang={lang}
      />
    </div>
  );
}