'use client';

import { motion, Variants } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const stagger: Variants = {
    visible: { transition: { staggerChildren: 0.2 } }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black z-0" />

      <motion.div 
        className="z-10 text-center px-4 max-w-5xl"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeInUp} className="mb-6 flex justify-center">
          <span className="px-4 py-1.5 text-sm font-medium text-cyan-400 bg-cyan-950/50 border border-cyan-800 rounded-full backdrop-blur-md">
            CSE4Seoul Kernel v1.0
          </span>
        </motion.div>

        <motion.h1 
          variants={fadeInUp}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"
        >
          Game, Code, <br className="hidden md:block" /> and Evolve with AI.
        </motion.h1>

        <motion.p 
          variants={fadeInUp}
          className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto"
        >
          우리는 서울권 개발자 연합 <strong>CSE4Seoul</strong>입니다.<br/>
          리눅스의 오픈소스 정신을 계승하여, 실패를 두려워하지 않고<br/>
          함께 성장하는 <strong>Bazaar(시장)</strong> 모델을 지향합니다.
        </motion.p>

        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href="https://github.com/CSE4Seoul" target="_blank" className="px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
            GitHub 기여하기
          </a>
          <Link href="/login" className="px-8 py-4 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-white/10 transition-colors">
            클랜원 로그인
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}