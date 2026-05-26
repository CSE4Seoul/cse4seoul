'use client';

import React, { useState, useEffect } from 'react';
import { wasmService } from '@/lib/wasm-service';
import { Zap, AlertCircle, Search, TrendingUp, BarChart3, ShieldCheck } from 'lucide-react';

interface AnalysisResult {
  grahamPrice: number;
  fScore: number;
  buffettScore: number;
  roe: number;
  debtToEquity: number;
}

interface FinancialData {
  price: number;
  eps: number;
  revenue: number;
  netIncome: number;
  totalAssets: number;
  equity: number;
  [key: string]: any;
}

const FEATURED_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK-B'];

export default function ValueScoreWidget() {
  const [symbol, setSymbol] = useState('');
  const [currentData, setCurrentData] = useState<FinancialData | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndAnalyze = async (ticker: string) => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await fetch(`/api/market/fundamentals?symbol=${ticker.toUpperCase()}`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || '데이터를 가져오는데 실패했습니다.');
      }
      
      const financialData = await res.json();
      setCurrentData(financialData);
      
      const analysisResult = await wasmService.scoreValueInvestment(financialData);
      if (analysisResult) {
        setResult(analysisResult);
      } else {
        setError('Wasm 분석 엔진 연산 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '분석 중 오류가 발생했습니다.');
      setCurrentData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAndAnalyze(symbol);
  };

  return (
    <div className="p-8 bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-3xl hover:border-blue-500/30 transition-all duration-500 shadow-2xl my-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
            <BarChart3 className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">C++ Value Quant Engine</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">WebAssembly Real-time Valuation</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative flex-1 max-w-md group">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="티커 입력 (예: AAPL, TSLA...)"
            className="w-full bg-black/40 border border-gray-800 rounded-2xl px-12 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors w-4 h-4" />
          <button 
            type="submit"
            disabled={loading || !symbol}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-all"
          >
            ANALYZE
          </button>
        </form>
      </div>

      <div className="relative z-10 mb-8">
        <h3 className="text-[10px] font-black text-gray-600 mb-3 uppercase tracking-[0.2em]">Featured Discoveries</h3>
        <div className="flex flex-wrap gap-2">
          {FEATURED_TICKERS.map(ticker => (
            <button
              key={ticker}
              onClick={() => { setSymbol(ticker); fetchAndAnalyze(ticker); }}
              className="px-4 py-2 bg-white/5 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 rounded-xl text-xs font-bold text-gray-400 hover:text-blue-300 transition-all"
            >
              ${ticker}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 w-4 h-4 animate-pulse" />
          </div>
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Consulting C++ Engine...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/10 text-red-400 rounded-2xl border border-red-900/20 mb-6 flex items-center gap-3 text-sm animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {!loading && !result && !error && (
        <div className="py-12 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-3xl opacity-50">
          <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-bold">분석할 티커를 입력하거나 추천 목록에서 선택하세요.</p>
          <p className="text-[10px] uppercase mt-2">Real-time financial statement analysis powered by C++</p>
        </div>
      )}

      {result && currentData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
                <span className="text-xl font-black text-white">{symbol.toUpperCase().slice(0, 2)}</span>
              </div>
              <div>
                <div className="text-3xl font-black text-white tracking-tighter">${currentData.price.toLocaleString()}</div>
                <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{symbol.toUpperCase()} MARKET VALUE</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-black ${result.grahamPrice > currentData.price ? 'text-green-400' : 'text-gray-400'}`}>
                {result.grahamPrice > 0 
                  ? `${((result.grahamPrice / currentData.price - 1) * 100).toFixed(1)}%`
                  : 'N/A'}
              </div>
              <div className="text-[10px] text-gray-500 font-black uppercase">Upside Potential</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
              <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">EPS (TTM)</div>
              <div className="text-lg font-black text-white">${currentData.eps.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
              <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">Book Value (BPS)</div>
              <div className="text-lg font-black text-white">${currentData.bps.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
              <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">ROE</div>
              <div className="text-lg font-black text-white">{result.roe.toFixed(1)}%</div>
            </div>
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
              <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">Debt/Equity</div>
              <div className="text-lg font-black text-white">{result.debtToEquity.toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-green-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Graham Fair Price</div>
                <ShieldCheck className="w-4 h-4 text-green-500/50 group-hover:text-green-400 transition-colors" />
              </div>
              <div className="text-3xl font-black text-green-400 tabular-nums">${result.grahamPrice.toFixed(2)}</div>
              <p className="text-[9px] text-gray-600 mt-2 font-medium">벤자민 그레이엄 공식 기반 내재 가치</p>
            </div>

            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Piotroski F-Score</div>
                <Zap className="w-4 h-4 text-yellow-500/50 group-hover:text-yellow-400 transition-colors" />
              </div>
              <div className="text-3xl font-black text-yellow-400 tabular-nums">{result.fScore} <span className="text-sm text-gray-600">/ 9</span></div>
              <p className="text-[9px] text-gray-600 mt-2 font-medium">9가지 재무 건전성 지표 합산 점수</p>
            </div>

            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Buffett Filter</div>
                <TrendingUp className="w-4 h-4 text-purple-500/50 group-hover:text-purple-400 transition-colors" />
              </div>
              <div className="text-3xl font-black text-purple-400 tabular-nums">{result.buffettScore} <span className="text-sm text-gray-600">/ 3</span></div>
              <p className="text-[9px] text-gray-600 mt-2 font-medium">워렌 버핏 스타일 우량주 필터링</p>
            </div>
          </div>

          <div className="p-8 bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden">
            <h4 className="text-[10px] font-black text-gray-500 mb-6 uppercase tracking-[0.3em] flex items-center gap-2">
              <BarChart3 className="w-3 h-3" /> Fundamental Efficiency
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-gray-400 font-bold">Return on Equity (ROE)</span>
                  <span className={`text-lg font-black ${result.roe >= 15 ? 'text-green-400' : 'text-red-400'}`}>{result.roe.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${result.roe >= 15 ? 'bg-green-500' : 'bg-red-500'} transition-all duration-1000`} style={{ width: `${Math.min(100, result.roe)}%` }} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-gray-400 font-bold">Debt to Equity Ratio</span>
                  <span className={`text-lg font-black ${result.debtToEquity <= 50 ? 'text-green-400' : 'text-red-400'}`}>{result.debtToEquity.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${result.debtToEquity <= 50 ? 'bg-green-500' : 'bg-red-500'} transition-all duration-1000`} style={{ width: `${Math.min(100, result.debtToEquity)}%` }} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
            <p className="text-[10px] text-yellow-500/70 leading-relaxed text-center">
              ⚠️ 본 분석은 실시간 재무제표를 C++ 엔진으로 연산한 결과이며, 투자 추천이 아닙니다. 상장사의 공시 시점에 따라 데이터의 시차가 발생할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
