'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. 비밀번호 확인 교차 검증
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 2. 최소 길이 검증
    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    setError(null);

    // 3. Supabase에 새 비밀번호 덮어쓰기 요청
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      alert('✅ 비밀번호가 성공적으로 변경되었습니다! 통제실로 이동합니다.');
      router.push('/dashboard'); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-black to-black z-0" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="z-10 w-full max-w-md p-8 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
          Update Security Key
        </h2>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <p className="text-gray-400 text-sm mb-6 text-center">
            새로운 접근 암호를 입력해 주십시오.
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="New Password (최소 8자)"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="Confirm New Password"
            required
          />
          
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-gray-800 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-emerald-900/50'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              'Confirm New Password'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}