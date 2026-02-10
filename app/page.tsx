import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white relative overflow-hidden">
      {/* 1. 배경 효과 (Glow & Grid) */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" /> {/* grid.svg 없어도 티 안남 */}
      </div>

      {/* 2. 메인 카드 (Glassmorphism) */}
      <div className="z-10 flex flex-col items-center text-center space-y-8 p-12 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl max-w-2xl mx-4">
        
        {/* 타이틀 섹션 */}
        <div className="space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-4">
            <span className="text-sm font-medium text-purple-300 tracking-wide">
              PRIVATE CLAN PLATFORM
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 tracking-tight">
            CSE4Seoul
          </h1>
          <p className="text-lg text-gray-400 max-w-md mx-auto">
            건국대학교 컴퓨터공학부를 위한<br/>
            프라이빗 클랜 매니지먼트 시스템
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all transform hover:scale-105 shadow-lg shadow-white/10"
          >
            Agent Login
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-xl bg-white/5 text-white border border-white/10 font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-md"
          >
            Dashboard
          </Link>
        </div>

        {/* 구분선 */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-8" />

        {/* Founder 정보 (요청하신 부분!) */}
        <div className="flex flex-col items-center space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest">System Architect</p>
          <div className="flex items-center gap-3 bg-black/30 px-5 py-3 rounded-full border border-gray-800 hover:border-gray-600 transition-colors">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-gray-300">
              Founder: <span className="text-white font-semibold">조하민 (Developer)</span>
            </span>
          </div>
          
          <a 
            href="https://hamin-portfolio.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors flex items-center gap-1"
          >
            View Portfolio ↗
          </a>
        </div>
      </div>

      {/* 하단 카피라이트 */}
      <footer className="absolute bottom-6 text-xs text-gray-600">
        © 2026 CSE4Seoul. All systems operational.
      </footer>
    </main>
  );
}