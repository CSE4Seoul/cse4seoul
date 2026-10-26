'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Code2, ExternalLink, Mail, UserRound, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface DeveloperProfile {
  id: string;
  name: string;
  email: string;
  portfolioUrl: string;
  photoUrl?: string;
  isLead?: boolean;
}

const DEFAULT_DEVELOPERS: DeveloperProfile[] = [
  {
    id: 'johamin',
    name: '조하민',
    email: 'johamin3624@konkuk.ac.kr',
    portfolioUrl: 'https://hamin-portfolio.vercel.app/',
    isLead: true,
  },
];

interface DevelopersWidgetProps {
  developers?: DeveloperProfile[];
}

export default function DevelopersWidget({ developers = DEFAULT_DEVELOPERS }: DevelopersWidgetProps) {
  const { lang } = useLanguage();
  const isKorean = lang !== 'en';
  const [isOpen, setIsOpen] = useState(false);
  const dialogId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-3.5 text-xs font-bold text-cyan-200 transition-colors hover:bg-cyan-500/20"
      >
        <Code2 aria-hidden="true" className="h-4 w-4" />
        {isKorean ? '개발자 소개' : 'Developers'}
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            id={`developers-dialog-${dialogId}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`developers-title-${dialogId}`}
            className="my-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-neutral-950 p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Code2 aria-hidden="true" className="h-5 w-5 text-cyan-400" />
                <h2 id={`developers-title-${dialogId}`} className="text-base font-bold text-white sm:text-lg">
                  {isKorean ? '함께 만드는 개발자들' : 'Meet the Developers'}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-neutral-500">
                  {developers.length.toString().padStart(2, '0')} MEMBERS
                </span>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label={isKorean ? '개발자 소개 닫기' : 'Close developer introduction'}
                  className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {developers.map((developer) => (
                <article
                  key={developer.id}
                  className="flex min-w-0 items-start gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-cyan-500/30"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-500/25 bg-cyan-950/50 text-cyan-300">
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

                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <h3 className="truncate text-sm font-bold text-white">{developer.name}</h3>
                      <p className="mt-0.5 text-[11px] font-medium text-cyan-300">
                        {developer.isLead
                          ? (isKorean ? '메인 개발자' : 'Lead Developer')
                          : (isKorean ? '개발자' : 'Developer')}
                      </p>
                    </div>

                    <a
                      href={`mailto:${developer.email}`}
                      className="flex min-w-0 items-center gap-2 text-xs text-neutral-400 transition-colors hover:text-cyan-300"
                    >
                      <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{developer.email}</span>
                    </a>

                    <a
                      href={developer.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-w-0 items-center gap-2 text-xs text-neutral-400 transition-colors hover:text-cyan-300"
                    >
                      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{isKorean ? '포트폴리오 사이트' : 'Portfolio'}</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}