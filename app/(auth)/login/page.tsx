'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginPage() {
  const { t, toggleLanguage } = useLanguage();
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

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    if (!isAgreed) {
      setError('개인정보 수집 및 이용에 동의해 주세요.');
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
      setError('이메일을 확인해서 인증해주세요! (또는 Supabase에서 Confirm Email 끄면 바로 됨)');
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetMessage(null);
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      // 🚨 이 부분을 톨게이트를 거치도록 수정하세요!
      redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
    });
    
    if (error) {
      setError(error.message);
    } else {
      setResetMessage('비밀번호 재설정 링크가 이메일로 전송되었습니다. 확인해주세요.');
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
            <div className="flex items-center gap-2 mt-2">
              <input
                id="consent-login"
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="consent-login" className="text-sm text-gray-300">
                개인정보 수집 · 이용에 동의합니다. (
                <a href="/privacy" className="underline">
                  개인정보 처리방침
                </a>
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
    </div>
  );
}