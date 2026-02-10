import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  title: 'CSE4Seoul | Game, Code, and Evolve',
  description: '서울권 대학 연합 개발자 플랫폼. 리눅스 정신을 계승하여 실패를 두려워하지 않는 실험적인 문화를 만듭니다.',
  openGraph: {
    title: 'CSE4Seoul HQ',
    description: 'Game, Code, and Evolve with AI.',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
