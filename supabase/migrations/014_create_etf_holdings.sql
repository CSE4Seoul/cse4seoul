-- 1. ETF 구성종목(Holdings/PDF) 테이블 생성
CREATE TABLE IF NOT EXISTS public.etf_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etf_id UUID REFERENCES public.etf_info(id) ON DELETE CASCADE NOT NULL,
    symbol VARCHAR(20) NOT NULL,              -- 구성 종목 심볼 (예: 'AAPL', 'NVDA', '005930.KS')
    name VARCHAR(100) NOT NULL,               -- 구성 종목 한글/영문명 (예: '애플', '삼성전자')
    weight NUMERIC DEFAULT 0.0 NOT NULL,      -- 구성 비중 (%)
    is_foreign BOOLEAN DEFAULT TRUE NOT NULL,  -- 해외 자산 여부 (해외 주식인 경우 환율 변동을 적용하기 위함)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_etf_holdings_etf_id ON public.etf_holdings(etf_id);

-- 3. RLS (Row Level Security) 설정
ALTER TABLE public.etf_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to etf_holdings" ON public.etf_holdings FOR SELECT USING (true);
CREATE POLICY "Allow admin write access to etf_holdings" ON public.etf_holdings 
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
