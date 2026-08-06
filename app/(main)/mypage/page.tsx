'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { 
  RiUser3Line, 
  RiQuestionAnswerLine, 
  RiCheckLine, 
  RiTimeLine, 
  RiLock2Line,
  RiArrowLeftLine,
  RiLoader4Line
} from 'react-icons/ri';
import Link from 'next/link';

interface MyQna {
  id: string;
  content: string;
  reply: string | null;
  status: 'PENDING' | 'POSTED' | 'HOLD';
  is_private: boolean;
  created_at: string;
}

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [qnas, setQnas] = useState<MyQna[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);

          // 프로필 가져오기
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (prof) setProfile(prof);

          // 나의 1:1 문의 가져오기
          const res = await fetch('/api/qna?my=true');
          const data = await res.json();
          if (res.ok && data.qnas) {
            setQnas(data.qnas);
          }
        }
      } catch (err) {
        console.error('마이페이지 로딩 에러:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8 pt-24 font-sans">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* 상단 뒤로가기 링크 */}
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <RiArrowLeftLine className="text-base" /> 메인화면으로 돌아가기
          </Link>
          <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            MYPAGE DASHBOARD
          </span>
        </div>

        {/* 👤 유저 정보 헤더 카드 */}
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-8 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full rounded-[14px] bg-[#0d0d14] flex items-center justify-center">
                <RiUser3Line className="text-2xl text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {profile?.nickname || user?.email?.split('@')[0] || '방문자'}
                {profile?.role === 'admin' && (
                  <span className="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-md font-semibold">
                    ADMIN
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{user?.email || '계정 정보 로딩 중...'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
            <div className="flex-1 md:flex-none text-center md:text-right bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-2.5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">총 1:1 문의 수</p>
              <p className="text-lg font-bold text-cyan-400 font-mono">{qnas.length}건</p>
            </div>
          </div>
        </div>

        {/* 💬 내 1:1 문의 & Q&A 내역 목록 */}
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-8 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <RiQuestionAnswerLine className="text-lg" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">나의 1:1 문의 및 답변 내역</h2>
                <p className="text-xs text-gray-400">작성하신 비밀 문의와 관리자의 답변 상태를 실시간으로 확인합니다.</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-sm text-gray-400">
              <RiLoader4Line className="text-xl animate-spin text-cyan-500" />
              문의 내역을 불러오는 중...
            </div>
          ) : qnas.length === 0 ? (
            <div className="py-12 text-center border border-white/5 rounded-2xl bg-black/20 text-gray-400 text-xs">
              <p className="mb-2">아직 남기신 1:1 문의 내역이 없습니다.</p>
              <Link href="/#qna" className="text-cyan-400 hover:underline">
                메인화면 Q&A 위젯에서 문의 남기기 →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {qnas.map((q) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 border border-white/[0.06] rounded-2xl bg-black/30 flex flex-col gap-3 hover:border-cyan-500/20 transition-all"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {q.is_private && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 font-medium">
                          <RiLock2Line className="text-xs" /> 비밀 문의
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(q.created_at).toLocaleString()}
                      </span>
                    </div>

                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      q.reply || q.status === 'POSTED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {q.reply || q.status === 'POSTED' ? (
                        <span className="flex items-center gap-1"><RiCheckLine /> 답변 완료</span>
                      ) : (
                        <span className="flex items-center gap-1"><RiTimeLine /> 답변 대기중</span>
                      )}
                    </span>
                  </div>

                  <div className="text-sm text-gray-100 bg-white/[0.02] p-3.5 rounded-xl border border-white/5 leading-relaxed">
                    <span className="font-bold text-cyan-400 mr-2">Q.</span>
                    {q.content}
                  </div>

                  {q.reply ? (
                    <div className="text-sm text-cyan-200 bg-cyan-950/20 p-4 rounded-xl border border-cyan-500/20 leading-relaxed mt-1">
                      <div className="text-xs font-bold text-cyan-400 mb-1 flex items-center gap-1">
                        <span>💬 관리자 답변</span>
                      </div>
                      <p className="text-gray-200">{q.reply}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic pl-1">
                      * 관리자가 내용을 확인 후 답변을 작성 중입니다.
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
