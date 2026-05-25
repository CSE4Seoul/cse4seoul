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
  const supabase = createClient();

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const stagger: Variants = {
    visible: { transition: { staggerChildren: 0.15 } },
  };

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
  }, []);

  const closeModal = () => setIsModalOpen(false);

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
            Computer Science &amp;&amp; Engineering for Seoul (CSE4Seoul) 커뮤니티는{' '}
            <span className="font-semibold text-cyan-300"><br />클래시로얄 클랜</span>을
            기반으로 한 개발자 &amp; 게이머 그룹입니다.
            <br />
            사이트 내에 구현된 암호화된 채팅과 게시판으로 안전하게 소통하며, <br />회원가입한 구성원이라면 누구나 참여할 수 있습니다.
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

        {/* 최근 활동 미리보기 (게시판 DB 연동) */}
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

        {/* 🔥 환율 정보 및 로비 채팅 위젯 */}
        <div className="mt-24 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <motion.div variants={fadeInUp}>
              <ExchangeRateWidget />
            </motion.div>
          </div>
          <div className="lg:col-span-2">
            <motion.div variants={fadeInUp}>
              <LobbyChatWidget />
            </motion.div>
          </div>
        </div>

        {/* 설립자 정보 */}
        <motion.div
          variants={fadeInUp}
          className="mt-20 text-center text-sm text-gray-500 pb-10"
        >
          <p>
            Founder: 조하민 (Developer) ·{' '}
            <a
              href="https://hamin-portfolio.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-cyan-400 underline decoration-cyan-400/70 underline-offset-4 hover:text-cyan-300 transition-colors"
            >
              포트폴리오 방문하기 ↗
            </a>
          </p>
          <p className="mt-2">
            <a
              href="https://royaleapi.com/clan/RRG9U0C9"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-cyan-400 underline decoration-cyan-400/70 underline-offset-4 hover:text-cyan-300 transition-colors"
            >
              Clash Royale - CSE4seoul(Royaleapi) ↗
            </a>
          </p>

            {/* 추가 1: 스탯티즈 */}
  <p className="mt-2">
    <a
      href="https://www.statiz.co.kr/"
      target="_blank"
      rel="noreferrer"
      className="inline-block text-cyan-400 underline decoration-cyan-400/70 underline-offset-4 hover:text-cyan-300 transition-colors"
    >
      KBO 기록 - 스탯티즈 ↗
    </a>
  </p>

  {/* 추가 2: 카톡 분석 서비스 (위젯 느낌) */}
<div className="mt-6 flex justify-center">
  <a
    href="https://chatanalyze.vercel.app/"
    target="_blank"
    rel="noreferrer"
    className="group w-full max-w-md rounded-2xl border border-cyan-400/30 bg-gray-900/60 p-5 backdrop-blur-md transition-all hover:scale-[1.02] hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-400/20"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-base font-semibold text-white">
          카카오톡 채팅 분석 서비스
        </p>
        <p className="text-sm text-gray-400 mt-1">
          대화 데이터를 업로드하고 통계·패턴을 분석해보세요
        </p>
      </div>

      <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">
        ↗
      </span>
    </div>
  </a>
</div>
        </motion.div>
      </motion.div>

      {/* 기능 소개 팝업 모달 */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-gradient-to-b from-gray-900 to-black border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 z-10 p-1 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              >
                <RiCloseLine className="text-2xl" />
              </button>

              <div
                className="overflow-y-auto overscroll-contain p-6 md:p-8"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-6">
                  ✨ CSE4Seoul 주요 기능
                </h2>

                <div className="space-y-6">
                  {/* 채팅 기능 상세 */}
                  <div className="border-l-4 border-cyan-500 pl-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <RiChat3Line className="text-cyan-400" /> 암호화 채팅
                    </h3>
                    <ul className="mt-2 space-y-2 text-gray-300 text-sm">
                      <li>• <strong className="text-cyan-300">AES-256 암호화</strong>로 모든 메시지를 안전하게 보호합니다.</li>
                      <li>• 사용자가 입력한 <strong className="text-cyan-300">비밀키(암호)</strong>를 암·복호화 키로 사용합니다.</li>
                      <li>• 같은 암호를 입력한 사용자끼리만 메시지를 볼 수 있습니다.</li>
                      <li>• 메시지는 <strong className="text-cyan-300">24시간 후 자동 삭제</strong>되어 보안성을 높입니다.</li>
                      <li>• 익명 모드와 닉네임 모드를 자유롭게 전환할 수 있습니다.</li>
                    </ul>
                  </div>

                  {/* 로비 채팅 기능 상세 */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <RiChat3Line className="text-green-400" /> 익명 로비 채팅
                    </h3>
                    <ul className="mt-2 space-y-2 text-gray-300 text-sm">
                      <li>• 로그인 없이 누구나 참여할 수 있는 <strong className="text-green-300">공개 채팅 공간</strong>입니다.</li>
                      <li>• 닉네임을 설정하여 대화할 수 있으며, 설정하지 않으면 <strong className="text-green-300">'익명의 요원'</strong>으로 표시됩니다.</li>
                      <li>• 메시지는 <strong className="text-green-300">24시간 후 자동 삭제</strong>되어 프라이버시를 보호합니다.</li>
                      <li>• 부적절한 표현은 자동 필터링되어 전송이 차단됩니다.</li>
                      <li>• 메인 화면에서 바로 실시간 대화를 즐길 수 있습니다.</li>
                    </ul>
                  </div>

                  {/* 게시판 기능 상세 */}
                  <div className="border-l-4 border-violet-500 pl-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <RiFileList3Line className="text-violet-400" /> 게시판
                    </h3>
                    <ul className="mt-2 space-y-2 text-gray-300 text-sm">
                      <li>• 프로젝트 모집, 기술 공유, 자유 주제 등 다양한 글을 작성할 수 있습니다.</li>
                      <li>• 실시간으로 게시글이 업데이트되며, 댓글 기능을 통해 소통할 수 있습니다.</li>
                      <li>• 최신 글은 메인 화면에서 바로 확인 가능합니다.</li>
                    </ul>
                  </div>

                  {/* 추가 보안 정보 */}
                  <div className="border-l-4 border-pink-500 pl-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <RiLock2Line className="text-pink-400" /> 보안 및 익명성
                    </h3>
                    <ul className="mt-2 space-y-2 text-gray-300 text-sm">
                      <li>• 채팅 메시지는 데이터베이스에 암호화된 상태로 저장됩니다.</li>
                      <li>• 24시간이 지나면 메시지는 완전히 삭제되어 흔적이 남지 않습니다.</li>
                      <li>• 사용자는 원할 때 익명 모드로 전환해 실제 이름을 숨길 수 있습니다.</li>
                    </ul>
                  </div>

                  {/* 가입 및 문의 안내 */}
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <RiGroupLine className="text-yellow-400" /> 가입 및 문의
                    </h3>
                    <ul className="mt-2 space-y-2 text-gray-300 text-sm">
                      <li>• <strong className="text-yellow-300">이메일 인증</strong>을 통해 회원가입할 수 있습니다. (Supabase Auth 사용)</li>
                      <li>• 비밀번호는 안전하게 암호화되어 저장되며, <strong className="text-yellow-300">다른 사이트와 동일한 비밀번호를 사용하지 않는 것을 권장</strong>합니다.</li>
                      <li>• 클랜원이 아니더라도 누구나 가입할 수 있습니다.</li>
                      <li>• 클랜에 관한 문의가 필요하다면, 로그인 후 <strong className="text-yellow-300">암호 없이 접속하는 기본 채팅</strong>에서 메시지를 남겨주세요. (기본 채팅은 누구나 볼 수 있는 공개 공간입니다)</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl text-white hover:from-gray-600 hover:to-gray-700 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
