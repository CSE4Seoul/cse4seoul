'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.2 } }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden relative">
      
      {/* 배경 오로라 효과 */}
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
          <a 
            href="https://github.com/CSE4Seoul" 
            target="_blank"
            className="px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            {/* 깃허브 아이콘 */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub 기여하기
          </a>
          
          <Link
            href="/login"
            className="px-8 py-4 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-white/10 transition-colors"
          >
            클랜원 로그인
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}