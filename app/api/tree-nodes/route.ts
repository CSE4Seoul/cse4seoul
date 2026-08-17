import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { INITIAL_TREE_DATA } from '@/lib/treeService';

// GET: 노드 목록 조회 (로그인 유저별 데이터 격리)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 1. 로그인 유저의 개인 트리 노드 조회
      const { data: userNodes, error: userError } = await supabase
        .from('tree_nodes')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (!userError && userNodes && userNodes.length > 0) {
        return NextResponse.json({
          success: true,
          data: userNodes,
          userId: user.id,
          source: 'supabase_user'
        });
      }

      // 2. 유저가 아직 생성한 노드가 없는 경우 기본 공용 템플릿 반환
      const { data: publicNodes } = await supabase
        .from('tree_nodes')
        .select('*')
        .is('user_id', null)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (publicNodes && publicNodes.length > 0) {
        return NextResponse.json({
          success: true,
          data: publicNodes,
          userId: user.id,
          source: 'supabase_template'
        });
      }
    } else {
      // 비로그인 게스트: 공용 기본 템플릿 조회
      const { data: guestNodes } = await supabase
        .from('tree_nodes')
        .select('*')
        .is('user_id', null)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (guestNodes && guestNodes.length > 0) {
        return NextResponse.json({
          success: true,
          data: guestNodes,
          userId: null,
          source: 'supabase_guest'
        });
      }
    }

    // DB에 데이터가 없거나 연결 전인 경우 초기 데이터 반환
    return NextResponse.json({
      success: true,
      data: INITIAL_TREE_DATA,
      userId: user ? user.id : null,
      source: 'fallback'
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
