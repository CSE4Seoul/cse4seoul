'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  DollarSign, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Info,
  Clock,
  Search,
  Settings2,
  Check,
  X,
  Sliders
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import EtfTreemap from './EtfTreemap';

interface ETFData {
  symbol: string;
  ko_code: string;
  name: string;
  underlying_ticker: string;
  is_hedged: boolean;
  weight: number;
  avg_price: number;
  quantity: number;
  marketPrice?: number;
  prevClose?: number;
  changePercent?: number;
  estINAV?: number;
  discrepancyRate?: number;
  underlyingCurrent?: number;
  underlyingChange?: number;
  fxCurrent?: number;
  fxChange?: number;
  purchaseAmount?: number;
  estValuation?: number;
  estProfit?: number;
  estReturn?: number;
  error?: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

interface PortfolioSummary {
  totalWeight: number;
  weightedDiscrepancy: number;
  weightedChange: number;
  weightedAfterMarketChange: number;
  totalPurchaseAmount: number;
  totalEstValuation: number;
  totalEstProfit: number;
  totalEstReturn: number;
}

interface MetricsItem {
  up: number;
  down: number;
  coverage: number;
}

export default function EtfTrackerWidget({ userId }: { userId: string }) {
  const [etfs, setEtfs] = useState<ETFData[]>([]);
  const [fxRate, setFxRate] = useState<number>(0);
  const [fxChange, setFxChange] = useState<number>(0);
  const [isTradingHours, setIsTradingHours] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false); // 💡 Auto-Sync State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  
  // Weight & Asset Editing State
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editWeightValue, setEditWeightValue] = useState<number>(10);
  const [editAvgPrice, setEditAvgPrice] = useState<number>(0);
  const [editQuantity, setEditQuantity] = useState<number>(0);

  // Dynamic Treemap Accordion State
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Record<string, MetricsItem>>({});

  // Holdings GUI Editor State
  const [isHoldingsModalOpen, setIsHoldingsModalOpen] = useState<boolean>(false);
  const [editingHoldingsSymbol, setEditingHoldingsSymbol] = useState<string | null>(null);
  const [editingHoldingsList, setEditingHoldingsList] = useState<any[]>([]);
  const [newHoldingSymbol, setNewHoldingSymbol] = useState<string>('');
  const [newHoldingName, setNewHoldingName] = useState<string>('');
  const [newHoldingWeight, setNewHoldingWeight] = useState<number>(5.0);
  const [newHoldingIsForeign, setNewHoldingIsForeign] = useState<boolean>(true);

  // New ETF Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalSymbol, setModalSymbol] = useState<string>('');
  const [modalName, setModalName] = useState<string>('');
  const [modalKoCode, setModalKoCode] = useState<string>('');
  const [modalIsinCode, setModalIsinCode] = useState<string>(''); // 💡 New ISIN code state
  const [modalUnderlying, setModalUnderlying] = useState<string>('NQ=F');
  const [modalIsHedged, setModalIsHedged] = useState<boolean>(false);
  const [modalWeight, setModalWeight] = useState<number>(10);
  const [modalAvgPrice, setModalAvgPrice] = useState<number>(0);
  const [modalQuantity, setModalQuantity] = useState<number>(0);

  const supabase = createClient();

  // 1. Fetch ETF watchlist and compute values
  const fetchData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const { data: userWatchlist, error: watchlistError } = await supabase
        .from('user_etf_watchlist')
        .select(`
          etf_id,
          weight,
          avg_price,
          quantity,
          etf_info (
            id,
            symbol,
            ko_code,
            name,
            underlying_ticker,
            is_hedged
          )
        `)
        .eq('user_id', userId);

      let url = `/api/etf`;
      if (!watchlistError && userWatchlist && userWatchlist.length > 0) {
        url += `?user_id=${userId}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.etfs) {
        setEtfs(data.etfs);
        setFxRate(data.fxRate || 0);
        setFxChange(data.fxChange24h || 0);
        setIsTradingHours(data.isTradingHours || false);
        setLastUpdated(new Date(data.timestamp).toLocaleTimeString('ko-KR'));
        setPortfolio(data.portfolio);
      }
    } catch (error) {
      console.error('Failed to fetch ETF tracker data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // 2. Trigger Auto-Sync for ETF Holdings from US Benchmarks
  const triggerAutoSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/etf/sync`, { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        alert('전체 ETF의 실시간 구성 종목 및 비중 동기화(자동 리밸런싱)가 완료되었습니다!');
        fetchData(true);
      } else {
        throw new Error(json.error || '동기화 에러');
      }
    } catch (err: any) {
      console.error(err);
      alert(`자동 동기화 실패: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Dynamic Search using Yahoo Finance Search API
  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(true);

    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // 4. Initiate Add to Watchlist
  const initiateAddToWatchlist = async (selected: SearchResult) => {
    try {
      const { data: existingEtf } = await supabase
        .from('etf_info')
        .select('*')
        .eq('symbol', selected.symbol)
        .maybeSingle();

      if (existingEtf) {
        const { error: watchError } = await supabase
          .from('user_etf_watchlist')
          .insert({
            user_id: userId,
            etf_id: existingEtf.id,
            weight: 10,
            avg_price: 0,
            quantity: 0
          });

        if (watchError) {
          if (watchError.code === '23505') {
            alert('이미 등록된 관심 ETF입니다.');
          } else {
            throw watchError;
          }
        } else {
          setSearchQuery('');
          setSearchResults([]);
          setShowSearchDropdown(false);
          fetchData(true);
        }
      } else {
        setModalSymbol(selected.symbol);
        setModalName(selected.name.replace(/(KIM|Mirae Asset|KODEX|TIGER|ACE|KBSTAR)\s+/gi, '').split(' ETF')[0].trim());
        
        const code = selected.symbol.split('.')[0] || '';
        setModalKoCode(code);
        setModalIsinCode('KR7' + code + '001'); // 💡 Default guide code format
        
        setModalIsHedged(selected.name.includes('(H)') || selected.name.includes('선물(H)'));
        setModalUnderlying('NQ=F');
        setModalWeight(10);
        setModalAvgPrice(0);
        setModalQuantity(0);
        setIsModalOpen(true);
        setShowSearchDropdown(false);
      }
    } catch (err) {
      console.error('Failed to resolve ETF ticker:', err);
    }
  };

  // 5. Save New ETF to both DB tables
  const saveNewEtf = async () => {
    if (!modalName.trim() || !modalKoCode.trim()) {
      alert('종목명과 종목코드를 입력해주세요.');
      return;
    }

    try {
      const isinVal = modalIsinCode.trim();
      const isinPayload = isinVal === '' ? null : isinVal;

      const { data: newEtf, error: insertEtfError } = await supabase
        .from('etf_info')
        .insert({
          symbol: modalSymbol,
          ko_code: modalKoCode.trim(),
          isin_code: isinPayload, // 💡 Send null instead of empty string to bypass unique constraint
          name: modalName.trim(),
          underlying_ticker: modalUnderlying,
          is_hedged: modalIsHedged
        })
        .select('id')
        .single();

      if (insertEtfError) throw insertEtfError;

      const { error: watchError } = await supabase
        .from('user_etf_watchlist')
        .insert({
          user_id: userId,
          etf_id: newEtf.id,
          weight: Number(modalWeight),
          avg_price: Number(modalAvgPrice),
          quantity: Number(modalQuantity)
        });

      if (watchError) throw watchError;

      setIsModalOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      fetchData(true);
    } catch (err) {
      console.error('Failed to save new ETF:', err);
      alert('ETF 등록에 실패했습니다. DB 마이그레이션 상태를 확인해주세요.');
    }
  };

  // 6. Update Portfolio Weight, Avg Price, and Quantity
  const handleUpdateAssets = async (symbol: string, etfId: string) => {
    try {
      const { error } = await supabase
        .from('user_etf_watchlist')
        .update({ 
          weight: editWeightValue,
          avg_price: editAvgPrice,
          quantity: editQuantity
        })
        .eq('user_id', userId)
        .eq('etf_id', etfId);

      if (error) throw error;

      setEditingSymbol(null);
      fetchData(true);
    } catch (err) {
      console.error('Failed to update weight and assets:', err);
      alert('자산 정보 수정에 실패했습니다. DB 마이그레이션 상태를 확인해주세요.');
    }
  };

  // 7. Manage callback metrics from child treemap
  const handleMetricsUpdate = (symbol: string, up: number, down: number, coverage: number) => {
    setMetrics(prev => ({
      ...prev,
      [symbol]: { up, down, coverage }
    }));
  };

  // 8. Toggle constituents treemap
  const toggleHoldings = (symbol: string) => {
    setExpandedSymbol(prev => prev === symbol ? null : symbol);
  };

  // 9. Remove from Watchlist
  const removeFromWatchlist = async (symbol: string) => {
    try {
      const { data: etfInfo } = await supabase
        .from('etf_info')
        .select('id')
        .eq('symbol', symbol)
        .single();

      if (etfInfo) {
        const { error } = await supabase
          .from('user_etf_watchlist')
          .delete()
          .eq('user_id', userId)
          .eq('etf_id', etfInfo.id);

        if (error) throw error;
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed to remove ETF:', err);
    }
  };

  // 10. GUI Holdings Editor Operations
  const openHoldingsEditor = async (symbol: string) => {
    setEditingHoldingsSymbol(symbol);
    try {
      const res = await fetch(`/api/etf/constituents?symbol=${encodeURIComponent(symbol)}`);
      const json = await res.json();
      if (json.holdings) {
        const filtered = json.holdings.filter((h: any) => h.symbol !== 'OTHERS' && h.symbol !== 'CASH');
        setEditingHoldingsList(filtered);
      } else {
        setEditingHoldingsList([]);
      }
      setIsHoldingsModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('구성종목 조회 실패');
    }
  };

  const handleAddHoldingRow = () => {
    if (!newHoldingSymbol.trim() || !newHoldingName.trim()) {
      alert('종목 심볼과 한글명을 입력해 주세요.');
      return;
    }
    setEditingHoldingsList(prev => [
      ...prev,
      {
        symbol: newHoldingSymbol.toUpperCase().trim(),
        name: newHoldingName.trim(),
        weight: newHoldingWeight,
        is_foreign: newHoldingIsForeign
      }
    ]);
    setNewHoldingSymbol('');
    setNewHoldingName('');
    setNewHoldingWeight(5.0);
    setNewHoldingIsForeign(true);
  };

  const handleRemoveHoldingRow = (idx: number) => {
    setEditingHoldingsList(prev => prev.filter((_, i) => i !== idx));
  };

  const saveHoldingsChanges = async () => {
    if (!editingHoldingsSymbol) return;
    try {
      const { data: etfMaster } = await supabase
        .from('etf_info')
        .select('id')
        .eq('symbol', editingHoldingsSymbol)
        .single();
      
      if (!etfMaster) throw new Error('ETF 정보 없음');

      const { error: delError } = await supabase
        .from('etf_holdings')
        .delete()
        .eq('etf_id', etfMaster.id);
      
      if (delError) throw delError;

      if (editingHoldingsList.length > 0) {
        const rowsToInsert = editingHoldingsList.map(h => ({
          etf_id: etfMaster.id,
          symbol: h.symbol,
          name: h.name,
          weight: Number(h.weight),
          is_foreign: h.is_foreign
        }));

        const { error: insError } = await supabase
          .from('etf_holdings')
          .insert(rowsToInsert);
        
        if (insError) throw insError;
      }

      setIsHoldingsModalOpen(false);
      setEditingHoldingsSymbol(null);
      alert('구성종목 및 비중이 성공적으로 데이터베이스에 저장되었습니다!');
      fetchData(true);
    } catch (err: any) {
      console.error(err);
      alert(`저장 실패: ${err.message || err}`);
    }
  };

  return (
    <div className="bg-gray-950/60 border border-gray-800 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden mt-8">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 bg-cyan-500 rounded-full"></div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              ETFNOW 실시간 자산 관리 대시보드
            </h2>
            
            {/* Status Badge */}
            {isTradingHours ? (
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                장중 거래시간
              </span>
            ) : (
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-cyan-950/40 text-cyan-400 border border-cyan-900/50 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                장외 실시간 수익률 추정 중
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-medium">
            한국 장 마감(KST 16:00) 이후 미국 야간 선물 지수와 실시간 환율을 동적으로 반영해 내 미국 ETF 포트폴리오의 실시간 수익률과 평가 금액을 추정합니다.
          </p>
        </div>

        {/* Currency & Actions */}
        <div className="flex items-center gap-4 self-end md:self-auto">
          {fxRate > 0 && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/40 border border-gray-800 rounded-2xl text-xs">
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-gray-400 font-medium">원/달러 환율:</span>
                <span className="text-white font-bold tabular-nums">
                  {fxRate.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}원
                </span>
                <span className={`font-black flex items-center text-[10px] ${fxChange >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                  {fxChange >= 0 ? '+' : ''}{fxChange.toFixed(2)}%
                </span>
              </div>
              <span className="text-[9px] text-gray-600 mt-1 font-semibold">KST 16:00 종가 대비 환율 변동</span>
            </div>
          )}

          {/* 💡 Auto-Sync Button */}
          <button
            onClick={triggerAutoSync}
            disabled={isSyncing}
            className={`px-3 py-2.5 bg-cyan-600/10 hover:bg-cyan-600 border border-cyan-500/20 text-cyan-450 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${isSyncing ? 'animate-pulse' : ''}`}
            title="실시간 한국/미국 공시 포트폴리오 비중 자동 동기화"
          >
            <Sliders className="w-4 h-4" />
            <span>비중 자동 동기화</span>
          </button>

          <button 
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className={`p-2.5 bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800 text-gray-400 hover:text-white rounded-xl transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Portfolio Profit/Loss Summary Card */}
      {portfolio && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 1. Asset Valuation Box */}
          <div className="bg-gradient-to-r from-gray-950 via-gray-900/40 to-gray-950 border border-gray-800/80 rounded-3xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">실시간 추정 총 평가액</span>
              <span className="text-3xl font-black text-white tabular-nums">
                {portfolio.totalEstValuation.toLocaleString('ko-KR')}원
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-800/40 pt-3 mt-4">
              <span>총 매수 금액:</span>
              <span className="font-bold text-white tabular-nums">
                {portfolio.totalPurchaseAmount.toLocaleString('ko-KR')}원
              </span>
            </div>
          </div>

          {/* 2. Profit and Loss Box */}
          <div className="bg-gradient-to-r from-gray-950 via-gray-900/40 to-gray-950 border border-gray-800/80 rounded-3xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">실시간 추정 평가 손익</span>
              <span className={`text-3xl font-black tabular-nums flex items-center gap-1.5 ${portfolio.totalEstProfit >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                {portfolio.totalEstProfit >= 0 ? '+' : ''}
                {portfolio.totalEstProfit.toLocaleString('ko-KR')}원
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-800/40 pt-3 mt-4">
              <span>실시간 추정 수익률:</span>
              <span className={`font-black tabular-nums ${portfolio.totalEstReturn >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                {portfolio.totalEstReturn >= 0 ? '+' : ''}{portfolio.totalEstReturn.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* 3. Weight & Discrepancy Box */}
          <div className="bg-gradient-to-r from-gray-950 via-gray-900/40 to-gray-950 border border-gray-800/80 rounded-3xl p-6 shadow-lg flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">포트폴리오 비중 합</span>
                <span className="text-xl font-extrabold text-white">{portfolio.totalWeight}%</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">가중 평균 괴리율</span>
                <span className={`text-xl font-extrabold tabular-nums ${portfolio.weightedDiscrepancy >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                  {portfolio.weightedDiscrepancy >= 0 ? '+' : ''}{portfolio.weightedDiscrepancy.toFixed(3)}%
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-800/40 pt-3 mt-4">
              <span>장외 추가 등락 (가중):</span>
              <span className={`font-black tabular-nums ${portfolio.weightedAfterMarketChange >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                {portfolio.weightedAfterMarketChange >= 0 ? '+' : ''}{portfolio.weightedAfterMarketChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Search Input */}
      <div className="relative mb-8 max-w-md">
        <div className="relative group">
          <input
            type="text"
            placeholder="추가할 미국 ETF 검색 (예: 나스닥100, 우주항공 0180V0, S&P500...)"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full bg-gray-900/40 border border-gray-800 focus:border-cyan-500/50 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none transition-all"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4 group-focus-within:text-cyan-400 transition-colors" />
          {isSearching && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-cyan-400 animate-pulse">
              스캔 중...
            </span>
          )}
        </div>

        {/* Dynamic Search Dropdown */}
        {showSearchDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-950 border border-gray-800/80 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.map((item) => (
              <div
                key={item.symbol}
                onClick={() => initiateAddToWatchlist(item)}
                className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{item.name || item.symbol}</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-gray-900 text-gray-400 border border-gray-800 font-bold">
                      {item.symbol}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    거래소: {item.exchange} | 구분: {item.type}
                  </span>
                </div>
                <button className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-white transition-all">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="p-2 bg-black/40 text-center border-t border-white/5">
              <button 
                onClick={() => setShowSearchDropdown(false)}
                className="text-[10px] text-gray-600 font-bold hover:text-gray-400"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ETF Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-80 bg-gray-900/30 border border-gray-800/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : etfs.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-3xl text-gray-500 text-center">
          <Clock className="w-10 h-10 text-gray-600 mb-3 opacity-40 animate-pulse" />
          <p className="text-sm font-bold text-gray-400">등록된 포트폴리오 미국 ETF가 없습니다.</p>
          <p className="text-xs text-gray-600 mt-1">상단 검색바를 통해 우주항공, 나스닥100 등 추적하고 싶은 ETF를 동적으로 연동해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {etfs.map((item) => {
            const hasError = !!item.error;
            const absDisc = item.discrepancyRate ? Math.abs(item.discrepancyRate) : 0;
            const isHighDiscrepancy = absDisc > 1.5;

            const afterMarketChange = item.marketPrice && item.estINAV ? ((item.estINAV / item.marketPrice - 1) * 100) : 0;
            
            return (
              <div 
                key={item.symbol} 
                className="group relative bg-gray-900/30 border border-gray-800/60 hover:border-cyan-500/25 rounded-3xl p-5 transition-all duration-300 shadow-lg flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div>
                  {/* 1. ETF 요약 정보 영역 헤더 */}
                  <div className="flex justify-between items-center pb-2.5 border-b border-gray-800/40 mb-2 relative z-10">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-cyan-400 text-xs tracking-tight">
                        ★ {item.name} 실시간 추적기
                      </span>
                      <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold rounded bg-black/60 text-gray-400 border border-gray-800">
                        {item.ko_code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500 font-semibold font-mono">
                        KST {lastUpdated}
                      </span>
                      <button 
                        onClick={() => removeFromWatchlist(item.symbol)}
                        className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                        title="지우기"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 상태 배지 & 정보 라벨 */}
                  <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                    <p className="text-[9px] text-gray-500 font-bold">
                      추정 iNAV · 장마감 기준 · 해외지수 추종 (환율 {item.is_hedged ? '제외' : '반영'})
                    </p>
                    
                    {/* 상태 배지 */}
                    {isTradingHours ? (
                      <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/50">
                        대기
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-cyan-950/40 text-cyan-400 border border-cyan-900/50 animate-pulse">
                        장외 실시간 연산 중
                      </span>
                    )}
                  </div>

                  {/* Asset Editing Toggle & Holdings Editor */}
                  <div className="flex justify-between items-center mb-3 relative z-10 gap-2">
                    <span className="text-[9px] text-gray-500 font-semibold">
                      비중: <span className="text-white font-bold">{item.weight}%</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openHoldingsEditor(item.symbol)}
                        className="px-2 py-1 bg-gray-900/80 hover:bg-emerald-950 border border-gray-800 text-[8px] font-black text-emerald-450 hover:text-emerald-400 rounded-lg transition-all flex items-center gap-1"
                        title="ETF 구성 종목 및 비중 동적 편집"
                      >
                        <Sliders className="w-2.5 h-2.5" />
                        종목/비중 설정
                      </button>
                      <button
                        onClick={() => {
                          setEditingSymbol(editingSymbol === item.symbol ? null : item.symbol);
                          setEditWeightValue(item.weight);
                          setEditAvgPrice(item.avg_price);
                          setEditQuantity(item.quantity);
                        }}
                        className="px-2 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-[9px] font-bold text-gray-400 hover:text-white rounded-lg transition-all flex items-center gap-1"
                      >
                        <Settings2 className="w-3 h-3" />
                        자산설정
                      </button>
                    </div>
                  </div>

                  {/* Asset Editor Panel */}
                  {editingSymbol === item.symbol && (
                    <div className="bg-black/60 border border-gray-850 rounded-2xl p-3.5 my-3 text-[9px] space-y-3 relative z-25 animate-in slide-in-from-top-1">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-gray-500 font-bold block mb-1">비중 (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editWeightValue}
                            onChange={(e) => setEditWeightValue(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-white font-bold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-gray-500 font-bold block mb-1">구매 평단가</label>
                          <input
                            type="number"
                            value={editAvgPrice}
                            onChange={(e) => setEditAvgPrice(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-white font-bold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-gray-500 font-bold block mb-1">보유 수량</label>
                          <input
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-white font-bold focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingSymbol(null)}
                          className="px-2 py-1 bg-gray-900 text-gray-400 rounded-lg font-bold"
                        >
                          취소
                        </button>
                        <button 
                          onClick={async () => {
                            const etfInfo = await supabase.from('etf_info').select('id').eq('symbol', item.symbol).single();
                            if (etfInfo.data) handleUpdateAssets(item.symbol, etfInfo.data.id);
                          }}
                          className="px-2 py-1 bg-cyan-600 text-white rounded-lg font-bold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          저장
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mid: 2-Column 요약 변동 및 실시간 가격 정보 */}
                  {hasError ? (
                    <div className="py-4 text-xs text-red-400 flex items-center gap-2 bg-red-950/20 p-3 rounded-2xl border border-red-900/20">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{item.error}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 my-3 p-4 bg-black/40 border border-gray-850 rounded-2xl relative z-10">
                      {/* 좌측 섹션 (포트폴리오 변동) */}
                      <div className="flex flex-col justify-between">
                        <span className="text-[9px] text-gray-500 font-bold leading-tight">
                          포트폴리오 변동 / 국내 구성종목 가중평균 (KRX/NXT)
                        </span>
                        <span className={`text-xl font-black tabular-nums mt-2 ${afterMarketChange >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                          {afterMarketChange >= 0 ? '+' : ''}{afterMarketChange.toFixed(2)}%
                        </span>
                      </div>

                      {/* 우측 섹션 (실시간 가격 추정) */}
                      <div className="flex flex-col items-end text-right">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-[10px] font-bold ${afterMarketChange >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                            종가 대비 {afterMarketChange >= 0 ? '+' : ''}{afterMarketChange.toFixed(2)}%
                          </span>
                        </div>
                        <span className="text-2xl font-black text-amber-400 tracking-tight tabular-nums mt-0.5">
                          {item.estINAV ? Math.round(item.estINAV).toLocaleString('ko-KR') : '---'}원
                        </span>
                        <span className="text-[8px] text-gray-500 mt-1">
                          장 마감 시점 iNAV {item.marketPrice?.toLocaleString('ko-KR')}원 기준
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account / Assets Profit display */}
                {!hasError && item.quantity !== undefined && item.quantity > 0 && (
                  <div className="bg-cyan-950/15 border border-cyan-900/20 rounded-2xl px-3.5 py-2.5 my-2 relative z-10 text-[9px] space-y-1">
                    <div className="flex justify-between text-gray-500 font-semibold">
                      <span>평단가: {item.avg_price?.toLocaleString('ko-KR')}원</span>
                      <span>보유량: {item.quantity?.toLocaleString('ko-KR')}주</span>
                    </div>
                    <div className="flex justify-between text-gray-500 font-semibold">
                      <span>매수: {item.purchaseAmount?.toLocaleString('ko-KR')}원</span>
                      <span className="text-white">평가: {item.estValuation?.toLocaleString('ko-KR')}원</span>
                    </div>
                    <div className="flex justify-between border-t border-cyan-900/20 pt-1.5 mt-1.5">
                      <span className="font-bold text-gray-400">실시간 추정 손익</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-black tabular-nums ${item.estProfit && item.estProfit >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                          {item.estProfit && item.estProfit >= 0 ? '+' : ''}
                          {item.estProfit?.toLocaleString('ko-KR')}원
                        </span>
                        <span className={`font-black tabular-nums px-1.5 py-0.5 rounded text-[8px] ${item.estReturn && item.estReturn >= 0 ? 'bg-red-950/40 text-red-400 border border-red-900/30' : 'bg-blue-950/40 text-blue-400 border border-blue-900/30'}`}>
                          {item.estReturn && item.estReturn >= 0 ? '+' : ''}
                          {item.estReturn?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 반영률 바 (하단 경계) - 아코디언이 열렸을 때 실시간 게이지 표기 */}
                {!hasError && (
                  <div className="mt-3 text-[10px] relative z-10">
                    <div className="flex justify-between items-center mb-1 text-[9px] text-gray-500">
                      <div className="flex gap-2 font-black">
                        <span className="text-red-400">▲ {metrics[item.symbol]?.up ?? 0}종목</span>
                        <span className="text-blue-400">▼ {metrics[item.symbol]?.down ?? 0}종목</span>
                      </div>
                      <span className="font-bold text-gray-400">반영률 {metrics[item.symbol]?.coverage ?? 100}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                      <div 
                        className="h-full bg-cyan-400 rounded-full transition-all duration-500" 
                        style={{ width: `${metrics[item.symbol]?.coverage ?? 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 2. 구성 종목 트리맵 히트맵 영역 타이틀 */}
                {!hasError && (
                  <div className="flex justify-between items-center mt-4 border-t border-gray-850 pt-3 relative z-10">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
                      구성 종목 | 트리맵
                    </span>
                    <button
                      onClick={() => toggleHoldings(item.symbol)}
                      className="px-2 py-1 bg-gray-900 hover:bg-gray-855 border border-gray-800 text-[9px] font-bold text-gray-400 hover:text-white rounded-lg transition-all"
                    >
                      {expandedSymbol === item.symbol ? '접기 ▲' : '펼치기 ▼'}
                    </button>
                  </div>
                )}

                {/* Treemap Heatmap Display */}
                {!hasError && expandedSymbol === item.symbol && (
                  <div className="mt-3 animate-in fade-in duration-300 relative z-20">
                    <EtfTreemap 
                      etfSymbol={item.symbol}
                      underlyingTicker={item.underlying_ticker}
                      isHedged={item.is_hedged}
                      onMetricsUpdate={(up, down, coverage) => handleMetricsUpdate(item.symbol, up, down, coverage)}
                    />
                  </div>
                )}

                {/* Bottom: Details & Discrepancies */}
                {!hasError && item.discrepancyRate !== undefined && (
                  <div className="pt-3 border-t border-gray-800/50 mt-3 relative z-10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-gray-500 font-bold">실시간 괴리율</span>
                      <div className="flex items-center gap-1.5">
                        {isHighDiscrepancy && (
                          <span title="괴리율 주의 단계 (1.5% 초과)">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                          </span>
                        )}
                        <span className={`text-sm font-extrabold tabular-nums ${
                          item.discrepancyRate > 0 
                            ? 'text-red-400' 
                            : item.discrepancyRate < 0 
                            ? 'text-blue-400' 
                            : 'text-gray-400'
                        }`}>
                          {item.discrepancyRate > 0 ? '+' : ''}{item.discrepancyRate.toFixed(3)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] text-gray-500 border-t border-gray-800/30 pt-2 mt-2">
                      <div>
                        <p className="font-semibold text-gray-600">지수선물 변동 (16:00 대비)</p>
                        <span className={`font-bold tabular-nums text-[10px] ${item.underlyingChange && item.underlyingChange >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                          {item.underlyingChange && item.underlyingChange >= 0 ? '+' : ''}
                          {item.underlyingChange?.toFixed(2)}%
                        </span>
                      </div>
                      {!item.is_hedged && (
                        <div className="text-right">
                          <p className="font-semibold text-gray-600">환율 변동 (16:00 대비)</p>
                          <span className={`font-bold tabular-nums text-[10px] ${item.fxChange && item.fxChange >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                            {item.fxChange && item.fxChange >= 0 ? '+' : ''}
                            {item.fxChange?.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Holdings GUI Editor Modal */}
      {isHoldingsModalOpen && editingHoldingsSymbol && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  🛠️ {editingHoldingsSymbol} 구성 종목 및 비중 동적 관리
                </h3>
                <button 
                  onClick={() => setIsHoldingsModalOpen(false)}
                  className="text-gray-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                현재 ETF의 실제 비중과 상이하거나 리밸런싱이 있을 때, 데이터베이스에 등록된 종목과 비중(%)을 실시간으로 직접 수정할 수 있습니다. 
                (상위 10개 외 나머지 비중은 기타 종목군으로 자동 계산됩니다).
              </p>

              {/* Add New Holding Row Block */}
              <div className="bg-gray-900/40 p-4 border border-gray-900 rounded-2xl mb-4 text-xs space-y-3">
                <span className="font-bold text-gray-300 block mb-1">새로운 구성 종목 편입</span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">종목 Ticker</label>
                    <input 
                      type="text" 
                      placeholder="예: RKLB, AAPL"
                      value={newHoldingSymbol}
                      onChange={(e) => setNewHoldingSymbol(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">한글 종목명</label>
                    <input 
                      type="text" 
                      placeholder="예: 로켓랩"
                      value={newHoldingName}
                      onChange={(e) => setNewHoldingName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">설정 비중 (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={newHoldingWeight}
                      onChange={(e) => setNewHoldingWeight(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input 
                      id="new-is-foreign"
                      type="checkbox"
                      checked={newHoldingIsForeign}
                      onChange={(e) => setNewHoldingIsForeign(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="new-is-foreign" className="text-gray-400 font-bold cursor-pointer select-none">
                      해외자산 (선물연동)
                    </label>
                  </div>
                </div>
                <button 
                  onClick={handleAddHoldingRow}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  종목 추가
                </button>
              </div>

              {/* Editable Holdings List Table */}
              <div className="overflow-x-auto border border-gray-900 rounded-2xl">
                <table className="w-full text-left text-xs text-gray-400">
                  <thead className="bg-gray-900/50 text-[10px] uppercase font-bold text-gray-500">
                    <tr>
                      <th className="px-4 py-3">종목 Ticker</th>
                      <th className="px-4 py-3">한글 종목명</th>
                      <th className="px-4 py-3">비중 (%)</th>
                      <th className="px-4 py-3">해외 자산 여부</th>
                      <th className="px-4 py-3 text-right">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {editingHoldingsList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-white">{item.symbol}</td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...editingHoldingsList];
                              updated[idx].name = e.target.value;
                              setEditingHoldingsList(updated);
                            }}
                            className="bg-transparent border-b border-gray-800 focus:border-cyan-500 text-white px-1 py-0.5 focus:outline-none w-28"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" 
                            step="0.01"
                            value={item.weight}
                            onChange={(e) => {
                              const updated = [...editingHoldingsList];
                              updated[idx].weight = Number(e.target.value);
                              setEditingHoldingsList(updated);
                            }}
                            className="bg-transparent border-b border-gray-800 focus:border-cyan-500 text-white px-1 py-0.5 focus:outline-none w-16 font-mono font-bold"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox"
                            checked={item.is_foreign}
                            onChange={(e) => {
                              const updated = [...editingHoldingsList];
                              updated[idx].is_foreign = e.target.checked;
                              setEditingHoldingsList(updated);
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleRemoveHoldingRow(idx)}
                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {editingHoldingsList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500 font-bold">
                          등록된 개별 구성 종목이 없습니다. 상단에서 종목을 새로 편입해 주세요.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-gray-800 pt-4">
              <span className="text-[10px] text-gray-500 font-bold mr-auto self-center">
                설정된 총 비중의 합: {Math.round(editingHoldingsList.reduce((sum, h) => sum + Number(h.weight), 0) * 10) / 10}%
              </span>
              <button 
                onClick={() => setIsHoldingsModalOpen(false)}
                className="px-4 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-all text-xs"
              >
                취소
              </button>
              <button 
                onClick={saveHoldingsChanges}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 text-xs"
              >
                DB 저장 및 즉시 반영
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New ETF Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              🔧 신규 미국 테마 ETF 등록 설정
            </h3>
            
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              야후 금융망에서 처음 추가하는 종목입니다. 실시간 iNAV 추정을 위해 해당 ETF가 추종하는 미국 지수 선물과 세부 옵션을 설정해주세요.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-gray-400 font-bold block mb-1">야후 파이낸스 Ticker</label>
                <input 
                  type="text" 
                  value={modalSymbol} 
                  disabled 
                  className="w-full bg-gray-900 border border-gray-800 text-gray-400 rounded-xl px-3 py-2 cursor-not-allowed focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 font-bold block mb-1">한글 종목명</label>
                  <input 
                    type="text" 
                    value={modalName} 
                    onChange={(e) => setModalName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 focus:border-cyan-500/50 focus:outline-none"
                    placeholder="예: ACE 미국우주항공액티브"
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-bold block mb-1">국내 종목코드</label>
                  <input 
                    type="text" 
                    value={modalKoCode} 
                    onChange={(e) => setModalKoCode(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 focus:border-cyan-500/50 focus:outline-none"
                    placeholder="예: 0180V0"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 font-bold block mb-1">KRX 표준 ISIN 코드 (자동 동기화용)</label>
                <input 
                  type="text" 
                  value={modalIsinCode} 
                  onChange={(e) => setModalIsinCode(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 focus:border-cyan-500/50 focus:outline-none font-mono"
                  placeholder="예: KR70180V0001"
                />
              </div>

              <div>
                <label className="text-gray-400 font-bold block mb-1">연동 기초자산 (야간 미국 지수 선물)</label>
                <select
                  value={modalUnderlying}
                  onChange={(e) => setModalUnderlying(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 focus:border-cyan-500/50 focus:outline-none cursor-pointer"
                >
                  <option value="NQ=F">나스닥 100 선물 (NQ=F) - 기술주/빅테크/우주항공</option>
                  <option value="ES=F">S&P 500 선물 (ES=F) - 미국 대형주/종합</option>
                  <option value="SOXX">필라델피아 반도체 지수 (SOXX) - 반도체/하드웨어</option>
                  <option value="YM=F">다우존스 30 선물 (YM=F) - 전통 가치주</option>
                  <option value="RTY=F">러셀 2000 선물 (RTY=F) - 중소형주</option>
                </select>
              </div>

              <div className="flex items-center gap-4 bg-gray-900/40 p-3 border border-gray-900 rounded-2xl">
                <div className="flex items-center gap-2">
                  <input 
                    id="modal-hedge"
                    type="checkbox" 
                    checked={modalIsHedged}
                    onChange={(e) => setModalIsHedged(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="modal-hedge" className="text-gray-300 font-bold cursor-pointer select-none">
                    환헤지형 상품인가요? (H)
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-gray-800/40 pt-3">
                <div>
                  <label className="text-gray-400 font-bold block mb-1">비중 (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={modalWeight} 
                    onChange={(e) => setModalWeight(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-bold block mb-1">구매 평단가 (선택)</label>
                  <input 
                    type="number" 
                    value={modalAvgPrice} 
                    onChange={(e) => setModalAvgPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 focus:border-cyan-500/50 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-bold block mb-1">보유 수량 (선택)</label>
                  <input 
                    type="number" 
                    value={modalQuantity} 
                    onChange={(e) => setModalQuantity(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 focus:border-cyan-500/50 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-all"
              >
                취소
              </button>
              <button 
                onClick={saveNewEtf}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20"
              >
                저장 및 연동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-8 pt-4 border-t border-gray-800/40 text-[10px] text-gray-600 font-semibold">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-gray-700" />
          최종 연산 시각: {lastUpdated || '불러오는 중...'} (KST)
        </span>
        <span>
          * 본 데이터는 야후 파이낸스 실시간 선물/환율 데이터를 통해 가공된 추정치로, 실제 자산 운용사 iNAV와 오차가 발생할 수 있습니다.
        </span>
      </div>
    </div>
  );
}
