'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface HoldingItem {
  symbol: string;
  name: string;
  weight: number;
  changePercent?: number;
  is_foreign: boolean;
}

interface TreemapNode {
  name: string;
  symbol: string;
  weight: number;
  changePercent: number;
  is_foreign: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface EtfTreemapProps {
  etfSymbol: string;
  underlyingTicker: string;
  isHedged: boolean;
  onMetricsUpdate?: (upCount: number, downCount: number, coverage: number) => void;
}

// 💡 Recursive Binary Split Treemap Layout Algorithm
function layoutTreemap(
  x: number,
  y: number,
  w: number,
  h: number,
  items: HoldingItem[]
): TreemapNode[] {
  if (items.length === 0) return [];
  if (items.length === 1) {
    return [{
      name: items[0].name,
      symbol: items[0].symbol,
      weight: items[0].weight,
      changePercent: items[0].changePercent || 0,
      is_foreign: items[0].is_foreign,
      x, y, w, h
    }];
  }

  // Split list in half by matching weight sums
  const total = items.reduce((acc, curr) => acc + curr.weight, 0);
  let sum = 0;
  let splitIdx = 0;

  for (let i = 0; i < items.length; i++) {
    sum += items[i].weight;
    if (sum >= total / 2 || i === items.length - 2) {
      splitIdx = i + 1;
      break;
    }
  }

  const leftGroup = items.slice(0, splitIdx);
  const rightGroup = items.slice(splitIdx);
  const leftSum = leftGroup.reduce((acc, curr) => acc + curr.weight, 0);
  const ratio = leftSum / total;

  const result: TreemapNode[] = [];

  // Split horizontally if adjusted width is larger, vertically otherwise
  // Using 3.1x weight to ensure horizontal grid flow on skinny left-hand side containers.
  if (w * 3.1 >= h) {
    const leftW = w * ratio;
    result.push(...layoutTreemap(x, y, leftW, h, leftGroup));
    result.push(...layoutTreemap(x + leftW, y, w - leftW, h, rightGroup));
  } else {
    const topH = h * ratio;
    result.push(...layoutTreemap(x, y, w, topH, leftGroup));
    result.push(...layoutTreemap(x, y + topH, w, h - topH, rightGroup));
  }

  return result;
}

export default function EtfTreemap({ 
  etfSymbol, 
  underlyingTicker, 
  isHedged,
  onMetricsUpdate
}: EtfTreemapProps) {
  const [nodes, setNodes] = useState<TreemapNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/etf/constituents?symbol=${encodeURIComponent(etfSymbol)}`);
      if (!res.ok) {
        throw new Error('구성 종목 정보를 불러올 수 없습니다.');
      }
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }

      const holdings: HoldingItem[] = json.holdings || [];
      if (holdings.length > 0) {
        // Layout nodes
        const layoutResult = layoutTreemap(0, 0, 100, 100, holdings);
        setNodes(layoutResult);

        // Notify parent metrics
        if (onMetricsUpdate && json.metrics) {
          onMetricsUpdate(
            json.metrics.upCount || 0,
            json.metrics.downCount || 0,
            json.metrics.coverage || 100
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '데이터 로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldings();
  }, [etfSymbol]);

  // Color Intensity calculator based on return rate
  const getCellBgColor = (changePercent: number, isCash: boolean) => {
    if (isCash || Math.abs(changePercent) <= 0.05) {
      return 'rgba(75, 85, 99, 0.25)'; // grayish for cash/flat assets
    }
    const absChange = Math.abs(changePercent);
    // Scale opacity: 0.1% change -> 0.25 opacity, 5% change -> 1.0 opacity
    const opacity = Math.min(0.25 + (absChange / 5) * 0.75, 1.0);

    if (changePercent > 0) {
      return `rgba(239, 68, 68, ${opacity})`; // red for rise
    } else {
      return `rgba(59, 130, 246, ${opacity})`; // blue for drop
    }
  };

  const getBorderColor = (changePercent: number, isCash: boolean) => {
    if (isCash || Math.abs(changePercent) <= 0.05) return 'border-gray-800/40';
    return changePercent > 0 ? 'border-red-500/30' : 'border-blue-500/30';
  };

  if (loading) {
    return (
      <div className="w-full h-80 bg-gray-900/10 border border-gray-850 rounded-2xl flex flex-col items-center justify-center p-6 space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-xs text-gray-500 font-bold">ETFNOW 구성 종목 실시간 연산 가동 중...</span>
        {/* Treemap Skeleton Blocks */}
        <div className="grid grid-cols-3 gap-2 w-full h-32 opacity-20 pointer-events-none mt-2">
          <div className="bg-gray-800 rounded-xl col-span-2"></div>
          <div className="bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 bg-red-950/10 border border-red-900/20 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mb-2 animate-bounce" />
        <span className="text-xs text-red-300 font-bold mb-3">{error}</span>
        <button 
          onClick={fetchHoldings}
          className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-850 text-[10px] font-bold text-gray-400 hover:text-white rounded-lg transition-all flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          재시도
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-80 relative bg-black/60 rounded-2xl overflow-hidden border border-gray-850 shadow-inner group">
      {nodes.map((node, idx) => {
        const isCash = !node.is_foreign || node.symbol.includes('CASH');
        const bg = getCellBgColor(node.changePercent, isCash);
        const border = getBorderColor(node.changePercent, isCash);
        
        // Hide details on tiny nodes
        const showFullDetails = node.w >= 10 && node.h >= 10;
        const showAnyText = node.w >= 5 && node.h >= 5;

        return (
          <div
            key={idx}
            className={`absolute border transition-all duration-300 hover:scale-[0.99] flex flex-col items-center justify-center p-1.5 text-center overflow-hidden cursor-default select-none ${border}`}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.w}%`,
              height: `${node.h}%`,
              backgroundColor: bg
            }}
            title={`${node.name} (${node.symbol}): 비중 ${node.weight}%, 실시간 변동 ${node.changePercent >= 0 ? '+' : ''}${node.changePercent.toFixed(2)}%`}
          >
            {showAnyText && (
              <div className="flex flex-col items-center justify-center h-full w-full">
                {/* 1. Name */}
                <span className={`font-black tracking-tight truncate w-full ${showFullDetails ? 'text-[10px] text-white' : 'text-[8px] text-white/80'}`}>
                  {node.name}
                </span>

                {/* 2. Real-time Return */}
                {showFullDetails && (
                  <span className={`text-[10px] font-black tabular-nums my-0.5 ${node.changePercent >= 0.05 ? 'text-red-100' : node.changePercent <= -0.05 ? 'text-blue-100' : 'text-gray-400'}`}>
                    {node.changePercent >= 0.05 ? '+' : ''}
                    {node.changePercent.toFixed(2)}%
                  </span>
                )}

                {/* 3. Weight % */}
                {showFullDetails && (
                  <span className="text-[8px] text-white/50 font-bold">
                    {node.weight.toFixed(1)}%
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
