'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  RiSearchLine, 
  RiAddLine, 
  RiCloseLine, 
  RiStarFill, 
  RiStockLine, 
  RiArrowUpSLine, 
  RiArrowDownSLine,
  RiDeleteBin7Line
} from 'react-icons/ri';
import MarketAnalysisWidget from './MarketAnalysisWidget';

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  current_price?: number;
  change_percent?: number;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export default function WatchlistSection({ userId }: { userId: string }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<WatchlistItem | null>(null);
  
  const supabase = createClient();

  const fetchWatchlist = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist:', error);
    } else {
      // Fetch current prices for each item
      const itemsWithPrice = await Promise.all((data || []).map(async (item) => {
        try {
          const res = await fetch(`/api/market?symbol=${encodeURIComponent(item.symbol)}&interval=1d&range=5d`);
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            const last = json.data[json.data.length - 1].close;
            const prev = json.data[json.data.length - 2]?.close || last;
            const change = ((last - prev) / prev) * 100;
            return { ...item, current_price: last, change_percent: change };
          }
        } catch (err) {
          console.error(`Price fetch failed for ${item.symbol}`, err);
        }
        return item;
      }));
      setWatchlist(itemsWithPrice);
    }
    setIsLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(searchQuery)}`);
      const json = await res.json();
      setSearchResults(json.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addToWatchlist = async (result: SearchResult) => {
    const { error } = await supabase
      .from('watchlists')
      .insert({
        user_id: userId,
        symbol: result.symbol,
        name: result.name
      });

    if (error) {
      if (error.code === '23505') alert('이미 추가된 종목입니다.');
      else console.error('Add failed:', error);
    } else {
      setSearchQuery('');
      setSearchResults([]);
      fetchWatchlist();
    }
  };

  const removeFromWatchlist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('id', id);

    if (error) console.error('Delete failed:', error);
    else fetchWatchlist();
  };

  return (
    <div className="flex flex-col gap-6 mt-8">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-cyan-500 rounded-full"></div>
          <h2 className="text-2xl font-black text-white">관심 종목 분석</h2>
        </div>
        
        <div className="relative group max-w-md w-full">
          <input
            type="text"
            placeholder="주식, ETF 검색 (예: AAPL, 삼성전자...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-gray-900/60 border border-gray-800 rounded-2xl px-12 py-3 text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
          />
          <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
          {searchQuery && (
            <button 
              onClick={handleSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-cyan-500 hover:text-cyan-300 transition-colors"
            >
              {isSearching ? '검색 중...' : '검색'}
            </button>
          )}
          
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="max-h-60 overflow-y-auto no-scrollbar">
                {searchResults.map((res) => (
                  <div 
                    key={res.symbol}
                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div>
                      <p className="font-bold text-white text-sm">{res.symbol}</p>
                      <p className="text-xs text-gray-500">{res.name} ({res.exchange})</p>
                    </div>
                    <button 
                      onClick={() => addToWatchlist(res)}
                      className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500 hover:text-white transition-all"
                    >
                      <RiAddLine />
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-2 bg-black/40 text-center">
                <button onClick={() => setSearchResults([])} className="text-[10px] text-gray-600 font-bold hover:text-gray-400">닫기</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Watchlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-gray-900/40 border border-gray-800 rounded-3xl animate-pulse"></div>
          ))
        ) : watchlist.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl text-gray-600">
            <RiStarFill className="text-4xl mb-3 opacity-20" />
            <p className="text-sm font-bold">아직 관심 종목이 없습니다.</p>
            <p className="text-xs opacity-60 mt-1">상단 검색창을 이용해 종목을 추가해 보세요.</p>
          </div>
        ) : (
          watchlist.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedSymbol(item)}
              className="group relative bg-gray-900/40 border border-gray-800 rounded-3xl p-5 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg"
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
                  <RiStockLine className="text-xl text-cyan-400" />
                </div>
                <button 
                  onClick={(e) => removeFromWatchlist(item.id, e)}
                  className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <RiDeleteBin7Line />
                </button>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-lg font-black text-white tracking-tighter truncate">{item.name || item.symbol}</h3>
                <p className="text-xs text-gray-500 font-bold mb-3">{item.symbol}</p>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white tabular-nums">
                    {item.current_price ? item.current_price.toLocaleString() : '---'}
                  </span>
                  {item.change_percent !== undefined && (
                    <span className={`text-xs font-black flex items-center ${item.change_percent >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                      {item.change_percent >= 0 ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
                      {Math.abs(item.change_percent).toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))
        )}
      </div>

      {/* Analysis Modal */}
      {selectedSymbol && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl shadow-2xl border border-white/10 bg-gray-950">
            <button 
              onClick={() => setSelectedSymbol(null)}
              className="absolute right-6 top-6 z-[110] p-2 bg-gray-900 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all shadow-xl"
            >
              <RiCloseLine className="text-2xl" />
            </button>
            
            <div className="p-0 sm:p-2">
              <MarketAnalysisWidget 
                symbol={selectedSymbol.symbol} 
                title={selectedSymbol.name || selectedSymbol.symbol}
                isFX={selectedSymbol.symbol.endsWith('=X')}
                onClose={() => setSelectedSymbol(null)}
              />
            </div>
            
            <div className="p-6 bg-black/40 text-center">
              <p className="text-[10px] text-gray-600 font-bold">
                * 위 데이터는 Yahoo Finance 실시간 시세를 기반으로 합니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
