-- ==============================================================================
-- 🌳 CSE4Seoul Interactive Tree Nodes & Mind-Map Schema (PostgreSQL / Supabase)
-- Migration: 019_create_tree_nodes_table.sql
-- ==============================================================================

-- 1. tree_nodes 테이블 생성 (무한 깊이의 계층형 트리 및 마인드맵 노드 구조)
CREATE TABLE IF NOT EXISTS public.tree_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.tree_nodes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general' NOT NULL, -- academic, dev, finance, life, health, project, career, general
    status VARCHAR(50) DEFAULT 'todo' NOT NULL,       -- todo, in_progress, completed, archived
    order_index INTEGER DEFAULT 0 NOT NULL,
    is_expanded BOOLEAN DEFAULT TRUE NOT NULL,
    color_accent VARCHAR(30) DEFAULT '#06b6d4',
    icon_name VARCHAR(50) DEFAULT 'Folder',
    tags TEXT[] DEFAULT '{}'::TEXT[],
    metadata JSONB DEFAULT '{}'::JSONB,              -- 링크(urls), 캔버스 좌표(x, y), 커스텀 속성 등
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 외래키 및 성능 최적화 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tree_nodes_parent_id ON public.tree_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_tree_nodes_user_id ON public.tree_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_tree_nodes_category ON public.tree_nodes(category);
CREATE INDEX IF NOT EXISTS idx_tree_nodes_status ON public.tree_nodes(status);
CREATE INDEX IF NOT EXISTS idx_tree_nodes_parent_order ON public.tree_nodes(parent_id, order_index);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE public.tree_nodes ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 정의
-- 본인 소유의 노드이거나, 공용/기본 템플릿(user_id IS NULL)인 경우 조회 가능
DROP POLICY IF EXISTS "Users can select own or public tree nodes" ON public.tree_nodes;
CREATE POLICY "Users can select own or public tree nodes"
ON public.tree_nodes FOR SELECT
USING (
    user_id IS NULL OR 
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);

-- 본인 소유로 노드 생성
DROP POLICY IF EXISTS "Users can insert their own tree nodes" ON public.tree_nodes;
CREATE POLICY "Users can insert their own tree nodes"
ON public.tree_nodes FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR user_id IS NULL)
);

-- 본인 소유 노드 수정
DROP POLICY IF EXISTS "Users can update their own tree nodes" ON public.tree_nodes;
CREATE POLICY "Users can update their own tree nodes"
ON public.tree_nodes FOR UPDATE
USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (user_id IS NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)))
)
WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (user_id IS NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)))
);

-- 본인 소유 노드 삭제 (ON DELETE CASCADE로 하위 자식 노드 자동 연쇄 삭제)
DROP POLICY IF EXISTS "Users can delete their own tree nodes" ON public.tree_nodes;
CREATE POLICY "Users can delete their own tree nodes"
ON public.tree_nodes FOR DELETE
USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (user_id IS NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)))
);

-- 5. updated_at 자동 갱신 트리거 설정
CREATE OR REPLACE FUNCTION public.handle_tree_nodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_tree_nodes ON public.tree_nodes;
CREATE TRIGGER set_updated_at_tree_nodes
    BEFORE UPDATE ON public.tree_nodes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_tree_nodes_updated_at();

-- 6. 재귀 CTE (Common Table Expression) 뷰 생성
-- 루트 노드(parent_id IS NULL)부터 자식 노드까지의 depth, 계층 경로(path), 자식 개수를 계산하여 반환
CREATE OR REPLACE VIEW public.v_tree_hierarchy AS
WITH RECURSIVE tree_cte AS (
    -- Anchor member: 루트 노드들 (parent_id IS NULL)
    SELECT 
        id,
        user_id,
        parent_id,
        title,
        description,
        category,
        status,
        order_index,
        is_expanded,
        color_accent,
        icon_name,
        tags,
        metadata,
        created_at,
        updated_at,
        0 AS depth,
        ARRAY[id] AS path,
        ARRAY[title::TEXT] AS path_names,
        id AS root_id
    FROM public.tree_nodes
    WHERE parent_id IS NULL

    UNION ALL

    -- Recursive member: 자식 노드 순회
    SELECT 
        c.id,
        c.user_id,
        c.parent_id,
        c.title,
        c.description,
        c.category,
        c.status,
        c.order_index,
        c.is_expanded,
        c.color_accent,
        c.icon_name,
        c.tags,
        c.metadata,
        c.created_at,
        c.updated_at,
        p.depth + 1 AS depth,
        p.path || c.id AS path,
        p.path_names || c.title::TEXT AS path_names,
        p.root_id
    FROM public.tree_nodes c
    INNER JOIN tree_cte p ON c.parent_id = p.id
)
SELECT 
    t.*,
    (SELECT COUNT(*) FROM public.tree_nodes ch WHERE ch.parent_id = t.id) AS children_count
FROM tree_cte t
ORDER BY t.depth ASC, t.order_index ASC, t.created_at ASC;

-- 7. 특정 루트 노드 하위의 전체 트리를 JSON 트리 형태로 반환하는 재귀 함수
CREATE OR REPLACE FUNCTION public.get_tree_as_json(p_root_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
WITH RECURSIVE node_tree AS (
    SELECT 
        id,
        parent_id,
        title,
        description,
        category,
        status,
        order_index,
        is_expanded,
        color_accent,
        icon_name,
        tags,
        metadata,
        created_at,
        updated_at
    FROM public.tree_nodes
    WHERE (p_root_id IS NULL AND parent_id IS NULL) OR (p_root_id IS NOT NULL AND id = p_root_id)

    UNION ALL

    SELECT 
        c.id,
        c.parent_id,
        c.title,
        c.description,
        c.category,
        c.status,
        c.order_index,
        c.is_expanded,
        c.color_accent,
        c.icon_name,
        c.tags,
        c.metadata,
        c.created_at,
        c.updated_at
    FROM public.tree_nodes c
    INNER JOIN node_tree p ON c.parent_id = p.id
)
SELECT jsonb_agg(to_jsonb(node_tree)) FROM node_tree;
$$ LANGUAGE sql STABLE;

-- 8. 샘플 시드 데이터 (Sample INSERT script: 'Me' 루트 및 다계층 서브 카테고리)
DO $$
DECLARE
    v_root_id UUID := gen_random_uuid();
    
    -- Level 1 Parents
    v_acad_id UUID := gen_random_uuid();
    v_proj_id UUID := gen_random_uuid();
    v_fin_id UUID := gen_random_uuid();
    v_life_id UUID := gen_random_uuid();
    
    -- Level 2 Branches
    v_cs_id UUID := gen_random_uuid();
    v_fullstack_id UUID := gen_random_uuid();
    v_platform_id UUID := gen_random_uuid();
    v_etf_id UUID := gen_random_uuid();
BEGIN
    -- 만약 기존에 데이터가 없다면 샘플 데이터 주입
    IF NOT EXISTS (SELECT 1 FROM public.tree_nodes LIMIT 1) THEN
        -- [Level 0] Root Node: '조하민 (Me)'
        INSERT INTO public.tree_nodes (id, parent_id, title, description, category, status, order_index, color_accent, icon_name, metadata)
        VALUES (
            v_root_id,
            NULL,
            '조하민 (Me) - Master Mind Map',
            '컴퓨터공학 학업, 풀스택 개발, 퀀트/금융 자산 관리 및 라이프스타일 종합 지식 트리',
            'life',
            'in_progress',
            0,
            '#06b6d4',
            'User',
            '{"x": 0, "y": 0, "is_root": true}'::jsonb
        );

        -- [Level 1] 주요 카테고리 노드들
        INSERT INTO public.tree_nodes (id, parent_id, title, description, category, status, order_index, color_accent, icon_name)
        VALUES 
            (v_acad_id, v_root_id, 'Academics & Career', '컴퓨터 공학 및 시스템 아키텍처 역량 강화', 'academic', 'in_progress', 0, '#38bdf8', 'GraduationCap'),
            (v_proj_id, v_root_id, 'Personal Projects', '웹 플랫폼 및 고성능 분석 엔진 제작', 'project', 'in_progress', 1, '#a855f7', 'Rocket'),
            (v_fin_id, v_root_id, 'Asset Management', '미국 ETF 포트폴리오 및 퀀트 신호 분석', 'finance', 'in_progress', 2, '#10b981', 'TrendingUp'),
            (v_life_id, v_root_id, 'Life & Wellness', '건강 관리, 체력 증진 및 클랜 커뮤니티 운영', 'life', 'completed', 3, '#ec4899', 'Heart');

        -- [Level 2] Academics & Career 하위 노드
        INSERT INTO public.tree_nodes (id, parent_id, title, description, category, status, order_index, color_accent, icon_name)
        VALUES 
            (v_cs_id, v_acad_id, 'Computer Science Foundations', '자료구조, 알고리즘, 운영체제, 네트워크 심화', 'academic', 'in_progress', 0, '#38bdf8', 'Cpu'),
            (v_fullstack_id, v_acad_id, 'Modern Full-Stack Engineering', 'Next.js 16, React 19, TypeScript & WebAssembly', 'dev', 'completed', 1, '#6366f1', 'Code2');

        -- [Level 3] CS Foundations 하위 노드
        INSERT INTO public.tree_nodes (parent_id, title, description, category, status, order_index, color_accent, icon_name)
        VALUES 
            (v_cs_id, 'C++ High-Performance Math Engine', 'WASM 및 Web Worker 연동 고속 백테스팅 모듈', 'dev', 'completed', 0, '#0284c7', 'Terminal'),
            (v_cs_id, 'Distributed Database & Indexing', 'PostgreSQL B-Tree & Recursive CTE 최적화', 'academic', 'in_progress', 1, '#0284c7', 'Database');

        -- [Level 2] Personal Projects 하위 노드
        INSERT INTO public.tree_nodes (id, parent_id, title, description, category, status, order_index, color_accent, icon_name)
        VALUES 
            (v_platform_id, v_proj_id, 'CSE4Seoul Platform', '클래시로얄 클랜 기반 개발자 커뮤니티 포털', 'project', 'completed', 0, '#a855f7', 'Globe'),
            (gen_random_uuid(), v_proj_id, 'Real-time Chat & E2EE', 'AES-256 종단간 암호화 및 24시간 자동 파기 시스템', 'dev', 'completed', 1, '#8b5cf6', 'ShieldCheck'),
            (gen_random_uuid(), v_proj_id, 'Interactive Mind-Map Tree Studio', '무한 뎁스 캔버스 및 동적 그래프 시각화 위젯', 'dev', 'in_progress', 2, '#c084fc', 'Network');

        -- [Level 2] Asset Management 하위 노드
        INSERT INTO public.tree_nodes (id, parent_id, title, description, category, status, order_index, color_accent, icon_name)
        VALUES 
            (v_etf_id, v_fin_id, 'US Tech ETF (QQQ / SOXX / SCHD)', '실시간 iNAV 추정 및 괴리율 모니터링', 'finance', 'completed', 0, '#10b981', 'LineChart'),
            (gen_random_uuid(), v_fin_id, 'Automated Scraper & KRX Sync', '환율 및 해외 지수 실시간 동기화 데몬', 'finance', 'in_progress', 1, '#34d399', 'Activity');

        -- [Level 2] Life & Wellness 하위 노드
        INSERT INTO public.tree_nodes (parent_id, title, description, category, status, order_index, color_accent, icon_name)
        VALUES 
            (v_life_id, 'Daily Workout Routine', '웨이트 트레이닝 및 유산소 운동 루틴 유지', 'health', 'completed', 0, '#f43f5e', 'Activity'),
            (v_life_id, 'Clash Royale Clan Operations', 'CSE4Seoul 정예 클랜 토너먼트 및 랭킹 관리', 'life', 'in_progress', 1, '#fb7185', 'Swords');
    END IF;
END $$;
