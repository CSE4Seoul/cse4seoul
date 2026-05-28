'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { 
  RiExchangeLine, 
  RiArrowUpSLine, 
  RiArrowDownSLine, 
  RiTimeLine,
  RiLineChartLine,
  RiPulseLine,
  RiInformationLine
} from 'react-icons/ri';
import { wasmService } from '@/lib/wasm-service';

interface DataPoint {
  date: string;
  value: number | null;
  volume?: number;
  regression?: number;
  regressionGap?: number;
  ma5?: number;
  ma20?: number;
  ma60?: number;
  ma120?: number;
}

type Period = '1D' | '1W' | '1M' | '3M' | 'CUSTOM' | 'STANDARD';

interface AnalysisResult {
  score: number;
  judgment: string;
  reasons: string[];
  strength: number;
  risks: string[];
}

interface MarketAnalysisWidgetProps {
  symbol: string;
  title: string;
  isFX?: boolean; // For styling and analysis weighting (0 for Stock, 1 for FX)
  onClose?: () => void;
}

export default function MarketAnalysisWidget({ symbol, title, isFX = false, onClose }: MarketAnalysisWidgetProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [change, setChange] = useState<{ value: number; percent: number } | null>(null);
  const [regressionChange, setRegressionChange] = useState<{ value: number; percent: number } | null>(null);
  const [period, setPeriod] = useState<Period>('1W');
  const [customDays, setCustomDays] = useState<number>(14);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegression, setShowRegression] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const calculateRegression = useCallback((pts: DataPoint[]) => {
    const n = pts.length;
    if (n < 2) return pts.map(p => ({ ...p, regression: p.value || 0, regressionGap: 0 }));

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += pts[i].value || 0;
      sumXY += i * (pts[i].value || 0);
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return pts.map((p, i) => {
      const regValue = slope * i + intercept;
      return {
        ...p,
        regression: regValue,
        regressionGap: p.value !== null ? ((p.value - regValue) / regValue) * 100 : 0,
      };
    });
  }, []);

  const calculateAnalysis = useCallback((pts: DataPoint[]) => {
    if (pts.length < 100) return null;

    const values = pts.map(p => p.value || 0);
    const volumes = pts.map(p => p.volume || 0);
    const n = pts.length;

    const getMA = (data: number[], period: number) => {
      const actualPeriod = Math.min(period, data.length);
      const slice = data.slice(data.length - actualPeriod);
      return slice.reduce((a, b) => a + b, 0) / actualPeriod;
    };

    const getSlope = (data: number[], period: number) => {
      const actualPeriod = Math.min(period, data.length - 1);
      if (actualPeriod < 1) return 0;
      const current = getMA(data, actualPeriod);
      const prev = getMA(data.slice(0, data.length - 1), actualPeriod);
      return current - prev;
    };

    const calculateRSI = (data: number[], period: number = 14) => {
      if (data.length <= period) return 50;
      let gain = 0;
      let loss = 0;
      for (let i = data.length - period; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        if (diff >= 0) gain += diff;
        else loss -= diff;
      }
      if (loss === 0) return 100;
      const rs = (gain / period) / (loss / period);
      return 100 - (100 / (1 + rs));
    };

    const calculateStdDev = (data: number[], period: number, mean: number) => {
      const actualPeriod = Math.min(period, data.length);
      const slice = data.slice(data.length - actualPeriod);
      const sqDiffs = slice.map(v => Math.pow(v - mean, 2));
      return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / actualPeriod);
    };

    const ma5 = getMA(values, 5);
    const ma20 = getMA(values, 20);
    const ma60 = getMA(values, 60);
    const ma120 = getMA(values, 120);
    const s20 = getSlope(values, 20);
    const rsi = calculateRSI(values, 14);
    
    const stdDev = calculateStdDev(values, 20, ma20);
    const bbUpper = ma20 + (stdDev * 2);
    const bbLower = ma20 - (stdDev * 2);

    let score = 0;
    const reasons: string[] = [];
    const risks: string[] = [];

    if (ma5 > ma20 && ma20 > ma60 && ma60 > ma120) {
      score += 3;
      reasons.push('강한 정배열 ($5 > 20 > 60 > 120$): 장기적인 우상향 흐름이 매우 뚜렷함 (+3)');
    } else if (ma5 < ma20 && ma20 < ma60 && ma60 < ma120) {
      score -= 3;
      reasons.push('강한 역배열 ($5 < 20 < 60 < 120$): 하락 추세가 강력하게 형성됨 (-3)');
    }

    let goldenCross = false;
    let deadCross = false;
    for (let i = 0; i < 3; i++) {
      const v = values.slice(0, n - i);
      const m5 = getMA(v, 5);
      const m20 = getMA(v, 20);
      const prevV = values.slice(0, n - i - 1);
      const pm5 = getMA(prevV, 5);
      const pm20 = getMA(prevV, 20);
      if (pm5 <= pm20 && m5 > m20) goldenCross = true;
      if (pm5 >= pm20 && m5 < m20) deadCross = true;
    }

    if (goldenCross) {
      const crossScore = s20 > 0 ? 2 : 1;
      score += crossScore;
      reasons.push(`골든크로스 확인: 최근 3봉 이내 단기 이평선 상향 돌파 (${crossScore === 2 ? '신뢰도 높음' : '기울기 보수적'}) (+${crossScore})`);
    } else if (deadCross) {
      const crossScore = s20 < 0 ? 2 : 1;
      score -= crossScore;
      reasons.push(`데드크로스 확인: 최근 3봉 이내 단기 이평선 하향 이탈 (${crossScore === 2 ? '신뢰도 높음' : '기울기 보수적'}) (-${crossScore})`);
    }

    const s5 = getSlope(values, 5);
    const s60 = getSlope(values, 60);
    const s120 = getSlope(values, 120);

    if (s5 > 0 && s20 > 0 && s60 > 0 && s120 > 0) {
      score += 2;
      reasons.push('기울기 동조 (양수): 모든 기간의 이평선이 우상향하며 추세 강화 (+2)');
    } else if (s5 < 0 && s20 < 0 && s60 < 0 && s120 < 0) {
      score -= 2;
      reasons.push('기울기 동조 (음수): 모든 기간의 이평선이 우하향하며 하락 압력 가중 (-2)');
    }

    if (rsi >= 70) {
      score -= 2;
      reasons.push(`RSI 과매수 경고 (${rsi.toFixed(1)}): 단기 고점 과열 상태로 인한 조정 가능성 반영 (-2)`);
    } else if (rsi <= 30) {
      score += 2;
      reasons.push(`RSI 과매도 신호 (${rsi.toFixed(1)}): 기술적 반등이 기대되는 낙폭 과대 구간 (+2)`);
    }

    const current = values[n - 1];
    if (current > bbUpper) {
      score -= 1;
      reasons.push('볼린저 밴드 상단 돌파: 통계적 변동 범위를 넘어선 일시적 오버슈팅 (-1)');
      risks.push('현재가가 볼린저 밴드 상단을 돌파했습니다. 단기 과열에 따른 차익 실현 매물 출회에 주의하십시오.');
    } else if (current < bbLower) {
      score += 1;
      reasons.push('볼린저 밴드 하단 이탈: 통계적 저점 구간 진입으로 인한 저가 매수 유효 (+1)');
      risks.push('현재가가 볼린저 밴드 하단을 하향 이탈했습니다. 투매에 의한 언더슈팅 가능성이 있으나 분할 매수 관점은 유효합니다.');
    }

    const volMA20 = getMA(volumes, 20);
    const currentVol = volumes[n - 1];
    const volChange = volMA20 > 0 ? (currentVol / volMA20) * 100 : 0;

    if (!isFX) {
      if (volChange >= 150) {
        if (current > values[n - 2]) {
          score += 1;
          reasons.push(`거래량 폭발 (20일 평균 대비 ${volChange.toFixed(0)}%): 상승 신뢰도 대폭 향상 (+1)`);
        } else {
          score -= 1;
          reasons.push(`거래량 폭발 (매도세): 가격 하락과 동반된 투매 현상 발생 (-1)`);
        }
      }
    } else {
      if (s60 > 0 && s120 > 0) {
        score += 1;
        reasons.push('FX 장기 추세 가산점: 60/120일 선의 견고한 우상향 유지 (+1)');
      }
      if (current > ma60 && current > ma120) {
        score += 1;
        reasons.push('FX 장기 지지 가산점: 장기 이평선 상단에서의 안정적 흐름 (+1)');
      }
    }

    if (score >= 3 && s5 < 0) {
      risks.push('전체 점수는 긍정적이나 초단기(5일) 기울기가 꺾였습니다. 단기 눌림목 형성을 확인하고 진입하는 것이 안전합니다.');
    }

    let judgment = '관망 (Hold)';
    if (score >= 6) judgment = '적극 매수 (Strong Buy)';
    else if (score >= 3) judgment = '매수 (Buy)';
    else if (score <= -6) judgment = '적극 매도 (Strong Sell)';
    else if (score <= -3) judgment = '매도 (Sell)';

    return {
      score,
      judgment,
      reasons,
      strength: Math.min(100, Math.max(0, (score + 9) * 5.5)),
      risks
    };
  }, [isFX]);

  const processFormattedData = useCallback(async (formattedData: DataPoint[]) => {
    if (formattedData.length > 0) {
      const prices = formattedData.map(d => d.value || 0);
      const volumes = formattedData.map(d => d.volume || 0);
      const marketTypeInt = isFX ? 1 : 0;
      
      const wasmScore = await wasmService.analyzeMarketWasm(prices, volumes, marketTypeInt);
      const jsAnalysis = calculateAnalysis(formattedData);
      
      if (wasmScore !== null && jsAnalysis) {
        setAnalysisResult({
          ...jsAnalysis,
          score: wasmScore,
          judgment: wasmScore >= 6 ? '적극 매수 (Strong Buy)' : 
                    wasmScore >= 3 ? '매수 (Buy)' : 
                    wasmScore <= -6 ? '적극 매도 (Strong Sell)' : 
                    wasmScore <= -3 ? '매도 (Sell)' : '관망 (Hold)',
          strength: Math.min(100, Math.max(0, (wasmScore + 9) * 5.5))
        });
      } else {
        setAnalysisResult(jsAnalysis);
      }

      const targetCount = period === '1D' ? 24 : period === '1W' ? 120 : period === '1M' ? 30 : period === '3M' ? 90 : period === 'STANDARD' ? 300 : customDays;
      const displayData = showAnalysis ? formattedData.slice(-targetCount) : formattedData;

      const values = displayData.map(d => d.value).filter((v): v is number => v !== null);
      const last = values[values.length - 1];
      const first = values[0];
      setCurrentValue(last);
      
      const diff = last - first;
      const percent = (diff / first) * 100;
      setChange({ value: diff, percent });
      
      const dataWithRegression = calculateRegression(displayData);
      setData(dataWithRegression);

      const lastPoint = dataWithRegression[dataWithRegression.length - 1];
      if (lastPoint.value !== null && lastPoint.regression !== undefined) {
        const regDiff = lastPoint.value - lastPoint.regression;
        const regPercent = (regDiff / lastPoint.regression) * 100;
        setRegressionChange({ value: regDiff, percent: regPercent });
      }
    }
  }, [calculateAnalysis, calculateRegression, isFX, period, showAnalysis, customDays]);

  const fetchMarketData = useCallback(async () => {
    if (showAnalysis && data.length > 0) {
      setIsAnalysisLoading(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      let interval = '1d';
      let range = '1mo';

      if (period === '1D') {
        interval = '1h';
        range = showAnalysis ? '1mo' : '1d';
      } else if (period === '1W') {
        interval = '1h';
        range = showAnalysis ? '1mo' : '5d';
      } else if (period === '1M') {
        interval = '1d';
        range = showAnalysis ? '1y' : '1mo';
      } else if (period === '3M') {
        interval = '1d';
        range = showAnalysis ? '2y' : '3mo';
      } else if (period === 'STANDARD') {
        interval = '1d';
        range = '1y';
      } else {
        interval = customDays > 60 ? '1wk' : customDays > 7 ? '1d' : '1h';
        range = `${showAnalysis ? Math.max(customDays + 150, customDays * 3) : customDays}d`;
      }

      const res = await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}&interval=${interval}&range=${range}`);
      const json = await res.json();

      if (json.error) throw new Error(json.error);

      const formattedData: DataPoint[] = json.data.map((item: { timestamp: string; close: number; volume: number }) => {
        const d = new Date(item.timestamp);
        let dateLabel = '';
        if (period === '1D' || (period === 'CUSTOM' && customDays <= 1)) {
          dateLabel = `${d.getHours().toString().padStart(2, '0')}:00`;
        } else if (period === '1W' || (period === 'CUSTOM' && customDays <= 7)) {
          dateLabel = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
        } else if (period === 'STANDARD') {
          dateLabel = `${d.getFullYear() % 100}/${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        } else {
          dateLabel = `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        }
        return {
          date: dateLabel,
          value: item.close,
          volume: item.volume,
        };
      });

      await processFormattedData(formattedData);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setIsAnalysisLoading(false);
    }
  }, [symbol, period, customDays, showAnalysis, processFormattedData, data.length]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: DataPoint;
    }>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-950/90 backdrop-blur-md border border-cyan-500/30 p-3 rounded-xl shadow-2xl">
          <p className="text-[10px] text-cyan-500 font-bold mb-1">{payload[0].payload.date}</p>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-black text-white">
              {isFX ? '₩' : '$'}{payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </p>
            {showRegression && (
              <div className="flex flex-col gap-0.5 mt-1 border-t border-purple-500/20 pt-1">
                <p className="text-[10px] text-purple-400 font-bold">
                  TREND: {isFX ? '₩' : '$'}{payload[0].payload.regression?.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                </p>
                <p className={`text-[9px] font-black ${(payload[0].payload.regressionGap ?? 0) >= 0 ? 'text-purple-300' : 'text-pink-400'}`}>
                  GAP: {(payload[0].payload.regressionGap ?? 0) >= 0 ? '+' : ''}{payload[0].payload.regressionGap?.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="group relative rounded-3xl border border-white/10 bg-gray-900/40 p-6 backdrop-blur-xl hover:border-cyan-500/30 transition-all duration-500 shadow-2xl overflow-hidden flex flex-col gap-6">
      <div className="relative z-10 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full" />
            <span className="text-[10px] text-cyan-500 font-black uppercase tracking-[0.3em]">Market Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRegression(!showRegression)}
              className={`px-3 py-1 rounded-full text-[9px] font-black transition-all flex items-center gap-1.5 ${
                showRegression ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:text-gray-300'
              }`}
            >
              <RiPulseLine className={showRegression ? 'animate-pulse' : ''} />
              TREND {showRegression ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className={`px-3 py-1 rounded-full text-[9px] font-black transition-all flex items-center gap-1.5 ${
                showAnalysis ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:text-gray-300'
              }`}
            >
              <RiLineChartLine className={showAnalysis ? 'animate-bounce' : ''} />
              ANALYSIS {showAnalysis ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
            <span className="opacity-40 select-none">/</span>
            <span>{title}</span>
          </h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <RiInformationLine className="text-xl rotate-45" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 items-center">
          {(['1D', '1W', '1M', '3M', 'CUSTOM', 'STANDARD'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                period === p ? 'text-cyan-400 bg-cyan-400/10' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {p}
            </button>
          ))}
          {period === 'CUSTOM' && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10 animate-in fade-in slide-in-from-left-2 duration-300">
              <input
                type="number"
                min="1"
                max="365"
                value={customDays}
                onChange={(e) => setCustomDays(Number(e.target.value))}
                className="w-12 bg-black/40 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] font-black text-cyan-400 focus:outline-none"
              />
              <span className="text-[10px] text-gray-500 font-black">DAYS</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-black text-white tracking-tighter tabular-nums">
            {currentValue ? `${isFX ? '₩' : ''}${currentValue.toLocaleString(undefined, { maximumFractionDigits: isFX ? 1 : 2 })}` : '---'}
          </span>
          <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">
            {symbol}
          </span>
        </div>
        
        {change && (
          <div className="flex items-center gap-3 mt-2">
            <div className={`flex items-center px-3 py-1 rounded-full text-[11px] font-black ${
              change.value >= 0 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
            }`}>
              {change.value >= 0 ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
              {Math.abs(change.percent).toFixed(2)}%
              <span className="ml-2 opacity-60">({change.value >= 0 ? '+' : '-'}{Math.abs(change.value).toFixed(isFX ? 1 : 2)})</span>
            </div>
            {showRegression && regressionChange && (
              <div className={`flex items-center px-3 py-1 rounded-full text-[11px] font-black ${
                regressionChange.percent >= 0 ? 'bg-purple-500/10 text-purple-400' : 'bg-pink-500/10 text-pink-400'
              } border border-purple-500/20 shadow-lg shadow-purple-500/10`}>
                <RiPulseLine className="animate-pulse mr-1.5" />
                GAP: {regressionChange.percent >= 0 ? '+' : ''}{regressionChange.percent.toFixed(2)}%
              </div>
            )}
          </div>
        )}
      </div>

      <div className="h-[250px] w-full relative z-10">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-red-400">
            <RiExchangeLine className="text-4xl opacity-20" />
            <span className="text-xs font-black">{error}</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 800 }}
                dy={15}
              />
              <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22d3ee"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorValue)"
                animationDuration={1500}
              />
              {showRegression && (
                <Line
                  type="monotone"
                  dataKey="regression"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  animationDuration={1000}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {showAnalysis && (
        <div className="relative z-10 bg-black/40 rounded-2xl border border-white/5 p-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2 mb-4">
            <RiLineChartLine className="text-blue-400" />
            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Market Analysis Report</span>
            {isAnalysisLoading && <div className="ml-auto animate-spin w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full" />}
          </div>

          {isAnalysisLoading && !analysisResult ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="animate-pulse text-[10px] text-blue-400 font-black uppercase tracking-widest">Calculating Market Intelligence...</div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full animate-progress-indefinite w-1/3" />
              </div>
            </div>
          ) : !analysisResult ? (
            <div className="text-[10px] text-gray-500 font-bold py-4">분석 데이터를 계산 중이거나 데이터가 부족합니다 (최소 100개 필요).</div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    {analysisResult.judgment}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      analysisResult.score >= 3 ? 'bg-green-500/20 text-green-400' : 
                      analysisResult.score <= -3 ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {analysisResult.score > 0 ? '+' : ''}{analysisResult.score}pts
                    </span>
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">최종 판단 결과 및 스코어</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-blue-400">{analysisResult.strength.toFixed(0)}%</div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">추세 강도 (Trend Strength)</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-widest border-b border-white/5 pb-1">정량적 분석 이유 (Reasoning)</h4>
                <div className="flex flex-col gap-2">
                  {analysisResult.reasons.map((reason, idx) => (
                    <div key={idx} className="flex gap-2 text-xs text-gray-300 font-medium">
                      <span className="text-blue-500 font-bold">●</span>
                      {reason}
                    </div>
                  ))}
                </div>
              </div>

              {analysisResult.risks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] text-red-400/70 font-black uppercase tracking-widest border-b border-red-500/10 pb-1">리스크 요소 (Warning Risks)</h4>
                  <div className="flex flex-col gap-2">
                    {analysisResult.risks.map((risk, idx) => (
                      <div key={idx} className="flex gap-2 text-[11px] text-red-200/60 font-medium italic">
                        <RiInformationLine className="flex-shrink-0 text-red-400 mt-0.5" />
                        {risk}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-[9px] text-gray-600 font-medium leading-relaxed italic">
              ※ 본 분석 결과는 기술적 분석 지표(이동평균선, RSI, 볼린저 밴드 등)를 활용한 객관적 데이터 제공을 목적으로 하며, 투자를 권장하거나 종목을 추천하는 것이 아닙니다. 
              투자 결정은 본인의 판단과 책임 하에 이루어져야 하며, 과거의 수익률이 미래의 수익을 보장하지 않습니다.
            </p>
          </div>
        </div>
      )}

      <div className="mt-2 pt-4 border-t border-white/5 flex items-center justify-end relative z-10">
        <button 
          onClick={fetchMarketData}
          className="group flex items-center gap-2 text-[10px] text-gray-500 hover:text-cyan-400 font-black uppercase tracking-widest transition-all"
        >
          <RiTimeLine className="text-sm group-hover:rotate-180 transition-transform duration-500" />
          Update Now
        </button>
      </div>

      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}
