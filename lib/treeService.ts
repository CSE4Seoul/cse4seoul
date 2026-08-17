// ==============================================================================
// 🌳 Tree & Mind-Map TypeScript Definitions & Service Helpers
// ==============================================================================

export type NodeCategory = 
  | 'academic'
  | 'dev'
  | 'finance'
  | 'life'
  | 'health'
  | 'project'
  | 'career'
  | 'study'
  | 'general';

export type NodeStatus = 'todo' | 'in_progress' | 'completed' | 'archived';

export interface NodeLink {
  id: string;
  title: string;
  url: string;
}

export interface NodeMetadata {
  x?: number;
  y?: number;
  is_root?: boolean;
  links?: NodeLink[];
  notes?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  target_date?: string;
  [key: string]: any;
}

export interface TreeNode {
  id: string;
  user_id?: string | null;
  parent_id: string | null;
  title: string;
  description?: string | null;
  category: NodeCategory | string;
  status: NodeStatus;
  order_index: number;
  is_expanded?: boolean;
  color_accent?: string;
  icon_name?: string;
  tags?: string[];
  metadata?: NodeMetadata;
  created_at?: string;
  updated_at?: string;
  children?: TreeNode[];
  depth?: number;
}

// 카테고리 시각 테마 설정
export const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  academic: { label: '학업/연구', color: '#38bdf8', bg: 'bg-sky-500/10', border: 'border-sky-500/30', icon: 'GraduationCap' },
  dev: { label: '개발/엔지니어링', color: '#818cf8', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', icon: 'Code2' },
  finance: { label: '금융/퀀트', color: '#34d399', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: 'TrendingUp' },
  project: { label: '프로젝트', color: '#c084fc', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: 'Rocket' },
  career: { label: '커리어', color: '#fb923c', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: 'Briefcase' },
  life: { label: '라이프/일상', color: '#f472b6', bg: 'bg-pink-500/10', border: 'border-pink-500/30', icon: 'Heart' },
  health: { label: '건강/운동', color: '#f87171', bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: 'Activity' },
  study: { label: '학습/스터디', color: '#facc15', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'BookOpen' },
  general: { label: '일반/기타', color: '#94a3b8', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: 'Folder' },
};

// 상태 테마 설정
export const STATUS_CONFIG: Record<NodeStatus, { label: string; color: string; badge: string; icon: string }> = {
  todo: { label: '할 일 (TODO)', color: '#94a3b8', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40', icon: 'Circle' },
  in_progress: { label: '진행 중 (IN PROGRESS)', color: '#38bdf8', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40', icon: 'Clock' },
  completed: { label: '완료 (COMPLETED)', color: '#34d399', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: 'CheckCircle2' },
  archived: { label: '보관됨 (ARCHIVED)', color: '#a855f7', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: 'Archive' },
};

// 초기 시드 데이터 (오프라인 / 로컬스토리지 fallback용)
export const INITIAL_TREE_DATA: TreeNode[] = [
  {
    id: 'root-me',
    parent_id: null,
    title: '조하민 (Me) - Master Knowledge & Goal Map',
    description: '컴퓨터공학, 고성능 풀스택 엔지니어링, 퀀트 금융 자산 관리 및 라이프스타일 종합 지식 트리',
    category: 'life',
    status: 'in_progress',
    order_index: 0,
    is_expanded: true,
    color_accent: '#06b6d4',
    icon_name: 'User',
    tags: ['Master', 'Hub', 'Goals'],
    metadata: {
      is_root: true,
      priority: 'high',
      links: [
        { id: 'l1', title: '포트폴리오 바로가기', url: 'https://hamin-portfolio.vercel.app/' },
        { id: 'l2', title: 'CSE4Seoul 클랜 홈', url: 'https://royaleapi.com/clan/RRG9U0C9' }
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Level 1 Branches
  {
    id: 'b-acad',
    parent_id: 'root-me',
    title: 'Academics & Career (학업 및 커리어)',
    description: '서울대/컴퓨터공학 전공 지식 습득, 시스템 아키텍처 및 핵심 개발 역량 극대화',
    category: 'academic',
    status: 'in_progress',
    order_index: 0,
    is_expanded: true,
    color_accent: '#38bdf8',
    icon_name: 'GraduationCap',
    tags: ['CS', 'Career'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'b-proj',
    parent_id: 'root-me',
    title: 'Personal Projects (개발 프로젝트)',
    description: '웹 플랫폼 제작, 고성능 C++/WASM 엔진, 실시간 암호화 통신망 구축',
    category: 'project',
    status: 'in_progress',
    order_index: 1,
    is_expanded: true,
    color_accent: '#c084fc',
    icon_name: 'Rocket',
    tags: ['Build', 'NextJS'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'b-fin',
    parent_id: 'root-me',
    title: 'Asset Management (자산 & 퀀트 분석)',
    description: '미국 지수/테크 ETF 포트폴리오 운용, 실시간 iNAV 괴리율 스캐너 및 자동 매크로 시그널',
    category: 'finance',
    status: 'in_progress',
    order_index: 2,
    is_expanded: true,
    color_accent: '#34d399',
    icon_name: 'TrendingUp',
    tags: ['ETF', 'Quant'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'b-life',
    parent_id: 'root-me',
    title: 'Life & Wellness (건강 & 커뮤니티)',
    description: '매일 웨이트/유산소 체력 루틴 유지 및 CSE4Seoul 정예 클랜 운영 관리',
    category: 'life',
    status: 'completed',
    order_index: 3,
    is_expanded: true,
    color_accent: '#f472b6',
    icon_name: 'Heart',
    tags: ['Health', 'Clan'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Level 2 - Academics Sub-nodes
  {
    id: 'sub-cs',
    parent_id: 'b-acad',
    title: 'Computer Science Foundations',
    description: '자료구조, 알고리즘 최적화, 운영체제 메모리 관리 및 분산 네트워크',
    category: 'academic',
    status: 'in_progress',
    order_index: 0,
    is_expanded: true,
    color_accent: '#38bdf8',
    icon_name: 'Cpu',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sub-fullstack',
    parent_id: 'b-acad',
    title: 'Modern Full-Stack Engineering',
    description: 'Next.js 16, React 19, TypeScript, Tailwind CSS, PostgreSQL, Supabase RLS',
    category: 'dev',
    status: 'completed',
    order_index: 1,
    is_expanded: true,
    color_accent: '#818cf8',
    icon_name: 'Code2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Level 3 - CS Sub-nodes
  {
    id: 'leaf-wasm',
    parent_id: 'sub-cs',
    title: 'C++ High-Performance Math Module',
    description: 'WASM & Web Worker 연동 실시간 금융 지표 연산 모듈',
    category: 'dev',
    status: 'completed',
    order_index: 0,
    color_accent: '#0284c7',
    icon_name: 'Terminal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'leaf-db',
    parent_id: 'sub-cs',
    title: 'PostgreSQL Recursive CTE & Indexing',
    description: '무한 계층 트리 구조 및 B-Tree 복합 인덱스 성능 최적화',
    category: 'academic',
    status: 'in_progress',
    order_index: 1,
    color_accent: '#0284c7',
    icon_name: 'Database',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Level 2 - Projects Sub-nodes
  {
    id: 'sub-cse4seoul',
    parent_id: 'b-proj',
    title: 'CSE4Seoul Community Platform',
    description: '클래시로얄 클랜 기반 게이머 & 개발자 허브 포털',
    category: 'project',
    status: 'completed',
    order_index: 0,
    is_expanded: true,
    color_accent: '#c084fc',
    icon_name: 'Globe',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sub-tree-engine',
    parent_id: 'b-proj',
    title: 'Interactive Mind-Map & Tree Studio',
    description: 'SVG 베지에 곡선 캔버스 및 반응형 재귀 트리 에디터 위젯',
    category: 'dev',
    status: 'in_progress',
    order_index: 1,
    is_expanded: true,
    color_accent: '#a855f7',
    icon_name: 'Network',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Level 2 - Finance Sub-nodes
  {
    id: 'sub-etf',
    parent_id: 'b-fin',
    title: 'US Tech ETF (QQQ / SOXX / SCHD)',
    description: '야간 선물 지표, 괴리율 및 실시간 추정 iNAV 모니터링 대시보드',
    category: 'finance',
    status: 'completed',
    order_index: 0,
    color_accent: '#34d399',
    icon_name: 'LineChart',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sub-signals',
    parent_id: 'b-fin',
    title: 'Automated Scraping & Signals',
    description: 'KRX 공시 및 실시간 시장 환율 동기화 백그라운드 크론잡',
    category: 'finance',
    status: 'in_progress',
    order_index: 1,
    color_accent: '#10b981',
    icon_name: 'Activity',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Level 2 - Life Sub-nodes
  {
    id: 'sub-workout',
    parent_id: 'b-life',
    title: 'Daily Fitness & Workout Routine',
    description: '3대 운동 스트렝스 증진 및 고강도 유산소 체력 관리',
    category: 'health',
    status: 'completed',
    order_index: 0,
    color_accent: '#f87171',
    icon_name: 'Activity',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sub-clan',
    parent_id: 'b-life',
    title: 'Clash Royale Clan Battles',
    description: '정예 클랜 트로피 54,200+ 유지 및 주간 클랜전 승률 68% 달성',
    category: 'life',
    status: 'completed',
    order_index: 1,
    color_accent: '#fb7185',
    icon_name: 'Swords',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Flat Node List를 Nested Tree 계층으로 변환하는 유틸리티
export function buildTreeHierarchy(nodes: TreeNode[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];

  // 깊은 복사 및 맵 생성
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      ...node,
      children: [],
      depth: 0,
      is_expanded: node.is_expanded !== undefined ? node.is_expanded : true,
    });
  });

  // 부모-자식 관계 연결
  nodes.forEach((node) => {
    const current = nodeMap.get(node.id);
    if (!current) return;

    if (node.parent_id && nodeMap.has(node.parent_id)) {
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        current.depth = (parent.depth || 0) + 1;
        parent.children = parent.children || [];
        parent.children.push(current);
      }
    } else {
      current.depth = 0;
      rootNodes.push(current);
    }
  });

  // sibling order_index 정렬
  const sortRecursive = (list: TreeNode[]) => {
    list.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    list.forEach((child) => {
      if (child.children && child.children.length > 0) {
        sortRecursive(child.children);
      }
    });
  };

  sortRecursive(rootNodes);
  return rootNodes;
}

// Tree를 Flat Node 배열로 평탄화하는 유틸리티
export function flattenTree(treeNodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];

  const traverse = (node: TreeNode, depth = 0) => {
    const { children, ...rest } = node;
    result.push({ ...rest, depth });
    if (children && children.length > 0) {
      children.forEach((child) => traverse(child, depth + 1));
    }
  };

  treeNodes.forEach((root) => traverse(root, 0));
  return result;
}

// 노드 및 하위 트리의 진행률 및 통계 계산
export function calculateNodeStats(node: TreeNode): { total: number; completed: number; inProgress: number; percentage: number } {
  let total = 0;
  let completed = 0;
  let inProgress = 0;

  const countRecursive = (curr: TreeNode) => {
    total += 1;
    if (curr.status === 'completed') completed += 1;
    if (curr.status === 'in_progress') inProgress += 1;
    if (curr.children && curr.children.length > 0) {
      curr.children.forEach(countRecursive);
    }
  };

  if (node.children && node.children.length > 0) {
    node.children.forEach(countRecursive);
  } else {
    // 자식이 없으면 본인 상태 기준
    total = 1;
    if (node.status === 'completed') completed = 1;
    if (node.status === 'in_progress') inProgress = 1;
  }

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, inProgress, percentage };
}

// 클라이언트 UUID 생성
export function generateClientUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'node-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}
