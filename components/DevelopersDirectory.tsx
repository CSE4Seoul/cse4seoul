'use client';

import Image from 'next/image';
import { Code2, ExternalLink, Mail, UserRound, Youtube } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface DeveloperProfile {
  id: string;
  name: string;
  email?: string;
  portfolioUrl?: string;
  royaleApiUrl?: string;
  youtubeUrl?: string;
  photoUrl?: string;
  isLead?: boolean;
  role?: {
    ko: string;
    en: string;
  };
}

const DEFAULT_DEVELOPERS: DeveloperProfile[] = [
  {
    id: 'johamin',
    name: '조하민',
    email: 'johamin3624@konkuk.ac.kr',
    portfolioUrl: 'https://hamin-portfolio.vercel.app/',
    royaleApiUrl: 'https://royaleapi.com/player/8YUPJQC29',
    isLead: true,
  },
  {
    id: 'peval',
    name: 'Peval',
    royaleApiUrl: 'https://royaleapi.com/player/RQVPY0GGV',
    youtubeUrl: 'https://youtube.com/channel/UC-kiTHAKYch0YTpvOLTOCWg?si=QSLk6Frh_zgLPyVg',
    role: {
      ko: '구성원 && 유튜버',
      en: 'Member && YouTuber',
    },
  },
];

export default function DevelopersDirectory({
  developers = DEFAULT_DEVELOPERS,
}: {
  developers?: DeveloperProfile[];
}) {
  const { lang } = useLanguage();
  const isKorean = lang !== 'en';

  return (
    <section aria-labelledby="developers-title" className="space-y-7">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">CSE4SEOUL · TEAM</p>
        <h1 id="developers-title" className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
          {isKorean ? '개발 구성원 소개' : 'Meet the team'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          {isKorean
            ? 'CSE4Seoul의 서비스와 커뮤니티를 만드는 개발자와 구성원들입니다.'
            : 'The developers and members building CSE4Seoul’s services and community.'}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {developers.map((developer) => (
          <article
            key={developer.id}
            className="rounded-xl border border-slate-800 bg-slate-950 p-5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-900 text-slate-300">
                {developer.photoUrl ? (
                  <Image
                    src={developer.photoUrl}
                    alt={`${developer.name} ${isKorean ? '프로필 사진' : 'profile photo'}`}
                    width={56}
                    height={56}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound aria-hidden="true" className="h-7 w-7" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold text-white">{developer.name}</h2>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-sky-300">
                  <Code2 aria-hidden="true" className="h-3.5 w-3.5" />
                  {developer.role
                    ? (isKorean ? developer.role.ko : developer.role.en)
                    : developer.isLead
                    ? (isKorean ? '메인 개발자' : 'Lead developer')
                    : (isKorean ? '개발자' : 'Developer')}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-800 pt-4">
              {developer.email && (
                <a
                  href={`mailto:${developer.email}`}
                  className="flex min-w-0 items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
                >
                  <Mail aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span className="truncate">{developer.email}</span>
                </a>
              )}
              {developer.portfolioUrl && (
                <a
                  href={developer.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-fit items-center gap-2 text-sm font-medium text-slate-200 transition-colors hover:text-sky-300"
                >
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  {isKorean ? '포트폴리오 보기' : 'View portfolio'}
                </a>
              )}
              {developer.royaleApiUrl && (
                <a
                  href={developer.royaleApiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-fit items-center gap-2 text-sm font-medium text-slate-200 transition-colors hover:text-sky-300"
                >
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  {isKorean ? 'RoyaleAPI 바로가기' : 'RoyaleAPI profile'}
                </a>
              )}
              {developer.youtubeUrl && (
                <a
                  href={developer.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-fit items-center gap-2 text-sm font-medium text-slate-200 transition-colors hover:text-sky-300"
                >
                  <Youtube aria-hidden="true" className="h-4 w-4" />
                  {isKorean ? 'YouTube 채널 바로가기' : 'YouTube channel'}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
