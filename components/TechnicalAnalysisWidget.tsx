'use client';

import React, { useState, useEffect } from 'react';
import { wasmService } from '@/lib/wasm-service';
import { 
  Zap, 
  AlertCircle, 
  Search, 
  TrendingUp, 
  BarChart3, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Gauge,
  Layers,
  Target
} from 'lucide-react';

interface TechnicalResult {
  ma5: number;
  ma20: number;
  ma60: number;
  ma120: number;
  ema12: number;
  ema26: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  bbUpper: number;
  bbLower: number;
  bbMiddle: number;
  atr: number;
  technicalScore: number;
  trendScore: number;
  volatilityScore: number;
  volumeScore: number;
  fearGreedScore: number;
  trendState: string;
  marketSentiment: string;
  supportLevels: number[];
  resistanceLevels: number[];
}

const STRATEGIES = [
  { id: 0, name: 'Conservative Value', icon: ShieldCheck, color: 'text-blue-400' },
  { id: 1, name: 'Growth Momentum', icon: TrendingUp, color: 'text-green-400' },
  { id: 2, name: 'Swing Trading', icon: Activity, color: 'text-yellow-400' },
  { id: 3, name: 'AI Momentum', icon: Zap, color: 'text-purple-400' },
];

const FEATURED_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'BTC-USD', 'ETH-USD', 'QQQ', 'SPY'];

export default function TechnicalAnalysisWidget() {
  const [symbol, setSymbol] = useState('');
  const [strategyMode, setStrategyMode] = useState(0);
  const [result, setResult] = useState<TechnicalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const fetchAndAnalyze = async (ticker: string, mode: number = strategyMode) => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await fetch(`/api/market?symbol=${ticker.toUpperCase()}&range=1y&interval=1d`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || '데이터를 가져오는데 실패했습니다.');
      }
      
      const marketData = await res.json();
      if (!marketData.data || marketData.data.length < 120) {
        throw new Error('분석을 위한 충분한 데이터(최소 120일)가 없습니다.');
      }

      setCurrentPrice(marketData.currentValue);
      
      const analysisResult = await wasmService.analyzeTechnical(marketData.data, mode);
      if (analysisResult) {
        setResult(analysisResult);
      } else {
        setError('Wasm 분석 엔진 연산 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAndAnalyze(symbol);
  };

  const handleStrategyChange = (mode: number) => {
    setStrategyMode(mode);
    if (symbol) {
      fetchAndAnalyze(symbol, mode);
    }
  };

  return (
    <div className="p-8 bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-3xl hover:border-blue-500/30 transition-all duration-500 shadow-2xl my-8 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
            <Activity className="text-purple-400 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Technical Trading Engine</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">WASM Multi-Strategy Analysis</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative flex-1 max-w-md group">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="티커 입력 (예: AAPL, BTC-USD...)"
            className="w-full bg-black/40 border border-gray-800 rounded-2xl px-12 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all text-white"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors w-4 h-4" />
          <button 
            type="submit"
            disabled={loading || !symbol}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-all"
          >
            ANALYZE
          </button>
        </form>
      </div>

      <div className="relative z-10 mb-8">
        <h3 className="text-[10px] font-black text-gray-600 mb-4 uppercase tracking-[0.2em]">Investment Strategy</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STRATEGIES.map(strategy => (
            <button
              key={strategy.id}
              onClick={() => handleStrategyChange(strategy.id)}
              className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                strategyMode === strategy.id 
                ? 'bg-purple-600/20 border-purple-500/50 text-white' 
                : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
              }`}
            >
              <strategy.icon className={`w-4 h-4 ${strategyMode === strategy.id ? strategy.color : ''}`} />
              <span className="text-[11px] font-bold">{strategy.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 mb-8">
        <h3 className="text-[10px] font-black text-gray-600 mb-3 uppercase tracking-[0.2em]">Quick Access</h3>
        <div className="flex flex-wrap gap-2">
          {FEATURED_TICKERS.map(ticker => (
            <button
              key={ticker}
              onClick={() => { setSymbol(ticker); fetchAndAnalyze(ticker); }}
              className="px-4 py-2 bg-white/5 hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/30 rounded-xl text-xs font-bold text-gray-400 hover:text-purple-300 transition-all"
            >
              ${ticker}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400 w-4 h-4 animate-pulse" />
          </div>
          <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Processing Technical Indicators...</p>
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
          <Layers className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-bold">기술적 분석을 위해 티커를 입력하세요.</p>
          <p className="text-[10px] uppercase mt-2">Trend, Momentum, Volatility & Sentiment Analysis</p>
        </div>
      )}

      {result && currentPrice && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header Summary */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 p-6 bg-purple-600/10 border border-purple-500/20 rounded-3xl flex items-center justify-between">
              <div>
                <div className="text-3xl font-black text-white tracking-tighter">${currentPrice.toLocaleString()}</div>
                <div className="text-[10px] text-purple-400 font-black uppercase tracking-widest">{symbol.toUpperCase()} PRICE</div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-black ${result.technicalScore >= 60 ? 'text-green-400' : result.technicalScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {result.technicalScore.toFixed(0)} <span className="text-sm">/ 100</span>
                </div>
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Technical Score</div>
              </div>
            </div>

            <div className="flex-1 p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between">
              <div>
                <div className={`text-xl font-black uppercase tracking-tight ${
                  result.marketSentiment.includes('Greed') ? 'text-green-400' : 
                  result.marketSentiment.includes('Fear') ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {result.marketSentiment}
                </div>
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Market Sentiment (F&G)</div>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center relative overflow-hidden">
                <div 
                  className={`absolute inset-0 opacity-20 ${
                    result.fearGreedScore > 60 ? 'bg-green-500' : 
                    result.fearGreedScore < 40 ? 'bg-red-500' : 'bg-yellow-500'
                  }`} 
                  style={{ height: `${result.fearGreedScore}%`, top: 'auto' }}
                />
                <Gauge className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Main Indicators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Trend Card */}
            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Trend Status</div>
                <TrendingUp className="w-4 h-4 text-purple-400/50" />
              </div>
              <div className={`text-2xl font-black mb-2 ${
                result.trendState.includes('Strong Bullish') ? 'text-green-400' : 
                result.trendState.includes('Bullish') ? 'text-green-500/80' : 
                result.trendState.includes('Bearish') ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {result.trendState}
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">MA 5 vs 20</span>
                  <span className={result.ma5 > result.ma20 ? 'text-green-400' : 'text-red-400'}>
                    {result.ma5 > result.ma20 ? 'Golden' : 'Death'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Above 200MA</span>
                  <span className={currentPrice > result.ma120 ? 'text-green-400' : 'text-red-400'}>
                    {currentPrice > result.ma120 ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Momentum Card */}
            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Momentum (RSI)</div>
                <Zap className="w-4 h-4 text-blue-400/50" />
              </div>
              <div className="text-4xl font-black text-blue-400 mb-2">
                {result.rsi.toFixed(1)}
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-4 relative">
                <div className="absolute left-[30%] right-[30%] inset-y-0 border-x border-white/10" />
                <div 
                  className={`h-full transition-all duration-1000 ${
                    result.rsi > 70 ? 'bg-red-500' : result.rsi < 30 ? 'bg-green-500' : 'bg-blue-500'
                  }`} 
                  style={{ width: `${result.rsi}%` }} 
                />
              </div>
              <div className="flex justify-between text-[9px] mt-2 text-gray-500 font-bold">
                <span>OVERSOLD</span>
                <span>NEUTRAL</span>
                <span>OVERBOUGHT</span>
              </div>
            </div>

            {/* Support/Resistance Card */}
            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Key Levels</div>
                <Target className="w-4 h-4 text-yellow-400/50" />
              </div>
              <div className="space-y-3">
                {result.resistanceLevels.slice(0, 1).map((lvl, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-[10px] text-red-400 font-black">RESISTANCE</span>
                    <span className="text-sm font-black text-white">${lvl.toLocaleString()}</span>
                  </div>
                ))}
                <div className="py-1 border-y border-white/5 flex justify-between items-center">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">CURRENT</span>
                  <span className="text-sm font-black text-purple-400">${currentPrice.toLocaleString()}</span>
                </div>
                {result.supportLevels.slice(0, 1).map((lvl, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-[10px] text-green-400 font-black">SUPPORT</span>
                    <span className="text-sm font-black text-white">${lvl.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
              <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">BB Width (Vol)</div>
              <div className="text-lg font-black text-white">{((result.bbUpper - result.bbLower) / result.bbMiddle * 100).toFixed(1)}%</div>
            </div>
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
              <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">MACD Hist</div>
              <div className={`text-lg font-black ${result.macdHist > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {result.macdHist > 0 ? '+' : ''}{result.macdHist.toFixed(2)}
              </div>
            </div>
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
              <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">ATR (Daily Range)</div>
              <div className="text-lg font-black text-white">${result.atr.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
              <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">Volume Score</div>
              <div className="text-lg font-black text-white">{result.volumeScore.toFixed(1)}</div>
            </div>
          </div>

          {/* Strategy Summary */}
          <div className="p-8 bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <STRATEGIES[strategyMode].icon className="w-24 h-24" />
            </div>
            <h4 className="text-[10px] font-black text-gray-500 mb-6 uppercase tracking-[0.3em] flex items-center gap-2">
              <ArrowUpRight className="w-3 h-3" /> Strategy Recommendation: {STRATEGIES[strategyMode].name}
            </h4>
            
            <div className="relative z-10">
              {result.technicalScore >= 70 ? (
                <div className="space-y-2">
                  <p className="text-xl font-black text-green-400">Strong Buy / Bullish Continuation</p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    이평선 정배열과 강한 거래량이 확인됩니다. MACD가 양의 영역에 있으며 RSI가 아직 과열권이 아닙니다. 
                    지지선 ${result.supportLevels[0].toFixed(2)} 근처에서 매수 유효하며, 목표가는 저항선 ${result.resistanceLevels[0].toFixed(2)}입니다.
                  </p>
                </div>
              ) : result.technicalScore >= 50 ? (
                <div className="space-y-2">
                  <p className="text-xl font-black text-yellow-400">Neutral / Accumulation Zone</p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    추세가 아직 명확하지 않거나 박스권 횡보 중입니다. 주요 지지선에서의 반등을 확인하거나 
                    저항선 돌파 시 진입하는 것이 유리합니다. 변동성(ATR)이 낮아지는 구간입니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xl font-black text-red-400">Caution / Bearish Signal</p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    주요 이평선을 이탈했거나 데드크로스가 발생했습니다. RSI 과열 이후 조정이 진행 중일 수 있습니다. 
                    추가 하락 리스크가 있으므로 관망하거나 하단 지지선 ${result.supportLevels[1].toFixed(2)}까지 대기하세요.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
            <p className="text-[10px] text-purple-500/70 leading-relaxed text-center">
              ⚠️ 본 분석은 C++ 기술적 분석 엔진으로 연산한 수치이며 투자 결과에 책임을 지지 않습니다. 트레이딩 시 반드시 본인의 리스크 원칙을 지키시기 바랍니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
