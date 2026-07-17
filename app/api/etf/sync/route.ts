import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const KRX_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Content-Type': 'application/x-www-form-urlencoded',
  'Referer': 'http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201030104'
};

const SYNC_BENCHMARK_MAP: Record<string, string> = {
  '133690': 'QQQ',
  '306540': 'QQQ',
  '379800': 'SPY',
  '143850': 'SPY',
  '381030': 'SOXX',
  '465580': 'XLK',
  '0180V0': 'ARKX',
  '0183J0': 'ARKX'
};

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
  'MDA.TO': 'MDA 스페이스'
};

// Map KRX Ticker shortcuts to actual trading ticker codes (e.g. Rocket Lab, EchoStar)
const KRX_SYMBOL_MAP: Record<string, string> = {
  'RKLB': 'RKLB',
  'SPCX': 'SPCX',
  'SATS': 'SATS',
  'LUNR': 'LUNR',
  'ASTS': 'ASTS',
  'PLTR': 'PLTR',
  'SPCE': 'SPCE',
  'PL': 'PL',
  'AAPL': 'AAPL',
  'NVDA': 'NVDA',
  'MSFT': 'MSFT',
  'AMZN': 'AMZN',
  'META': 'META',
  'GOOG': 'GOOGL',
  'TSLA': 'TSLA',
  'BRK/B': 'BRK.B',
  'BRKB': 'BRK.B',
  'MDA': 'MDA.TO'
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Authenticate Request
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // 2. Fetch master ETF list
    const { data: etfs, error: etfError } = await supabase
      .from('etf_info')
      .select('*');

    if (etfError || !etfs) {
      throw new Error(etfError?.message || 'No ETFs found in master list');
    }

    const syncReport: any[] = [];
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');

    for (const etf of etfs) {
      let isSynced = false;
      let holdingsToInsert: any[] = [];
      let sourceName = 'KRX';

      // ➔ A. Primary Route: Try to fetch from Korea Exchange (KRX) official PDF
      if (etf.isin_code) {
        try {
          const bodyParams = new URLSearchParams();
          bodyParams.append('bld', 'dbnewly/MDC/STAT/standard/MDCSTAT05001');
          bodyParams.append('isuCd', etf.isin_code);
          bodyParams.append('trdDd', todayStr);
          bodyParams.append('share', '1');
          bodyParams.append('money', '1');
          bodyParams.append('csvxls_isBoard', 'N');

          const response = await fetch('http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd', {
            method: 'POST',
            headers: KRX_HEADERS,
            body: bodyParams.toString(),
            next: { revalidate: 0 }
          });

          const json = await response.json();
          const krxOutput = json.output;

          if (krxOutput && krxOutput.length > 0) {
            let totalWeight = 0;
            
            // Map KRX return schema
            holdingsToInsert = krxOutput.map((item: any) => {
              const rawWeight = Number(item.SIGOT_WGT || item.SIGOT_WT || 0);
              totalWeight += rawWeight;

              let symbol = item.ISU_SRT_CD || item.ISU_CD || 'CASH';
              // Clean up KRX symbol formatting
              symbol = symbol.replace(/^A/, '').trim(); // Remove leading A for domestic stocks
              symbol = KRX_SYMBOL_MAP[symbol] || symbol;

              let name = item.ISU_ABBRV || item.ISU_NM || symbol;
              name = STOCK_NAME_KR[symbol] || name;

              const isForeign = symbol !== 'CASH' && !/^[0-9]{6}$/.test(symbol);

              return {
                etf_id: etf.id,
                symbol: symbol,
                name: name,
                weight: Math.round(rawWeight * 100) / 100,
                is_foreign: isForeign
              };
            });

            // Adjust OTHERS calculation if not totaling 100%
            if (totalWeight < 99.0) {
              const remainingWeight = Math.max(0, 100 - totalWeight);
              holdingsToInsert.push({
                etf_id: etf.id,
                symbol: 'OTHERS',
                name: '기타 구성종목군',
                weight: Math.round(remainingWeight * 100) / 100,
                is_foreign: true
              });
            }

            isSynced = true;
            console.log(`Successfully synced ETF ${etf.symbol} holdings directly from KRX.`);
          }
        } catch (krxErr) {
          console.warn(`KRX official PDF fetch failed for ${etf.symbol}. Attempting Yahoo fallback...`, krxErr);
        }
      }

      // ➔ B. Secondary Route: Fallback to Yahoo Finance topHoldings
      if (!isSynced) {
        const americanBenchmark = SYNC_BENCHMARK_MAP[etf.ko_code];
        if (americanBenchmark) {
          try {
            sourceName = 'Yahoo Fallback';
            const holdingsUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${americanBenchmark}?modules=topHoldings`;
            const response = await fetch(holdingsUrl, { headers: YAHOO_HEADERS });
            const json = await response.json();
            
            const topHoldingsData = json.quoteSummary?.result?.[0]?.topHoldings;
            
            if (topHoldingsData && topHoldingsData.holdings && topHoldingsData.holdings.length > 0) {
              const rawHoldings = topHoldingsData.holdings;
              let top10WeightSum = 0;

              holdingsToInsert = rawHoldings.map((h: any) => {
                let symbol = h.symbol;
                let name = STOCK_NAME_KR[symbol] || h.holdingName || symbol;
                
                // Map Space Exploration Technologies to custom SPCX ticker
                if (americanBenchmark === 'ARKX' && (h.holdingName?.includes('Space Exploration') || symbol.includes('SPCX'))) {
                  symbol = 'SPCX';
                  name = '스페이스X';
                }

                const w = Math.round((h.holdingPercent || 0) * 100 * 100) / 100;
                top10WeightSum += w;

                return {
                  etf_id: etf.id,
                  symbol: symbol,
                  name: name,
                  weight: w,
                  is_foreign: symbol !== 'CASH'
                };
              });

              // Add Cash Position
              const cashPos = topHoldingsData.cashPosition || 0.005;
              const cashWeight = Math.round(cashPos * 100 * 100) / 100;
              const othersWeight = Math.max(0, 100 - top10WeightSum - cashWeight);

              holdingsToInsert.push({
                etf_id: etf.id,
                symbol: 'OTHERS',
                name: '기타 구성종목군',
                weight: Math.round(othersWeight * 100) / 100,
                is_foreign: true
              });

              holdingsToInsert.push({
                etf_id: etf.id,
                symbol: 'CASH',
                name: '예치금 및 현금',
                weight: Math.round(cashWeight * 100) / 100,
                is_foreign: false
              });

              isSynced = true;
            }
          } catch (yahooErr) {
            console.error(`Yahoo Fallback failed for ${etf.symbol}:`, yahooErr);
          }
        }
      }

      // ➔ C. Database Upsert/Rebuild Transaction
      if (isSynced && holdingsToInsert.length > 0) {
        try {
          // Delete old holdings
          await supabase
            .from('etf_holdings')
            .delete()
            .eq('etf_id', etf.id);

          // Batch Insert
          const { error: insertError } = await supabase
            .from('etf_holdings')
            .insert(holdingsToInsert);

          if (insertError) throw insertError;

          syncReport.push({
            symbol: etf.symbol,
            ko_code: etf.ko_code,
            status: 'SUCCESS',
            source: sourceName,
            holdingsCount: holdingsToInsert.length
          });
        } catch (dbErr: any) {
          syncReport.push({
            symbol: etf.symbol,
            status: 'DB_ERROR',
            reason: dbErr.message || dbErr
          });
        }
      } else {
        syncReport.push({
          symbol: etf.symbol,
          status: 'SKIPPED',
          reason: 'Could not resolve holdings from KRX or Yahoo'
        });
      }
    }

    return NextResponse.json({
      message: 'Dual-Route holdings sync completed',
      timestamp: new Date().toISOString(),
      report: syncReport
    });

  } catch (error: any) {
    console.error('[ETF Sync POST Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
