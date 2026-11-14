'use client';

import { FormEvent, useState } from 'react';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default function AdminContactWidget({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const value = (name: string) => formData.get(name)?.toString() ?? '';
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'admin_contact',
          subject: value('subject'),
          content: value('content'),
          contact: value('contact'),
          password: value('password'),
        }),
      });
      const body: unknown = await response.json();
      if (!isRecord(body)) throw new Error('서버 응답 형식이 올바르지 않습니다.');
      if (!response.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : '관리자 문의를 접수하지 못했습니다.');
      }

      form.reset();
      setSuccessMessage(isLoggedIn
        ? '문의가 접수되었습니다. 답변과 상태 변경 알림은 대시보드에서 확인할 수 있습니다.'
        : '문의가 접수되었습니다. 비밀번호를 설정했다면 같은 세션에서 공개 문의 목록을 통해 열람할 수 있습니다.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '관리자 문의를 접수하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-neutral-950 to-black p-5 sm:p-7">
      <header className="mb-5">
        <p className="text-[10px] font-mono tracking-widest text-amber-300">CONTACT ADMINS</p>
        <h2 className="mt-1 text-xl font-black text-white">관리자에게 직접 문의</h2>
        <p className="mt-2 text-xs leading-relaxed text-neutral-400">
          접수된 문의는 모든 관리자에게 전달됩니다. 로그인 문의는 작성자와 관리자만 열람하며, 비로그인 문의는 기본 공개됩니다.
          비로그인 문의에 비밀번호를 설정하면 비밀번호를 아는 사람만 본문을 열람할 수 있습니다.
        </p>
      </header>

      <form onSubmit={submitInquiry} className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs text-neutral-300 sm:col-span-2">
          제목
          <input name="subject" required maxLength={120} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white" />
        </label>
        <label className="grid gap-1 text-xs text-neutral-300 sm:col-span-2">
          문의 내용
          <textarea name="content" required maxLength={5000} rows={4} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white" />
        </label>
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
          {errorMessage ? <p role="alert" className="text-xs text-red-300">{errorMessage}</p> : <span />}
          <button type="submit" disabled={isSubmitting} className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-50">
            {isSubmitting ? '접수 중...' : '관리자에게 문의 보내기'}
          </button>
        </div>
        {successMessage && <p role="status" className="text-xs text-emerald-300 sm:col-span-2">{successMessage}</p>}
      </form>
    </section>
  );
}
