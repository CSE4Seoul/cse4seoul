import { createClient } from '@/utils/supabase/server';
import Link from "next/link";
import { Calendar, User, Eye, MessageSquare, Zap, ChevronLeft, Shield, TrendingUp, Clock } from 'lucide-react';

export default async function BoardPage() {
  const supabase = await createClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-red-950/30 border border-red-800/50 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
              <Shield className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-300 mb-3">데이터 동기화 실패</h2>
            <p className="text-red-200/70 mb-6 font-mono text-sm">{error.message}</p>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-red-950/50 hover:bg-red-900/60 border border-red-700/50 rounded-xl text-red-200 transition-colors"
            >
              통제실로 복귀
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      {/* 정적 배경 텍스처 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-[40rem] h-[40rem] bg-blue-600/5 rounded-full blur-[120px] mix-blend-soft-light"></div>
        <div className="absolute bottom-10 right-10 w-[50rem] h-[50rem] bg-purple-600/5 rounded-full blur-[150px] mix-blend-soft-light"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-cyan-600/5 rounded-full blur-[180px] mix-blend-soft-light"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzAgMzBoLTl2LTloOXoiIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-20"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 헤더 영역 */}
        <div className="mb-12">
          {/* 상단 네비게이션 */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-900/50 backdrop-blur-xl border border-gray-800/60 rounded-2xl hover:bg-blue-900/30 hover:border-blue-700/50 hover:text-blue-300 transition-all duration-300 shadow-lg"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>통제실 복귀</span>
            </Link>

            <div className="flex items-center gap-3 px-5 py-2.5 bg-gray-900/40 backdrop-blur-xl border border-gray-800/60 rounded-2xl">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-xs text-gray-400">실시간 동기화 중</span>
            </div>
          </div>

          {/* 타이틀 & 액션 */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1.5 h-10 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full"></div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  전략 커맨드 센터
                </h1>
                <div className="px-3 py-1 bg-blue-950/50 border border-blue-800/30 rounded-full text-xs font-mono text-blue-300">
                  v2.1.4
                </div>
              </div>
              <p className="text-gray-400 text-lg ml-5 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-500" />
                최신 전술과 전략이 집결하는 암호화된 공간
              </p>
            </div>

            <Link
  href="/board/write"
  className="group relative px-8 py-4 rounded-2xl font-bold transition-all duration-500 bg-gradient-to-r from-white to-gray-100 border border-gray-300/50 hover:border-gray-400/50 hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] overflow-hidden"
>
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
  <span className="flex items-center gap-3 relative z-10 text-gray-900">
    <Zap className="w-5 h-5 group-hover:rotate-12 group-hover:scale-110 transition-all text-gray-700" />
    <span className="text-lg">전술 기록 작성</span>
    <span className="text-gray-600 text-xl">✏️</span>
  </span>
</Link>
          </div>

          {/* 상태 요약 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="group bg-gray-900/40 backdrop-blur-xl border border-gray-800/60 rounded-2xl p-5 hover:border-blue-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-gray-400">활성 전략</span>
                </div>
                <span className="text-3xl font-bold text-blue-400">{posts?.length || 0}</span>
              </div>
            </div>
            <div className="group bg-gray-900/40 backdrop-blur-xl border border-gray-800/60 rounded-2xl p-5 hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-xl">
                    <Eye className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-gray-400">누적 열람</span>
                </div>
                <span className="text-3xl font-bold text-cyan-400">
                  {posts?.reduce((acc, post) => acc + (post.view_count || 0), 0) || 0}
                </span>
              </div>
            </div>
            <div className="group bg-gray-900/40 backdrop-blur-xl border border-gray-800/60 rounded-2xl p-5 hover:border-green-500/40 transition-colors sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-xl">
                    <Clock className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-gray-400">최신 업데이트</span>
                </div>
                <span className="text-lg font-bold text-green-400">
                  {posts && posts.length > 0 
                    ? new Date(posts[0].created_at).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '방금 전'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 게시글 그리드 */}
        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/board/${post.id}`}
                className="group relative block"
              >
                {/* 카드 본체 */}
                <div className="relative h-full bg-gray-900/40 backdrop-blur-xl border border-gray-800/60 rounded-3xl p-6 transition-all duration-500 group-hover:border-blue-500/50 group-hover:shadow-[0_0_50px_rgba(59,130,246,0.15)] group-hover:-translate-y-1 overflow-hidden">
                  
                  {/* 배경 그라디언트 오버레이 (호버 시 강조) */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  
                  {/* 우측 상단 번호 배지 */}
                  <div className="absolute top-5 right-5">
                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-500/30 border border-blue-500/40 text-white font-bold text-sm backdrop-blur-sm">
                      #{index + 1}
                    </div>
                  </div>

                  {/* 프리미엄 배지 (is_premium 필드 가정) */}
                  {post.is_premium && (
                    <div className="absolute top-5 left-5 z-10">
                      <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-600/30 to-amber-600/30 border border-yellow-500/40 rounded-full text-yellow-300 text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                        ⭐ 프리미엄 전략
                      </span>
                    </div>
                  )}

                  {/* 콘텐츠 영역 (배지와 겹치지 않도록 패딩) */}
                  <div className={`${post.is_premium ? 'mt-12' : 'mt-0'} pr-14`}>
                    <h2 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-blue-300 transition-colors">
                      {post.title}
                    </h2>
                    
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {post.content_preview || "전문적인 전략과 인사이트가 담긴 게시글입니다. 클릭하여 상세 내용을 확인하세요."}
                    </p>
                  </div>

                  {/* 메타 정보 (작성자, 날짜, 조회/댓글) */}
                  <div className="relative mt-6 pt-5 border-t border-gray-800/60 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* 작성자 아바타 */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        post.is_anonymous 
                          ? 'bg-gradient-to-br from-gray-700 to-gray-900' 
                          : 'bg-gradient-to-br from-blue-600 to-cyan-500'
                      }`}>
                        {post.is_anonymous ? (
                          <User className="w-4 h-4 text-gray-400" />
                        ) : (
                          <span className="text-sm font-bold text-white">
                            {post.author_name?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300">
                          {post.is_anonymous ? '익명의 전술가' : post.author_name}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.created_at).toLocaleDateString('ko-KR', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">{post.view_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">{post.comment_count || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* 하단 장식 라인 (호버 시 나타남) */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-3xl">
            <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">아직 등록된 전략이 없습니다</h3>
            <p className="text-gray-500 mb-8">첫 번째 전술 기록을 작성해보세요.</p>
            <Link
              href="/board/write"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl text-white font-bold hover:from-blue-500 hover:to-cyan-500 transition-colors shadow-lg shadow-blue-900/30"
            >
              전략 기록하기
            </Link>
          </div>
        )}

        {/* 푸터 정보 */}
        <div className="text-center py-8 border-t border-gray-800/40">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-cyan-500/70" />
            모든 게시글은 AES-256으로 암호화되어 저장됩니다 • 
            <span className="text-cyan-400 mx-1">보안 등급: 최고 수준</span> • 
            <span className="text-blue-400 mx-1">24시간 후 자동 소멸</span>
          </p>
        </div>
      </div>
    </div>
  );
}