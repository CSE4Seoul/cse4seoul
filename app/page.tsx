'use client';

import { useState, useEffect } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { 
  RiChat3Line, 
  RiFileList3Line, 
  RiGroupLine, 
  RiLock2Line,
  RiFlashlightLine,
  RiInformationLine,
  RiCloseLine
} from 'react-icons/ri';
import LobbyChatWidget from '@/components/LobbyChatWidget';
import ExchangeRateWidget from '@/components/ExchangeRateWidget';

// DB에서 가져올 게시글 타입 정의
interface Post {
  id: string | number;
  title: string;
  author_name: string;
  created_at: string;
}

export default function Home() {
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  // 사용자 정보 불러오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  // 시간 표시 함수
  const timeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays === 1) return '어제';
    return `${diffDays}일 전`;
  };

  // 최신 게시글 불러오기
  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, author_name, created_at')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        if (data) setRecentPosts(data);
      } catch (error) {
        console.error('최신 게시글 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentPosts();
  }, [supabase]);

  const closeModal = () => setIsModalOpen(false);

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-black px-4 text-white">
      {/* 배경 그라디언트 & 그리드 */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.16),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.14),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="z-10 w-full max-w-7xl py-12 md:py-20 flex flex-col gap-12">
        {/* 1. 로그인 정보 위젯 */}
        <div className="w-full max-w-5xl mx-auto">
          <div className="rounded-3xl border border-white/10 bg-gray-900/40 p-6 backdrop-blur-xl hover:border-cyan-500/30 transition-all duration-500 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <RiGroupLine className="text-2xl text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">접속 정보</h3>
                  <p className="text-sm text-gray-400">
                    {user ? `${user.email} 님 환영합니다` : '현재 비로그인 상태입니다'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {user ? (
                  <Link
                    href="/auth/signout"
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
                  >
                    로그아웃
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/20"
                    >
                      로그인
                    </Link>
                    <Link
                      href="/auth/sign-up"
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
                    >
                      회원가입
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>



        {/* 3. 그 아래 원래 있었던 것들 */}
        <div className="flex flex-col gap-24 mt-12">
          {/* 히어로 섹션 */}
          <div className="text-center">
            <span className="inline-block rounded-full border border-cyan-700/70 bg-cyan-900/40 px-4 py-1.5 text-sm font-medium text-cyan-300">
              CSE4Seoul 커뮤니티
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight md:text-7xl bg-gradient-to-r from-blue-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
              함께 만들고, 함께 성장하는
              <br />
              우리들의 공간
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 md:text-xl">
              Computer Science && Engineering for Seoul (CSE4Seoul) 커뮤니티는{' '}
              <span className="font-semibold text-cyan-300"><br />클래시로얄 클랜</span>을
              기반으로 한 개발자 & 게이머 그룹입니다.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="rounded-xl bg-white px-8 py-4 font-bold text-black transition-colors hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
              >
                시스템 접속하기
              </Link>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-4 font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <RiInformationLine className="text-xl" />
                자세한 기능 소개
              </button>
            </div>
          </div>

                    {/* 🔥 로비 채팅 위젯 */}
          <div className="w-full max-w-5xl mx-auto relative z-20">
            <div className="w-full">
              <LobbyChatWidget />
            </div>
          </div>
      {/* 2. 환율 / 나스닥 / S&P 500 위젯 */}
        <div className="w-full max-w-5xl mx-auto">
          <ExchangeRateWidget />
        </div>

          {/* 기능 카드 섹션 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <RiChat3Line className="text-4xl text-cyan-400" />
              <h3 className="mt-4 text-xl font-bold">실시간 암호화 채팅</h3>
              <p className="mt-2 text-sm text-gray-400">
                AES-256으로 메시지를 암호화합니다. 비밀번호를 입력한 사람만 해당 채팅을 볼 수 있어요.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <RiFileList3Line className="text-4xl text-violet-400" />
              <h3 className="mt-4 text-xl font-bold">자유로운 게시판</h3>
              <p className="mt-2 text-sm text-gray-400">
                프로젝트 모집, 정보 공유, 일상 대화까지. 클랜원들과 다양한 주제로 소통하세요.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <RiGroupLine className="text-4xl text-pink-400" />
              <h3 className="mt-4 text-xl font-bold">클랜원 네트워크</h3>
              <p className="mt-2 text-sm text-gray-400">
                현재 활동 중인 수많은 클랜원들. 함께 성장할 최고의 동료들을 만나보세요.
              </p>
            </div>
          </div>

          {/* 최근 활동 미리보기 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">📢 최근 게시글</h2>
              <Link href="/login" className="text-sm text-cyan-400 hover:underline">
                더 보기 →
              </Link>
            </div>
            <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">통신망 스캔 중...</div>
              ) : recentPosts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">아직 등록된 게시글이 없습니다.</div>
              ) : (
                recentPosts.map((post) => (
                  <Link 
                    href="/login"
                    key={post.id} 
                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-sm text-gray-500">
                        {post.author_name} · {timeAgo(post.created_at)}
                      </p>
                    </div>
                    <RiLock2Line className="text-gray-600" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* 보안 강조 */}
          <div className="flex flex-col items-center rounded-3xl border border-violet-400/30 bg-violet-900/20 p-8 text-center shadow-[0_0_40px_rgba(139,92,246,0.1)]">
            <RiFlashlightLine className="text-5xl text-violet-300 mb-4" />
            <h3 className="text-2xl font-bold mb-2">보안을 최우선으로</h3>
            <p className="max-w-xl text-violet-200/90 mb-6">
              모든 채팅은 암호화되어 저장되며, 24시간 후 자동 삭제되어 익명성이 완벽하게 보장됩니다.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-cyan-300 border border-cyan-500/30">AES-256</span>
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-cyan-300 border border-cyan-500/30">End-to-End Encryption</span>
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-cyan-300 border border-cyan-500/30">자동 삭제 (24h)</span>
            </div>
          </div>


          {/* 설립자 정보 */}
          <div className="text-center text-sm text-gray-500 pb-10">
            <p>Founder: 조하민 (Developer) · <a href="https://hamin-portfolio.vercel.app/" target="_blank" rel="noreferrer" className="text-cyan-400 underline decoration-cyan-400/70 hover:text-cyan-300">포트폴리오 ↗</a></p>
            <p className="mt-2"><a href="https://royaleapi.com/clan/RRG9U0C9" target="_blank" rel="noreferrer" className="text-cyan-400 underline decoration-cyan-400/70 hover:text-cyan-300">Clash Royale - CSE4seoul ↗</a></p>
            <p className="mt-2"><a href="https://www.statiz.co.kr/" target="_blank" rel="noreferrer" className="text-cyan-400 underline decoration-cyan-400/70 hover:text-cyan-300">KBO 기록 - 스탯티즈 ↗</a></p>
            <div className="mt-6 flex justify-center">
              <a href="https://chatanalyze.vercel.app/" target="_blank" rel="noreferrer" className="group w-full max-w-md rounded-2xl border border-cyan-400/30 bg-gray-900/60 p-5 backdrop-blur-md transition-all hover:scale-[1.02] hover:border-cyan-400/60 hover:shadow-cyan-400/20 shadow-lg">
                <div className="flex items-center justify-between text-left">
                  <div>
                    <p className="font-semibold text-white">카카오톡 채팅 분석 서비스</p>
                    <p className="text-sm text-gray-400 mt-1">대화 데이터를 업로드하고 통계·패턴을 분석해보세요</p>
                  </div>
                  <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">↗</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 기능 소개 팝업 모달 */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="relative max-w-2xl w-full bg-gradient-to-b from-gray-900 to-black border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
              <button onClick={closeModal} className="absolute right-4 top-4 z-10 p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"><RiCloseLine className="text-2xl" /></button>
              <div className="overflow-y-auto p-6 md:p-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-6">✨ CSE4Seoul 주요 기능</h2>
                <div className="space-y-6">
                  <div className="border-l-4 border-cyan-500 pl-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2"><RiChat3Line className="text-cyan-400" /> 암호화 채팅</h3>
                    <ul className="mt-2 space-y-2 text-gray-300 text-sm">
                      <li>• <strong>AES-256 암호화</strong>로 모든 메시지를 보호합니다.</li>
                      <li>• <strong>24시간 후 자동 삭제</strong>되어 보안성을 높입니다.</li>
                    </ul>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2"><RiChat3Line className="text-green-400" /> 익명 로비 채팅</h3>
                    <ul className="mt-2 space-y-2 text-gray-300 text-sm">
                      <li>• 로그인 없이 참여 가능한 <strong>공개 채팅 공간</strong>입니다.</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button onClick={closeModal} className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl text-white">닫기</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
