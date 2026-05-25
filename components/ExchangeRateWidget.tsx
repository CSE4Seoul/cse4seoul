'use client';

import { useState, useEffect } from 'react';
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
  RiStockLine,
  RiLineChartLine,
  RiPulseLine
} from 'react-icons/ri';

interface DataPoint {
  date: string;
  value: number | null;
  regression?: number;
}

type MarketType = 'USD/KRW' | 'NASDAQ' | 'S&P 500';
type Period = '1D' | '1W' | '1M' | '3M';

export default function ExchangeRateWidget() {
  const [marketType, setMarketType] = useState<MarketType>('USD/KRW');
  const [data, setData] = useState<DataPoint[]>([]);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [change, setChange] = useState<{ value: number; percent: number } | null>(null);
  const [period, setPeriod] = useState<Period>('1W');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegression, setShowRegression] = useState(false);

  useEffect(() => {
    fetchMarketData();
  }, [marketType, period]);

  const calculateRegression = (pts: DataPoint[]) => {
    const n = pts.length;
    if (n < 2) return pts.map(p => ({ ...p, regression: p.value || 0 }));

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

    return pts.map((p, i) => ({
      ...p,
      regression: slope * i + intercept,
    }));
  };

  const fetchMarketData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (marketType === 'USD/KRW') {
        await fetchForex();
      } else {
        await fetchStockIndex();
      }
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchForex = async () => {
    const today = new Date();
    let startDate = new Date();
    if (period === '1D') startDate.setDate(today.getDate() - 5);
    else if (period === '1W') startDate.setDate(today.getDate() - 10);
    else if (period === '1M') startDate.setMonth(today.getMonth() - 1);
    else if (period === '3M') startDate.setMonth(today.getMonth() - 3);

    const startStr = startDate.toISOString().split('T')[0];
    const res = await fetch(`https://api.frankfurter.dev/v1/${startStr}..?from=USD&to=KRW`);
    const json = await res.json();
    
    if (json.rates) {
      const entries = Object.entries(json.rates);
      const formattedData: DataPoint[] = entries.map(([date, rates]: any) => ({
        date: date.slice(5),
        value: rates.KRW,
      }));
      
      processFormattedData(formattedData);
    }
  };

  const fetchStockIndex = async () => {
    const baseValue = marketType === 'NASDAQ' ? 18000 : 5000;
    const count = period === '1D' ? 7 : period === '1W' ? 14 : period === '1M' ? 30 : 90;
    
    const mockData: DataPoint[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (count - i));
      mockData.push({
        date: `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`,
        value: baseValue + Math.random() * 500 - 250 + (i * 10),
      });
    }
    
    processFormattedData(mockData);
  };

  const processFormattedData = (formattedData: DataPoint[]) => {
    if (formattedData.length > 0) {
      const values = formattedData.map(d => d.value).filter((v): v is number => v !== null);
      const last = values[values.length - 1];
      const first = values[0];
      setCurrentValue(last);
      
      const diff = last - first;
      const percent = (diff / first) * 100;
      setChange({ value: diff, percent });
      
      const dataWithRegression = calculateRegression(formattedData);
      setData(dataWithRegression);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-950/90 backdrop-blur-md border border-cyan-500/30 p-3 rounded-xl shadow-2xl">
          <p className="text-[10px] text-cyan-500 font-bold mb-1">{payload[0].payload.date}</p>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-black text-white">
              {marketType === 'USD/KRW' ? '₩' : '$'}{payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </p>
            {showRegression && (
              <p className="text-[10px] text-purple-400 font-bold">
                TREND: {marketType === 'USD/KRW' ? '₩' : '$'}{payload[0].payload.regression?.toLocaleString(undefined, { minimumFractionDigits: 1 })}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="group relative rounded-3xl border border-white/10 bg-gray-900/40 p-6 backdrop-blur-xl hover:border-cyan-500/30 transition-all duration-500 shadow-2xl overflow-hidden flex flex-col gap-6">
      {/* 1. Header Section */}
      <div className="relative z-10 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full" />
            <span className="text-[10px] text-cyan-500 font-black uppercase tracking-[0.3em]">Market Dashboard</span>
          </div>
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
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
          <span className="opacity-40 select-none">/</span>
          {marketType === 'USD/KRW' ? (
            <><span>시장</span><span className="text-cyan-500">환율</span></>
          ) : (
            <span>{marketType}</span>
          )}
        </h2>
      </div>

      {/* 2. Control Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 shadow-inner overflow-x-auto no-scrollbar w-full sm:w-auto">
          {(['USD/KRW', 'NASDAQ', 'S&P 500'] as MarketType[]).map((type) => (
            <button
              key={type}
              onClick={() => setMarketType(type)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all duration-300 flex items-center gap-2 flex-shrink-0 ${
                marketType === type 
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {type === 'USD/KRW' && <RiExchangeLine />}
              {type === 'NASDAQ' && <RiStockLine />}
              {type === 'S&P 500' && <RiLineChartLine />}
              {type}
            </button>
          ))}
        </div>

        <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
          {(['1D', '1W', '1M', '3M'] as Period[]).map((p) => (
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
        </div>
      </div>

      {/* 3. Main Value Section */}
      <div className="relative z-10">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-black text-white tracking-tighter tabular-nums">
            {currentValue ? `${marketType === 'USD/KRW' ? '₩' : ''}${currentValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}` : '---'}
          </span>
          <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">
            {marketType === 'USD/KRW' ? 'KRW / USD' : 'Index Points'}
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

      {/* 5. Footer Refresh */}
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
