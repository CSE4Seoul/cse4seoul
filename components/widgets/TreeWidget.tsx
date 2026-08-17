"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  FolderTree, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  ChevronDown, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  CheckCircle2, 
  Clock, 
  Circle, 
  Archive, 
  Search, 
  Filter, 
  Sparkles, 
  ExternalLink, 
  Link as LinkIcon, 
  Move, 
  Layers, 
  Download, 
  Upload, 
  X, 
  Check, 
  HelpCircle, 
  LayoutGrid, 
  ListTree, 
  ArrowUp, 
  ArrowDown, 
  CornerDownRight, 
  Flame, 
  Tag,
  Share2,
  GraduationCap,
  Code2,
  TrendingUp,
  Rocket,
  Briefcase,
  Heart,
  Activity,
  BookOpen,
  Folder,
  Cpu,
  Terminal,
  Database,
  Globe,
  ShieldCheck,
  Network,
  LineChart,
  Swords,
  User
} from 'lucide-react';
import { 
  TreeNode, 
  NodeCategory, 
  NodeStatus, 
  CATEGORY_CONFIG, 
  STATUS_CONFIG, 
  INITIAL_TREE_DATA, 
  buildTreeHierarchy, 
  flattenTree, 
  calculateNodeStats, 
  generateClientUUID 
} from '@/lib/treeService';
import { createClient } from '@/utils/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface TreeWidgetProps {
  initialData?: TreeNode[];
  onDataChange?: (nodes: TreeNode[]) => void;
  className?: string;
  isStandalone?: boolean;
}

// 아이콘 매핑 헬퍼
const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap,
  Code2,
  TrendingUp,
  Rocket,
  Briefcase,
  Heart,
  Activity,
  BookOpen,
  Folder,
  Cpu,
  Terminal,
  Database,
  Globe,
  ShieldCheck,
  Network,
  LineChart,
  Swords,
  User,
  GitBranch
};

export default function TreeWidget({
  initialData,
  onDataChange,
  className = "",
  isStandalone = false,
}: TreeWidgetProps) {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [isLoadingFromCloud, setIsLoadingFromCloud] = useState(false);

  // 1. 노드 원본 Flat 배열 상태
  const [flatNodes, setFlatNodes] = useState<TreeNode[]>(() => {
    return initialData && initialData.length > 0 ? initialData : INITIAL_TREE_DATA;
  });

  // 2. 뷰 모드 ('canvas' 마인드맵 캔버스 vs 'tree' 계층 아웃라인)
  const [viewMode, setViewMode] = useState<'canvas' | 'tree'>('canvas');

  // 3. 선택된 노드 (상세 서랍/사이드패널 열림)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('root-me');

  // 4. 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // 5. 캔버스 줌 & 팬 상태
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 6. 드래그 앤 드롭 노드 재부모화 (Reparenting) 상태
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTargetNodeId, setDropTargetNodeId] = useState<string | null>(null);

  // 7. 토스트 알림 메시지 상태
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // 유저 세션 및 클라우드 데이터 로드
  useEffect(() => {
    let isMounted = true;
    const initUserAndData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (isMounted) setCurrentUser(user);

        const storageKey = `cse4seoul_tree_nodes_${user?.id || 'guest'}`;
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            try {
              if (isMounted) setFlatNodes(JSON.parse(cached));
            } catch {}
          }
        }

        // 클라우드 API 호출
        setIsLoadingFromCloud(true);
        const res = await fetch('/api/tree-nodes');
        const json = await res.json();
        if (isMounted && json.success && json.data && json.data.length > 0) {
          setFlatNodes(json.data);
          if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, JSON.stringify(json.data));
          }
        }
      } catch (err) {
        console.warn('[TreeWidget] Cloud fetch fallback:', err);
      } finally {
        if (isMounted) setIsLoadingFromCloud(false);
      }
    };

    initUserAndData();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // 유저별 격리 로컬스토리지 자동 저장 & 상위 전달
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `cse4seoul_tree_nodes_${currentUser?.id || 'guest'}`;
      localStorage.setItem(storageKey, JSON.stringify(flatNodes));
    }
    if (onDataChange) {
      onDataChange(flatNodes);
    }
  }, [flatNodes, currentUser, onDataChange]);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // 계층형 트리 계산
  const hierarchicalTree = useMemo(() => {
    return buildTreeHierarchy(flatNodes);
  }, [flatNodes]);

  // 선택된 노드 객체
  const selectedNode = useMemo(() => {
    return flatNodes.find((n) => n.id === selectedNodeId) || null;
  }, [flatNodes, selectedNodeId]);

  // 선택된 노드의 부모
  const selectedNodeParent = useMemo(() => {
    if (!selectedNode || !selectedNode.parent_id) return null;
    return flatNodes.find((n) => n.id === selectedNode.parent_id) || null;
  }, [flatNodes, selectedNode]);

  // 선택된 노드의 자식 목록
  const selectedNodeChildren = useMemo(() => {
    if (!selectedNode) return [];
    return flatNodes.filter((n) => n.parent_id === selectedNode.id).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }, [flatNodes, selectedNode]);

  // ==============================================================================
  // ⚡ CRUD 액션 핸들러
  // ==============================================================================

  // 자식 노드 추가 (Infinite Nesting)
  const handleAddChildNode = useCallback((parentId: string | null = null) => {
    const newId = generateClientUUID();
    const parent = flatNodes.find((n) => n.id === parentId);
    const siblings = flatNodes.filter((n) => n.parent_id === parentId);
    
    const newNode: TreeNode = {
      id: newId,
      parent_id: parentId,
      title: parent ? `${parent.title} 하위 세부 목표` : '새로운 메인 주제',
      description: '클릭하여 목표 상세 설명 및 참고 링크를 입력하세요.',
      category: parent ? parent.category : 'general',
      status: 'todo',
      order_index: siblings.length,
      is_expanded: true,
      color_accent: parent?.color_accent || '#06b6d4',
      icon_name: 'GitBranch',
      tags: [],
      metadata: { links: [] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 부모의 is_expanded를 true로 확장
    setFlatNodes((prev) => {
      const updated = prev.map((n) => n.id === parentId ? { ...n, is_expanded: true } : n);
      return [...updated, newNode];
    });

    setSelectedNodeId(newId);
    showToast(`새 노드가 추가되었습니다. (${newNode.title})`, 'success');

    // 서버 비동기 동기화 시도
    fetch('/api/tree-nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNode),
    }).catch((err) => console.warn('Supabase sync deferred:', err));
  }, [flatNodes, showToast]);

  // 형제(Sibling) 노드 추가
  const handleAddSiblingNode = useCallback((targetNodeId: string) => {
    const target = flatNodes.find((n) => n.id === targetNodeId);
    if (!target) return;
    handleAddChildNode(target.parent_id);
  }, [flatNodes, handleAddChildNode]);

  // 노드 단일 필드 수정
  const handleUpdateNode = useCallback((id: string, updates: Partial<TreeNode>) => {
    setFlatNodes((prev) => prev.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      return n;
    }));

    // 서버 동기화
    fetch('/api/tree-nodes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    }).catch(() => {});
  }, []);

  // 노드 삭제 (연쇄 하위 자식 노드 재귀 삭제)
  const handleDeleteNode = useCallback((id: string) => {
    // 삭제 대상 및 모든 자손 ID 탐색
    const idsToDelete = new Set<string>();
    const collectDescendants = (targetId: string) => {
      idsToDelete.add(targetId);
      flatNodes.filter((n) => n.parent_id === targetId).forEach((child) => collectDescendants(child.id));
    };
    collectDescendants(id);

    if (idsToDelete.size > 1) {
      if (!confirm(`이 노드와 하위 자식 노드 ${idsToDelete.size - 1}개가 함께 삭제됩니다. 계속하시겠습니까?`)) {
        return;
      }
    }

    setFlatNodes((prev) => prev.filter((n) => !idsToDelete.has(n.id)));
    if (selectedNodeId && idsToDelete.has(selectedNodeId)) {
      const remaining = flatNodes.filter((n) => !idsToDelete.has(n.id));
      setSelectedNodeId(remaining.length > 0 ? remaining[0].id : null);
    }

    showToast(`노드 ${idsToDelete.size}개가 삭제되었습니다.`, 'warn');

    // 서버 동기화
    fetch(`/api/tree-nodes?id=${id}`, {
      method: 'DELETE',
    }).catch(() => {});
  }, [flatNodes, selectedNodeId, showToast]);

  // 노드 펼치기/접기 토글
  const handleToggleExpand = useCallback((nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFlatNodes((prev) => prev.map((n) => {
      if (n.id === nodeId) {
        return { ...n, is_expanded: !n.is_expanded };
      }
      return n;
    }));
  }, []);

  // 전체 펼치기 / 전체 접기
  const handleExpandAll = (expand: boolean) => {
    setFlatNodes((prev) => prev.map((n) => ({ ...n, is_expanded: expand })));
    showToast(expand ? '모든 노드를 펼쳤습니다.' : '모든 노드를 접었습니다.', 'info');
  };

  // 노드 부모 변경 (Drag & Drop 또는 Dropdown을 통한 Reparenting)
  const handleReparentNode = useCallback((nodeId: string, newParentId: string | null) => {
    if (nodeId === newParentId) return;

    // 순환 참조 방지: 자신의 자손을 부모로 지정할 수 없음
    const isDescendant = (childId: string, parentToCheck: string): boolean => {
      const p = flatNodes.find((n) => n.id === parentToCheck);
      if (!p || !p.parent_id) return false;
      if (p.parent_id === childId) return true;
      return isDescendant(childId, p.parent_id);
    };

    if (newParentId && isDescendant(nodeId, newParentId)) {
      showToast('자신의 하위 노드를 부모로 지정할 수 없습니다.', 'warn');
      return;
    }

    const siblings = flatNodes.filter((n) => n.parent_id === newParentId);
    handleUpdateNode(nodeId, {
      parent_id: newParentId,
      order_index: siblings.length
    });

    showToast('노드 위치(부모 계층)가 변경되었습니다.', 'success');
  }, [flatNodes, handleUpdateNode, showToast]);

  // 형제 간 순서 위/아래 이동
  const handleMoveSiblingOrder = useCallback((nodeId: string, direction: 'up' | 'down') => {
    const current = flatNodes.find((n) => n.id === nodeId);
    if (!current) return;

    const siblings = flatNodes
      .filter((n) => n.parent_id === current.parent_id)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    const currentIndex = siblings.findIndex((n) => n.id === nodeId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const targetSibling = siblings[targetIndex];
    const currentOrder = current.order_index;
    const targetOrder = targetSibling.order_index;

    setFlatNodes((prev) => prev.map((n) => {
      if (n.id === current.id) return { ...n, order_index: targetOrder };
      if (n.id === targetSibling.id) return { ...n, order_index: currentOrder };
      return n;
    }));
  }, [flatNodes]);

  // 초기화 및 기본 템플릿 복원
  const handleResetToDefault = () => {
    if (confirm('기본 데모 마인드맵 구조로 복원하시겠습니까? 현재 변경사항은 덮어씌워집니다.')) {
      setFlatNodes(INITIAL_TREE_DATA);
      setSelectedNodeId('root-me');
      setZoomScale(1);
      setPanPosition({ x: 40, y: 30 });
      showToast('기본 마인드맵 데이터로 초기화되었습니다.', 'info');
    }
  };

  // JSON 내보내기 / 가져오기
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flatNodes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cse4seoul_mindmap_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('JSON 파일로 내보냈습니다.', 'success');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFlatNodes(parsed);
            setSelectedNodeId(parsed[0].id);
            showToast('JSON 데이터를 성공적으로 불러왔습니다.', 'success');
          }
        } catch (err) {
          showToast('유효하지 않은 JSON 파일 형식입니다.', 'warn');
        }
      };
    }
  };

  // ==============================================================================
  // 🧭 캔버스 인터랙션 (Pan & Zoom)
  // ==============================================================================
  const handleMouseDown = (e: React.MouseEvent) => {
    // 캔버스 배경 클릭 시에만 팬 동작
    if ((e.target as HTMLElement).closest('.node-card')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanPosition({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoomScale((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
    }
  };

  // 키보드 내비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ==============================================================================
  // 🔍 필터링 로직
  // ==============================================================================
  const isNodeMatchSearch = useCallback((node: TreeNode): boolean => {
    if (selectedCategoryFilter !== 'ALL' && node.category !== selectedCategoryFilter) return false;
    if (selectedStatusFilter !== 'ALL' && node.status !== selectedStatusFilter) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return Boolean(
      node.title.toLowerCase().includes(query) ||
      (node.description && node.description.toLowerCase().includes(query)) ||
      (node.tags && node.tags.some((t) => t.toLowerCase().includes(query)))
    );
  }, [searchQuery, selectedCategoryFilter, selectedStatusFilter]);

  // ==============================================================================
  // 🎨 Canvas Mind-Map Recursive Tree Node Renderer (Bézier Curves & Cards)
  // ==============================================================================
  const renderCanvasNode = (node: TreeNode) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = node.is_expanded !== false;
    const isSelected = selectedNodeId === node.id;
    const isDropTarget = dropTargetNodeId === node.id;
    const isDragging = draggedNodeId === node.id;
    const isMatched = isNodeMatchSearch(node);
    const categoryInfo = CATEGORY_CONFIG[node.category] || CATEGORY_CONFIG.general;
    const statusInfo = STATUS_CONFIG[node.status] || STATUS_CONFIG.todo;
    const stats = calculateNodeStats(node);
    const IconComponent = ICON_MAP[node.icon_name || ''] || ICON_MAP[categoryInfo.icon] || Folder;

    return (
      <div key={node.id} className="flex items-center relative py-3">
        {/* 노드 카드 */}
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          draggable
          onDragStart={(e: any) => {
            e.stopPropagation();
            setDraggedNodeId(node.id);
            if (e.dataTransfer) {
              e.dataTransfer.setData('text/plain', node.id);
            }
          }}
          onDragOver={(e: any) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedNodeId && draggedNodeId !== node.id) {
              setDropTargetNodeId(node.id);
            }
          }}
          onDragLeave={(e: any) => {
            e.stopPropagation();
            setDropTargetNodeId(null);
          }}
          onDrop={(e: any) => {
            e.preventDefault();
            e.stopPropagation();
            const sourceId = e.dataTransfer?.getData('text/plain') || draggedNodeId;
            if (sourceId && sourceId !== node.id) {
              handleReparentNode(sourceId, node.id);
            }
            setDraggedNodeId(null);
            setDropTargetNodeId(null);
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNodeId(node.id);
          }}
          className={`node-card group relative flex flex-col min-w-[240px] max-w-[280px] rounded-2xl p-4 transition-all duration-300 backdrop-blur-xl cursor-pointer select-none ${
            isSelected 
              ? 'bg-neutral-900/95 border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)] scale-[1.03] z-30'
              : isDropTarget
              ? 'bg-cyan-950/80 border-2 border-dashed border-cyan-400 scale-105 shadow-[0_0_20px_rgba(6,182,212,0.5)] z-30'
              : isDragging
              ? 'opacity-40 border border-white/10'
              : isMatched
              ? 'bg-neutral-900/80 border border-white/10 hover:border-white/25 hover:bg-neutral-850 shadow-xl hover:shadow-2xl z-10'
              : 'opacity-35 bg-neutral-950/60 border border-white/5'
          }`}
          style={{
            boxShadow: isSelected ? `0 0 25px ${categoryInfo.color}40` : undefined,
          }}
        >
          {/* 상단 액센트 색상 바 */}
          <div 
            className="absolute top-0 left-4 right-4 h-[2px] rounded-full opacity-80"
            style={{ backgroundColor: node.color_accent || categoryInfo.color }}
          />

          {/* 카드 헤더: 카테고리 태그 및 상태 뱃지 */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border"
              style={{
                backgroundColor: `${categoryInfo.color}15`,
                color: categoryInfo.color,
                borderColor: `${categoryInfo.color}40`,
              }}
            >
              <IconComponent size={11} />
              {categoryInfo.label}
            </span>

            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold border ${statusInfo.badge}`}>
              <span 
                className="w-1.5 h-1.5 rounded-full animate-pulse" 
                style={{ backgroundColor: statusInfo.color }}
              />
              {statusInfo.label.split(' ')[0]}
            </span>
          </div>

          {/* 노드 타이틀 */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs md:text-sm font-black text-white leading-snug line-clamp-2">
              {node.title}
            </h4>
          </div>

          {/* 설명 요약 */}
          {node.description && (
            <p className="text-[10px] text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed font-light">
              {node.description}
            </p>
          )}

          {/* 하위 진행률 바 (자식이 있을 때) */}
          {hasChildren && (
            <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400">
                <span>하위 달성도 ({stats.completed}/{stats.total})</span>
                <span className="font-bold text-cyan-400">{stats.percentage}%</span>
              </div>
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* 노드 호버 시 나타나는 빠른 액션 툴바 */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 p-1 rounded-full bg-neutral-900 border border-white/20 shadow-xl z-40">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddChildNode(node.id);
              }}
              title="하위 자식 노드 추가"
              className="p-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 hover:scale-110 transition-transform"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNodeId(node.id);
              }}
              title="세부 정보 편집"
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white hover:scale-110 transition-transform"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNode(node.id);
              }}
              title="노드 삭제"
              className="p-1 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:scale-110 transition-transform"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {/* 우측 펼치기/접기 핸들 버튼 (자식이 있을 때) */}
          {hasChildren && (
            <button
              onClick={(e) => handleToggleExpand(node.id, e)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-neutral-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-400 flex items-center justify-center text-[10px] font-bold shadow-lg hover:scale-110 transition-all z-20"
              title={isExpanded ? "자식 노드 접기" : "자식 노드 펼치기"}
            >
              {isExpanded ? (
                <ChevronDown size={12} />
              ) : (
                <span className="text-[9px] font-mono font-black">+{node.children?.length}</span>
              )}
            </button>
          )}
        </motion.div>

        {/* 자식 노드 렌더링 & SVG 연결 곡선 */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col ml-14 pl-4 relative border-l border-white/10">
            {node.children!.map((child) => (
              <div key={child.id} className="relative flex items-center">
                {/* SVG 베지에 연결 라인 */}
                <div className="absolute -left-4 top-1/2 w-4 h-[1px] bg-gradient-to-r from-white/20 to-cyan-500/50" />
                {renderCanvasNode(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ==============================================================================
  // 🌲 Outline Hierarchy Recursive Tree View Renderer
  // ==============================================================================
  const renderTreeOutlineNode = (node: TreeNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = node.is_expanded !== false;
    const isSelected = selectedNodeId === node.id;
    const isMatched = isNodeMatchSearch(node);
    const categoryInfo = CATEGORY_CONFIG[node.category] || CATEGORY_CONFIG.general;
    const statusInfo = STATUS_CONFIG[node.status] || STATUS_CONFIG.todo;
    const IconComponent = ICON_MAP[node.icon_name || ''] || ICON_MAP[categoryInfo.icon] || Folder;

    return (
      <div key={node.id} className="flex flex-col">
        <div 
          onClick={() => setSelectedNodeId(node.id)}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          className={`group flex items-center justify-between py-2.5 pr-4 border-b border-white/[0.04] transition-all cursor-pointer ${
            isSelected 
              ? 'bg-cyan-950/40 text-white border-l-4 border-l-cyan-400' 
              : isMatched
              ? 'hover:bg-white/[0.03] text-neutral-300'
              : 'opacity-30 text-neutral-500'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* 펼침 토글 버튼 */}
            {hasChildren ? (
              <button
                onClick={(e) => handleToggleExpand(node.id, e)}
                className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-6 h-6 flex items-center justify-center text-neutral-600">•</span>
            )}

            {/* 아이콘 */}
            <div 
              className="p-1 rounded-md text-xs"
              style={{ color: node.color_accent || categoryInfo.color, backgroundColor: `${categoryInfo.color}15` }}
            >
              <IconComponent size={13} />
            </div>

            {/* 타이틀 */}
            <span className="text-xs font-bold font-mono truncate">
              {node.title}
            </span>

            {/* 자식 개수 */}
            {hasChildren && (
              <span className="text-[10px] font-mono text-neutral-500">
                ({node.children!.length})
              </span>
            )}
          </div>

          {/* 우측 뱃지 및 액션 */}
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${statusInfo.badge}`}>
              {statusInfo.label.split(' ')[0]}
            </span>

            {/* 빠른 액션 버튼 */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveSiblingOrder(node.id, 'up');
                }}
                className="p-1 text-neutral-400 hover:text-white"
                title="위로 이동"
              >
                <ArrowUp size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveSiblingOrder(node.id, 'down');
                }}
                className="p-1 text-neutral-400 hover:text-white"
                title="아래로 이동"
              >
                <ArrowDown size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddChildNode(node.id);
                }}
                className="p-1 text-cyan-400 hover:scale-110"
                title="하위 자식 추가"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* 자식 노드 재귀 렌더 */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderTreeOutlineNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`relative flex flex-col bg-neutral-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl ${className}`}>
      {/* 1. 상단 마인드맵 툴바 & 컨트롤 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-neutral-900/80 border-b border-white/10 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/20">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-black text-white font-mono tracking-tight flex items-center gap-1.5">
                KNOWLEDGE & GOAL TREE
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  {flatNodes.length} NODES
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-neutral-400 font-sans font-light">
              무한 계층 마인드맵 캔버스 및 인터랙티브 목표 관리 스튜디오
            </p>
          </div>
        </div>

        {/* 뷰 모드 토글 및 캔버스 제어 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Canvas / Tree 뷰 모드 토글 */}
          <div className="flex items-center bg-black/60 border border-white/10 rounded-xl p-1 font-mono text-xs">
            <button
              onClick={() => setViewMode('canvas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'canvas' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Mind-Map</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'tree' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ListTree size={13} />
              <span>Tree Outline</span>
            </button>
          </div>

          {/* 줌 컨트롤 (Canvas 모드일 때만) */}
          {viewMode === 'canvas' && (
            <div className="flex items-center bg-black/60 border border-white/10 rounded-xl px-2 py-1 gap-1">
              <button
                onClick={() => setZoomScale((z) => Math.max(0.4, z - 0.15))}
                className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                title="축소"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] font-mono text-cyan-300 min-w-[36px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.15))}
                className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                title="확대"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => {
                  setZoomScale(1);
                  setPanPosition({ x: 40, y: 30 });
                }}
                className="p-1.5 text-neutral-400 hover:text-cyan-400 transition-colors border-l border-white/10 ml-1 pl-2"
                title="화면 중앙 원위치"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          )}

          {/* 최상위 루트 노드 추가 */}
          <button
            onClick={() => handleAddChildNode(null)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={14} />
            <span>노드 추가</span>
          </button>
        </div>
      </div>

      {/* 2. 보조 검색 및 카테고리 필터 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-neutral-950/80 border-b border-white/5 text-xs font-mono">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="목표, 키워드, 태그 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* 카테고리 필터 칩 */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white/5 text-neutral-400 hover:text-white'
            }`}
          >
            전체
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setSelectedCategoryFilter(key)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                selectedCategoryFilter === key
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
              style={{
                backgroundColor: selectedCategoryFilter === key ? `${cfg.color}25` : 'rgba(255,255,255,0.02)',
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        {/* 추가 유틸리티 메뉴 (펼치기, 접기, 백업) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExpandAll(true)}
            className="px-2 py-1 text-[10px] text-neutral-400 hover:text-white bg-white/5 rounded hover:bg-white/10"
            title="모든 하위 브랜치 펼치기"
          >
            모두 펼치기
          </button>
          <button
            onClick={() => handleExpandAll(false)}
            className="px-2 py-1 text-[10px] text-neutral-400 hover:text-white bg-white/5 rounded hover:bg-white/10"
            title="모든 하위 브랜치 접기"
          >
            모두 접기
          </button>
          <button
            onClick={handleExportJSON}
            className="p-1.5 text-neutral-400 hover:text-cyan-400 bg-white/5 rounded hover:bg-white/10"
            title="JSON 내보내기 백업"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* 3. 메인 작업 영역: (좌측 캔버스/트리 + 우측 디테일 서랍 패널) */}
      <div className="relative flex flex-1 min-h-[560px] max-h-[750px] overflow-hidden">
        {/* A. 마인드맵 인터랙티브 캔버스 뷰 */}
        {viewMode === 'canvas' ? (
          <div 
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="relative flex-1 h-full overflow-hidden bg-neutral-950 cursor-grab active:cursor-grabbing select-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          >
            {/* 팬/줌 적용 컨테이너 */}
            <div 
              className="absolute inset-0 p-8 origin-top-left transition-transform duration-75"
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
              }}
            >
              <div className="flex flex-col gap-8">
                {hierarchicalTree.map((rootNode) => renderCanvasNode(rootNode))}
              </div>
            </div>

            {/* 좌하단 단축키 가이드 힌트 */}
            <div className="absolute bottom-4 left-4 pointer-events-none text-[10px] font-mono text-neutral-500 bg-black/60 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm">
              드래그: 화면 이동 // 휠: 줌 // 노드 드래그: 부모 계층 이동
            </div>
          </div>
        ) : (
          /* B. 트리 아웃라인 뷰 */
          <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-4 bg-neutral-950">
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/40">
              {hierarchicalTree.map((rootNode) => renderTreeOutlineNode(rootNode))}
            </div>
          </div>
        )}

        {/* C. 우측 노드 상세 정보 및 편집 서랍 (Side Panel Drawer) */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full sm:w-[360px] md:w-[400px] shrink-0 border-l border-white/10 bg-neutral-900/95 backdrop-blur-2xl p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar z-40 shadow-2xl"
            >
              {/* 서랍 헤더 */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-400">
                  <Edit3 size={14} />
                  <span>NODE INSPECTOR</span>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 1. 노드 타이틀 편집 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  Node Title (목표 및 주제명)
                </label>
                <input
                  type="text"
                  value={selectedNode.title}
                  onChange={(e) => handleUpdateNode(selectedNode.id, { title: e.target.value })}
                  className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 2. 상태(Status) 및 카테고리(Category) 변경 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 font-mono">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider">Status</label>
                  <select
                    value={selectedNode.status}
                    onChange={(e) => handleUpdateNode(selectedNode.id, { status: e.target.value as NodeStatus })}
                    className="bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                      <option key={val} value={val}>{cfg.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 font-mono">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider">Category</label>
                  <select
                    value={selectedNode.category}
                    onChange={(e) => {
                      const newCat = e.target.value as NodeCategory;
                      handleUpdateNode(selectedNode.id, { 
                        category: newCat,
                        color_accent: CATEGORY_CONFIG[newCat]?.color || '#06b6d4'
                      });
                    }}
                    className="bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([val, cfg]) => (
                      <option key={val} value={val}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. 부모 노드 변경 (Reparenting Dropdown) */}
              <div className="flex flex-col gap-1.5 font-mono">
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                  Parent Hierarchy (상위 부모 변경)
                </label>
                <select
                  value={selectedNode.parent_id || 'root'}
                  onChange={(e) => handleReparentNode(selectedNode.id, e.target.value === 'root' ? null : e.target.value)}
                  className="bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="root">👑 [최상위 Root 노드로 지정]</option>
                  {flatNodes
                    .filter((n) => n.id !== selectedNode.id)
                    .map((n) => (
                      <option key={n.id} value={n.id}>↳ {n.title}</option>
                    ))}
                </select>
              </div>

              {/* 4. 상세 설명 & 마크다운 메모 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  Description & Strategy (세부 실행 계획)
                </label>
                <textarea
                  rows={4}
                  value={selectedNode.description || ''}
                  onChange={(e) => handleUpdateNode(selectedNode.id, { description: e.target.value })}
                  placeholder="이 목표를 완수하기 위한 구체적인 방법과 핵심 노트를 입력하세요."
                  className="w-full bg-black/70 border border-white/15 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 resize-none font-sans leading-relaxed"
                />
              </div>

              {/* 5. 참고 링크 / 리소스 목록 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <LinkIcon size={11} />
                    Resource Links ({selectedNode.metadata?.links?.length || 0})
                  </label>
                  <button
                    onClick={() => {
                      const url = prompt('추가할 URL을 입력하세요:', 'https://');
                      if (url) {
                        const title = prompt('링크 제목을 입력하세요:', '관련 문서 / 웹사이트') || url;
                        const links = selectedNode.metadata?.links || [];
                        handleUpdateNode(selectedNode.id, {
                          metadata: {
                            ...selectedNode.metadata,
                            links: [...links, { id: generateClientUUID(), title, url }]
                          }
                        });
                      }
                    }}
                    className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    + 링크 추가
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  {selectedNode.metadata?.links && selectedNode.metadata.links.length > 0 ? (
                    selectedNode.metadata.links.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-2 rounded-lg bg-black/50 border border-white/5 text-xs font-mono">
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-1.5 text-cyan-400 hover:underline truncate max-w-[85%]"
                        >
                          <ExternalLink size={12} />
                          <span className="truncate">{link.title}</span>
                        </a>
                        <button
                          onClick={() => {
                            const updatedLinks = selectedNode.metadata?.links?.filter((l) => l.id !== link.id);
                            handleUpdateNode(selectedNode.id, {
                              metadata: { ...selectedNode.metadata, links: updatedLinks }
                            });
                          }}
                          className="text-neutral-500 hover:text-rose-400 p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-neutral-600 font-mono italic">등록된 링크가 없습니다.</p>
                  )}
                </div>
              </div>

              {/* 6. 하위 자식 노드 퀵 체크리스트 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <CornerDownRight size={11} />
                    Sub-tasks ({selectedNodeChildren.length})
                  </label>
                  <button
                    onClick={() => handleAddChildNode(selectedNode.id)}
                    className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    + 하위 목표 추가
                  </button>
                </div>

                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                  {selectedNodeChildren.length > 0 ? (
                    selectedNodeChildren.map((child) => (
                      <div 
                        key={child.id}
                        onClick={() => setSelectedNodeId(child.id)}
                        className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5 hover:border-white/20 transition-all cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={child.status === 'completed'}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleUpdateNode(child.id, { status: e.target.checked ? 'completed' : 'in_progress' });
                            }}
                            className="rounded border-white/20 bg-black text-cyan-500 focus:ring-0 cursor-pointer"
                          />
                          <span className={`truncate text-xs font-mono ${child.status === 'completed' ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                            {child.title}
                          </span>
                        </div>
                        <ChevronRight size={12} className="text-neutral-600" />
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-neutral-600 font-mono italic">하위 세부 목표가 없습니다.</p>
                  )}
                </div>
              </div>

              {/* 7. 하단 조작 버튼 (형제 추가 & 삭제) */}
              <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleAddSiblingNode(selectedNode.id)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold transition-all"
                >
                  + 같은 레벨 추가
                </button>
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-400 hover:text-rose-200 font-mono text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  <span>삭제</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. 하단 상태 바 */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3 bg-neutral-950 border-t border-white/10 text-[10px] font-mono text-neutral-400">
        <div className="flex items-center gap-3 md:gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${currentUser ? 'bg-emerald-400' : 'bg-amber-400'} animate-ping`} />
            <span className="font-bold">
              {currentUser 
                ? `CLOUD SYNC: ${currentUser.email}` 
                : 'GUEST SANDBOX (LOCAL STORAGE)'}
            </span>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            완료율: {Math.round((flatNodes.filter((n) => n.status === 'completed').length / Math.max(1, flatNodes.length)) * 100)}%
          </span>
          {!currentUser && (
            <span className="hidden md:inline text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              💡 로그인 시 개인 클라우드 DB에 영구 격리 저장됩니다.
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetToDefault}
            className="text-neutral-500 hover:text-neutral-300 underline cursor-pointer"
          >
            기본 템플릿 복원
          </button>
        </div>
      </div>

      {/* 5. 토스트 알림 팝업 */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-8 right-8 z-50 px-4 py-2.5 rounded-2xl shadow-2xl border font-mono text-xs font-bold flex items-center gap-2 backdrop-blur-xl ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                : toastMessage.type === 'warn'
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40'
            }`}
          >
            <Sparkles size={14} />
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
