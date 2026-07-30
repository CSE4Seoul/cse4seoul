"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  X, 
  Play, 
  Pause, 
  Trophy, 
  Sparkles,
  Flame
} from 'lucide-react';

/**
 * 📢 CSE4Seoul 클랜 영광의 순간 갤러리 위젯
 * 
 * [주요 기능]
 * 1. HAMIN & 아이언크랩 등 클랜원의 3크라운 승리 인증샷 슬라이더 (메인 & 대시보드 공용)
 * 2. 5초 자동 슬라이드 전환 및 실시간 카운트다운 프로그레스 바 (시간에 따라 자동 이동)
 * 3. 풀스크린 확대보기(Lightbox) 모달 + Zoom In/Out/Reset 및 드래그 패닝 기능
 * 4. 하단/사이드 썸네일 카드 뷰 지원 (기존 hamin_3* 및 아이언크랩_3* 사진 나란히 배치)
 */

export interface MomentImage {
  id: string;
  src: string;
  title: string;
  player: string;
  tag: string;
  description: string;
  date: string;
  bgColor: string;
  accentColor: string;
  badgeText: string;
  stats?: string;
}

// 1. 갤러리 이미지 데이터 (로컬 public 디렉터리 기준)
const GALLERY_IMAGES: MomentImage[] = [
  {
    id: 'hamin_3crown',
    src: '/assets/moment-gallery/hamin_3crown_win_1.PNG',
    title: 'HAMIN: 완벽한 3크라운 승리',
    player: 'HAMIN',
    tag: '3-CROWN VICTORY',
    description: 'CSE4Seoul의 자존심, HAMIN 선수의 압도적인 3크라운 클리어 현장!',
    date: '2026.07',
    bgColor: 'rgba(56, 189, 248, 0.15)', // Cyber Blue Accent
    accentColor: '#38bdf8',
    badgeText: 'LEGENDARY',
    stats: 'PERFECT 3-CROWN',
  },
  {
    id: 'ironcrab_3crown',
    src: '/assets/moment-gallery/아이언크랩_3crown_win_1.PNG',
    title: '아이언크랩: 3크라운 대승리',
    player: '아이언크랩',
    tag: '3-CROWN VICTORY',
    description: 'CSE4Seoul 클랜 전설의 아이언크랩 선수의 화려한 3크라운 클리어 순간!',
    date: '2026.07',
    bgColor: 'rgba(168, 85, 247, 0.15)', // Cyber Purple Accent
    accentColor: '#c084fc',
    badgeText: 'CLAN MVP',
    stats: 'EPIC MATCH',
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 800 : -800,
    opacity: 0,
    scale: 1.05,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 800 : -800,
    opacity: 0,
    scale: 0.95,
    filter: 'blur(6px)', // 사이버펑크 스타일 블러
  }),
};

const AUTO_SLIDE_INTERVAL = 5000; // 5초

export default function MomentGallery() {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // 확대 보기 (Lightbox Modal) 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalZoomScale, setModalZoomScale] = useState(1);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const imageIndex = Math.abs(page % GALLERY_IMAGES.length);
  const currentImage = GALLERY_IMAGES[imageIndex];

  const paginate = useCallback((newDirection: number) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
  }, []);

  const selectSlide = (index: number) => {
    const newDir = index > imageIndex ? 1 : -1;
    setPage([index, newDir]);
  };

  // 5초마다 자동 슬라이드 (호버 시 또는 일시정지 버튼 누를 시 일시 정지)
  useEffect(() => {
    if (!isPlaying || isHovered || isModalOpen || GALLERY_IMAGES.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      paginate(1);
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [isPlaying, isHovered, isModalOpen, paginate]);

  // 라이트박스 열기
  const openLightbox = (indexToOpen = imageIndex) => {
    setModalImageIndex(indexToOpen);
    setModalZoomScale(1);
    setIsModalOpen(true);
  };

  // 라이트박스 닫기
  const closeLightbox = () => {
    setIsModalOpen(false);
    setModalZoomScale(1);
  };

  // 키보드 단축키 지원 (ESC, 좌우 화살표)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') {
          setModalImageIndex((prev) => (prev > 0 ? prev - 1 : GALLERY_IMAGES.length - 1));
          setModalZoomScale(1);
        }
        if (e.key === 'ArrowRight') {
          setModalImageIndex((prev) => (prev < GALLERY_IMAGES.length - 1 ? prev + 1 : 0));
          setModalZoomScale(1);
        }
      } else {
        if (e.key === 'ArrowLeft') paginate(-1);
        if (e.key === 'ArrowRight') paginate(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, paginate]);

  const modalCurrentImage = GALLERY_IMAGES[modalImageIndex];

  return (
    <>
      <div 
        className="relative flex flex-col bg-gray-950 border border-gray-800/80 rounded-3xl overflow-hidden shadow-2xl group transition-all duration-300 hover:border-cyan-500/30"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 상단 헤더 & 컨트롤 바 */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900/60 border-b border-gray-800/60 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-700/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <Trophy size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-cyber text-cyan-400 tracking-wider">
                  CLAN MOMENTS GALLERY
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
              </div>
              <p className="text-xs text-gray-400 font-sans font-light">
                CSE4Seoul 영광의 순간 (HAMIN & 아이언크랩 3크라운)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 자동 재생/일시정지 토글 버튼 */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-700/60 transition-all"
              title={isPlaying ? "자동 슬라이드 일시정지" : "자동 슬라이드 재생"}
            >
              {isPlaying ? <Pause size={14} className="text-cyan-400" /> : <Play size={14} className="text-emerald-400" />}
              <span className="hidden sm:inline font-cyber text-[11px]">
                {isPlaying ? "AUTO" : "PAUSED"}
              </span>
            </button>

            {/* 전체 화면 확대보기 버튼 */}
            <button
              onClick={() => openLightbox(imageIndex)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:scale-105 active:scale-95"
            >
              <Maximize2 size={14} />
              <span className="font-cyber">확대 보기</span>
            </button>
          </div>
        </div>

        {/* 상단 프로그레스 바 (자동 슬라이드 카운트다운) */}
        {isPlaying && !isHovered && !isModalOpen && (
          <div className="w-full bg-gray-900 h-1 overflow-hidden">
            <motion.div
              key={page}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: AUTO_SLIDE_INTERVAL / 1000, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
            />
          </div>
        )}

        {/* 본문 레이아웃: 이미지 영역 (상단/좌측) + 상세설명 & 썸네일 스트립 (하단/우측) */}
        <div className="flex flex-col lg:flex-row h-auto lg:h-[420px]">
          {/* 1. 이미지 메인 뷰어 */}
          <div className="relative flex-1 aspect-[16/10] lg:aspect-auto overflow-hidden bg-black/60 min-h-[280px] sm:min-h-[350px]">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={page}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 260, damping: 28 },
                  opacity: { duration: 0.35 },
                  scale: { duration: 0.35 },
                }}
                className="absolute inset-0 w-full h-full cursor-pointer group/img"
                onClick={() => openLightbox(imageIndex)}
              >
                <Image
                  src={currentImage.src}
                  alt={currentImage.title}
                  fill
                  className="object-contain lg:object-cover object-center transition-transform duration-500 group-hover/img:scale-105"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority={imageIndex === 0}
                />
                
                {/* Cyberpunk Dynamic Gradient Overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{ 
                    backgroundImage: `linear-gradient(to top, rgba(3, 7, 18, 0.9) 0%, rgba(3, 7, 18, 0.2) 50%, rgba(3, 7, 18, 0.4) 100%)`
                  }}
                />

                {/* 이미지 위 호버 시 나타나는 확대 아이콘 오버레이 */}
                <div className="absolute inset-0 bg-cyan-950/30 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                  <div className="px-4 py-2 rounded-2xl bg-black/80 border border-cyan-400/60 text-cyan-300 flex items-center gap-2 shadow-glow-blue font-cyber text-sm tracking-wider">
                    <Maximize2 size={18} />
                    <span>클릭하여 확대 보기</span>
                  </div>
                </div>

                {/* 이미지 내 태그 뱃지 */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <span className="px-3 py-1 rounded-lg text-xs font-black tracking-widest text-cyan-300 bg-cyan-950/90 border border-cyan-600/80 shadow-glow-blue font-cyber">
                    {currentImage.tag}
                  </span>
                  <span className="px-3 py-1 rounded-lg text-xs font-black tracking-widest text-purple-300 bg-purple-950/90 border border-purple-600/80 font-cyber flex items-center gap-1">
                    <Sparkles size={12} />
                    {currentImage.badgeText}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* 슬라이드 이전/다음 내비게이션 화살표 */}
            {GALLERY_IMAGES.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none z-20">
                <button 
                  onClick={(e) => { e.stopPropagation(); paginate(-1); }} 
                  className="pointer-events-auto p-2.5 rounded-full bg-gray-950/80 text-cyan-400 border border-cyan-800/80 hover:bg-cyan-900 hover:border-cyan-400 hover:scale-110 transition-all shadow-glow-blue"
                  aria-label="이전 사진"
                >
                  <ChevronLeft size={22} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); paginate(1); }} 
                  className="pointer-events-auto p-2.5 rounded-full bg-gray-950/80 text-cyan-400 border border-cyan-800/80 hover:bg-cyan-900 hover:border-cyan-400 hover:scale-110 transition-all shadow-glow-blue"
                  aria-label="다음 사진"
                >
                  <ChevronRight size={22} />
                </button>
              </div>
            )}
          </div>

          {/* 2. 우측/하단: 사진 타이틀 정보 & 나란히 정렬된 썸네일 카드 영역 */}
          <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col justify-between p-6 bg-gray-950/90 border-t lg:border-t-0 lg:border-l border-gray-800/70 font-cyber">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame size={18} className="text-amber-400 animate-bounce" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    PLAYER: <span className="text-cyan-300 font-extrabold">{currentImage.player}</span>
                  </span>
                </div>
                <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2.5 py-1 rounded-md border border-gray-800">
                  {imageIndex + 1} / {GALLERY_IMAGES.length}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  <h3 className="text-2xl font-black text-white tracking-tight leading-snug">
                    {currentImage.title}
                  </h3>
                  <p className="text-sm text-gray-300 font-sans leading-relaxed font-light">
                    {currentImage.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 3. 사진 나란히 배치 (나란히 정렬된 썸네일 내비게이션 스트립) */}
            <div className="mt-6 pt-5 border-t border-gray-800/80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-cyan-400" />
                  갤러리 사진 목록 (선택 이동)
                </span>
                <span className="text-[11px] text-cyan-400 font-sans">
                  클릭시 바로 이동
                </span>
              </div>

              {/* HAMIN & 아이언크랩 썸네일 그리드 */}
              <div className="grid grid-cols-2 gap-3">
                {GALLERY_IMAGES.map((img, idx) => {
                  const isActive = idx === imageIndex;
                  return (
                    <button
                      key={img.id}
                      onClick={() => selectSlide(idx)}
                      className={`relative flex flex-col p-2 rounded-2xl border transition-all duration-300 text-left overflow-hidden group/thumb ${
                        isActive
                          ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] scale-[1.02]'
                          : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900'
                      }`}
                    >
                      <div className="relative w-full h-16 rounded-xl overflow-hidden mb-2 bg-black">
                        <Image
                          src={img.src}
                          alt={img.title}
                          fill
                          className={`object-cover transition-transform duration-300 group-hover/thumb:scale-110 ${
                            isActive ? 'opacity-100' : 'opacity-60 group-hover/thumb:opacity-90'
                          }`}
                        />
                        {isActive && (
                          <div className="absolute inset-0 border-2 border-cyan-400 rounded-xl pointer-events-none" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-cyan-300' : 'text-gray-400'}`}>
                          {img.player}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          3Crown
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 풀스크린 확대 보기 (LIGHTBOX MODAL) */}
      <AnimatePresence>
        {isModalOpen && modalCurrentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8"
            onClick={closeLightbox}
          >
            {/* 상단 툴바 (제목 + 줌 컨트롤 + 닫기) */}
            <div 
              className="absolute top-0 left-0 right-0 p-4 md:px-8 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent z-50 font-cyber"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-cyan-400 bg-cyan-950 border border-cyan-800">
                  {modalCurrentImage.player} MOMENT
                </span>
                <h4 className="text-base font-bold text-white hidden sm:block">
                  {modalCurrentImage.title}
                </h4>
              </div>

              {/* 확대/축소 및 닫기 컨트롤 버튼 */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-900/90 border border-gray-700 rounded-full px-2 py-1 gap-1">
                  <button
                    onClick={() => setModalZoomScale((z) => Math.max(1, z - 0.5))}
                    disabled={modalZoomScale <= 1}
                    className="p-1.5 text-gray-300 hover:text-cyan-400 disabled:opacity-30 transition-colors"
                    title="축소"
                  >
                    <ZoomOut size={18} />
                  </button>
                  <span className="text-xs font-mono px-2 text-cyan-300 min-w-[45px] text-center">
                    {Math.round(modalZoomScale * 100)}%
                  </span>
                  <button
                    onClick={() => setModalZoomScale((z) => Math.min(3, z + 0.5))}
                    disabled={modalZoomScale >= 3}
                    className="p-1.5 text-gray-300 hover:text-cyan-400 disabled:opacity-30 transition-colors"
                    title="확대"
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    onClick={() => setModalZoomScale(1)}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors border-l border-gray-700 ml-1 pl-2"
                    title="원본 비율 복원 (100%)"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>

                <button
                  onClick={closeLightbox}
                  className="p-2 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800 hover:bg-rose-900 transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] ml-2"
                  title="닫기 (ESC)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 메인 라이트박스 이미지 박스 (드래그 가능) */}
            <div 
              className="relative w-full h-full max-w-6xl max-h-[80vh] flex items-center justify-center overflow-hidden my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                key={modalImageIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: modalZoomScale, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.25 }}
                drag={modalZoomScale > 1}
                dragConstraints={{ left: -300, right: 300, top: -200, bottom: -200 }}
                className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
              >
                <Image
                  src={modalCurrentImage.src}
                  alt={modalCurrentImage.title}
                  fill
                  className="object-contain pointer-events-none select-none"
                  priority
                />
              </motion.div>
            </div>

            {/* 좌우 탐색 버튼 (모달 전용) */}
            {GALLERY_IMAGES.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalImageIndex((prev) => (prev > 0 ? prev - 1 : GALLERY_IMAGES.length - 1));
                    setModalZoomScale(1);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-gray-900/90 text-cyan-400 border border-cyan-700 hover:bg-cyan-900 hover:scale-110 transition-all shadow-glow-blue z-50"
                  aria-label="이전 사진"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalImageIndex((prev) => (prev < GALLERY_IMAGES.length - 1 ? prev + 1 : 0));
                    setModalZoomScale(1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-gray-900/90 text-cyan-400 border border-cyan-700 hover:bg-cyan-900 hover:scale-110 transition-all shadow-glow-blue z-50"
                  aria-label="다음 사진"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            {/* 하단 라이트박스 썸네일 내비게이터 */}
            <div 
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 rounded-2xl bg-gray-900/90 border border-gray-800 backdrop-blur-md z-50 font-cyber"
              onClick={(e) => e.stopPropagation()}
            >
              {GALLERY_IMAGES.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setModalImageIndex(idx);
                    setModalZoomScale(1);
                  }}
                  className={`relative w-16 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === modalImageIndex ? 'border-cyan-400 scale-105 shadow-glow-blue' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image src={img.src} alt={img.title} fill className="object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
