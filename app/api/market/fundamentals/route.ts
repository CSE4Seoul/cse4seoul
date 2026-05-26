import { NextResponse } from 'next/server';

/**
 * Fundamentals API Route
 * Fetches real-time price from Yahoo Finance and fundamental data from SEC EDGAR.
 */

const SEC_USER_AGENT = 'Gemini-CLI gemini-cli@example.com';

async function getCikMap() {
  const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
    headers: { 'User-Agent': SEC_USER_AGENT }
  });
  if (!res.ok) throw new Error('Failed to fetch Ticker-CIK map');
  return await res.json();
}

async function getSECData(cik: string) {
  const paddedCik = cik.toString().padStart(10, '0');
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': SEC_USER_AGENT }
  });
  if (!res.ok) throw new Error(`SEC API responded with status ${res.status}`);
  return await res.json();
}

/**
 * Robustly extracts the latest value for a given concept.
 * Tries multiple units and sorts by date.
 */
function getLatestValue(facts: any, concept: string, preferredUnit: string = 'USD') {
  const conceptData = facts?.facts?.['us-gaap']?.[concept];
  if (!conceptData) return { val: 0, prev: 0 };

  let unitData = conceptData.units?.[preferredUnit];
  if (!unitData) {
    const availableUnits = Object.keys(conceptData.units || {});
    if (availableUnits.length > 0) {
      unitData = conceptData.units[availableUnits[0]];
    }
  }

  if (!unitData || unitData.length === 0) return { val: 0, prev: 0 };
  
  const sorted = [...unitData].sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime());
  const latest = sorted[0];
  const previous = sorted.find((i: any) => i.end !== latest.end) || latest;
  
  return { val: latest.val, prev: previous.val };
}

/**
 * Tries to get Trailing Twelve Months (TTM) value for Income Statement items.
 * Simplification: Looks for the latest entry that covers a full year (end - start approx 365 days)
 * or the latest FY form entry.
 */
function getTTMValue(facts: any, concept: string, preferredUnit: string = 'USD') {
  const conceptData = facts?.facts?.['us-gaap']?.[concept];
  if (!conceptData) return { val: 0, prev: 0 };

  let unitData = conceptData.units?.[preferredUnit];
  if (!unitData) {
    const availableUnits = Object.keys(conceptData.units || {});
    if (availableUnits.length > 0) unitData = conceptData.units[availableUnits[0]];
  }

  if (!unitData || unitData.length === 0) return { val: 0, prev: 0 };

  // Try to find Annual entries first
  const annualEntries = unitData.filter((i: any) => {
    if (!i.start) return false;
    const diff = (new Date(i.end).getTime() - new Date(i.start).getTime()) / (1000 * 60 * 60 * 24);
    return diff > 300 && diff < 380;
  }).sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime());

  if (annualEntries.length > 0) {
    return { val: annualEntries[0].val, prev: annualEntries[1]?.val || annualEntries[0].val };
  }

  // Fallback to latest available (might be quarterly, but better than 0)
  return getLatestValue(facts, concept, preferredUnit);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol')?.toUpperCase();

  if (!symbol) return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });

  try {
    // 1. Yahoo Price
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const yahooRes = await fetch(yahooUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    let currentPrice = 0;
    let tickerName = symbol;

    if (yahooRes.ok) {
      const yahooData = await yahooRes.json();
      const meta = yahooData.chart?.result?.[0]?.meta;
      currentPrice = meta?.regularMarketPrice || 0;
      tickerName = meta?.longName || symbol;
    }

    // 2. SEC Fundamentals
    const cikMap = await getCikMap();
    const companyInfo = Object.values(cikMap).find((item: any) => item.ticker === symbol) as any;
    
    if (!companyInfo) {
      return NextResponse.json({ 
        error: '미국 SEC 데이터베이스에서 기업을 찾을 수 없습니다. (미국 상장사만 지원)',
        symbol, price: currentPrice
      }, { status: 404 });
    }

    const facts = await getSECData(companyInfo.cik_str);
    
    // Balance Sheet (Latest point)
    const assets = getLatestValue(facts, 'Assets');
    const liabilities = getLatestValue(facts, 'Liabilities');
    const equity = getLatestValue(facts, 'StockholdersEquity');
    const currentAssets = getLatestValue(facts, 'AssetsCurrent');
    const currentLiabilities = getLatestValue(facts, 'LiabilitiesCurrent');
    
    // Shares (Latest)
    let shares = getLatestValue(facts, 'CommonStockSharesOutstanding', 'shares');
    if (shares.val === 0) shares = getLatestValue(facts, 'EntityCommonStockSharesOutstanding', 'shares');
    if (shares.val === 0) shares = getLatestValue(facts, 'WeightedAverageNumberOfDilutedSharesOutstanding', 'shares');

    // Income Statement (Annual/TTM)
    const netIncome = getTTMValue(facts, 'NetIncomeLoss');
    const cfo = getTTMValue(facts, 'NetCashProvidedByUsedInOperatingActivities');
    const eps = getTTMValue(facts, 'EarningsPerShareDiluted', 'USD/shares');
    
    let revenue = getTTMValue(facts, 'Revenues');
    if (revenue.val === 0) revenue = getTTMValue(facts, 'SalesRevenueNet');
    
    const grossProfit = getTTMValue(facts, 'GrossProfit');

    // Derived
    const bps = (shares.val > 0) ? equity.val / shares.val : 0;

    const data = {
      price: currentPrice,
      name: tickerName,
      netIncome: netIncome.val,
      prevNetIncome: netIncome.prev,
      totalAssets: assets.val,
      prevTotalAssets: assets.prev,
      totalLiabilities: liabilities.val,
      prevTotalLiabilities: liabilities.prev,
      equity: equity.val,
      prevEquity: equity.prev,
      cfo: cfo.val,
      eps: eps.val,
      prevEps: eps.prev,
      bps: bps,
      revenue: revenue.val,
      prevRevenue: revenue.prev,
      grossProfit: grossProfit.val,
      prevGrossProfit: grossProfit.prev,
      currentAssets: currentAssets.val,
      prevCurrentAssets: currentAssets.prev,
      currentLiabilities: currentLiabilities.val,
      prevCurrentLiabilities: currentLiabilities.prev,
      shares: shares.val,
      prevShares: shares.prev,
    };

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Fundamentals API Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
