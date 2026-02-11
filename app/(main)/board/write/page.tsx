// app/(main)/board/write/page.tsx
'use client';

import { createPost } from '../actions';
import { Target, Lock, Send, FileText, AlertTriangle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function WritePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorOption, setAuthorOption] = useState<'anonymous' | 'named'>('anonymous');
  const [isPremium, setIsPremium] = useState(false);
  const [allowComments, setAllowComments] = useState(true);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      formData.append('is_anonymous', authorOption === 'anonymous' ? 'true' : 'false');
      formData.append('is_premium', isPremium ? 'true' : 'false');
      formData.append('allow_comments', allowComments ? 'true' : 'false');
      
      await createPost(formData);
      // 성공 후 리다이렉트 또는 알림
      router.push('/board');
    } catch (error) {
      console.error('작성 실패:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-8">
      {/* 배경 디자인 요소 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-10 pt-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
                작전 보고서 생성
              </h1>
              <p className="text-gray-400 text-sm mt-1">최고 기밀 정보 입력 섹터</p>
            </div>
          </div>

          {/* 진행 상태 바 */}
          <div className="flex items-center gap-4 mb-8">
            {['기본 정보', '세부 내용', '보안 설정', '제출 준비'].map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${index === 0 
                    ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white' 
                    : 'bg-gray-800/50 text-gray-500 border border-gray-700'
                  }`}>
                  {index + 1}
                </div>
                <span className={`text-sm ${index === 0 ? 'text-orange-300' : 'text-gray-500'}`}>
                  {step}
                </span>
                {index < 3 && (
                  <div className="w-8 h-0.5 bg-gray-800 ml-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 메인 폼 */}
        <form action={handleSubmit} className="space-y-8">
          {/* 작전명 섹션 */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-gray-900/60 backdrop-blur-sm border-2 border-gray-800 rounded-2xl p-6 transition-all duration-300 group-hover:border-orange-500/50">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-orange-400" />
                <label className="text-lg font-bold text-white">작전명 (제목)</label>
                <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full">필수</span>
              </div>
              <input 
                name="title" 
                required 
                className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-white text-lg placeholder-gray-500 
                  focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                placeholder="예: 프로젝트 프롬프터스 - AI 전략 개편안"
                maxLength={100}
                disabled={isSubmitting}
              />
              <div className="flex justify-end mt-2">
                <span className="text-xs text-gray-500">최대 100자</span>
              </div>
            </div>
          </div>

          {/* 작전 상세 섹션 */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-gray-900/60 backdrop-blur-sm border-2 border-gray-800 rounded-2xl p-6 transition-all duration-300 group-hover:border-amber-500/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <label className="text-lg font-bold text-white">상세 작전 계획 (내용)</label>
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full">고급 편집</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    className="px-3 py-1 bg-gray-800 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                    disabled={isSubmitting}
                  >
                    마크다운
                  </button>
                  <button 
                    type="button" 
                    className="px-3 py-1 bg-gray-800 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                    disabled={isSubmitting}
                  >
                    미리보기
                  </button>
                </div>
              </div>
              <textarea 
                name="content" 
                required 
                rows={12}
                className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 
                  focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all
                  font-mono text-sm leading-relaxed resize-none"
                placeholder={`# 개요\n• 전략적 목표\n• 주요 과제\n\n# 실행 계획\n1. 단계별 접근 방식\n2. 예상 리소스\n3. 위험 요소 및 대응책\n\n# 예상 결과\n• 성공 지표\n• 영향도 분석`}
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    기밀 정보는 암호화됩니다
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  권장 길이: 500-2000자
                </div>
              </div>
            </div>
          </div>

          {/* 보안 설정 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-blue-400" />
                <label className="text-lg font-bold text-white">작성자 설정</label>
              </div>
              
              <div className="space-y-4">
                <div 
                  className="flex items-center justify-between p-4 bg-black/30 rounded-xl hover:bg-black/50 transition-colors cursor-pointer group/anon"
                  onClick={() => !isSubmitting && setAuthorOption('anonymous')}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input 
                        type="radio" 
                        name="author_option" 
                        value="anonymous" 
                        id="anonymous"
                        className="sr-only"
                        checked={authorOption === 'anonymous'}
                        onChange={() => setAuthorOption('anonymous')}
                        disabled={isSubmitting}
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${authorOption === 'anonymous' ? 'border-blue-500' : 'border-gray-600'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-blue-500 transition-opacity
                          ${authorOption === 'anonymous' ? 'opacity-100' : 'opacity-0'}`}></div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="anonymous" className="font-medium text-white cursor-pointer">익명 모드</label>
                      <p className="text-sm text-gray-400">작성자 정보가 공개되지 않습니다</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400 group-hover/anon:text-white">
                    기본 설정
                  </div>
                </div>

                <div 
                  className="flex items-center justify-between p-4 bg-black/30 rounded-xl hover:bg-black/50 transition-colors cursor-pointer group/named"
                  onClick={() => !isSubmitting && setAuthorOption('named')}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input 
                        type="radio" 
                        name="author_option" 
                        value="named" 
                        id="named"
                        className="sr-only"
                        checked={authorOption === 'named'}
                        onChange={() => setAuthorOption('named')}
                        disabled={isSubmitting}
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${authorOption === 'named' ? 'border-green-500' : 'border-gray-600'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-green-500 transition-opacity
                          ${authorOption === 'named' ? 'opacity-100' : 'opacity-0'}`}></div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="named" className="font-medium text-white cursor-pointer">신원 공개</label>
                      <p className="text-sm text-gray-400">작성자 정보가 함께 표시됩니다</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400 group-hover/named:text-white">
                    선택적
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <label className="text-lg font-bold text-white">추가 옵션</label>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 bg-black/30 rounded-xl hover:bg-black/50 transition-colors cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      name="is_premium" 
                      className="sr-only"
                      checked={isPremium}
                      onChange={(e) => !isSubmitting && setIsPremium(e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                      ${isPremium ? 'bg-purple-500 border-purple-500' : 'border-gray-600'}`}>
                      <svg className={`w-3 h-3 text-white transition-opacity ${isPremium ? 'opacity-100' : 'opacity-0'}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-white">프리미엄 전략으로 등록</span>
                    <p className="text-sm text-gray-400">특별 주목을 받을 수 있습니다</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-black/30 rounded-xl hover:bg-black/50 transition-colors cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      name="allow_comments" 
                      className="sr-only"
                      checked={allowComments}
                      onChange={(e) => !isSubmitting && setAllowComments(e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                      ${allowComments ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                      <svg className={`w-3 h-3 text-white transition-opacity ${allowComments ? 'opacity-100' : 'opacity-0'}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-white">댓글 허용</span>
                    <p className="text-sm text-gray-400">다른 요원들의 피드백을 받습니다</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* 제출 버튼 섹션 */}
          <div className="sticky bottom-8 mt-12">
            <div className="bg-gradient-to-r from-gray-900/80 via-black/80 to-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">작전 보고서를 제출하시겠습니까?</h3>
                  <p className="text-sm text-gray-400">
                    {isSubmitting 
                      ? '작전 보고서를 전송 중입니다...' 
                      : '제출 후 수정이 제한될 수 있습니다. 모든 내용을 확인해주세요.'
                    }
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    type="button"
                    className="px-8 py-3 rounded-xl font-bold border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                  
                  <button 
                    type="submit"
                    className="group relative px-10 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 
                      hover:shadow-[0_0_40px_rgba(251,191,36,0.3)] transition-all duration-300 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-white/10 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <span className={`flex items-center gap-3 relative z-10 ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>
                      <Send className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      <span className="text-lg">
                        {isSubmitting ? '전송 중...' : '작전 보고서 제출'}
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* 푸터 노트 */}
        <div className="mt-16 pt-8 border-t border-gray-800/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-500">
            <div>
              <h4 className="text-gray-400 font-medium mb-2">보안 안내</h4>
              <p>모든 데이터는 엔드투엔드 암호화되어 전송됩니다</p>
            </div>
            <div>
              <h4 className="text-gray-400 font-medium mb-2">작성 가이드</h4>
              <p>명확하고 구체적인 작전 계획을 작성해주세요</p>
            </div>
            <div>
              <h4 className="text-gray400 font-medium mb-2">지원</h4>
              <p>기술적 문제 발생 시 즉시 보고해주세요</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}