'use client';

import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { 
  RiChat3Line, 
  RiFileList3Line, 
  RiGroupLine, 
  RiLock2Line,
  RiFlashlightLine 
} from 'react-icons/ri';

// DB에서 가져올 게시글 타입 정의
interface Post {
  id: string | number;
  title: string;
  author_name: string; // DB 컬럼명에 따라 수정 필요
  created_at: string;
}

export default function Home() {
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const stagger: Variants = {
    visible: { transition: { staggerChildren: 0.15 } },
  };

  // 1. 작성 시간을 'N시간 전', '어제' 형태로 예쁘게 바꿔주는 마법의 함수!
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

  // 2. Supabase에서 최신 글 3개 땡겨오기
  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts') // 🚨 주의: 게시판 테이블 이름('posts'나 'board' 등)으로 꼭 맞춰주세요!
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
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-black px-4 text-white">
      {/* 배경 그라디언트 & 그리드 */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.16),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.14),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:42px_42px]" />

      <motion.div
        className="z-10 w-full max-w-7xl py-12 md:py-20"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* 히어로 섹션 */}
        <motion.div variants={fadeInUp} className="text-center">
          <span className="inline-block rounded-full border border-cyan-700/70 bg-cyan-900/40 px-4 py-1.5 text-sm font-medium text-cyan-300">
            CSE4Seoul 커뮤니티
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-7xl bg-gradient-to-r from-blue-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
            함께 만들고, 함께 성장하는
            <br />
            우리들의 공간
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 md:text-xl">
            암호화된 채팅과 게시판으로 안전하게 소통해요.
            <br />
            클랜원이라면 누구나 참여할 수 있습니다.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {/* 로그인 안 된 유저를 무조건 로그인 창으로! */}
            <Link
              href="/login"
              className="rounded-xl bg-white px-8 py-4 font-bold text-black transition-colors hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
            >
              시스템 접속하기
            </Link>
          </div>
        </motion.div>

        {/* 기능 카드 섹션 */}
        <div className="mt-24 grid grid-cols-1 gap-6 md:grid-cols-3">
          <motion.div variants={fadeInUp} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <RiChat3Line className="text-4xl text-cyan-400" />
            <h3 className="mt-4 text-xl font-bold">실시간 암호화 채팅</h3>
            <p className="mt-2 text-sm text-gray-400">
              AES-256으로 메시지를 암호화합니다. 비밀번호를 입력한 사람만 해당 채팅을 볼 수 있어요.
            </p>
          </motion.div>
          <motion.div variants={fadeInUp} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <RiFileList3Line className="text-4xl text-violet-400" />
            <h3 className="mt-4 text-xl font-bold">자유로운 게시판</h3>
            <p className="mt-2 text-sm text-gray-400">
              프로젝트 모집, 정보 공유, 일상 대화까지. 클랜원들과 다양한 주제로 소통하세요.
            </p>
          </motion.div>
          <motion.div variants={fadeInUp} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <RiGroupLine className="text-4xl text-pink-400" />
            <h3 className="mt-4 text-xl font-bold">클랜원 네트워크</h3>
            <p className="mt-2 text-sm text-gray-400">
              현재 활동 중인 수많은 클랜원들. 함께 성장할 최고의 동료들을 만나보세요.
            </p>
          </motion.div>
        </div>

        {/* 최근 활동 미리보기 (게시판 DB 연동!) */}
        <motion.div variants={fadeInUp} className="mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">📢 최근 게시글</h2>
            <Link href="/login" className="text-sm text-cyan-400 hover:underline">
              더 보기 →
            </Link>
          </div>
          
          <div className="mt-4 divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">통신망 스캔 중...</div>
            ) : recentPosts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">아직 등록된 게시글이 없습니다.</div>
            ) : (
              recentPosts.map((post) => (
                <Link 
                  href="/login" // 👈 클릭 시 무조건 로그인 창으로 납치!
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
        </motion.div>

        {/* 보안 & 커뮤니티 특징 */}
        <motion.div
          variants={fadeInUp}
          className="mt-24 flex flex-col items-center rounded-3xl border border-violet-400/30 bg-violet-900/20 p-8 text-center shadow-[0_0_40px_rgba(139,92,246,0.1)]"
        >
          <RiFlashlightLine className="text-5xl text-violet-300" />
          <h3 className="mt-4 text-2xl font-bold">보안을 최우선으로</h3>
          <p className="mt-2 max-w-xl text-violet-200/90">
            모든 채팅은 암호화되어 저장되며, 본인이 설정한 암호로만 복호화됩니다.
            <br />
            24시간 후 자동 삭제되어 익명성이 완벽하게 보장됩니다.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-cyan-300 border border-cyan-500/30">
              AES-256
            </span>
            <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-cyan-300 border border-cyan-500/30">
              End-to-End Encryption
            </span>
            <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-cyan-300 border border-cyan-500/30">
              자동 삭제 (24h)
            </span>
          </div>
        </motion.div>

        {/* 설립자 정보 */}
        <motion.div
          variants={fadeInUp}
          className="mt-20 text-center text-sm text-gray-500 pb-10"
        >
          <p>
            Founder: 조하민 (Developer) · {' '}
            <a
              href="https://hamin-portfolio.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-cyan-400 underline decoration-cyan-400/70 underline-offset-4 hover:text-cyan-300 transition-colors"
            >
              포트폴리오 방문하기 ↗
            </a>
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}