import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

type AnimalStatus = 'IDLE' | 'TRAINING' | 'EXPLORING' | 'EATING';



const AssetDisplay = ({ src, alt, fallbackEmoji, width, height, className }: { src: string, alt: string, fallbackEmoji: string, width: number, height: number, className?: string }) => {
  const [error, setError] = useState(false);
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={{ width, height }}>
      {!error ? (
        <Image 
          src={src} 
          alt={alt} 
          fill
          className="object-contain"
          onError={() => setError(true)}
          priority
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-6xl opacity-20 select-none absolute">{fallbackEmoji}</span>
          <div className="z-10 bg-white/50 backdrop-blur-sm p-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xl">❓</span>
            <p className="text-[10px] text-slate-400 font-mono mt-1">{src.split('/').pop()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AnimalFarmMain() {
  const [points, setPoints] = useState(1500);
  const [level, setLevel] = useState(5);
  const [exp, setExp] = useState(120);
  const [hunger, setHunger] = useState(60);
  const [status, setStatus] = useState<AnimalStatus>('IDLE');
  const [message, setMessage] = useState("오늘도 기분 좋은 하루예요! 🐾");
  const [showHeart, setShowHeart] = useState(false);

  const randomMessages = [
    "배가 조금 고픈 것 같아요.. 🍎",
    "탐험을 떠나면 보물을 찾을 수 있을까요?",
    "주인님과 함께라면 어디든 좋아요!",
    "훈련을 하면 더 강해질 수 있어요!",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'IDLE') {
        setMessage(randomMessages[Math.floor(Math.random() * randomMessages.length)]);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [status]);

  const handleFeed = () => {
    if (status !== 'IDLE') return;
    if (points < 50) return alert("포인트가 부족해요!");

    setStatus('EATING');
    setPoints(prev => prev - 50);
    setMessage("얌냠! 너무 맛있어요! 히히 🍎");
    setShowHeart(true);

    setTimeout(() => {
      setHunger(prev => Math.min(prev + 20, 100));
      setStatus('IDLE');
      setShowHeart(false);
    }, 1500);
  };

  const handleTrain = () => {
    if (status !== 'IDLE') return;
    setStatus('TRAINING');
    setMessage("영차 영차! 열심히 훈련 중이에요! 💪");
    
    setTimeout(() => {
      setExp(prev => {
        if (prev + 50 >= 500) {
          setLevel(l => l + 1);
          return 0;
        }
        return prev + 50;
      });
      setStatus('IDLE');
      setMessage("훈련 끝! 한층 더 성장한 기분이에요! ✨");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Jua'] text-slate-700 selection:bg-pink-100">
      <Head>
        <title>조의ver 동물농장 | My Neighbor</title>
      </Head>

      {/* 상단 통합 네비게이션 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/board" className="p-2 hover:bg-slate-100 rounded-xl transition-colors group" title="보드로 돌아가기">
              <svg className="w-6 h-6 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-black bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent italic tracking-tighter">
              JOI-ver Farm
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex bg-slate-100 rounded-2xl p-1 border border-slate-200">
              <Link href="/animal-farm" className="px-4 py-1.5 bg-white shadow-sm rounded-xl text-xs font-black text-slate-800">Home</Link>
              <Link href="/animal-farm/shop" className="px-4 py-1.5 hover:bg-white/50 rounded-xl text-xs font-black text-slate-400 hover:text-slate-600 transition-all">Shop</Link>
              <Link href="/animal-farm/explore" className="px-4 py-1.5 hover:bg-white/50 rounded-xl text-xs font-black text-slate-400 hover:text-slate-600 transition-all">Explore</Link>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />
            <div className="flex items-center gap-2 bg-yellow-400/10 px-4 py-1.5 rounded-2xl border border-yellow-400/20">
              <span className="text-lg">💰</span>
              <span className="text-yellow-700 font-black">{points.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto pt-24 pb-12 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* 사이드 대시보드 */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-pink-200">
                  {level >= 5 ? '👑' : '⭐'}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Butler Rank</p>
                  <p className="text-xl font-black tracking-tight">Level {level}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Hunger</span> <span>{hunger}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                    <div className="h-full bg-orange-400 transition-all duration-700" style={{ width: `${hunger}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Exp</span> <span>{exp}/500</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                    <div className="h-full bg-pink-500 transition-all duration-700" style={{ width: `${(exp / 500) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-900/20">
              <h3 className="font-black text-lg mb-3 italic">Today's Tip 💡</h3>
              <p className="text-xs leading-relaxed opacity-60 font-medium">동물이 배고픈 상태(Hunger 20% 이하)에서는 훈련 효율이 떨어집니다. 항상 배부른 상태를 유지해 주세요!</p>
            </div>
          </aside>

          {/* 메인 농장 디스플레이 */}
          <div className="lg:col-span-9">
            <div className="relative bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
              {/* 배경 데코레이션 */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-green-50/30 -z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-green-500/5 -z-10 blur-3xl" />

              {/* 말풍선 */}
              <div className="pt-12 flex justify-center h-24">
                <div className={`bg-slate-800 text-white px-8 py-4 rounded-3xl text-sm relative shadow-2xl transition-all duration-500 ${status === 'EATING' ? 'scale-110' : ''}`}>
                  {message}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 rotate-45" />
                </div>
              </div>

              {/* 메인 동물 구역 */}
              <div className="flex-1 flex flex-col items-center justify-center relative">
                {/* 하트 이펙트 */}
                {showHeart && (
                  <div className="absolute top-0 animate-ping text-5xl z-20">❤️</div>
                )}
                
                <div className={`relative transition-all duration-500 ${
                  status === 'TRAINING' ? 'animate-bounce scale-110' : 
                  status === 'EATING' ? 'animate-pulse scale-105' : 'hover:scale-105'
                }`}>
                  {/* 사진 크기 조절: 부모 컨테이너에 맞춰 object-contain 처리 */}
                  <AssetDisplay 
                    src="/assets/animal-farm/animals/pig.png" 
                    alt="Piggy" 
                    fallbackEmoji="🐷"
                    width={280}
                    height={280}
                    className="z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
                  />
                  {/* 그림자 */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900/5 rounded-[100%] blur-xl -z-10 scale-x-150" />
                </div>
              </div>

              {/* 하단 액션 컨트롤 */}
              <div className="p-10 bg-slate-50/50 backdrop-blur-md border-t border-slate-100">
                <div className="flex flex-wrap justify-center gap-6">
                  <button 
                    onClick={handleFeed} 
                    disabled={status !== 'IDLE'}
                    className="group relative flex flex-col items-center gap-3 disabled:opacity-50"
                  >
                    <div className="w-20 h-20 bg-white border-2 border-orange-100 rounded-[2rem] flex items-center justify-center text-4xl shadow-lg group-hover:shadow-orange-200 group-hover:-translate-y-2 transition-all duration-300 active:scale-90">
                      🍎
                    </div>
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Feed (50P)</span>
                  </button>

                  <button 
                    onClick={() => setMessage("주인님! 더 쓰다듬어 주세요! 히히 ✨")} 
                    disabled={status !== 'IDLE'}
                    className="group relative flex flex-col items-center gap-3 disabled:opacity-50"
                  >
                    <div className="w-20 h-20 bg-white border-2 border-pink-100 rounded-[2rem] flex items-center justify-center text-4xl shadow-lg group-hover:shadow-pink-200 group-hover:-translate-y-2 transition-all duration-300 active:scale-90">
                      ✋
                    </div>
                    <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Pet</span>
                  </button>

                  <button 
                    onClick={handleTrain} 
                    disabled={status !== 'IDLE'}
                    className="group relative flex flex-col items-center gap-3 disabled:opacity-50"
                  >
                    <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-xl group-hover:shadow-slate-400 group-hover:-translate-y-2 transition-all duration-300 active:scale-90 text-white">
                      💪
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Train</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Jua&display=swap');
        body {
          font-family: 'Jua', sans-serif;
        }
      `}</style>
    </div>
  );
}
