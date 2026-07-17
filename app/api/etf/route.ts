import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// 💡 Only S&P 500 ETF is populated as a default benchmark. Others are removed as requested.
const DEFAULT_ETFS = [
  { symbol: '379800.KS', ko_code: '379800', isin_code: 'KR7379800009', name: 'KODEX 미국S&P500TR', underlying_ticker: 'ES=F', is_hedged: false, weight: 100, avg_price: 0, quantity: 0 }
];

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

// Helper: Extract closing price at KST 16:00 (UTC 07:00)
function getClosingPriceAt1600(result: any): number {
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  let closePrice = 0;

  for (let i = timestamps.length - 1; i >= 0; i--) {
    const date = new Date(timestamps[i] * 1000);
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();

    if (utcHours === 7 && utcMinutes >= 0 && utcMinutes <= 10) {
      if (closes[i] !== null && closes[i] !== undefined) {
        closePrice = closes[i];
        break;
      }
    }
  }

  if (closePrice === 0 && closes.length > 0) {
    for (let i = closes.length - 1; i >= 0; i--) {
      if (closes[i] !== null && closes[i] !== undefined) {
        closePrice = closes[i];
        break;
      }
    }
  }

  return closePrice;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');

  try {
    const supabase = await createClient();
    let etfList = DEFAULT_ETFS;

    // 1. If user_id is provided, load custom watchlist from Supabase
    if (user_id) {
      let userWatchlist: any[] | null = null;
      
      const { data: firstTry, error: firstError } = await supabase
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
            isin_code,
            name,
            underlying_ticker,
            is_hedged
          )
        `)
        .eq('user_id', user_id);

      // Auto-seed default watchlist in DB if it is empty for this user
      if (!firstError && firstTry && firstTry.length === 0) {
        console.log(`Watchlist empty for user ${user_id}. Seeding default S&P 500 ETF into database...`);
        try {
          const seededList = [];
          for (const defEtf of DEFAULT_ETFS) {
            let { data: etfMaster } = await supabase
              .from('etf_info')
              .select('id')
              .eq('symbol', defEtf.symbol)
              .maybeSingle();

            if (!etfMaster) {
              const { data: insertedMaster } = await supabase
                .from('etf_info')
                .insert({
                  symbol: defEtf.symbol,
                  ko_code: defEtf.ko_code,
                  isin_code: defEtf.isin_code,
                  name: defEtf.name,
                  underlying_ticker: defEtf.underlying_ticker,
                  is_hedged: defEtf.is_hedged
                })
                .select('id')
                .single();
              etfMaster = insertedMaster;
            }

            if (etfMaster) {
              const { data: watchItem } = await supabase
                .from('user_etf_watchlist')
                .insert({
                  user_id: user_id,
                  etf_id: etfMaster.id,
                  weight: defEtf.weight,
                  avg_price: defEtf.avg_price,
                  quantity: defEtf.quantity
                })
                .select(`
                  etf_id,
                  weight,
                  avg_price,
                  quantity,
                  etf_info (
                    symbol,
                    ko_code,
                    isin_code,
                    name,
                    underlying_ticker,
                    is_hedged
                  )
                `)
                .single();

              if (watchItem) {
                seededList.push(watchItem);
              }
            }
          }
          userWatchlist = seededList;
        } catch (seedErr) {
          console.error('Failed to auto-seed user watchlist:', seedErr);
        }
      } else if (firstError) {
        console.warn('Failed to query watchlist. Falling back to query without weight/assets:', firstError.message);
        const { data: secondTry, error: secondError } = await supabase
          .from('user_etf_watchlist')
          .select(`
            etf_id,
            etf_info (
              symbol,
              ko_code,
              name,
              underlying_ticker,
              is_hedged
            )
          `)
          .eq('user_id', user_id);

        if (!secondError && secondTry) {
          userWatchlist = secondTry.map((item: any) => ({
            ...item,
            weight: 10.0,
            avg_price: 0.0,
            quantity: 0.0
          }));
        }
      } else {
        userWatchlist = firstTry;
      }

      if (userWatchlist && userWatchlist.length > 0) {
        etfList = userWatchlist.map((item: any) => ({
          symbol: item.etf_info.symbol,
          ko_code: item.etf_info.ko_code,
          isin_code: item.etf_info.isin_code || '',
          name: item.etf_info.name,
          underlying_ticker: item.etf_info.underlying_ticker,
          is_hedged: item.etf_info.is_hedged,
          weight: Number(item.weight ?? 10.0),
          avg_price: Number(item.avg_price ?? 0.0),
          quantity: Number(item.quantity ?? 0.0)
        }));
      }
    }

    // 2. Determine market hours state (KST)
    const kstNowStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
    const kstNow = new Date(kstNowStr);
    const hours = kstNow.getHours();
    const minutes = kstNow.getMinutes();
    const day = kstNow.getDay();
    
    const isWeekDay = day >= 1 && day <= 5;
    const isTradingHours = isWeekDay && (
      (hours > 9 && hours < 16) || 
      (hours === 9 && minutes >= 0) || 
      (hours === 16 && minutes === 0)
    );

    // 3. Prepare Yahoo Finance Fetch for FX Rate (USD/KRW)
    const fxSymbol = 'USDKRW=X';
    const fxUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${fxSymbol}?interval=5m&range=2d`;
    const fxRes = await fetch(fxUrl, { headers: YAHOO_HEADERS, next: { revalidate: 15 } }).then(r => r.json());
    
    if (!fxRes.chart || !fxRes.chart.result || fxRes.chart.result.length === 0) {
      throw new Error('USD/KRW exchange rate data unavailable from Yahoo Finance');
    }
    const fxResult = fxRes.chart.result[0];
    const fxCurrent = fxResult.meta.regularMarketPrice;
    const fxCloseAt1600 = getClosingPriceAt1600(fxResult);

    // 4. Resolve unique underlying tickers
    const underlyingTickers = Array.from(new Set(etfList.map(e => e.underlying_ticker)));
    const underlyingDataMap: Record<string, { current: number; closeAt1600: number }> = {};
    
    await Promise.all(underlyingTickers.map(async (ticker) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=5m&range=2d`;
        const res = await fetch(url, { headers: YAHOO_HEADERS, next: { revalidate: 15 } }).then(r => r.json());
        
        if (res.chart && res.chart.result && res.chart.result.length > 0) {
          const result = res.chart.result[0];
          underlyingDataMap[ticker] = {
            current: result.meta.regularMarketPrice,
            closeAt1600: getClosingPriceAt1600(result)
          };
        }
      } catch (err) {
        console.error(`Failed to fetch underlying ticker ${ticker}:`, err);
      }
    }));

    // 5. Calculate estimated iNAV and metrics for each ETF
    const computedETFs = await Promise.all(etfList.map(async (etf) => {
      try {
        const etfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${etf.symbol}?interval=5m&range=2d`;
        const etfRes = await fetch(etfUrl, { headers: YAHOO_HEADERS, next: { revalidate: 30 } }).then(r => r.json());
        
        if (!etfRes.chart || !etfRes.chart.result || etfRes.chart.result.length === 0) {
          return { ...etf, error: 'ETF data fetch failed' };
        }
        
        const etfResult = etfRes.chart.result[0];
        const etfCurrent = etfResult.meta.regularMarketPrice;
        const etfPrevClose = etfResult.meta.chartPreviousClose || etfCurrent;
        
        const underInfo = underlyingDataMap[etf.underlying_ticker];
        
        if (!underInfo) {
          return { ...etf, error: 'Underlying index data unavailable' };
        }

        const underRatio = underInfo.current / underInfo.closeAt1600;
        const fxRatio = etf.is_hedged ? 1.0 : (fxCurrent / fxCloseAt1600);

        const estINAV = etfCurrent * underRatio * fxRatio;
        const discrepancyRate = ((etfCurrent - estINAV) / estINAV) * 100;
        const changePercent = ((etfCurrent - etfPrevClose) / etfPrevClose) * 100;

        // Assets Evaluation
        const purchaseAmount = (etf.avg_price || 0) * (etf.quantity || 0);
        const estValuation = estINAV * (etf.quantity || 0);
        const estProfit = estValuation - purchaseAmount;
        const estReturn = purchaseAmount > 0 ? (estProfit / purchaseAmount) * 100 : 0;

        return {
          symbol: etf.symbol,
          ko_code: etf.ko_code,
          name: etf.name,
          underlying_ticker: etf.underlying_ticker,
          is_hedged: etf.is_hedged,
          weight: etf.weight,
          avg_price: etf.avg_price,
          quantity: etf.quantity,
          marketPrice: etfCurrent,
          prevClose: etfPrevClose,
          changePercent,
          estINAV: Math.round(estINAV * 100) / 100,
          discrepancyRate: Math.round(discrepancyRate * 10000) / 10000,
          underlyingCurrent: underInfo.current,
          underlyingChange: Math.round((underRatio - 1) * 10000) / 100,
          fxCurrent: fxCurrent,
          fxChange: Math.round((fxRatio - 1) * 10000) / 100,
          purchaseAmount: Math.round(purchaseAmount),
          estValuation: Math.round(estValuation),
          estProfit: Math.round(estProfit),
          estReturn: Math.round(estReturn * 100) / 100
        };
      } catch (err: any) {
        console.error(`Calculation failed for ${etf.symbol}:`, err);
        return {
          symbol: etf.symbol,
          ko_code: etf.ko_code,
          name: etf.name,
          weight: etf.weight,
          avg_price: etf.avg_price,
          quantity: etf.quantity,
          error: err.message || 'Internal processing error'
        };
      }
    }));

    // 6. Calculate Portfolio Weighted Metrics & Profit Summaries
    let totalWeight = 0;
    let weightedDiscrepancySum = 0;
    let weightedChangeSum = 0;
    let weightedAfterMarketChangeSum = 0;
    
    let totalPurchaseAmount = 0;
    let totalEstValuation = 0;
    
    computedETFs.forEach((etf: any) => {
      if (etf.error) return;
      const w = etf.weight || 0;
      totalWeight += w;
      weightedDiscrepancySum += (etf.discrepancyRate || 0) * w;
      weightedChangeSum += (etf.changePercent || 0) * w;
      
      const afterMarketChange = etf.marketPrice ? ((etf.estINAV / etf.marketPrice - 1) * 100) : 0;
      weightedAfterMarketChangeSum += afterMarketChange * w;

      totalPurchaseAmount += etf.purchaseAmount || 0;
      totalEstValuation += etf.estValuation || 0;
    });

    const totalEstProfit = totalEstValuation - totalPurchaseAmount;
    const totalEstReturn = totalPurchaseAmount > 0 ? (totalEstProfit / totalPurchaseAmount) * 100 : 0;

    const portfolioSummary = {
      totalWeight,
      weightedDiscrepancy: totalWeight > 0 ? Math.round((weightedDiscrepancySum / totalWeight) * 1000) / 1000 : 0,
      weightedChange: totalWeight > 0 ? Math.round((weightedChangeSum / totalWeight) * 100) / 100 : 0,
      weightedAfterMarketChange: totalWeight > 0 ? Math.round((weightedAfterMarketChangeSum / totalWeight) * 100) / 100 : 0,
      totalPurchaseAmount: Math.round(totalPurchaseAmount),
      totalEstValuation: Math.round(totalEstValuation),
      totalEstProfit: Math.round(totalEstProfit),
      totalEstReturn: Math.round(totalEstReturn * 100) / 100
    };

    return NextResponse.json({
      timestamp: kstNow.toISOString(),
      isTradingHours,
      fxRate: fxCurrent,
      fxChange24h: Math.round(((fxCurrent - fxCloseAt1600) / fxCloseAt1600) * 10000) / 100,
      etfs: computedETFs,
      portfolio: portfolioSummary
    });

  } catch (error: any) {
    console.error('[ETF API Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
