import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Code2,
  Gamepad2,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';

const records = [
  {
    href: '/board',
    label: '지식과 전략',
    description: '개발 경험과 게임 전략을 나누고, 함께 참고할 수 있도록 쌓아갑니다.',
    icon: BookOpen,
    tone: 'text-blue-300',
  },
  {
    href: '/community/moments',
    label: '클랜의 순간',
    description: 'CSE4Seoul 구성원들이 함께한 플레이와 승리의 순간을 기록합니다.',
    icon: Trophy,
    tone: 'text-amber-300',
  },
  {
    href: '/developers',
    label: '함께하는 사람들',
    description: '각자의 관심사와 경험을 가진 커뮤니티 구성원을 소개합니다.',
    icon: Users,
    tone: 'text-cyan-300',
  },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080c14] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(29,78,216,0.2),transparent_68%)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" />
          메인으로
        </Link>

        <header className="max-w-4xl py-16 sm:py-24">
          <p className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.2em] text-cyan-300 sm:text-xs">
            <span className="h-px w-7 bg-cyan-400" />
            ABOUT CSE4SEOUL
          </p>
          <h1 className="mt-6 text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            <span className="block">안녕하세요.</span>
            <span className="mt-2 block break-keep text-slate-200">
              저희는 서울권 개발자 커뮤니티 연합
            </span>
            <span className="mt-2 block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-sky-200">
              CSE4Seoul입니다.
            </span>
          </h1>
          <p className="mt-8 max-w-2xl break-keep text-sm leading-7 text-slate-400 sm:text-base sm:leading-8">
            Computer Science and Engineering For Seoul. 개발과 게임을 좋아하는 사람들이 모여
            서로의 지식과 경험을 나누고, 함께 배우고 만들어가는 커뮤니티입니다.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] tracking-wide text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            EST. AROUND JAN 2026
          </div>
        </header>

        <section id="history" className="grid gap-8 border-t border-white/10 py-10 sm:py-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-blue-300">OUR BEGINNING</p>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">우리의 시작</h2>
          </div>
          <div className="border-l border-cyan-400/30 pl-5 sm:pl-7">
            <p className="font-mono text-xs tracking-wider text-cyan-300">2026.01 무렵</p>
            <h3 className="mt-3 text-lg font-semibold text-slate-100">서울권 개발자들의 교류에서 출발했습니다.</h3>
            <p className="mt-3 max-w-2xl break-keep text-sm leading-7 text-slate-400">
              각자의 기술과 관심사를 나누고, 온라인에서도 함께 활동할 수 있는 공간을 만들기 위해
              CSE4Seoul을 시작했습니다. 개발 커뮤니티의 협업과 클래시 로얄 클랜 활동을 함께 이어가며,
              서로의 경험을 기록하고 있습니다.
            </p>
          </div>
        </section>

        <section className="border-t border-white/10 py-10 sm:py-12">
          <div className="mb-6">
            <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-cyan-400">WHAT WE SHARE</p>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">우리가 함께 나누는 것</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded-lg border border-white/[0.08] bg-[#0c1420] p-5">
              <Code2 className="h-5 w-5 text-blue-300" />
              <h3 className="mt-4 text-sm font-semibold text-white">개발과 배움</h3>
              <p className="mt-2 text-xs leading-6 text-slate-400">프로젝트, 도구, 학습 경험을 나누며 함께 성장합니다.</p>
            </article>
            <article className="rounded-lg border border-white/[0.08] bg-[#0c1420] p-5">
              <Gamepad2 className="h-5 w-5 text-cyan-300" />
              <h3 className="mt-4 text-sm font-semibold text-white">게임과 전략</h3>
              <p className="mt-2 text-xs leading-6 text-slate-400">클랜 활동과 플레이의 기록을 함께 만들어갑니다.</p>
            </article>
            <article className="rounded-lg border border-white/[0.08] bg-[#0c1420] p-5">
              <Users className="h-5 w-5 text-amber-300" />
              <h3 className="mt-4 text-sm font-semibold text-white">사람과 협업</h3>
              <p className="mt-2 text-xs leading-6 text-slate-400">서로 다른 경험을 연결해 새로운 시도를 이어갑니다.</p>
            </article>
          </div>
        </section>

        <section className="border-t border-white/10 py-10 sm:py-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-amber-300">OUR RECORDS</p>
              <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">CSE4Seoul의 기록</h2>
            </div>
            <p className="max-w-md text-xs leading-6 text-slate-500">지식과 활동, 함께한 사람들의 기록을 각 공간에서 더 자세히 볼 수 있습니다.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {records.map((record) => {
              const Icon = record.icon;
              return (
                <Link
                  key={record.href}
                  href={record.href}
                  className="group rounded-lg border border-white/[0.08] bg-[#0c1420] p-5 transition hover:border-cyan-500/50 hover:bg-[#101b29]"
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${record.tone}`} />
                    <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
                  </div>
                  <h3 className="mt-5 text-sm font-semibold text-white">{record.label}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-400">{record.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-cyan-300">JOIN &amp; CONNECT</p>
            <h2 className="mt-2 text-lg font-semibold text-white">CSE4Seoul과 함께하기</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/community/inquiries?type=membership" className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200">
              가입 문의<ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/community/inquiries?type=clan_battle" className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200">
              대항전 문의<ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/community/inquiries#admin-contact" className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200">
              클랜 교류 문의<ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
