import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from '../contexts/LanguageContext';

export const metadata: Metadata = {
  metadataBase: new URL('https://cse4seoul.vercel.app'),
  title: 'CSE4Seoul | Engineering & Arena',
  description: '개발자와 게이머가 기술과 전술을 공유하고 함께 프로젝트를 구축하는 하이브리드 커뮤니티.',
  openGraph: {
    title: 'CSE4Seoul | Engineering & Arena',
    description: '개발과 게임, 기술과 전략을 함께 나누는 CSE4Seoul 커뮤니티.',
    url: 'https://cse4seoul.vercel.app',
    siteName: 'CSE4Seoul',
    images: [
      {
        url: '/opengraph-image.png', // 이따가 설명드릴 이미지 파일
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
