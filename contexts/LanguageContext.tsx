'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const dictionaries = {
  en: {
    systemAccess: 'System Access',
    resetPassword: 'Reset Password',
    connect: 'Connect',
    accessing: 'Accessing...',
    createNewIdentity: 'Create New Identity',
    forgotPassword: 'Forgot password?',
    emailPlaceholder: 'eodnd1234@gmail.com',
    passwordPlaceholder: '••••••••',
    toggleLang: '🇰🇷 한국어',
    resetDescription: 'Enter your email address and we\'ll send you a link to reset your password.',
    sendResetLink: 'Send Reset Link',
    sending: 'Sending...',
    backToLogin: 'Back to Login',
    privacyAgree: 'I agree to the collection and use of personal information.',
    privacyPolicy: 'Privacy Policy',
  },
  ko: {
    systemAccess: '시스템 접근',
    resetPassword: '비밀번호 재설정',
    connect: '접속하기',
    accessing: '접속 중...',
    createNewIdentity: '새 계정 만들기',
    forgotPassword: '비밀번호를 잊으셨나요?',
    emailPlaceholder: '이메일 주소',
    passwordPlaceholder: '비밀번호',
    toggleLang: '🇺🇸 English',
    resetDescription: '이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.',
    sendResetLink: '재설정 링크 보내기',
    sending: '보내는 중...',
    backToLogin: '로그인으로 돌아가기',
    privacyAgree: '개인정보 수집 · 이용에 동의합니다.',
    privacyPolicy: '개인정보 처리방침',
  },
};

type Language = 'en' | 'ko';

interface LanguageContextType {
  lang: Language;
  toggleLanguage: () => void;
  t: (key: keyof typeof dictionaries.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('ko');

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'ko' ? 'en' : 'ko'));
  };

  const t = (key: keyof typeof dictionaries.en) => dictionaries[lang][key];

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};