"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

/**
 * 📢 CSE4Seoul 클랜 영광의 순간 갤러리 위젯
 * 
 * [설명]
 * - public/assets/moment-gallery 디렉터리의 정적 이미지를 활용합니다.
 * - Framer Motion으로 사이버펑크 스타일의 부드러운 전환 효과를 구현합니다.
 * - 터치 스와이프 및 자동 슬라이드(5초)를 지원합니다.
 */

// 1. 갤러리 이미지 데이터 (로컬 public 디렉터리 기준)
const GALLERY_IMAGES = [
  {
    id: 1,
    src: '/assets/moment-gallery/hamin_3crown_win_1.PNG',
    title: 'HAMIN: 완벽한 3크라운 승리',
    description: 'CSE4Seoul의 자존심, HAMIN 선수의 압도적인 3크라운 승리 현장!',
    bgColor: 'rgba(56, 189, 248, 0.1)', // Cyber Blue Accent
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
    scale: 1.1,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.9,
    filter: 'blur(5px)', // 사이버펑크 느낌의 블러 퇴장
  }),
};

export default function MomentGallery() {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isHovered, setIsHovered] = useState(false);

  const imageIndex = page % GALLERY_IMAGES.length;
  // 음수 인덱스 처리
  const currentImage = GALLERY_IMAGES[imageIndex < 0 ? GALLERY_IMAGES.length + imageIndex : imageIndex];

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  // 5초마다 자동 슬라이드 (호버 시 일시 정지)
  useEffect(() => {
    if (!isHovered && GALLERY_IMAGES.length > 1) {
      const timer = setInterval(() => {
        paginate(1);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [page, isHovered]);

  if (!GALLERY_IMAGES || GALLERY_IMAGES.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-700 rounded-2xl flex items-center justify-center h-96 bg-gray-900/50">
        <p className="text-gray-500 font-cyber">No moments captured yet.</p>
      </div>
    );
  }

  return (
    <div 
      className="relative flex flex-col md:flex-row bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden shadow-cyber-blue group h-auto md:h-96"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. 이미지 영역 (왼쪽) */}
      <div className="relative flex-1 aspect-[9/16] md:aspect-auto overflow-hidden border-b md:border-b-0 md:border-r border-gray-800 min-h-[250px]">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.4 },
              scale: { duration: 0.4 },
              filter: { duration: 0.3 }
            }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={currentImage.src}
              alt={currentImage.title}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={currentImage.id === 1}
            />
            {/* Cyberpunk Glow Overlay */}
            <div 
              className="absolute inset-0"
              style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 60%, ${currentImage.bgColor} 100%)`}}
            />
          </motion.div>
        </AnimatePresence>

        {/* 내비게이션 버튼 (호버 시 노출) */}
        {GALLERY_IMAGES.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button 
              onClick={() => paginate(-1)} 
              className="p-2 rounded-full bg-gray-900/80 text-cyan-400 border border-cyan-800 hover:bg-cyan-900 hover:border-cyan-500 transition-all shadow-glow-blue"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => paginate(1)} 
              className="p-2 rounded-full bg-gray-900/80 text-cyan-400 border border-cyan-800 hover:bg-cyan-900 hover:border-cyan-500 transition-all shadow-glow-blue"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>

      {/* 2. 텍스트 정보 영역 (오른쪽) */}
      <div className="flex-1 flex flex-col justify-between p-6 md:p-10 font-cyber">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-cyan-400 bg-cyan-950 border border-cyan-800 tracking-wider">
              CLAN MOMENTS
            </span>
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-glow-blue" />
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <h3 className="text-3xl font-black text-gray-50 tracking-tighter leading-tight text-glow-white">
                {currentImage.title}
              </h3>
              <p className="text-gray-400 text-base font-sans font-light leading-relaxed">
                {currentImage.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 하단 인디케이터 & 액션 */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/50">
          <div className="flex gap-1.5">
            {GALLERY_IMAGES.map((_, index) => (
              <button
                key={index}
                onClick={() => setPage([index, index > imageIndex ? 1 : -1])}
                className={`w-2 h-2 rounded-full transition-all ${index === imageIndex ? 'bg-cyan-400 w-6 shadow-glow-blue' : 'bg-gray-700 hover:bg-gray-500'}`}
              />
            ))}
          </div>
          <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-cyan-300 transition-colors">
            <Maximize2 size={16} />
            <span>확대 보기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
