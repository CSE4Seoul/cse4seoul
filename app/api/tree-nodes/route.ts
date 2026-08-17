import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { INITIAL_TREE_DATA } from '@/lib/treeService';

// GET: 노드 목록 조회 (계층 평탄화 목록)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Supabase 쿼리 시도
    let query = supabase
      .from('tree_nodes')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (user) {
      // 본인 노드 또는 공용 템플릿(user_id IS NULL)
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    } else {
      query = query.is('user_id', null);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // DB에 데이터가 없거나 테이블 미생성 시 초기 기본 데이터 반환
      return NextResponse.json({
        success: true,
        data: INITIAL_TREE_DATA,
        source: 'fallback'
      });
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'supabase'
    });
  } catch (error: any) {
    console.warn('[Tree API] GET fallback due to error:', error?.message);
    return NextResponse.json({
      success: true,
      data: INITIAL_TREE_DATA,
      source: 'fallback'
    });
  }
}

// POST: 신규 노드 추가
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const body = await req.json();

    const newNode = {
      title: body.title || 'New Node',
      description: body.description || '',
      category: body.category || 'general',
      status: body.status || 'todo',
      parent_id: body.parent_id || null,
      order_index: body.order_index ?? 0,
      is_expanded: body.is_expanded ?? true,
      color_accent: body.color_accent || '#06b6d4',
      icon_name: body.icon_name || 'Folder',
      tags: body.tags || [],
      metadata: body.metadata || {},
      user_id: user ? user.id : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tree_nodes')
      .insert([newNode])
      .select()
      .single();

    if (error) {
      // DB 에러 시 클라이언트에서 로컬 생성 처리할 수 있도록 echo 반환
      return NextResponse.json({
        success: true,
        data: { ...newNode, id: body.id || `local-${Date.now()}` },
        source: 'local_echo'
      });
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'supabase'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to create tree node'
    }, { status: 500 });
  }
}

// PUT: 노드 수정 (단일 노드 또는 일괄 업데이트)
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const body = await req.json();

    if (Array.isArray(body)) {
      // 일괄 업데이트 (순서 변경 등)
      const updates = body.map((node) => ({
        ...node,
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('tree_nodes')
        .upsert(updates)
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    const { id, ...updateFields } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Node ID is required' }, { status: 400 });
    }

    let updateQuery = supabase
      .from('tree_nodes')
      .update({
        ...updateFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (user) {
      updateQuery = updateQuery.or(`user_id.eq.${user.id},user_id.is.null`);
    }

    const { data, error } = await updateQuery.select().single();

    if (error) {
      return NextResponse.json({
        success: true,
        data: body,
        source: 'local_echo'
      });
    }

    return NextResponse.json({ success: true, data, source: 'supabase' });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to update tree node'
    }, { status: 500 });
  }
}

// DELETE: 노드 삭제 (ON DELETE CASCADE로 하위 자식 노드 자동 연쇄 삭제)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Node ID is required' }, { status: 400 });
    }

    let deleteQuery = supabase.from('tree_nodes').delete().eq('id', id);
    if (user) {
      deleteQuery = deleteQuery.or(`user_id.eq.${user.id},user_id.is.null`);
    }

    const { error } = await deleteQuery;

    if (error) {
      return NextResponse.json({ success: true, id, source: 'local_echo' });
    }

    return NextResponse.json({ success: true, id, source: 'supabase' });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to delete tree node'
    }, { status: 500 });
  }
}
