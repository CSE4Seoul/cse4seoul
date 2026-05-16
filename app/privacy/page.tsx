'use client';

import { useState, useEffect } from 'react';
import BackButton from '@/components/back-button';

export default function PrivacyPage() {
  const [darkMode, setDarkMode] = useState(false);

  // 초기 테마 설정 (로컬스토리지 + 시스템 선호)
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (stored === null && prefersDark);
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/40 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 영역: 뒤로가기 + 다크모드 토글 */}
        <div className="flex justify-between items-center mb-6">
          <div className="transition-transform hover:-translate-x-1">
            <BackButton />
          </div>
          <button
            onClick={toggleDarkMode}
            className="relative w-10 h-10 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md flex items-center justify-center text-slate-700 dark:text-amber-300 hover:scale-105 transition-all duration-200 border border-white/40 dark:border-gray-700"
            aria-label="다크모드 전환"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-indigo-100/50 dark:shadow-black/30 border border-white/40 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <div className="px-6 py-8 sm:p-10">
            {/* 헤더 섹션 */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 dark:bg-indigo-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 dark:bg-indigo-400"></span>
                </span>
                CSE4Seoul 개인정보 보호 약속
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 to-indigo-800 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent">
                개인정보 처리방침
              </h1>
              <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                CSE4Seoul은 회원님의 소중한 개인정보를 안전하게 보호하며, 
                투명한 정보 처리 원칙을 따릅니다.
              </p>
              <div className="mt-6 h-1 w-24 bg-gradient-to-r from-indigo-400 to-indigo-600 dark:from-indigo-500 dark:to-indigo-400 rounded-full mx-auto"></div>
            </div>

            {/* 본문 내용 (다크모드 텍스트 컬러 통일) */}
            <div className="space-y-8">
              {/* 제1조 */}
              <div className="group">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                    1
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                      개인정보의 처리 목적
                    </h2>
                    <div className="pl-1 border-l-2 border-indigo-200 dark:border-indigo-800 pl-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                      CSE4Seoul은 다음의 목적을 위하여 개인정보를 처리합니다: 회원 가입 의사 확인,
                      회원제 서비스 제공에 따른 본인 식별·인증, 서비스 부정이용 방지, 공지·통지,
                      AI 봇 및 게시판 관련 서비스 제공.
                    </div>
                  </div>
                </div>
              </div>

              {/* 제2조 */}
              <div className="group">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shadow-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">처리하는 개인정보 항목</h2>
                    <div className="pl-1 border-l-2 border-indigo-200 dark:border-indigo-800 pl-4 space-y-2">
                      <p className="text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-400">수집 항목:</span> 이메일 주소, 비밀번호(암호화 저장).
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-400">자동 수집 항목:</span> IP 주소, 쿠키, 서비스 이용 기록 등.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 제3조 */}
              <div className="group">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shadow-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">개인정보의 보유 및 이용기간</h2>
                    <div className="pl-1 border-l-2 border-indigo-200 dark:border-indigo-800 pl-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                      원칙적으로 회원 탈퇴 시 즉시 파기합니다. 다만 관련 법령에 따라 보관할 필요가
                      있는 경우에는 해당 법령에서 정한 기간 동안 보관합니다.
                    </div>
                  </div>
                </div>
              </div>

              {/* 제4조 */}
              <div className="group">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shadow-sm">
                    4
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">개인정보의 제3자 제공 및 위탁</h2>
                    <div className="pl-1 border-l-2 border-indigo-200 dark:border-indigo-800 pl-4 space-y-3">
                      <div className="bg-slate-50 dark:bg-gray-900/60 rounded-xl p-4 border border-slate-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-medium mb-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          수탁자: Supabase
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 ml-6">위탁 업무: 회원 인증, 데이터베이스 호스팅 및 관리</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 제5조 */}
              <div className="group">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shadow-sm">
                    5
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">정보주체의 권리·의무 및 행사방법</h2>
                    <div className="pl-1 border-l-2 border-indigo-200 dark:border-indigo-800 pl-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                      이용자는 언제든지 자신의 개인정보 조회, 정정, 삭제를 요청할 수 있으며, 회원 탈퇴를
                      요청할 수 있습니다. 마이페이지 또는 관리자 이메일로 요청해 주세요.
                    </div>
                  </div>
                </div>
              </div>

              {/* 제6조 */}
              <div className="group">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shadow-sm">
                    6
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">개인정보의 안전성 확보 조치</h2>
                    <div className="pl-1 border-l-2 border-indigo-200 dark:border-indigo-800 pl-4 space-y-2">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        비밀번호는 일방향 암호화되어 저장·관리됩니다.
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        통신 구간은 HTTPS 등 안전한 프로토콜을 사용합니다.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 제7조 */}
              <div className="group">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shadow-sm">
                    7
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">개인정보 보호책임자 / 문의처</h2>
                    <div className="pl-1 border-l-2 border-indigo-200 dark:border-indigo-800 pl-4">
                      <div className="bg-gradient-to-r from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 border border-indigo-100 dark:border-gray-700">
                        <p className="text-slate-700 dark:text-slate-300">
                          <span className="font-semibold text-indigo-800 dark:text-indigo-400">담당자:</span> [조하민] (CSE4Seoul 운영자)]
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 mt-1">
                          <span className="font-semibold text-indigo-800 dark:text-indigo-400">이메일:</span>{' '}
                          <a href="mailto:[johamin3624@naver.com]" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline underline-offset-2 transition-colors">
                            [johamin3624@naver.com]
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 부칙 */}
            <div className="mt-12 pt-6 border-t border-slate-100 dark:border-gray-800 text-center">
              <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-gray-900/60 px-5 py-2.5 rounded-full text-sm text-slate-500 dark:text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                부칙: 이 개인정보 처리방침은 2026년부터 적용됩니다.
              </div>
            </div>
          </div>
        </div>

        {/* 하단 장식 */}
        <div className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500">
          CSE4Seoul은 투명한 개인정보 보호 원칙을 지킵니다.
        </div>
      </div>
    </div>
  );
}
