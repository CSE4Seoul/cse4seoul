import { NextResponse } from 'next/server';

const KOSPI_STATIC = [
  { name: '삼성전자', weight: 32.3 },
  { name: 'SK하이닉스', weight: 29.3 },
  { name: '현대차', weight: 1.8 },
  { name: 'KB금융', weight: 1.5 },
  { name: '셀트리온', weight: 1.2 },
  { name: '기아', weight: 1.1 },
  { name: 'POSCO홀딩스', weight: 0.9 },
  { name: '신한지주', weight: 0.8 },
  { name: '네이버', weight: 0.7 },
  { name: 'LG화학', weight: 0.6 },
  { name: '기타', weight: 29.8 }
];

const FALLBACK_NASDAQ = [
  { name: 'NVIDIA', weight: 8.3 },
  { name: 'Apple', weight: 7.3 },
  { name: 'Microsoft', weight: 5.1 },
  { name: 'Amazon', weight: 4.7 },
  { name: 'Micron', weight: 4.6 },
  { name: 'AMD', weight: 3.7 },
  { name: 'Alphabet (A)', weight: 3.6 },
  { name: 'Tesla', weight: 3.5 },
  { name: 'Alphabet (C)', weight: 3.4 },
  { name: 'Broadcom', weight: 3.2 },
  { name: 'Others', weight: 52.6 }
];

const FALLBACK_SP500 = [
  { name: 'NVIDIA', weight: 8.0 },
  { name: 'Apple', weight: 7.1 },
  { name: 'Microsoft', weight: 4.9 },
  { name: 'Amazon', weight: 4.1 },
  { name: 'Alphabet (A)', weight: 3.5 },
  { name: 'Broadcom', weight: 3.1 },
  { name: 'Alphabet (C)', weight: 2.8 },
  { name: 'Meta', weight: 2.1 },
  { name: 'Tesla', weight: 1.9 },
  { name: 'Micron', weight: 1.6 },
  { name: 'Others', weight: 60.9 }
];

// Helper: Scrape ETF holdings
async function fetchFromStockAnalysis(ticker: string) {
  try {
    const url = `https://stockanalysis.com/etf/${ticker.toLowerCase()}/holdings/`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) throw new Error(`Failed to fetch holdings for ${ticker}`);

    const html = await res.text();
    // Regular expression to scrape symbol, full name, and weight percentage
    const regex = /<td class="sym svelte-[^"]+">([^<]+)<\/td><td class="name svelte-[^"]+">([^<]+)<\/td>.*?<td class="pct svelte-[^"]+">([\d.]+)%<\/td>/g;
    
    const holdings = [];
    let match;
    let totalWeight = 0;

    while ((match = regex.exec(html)) !== null && holdings.length < 10) {
      const weight = parseFloat(match[3]);
      holdings.push({
        name: match[1], // Symbol
        fullName: match[2],
        weight: weight
      });
      totalWeight += weight;
    }

    if (holdings.length > 0) {
      holdings.push({
        name: 'Others',
        fullName: '기타 종목군',
        weight: Math.round((100 - totalWeight) * 100) / 100
      });
      return holdings;
    }
    
    return null;
  } catch (error) {
    console.error(`[Constituents API] Error scraping ${ticker}:`, error);
    return null;
  }
}

// Helper: Fetch real-time changes for top holdings in bulk
async function fetchHoldingsRealtimeQuotes(symbols: string[]): Promise<Record<string, number>> {
  if (symbols.length === 0) return {};
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }).then(r => r.json());

    const quotes = res.quoteResponse?.result || [];
    const changeMap: Record<string, number> = {};
    for (const q of quotes) {
      if (q.symbol) {
        changeMap[q.symbol] = q.regularMarketChangePercent || 0;
      }
    }
    return changeMap;
  } catch (err) {
    console.error('[Constituents API] Failed to fetch bulk quotes:', err);
    return {};
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const ticker = searchParams.get('ticker'); // 💡 New ticker parameter support

  try {
    // 1. Dynamic fetch if specific ticker is provided
    if (ticker) {
      const holdings = await fetchFromStockAnalysis(ticker);
      if (holdings) {
        // Retrieve real-time quote changes in bulk for the top 10 tickers
        const symbols = holdings
          .map(h => h.name)
          .filter(sym => sym && sym !== 'Others');
          
        const quoteMap = await fetchHoldingsRealtimeQuotes(symbols);
        
        const richHoldings = holdings.map(h => ({
          ...h,
          changePercent: quoteMap[h.name] !== undefined ? Math.round(quoteMap[h.name] * 100) / 100 : undefined
        }));

        return NextResponse.json({
          ticker: ticker.toUpperCase(),
          data: richHoldings,
          updatedAt: new Date().toISOString(),
          isStatic: false
        });
      }
      return NextResponse.json({ error: `Holdings not found for ticker ${ticker}` }, { status: 404 });
    }

    // 2. Legacy / Static Type fallbacks
    if (type === 'KOSPI') {
      return NextResponse.json({ 
        data: KOSPI_STATIC,
        updatedAt: '2026-05-31',
        isStatic: true 
      });
    }

    if (type === 'NASDAQ') {
      const liveData = await fetchFromStockAnalysis('QQQ');
      const symbols = (liveData || FALLBACK_NASDAQ).map(h => h.name).filter(s => s !== 'Others');
      const quoteMap = await fetchHoldingsRealtimeQuotes(symbols);
      const richHoldings = (liveData || FALLBACK_NASDAQ).map(h => ({
        ...h,
        changePercent: quoteMap[h.name] !== undefined ? Math.round(quoteMap[h.name] * 100) / 100 : undefined
      }));

      return NextResponse.json({ 
        data: richHoldings,
        updatedAt: liveData ? new Date().toISOString() : '2026-05-28',
        isStatic: !liveData
      });
    }

    if (type === 'S&P 500') {
      const liveData = await fetchFromStockAnalysis('SPY');
      const symbols = (liveData || FALLBACK_SP500).map(h => h.name).filter(s => s !== 'Others');
      const quoteMap = await fetchHoldingsRealtimeQuotes(symbols);
      const richHoldings = (liveData || FALLBACK_SP500).map(h => ({
        ...h,
        changePercent: quoteMap[h.name] !== undefined ? Math.round(quoteMap[h.name] * 100) / 100 : undefined
      }));

      return NextResponse.json({ 
        data: richHoldings,
        updatedAt: liveData ? new Date().toISOString() : '2026-05-28',
        isStatic: !liveData
      });
    }

    return NextResponse.json({ error: 'Query parameters (ticker or type) are missing or invalid' }, { status: 400 });
  } catch (error: any) {
    console.error('[Constituents API Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
