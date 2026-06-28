'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { 
  RiExchangeLine, 
  RiArrowUpSLine, 
  RiArrowDownSLine, 
  RiTimeLine,
  RiStockLine,
  RiLineChartLine,
  RiPulseLine,
  RiInformationLine,
  RiPieChart2Line,
  RiLock2Line
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

interface Constituent {
  name: string;
  weight: number;
}

const PIE_COLORS = [
  '#06b6d4', '#0891b2', '#0e7490', '#155e75', 
  '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe',
  '#06b6d4CC', '#06b6d499', '#1e293b'
];

type MarketType = 'USD/KRW' | 'EUR/KRW' | 'NASDAQ' | 'S&P 500' | 'KOSPI' | 'DXY';
type Period = '1D' | '1W' | '1M' | '3M' | 'CUSTOM' | 'STANDARD';

interface AnalysisResult {
  score: number;
  judgment: string;
  reasons: string[];
  strength: number;
  risks: string[];
}

export default function ExchangeRateWidget({ lang = 'ko' }: { lang?: 'ko' | 'en' }) {
  const [marketType, setMarketType] = useState<MarketType>('KOSPI');
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
  const [showComponents, setShowComponents] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Dynamic Constituents State
  const [constituents, setConstituents] = useState<Constituent[]>([]);
  const [constituentsDate, setConstituentsDate] = useState<string | null>(null);
  const [isConstituentsLoading, setIsConstituentsLoading] = useState(false);

  // Market Comparison Data for Interpretation
  const [comparisonData, setComparisonData] = useState<{
    usdkrw?: { value: number; change: number };
    dxy?: { value: number; change: number };
  }>({});

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsAuthChecking(false);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (!isAuthChecking && user) {
      fetchMarketData();
    }
  }, [marketType, period, customDays, showAnalysis, user, isAuthChecking]);

  useEffect(() => {
    if (!isAuthChecking && user && showComponents && (marketType === 'KOSPI' || marketType === 'NASDAQ' || marketType === 'S&P 500')) {
      fetchConstituents();
    }
  }, [showComponents, marketType, user, isAuthChecking]);

  // Fetch both USD/KRW and DXY for interpretation
  useEffect(() => {
    if (!isAuthChecking && user) {
      fetchComparisonData();
    }
  }, [user, isAuthChecking]);

  const fetchComparisonData = async () => {
    try {
      const symbols = { usdkrw: 'USDKRW=X', dxy: 'DX-Y.NYB' };
      const results: any = {};
      
      for (const [key, symbol] of Object.entries(symbols)) {
        const res = await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}&interval=1d&range=5d`);
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const last = json.data[json.data.length - 1].close;
          const prev = json.data[json.data.length - 2]?.close || json.previousClose;
          results[key] = {
            value: last,
            change: last - prev
          };
        }
      }
      setComparisonData(results);
    } catch (err) {
      console.error('Failed to fetch comparison data:', err);
    }
  };

  const fetchConstituents = async () => {
    setIsConstituentsLoading(true);
    try {
      const res = await fetch(`/api/market/constituents?type=${encodeURIComponent(marketType)}`);
      const json = await res.json();
      if (json.data) {
        setConstituents(json.data);
        setConstituentsDate(json.updatedAt);
      }
    } catch (err) {
      console.error('Failed to fetch constituents:', err);
    } finally {
      setIsConstituentsLoading(false);
    }
  };

  const calculateRegression = (pts: DataPoint[]) => {
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
  };

  const fetchMarketData = async () => {
    if (showAnalysis && data.length > 0) {
      setIsAnalysisLoading(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      let symbol = '';
      let interval = '1d';
      let range = '1mo';

      if (marketType === 'USD/KRW') {
        symbol = 'USDKRW=X';
      } else if (marketType === 'EUR/KRW') {
        symbol = 'EURKRW=X';
      } else if (marketType === 'NASDAQ') {
        symbol = '^IXIC';
      } else if (marketType === 'KOSPI') {
        symbol = '^KS11';
      } else if (marketType === 'DXY') {
        symbol = 'DX-Y.NYB';
      } else {
        symbol = '^GSPC';
      }

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
        // CUSTOM period
        interval = customDays > 60 ? '1wk' : customDays > 7 ? '1d' : '1h';
        range = `${showAnalysis ? Math.max(customDays + 150, customDays * 3) : customDays}d`;
      }

      const res = await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}&interval=${interval}&range=${range}`);
      const json = await res.json();

      if (json.error) throw new Error(json.error);

      const formattedData: DataPoint[] = json.data.map((item: { timestamp: number; close: number; volume: number }) => {
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
  };

  const calculateAnalysis = (pts: DataPoint[]) => {
    // 120일 이평선을 위해 최소 120개 필요하나, 
    // 데이터가 약간 부족해도 60일선 등 가용한 정보로 분석하기 위해 임계치를 100으로 조정
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

    // 1. 배열 상태
    if (ma5 > ma20 && ma20 > ma60 && ma60 > ma120) {
      score += 3;
      reasons.push('강한 정배열 ($5 > 20 > 60 > 120$): 장기적인 우상향 흐름이 매우 뚜렷함 (+3)');
    } else if (ma5 < ma20 && ma20 < ma60 && ma60 < ma120) {
      score -= 3;
      reasons.push('강한 역배열 ($5 < 20 < 60 < 120$): 하락 추세가 강력하게 형성됨 (-3)');
    }

    // 2. 크로스 모멘텀 & 휩소 필터
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

    // 3. 기울기 동조
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

    // 4. RSI 과열 브레이크
    if (rsi >= 70) {
      score -= 2;
      reasons.push(`RSI 과매수 경고 (${rsi.toFixed(1)}): 단기 고점 과열 상태로 인한 조정 가능성 반영 (-2)`);
    } else if (rsi <= 30) {
      score += 2;
      reasons.push(`RSI 과매도 신호 (${rsi.toFixed(1)}): 기술적 반등이 기대되는 낙폭 과대 구간 (+2)`);
    }

    // 5. 볼린저 밴드 & 현재가 위치
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

    // 6. 거래량 필터 및 자산별 특화 로직
    const volMA20 = getMA(volumes, 20);
    const currentVol = volumes[n - 1];
    const volChange = volMA20 > 0 ? (currentVol / volMA20) * 100 : 0;

    if (marketType === 'NASDAQ' || marketType === 'S&P 500' || marketType === 'KOSPI') {
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
      // 외환: 장기 추세 가중
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
  };

  const processFormattedData = async (formattedData: DataPoint[]) => {
    if (formattedData.length > 0) {
      // 1. Wasm 기반 분석 (속도 최적화)
      const prices = formattedData.map(d => d.value || 0);
      const volumes = formattedData.map(d => d.volume || 0);
      const marketTypeInt = (marketType === 'NASDAQ' || marketType === 'S&P 500' || marketType === 'KOSPI') ? 0 : 1;
      
      const wasmScore = await wasmService.analyzeMarketWasm(prices, volumes, marketTypeInt);
      
      // 2. JS 기반 분석 (상세 사유 추출용)
      const jsAnalysis = calculateAnalysis(formattedData);
      
      if (wasmScore !== null && jsAnalysis) {
        // Wasm 점수를 우선하되, 사유와 리스크는 JS에서 보완
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

      // 디스플레이용 데이터 (분석용으로 더 많이 가져온 경우 최근 것만 슬라이스)
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
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: DataPoint;
    }>;
  }

  const getMarketInterpretation = () => {
    const { usdkrw, dxy } = comparisonData;
    if (!usdkrw || !dxy) return null;

    const dxyUp = dxy.change > 0;
    const krwUp = usdkrw.change > 0; // USDKRW 상승 = 원화 약세

    if (dxyUp && krwUp) {
      return "글로벌 달러 강세가 원화 약세로 이어지고 있습니다.";
    } else if (!dxyUp && !krwUp) {
      return "달러 약세와 함께 원화가 강세를 보이고 있습니다.";
    } else if (dxyUp && !krwUp) {
      return "달러는 강세지만 원화가 상대적으로 더 강한 모습을 보이고 있습니다.";
    } else if (!dxyUp && krwUp) {
      return "글로벌 달러는 약세이나 원화는 상대적으로 약한 흐름을 보이고 있습니다.";
    }
    return null;
  };

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-950/90 backdrop-blur-md border border-cyan-500/30 p-3 rounded-xl shadow-2xl">
          <p className="text-[10px] text-cyan-500 font-bold mb-1">{payload[0].payload.date}</p>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-black text-white">
              {(marketType === 'USD/KRW' || marketType === 'EUR/KRW') ? '₩' : (marketType === 'KOSPI' ? '' : '$')}{payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </p>
            {showRegression && (
              <div className="flex flex-col gap-0.5 mt-1 border-t border-purple-500/20 pt-1">
                <p className="text-[10px] text-purple-400 font-bold">
                  TREND: {(marketType === 'USD/KRW' || marketType === 'EUR/KRW') ? '₩' : (marketType === 'KOSPI' ? '' : '$')}{payload[0].payload.regression?.toLocaleString(undefined, { minimumFractionDigits: 1 })}
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

  if (!isAuthChecking && !user) {
    return (
      <div className="group relative rounded-3xl border border-white/[0.08] bg-white/[0.02] p-12 backdrop-blur-xl hover:border-cyan-500/20 transition-all duration-500 shadow-2xl overflow-hidden flex flex-col items-center justify-center text-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/[0.08] flex items-center justify-center mb-2">
          <RiLock2Line className="text-3xl text-gray-500" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-white">
            {lang === 'ko' ? '로그인 후 이용 가능합니다' : 'Please log in to continue'}
          </h3>
          <p className="text-sm text-gray-400 max-w-xs">
            {lang === 'ko' 
              ? '실시간 시세 및 AI 분석 기능을 이용하시려면 로그인이 필요합니다.' 
              : 'Login is required to use real-time market rates and AI analysis features.'}
          </p>
        </div>
        <Link
          href="/login"
          className="px-8 py-3 rounded-full bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/35 hover:scale-[1.02]"
        >
          {lang === 'ko' ? '로그인하러 가기' : 'Go to Login'}
        </Link>
      </div>
    );
  }

  const interpretation = getMarketInterpretation();

  return (
    <div className="group relative rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl hover:border-cyan-500/20 transition-all duration-500 shadow-2xl overflow-hidden flex flex-col gap-6">
      {/* Interpretation Section */}
      {interpretation && (
        <div className="relative z-10 px-4 py-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
          <p className="text-xs font-medium text-cyan-200">
            {interpretation}
          </p>
        </div>
      )}

      {/* 1. Header Section */}
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
                showRegression 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                  : 'bg-white/5 text-gray-500 hover:text-gray-300'
              }`}
            >
              <RiPulseLine className={showRegression ? 'animate-pulse' : ''} />
              TREND {showRegression ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className={`px-3 py-1 rounded-full text-[9px] font-black transition-all flex items-center gap-1.5 ${
                showAnalysis 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-white/5 text-gray-500 hover:text-gray-300'
              }`}
            >
              <RiLineChartLine className={showAnalysis ? 'animate-bounce' : ''} />
              ANALYSIS {showAnalysis ? 'ON' : 'OFF'}
            </button>
            {(marketType === 'KOSPI' || marketType === 'NASDAQ' || marketType === 'S&P 500') && (
              <button
                onClick={() => setShowComponents(!showComponents)}
                className={`px-3 py-1 rounded-full text-[9px] font-black transition-all flex items-center gap-1.5 ${
                  showComponents 
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' 
                    : 'bg-white/5 text-gray-500 hover:text-gray-300'
                }`}
              >
                <RiPieChart2Line className={showComponents ? 'animate-spin-slow' : ''} />
                COMPONENTS {showComponents ? 'ON' : 'OFF'}
              </button>
            )}
          </div>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
          <span className="opacity-40 select-none">/</span>
          {marketType === 'KOSPI' ? (
            <><span>코스피</span><span className="text-cyan-500">지수</span></>
          ) : (marketType === 'USD/KRW' || marketType === 'EUR/KRW') ? (
            <><span>시장</span><span className="text-cyan-500">환율</span></>
          ) : (
            <span>{marketType}</span>
          )}
        </h2>
      </div>

      {/* 2. Control Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 shadow-inner overflow-x-auto no-scrollbar w-full sm:w-auto">
          {(['KOSPI', 'USD/KRW', 'EUR/KRW', 'NASDAQ', 'S&P 500', 'DXY'] as MarketType[]).map((type) => (
            <button
              key={type}
              onClick={() => setMarketType(type)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all duration-300 flex items-center gap-2 flex-shrink-0 ${
                marketType === type 
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {(type === 'USD/KRW' || type === 'EUR/KRW' || type === 'DXY') && <RiExchangeLine />}
              {(type === 'NASDAQ' || type === 'S&P 500' || type === 'KOSPI') && <RiLineChartLine />}
              {type}
            </button>
          ))}
        </div>

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
                className="w-12 bg-black/40 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] font-black text-cyan-400 focus:outline-none focus:border-cyan-500/50"
              />
              <span className="text-[10px] text-gray-500 font-black">DAYS</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Value Section */}
      <div className="relative z-10">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-black text-white tracking-tighter tabular-nums">
            {currentValue ? `${(marketType === 'USD/KRW' || marketType === 'EUR/KRW') ? '₩' : (marketType === 'KOSPI' || marketType === 'DXY' ? '' : '$')}${currentValue.toLocaleString(undefined, { maximumFractionDigits: marketType.includes('/') ? 1 : 1 })}` : '---'}
          </span>
          <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">
            {marketType === 'USD/KRW' ? 'KRW / USD' : marketType === 'EUR/KRW' ? 'KRW / EUR' : marketType === 'DXY' ? 'Dollar Index' : 'Index Points'}
          </span>
        </div>
        
        {change && (
          <div className="flex items-center gap-3 mt-2">
            <div className={`flex items-center px-3 py-1 rounded-full text-[11px] font-black ${
              change.value >= 0 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
            }`}>
              {change.value >= 0 ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
              {Math.abs(change.percent).toFixed(2)}%
              <span className="ml-2 opacity-60">({change.value >= 0 ? '+' : '-'}{Math.abs(change.value).toFixed(1)})</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Live Market Data</span>
          </div>
        )}

        {showRegression && regressionChange && (
          <div className="flex items-center gap-3 mt-2 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className={`flex items-center px-3 py-1 rounded-full text-[11px] font-black ${
              regressionChange.percent >= 0 ? 'bg-purple-500/10 text-purple-400' : 'bg-pink-500/10 text-pink-400'
            } border border-purple-500/20 shadow-lg shadow-purple-500/10`}>
              <RiPulseLine className="animate-pulse mr-1.5" />
              TREND GAP: {regressionChange.percent >= 0 ? '+' : ''}{regressionChange.percent.toFixed(2)}%
            </div>
            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Vs Regression Line</span>
          </div>
        )}
      </div>

      {/* 4. Chart Section */}
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
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
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

      {/* 5. Index Components Section */}
      {showComponents && (marketType === 'KOSPI' || marketType === 'NASDAQ' || marketType === 'S&P 500') && (
        <div className="relative z-10 bg-black/40 rounded-2xl border border-white/5 p-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <RiPieChart2Line className="text-cyan-400" />
              <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">Index Constituents Weighting</span>
            </div>
            {constituentsDate && (
              <span className="text-[9px] text-gray-500 font-bold uppercase">As of: {constituentsDate}</span>
            )}
          </div>

          {isConstituentsLoading ? (
            <div className="h-[300px] w-full flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              {/* Pie Chart */}
              <div className="w-full lg:w-1/2 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={constituents}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="weight"
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {constituents.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* List */}
              <div className="w-full lg:w-1/2 grid grid-cols-2 gap-y-3 gap-x-6">
                {constituents.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-1 group/item">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-[11px] text-gray-400 font-bold truncate group-hover/item:text-white transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-cyan-500 font-black tabular-nums">
                      {item.weight.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-[9px] text-gray-600 font-medium leading-relaxed italic">
              {marketType === 'KOSPI' 
                ? `※ 코스피 데이터는 ${constituentsDate} 기준 직접 제공된 수치입니다.`
                : '※ 미국 지수 비중은 주요 ETF(QQQ, SPY) 홀딩스 데이터를 기반으로 실시간 자동 업데이트됩니다.'}
            </p>
          </div>
        </div>
      )}

      {/* 6. Analysis Report Section */}
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
            <div className="text-[10px] text-gray-500 font-bold py-4">분석 데이터를 계산 중이거나 데이터가 부족합니다 (최소 120개 필요).</div>
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
              ※ 본 분석 결과는 기술적 분석 지표(이동평균선, 기울기, 거래량 등)를 활용한 객관적 데이터 제공을 목적으로 하며, 투자를 권장하거나 종목을 추천하는 것이 아닙니다. 
              투자 결정은 본인의 판단과 책임 하에 이루어져야 하며, 과거의 수익률이 미래의 수익을 보장하지 않습니다.
            </p>
          </div>
        </div>
      )}

      {/* 6. Footer Refresh */}
      <div className="mt-2 pt-4 border-t border-white/5 flex items-center justify-end relative z-10">
        <button 
          onClick={fetchMarketData}
          className="group flex items-center gap-2 text-[10px] text-gray-500 hover:text-cyan-400 font-black uppercase tracking-widest transition-all"
        >
          <RiTimeLine className="text-sm group-hover:rotate-180 transition-transform duration-500" />
          Update Now
        </button>
      </div>

      {/* Background Decorative Element */}
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}
