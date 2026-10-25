import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Zap, 
  Settings, 
  Wallet, 
  TrendingUp, 
  BookOpen, 
  MessageSquare, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  Receipt,
  Layers,
  Network,
  Clock,
  Sparkles,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import CosmicBackground from '@/components/CosmicBackground';

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. 로그인 체크
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  // 2. 프로필 정보 가져오기
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 3. 최근 게시판 글 가져오기 (가장 최근 3개만 경량 로드)
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('id, title, author_name, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-10 relative overflow-hidden">
      {/* 🌌 별빛 우주 배경 (모듈화된 CosmicBackground) */}
      <CosmicBackground isFixed={true} showGrid={true} starSizeMultiplier={1.0} />

      {/* 동물농장 플로팅 위젯 */}
      <Link
        href="/animal-farm"
        className="fixed bottom-20 lg:bottom-10 right-6 lg:right-10 z-40 group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-110"
      >
        <div className="relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-pink-600 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-pink-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            놀러와! 🐾
          </div>
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-2 border-white shadow-[0_0_20px_rgba(236,72,153,0.4)] flex items-center justify-center text-2xl group-hover:animate-bounce transition-all">
            🐶
          </div>
        </div>
        <span className="bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-bold text-pink-600 border border-pink-100 shadow-sm">
          동물농장
        </span>
      </Link>

      <div className="max-w-6xl mx-auto z-10 relative space-y-8">
        {/* 헤더 섹션: 커맨드 센터 & 프로필 뱃지 */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 tracking-tight">
                Command Center
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800">
                HQ v2.0
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400">
              환영합니다, Operator <span className="text-white font-bold">{profile?.full_name || user.email?.split('@')[0]}</span> 님.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {profile?.university && (
              <span className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs font-bold text-neutral-200 flex items-center gap-1.5 shadow-sm">
                🏫 {profile.university}
              </span>
            )}

            <Link
              href="/chat"
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>전략 통신실</span>
            </Link>

            <span className="px-3 py-1 bg-emerald-950/50 text-emerald-400 text-xs rounded-full border border-emerald-900/80 flex items-center gap-1.5 shadow-[0_0_10px_rgba(52,211,153,0.15)]">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              System Online
            </span>
          </div>
        </header>

        {/* 상단 퀵 런처 바: 5대 핵심 도메인 바로가기 */}
        <section aria-label="Quick Launcher" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            href="/finance"
            className="group p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-cyan-500/40 transition-all flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">개인 재무</div>
              <div className="text-[10px] text-neutral-400 truncate">가계부 & 세금</div>
            </div>
          </Link>

          <Link
            href="/market"
            className="group p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-emerald-500/40 transition-all flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">시장 & ETF</div>
              <div className="text-[10px] text-neutral-400 truncate">환율 & 괴리율</div>
            </div>
          </Link>

          <Link
            href="/mindmap"
            className="group p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-indigo-500/40 transition-all flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Network className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">지식 마인드맵</div>
              <div className="text-[10px] text-neutral-400 truncate">트리 캔버스</div>
            </div>
          </Link>

          <Link
            href="/board"
            className="group p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-blue-500/40 transition-all flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors truncate">전술 게시판</div>
              <div className="text-[10px] text-neutral-400 truncate">작전 회의록</div>
            </div>
          </Link>

          <Link
            href="/animal-farm"
            className="group p-3.5 rounded-xl border border-pink-500/20 bg-pink-950/20 hover:bg-pink-950/30 hover:border-pink-500/40 transition-all flex items-center gap-3 col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-lg shrink-0">
              🐾
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">동물농장</div>
              <div className="text-[10px] text-pink-400 truncate">힐링 미니게임</div>
            </div>
          </Link>
        </section>

        {/* 4대 도메인 Actionable Summary Cards (2x2 그리드) */}
        <section aria-label="Domain Overviews" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: 💳 개인 재무 현황 요약 */}
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-neutral-950 to-black p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">개인 재무 & 실질소득</h2>
                    <p className="text-[11px] text-cyan-400 font-mono">FINANCE OVERVIEW</p>
                  </div>
                </div>
                <Link
                  href="/finance"
                  className="text-xs text-neutral-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <span>전체보기</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                프리랜서 3.3% 원천징수, 알바 주휴수당, 4대보험 실지급액 역산 및 세금 공제 트래커를 손쉽게 이용하세요.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-neutral-500 block">가계부 분석 기능</span>
                  <span className="text-cyan-300 font-bold mt-1 block">실시간 세후 역산 지원</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-neutral-500 block">세금 혜택 트래커</span>
                  <span className="text-indigo-300 font-bold mt-1 block">환급금 비교 계산</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/5">
              <Link
                href="/finance/account-book"
                className="flex-1 py-2 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold text-center transition-colors"
              >
                가계부 장부 바로가기
              </Link>
              <Link
                href="/finance/tax"
                className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-bold text-center transition-colors"
              >
                세금 트래커 바로가기
              </Link>
            </div>
          </div>

          {/* Card 2: 📈 시장 & ETF 레이더 요약 */}
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-neutral-950 to-black p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">시장 & 투자 레이더</h2>
                    <p className="text-[11px] text-emerald-400 font-mono">MARKET RADAR</p>
                  </div>
                </div>
                <Link
                  href="/market"
                  className="text-xs text-neutral-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <span>전체보기</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                원/달러 환율과 미국 야간 선물 지수, 국내 상장 미국 ETF의 장 마감 후 실시간 추정 iNAV와 괴리율을 추적합니다.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-neutral-500 block">ETF iNAV 모니터</span>
                  <span className="text-emerald-300 font-bold mt-1 block">야간 괴리율 실시간</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-neutral-500 block">기술적 분석 차트</span>
                  <span className="text-purple-300 font-bold mt-1 block">C++ WASM 지표 연산</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/5">
              <Link
                href="/market/etf"
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center transition-colors"
              >
                ETF 괴리율 분석
              </Link>
              <Link
                href="/market/watchlist"
                className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-bold text-center transition-colors"
              >
                관심 종목 보기
              </Link>
            </div>
          </div>

          {/* Card 3: 📚 학습 & 지식 체계 요약 */}
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 via-neutral-950 to-black p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">학습 체계 & 로드맵</h2>
                    <p className="text-[11px] text-indigo-400 font-mono">STUDY & KNOWLEDGE</p>
                  </div>
                </div>
                <Link
                  href="/learning"
                  className="text-xs text-neutral-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <span>전체보기</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                무한 뎁스 지식 트리 마인드맵과 매일 공부 기록 일지, 북 트래커로 개발 역량을 체계적으로 축적하세요.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-neutral-500 block">마인드맵 스튜디오</span>
                  <span className="text-indigo-300 font-bold mt-1 block">트리 캔버스 대기중</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-neutral-500 block">일일 공부 & 복습</span>
                  <span className="text-blue-300 font-bold mt-1 block">TXT 추출 지원</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/5">
              <Link
                href="/mindmap"
                className="flex-1 py-2 px-3 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold text-center transition-colors"
              >
                마인드맵 열기
              </Link>
              <Link
                href="/learning/study"
                className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-bold text-center transition-colors"
              >
                공부 일지 작성
              </Link>
            </div>
          </div>

          {/* Card 4: 👑 클랜 & 소통 활동 요약 */}
          <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-950/20 via-neutral-950 to-black p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">클랜 커뮤니티 & 활동</h2>
                    <p className="text-[11px] text-pink-400 font-mono">CLAN & FORUM</p>
                  </div>
                </div>
                <Link
                  href="/community"
                  className="text-xs text-neutral-400 hover:text-pink-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <span>전체보기</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 최근 게시판 헤드라인 3건 경량 표시 */}
              <div className="space-y-2 mb-4">
                {recentPosts && recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/board/${post.id}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-xs transition-colors group/post"
                    >
                      <span className="truncate text-neutral-200 group-hover/post:text-pink-300 font-medium">
                        {post.title}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono shrink-0 ml-2">
                        {post.author_name}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="text-xs text-neutral-500 py-3 text-center font-mono">
                    최근 등록된 게시글이 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/5">
              <Link
                href="/board"
                className="flex-1 py-2 px-3 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 text-xs font-bold text-center transition-colors"
              >
                전술 게시판
              </Link>
              <Link
                href="/community/lobby"
                className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-bold text-center transition-colors"
              >
                익명 로비 채팅
              </Link>
            </div>
          </div>
        </section>

        {/* 하단 시스템 세션 안내 및 제어 링크 */}
        <footer className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>ENCRYPTED SECURE CHANNEL: ACTIVE</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/settings" className="hover:text-white transition-colors">
              계정 설정
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-white transition-colors">
              공개 메인 소개
            </Link>
            <span>•</span>
            <form action="/auth/signout" method="post" className="inline">
              <button type="submit" className="text-red-400 hover:text-red-300 transition-colors">
                로그아웃
              </button>
            </form>
          </div>
        </footer>
      </div>
    </div>
  );
}