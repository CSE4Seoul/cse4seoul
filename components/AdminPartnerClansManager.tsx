'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { PartnerClan } from '@/components/PartnerClansDirectory';

type PartnerClanForm = Omit<PartnerClan, 'id'>;

const emptyForm: PartnerClanForm = {
  name: '',
  royaleApiUrl: '',
  collaborationActivities: '',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPartnerClan(value: unknown): value is PartnerClan {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.royaleApiUrl === 'string'
    && typeof value.collaborationActivities === 'string';
}

async function readJson(response: Response) {
  const body: unknown = await response.json();
  if (!isRecord(body)) throw new Error('서버 응답 형식이 올바르지 않습니다.');
  return body;
}

export default function AdminPartnerClansManager() {
  const [partnerClans, setPartnerClans] = useState<PartnerClan[]>([]);
  const [form, setForm] = useState<PartnerClanForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadPartnerClans = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/partner-clans', { cache: 'no-store' });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : '협력 클랜 목록을 불러오지 못했습니다.');
      }
      const rows = Array.isArray(body.partnerClans) ? body.partnerClans.filter(isPartnerClan) : [];
      setPartnerClans(rows);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '협력 클랜 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPartnerClans();
  }, [loadPartnerClans]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/partner-clans', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...(editingId ? { id: editingId } : {}) }),
      });
      const body = await readJson(response);
      if (!response.ok || !isPartnerClan(body.partnerClan)) {
        throw new Error(typeof body.error === 'string' ? body.error : '협력 클랜을 저장하지 못했습니다.');
      }

      const savedClan = body.partnerClan;
      setPartnerClans((current) => editingId
        ? current.map((clan) => clan.id === savedClan.id ? savedClan : clan)
        : [savedClan, ...current]);
      resetForm();
      setSuccessMessage(editingId ? '협력 클랜 정보를 수정했습니다.' : '협력 클랜을 등록했습니다.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '협력 클랜을 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const editClan = (clan: PartnerClan) => {
    setEditingId(clan.id);
    setForm({
      name: clan.name,
      royaleApiUrl: clan.royaleApiUrl,
      collaborationActivities: clan.collaborationActivities,
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const deleteClan = async (clan: PartnerClan) => {
    if (!window.confirm(`"${clan.name}" 협력 클랜을 삭제할까요?`)) return;
    setBusyId(clan.id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/partner-clans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clan.id }),
      });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : '협력 클랜을 삭제하지 못했습니다.');
      }

      setPartnerClans((current) => current.filter((item) => item.id !== clan.id));
      if (editingId === clan.id) resetForm();
      setSuccessMessage('협력 클랜을 삭제했습니다.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '협력 클랜을 삭제하지 못했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <p className="text-[10px] font-mono tracking-widest text-emerald-300">PARTNER CLANS</p>
        <h1 className="mt-1 text-2xl font-black text-white">협력 클랜 관리</h1>
        <p className="mt-2 text-xs text-neutral-400">등록한 협력 클랜은 공개 협력 클랜 메뉴에 표시됩니다.</p>
      </header>

      {errorMessage && <p role="alert" className="text-sm text-red-300">{errorMessage}</p>}
      {successMessage && <p role="status" className="text-sm text-emerald-300">{successMessage}</p>}

      <form onSubmit={submitForm} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-bold text-white">{editingId ? '협력 클랜 수정' : '협력 클랜 추가'}</h2>
        <label className="grid gap-1.5 text-xs text-neutral-300">
          클랜 이름
          <input
            required
            maxLength={100}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white"
          />
        </label>
        <label className="grid gap-1.5 text-xs text-neutral-300">
          RoyaleAPI 클랜 주소
          <input
            required
            type="url"
            maxLength={500}
            placeholder="https://royaleapi.com/clan/..."
            value={form.royaleApiUrl}
            onChange={(event) => setForm((current) => ({ ...current, royaleApiUrl: event.target.value }))}
            className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white"
          />
        </label>
        <label className="grid gap-1.5 text-xs text-neutral-300">
          함께한 활동
          <textarea
            required
            maxLength={5000}
            rows={4}
            placeholder="대항전, 친선전, 공동 이벤트 등 함께한 활동을 기록해 주세요."
            value={form.collaborationActivities}
            onChange={(event) => setForm((current) => ({ ...current, collaborationActivities: event.target.value }))}
            className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-white"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : editingId ? '수정 저장' : '협력 클랜 등록'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs text-neutral-300 hover:bg-white/5">
              취소
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white">등록된 협력 클랜</h2>
        {isLoading ? (
          <p className="py-8 text-center text-xs text-neutral-500">목록을 불러오는 중...</p>
        ) : partnerClans.length === 0 ? (
          <p className="rounded-xl border border-white/10 py-8 text-center text-xs text-neutral-500">등록된 협력 클랜이 없습니다.</p>
        ) : (
          partnerClans.map((clan) => (
            <article key={clan.id} className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white">{clan.name}</h3>
                <a href={clan.royaleApiUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all text-xs text-emerald-300 underline">
                  {clan.royaleApiUrl}
                </a>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-neutral-400">{clan.collaborationActivities}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => editClan(clan)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-neutral-200 hover:bg-white/5">
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => void deleteClan(clan)}
                  disabled={busyId === clan.id}
                  className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 hover:bg-red-950/30 disabled:opacity-50"
                >
                  {busyId === clan.id ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
