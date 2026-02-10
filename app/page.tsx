'use client';

import { motion, Variants } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const stagger: Variants = {
    visible: { transition: { staggerChildren: 0.14 } },
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-4 text-white">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.16),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.14),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:42px_42px]" />

      <motion.section
        className="z-10 w-full max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_0_80px_rgba(99,102,241,0.18)] backdrop-blur-md md:p-14"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeInUp} className="mb-6 flex justify-center">
          <span className="rounded-full border border-cyan-700/70 bg-cyan-900/40 px-4 py-1.5 text-sm font-medium text-cyan-300">
            CSE4Seoul • Command Lobby
          </span>
        </motion.div>

        <motion.h1
          variants={fadeInUp}
          className="mb-6 text-4xl font-black tracking-tight text-transparent md:text-7xl bg-gradient-to-r from-blue-300 via-violet-300 to-pink-300 bg-clip-text"
        >
          Build Fast. Battle Smart.
          <br className="hidden md:block" />
          Grow Together.
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className="mx-auto mb-10 max-w-3xl text-base leading-relaxed text-gray-300 md:text-xl"
        >
          우리는 서울권 개발자 연합 <strong>CSE4Seoul</strong>입니다.
          <br />
          실험과 협업을 통해 더 빠르게 만들고, 더 단단하게 성장합니다.
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="https://github.com/CSE4Seoul"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-white px-8 py-4 font-bold text-black transition-colors hover:bg-gray-200"
          >
            GitHub 기여하기
          </a>
          <Link
            href="/login"
            className="rounded-xl border border-white/25 px-8 py-4 font-semibold text-gray-200 transition-colors hover:bg-white/10"
          >
            클랜원 로그인
          </Link>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="mx-auto max-w-2xl rounded-2xl border border-violet-400/30 bg-violet-900/20 p-5 text-sm text-violet-100 md:text-base"
        >
          <p className="font-semibold">Founder: 조하민 (Developer)</p>
          <p className="mt-1 text-violet-200/90">CSE4Seoul의 설립자입니다. 아래 링크에서 포트폴리오를 확인해보세요.</p>
          <a
            href="https://hamin-portfolio.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block font-bold text-cyan-300 underline decoration-cyan-400/70 underline-offset-4 transition-colors hover:text-cyan-200"
          >
            hamin-portfolio.vercel.app 방문하기 ↗
          </a>
        </motion.div>
      </motion.section>
    </main>
  );
}
