'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

type RequestType = 'membership' | 'clan_battle' | 'admin_contact';
type FormRequestType = Exclude<RequestType, 'admin_contact'>;
type InquiryStatus = 'received' | 'reviewing' | 'approved' | 'rejected';

interface InquiryItem {
  id: string;
  requestType: RequestType;
  isPublic: boolean;
  isLocked: boolean;
  nickname: string | null;
  royaleApiProfileUrl: string | null;
  clanName: string | null;
  royaleApiClanUrl: string | null;
  participantProposal: string | null;
  battleFormat: string | null;
  subject: string | null;
  content: string | null;
  contact: string | null;
  status: InquiryStatus;
  adminReply: string | null;
  createdAt: string;
}

const typeLabels: Record<RequestType, string> = {
  membership: '가입 문의',
  clan_battle: '클랜 대항전',
  admin_contact: '관리자에게 문의',
};

const statusLabels: Record<InquiryStatus, string> = {
  received: '접수',
  reviewing: '검토 중',
  approved: '승인',
  rejected: '거절',
};

function isInquiryItem(value: unknown): value is InquiryItem {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && (value.requestType === 'membership' || value.requestType === 'clan_battle' || value.requestType === 'admin_contact')
    && typeof value.isLocked === 'boolean'
    && (value.status === 'received' || value.status === 'reviewing' || value.status === 'approved' || value.status === 'rejected')
    && typeof value.createdAt === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readJson(response: Response) {
  const body: unknown = await response.json();
  if (!isRecord(body)) {
    throw new Error('서버 응답 형식이 올바르지 않습니다.');
  }
  return body;
}

export default function InquiryCenter({
  isLoggedIn,
  initialType = 'membership',
}: {
  isLoggedIn: boolean;
  initialType?: FormRequestType;
}) {
  const [requestType, setRequestType] = useState<FormRequestType>(initialType);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/inquiries', { cache: 'no-store' });
      const body = await readJson(response);
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : '문의 목록을 불러오지 못했습니다.');
      const values = Array.isArray(body.inquiries) ? body.inquiries.filter(isInquiryItem) : [];
      setInquiries(values);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '문의 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInquiries();
  }, [fetchInquiries]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const value = (name: string) => formData.get(name)?.toString() ?? '';
    const values = {
      requestType,
      nickname: value('nickname'),
      royaleApiProfileUrl: value('royaleApiProfileUrl'),
      content: value('content'),
      clanName: value('clanName'),
      royaleApiClanUrl: value('royaleApiClanUrl'),
      participantProposal: value('participantProposal'),
      battleFormat: value('battleFormat'),
      subject: value('subject'),
      contact: value('contact'),
      password: value('password'),
    };

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const body = await readJson(response);
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : '문의를 등록하지 못했습니다.');

      form.reset();
      setSuccessMessage(isLoggedIn
        ? '문의가 접수되었습니다. 처리 결과는 대시보드에서 확인할 수 있습니다.'
        : '문의가 접수되었습니다. 비밀번호를 설정했다면 같은 브라우저 세션에서 열람할 수 있습니다.');
      await fetchInquiries();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '문의를 등록하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const unlockInquiry = async (inquiryId: string) => {
    const password = passwords[inquiryId]?.trim();
    if (!password || unlockingId) return;
    setUnlockingId(inquiryId);
    setErrorMessage('');
    try {
      const response = await fetch('/api/inquiries/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId, password }),
      });
      const body = await readJson(response);
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : '문의 비밀번호를 확인하지 못했습니다.');
      setPasswords((current) => ({ ...current, [inquiryId]: '' }));
      await fetchInquiries();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '문의 비밀번호를 확인하지 못했습니다.');
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/20 via-neutral-950 to-black p-5 sm:p-7 space-y-6">
      <header>
        <p className="text-[10px] font-mono tracking-widest text-violet-300">INQUIRY CENTER</p>
        <h2 className="mt-1 text-xl font-black text-white">가입 · 클랜 대항전 문의</h2>
        <p className="mt-2 text-xs leading-relaxed text-neutral-400">
          비로그인 문의는 기본 공개됩니다. 비밀번호를 설정하면 비밀번호를 아는 사람만 본문을 볼 수 있습니다.
          로그인한 회원의 문의는 작성자와 관리자만 열람할 수 있습니다. 연락처는 작성자와 관리자에게만 표시됩니다.
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="문의 유형">
        {(['membership', 'clan_battle'] as const).map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={requestType === type}
            onClick={() => setRequestType(type)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              requestType === type
                ? 'bg-violet-600 text-white'
                : 'border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
            }`}
          >
            {typeLabels[type]}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        {requestType === 'membership' && (
          <>
            <label className="grid gap-1 text-xs text-neutral-300">
              닉네임
              <input name="nickname" required maxLength={80} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white" />
            </label>
            <label className="grid gap-1 text-xs text-neutral-300">
              RoyaleAPI 본인 프로필 링크
              <input name="royaleApiProfileUrl" type="url" required maxLength={500} placeholder="https://royaleapi.com/player/..." className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white" />
            </label>
            <label className="grid gap-1 text-xs text-neutral-300 sm:col-span-2">
              가입 문의 내용
              <textarea name="content" required maxLength={5000} rows={4} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white" />
            </label>
          </>
        )}

        {requestType === 'clan_battle' && (
          <>
            <label className="grid gap-1 text-xs text-neutral-300">
              클랜 이름
              <input name="clanName" required maxLength={100} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white" />
            </label>
            <label className="grid gap-1 text-xs text-neutral-300">
              RoyaleAPI 클랜 링크
              <input name="royaleApiClanUrl" type="url" required maxLength={500} placeholder="https://royaleapi.com/clan/..." className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white" />
            </label>
            <label className="grid gap-1 text-xs text-neutral-300">
              참가 인원 제안
              <input name="participantProposal" required maxLength={300} placeholder="예: 10명씩, 후보 2명 포함" className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white" />
            </label>
            <label className="grid gap-1 text-xs text-neutral-300">
              대항전 방식 제안
              <input name="battleFormat" required maxLength={1000} placeholder="예: 1대1 토너먼트, 3전 2선승" className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white" />
            </label>
            <label className="grid gap-1 text-xs text-neutral-300 sm:col-span-2">
              추가 내용 (선택)
              <textarea name="content" maxLength={5000} rows={3} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white" />
            </label>
          </>
        )}

        <label className="grid gap-1 text-xs text-neutral-300">
          연락 수단 (선택, 본인·관리자만 열람)
          <input name="contact" maxLength={300} placeholder="이메일, 오픈채팅 등" className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white" />
        </label>

        {!isLoggedIn && (
          <label className="grid gap-1 text-xs text-neutral-300">
            열람 비밀번호 (선택, 8자 이상)
            <input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white" />
          </label>
        )}

        <div className="flex items-center justify-between gap-3 sm:col-span-2">
          <p className="text-[11px] text-neutral-500">
            {isLoggedIn ? '로그인 문의는 본인과 관리자만 볼 수 있습니다.' : '비밀번호 입력은 세션당 문의별 최대 5회입니다.'}
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="shrink-0 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {isSubmitting ? '접수 중...' : '문의 접수'}
          </button>
        </div>
      </form>

      {errorMessage && <p role="alert" className="text-xs text-red-300">{errorMessage}</p>}
      {successMessage && <p role="status" className="text-xs text-emerald-300">{successMessage}</p>}

      <div className="border-t border-white/10 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">공개 문의</h3>
          <button type="button" onClick={() => void fetchInquiries()} className="text-[11px] text-violet-300 hover:text-violet-200">
            새로고침
          </button>
        </div>

        {isLoading ? (
          <p className="py-6 text-center text-xs text-neutral-500">문의 목록을 불러오는 중...</p>
        ) : inquiries.length === 0 ? (
          <p className="py-6 text-center text-xs text-neutral-500">표시할 문의가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inquiry) => (
              <article key={inquiry.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-violet-200">{typeLabels[inquiry.requestType]}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-neutral-300">{statusLabels[inquiry.status]}</span>
                  </div>
                  <time className="text-[10px] text-neutral-500">{new Date(inquiry.createdAt).toLocaleDateString()}</time>
                </div>

                {inquiry.isLocked ? (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <p className="mr-auto text-xs text-neutral-400">🔒 비밀번호로 보호된 문의입니다.</p>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={passwords[inquiry.id] || ''}
                      onChange={(event) => setPasswords((current) => ({ ...current, [inquiry.id]: event.target.value }))}
                      placeholder="열람 비밀번호"
                      className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => void unlockInquiry(inquiry.id)}
                      disabled={unlockingId === inquiry.id}
                      className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {unlockingId === inquiry.id ? '확인 중...' : '열람'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2 text-xs text-neutral-200">
                    {inquiry.nickname && <p>닉네임: {inquiry.nickname}</p>}
                    {inquiry.royaleApiProfileUrl && <a className="block text-cyan-300 underline" href={inquiry.royaleApiProfileUrl} target="_blank" rel="noreferrer">RoyaleAPI 프로필</a>}
                    {inquiry.clanName && <p>클랜: {inquiry.clanName}</p>}
                    {inquiry.royaleApiClanUrl && <a className="block text-cyan-300 underline" href={inquiry.royaleApiClanUrl} target="_blank" rel="noreferrer">RoyaleAPI 클랜</a>}
                    {inquiry.participantProposal && <p>참가 인원: {inquiry.participantProposal}</p>}
                    {inquiry.battleFormat && <p>대항전 방식: {inquiry.battleFormat}</p>}
                    {inquiry.subject && <p className="font-bold text-white">{inquiry.subject}</p>}
                    {inquiry.content && <p className="whitespace-pre-wrap leading-relaxed">{inquiry.content}</p>}
                    {inquiry.contact && <p className="text-neutral-400">연락처: {inquiry.contact}</p>}
                    {inquiry.adminReply && (
                      <p className="whitespace-pre-wrap rounded-lg border-l-2 border-cyan-500 bg-cyan-950/20 p-3 text-cyan-100">
                        관리자 답변: {inquiry.adminReply}
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
