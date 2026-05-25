import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '1d';
  const range = searchParams.get('range') || '1mo';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('No data found for the given symbol');
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const indicators = result.indicators?.quote?.[0] || {};
    const quotes = indicators.close || [];

    if (timestamps.length === 0) {
      return NextResponse.json({
        symbol,
        data: [],
        currentValue: result.meta?.regularMarketPrice || 0,
        previousClose: result.meta?.chartPreviousClose || 0,
      });
    }

    const formattedData = timestamps.map((timestamp: number, index: number) => ({
      timestamp: timestamp * 1000, // Convert to ms
      value: quotes[index],
    })).filter((item: any) => item.value !== null && item.value !== undefined);

    return NextResponse.json({
      symbol,
      data: formattedData,
      currentValue: result.meta.regularMarketPrice,
      previousClose: result.meta.chartPreviousClose,
    });
  } catch (error: any) {
    console.error('[Market API Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
