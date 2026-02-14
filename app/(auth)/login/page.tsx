'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setError('이메일을 확인해서 인증해주세요! (또는 Supabase에서 Confirm Email 끄면 바로 됨)');
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${location.origin}/auth/reset-password`,
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
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-black to-black z-0" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="z-10 w-full max-w-md p-8 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          {showResetForm ? 'Reset Password' : 'System Access'}
        </h2>

        {!showResetForm ? (
          // Login Form
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white"
              placeholder="Email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white"
              placeholder="Password"
              required
            />
            {error && <div className="text-red-400 text-sm">⚠️ {error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all"
            >
              {loading ? 'Accessing...' : 'Connect'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="w-full py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Create New Identity
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowResetForm(true);
                  setResetEmail(email); // Pre-fill with login email
                  setError(null);
                }}
                className="text-sm text-blue-400 hover:underline focus:outline-none"
              >
                Forgot password?
              </button>
            </div>
          </form>
        ) : (
          // Password Reset Form
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <p className="text-gray-300 text-sm mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white"
              placeholder="Your email"
              required
            />
            {error && <div className="text-red-400 text-sm">⚠️ {error}</div>}
            {resetMessage && <div className="text-green-400 text-sm">✅ {resetMessage}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
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
              Back to Login
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}