import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getInquiryIdentity,
  getInquirySessionToken,
  hashInquiryPassword,
  hashInquirySessionToken,
} from '@/lib/inquiries/server';

type InquiryRow = {
  id: string;
  request_type: 'membership' | 'clan_battle' | 'admin_contact';
  created_by: string | null;
  is_public: boolean;
  nickname: string | null;
  royaleapi_profile_url: string | null;
  clan_name: string | null;
  royaleapi_clan_url: string | null;
  participant_proposal: string | null;
  battle_format: string | null;
  subject: string | null;
  inquiry_content: string | null;
  contact: string | null;
  password_hash: string | null;
  status: 'received' | 'reviewing' | 'approved' | 'rejected';
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
};

const validStatuses: readonly InquiryRow['status'][] = ['received', 'reviewing', 'approved', 'rejected'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInquiryStatus(value: unknown): value is InquiryRow['status'] {
  return validStatuses.some((status) => status === value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function readText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text && text.length <= maxLength ? text : null;
}

function isRoyaleApiUrl(value: string, segment: 'player' | 'clan') {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && (url.hostname === 'royaleapi.com' || url.hostname === 'www.royaleapi.com')
      && url.pathname.startsWith(`/${segment}/`)
      && url.pathname.length > segment.length + 2;
  } catch {
    return false;
  }
}

function serializeInquiry(
  row: InquiryRow,
  options: { canViewBody: boolean; canViewContact: boolean; isAdmin: boolean },
) {
  const bodyVisible = options.canViewBody;
  return {
    id: row.id,
    requestType: row.request_type,
    isPublic: row.is_public,
    isLocked: Boolean(row.password_hash) && !bodyVisible,
    nickname: bodyVisible ? row.nickname : null,
    royaleApiProfileUrl: bodyVisible ? row.royaleapi_profile_url : null,
    clanName: bodyVisible ? row.clan_name : null,
    royaleApiClanUrl: bodyVisible ? row.royaleapi_clan_url : null,
    participantProposal: bodyVisible ? row.participant_proposal : null,
    battleFormat: bodyVisible ? row.battle_format : null,
    subject: bodyVisible ? row.subject : null,
    content: bodyVisible ? row.inquiry_content : null,
    contact: options.canViewContact ? row.contact : null,
    status: row.status,
    adminReply: bodyVisible ? row.admin_reply : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(options.isAdmin ? { createdBy: row.created_by } : {}),
  };
}

export async function GET(request: Request) {
  try {
    const identity = await getInquiryIdentity();
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin') === 'true';
    const mineOnly = searchParams.get('mine') === 'true';

    if (adminView && !identity.isAdmin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }
    if (mineOnly && !identity.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    let query = adminClient
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (adminView) {
      // Admins may review every inquiry, including private and password-protected records.
    } else if (mineOnly && identity.user) {
      query = query.eq('created_by', identity.user.id);
    } else if (identity.user) {
      query = query.or(`is_public.eq.true,created_by.eq.${identity.user.id}`);
    } else {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;
    if (error) {
      console.error('문의 목록 조회 실패:', error);
      return NextResponse.json({ error: '문의 목록을 불러오지 못했습니다.' }, { status: 500 });
    }

    const token = await getInquirySessionToken();
    const sessionHash = token ? hashInquirySessionToken(token) : null;
    const protectedIds = (data || [])
      .filter((row: InquiryRow) => row.password_hash)
      .map((row: InquiryRow) => row.id);
    const grants = sessionHash && protectedIds.length > 0
      ? await adminClient
          .from('inquiry_access_grants')
          .select('inquiry_id')
          .eq('session_hash', sessionHash)
          .in('inquiry_id', protectedIds)
          .gt('expires_at', new Date().toISOString())
      : { data: [], error: null };

    if (grants.error) {
      console.error('문의 열람 권한 조회 실패:', grants.error);
      return NextResponse.json({ error: '문의 열람 권한을 확인하지 못했습니다.' }, { status: 500 });
    }

    const grantedIds = new Set((grants.data || []).map((grant) => grant.inquiry_id));
    const inquiries = (data || []).map((row: InquiryRow) => {
      const isOwner = Boolean(identity.user && row.created_by === identity.user.id);
      const hasPasswordGrant = grantedIds.has(row.id);
      const canViewBody = adminView || isOwner || !row.password_hash || hasPasswordGrant;
      return serializeInquiry(row, {
        canViewBody,
        canViewContact: adminView || isOwner || hasPasswordGrant,
        isAdmin: adminView,
      });
    });

    const response = NextResponse.json({ inquiries });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('문의 목록 API 오류:', error);
    return NextResponse.json({ error: '문의 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await getInquiryIdentity();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '요청 데이터 형식이 올바르지 않습니다.' }, { status: 400 });
    }
    if (!isRecord(body)) {
      return NextResponse.json({ error: '요청 데이터 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    const requestType = body.requestType;
    if (
      requestType !== 'membership'
      && requestType !== 'clan_battle'
      && requestType !== 'admin_contact'
    ) {
      return NextResponse.json({ error: '문의 유형이 올바르지 않습니다.' }, { status: 400 });
    }

    const contact = body.contact === undefined || body.contact === ''
      ? null
      : readText(body.contact, 300);
    if (body.contact !== undefined && body.contact !== '' && !contact) {
      return NextResponse.json({ error: '연락처는 300자 이내로 입력해 주세요.' }, { status: 400 });
    }

    let row: Record<string, unknown> = {
      request_type: requestType,
      created_by: identity.user?.id ?? null,
      is_public: !identity.user,
      contact,
    };

    if (requestType === 'membership') {
      const nickname = readText(body.nickname, 80);
      const profileUrl = readText(body.royaleApiProfileUrl, 500);
      const content = readText(body.content, 5000);
      if (!nickname || !profileUrl || !content || !isRoyaleApiUrl(profileUrl, 'player')) {
        return NextResponse.json({
          error: '닉네임, RoyaleAPI 플레이어 링크와 문의 내용을 올바르게 입력해 주세요.',
        }, { status: 400 });
      }
      row = {
        ...row,
        nickname,
        royaleapi_profile_url: profileUrl,
        inquiry_content: content,
      };
    } else if (requestType === 'clan_battle') {
      const clanName = readText(body.clanName, 100);
      const clanUrl = readText(body.royaleApiClanUrl, 500);
      const participantProposal = readText(body.participantProposal, 300);
      const battleFormat = readText(body.battleFormat, 1000);
      if (
        !clanName
        || !clanUrl
        || !participantProposal
        || !battleFormat
        || !isRoyaleApiUrl(clanUrl, 'clan')
      ) {
        return NextResponse.json({
          error: '클랜명, RoyaleAPI 클랜 링크, 인원 및 대항전 방식을 입력해 주세요.',
        }, { status: 400 });
      }
      row = {
        ...row,
        clan_name: clanName,
        royaleapi_clan_url: clanUrl,
        participant_proposal: participantProposal,
        battle_format: battleFormat,
        inquiry_content: readText(body.content, 5000),
      };
    } else {
      const subject = readText(body.subject, 120);
      const content = readText(body.content, 5000);
      if (!subject || !content) {
        return NextResponse.json({ error: '제목과 문의 내용을 입력해 주세요.' }, { status: 400 });
      }
      row = { ...row, subject, inquiry_content: content };
    }

    if (!identity.user && body.password !== undefined && body.password !== '') {
      if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) {
        return NextResponse.json({ error: '열람 비밀번호는 8~128자로 입력해 주세요.' }, { status: 400 });
      }
      row.password_hash = await hashInquiryPassword(body.password);
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('inquiries')
      .insert(row)
      .select('*')
      .single();

    if (error) {
      console.error('문의 저장 실패:', error);
      return NextResponse.json({ error: '문의를 저장하지 못했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      inquiry: serializeInquiry(data, {
        canViewBody: true,
        canViewContact: true,
        isAdmin: false,
      }),
    }, { status: 201 });
  } catch (error) {
    console.error('문의 등록 API 오류:', error);
    return NextResponse.json({ error: '문의를 등록하지 못했습니다.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const identity = await getInquiryIdentity();
    if (!identity.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    if (!identity.isAdmin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '요청 데이터 형식이 올바르지 않습니다.' }, { status: 400 });
    }
    if (!isRecord(body)) {
      return NextResponse.json({ error: '요청 데이터 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    const id = readText(body.id, 36);
    const status = body.status;
    if (!id || !isUuid(id) || (status !== undefined && !isInquiryStatus(status))) {
      return NextResponse.json({ error: '문의 ID 또는 상태가 올바르지 않습니다.' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      reviewed_by: identity.user.id,
      updated_at: new Date().toISOString(),
    };
    if (status !== undefined) updateData.status = status;
    if (body.adminReply !== undefined) {
      if (typeof body.adminReply !== 'string' || body.adminReply.length > 5000) {
        return NextResponse.json({ error: '답변은 5000자 이내로 입력해 주세요.' }, { status: 400 });
      }
      updateData.admin_reply = body.adminReply.trim() || null;
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('inquiries')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('문의 상태 변경 실패:', error);
      return NextResponse.json({ error: '문의 상태를 변경하지 못했습니다.' }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: '문의를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      inquiry: serializeInquiry(data, {
        canViewBody: true,
        canViewContact: true,
        isAdmin: true,
      }),
    });
  } catch (error) {
    console.error('문의 관리 API 오류:', error);
    return NextResponse.json({ error: '문의를 처리하지 못했습니다.' }, { status: 500 });
  }
}
