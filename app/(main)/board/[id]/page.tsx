// app/(main)/board/[id]/page.tsx
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createComment } from "../actions";
import { deleteComment } from "../actions"; 
import { deletePost } from "../actions";

import { 
  MessageSquare, Clock, User, Lock, Eye, 
  ChevronLeft, Send, Shield, Trash2 
} from 'lucide-react';

// Supabase 클라이언트 초기화
const supabase = createClient();

interface Post {
  id: string;
  title: string;
  content: string;
  author_name: string | null;
  author_id: string; // 추가
  is_anonymous: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
  view_count: number;
}

interface Comment {
  id: string;
  content: string;
  author_name: string | null;
  author_id: string; // 추가
  is_anonymous: boolean;
  created_at: string;
  post_id: string;
}

export default function PostDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [isAnonymousComment, setIsAnonymousComment] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null); // 추가

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resolvedParams = await params;
        setId(resolvedParams.id);

        // 1. 현재 유저 정보 가져오기 (추가)
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // 2. 게시글 데이터 가져오기
        const { data: postData } = await supabase
          .from('posts')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();

        if (!postData) {
          // 404 처리
          return;
        }

        setPost(postData);

        // 조회수 증가
        await supabase
          .from('posts')
          .update({ view_count: (postData.view_count || 0) + 1 })
          .eq('id', resolvedParams.id);

        // 3. 댓글 데이터 가져오기
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', resolvedParams.id)
          .order('created_at', { ascending: true });

        setComments(commentsData || []);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentContent.trim() || !post) return;
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('postId', post.id);
      formData.append('content', commentContent);
      formData.append('is_anonymous', isAnonymousComment.toString());
      
      await createComment(formData);
      
      // 댓글 목록 새로고침
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      
      setComments(commentsData || []);
      setCommentContent('');
      setIsAnonymousComment(true);
    } catch (error) {
      console.error('댓글 작성 실패:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!post) return;
    
    if (confirm("이 분석을 삭제하시겠습니까?")) {
      try {
        await deleteComment(commentId, post.id);
        // 삭제 후 상태 업데이트 (로컬에서 제거)
        setComments(comments.filter(c => c.id !== commentId));
      } catch (error) {
        console.error('댓글 삭제 실패:', error);
      }
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReport = (commentId: string) => {
    console.log('댓글 신고:', commentId);
    // 신고 로직 구현
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">작전 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">404</h1>
          <p className="text-gray-400 mb-6">요청하신 작전 보고서를 찾을 수 없습니다.</p>
          <Link 
            href="/board" 
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium inline-block"
          >
            전략 게시판으로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-8">
      {/* 배경 요소 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-10 w-80 h-80 bg-purple-500/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* 네비게이션 헤더 */}
        <div className="mb-8 pt-6">
          <Link 
            href="/board" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">전략 게시판으로 돌아가기</span>
          </Link>
        </div>

        {/* 메인 게시글 */}
        <article className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-3xl p-6 md:p-10 mb-10 
          shadow-[0_0_60px_-15px_rgba(59,130,246,0.1)]">
          
          {/* 게시글 헤더 */}
          <header className="mb-8 pb-8 border-b border-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                {post.is_premium && (
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 
                    rounded-full text-yellow-300 text-sm font-bold flex items-center gap-1">
                    ⭐ 프리미엄 전략
                  </span>
                )}
                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400">
                  #{post.id.slice(0, 8)}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.view_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {comments?.length || 0}
                </span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {post.is_anonymous ? (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 
                        flex items-center justify-center border border-gray-700">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-300">익명의 전술가</div>
                        <div className="text-xs text-gray-500">신원 보호됨</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 
                        flex items-center justify-center text-white font-bold">
                        {post.author_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-cyan-300">{post.author_name || '알 수 없음'}</div>
                        <div className="text-xs text-gray-500">인증된 요원</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{new Date(post.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </header>

          {/* 게시글 본문 */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="text-gray-200 leading-relaxed whitespace-pre-wrap text-base md:text-lg 
              bg-gray-900/30 rounded-2xl p-6 md:p-8">
              {post.content}
            </div>
          </div>

          {/* 게시글 푸터 부분 */}
<footer className="mt-10 pt-8 border-t border-gray-800">
  <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
    <div className="flex items-center gap-4">
      <span className="flex items-center gap-1">
        <Lock className="w-4 h-4" />
        최종 수정: {new Date(post.updated_at || post.created_at).toLocaleDateString()}
      </span>
    </div>
    <div className="flex items-center gap-2">
      <Shield className="w-4 h-4" />
      <span>보안 등급: {post.is_premium ? '최고' : '표준'}</span>
      
      {/* 게시글 삭제 버튼 */}
      {currentUser && currentUser.id === post.author_id && (
        <button 
          type="button"
          className="ml-4 px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
          onClick={async () => {
            if(confirm("이 작전 보고서를 삭제하시겠습니까?")) {
              // deletePost 액션 필요
              await deletePost(post.id);
              router.push('/board');
            }
          }}
        >
          <Trash2 className="w-3 h-3" />
          삭제
        </button>
      )}
    </div>
  </div>
</footer>
        </article>

        {/* 댓글 섹션 */}
        <section className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-3xl p-6 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 
                border border-blue-500/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <span>작전 분석</span>
              <span className="text-blue-400 text-lg">({comments?.length || 0})</span>
            </h3>
            
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <span className="px-3 py-1 bg-gray-800 rounded-full">모든 댓글은 암호화됩니다</span>
            </div>
          </div>

          {/* 댓글 입력창 */}
          <form onSubmit={handleCommentSubmit} className="mb-10 group">
            <div className="relative bg-gray-900/50 border-2 border-gray-700 rounded-2xl p-5 
              transition-all duration-300 focus-within:border-blue-500/50 focus-within:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
              <textarea 
                name="content" 
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                required 
                placeholder="이 작전에 대한 분석, 보완점, 또는 추가 전략을 입력하세요..."
                className="w-full bg-transparent outline-none resize-none text-gray-200 text-base
                  placeholder-gray-500 min-h-[120px]"
                rows={4}
                disabled={submitting}
              />
              
              <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-5 border-t border-gray-800">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group/anon">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={isAnonymousComment}
                        onChange={(e) => setIsAnonymousComment(e.target.checked)}
                        className="sr-only peer"
                        disabled={submitting}
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                        ${isAnonymousComment ? 'border-blue-500 bg-blue-500' : 'border-gray-600'}`}>
                        <svg className={`w-3 h-3 text-white transition-opacity ${isAnonymousComment ? 'opacity-100' : 'opacity-0'}`} 
                          fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <span className={`text-sm transition-colors ${submitting ? 'text-gray-600' : 'text-gray-400 group-hover/anon:text-white'}`}>
                      익명 분석가 모드
                    </span>
                  </label>
                  
                  <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="w-3 h-3" />
                    모든 댓글은 엔드투엔드 암호화
                  </div>
                </div>
                
                <button 
                  type="submit"
                  disabled={submitting || !commentContent.trim()}
                  className={`group/btn relative px-6 py-2.5 rounded-xl font-bold transition-all overflow-hidden
                    ${submitting || !commentContent.trim() 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]'
                    }`}
                >
                  {submitting && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-white/10 to-cyan-500/0 
                    translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000
                    ${submitting ? 'hidden' : ''}`}></div>
                  <span className={`flex items-center gap-2 relative z-10 ${submitting ? 'opacity-0' : 'opacity-100'}`}>
                    <Send className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    {submitting ? '등록 중...' : '분석 등록'}
                  </span>
                </button>
              </div>
            </div>
          </form>

          {/* 댓글 리스트 */}
          <div className="space-y-4">
            {comments && comments.length > 0 ? (
              comments.map((comment, index) => (
                <div 
                  key={comment.id} 
                  className="group bg-gray-900/40 border border-gray-800 rounded-2xl p-5 
                    hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300"
                >
                  {/* 댓글 헤더 */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {comment.is_anonymous ? (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 
                            flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-emerald-500 
                            flex items-center justify-center text-white text-xs font-bold">
                            {comment.author_name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-800 
                          flex items-center justify-center text-[10px] text-gray-400">
                          #{index + 1}
                        </div>
                      </div>
                      
                      <div>
                        <span className={`font-bold ${comment.is_anonymous ? 'text-purple-400' : 'text-green-400'}`}>
                          {comment.is_anonymous ? '익명의 분석가' : comment.author_name || '알 수 없음'}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(comment.created_at).toLocaleString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      <span>검증됨</span>
                    </div>
                  </div>
                  
                  {/* 댓글 내용 */}
                  <p className="text-gray-300 leading-relaxed pl-11">
                    {comment.content}
                  </p>
                  
                  {/* 댓글 액션 */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* 삭제 버튼 로직 */}
                    {currentUser && currentUser.id === comment.author_id && (
                      <button 
                        type="button"
                        className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-400 transition-colors"
                        onClick={() => handleCommentDelete(comment.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                        삭제
                      </button>
                    )}
                    
                    <button 
                      type="button"
                      className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
                      onClick={() => console.log('답글 달기:', comment.id)}
                    >
                      답글 달기
                    </button>
                    <button 
                      type="button"
                      className="text-xs text-gray-500 hover:text-rose-400 transition-colors"
                      onClick={() => handleReport(comment.id)}
                    >
                      신고
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-600" />
                </div>
                <h4 className="text-gray-400 font-medium mb-2">아직 분석이 없습니다</h4>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  첫 번째 분석을 작성하여 이 작전에 대한 인사이트를 공유해보세요.
                </p>
              </div>
            )}
          </div>
          
          {/* 댓글 푸터 */}
          {comments && comments.length > 0 && (
            <div className="mt-10 pt-8 border-t border-gray-800">
              <div className="text-center text-sm text-gray-500">
                <p className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  모든 분석 내용은 검증 후 표시되며, 부적절한 내용은 자동으로 필터링됩니다.
                </p>
                <p className="mt-2">총 {comments.length}개의 분석이 등록되었습니다.</p>
              </div>
            </div>
          )}
        </section>

        {/* 하단 네비게이션 */}
        <div className="mt-10 flex justify-between">
          <Link 
            href="/board" 
            className="px-6 py-3 rounded-xl border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 
              transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            전체 작전 목록
          </Link>
          
          <button 
            type="button"
            onClick={handleScrollToTop}
            className="px-6 py-3 rounded-xl bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
          >
            ↑ 최상단으로
          </button>
        </div>
      </div>
    </div>
  );
}