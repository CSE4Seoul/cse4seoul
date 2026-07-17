-- 1. ETF 기초 정보 테이블
CREATE TABLE IF NOT EXISTS public.etf_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) UNIQUE NOT NULL,       -- Yahoo Ticker (예시: 379800.KS)
    ko_code VARCHAR(10) UNIQUE NOT NULL,      -- 국내 종목코드 (예시: 379800)
    isin_code VARCHAR(20) UNIQUE,             -- KRX 표준 ISIN 코드 (예시: KR7379800009)
    name VARCHAR(100) NOT NULL,               -- 한글 종목명 (예시: KODEX 미국S&P500TR)
    underlying_ticker VARCHAR(20) NOT NULL,   -- 야후 선물 Ticker (예시: ES=F)
    is_hedged BOOLEAN DEFAULT FALSE NOT NULL, -- 환헤지 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 사용자별 관심 ETF 매핑 테이블 (Watchlist)
CREATE TABLE IF NOT EXISTS public.user_etf_watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    etf_id UUID REFERENCES public.etf_info(id) ON DELETE CASCADE NOT NULL,
    weight NUMERIC DEFAULT 10.0 NOT NULL,     -- 포트폴리오 비중 (%)
    avg_price NUMERIC DEFAULT 0.0 NOT NULL,    -- 구매 평균 단가 (평단가, KRW)
    quantity NUMERIC DEFAULT 0.0 NOT NULL,     -- 보유 수량 (개수)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_etf UNIQUE (user_id, etf_id)
);

-- 기존 테이블이 존재할 경우 컬럼 추가 처리
ALTER TABLE public.user_etf_watchlist ADD COLUMN IF NOT EXISTS weight NUMERIC DEFAULT 10.0 NOT NULL;
ALTER TABLE public.user_etf_watchlist ADD COLUMN IF NOT EXISTS avg_price NUMERIC DEFAULT 0.0 NOT NULL;
ALTER TABLE public.user_etf_watchlist ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 0.0 NOT NULL;

-- 3. RLS (Row Level Security) 설정
ALTER TABLE public.etf_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_etf_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etf_holdings ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 정의
CREATE POLICY "Allow public read access to etf_holdings" 
ON public.etf_holdings FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to modify holdings" 
ON public.etf_holdings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin write access to etf_holdings" 
ON public.etf_holdings FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 누구나 ETF 정보는 조회 가능, 로그인 유저는 새로운 마스터 ETF 등록(인서트) 가능
CREATE POLICY "Allow public read access to etf_info" 
ON public.etf_info FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert etf_info" 
ON public.etf_info FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update etf_info" 
ON public.etf_info FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 관심 ETF는 본인 것만 조회/등록/삭제 가능
CREATE POLICY "Users can select their own watchlist"
ON public.user_etf_watchlist FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist"
ON public.user_etf_watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist"
ON public.user_etf_watchlist FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist"
ON public.user_etf_watchlist FOR DELETE USING (auth.uid() = user_id);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_etf_watchlist_user_id ON public.user_etf_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_etf_info_symbol ON public.etf_info(symbol);

-- 6. 초기 데이터 시드 삽입
INSERT INTO public.etf_info (symbol, ko_code, isin_code, name, underlying_ticker, is_hedged) VALUES
('133690.KS', '133690', 'KR7133690008', 'TIGER 미국나스닥100', 'NQ=F', false),
('379800.KS', '379800', 'KR7379800009', 'KODEX 미국S&P500TR', 'ES=F', false),
('143850.KS', '143850', 'KR7143850007', 'TIGER 미국S&P500선물(H)', 'ES=F', true),
('306540.KS', '306540', 'KR7306540007', 'KODEX 미국나스닥100선물(H)', 'NQ=F', true),
('381030.KS', '381030', 'KR7381030007', 'TIGER 미국필라델피아반도체나스닥', 'SOXX', false),
('465580.KS', '465580', 'KR7465580002', 'ACE 미국빅테크7현물', 'NQ=F', false),
('0180V0.KS', '0180V0', 'KR70180V0001', 'ACE 미국우주항공액티브', 'NQ=F', false),
('0183J0.KS', '0183J0', 'KR70183J0003', 'TIGER 미국우주항공', 'NQ=F', false)
ON CONFLICT (symbol) DO NOTHING;
