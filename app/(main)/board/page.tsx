import { createClient } from '@/utils/supabase/server';
import Link from "next/link";
import { Calendar, User, Eye, MessageSquare, Zap, ChevronLeft } from 'lucide-react';

export default async function BoardPage() {
  const supabase = await createClient();
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-6xl mx-auto bg-red-900/20 border border-red-500/30 rounded-2xl p-8 backdrop-blur-sm">
        <p className="text-red-300 font-mono text-lg">⚠️ 데이터 로드 실패: {error.message}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-8">
      {/* 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* 헤더 섹션 */}
        <div className="mb-12 pt-8">
          {/* 상단 네비게이션 바 */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-4 py-2 text-sm text-gray-300 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg hover:bg-blue-900/30 hover:border-blue-700/50 hover:text-blue-300 transition-all duration-200 w-fit shadow-lg"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>통제실로 복귀</span>
            </Link>

            {/* 실시간 상태 표시 */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-lg">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-gray-400">실시간 업데이트 중</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full"></div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  전략 커맨드 센터
                </h1>
              </div>
              <p className="text-gray-400 text-lg ml-5">최신 전술과 전략이 집결하는 공간</p>
            </div>
            
            <Link 
              href="/board/write" 
              className="group relative px-8 py-4 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-cyan-500/10 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="flex items-center gap-3 relative z-10">
                <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="text-lg">전술 기록 작성</span>
                <span className="text-cyan-300">✏️</span>
              </span>
            </Link>
          </div>

          {/* 상태 표시줄 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">활성 전략</span>
                <span className="text-2xl font-bold text-blue-400">{posts?.length || 0}</span>
              </div>
            </div>
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">실시간 참여</span>
                <span className="text-2xl font-bold text-cyan-400">
                  {posts?.reduce((acc, post) => acc + (post.view_count || 0), 0) || 0}
                </span>
              </div>
            </div>
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">최신 업데이트</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          {posts?.map((post, index) => (
            <Link 
              key={post.id} 
              href={`/board/${post.id}`}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative h-full bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 transition-all duration-300 group-hover:border-blue-500/50 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.1)] group-hover:-translate-y-1 overflow-hidden">
                {/* 번호 배지 */}
                <div className="absolute top-4 right-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                </div>

                {/* 프리미엄 배지 */}
                {post.is_premium && (
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 rounded-full text-yellow-300 text-xs font-bold flex items-center gap-1">
                      ⭐ 프리미엄 전략
                    </span>
                  </div>
                )}

                <div className="pr-12">
                  <h2 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-blue-300 transition-colors">
                    {post.title}
                  </h2>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {post.content_preview || "전문적인 전략과 인사이트가 담긴 게시글입니다."}
                  </p>
                </div>

                {/* 메타 정보 */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {post.is_anonymous ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-400">익명의 전술가</span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                            <span className="text-xs font-bold">{post.author_name?.charAt(0)}</span>
                          </div>
                          <span className="text-sm text-cyan-300 font-medium">{post.author_name}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.created_at).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-400">{post.view_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-400">{post.comment_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* 호버 효과 라인 */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </Link>
          ))}
        </div>

        {/* 푸터 노트 */}
        <div className="text-center py-8 border-t border-gray-800/50">
          <p className="text-gray-500 text-sm">
            이 전략 게시판은 최신 정보로 실시간 업데이트됩니다 • 
            <span className="text-cyan-400 mx-2">보안 등급: 최고 수준</span> • 
            <span className="text-blue-400 mx-2">v2.1.4</span>
          </p>
        </div>
      </div>
    </div>
  );
}