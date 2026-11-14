'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  inquiry_id: string | null;
  event_type: 'new_inquiry' | 'inquiry_update';
  message: string;
  created_at: string;
  read_at: string | null;
}

interface MyInquiry {
  id: string;
  requestType: 'membership' | 'clan_battle' | 'admin_contact';
  subject: string | null;
  content: string | null;
  status: 'received' | 'reviewing' | 'approved' | 'rejected';
  adminReply: string | null;
  createdAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readJson(response: Response) {
  const body: unknown = await response.json();
  if (!isRecord(body)) throw new Error('서버 응답 형식이 올바르지 않습니다.');
  return body;
}

const requestTypeLabels = {
  membership: '가입 문의',
  clan_battle: '클랜 대항전',
  admin_contact: '관리자 문의',
};

const inquiryStatusLabels = {
  received: '접수',
  reviewing: '검토 중',
  approved: '승인',
  rejected: '거절',
};

export default function InquiryDashboard({ isAdmin }: { isAdmin: boolean }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [inquiries, setInquiries] = useState<MyInquiry[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [notificationResponse, inquiryResponse] = await Promise.all([
        fetch('/api/notifications', { cache: 'no-store' }),
        fetch('/api/inquiries?mine=true', { cache: 'no-store' }),
      ]);
      const [notificationBody, inquiryBody] = await Promise.all([
        readJson(notificationResponse),
        readJson(inquiryResponse),
      ]);
      if (!notificationResponse.ok || !inquiryResponse.ok) {
        const message = notificationBody.error ?? inquiryBody.error;
        throw new Error(typeof message === 'string' ? message : '알림을 불러오지 못했습니다.');
      }

      setNotifications(Array.isArray(notificationBody.notifications)
        ? notificationBody.notifications.filter(isNotification)
        : []);
      setInquiries(Array.isArray(inquiryBody.inquiries)
        ? inquiryBody.inquiries.filter(isMyInquiry)
        : []);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '알림을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const markRead = async (id?: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id } : {}),
      });
      const body = await readJson(response);
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : '알림을 읽음 처리하지 못했습니다.');
      const now = new Date().toISOString();
      setNotifications((current) => current.map((item) => (!id || item.id === id) ? { ...item, read_at: now } : item));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '알림을 읽음 처리하지 못했습니다.');
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono tracking-widest text-cyan-300">INBOX</p>
            <h2 className="mt-1 text-lg font-bold text-white">개인 알림 <span className="text-sm text-cyan-300">({unreadCount} 미확인)</span></h2>
          </div>
          <button type="button" onClick={() => void markRead()} disabled={unreadCount === 0} className="text-[11px] text-neutral-400 hover:text-white disabled:opacity-40">
            모두 읽음
          </button>
        </div>

        {errorMessage && <p role="alert" className="mt-3 text-xs text-red-300">{errorMessage}</p>}
        {isLoading ? (
          <p className="py-6 text-center text-xs text-neutral-500">알림을 불러오는 중...</p>
        ) : notifications.length === 0 ? (
          <p className="py-6 text-center text-xs text-neutral-500">새 알림이 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {notifications.slice(0, 8).map((notification) => (
              <li key={notification.id} className={`rounded-xl border p-3 ${notification.read_at ? 'border-white/5 bg-black/20' : 'border-cyan-500/20 bg-cyan-950/20'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-neutral-200">{notification.message}</p>
                  {!notification.read_at && (
                    <button type="button" onClick={() => void markRead(notification.id)} className="shrink-0 text-[10px] text-cyan-300 hover:text-white">
                      읽음
                    </button>
                  )}
                </div>
                <time className="mt-1 block text-[10px] text-neutral-500">{new Date(notification.created_at).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        )}

        {isAdmin && (
          <Link href="/admin/inquiries" className="mt-4 inline-flex rounded-lg bg-rose-700/80 px-3 py-2 text-xs font-bold text-white hover:bg-rose-600">
            관리자 문의함 열기
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono tracking-widest text-violet-300">MY REQUESTS</p>
            <h2 className="mt-1 text-lg font-bold text-white">내 문의</h2>
          </div>
          <Link href="/community/lobby" className="text-[11px] text-violet-300 hover:text-white">문의 작성</Link>
        </div>

        {isLoading ? (
          <p className="py-6 text-center text-xs text-neutral-500">문의 내역을 불러오는 중...</p>
        ) : inquiries.length === 0 ? (
          <p className="py-6 text-center text-xs text-neutral-500">작성한 문의가 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {inquiries.slice(0, 5).map((inquiry) => (
              <li key={inquiry.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-violet-200">{requestTypeLabels[inquiry.requestType]}</span>
                  <span className="text-[10px] text-neutral-400">{inquiryStatusLabels[inquiry.status]}</span>
                </div>
                {inquiry.subject && <p className="mt-2 text-xs font-semibold text-white">{inquiry.subject}</p>}
                {inquiry.content && <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-neutral-300">{inquiry.content}</p>}
                {inquiry.adminReply && <p className="mt-2 whitespace-pre-wrap border-l-2 border-cyan-500 pl-2 text-xs text-cyan-200">관리자 답변: {inquiry.adminReply}</p>}
                <time className="mt-2 block text-[10px] text-neutral-500">{new Date(inquiry.createdAt).toLocaleDateString()}</time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function isNotification(value: unknown): value is NotificationItem {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && typeof value.message === 'string'
    && typeof value.created_at === 'string'
    && (value.event_type === 'new_inquiry' || value.event_type === 'inquiry_update')
    && (value.inquiry_id === null || typeof value.inquiry_id === 'string')
    && (value.read_at === null || typeof value.read_at === 'string');
}

function isMyInquiry(value: unknown): value is MyInquiry {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && (value.requestType === 'membership' || value.requestType === 'clan_battle' || value.requestType === 'admin_contact')
    && (value.status === 'received' || value.status === 'reviewing' || value.status === 'approved' || value.status === 'rejected')
    && typeof value.createdAt === 'string';
}
