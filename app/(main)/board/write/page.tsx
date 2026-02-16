'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Send, 
  ChevronLeft, 
  FileText,
  Eye,
  EyeOff,
  Key,
  Sparkles,
  AlertCircle
} from 'lucide-react';

import { encryptMessage } from '@/utils/encryption'; 

const DEFAULT_KEY = process.env.NEXT_PUBLIC_CHAT_ENCRYPTION_KEY || 'fallback-public-key-2026';

export default function WritePostPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 암호 표시 토글
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{title?: string; content?: string; password?: string}>({});

  // 실시간 유효성 검사 (간단히)
  useEffect(() => {
    const errors: typeof formErrors = {};
    if (title.length > 0 && title.length < 2) errors.title = '제목은 2자 이상이어야 합니다.';
    if (content.length > 0 && content.length < 5) errors.content = '본문은 5자 이상이어야 합니다.';
    if (isProtected && password.length > 0 && password.length < 4) errors.password = '암호는 4자 이상이어야 합니다.';
    setFormErrors(errors);
  }, [title, content, isProtected, password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 본문을 모두 작성해주세요.');
      return;
    }
    if (isProtected && !password.trim()) {
      alert('보호글로 설정하려면 해독 암호를 입력해야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. 현재 로그인한 요원 정보 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("보안 인가가 필요합니다.");

      // 2. 작성자 닉네임 가져오기
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // 3. 🔐 암호화 키 결정 (보호글이면 '입력한 비밀번호', 아니면 '기본 키')
      const secretKey = isProtected ? password : DEFAULT_KEY;

      // 4. 🔥 본문 통째로 암호화!
      const encryptedContent = await encryptMessage(content, secretKey);

      // 5. DB에 쏘기!
      const { error } = await supabase.from('posts').insert({
        title: title.trim(),
        content: encryptedContent, 
        author_id: user.id,
        author_name: profile?.full_name || 'Unknown Agent',
        is_anonymous: false, 
        category: '일반',    
      });

      if (error) throw error;

      alert("작전 명령서가 성공적으로 암호화되어 서버에 저장되었습니다. 🎯");
      router.push('/board'); // 🔥 드디어 게시판으로 넘어가는 마법의 코드!

    } catch (error) {
      console.error("게시글 작성 실패:", error);
      alert("데이터 동기화 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false); // 로딩 뱅글뱅글 끄기
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-black p-4 md:p-8 text-white relative overflow-hidden flex flex-col items-center">
      {/* 배경: 글로우 원형 그라디언트 여러 개 */}
      <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none"></div> 
      {/* grid.svg는 투명한 그리드 패턴 이미지 */}
      
      <div className="w-full max-w-4xl z-10 relative">
        {/* 헤더 */}
        <header className="mb-8 border-b border-blue-800/30 pb-6 flex items-center justify-between backdrop-blur-sm">
          <div>
            <button 
              onClick={() => router.push('/board')}
              className="group flex items-center gap-2 px-4 py-2 mb-3 text-sm font-medium text-gray-300 bg-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-xl hover:bg-blue-900/40 hover:border-blue-600/50 hover:text-white transition-all duration-300 shadow-lg hover:shadow-blue-900/20 w-fit"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>게시판으로</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400">
                  새 작전 명령서
                </h1>
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  모든 내용은 AES-256으로 암호화됩니다
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 글쓰기 폼 */}
        <form onSubmit={handleSubmit} className="bg-gray-900/30 border border-gray-800/50 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden">
          {/* 배경 장식 라인 */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          
          {/* 제목 */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 pl-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              제목 (공개 정보)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 침투 작전 코드 네임 알파"
              className="w-full bg-black/40 border border-gray-700/70 rounded-xl py-4 px-5 text-white focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-gray-600 hover:border-gray-600"
            />
            {formErrors.title && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {formErrors.title}
              </p>
            )}
          </div>

          {/* 본문 */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 pl-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-500" />
              기밀 본문 (암호화 저장)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상세 작전 내용을 입력하세요. 이 텍스트는 서버에 암호화되어 저장됩니다."
              rows={12}
              className="w-full bg-black/40 border border-gray-700/70 rounded-xl py-4 px-5 text-white focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all resize-none placeholder:text-gray-600 hover:border-gray-600"
            />
            {formErrors.content && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {formErrors.content}
              </p>
            )}
          </div>

          {/* 보안 설정 (E2EE 토글) */}
          <div className="relative p-6 rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-900/20 to-fuchsia-900/10 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.15),transparent_70%)] pointer-events-none"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg transition-colors duration-300 ${isProtected ? 'bg-violet-500/20 text-violet-300' : 'bg-gray-800/50 text-gray-500'}`}>
                  {isProtected ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    {isProtected ? (
                      <>
                        <span className="text-violet-300">E2EE 보호 모드</span>
                        <span className="text-xs bg-violet-500/30 text-violet-200 px-2 py-0.5 rounded-full border border-violet-500/50">활성화</span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-300">공개 모드</span>
                        <span className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full">기본 키 사용</span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-md">
                    {isProtected 
                      ? '작성자가 지정한 암호를 아는 사람만 본문을 열람할 수 있습니다.'
                      : '모든 클랜원이 기본 암호로 복호화 가능합니다. (공개 글)'}
                  </p>
                </div>
              </div>
              
              {/* 토글 스위치 (애니메이션 추가) */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isProtected}
                  onChange={(e) => {
                    setIsProtected(e.target.checked);
                    if (!e.target.checked) setPassword('');
                  }}
                />
                <div className="w-14 h-7 bg-gray-700/80 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-violet-600 peer-checked:to-fuchsia-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:duration-300 peer-checked:after:translate-x-7 peer-checked:after:border-white shadow-inner shadow-black/50"></div>
              </label>
            </div>

            {/* 암호 입력 필드 (토글 켜졌을 때) */}
            {isProtected && (
              <div className="mt-6 relative z-10 transition-all duration-500 ease-out transform origin-top">
                <div className="p-4 rounded-xl bg-black/40 border border-violet-500/30 backdrop-blur-sm">
                  <label className="text-xs font-medium text-violet-300 mb-2 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" />
                    해독 키 (비밀번호)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="영문, 숫자, 특수문자 조합 4자 이상"
                      className="w-full bg-black/60 border border-violet-500/50 rounded-xl py-3 pl-4 pr-12 text-white focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all placeholder:text-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.password}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> 
                    이 키를 잃어버리면 본문을 복구할 수 없습니다. 안전한 곳에 보관하세요.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 제출 버튼 */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim() || (isProtected && !password.trim()) || Object.keys(formErrors).length > 0}
              className="group w-full py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-700 disabled:to-gray-700 rounded-xl text-white font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-blue-900/50 hover:shadow-cyan-900/50 relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>암호화 중...</span>
                </div>
              ) : (
                <>
                  <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <span>명령서 암호화 및 발신</span>
                  <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>
          </div>

          {/* 하단 정보 */}
          <div className="flex justify-between text-xs text-gray-600 pt-2">
            <span>🔒 AES-256-GCM 암호화</span>
            <span>🕒 24시간 후 자동 삭제 (채팅방과 동일 정책)</span>
          </div>
        </form>
      </div>
    </div>
  );
}