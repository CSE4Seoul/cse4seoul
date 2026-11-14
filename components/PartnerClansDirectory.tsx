import { ExternalLink, Handshake } from 'lucide-react';

export interface PartnerClan {
  id: string;
  name: string;
  royaleApiUrl: string;
  collaborationActivities: string;
}

export default function PartnerClansDirectory({ partnerClans }: { partnerClans: PartnerClan[] }) {
  return (
    <section aria-labelledby="partner-clans-title" className="space-y-7">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">CSE4SEOUL · PARTNERS</p>
        <h1 id="partner-clans-title" className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
          협력 클랜
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          CSE4Seoul과 함께 교류하고 활동한 클랜을 소개합니다.
        </p>
      </header>

      {partnerClans.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-12 text-center">
          <Handshake aria-hidden="true" className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-3 text-sm text-neutral-400">등록된 협력 클랜이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partnerClans.map((clan) => (
            <article key={clan.id} className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-950/30 text-emerald-300">
                  <Handshake aria-hidden="true" className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="break-words text-base font-semibold text-white">{clan.name}</h2>
                  <a
                    href={clan.royaleApiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-300 transition-colors hover:text-emerald-200"
                  >
                    RoyaleAPI 클랜 정보
                    <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
              <div className="mt-5 border-t border-slate-800 pt-4">
                <h3 className="text-xs font-semibold text-neutral-300">함께한 활동</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-400">
                  {clan.collaborationActivities}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
