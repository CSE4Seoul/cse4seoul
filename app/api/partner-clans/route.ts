import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getInquiryIdentity } from '@/lib/inquiries/server';

type PartnerClanRow = {
  id: string;
  name: string;
  royaleapi_url: string;
  collaboration_activities: string;
  created_at: string;
  updated_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text && text.length <= maxLength ? text : null;
}

function isRoyaleApiClanUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && (url.hostname === 'royaleapi.com' || url.hostname === 'www.royaleapi.com')
      && url.pathname.startsWith('/clan/')
      && url.pathname.length > '/clan/'.length;
  } catch {
    return false;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function readPartnerClan(body: Record<string, unknown>) {
  const name = readText(body.name, 100);
  const royaleApiUrl = readText(body.royaleApiUrl, 500);
  const collaborationActivities = readText(body.collaborationActivities, 5000);

  if (!name || !royaleApiUrl || !isRoyaleApiClanUrl(royaleApiUrl) || !collaborationActivities) {
    return null;
  }

  return {
    name,
    royaleapi_url: royaleApiUrl,
    collaboration_activities: collaborationActivities,
  };
}

function serializePartnerClan(row: PartnerClanRow) {
  return {
    id: row.id,
    name: row.name,
    royaleApiUrl: row.royaleapi_url,
    collaborationActivities: row.collaboration_activities,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  try {
    const identity = await getInquiryIdentity();
    if (!identity.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    if (!identity.isAdmin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('partner_clans')
      .select('id, name, royaleapi_url, collaboration_activities, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('협력 클랜 목록 조회 실패:', error);
      return NextResponse.json({ error: '협력 클랜 목록을 불러오지 못했습니다.' }, { status: 500 });
    }

    const response = NextResponse.json({ partnerClans: (data || []).map(serializePartnerClan) });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('협력 클랜 API 오류:', error);
    return NextResponse.json({ error: '협력 클랜 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const partnerClan = readPartnerClan(body);
    if (!partnerClan) {
      return NextResponse.json({
        error: '클랜명, RoyaleAPI 클랜 링크와 공동 활동 내용을 올바르게 입력해 주세요.',
      }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('partner_clans')
      .insert({ ...partnerClan, created_by: identity.user.id })
      .select('id, name, royaleapi_url, collaboration_activities, created_at, updated_at')
      .single();

    if (error) {
      console.error('협력 클랜 저장 실패:', error);
      return NextResponse.json({ error: '협력 클랜을 저장하지 못했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ partnerClan: serializePartnerClan(data) }, { status: 201 });
  } catch (error) {
    console.error('협력 클랜 등록 API 오류:', error);
    return NextResponse.json({ error: '협력 클랜을 등록하지 못했습니다.' }, { status: 500 });
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
    const partnerClan = readPartnerClan(body);
    if (!id || !isUuid(id) || !partnerClan) {
      return NextResponse.json({ error: '수정할 협력 클랜 정보를 올바르게 입력해 주세요.' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('partner_clans')
      .update({ ...partnerClan, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, royaleapi_url, collaboration_activities, created_at, updated_at')
      .maybeSingle();

    if (error) {
      console.error('협력 클랜 수정 실패:', error);
      return NextResponse.json({ error: '협력 클랜을 수정하지 못했습니다.' }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: '협력 클랜을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ partnerClan: serializePartnerClan(data) });
  } catch (error) {
    console.error('협력 클랜 수정 API 오류:', error);
    return NextResponse.json({ error: '협력 클랜을 수정하지 못했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
    if (!isRecord(body) || typeof body.id !== 'string' || !isUuid(body.id)) {
      return NextResponse.json({ error: '협력 클랜 ID가 올바르지 않습니다.' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('partner_clans')
      .delete()
      .eq('id', body.id)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('협력 클랜 삭제 실패:', error);
      return NextResponse.json({ error: '협력 클랜을 삭제하지 못했습니다.' }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: '협력 클랜을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('협력 클랜 삭제 API 오류:', error);
    return NextResponse.json({ error: '협력 클랜을 삭제하지 못했습니다.' }, { status: 500 });
  }
}
