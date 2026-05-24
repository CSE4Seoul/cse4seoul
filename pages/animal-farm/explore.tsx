import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

const REGIONS = [
  { id: 1, name: '신비한 초록 숲', time: 10, reward: '🍎 일반 열매', icon: '🌲', color: 'from-emerald-400 to-teal-600', asset: 'forest.png' },
  { id: 2, name: '반짝이는 수정 동굴', time: 60, reward: '💎 희귀 수정', icon: '💎', color: 'from-blue-400 to-indigo-600', asset: 'cave.png' },
  { id: 3, name: '블랙홀 지평선', time: 300, reward: '🌑 우주의 파편', icon: '🌌', color: 'from-purple-500 to-fuchsia-800', asset: 'blackhole.png' },
];

const AssetDisplay = ({ src, alt, fallbackEmoji, className }: { src: string, alt: string, fallbackEmoji: string, className?: string }) => {
  const [error, setError] = useState(false);
  return (
    <div className={`relative flex items-center justify-center bg-white/10 rounded-3xl overflow-hidden ${className}`}>
      {!error ? (
        <Image 
          src={src} 
          alt={alt} 
          fill
          className="object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-4 h-full w-full">
          <span className="text-3xl mb-1 opacity-50">❓</span>
          <p className="text-[8px] text-white/50 font-mono break-all line-clamp-2">{src.split('/').pop()}</p>
          <span className="absolute inset-0 flex items-center justify-center text-7xl opacity-20 select-none">{fallbackEmoji}</span>
        </div>
      )}
    </div>
  );
};

export default function AnimalFarmExplore() {
  const [exploringId, setExploringId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (exploringId && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && exploringId) {
      setCanClaim(true);
    }
    return () => clearInterval(timer);
  }, [exploringId, timeLeft]);

  const startExplore = (id: number, time: number) => {
    setExploringId(id);
    setTimeLeft(time);
    setCanClaim(false);
  };

  const claimReward = () => {
    const region = REGIONS.find(r => r.id === exploringId);
    alert(`${region?.reward}를 수령했습니다!`);
    setExploringId(null);
    setCanClaim(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-['Jua'] p-4 md:p-8 text-slate-700">
      <Head><title>세계 탐험 | 조의ver 동물농장</title></Head>

      <div className="max-w-6xl mx-auto">
        <header className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border-b-[6px] border-indigo-100 p-6 mb-10 flex flex-col md:flex-row justify-between items-center shadow-lg gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-indigo-200 text-indigo-600">⛰️</div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">World Expedition</h2>
              <p className="text-[10px] text-indigo-500 font-black tracking-[0.2em]">Explore the Unknown Regions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="flex gap-2">
              <Link href="/animal-farm" className="px-5 py-2.5 bg-white text-slate-500 rounded-2xl font-black border border-slate-200 hover:bg-slate-50 transition-all">Home</Link>
              <Link href="/animal-farm/shop" className="px-5 py-2.5 bg-white text-slate-500 rounded-2xl font-black border border-slate-200 hover:bg-slate-50 transition-all">Shop</Link>
              <Link href="/animal-farm/explore" className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-black shadow-[0_4px_0_0_#3730a3] hover:translate-y-0.5 hover:shadow-none transition-all">Explore</Link>
            </nav>
            <div className="h-8 w-px bg-slate-200" />
            <div className={`px-6 py-2.5 rounded-2xl font-black shadow-md border-b-4 transition-all ${exploringId ? 'bg-indigo-100 border-indigo-300 text-indigo-700 animate-pulse' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
              {exploringId ? 'IN ADVENTURE' : 'READY'}
            </div>
          </div>
        </header>

        <main className="space-y-10">
          <div className="grid grid-cols-1 gap-8">
            {REGIONS.map(region => {
              const isThisExploring = exploringId === region.id;
              
              return (
                <div key={region.id} className="group relative bg-white rounded-[3.5rem] p-10 border-b-[10px] border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl transition-all hover:border-indigo-200">
                  {/* 진행 중 오버레이: 더 고급스러운 디자인 */}
                  {isThisExploring && (
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-30 flex flex-col items-center justify-center text-white p-10 text-center animate-in fade-in duration-500 rounded-[2.5rem] m-2">
                      {canClaim ? (
                        <div className="animate-in zoom-in duration-500">
                          <div className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center text-6xl mx-auto mb-6 shadow-[0_0_40px_rgba(250,204,21,0.4)] animate-bounce">🎁</div>
                          <p className="text-4xl font-black mb-2 tracking-tighter text-yellow-300 italic uppercase">Mission Clear!</p>
                          <p className="text-sm text-slate-400 mb-8 font-bold uppercase tracking-[0.3em]">Reward is Waiting for You</p>
                          <button onClick={claimReward} className="px-16 py-5 bg-white text-slate-900 rounded-[2rem] font-black shadow-[0_8px_0_0_#cbd5e1] hover:bg-slate-50 active:translate-y-1 active:shadow-none transition-all text-lg">
                            Claim Rewards
                          </button>
                        </div>
                      ) : (
                        <div className="w-full max-w-sm space-y-8">
                          <div>
                            <p className="text-[10px] font-black text-indigo-400 mb-2 uppercase tracking-[0.5em] animate-pulse">Navigating to {region.name}...</p>
                            <p className="text-7xl font-black tracking-widest font-mono text-white mb-6 italic">{formatTime(timeLeft)}</p>
                          </div>
                          <div className="space-y-2">
                             <div className="flex justify-between text-[10px] font-black text-white/40 uppercase tracking-widest">
                              <span>Progress</span> <span>{Math.round(((region.time - timeLeft) / region.time) * 100)}%</span>
                            </div>
                            <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden border border-white/10 shadow-inner p-1">
                              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${((region.time - timeLeft) / region.time) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row items-center gap-10 flex-1 w-full lg:w-auto">
                    {/* 지역 에셋 구역 */}
                    <div className={`relative w-48 h-48 md:w-56 md:h-56 bg-gradient-to-br ${region.color} rounded-[3rem] p-2 shadow-2xl group-hover:rotate-3 transition-transform duration-500 border-4 border-white`}>
                      <AssetDisplay 
                        src={`/assets/animal-farm/regions/${region.asset}`} 
                        alt={region.name} 
                        fallbackEmoji={region.icon}
                        className="w-full h-full border-none"
                      />
                      <div className="absolute -bottom-4 -right-4 bg-white px-4 py-2 rounded-2xl shadow-lg border-2 border-slate-100 font-black text-xs text-slate-800 uppercase italic">
                        Level 0{region.id}
                      </div>
                    </div>

                    <div className="text-center md:text-left space-y-4">
                      <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase group-hover:text-indigo-600 transition-colors">{region.name}</h3>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                          <span className="text-lg">⏱️</span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duration: {region.time >= 60 ? `${region.time/60}m` : `${region.time}s`}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100">
                          <span className="text-lg">🎁</span>
                          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Reward: {region.reward}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-md">이 지역은 신비로운 에너지가 가득합니다. 탐험을 통해 특별한 보상을 획득하고 동물을 성장시키세요.</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => startExplore(region.id, region.time)}
                    disabled={exploringId !== null}
                    className="w-full lg:w-64 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-300 transition-all shadow-[0_10px_0_0_#0f172a] active:translate-y-1 active:shadow-none uppercase tracking-widest italic"
                  >
                    Start Mission
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <footer className="mt-20 text-center pb-12">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[1em] mb-4">Adventure • Experience • Growth</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 bg-slate-200 rounded-full" />)}
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Jua&display=swap');
        body {
          font-family: 'Jua', sans-serif;
          background-color: #F1F5F9;
        }
      `}</style>
    </div>
  );
}
