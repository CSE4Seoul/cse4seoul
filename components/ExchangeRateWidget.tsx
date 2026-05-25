'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { RiExchangeLine, RiArrowUpSLine, RiArrowDownSLine, RiTimeLine } from 'react-icons/ri';

interface RateData {
  date: string;
  rate: number | null;
  regression?: number;
  isPrediction?: boolean;
}

type Period = '1D' | '1W' | '1M' | '3M' | '6M';

export default function ExchangeRateWidget() {
  const [data, setData] = useState<RateData[]>([]);
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [change, setChange] = useState<{ value: number; percent: number } | null>(null);
  const [period, setPeriod] = useState<Period>('1W');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ high: number; low: number } | null>(null);
  const [showRegression, setShowRegression] = useState(false);

  useEffect(() => {
    fetchData();
  }, [period, showRegression]);

  const calculateRegression = (pts: RateData[]) => {
    const n = pts.length;
    if (n < 2) return pts.map(p => ({ ...p, regression: p.rate || 0 }));

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += pts[i].rate || 0;
      sumXY += i * (pts[i].rate || 0);
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const result = pts.map((p, i) => ({
      ...p,
      regression: slope * i + intercept,
    }));

    if (showRegression) {
      // Predict future points (double the points)
      const lastDateStr = pts[pts.length - 1].date; // MM-DD
      const [mm, dd] = lastDateStr.split('-').map(Number);

      for (let i = n; i < n * 2; i++) {
        // Simple date estimation for labels (not perfect but works for UI)
        const futureDate = new Date();
        futureDate.setMonth(mm - 1);
        futureDate.setDate(dd + (i - n + 1));
        const futureLabel = `${(futureDate.getMonth() + 1).toString().padStart(2, '0')}-${futureDate.getDate().toString().padStart(2, '0')}`;

        result.push({
          date: futureLabel,
          rate: null, // No real data for prediction
          regression: slope * i + intercept,
          isPrediction: true,
        });
      }
    }

    return result;
  };


  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date();
      let startDate = new Date();

      if (period === '1D') {
        startDate.setDate(today.getDate() - 5);
      } else if (period === '1W') {
        startDate.setDate(today.getDate() - 10);
      } else if (period === '1M') {
        startDate.setMonth(today.getMonth() - 1);
        startDate.setDate(startDate.getDate() - 5);
      } else if (period === '3M') {
        startDate.setMonth(today.getMonth() - 3);
        startDate.setDate(startDate.getDate() - 5);
      } else if (period === '6M') {
        startDate.setMonth(today.getMonth() - 6);
        startDate.setDate(startDate.getDate() - 5);
      }

      const startStr = startDate.toISOString().split('T')[0];
      
      const historyRes = await fetch(
        `https://api.frankfurter.dev/v1/${startStr}..?from=USD&to=KRW`
      );

      if (!historyRes.ok) throw new Error(`API error: ${historyRes.status}`);

      const historyJson = await historyRes.json();

      if (historyJson && historyJson.rates) {
        const entries = Object.entries(historyJson.rates);
        
        if (entries.length === 0) {
          const latestRes = await fetch('https://api.frankfurter.dev/v1/latest?from=USD&to=KRW');
          const latestJson = await latestRes.json();
          if (latestJson.rates && latestJson.rates.KRW) {
            setCurrentRate(latestJson.rates.KRW);
            setData([{ date: 'Today', rate: latestJson.rates.KRW }]);
            setChange({ value: 0, percent: 0 });
            setStats({ high: latestJson.rates.KRW, low: latestJson.rates.KRW });
            return;
          }
          throw new Error('데이터가 비어 있습니다.');
        }

        let formattedData: RateData[] = entries.map(([date, rates]: any) => ({
          date: date.slice(5), // MM-DD
          rate: rates.KRW,
        }));

        if (period === '1D') {
          formattedData = formattedData.slice(-3);
        } else if (period === '1W') {
          formattedData = formattedData.slice(-7);
        } else if (period === '3M') {
          // Sampling every 3 days for 3M
          formattedData = formattedData.filter((_, i) => i % 3 === 0);
        } else if (period === '6M') {
          // Sampling every 7 days for 6M
          formattedData = formattedData.filter((_, i) => i % 7 === 0);
        }

        const dataWithRegression = calculateRegression(formattedData);
        setData(dataWithRegression);

        if (formattedData.length > 0) {
          const rates = formattedData.map(d => d.rate).filter((r): r is number => r !== null);
          const last = rates[rates.length - 1];
          const first = rates[0];
          setCurrentRate(last);
          setStats({ high: Math.max(...rates), low: Math.min(...rates) });
          
          const diff = last - first;
          const percent = (diff / first) * 100;
          setChange({ value: diff, percent });
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch exchange rate:', err);
      setError('환율 정보를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const isPrediction = payload[0].payload.isPrediction;
      return (
        <div className="bg-gray-950/90 backdrop-blur-md border border-cyan-500/30 p-3 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.4)] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">{payload[0].payload.date}</p>
            {isPrediction && (
              <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 font-black">PREDICTION</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {!isPrediction && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-gray-500 font-bold">RATE</span>
                <span className="text-sm font-black text-white">
                  ₩{payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                </span>
              </div>
            )}
            {showRegression && (
              <div className={`flex items-center justify-between gap-4 ${!isPrediction ? 'border-t border-white/5 pt-1' : ''}`}>
                <span className="text-[10px] text-purple-500 font-bold">TREND</span>
                <span className="text-sm font-black text-purple-400">
                  ₩{(isPrediction ? payload[0].value : payload[1]?.value)?.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="group relative rounded-3xl border border-white/10 bg-gray-900/40 p-6 backdrop-blur-xl hover:border-cyan-500/30 transition-all duration-500 shadow-2xl overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-700" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
            <RiExchangeLine className="text-2xl text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">시장 환율</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">USD TO KRW INDEX</p>
          </div>
        </div>

        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5 shadow-inner">
          <button
            onClick={() => setShowRegression(!showRegression)}
            className={`mr-2 px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${
              showRegression 
                ? 'bg-purple-600/30 text-purple-400 border border-purple-500/30' 
                : 'text-gray-600 hover:text-gray-400'
            }`}
            title="최소제곱법 회귀선"
          >
            TREND
          </button>
          <div className="w-px h-4 bg-white/10 self-center mr-2" />
          {(['1D', '1W', '1M', '3M', '6M'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all duration-300 ${
                period === p 
                  ? 'bg-cyan-600 text-white shadow-[0_2px_10px_rgba(8,145,178,0.4)] scale-105' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 relative z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            {currentRate ? `₩${currentRate.toLocaleString(undefined, { maximumFractionDigits: 1 })}` : '---'}
          </span>
          <span className="text-sm text-gray-400 font-bold tracking-tight">/ 1 USD</span>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          {change && (
            <div className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
              change.value >= 0 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
            }`}>
              {change.value >= 0 ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
              {Math.abs(change.percent).toFixed(2)}%
              <span className="ml-1 opacity-70">({change.value >= 0 ? '+' : '-'}{Math.abs(change.value).toFixed(1)}원)</span>
            </div>
          )}
          <div className="h-1 w-1 rounded-full bg-gray-700" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{period} TREND</span>
        </div>
      </div>

      <div className="h-[220px] w-full relative z-10 -ml-2">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-red-400 bg-red-500/5 rounded-2xl border border-red-500/10">
            <RiExchangeLine className="text-3xl opacity-30" />
            <span className="text-xs font-bold">{error}</span>
            <button onClick={fetchData} className="px-4 py-1.5 bg-red-500/20 rounded-lg text-[10px] font-bold hover:bg-red-500/30 transition-all">RETRY</button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#4b5563', fontSize: 9, fontWeight: 700 }}
                dy={15}
              />
              <YAxis 
                hide 
                domain={['dataMin - 10', 'dataMax + 10']} 
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#22d3ee', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#22d3ee"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorRate)"
                animationDuration={2000}
                dot={false}
                activeDot={{ r: 6, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2 }}
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

      {/* Stats Summary Area */}
      {!isLoading && !error && stats && (
        <div className="mt-8 grid grid-cols-2 gap-3 relative z-10">
          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 flex flex-col items-center">
            <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Period High</span>
            <span className="text-sm font-black text-white">₩{stats.high.toFixed(1)}</span>
          </div>
          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 flex flex-col items-center">
            <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Period Low</span>
            <span className="text-sm font-black text-white">₩{stats.low.toFixed(1)}</span>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Live Updates Enabled</span>
        </div>
        <button 
          onClick={fetchData}
          className="group flex items-center gap-1.5 text-[9px] text-gray-500 hover:text-cyan-400 font-black uppercase tracking-widest transition-all"
        >
          <RiTimeLine className="text-xs group-hover:rotate-180 transition-transform duration-500" />
          Refresh
        </button>
      </div>
    </div>
  );
}
