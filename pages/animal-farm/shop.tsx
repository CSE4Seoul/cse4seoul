import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

const ITEMS = [
  { id: 1, name: '빨간 사과', price: 100, desc: '포만감을 20 올려줍니다.', icon: '🍎', asset: 'apple.png' },
  { id: 2, name: '전설의 영양제', price: 500, desc: '경험치를 100 올려줍니다.', icon: '🧪', asset: 'potion.png' },
  { id: 3, name: '무지개 캔디', price: 300, desc: '기분을 최고로 만듭니다.', icon: '🍭', asset: 'candy.png' },
  { id: 4, name: '황금 고구마', price: 150, desc: '매우 든든한 간식입니다.', icon: '🍠', asset: 'sweet_potato.png' },
  { id: 5, name: '럭셔리 비타민', price: 1000, desc: '모든 스탯을 최대치로!', icon: '💊', asset: 'vitamin.png' },
  { id: 6, name: '반짝이 모자', price: 2000, desc: '농장의 인싸가 됩니다.', icon: '🎩', asset: 'hat.png' },
];

const AssetDisplay = ({ src, alt, fallbackEmoji, className }: { src: string, alt: string, fallbackEmoji: string, className?: string }) => {
  const [error, setError] = useState(false);
  return (
    <div className={`relative flex items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden ${className}`}>
      {!error ? (
        <Image 
          src={src} 
          alt={alt} 
          fill
          className="object-contain p-4"
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-2 h-full w-full">
          <span className="text-2xl mb-1 opacity-40">❓</span>
          <p className="text-[7px] text-slate-300 font-mono break-all line-clamp-1">{src.split('/').pop()}</p>
          <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-10 select-none group-hover:opacity-20 transition-opacity">{fallbackEmoji}</span>
        </div>
      )}
    </div>
  );
};

export default function AnimalFarmShop() {
  const [points, setPoints] = useState(1500);
  const [selectedItem, setSelectedItem] = useState<typeof ITEMS[0] | null>(null);

  const handleBuy = () => {
    if (!selectedItem) return;
    if (points < selectedItem.price) return alert("포인트가 부족해요!");
    setPoints(prev => prev - selectedItem.price);
    setSelectedItem(null);
    alert(`${selectedItem.name} 구매 완료!`);
  };

  return (
    <div className="min-h-screen bg-[#FFF7ED] font-['Jua'] p-4 md:p-8 text-slate-700">
      <Head><title>아이템 숍 | 조의ver 동물농장</title></Head>
      
      <div className="max-w-6xl mx-auto">
        <header className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border-b-[6px] border-orange-100 p-6 mb-8 flex flex-col md:flex-row justify-between items-center shadow-lg gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-orange-200">🛍️</div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Premium Shop</h2>
              <p className="text-[10px] text-orange-500 font-black tracking-[0.2em]">Quality Goods for Your Neighbor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="flex gap-2">
              <Link href="/animal-farm" className="px-5 py-2.5 bg-white text-slate-500 rounded-2xl font-black border border-slate-200 hover:bg-slate-50 transition-all">Home</Link>
              <Link href="/animal-farm/shop" className="px-5 py-2.5 bg-orange-500 text-white rounded-2xl font-black shadow-[0_4px_0_0_#c2410c] hover:translate-y-0.5 hover:shadow-none transition-all">Shop</Link>
              <Link href="/animal-farm/explore" className="px-5 py-2.5 bg-white text-slate-500 rounded-2xl font-black border border-slate-200 hover:bg-slate-50 transition-all">Explore</Link>
            </nav>
            <div className="bg-yellow-300 px-6 py-2.5 rounded-2xl border-b-4 border-yellow-500 font-black text-yellow-900 shadow-md">
              <span className="text-lg">{points.toLocaleString()}</span> <span className="text-[10px] opacity-70">POINTS</span>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {ITEMS.map(item => (
            <div key={item.id} className="group relative bg-white p-6 rounded-[3rem] border-b-[8px] border-slate-200 flex flex-col items-center text-center hover:scale-105 transition-all shadow-xl hover:border-orange-200">
              {/* 아이템 에셋 구역 */}
              <div className="w-full aspect-square mb-6 relative">
                <div className="absolute inset-0 bg-slate-50 rounded-[2.5rem] group-hover:bg-orange-50 transition-colors" />
                <AssetDisplay 
                  src={`/assets/animal-farm/items/${item.asset}`} 
                  alt={item.name} 
                  fallbackEmoji={item.icon}
                  className="w-full h-full border-none bg-transparent"
                />
              </div>

              <div className="flex-1 w-full space-y-1 mb-6">
                <h3 className="font-black text-slate-800 text-lg line-clamp-1">{item.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter h-8 flex items-center justify-center">{item.desc}</p>
              </div>

              <button 
                onClick={() => setSelectedItem(item)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black border-b-[6px] border-slate-950 hover:bg-slate-800 hover:translate-y-0.5 hover:border-b-[4px] transition-all shadow-lg text-sm"
              >
                {item.price} P
              </button>
            </div>
          ))}
        </main>
      </div>

      {/* 결제 확인 모달: 더 세련된 애니메이션과 디자인 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] p-10 max-w-md w-full border-[12px] border-white shadow-2xl transform animate-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="w-40 h-40 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-orange-100 rounded-full blur-2xl opacity-40 animate-pulse" />
                <div className="relative w-full h-full bg-orange-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner overflow-hidden">
                   <AssetDisplay 
                    src={`/assets/animal-farm/items/${selectedItem.asset}`} 
                    alt={selectedItem.name} 
                    fallbackEmoji={selectedItem.icon}
                    className="w-full h-full border-none bg-transparent"
                  />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter uppercase italic">{selectedItem.name}</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Purchase Confirmation</p>
            </div>
            
            <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-8 space-y-4 border-2 border-slate-100 shadow-inner">
              <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                <span>Current Balance</span> <span className="text-slate-800 text-sm">{points.toLocaleString()} P</span>
              </div>
              <div className="flex justify-between items-center text-xs font-black text-rose-400 uppercase tracking-widest">
                <span>Item Price</span> <span className="text-rose-500 text-sm">- {selectedItem.price.toLocaleString()} P</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between items-center font-black text-slate-800">
                <span className="text-xs uppercase tracking-widest text-slate-400">Total After</span> 
                <span className="text-2xl text-blue-600">{(points - selectedItem.price).toLocaleString()} <span className="text-xs">P</span></span>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setSelectedItem(null)} className="flex-1 py-5 bg-slate-100 rounded-[2rem] font-black text-slate-500 hover:bg-slate-200 transition-colors shadow-sm">Cancel</button>
              <button 
                onClick={handleBuy}
                disabled={points < selectedItem.price}
                className="flex-1 py-5 bg-orange-500 rounded-[2rem] font-black text-white shadow-[0_8px_0_0_#c2410c] hover:bg-orange-400 active:translate-y-1 active:shadow-none transition-all disabled:bg-slate-300 disabled:shadow-none"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Jua&display=swap');
        body {
          font-family: 'Jua', sans-serif;
        }
      `}</style>
    </div>
  );
}
