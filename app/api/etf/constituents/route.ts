import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

// 💡 Live Mapping for passive ETFs to fetch live holdings dynamically.
const AMERICAN_ETF_MAP: Record<string, string> = {
  '133690': 'QQQ',   // TIGER 미국나스닥100 -> QQQ
  '306540': 'QQQ',   // KODEX 미국나스닥100선물(H) -> QQQ
  '379800': 'SPY',   // KODEX 미국S&P500TR -> SPY
  '143850': 'SPY',   // TIGER 미국S&P500선물(H) -> SPY
  '381030': 'SOXX',  // TIGER 미국필라델피아반도체 -> SOXX
  '465580': 'XLK',   // ACE 미국빅테크7현물 -> XLK
  '455850': 'SOXX'   // ACE 글로벌반도체 TOP4 Plus SOLACTIVE -> SOXX (Nvidia, ASML, TSMC, Broadcom benchmark)
};

// 💡 Translation dictionary for live US equities, including Semiconductor leaders
const STOCK_NAME_KR: Record<string, string> = {
  'SPCX': '스페이스X',
  'RKLB': '로켓랩',
  'SATS': '에코스타',
  'LUNR': '인튜이티브 머신스',
  'ASTS': 'AST 스페이스모바일',
  'PLTR': '팔란티어',
  'SPCE': '버진 갤럭틱',
  'PL': '플래닛 랩스',
  'AAPL': '애플',
  'NVDA': '엔비디아',
  'MSFT': '마이크로소프트',
  'AMZN': '아마존',
  'META': '메타',
  'GOOGL': '알파벳 A',
  'GOOG': '알파벳 C',
  'TSLA': '테슬라',
  'BRK.B': '버크셔 해서웨이',
  'LLY': '일라이 릴리',
  'AVGO': '브로드컴',
  'JPM': 'JP모건 체이스',
  'COST': '코스트코',
  'NFLX': '넷플릭스',
  'LMT': '록히드 마틴',
  'RTX': 'RTX 테크',
  'BA': '보잉',
  'GE': '제너럴 일렉트릭',
  'MDA': 'MDA 스페이스',
  'MDA.TO': 'MDA 스페이스',
  // Semiconductor Top 4 + Major players
  'TSM': 'TSMC',
  'ASML': 'ASML',
  'AMD': 'AMD',
  'QCOM': '퀄컴',
  'INTC': '인텔',
  'TXN': '텍사스 인스트루먼트',
  'MU': '마이크론 테크놀로지',
  'AMAT': '어플라이드 머티어리얼즈',
  'LRCX': '램 리서치',
  'ADI': '아나로그 디바이스'
};

const ACTIVE_ETF_SEEDS: Record<string, Array<{ symbol: string; name: string; weight: number; is_foreign: boolean }>> = {
  '0180V0': [ 
    { symbol: 'SPCX', name: '스페이스X', weight: 18.5, is_foreign: true },
    { symbol: 'RKLB', name: '로켓랩', weight: 12.5, is_foreign: true },
    { symbol: 'SATS', name: '에코스타', weight: 8.5, is_foreign: true },
    { symbol: 'MDA.TO', name: 'MDA 스페이스', weight: 7.2, is_foreign: true },
    { symbol: 'LUNR', name: '인튜이티브 머신스', weight: 5.5, is_foreign: true },
    { symbol: 'ASTS', name: 'AST 스페이스모바일', weight: 4.8, is_foreign: true },
    { symbol: 'PLTR', name: '팔란티어', weight: 3.8, is_foreign: true },
    { symbol: 'SPCE', name: '버진 갤럭틱', weight: 2.2, is_foreign: true },
    { symbol: 'PL', name: '플래닛 랩스', weight: 1.2, is_foreign: true },
    { symbol: 'OTHERS', name: '기타 우주테크 12개 종목', weight: 35.3, is_foreign: true },
    { symbol: 'CASH', name: '원화 및 달러 현금', weight: 0.5, is_foreign: false }
  ],
  '0183J0': [ 
    { symbol: 'SPCX', name: '스페이스X', weight: 18.5, is_foreign: true },
    { symbol: 'RKLB', name: '로켓랩', weight: 12.5, is_foreign: true },
    { symbol: 'SATS', name: '에코스타', weight: 8.5, is_foreign: true },
    { symbol: 'MDA.TO', name: 'MDA 스페이스', weight: 7.2, is_foreign: true },
    { symbol: 'LUNR', name: '인튜이티브 머신스', weight: 5.5, is_foreign: true },
    { symbol: 'ASTS', name: 'AST 스페이스모바일', weight: 4.8, is_foreign: true },
    { symbol: 'PLTR', name: '팔란티어', weight: 3.8, is_foreign: true },
    { symbol: 'SPCE', name: '버진 갤럭틱', weight: 2.2, is_foreign: true },
    { symbol: 'PL', name: '플래닛 랩스', weight: 1.2, is_foreign: true },
    { symbol: 'OTHERS', name: '기타 우주테크 12개 종목', weight: 35.3, is_foreign: true },
    { symbol: 'CASH', name: '원화 및 달러 현금', weight: 0.5, is_foreign: false }
  ]
};

const FALLBACK_HOLDINGS_SEEDS: Record<string, Array<{ symbol: string; name: string; weight: number; is_foreign: boolean }>> = {
  '133690': [
    { symbol: 'NVDA', name: '엔비디아', weight: 8.5, is_foreign: true },
    { symbol: 'AAPL', name: '애플', weight: 7.5, is_foreign: true },
    { symbol: 'MSFT', name: '마이크로소프트', weight: 5.5, is_foreign: true },
    { symbol: 'OTHERS', name: '기타 90개 종목', weight: 78.0, is_foreign: true },
    { symbol: 'CASH', name: '원화/달러현금', weight: 0.5, is_foreign: false }
  ],
  '379800': [
    { symbol: 'MSFT', name: '마이크로소프트', weight: 6.8, is_foreign: true },
    { symbol: 'AAPL', name: '애플', weight: 6.2, is_foreign: true },
    { symbol: 'NVDA', name: '엔비디아', weight: 5.9, is_foreign: true },
    { symbol: 'OTHERS', name: '기타 S&P 490개 종목', weight: 80.6, is_foreign: true },
    { symbol: 'CASH', name: '예치금현금', weight: 0.5, is_foreign: false }
  ]
};

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
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    
    // 1. Fetch ETF info
    const { data: etfInfo, error: infoError } = await supabase
      .from('etf_info')
      .select('*')
      .eq('symbol', symbol)
      .maybeSingle();

    if (infoError || !etfInfo) {
      return NextResponse.json({ error: 'ETF가 마스터 DB에 등록되어 있지 않습니다.' }, { status: 404 });
    }

    const koCodeBase = etfInfo.ko_code;
    const americanTicker = AMERICAN_ETF_MAP[koCodeBase];
    let holdings: any[] = [];
    let isLiveFetched = false;

    // 2. Fetch from etf_holdings database table first (customized user settings)
    const { data: dbHoldings, error: dbHoldingsErr } = await supabase
      .from('etf_holdings')
      .select('*')
      .eq('etf_id', etfInfo.id);

    if (!dbHoldingsErr && dbHoldings && dbHoldings.length > 0) {
      holdings = dbHoldings.map((h: any) => ({
        symbol: h.symbol,
        name: h.name,
        weight: Number(h.weight),
        is_foreign: h.is_foreign
      }));
      isLiveFetched = true;
      console.log(`Successfully loaded holdings from custom DB for ${symbol}`);
    }

    // 3. Fetch live holdings if a passive benchmark mapping exists and DB holdings are empty
    if (!isLiveFetched && americanTicker) {
      try {
        const holdingsUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${americanTicker}?modules=topHoldings`;
        const response = await fetch(holdingsUrl, { headers: YAHOO_HEADERS, next: { revalidate: 3600 } });
        const json = await response.json();
        
        const topHoldingsData = json.quoteSummary?.result?.[0]?.topHoldings;
        
        if (topHoldingsData && topHoldingsData.holdings && topHoldingsData.holdings.length > 0) {
          const rawHoldings = topHoldingsData.holdings;
          const cashPos = topHoldingsData.cashPosition || 0.005;
          
          let top10WeightSum = 0;
          const liveHoldings = rawHoldings.map((h: any) => {
            const w = (h.holdingPercent || 0) * 100;
            top10WeightSum += w;
            
            return {
              symbol: h.symbol,
              name: STOCK_NAME_KR[h.symbol] || h.holdingName || h.symbol,
              weight: Math.round(w * 100) / 100,
              is_foreign: true
            };
          });

          const cashWeight = Math.round(cashPos * 100 * 100) / 100;
          const othersWeight = Math.max(0, 100 - top10WeightSum - cashWeight);

          liveHoldings.push({
            symbol: 'OTHERS',
            name: '기타 구성종목군',
            weight: Math.round(othersWeight * 100) / 100,
            is_foreign: true
          });

          liveHoldings.push({
            symbol: 'CASH',
            name: '예치금 및 현금',
            weight: Math.round(cashWeight * 100) / 100,
            is_foreign: false
          });

          holdings = liveHoldings;
          isLiveFetched = true;
          console.log(`Successfully fetched dynamic holdings from Yahoo for ${americanTicker}`);
        }
      } catch (err) {
        console.warn(`Yahoo topHoldings API failed for ${americanTicker}:`, err);
      }
    }

    // 4. Populate holdings for Active Space Tech or fallback seeds
    if (!isLiveFetched) {
      if (ACTIVE_ETF_SEEDS[koCodeBase]) {
        holdings = ACTIVE_ETF_SEEDS[koCodeBase];
      } else if (FALLBACK_HOLDINGS_SEEDS[koCodeBase]) {
        holdings = FALLBACK_HOLDINGS_SEEDS[koCodeBase];
      } else {
        // 💡 Dynamic Guide Seed Generator for newly created custom/active ETFs to avoid blank screens
        holdings = [
          { symbol: 'OTHERS', name: '기타 구성종목군', weight: 99.5, is_foreign: true },
          { symbol: 'CASH', name: '예치금 및 현금', weight: 0.5, is_foreign: false }
        ];
      }
    }

    // Sort: Regular stocks first (by weight desc), then OTHERS, then CASH
    const regularStocks = holdings.filter((h: any) => h.symbol !== 'OTHERS' && h.symbol !== 'CASH' && h.symbol !== 'CASH_USD');
    const specialNodes = holdings.filter((h: any) => h.symbol === 'OTHERS' || h.symbol === 'CASH' || h.symbol === 'CASH_USD');

    regularStocks.sort((a, b) => Number(b.weight) - Number(a.weight));
    specialNodes.sort((a, b) => {
      if (a.symbol === 'OTHERS') return -1;
      if (b.symbol === 'OTHERS') return 1;
      return 0;
    });

    holdings = [...regularStocks, ...specialNodes];

    // 5. Fetch FX rate and index futures
    let fxCurrent = 1380.0;
    let fxCloseAt1600 = 1380.0;
    let underCurrent = 1.0;
    let underCloseAt1600 = 1.0;

    try {
      const fxSymbol = 'USDKRW=X';
      const fxUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${fxSymbol}?interval=5m&range=2d`;
      const fxRes = await fetch(fxUrl, { headers: YAHOO_HEADERS, next: { revalidate: 15 } }).then(r => r.json());
      const fxResult = fxRes.chart?.result?.[0];
      if (fxResult) {
        fxCurrent = fxResult.meta?.regularMarketPrice || fxCurrent;
        fxCloseAt1600 = getClosingPriceAt1600(fxResult) || fxCurrent;
      }
    } catch (fxErr) {
      console.warn('Failed to fetch FX. Using default rates:', fxErr);
    }

    try {
      const underlying = etfInfo.underlying_ticker;
      const underUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${underlying}?interval=5m&range=2d`;
      const underRes = await fetch(underUrl, { headers: YAHOO_HEADERS, next: { revalidate: 15 } }).then(r => r.json());
      const underResult = underRes.chart?.result?.[0];
      if (underResult) {
        underCurrent = underResult.meta?.regularMarketPrice || underCurrent;
        underCloseAt1600 = getClosingPriceAt1600(underResult) || underCurrent;
      }
    } catch (underErr) {
      console.warn('Failed to fetch underlying index. Using defaults:', underErr);
    }

    const fxChange = fxCloseAt1600 > 0 ? ((fxCurrent - fxCloseAt1600) / fxCloseAt1600) * 100 : 0;
    const underlyingChange = underCloseAt1600 > 0 ? ((underCurrent - underCloseAt1600) / underCloseAt1600) * 100 : 0;

    // 6. Calculate real-time estimated return for each holding (Live Equities Fetch)
    let upCount = 0;
    let downCount = 0;
    let coverage = 0;

    const calculatedHoldings = await Promise.all(holdings.map(async (h: any) => {
      const weightNum = Number(h.weight);
      coverage += weightNum;

      if (!h.is_foreign) {
        return {
          symbol: h.symbol,
          name: h.name,
          weight: weightNum,
          is_foreign: false,
          changePercent: 0.0
        };
      }

      if (h.symbol === 'OTHERS') {
        const uRatio = 1 + (underlyingChange / 100);
        const fRatio = etfInfo.is_hedged ? 1.0 : (1 + (fxChange / 100));
        const indexReturn = (uRatio * fRatio - 1) * 100;
        
        if (indexReturn > 0.05) upCount++;
        else if (indexReturn < -0.05) downCount++;

        return {
          symbol: h.symbol,
          name: h.name,
          weight: weightNum,
          is_foreign: true,
          changePercent: Math.round(indexReturn * 100) / 100
        };
      }

      try {
        const assetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${h.symbol}?interval=5m&range=2d`;
        const assetRes = await fetch(assetUrl, { headers: YAHOO_HEADERS, next: { revalidate: 30 } }).then(r => r.json());
        const result = assetRes.chart?.result?.[0];
        
        if (result) {
          const currentPrice = result.meta.regularMarketPrice;
          const prevClose = result.meta.regularMarketPrice - (result.meta.regularMarketPrice * (result.meta.regularMarketChangePercent || 0) / 100);
          let stockChange = ((currentPrice - prevClose) / prevClose) * 100;

          if (!etfInfo.is_hedged) {
            const fxRatio = 1 + (fxChange / 100);
            stockChange = ((1 + stockChange / 100) * fxRatio - 1) * 100;
          }

          if (stockChange > 0.05) upCount++;
          else if (stockChange < -0.05) downCount++;

          return {
            symbol: h.symbol,
            name: h.name,
            weight: weightNum,
            is_foreign: true,
            changePercent: Math.round(stockChange * 100) / 100
          };
        }
      } catch (err) {
        console.warn(`Failed to fetch live price for individual asset ${h.symbol}:`, err);
      }

      // 💡 FIX: Failed fetches return 0.0% instead of masking identical index returns
      return {
        symbol: h.symbol,
        name: h.name,
        weight: weightNum,
        is_foreign: true,
        changePercent: 0.0
      };
    }));

    return NextResponse.json({
      etf: {
        id: etfInfo.id,
        symbol: etfInfo.symbol,
        name: etfInfo.name,
        is_hedged: etfInfo.is_hedged,
        underlying_ticker: etfInfo.underlying_ticker
      },
      holdings: calculatedHoldings,
      metrics: {
        upCount,
        downCount,
        coverage: Math.round(coverage * 10) / 10
      },
      isLiveFetched,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[ETF Constituents API Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
