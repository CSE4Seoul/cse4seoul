import { NextResponse } from 'next/server';

/**
 * Constituents API Route
 * Provides top holdings for major indices (NASDAQ via QQQ, S&P 500 via SPY).
 * For KOSPI, it returns static data as of May 2026.
 */

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

// Fallback data in case the live fetch fails
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

async function fetchFromFMP(ticker: string) {
  // Financial Modeling Prep has a free tier that includes ETF holdings
  // We use a known free-tier behavior or a common public JSON proxy if possible.
  // For this implementation, we'll use a reliable scraper-like approach on a public financial site 
  // that doesn't block simple fetches.
  try {
    const url = `https://stockanalysis.com/etf/${ticker.toLowerCase()}/holdings/`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!res.ok) throw new Error('Failed to fetch from StockAnalysis');

    const html = await res.text();
    
    // Simple regex to extract data from the table in HTML
    // Looking for patterns like: <td class="sym">NVDA</td><td class="name">NVIDIA Corporation</td>...<td class="pct">8.30%</td>
    const regex = /<td class="sym svelte-[^"]+">([^<]+)<\/td><td class="name svelte-[^"]+">([^<]+)<\/td>.*?<td class="pct svelte-[^"]+">([\d.]+)%<\/td>/g;
    
    const holdings = [];
    let match;
    let totalWeight = 0;

    while ((match = regex.exec(html)) !== null && holdings.length < 10) {
      const weight = parseFloat(match[3]);
      holdings.push({
        name: match[1], // Use symbol for brevity on pie chart
        fullName: match[2],
        weight: weight
      });
      totalWeight += weight;
    }

    if (holdings.length > 0) {
      holdings.push({
        name: ticker === 'QQQ' ? 'Others' : 'Others',
        weight: 100 - totalWeight
      });
      return holdings;
    }
    
    return null;
  } catch (error) {
    console.error(`[Constituents API] Error fetching ${ticker}:`, error);
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  if (type === 'KOSPI') {
    return NextResponse.json({ 
      data: KOSPI_STATIC,
      updatedAt: '2026-05-31',
      isStatic: true 
    });
  }

  if (type === 'NASDAQ') {
    const liveData = await fetchFromFMP('QQQ');
    return NextResponse.json({ 
      data: liveData || FALLBACK_NASDAQ,
      updatedAt: liveData ? new Date().toISOString().split('T')[0] : '2026-05-28',
      isStatic: !liveData
    });
  }

  if (type === 'S&P 500') {
    const liveData = await fetchFromFMP('SPY');
    return NextResponse.json({ 
      data: liveData || FALLBACK_SP500,
      updatedAt: liveData ? new Date().toISOString().split('T')[0] : '2026-05-28',
      isStatic: !liveData
    });
  }

  return NextResponse.json({ error: 'Invalid market type' }, { status: 400 });
}
