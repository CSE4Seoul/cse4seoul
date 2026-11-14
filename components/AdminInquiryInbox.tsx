'use client';

import { useCallback, useEffect, useState } from 'react';

type RequestType = 'membership' | 'clan_battle' | 'admin_contact';
type InquiryStatus = 'received' | 'reviewing' | 'approved' | 'rejected';

interface InquiryItem {
  id: string;
  requestType: RequestType;
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
  createdBy?: string | null;
}

const requestTypes: Record<RequestType, string> = {
  membership: '가입 문의',
  clan_battle: '클랜 대항전',
  admin_contact: '관리자 문의',
};

const statuses: { value: InquiryStatus; label: string }[] = [
  { value: 'received', label: '접수' },
  { value: 'reviewing', label: '검토 중' },
  { value: 'approved', label: '승인' },
  { value: 'rejected', label: '거절' },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInquiryItem(value: unknown): value is InquiryItem {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && (value.requestType === 'membership' || value.requestType === 'clan_battle' || value.requestType === 'admin_contact')
    && typeof value.createdAt === 'string'
    && (value.status === 'received' || value.status === 'reviewing' || value.status === 'approved' || value.status === 'rejected');
}

async function readJson(response: Response) {
  const body: unknown = await response.json();
  if (!isRecord(body)) throw new Error('서버 응답 형식이 올바르지 않습니다.');
  return body;
}

export default function AdminInquiryInbox() {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadInquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/inquiries?admin=true', { cache: 'no-store' });
      const body = await readJson(response);
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : '문의 목록을 불러오지 못했습니다.');
      const items = Array.isArray(body.inquiries) ? body.inquiries.filter(isInquiryItem) : [];
      setInquiries(items);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '문의 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInquiries();
  }, [loadInquiries]);

  const updateInquiry = async (id: string, changes: { status?: InquiryStatus; adminReply?: string }) => {
    setBusyId(id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...changes }),
      });
      const body = await readJson(response);
      const updatedInquiry = body.inquiry;
      if (!response.ok || !isInquiryItem(updatedInquiry)) {
        throw new Error(typeof body.error === 'string' ? body.error : '문의를 업데이트하지 못했습니다.');
      }
      setInquiries((current) => current.map((item) => item.id === id ? updatedInquiry : item));
      setSuccessMessage('문의가 업데이트되었습니다.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '문의를 업데이트하지 못했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-[10px] font-mono tracking-widest text-rose-300">ADMIN INBOX</p>
          <h1 className="mt-1 text-2xl font-black text-white">가입 · 대항전 · 관리자 문의</h1>
          <p className="mt-1 text-xs text-neutral-400">모든 관리자 계정이 전체 문의와 비공개 연락처를 확인할 수 있습니다.</p>
        </div>
        <button type="button" onClick={() => void loadInquiries()} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-neutral-200 hover:bg-white/5">
          새로고침
        </button>
      </header>

      {errorMessage && <p role="alert" className="text-xs text-red-300">{errorMessage}</p>}
      {successMessage && <p role="status" className="text-xs text-emerald-300">{successMessage}</p>}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-neutral-500">문의함을 불러오는 중...</p>
      ) : inquiries.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] py-12 text-center text-sm text-neutral-500">접수된 문의가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {inquiries.map((item) => (
            <article key={item.id} className="rounded-2xl border border-rose-500/15 bg-neutral-950/80 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-rose-200">{requestTypes[item.requestType]}</span>
                  <time className="text-[10px] text-neutral-500">{new Date(item.createdAt).toLocaleString()}</time>
                  {item.createdBy && <span className="text-[10px] text-neutral-600">회원 접수</span>}
                </div>
                <label className="flex items-center gap-2 text-[11px] text-neutral-400">
                  상태
                  <select
                    value={item.status}
                    disabled={busyId === item.id}
                    onChange={(event) => {
                      const status = event.target.value;
                      const matchedStatus = statuses.find((option) => option.value === status)?.value;
                      if (matchedStatus) {
                        void updateInquiry(item.id, { status: matchedStatus });
                      }
                    }}
                    className="rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs text-white"
                  >
                    {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-neutral-200">
                {item.nickname && <p>닉네임: {item.nickname}</p>}
                {item.royaleApiProfileUrl && <a className="text-cyan-300 underline" href={item.royaleApiProfileUrl} target="_blank" rel="noreferrer">RoyaleAPI 프로필 열기</a>}
                {item.clanName && <p>클랜명: {item.clanName}</p>}
                {item.royaleApiClanUrl && <a className="text-cyan-300 underline" href={item.royaleApiClanUrl} target="_blank" rel="noreferrer">RoyaleAPI 클랜 열기</a>}
                {item.participantProposal && <p>참가 인원: {item.participantProposal}</p>}
                {item.battleFormat && <p>대항전 방식: {item.battleFormat}</p>}
                {item.subject && <h2 className="font-bold text-white">{item.subject}</h2>}
                {item.content && <p className="whitespace-pre-wrap leading-relaxed">{item.content}</p>}
                {item.contact && <p className="rounded-lg border border-amber-500/20 bg-amber-950/10 px-3 py-2 text-xs text-amber-200">연락처: {item.contact}</p>}
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <label className="grid gap-1 text-xs text-neutral-400">
                  관리자 답변
                  <textarea
                    rows={3}
                    maxLength={5000}
                    value={replies[item.id] ?? item.adminReply ?? ''}
                    onChange={(event) => setReplies((current) => ({ ...current, [item.id]: event.target.value }))}
                    className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
                  />
                </label>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void updateInquiry(item.id, { adminReply: replies[item.id] ?? item.adminReply ?? '' })}
                    className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 disabled:opacity-50"
                  >
                    {busyId === item.id ? '저장 중...' : '답변 저장'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
