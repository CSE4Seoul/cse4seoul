-- 018_create_study_and_tax_widgets.sql

-- 1. Study Logs (매일 공부 기록) 테이블
CREATE TABLE IF NOT EXISTS public.study_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tax & Benefit Records (세금 및 혜택/환급 기록) 테이블
CREATE TABLE IF NOT EXISTS public.tax_benefit_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    record_type VARCHAR(20) NOT NULL, -- 'tax' (세금) 또는 'benefit' (혜택/환급금)
    category VARCHAR(100) NOT NULL,  -- 예: '배당소득세', '근로소득세', 'K-패스 환급금', '청년수당' 등
    title VARCHAR(255) NOT NULL,     -- 적요/제목 (예: "8월 배당소득세", "7월 K-패스 대중교통 환급")
    amount NUMERIC(15, 2) NOT NULL,   -- 금액 (원)
    tax_rate NUMERIC(5, 2) DEFAULT 15.40, -- 세율 (%): 배당소득세 기본 15.4%
    record_date DATE NOT NULL,       -- 기재/지출/수령 일자
    notes TEXT,                       -- 추가 비고
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS (Row Level Security) 설정
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_benefit_records ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 (본인 데이터만 조회/추가/수정/삭제 가능)
-- Study Logs Policies
CREATE POLICY "Users can select their own study logs"
ON public.study_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study logs"
ON public.study_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study logs"
ON public.study_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study logs"
ON public.study_logs FOR DELETE USING (auth.uid() = user_id);

-- Tax Benefit Records Policies
CREATE POLICY "Users can select their own tax benefit records"
ON public.tax_benefit_records FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax benefit records"
ON public.tax_benefit_records FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax benefit records"
ON public.tax_benefit_records FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax benefit records"
ON public.tax_benefit_records FOR DELETE USING (auth.uid() = user_id);

-- 5. 인덱스 설정
CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON public.study_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_tax_benefit_user_date ON public.tax_benefit_records(user_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_tax_benefit_user_type ON public.tax_benefit_records(user_id, record_type);

-- 6. updated_at 트리거 설정
DROP TRIGGER IF EXISTS set_updated_at_study_logs ON public.study_logs;
CREATE TRIGGER set_updated_at_study_logs
    BEFORE UPDATE ON public.study_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_tax_benefit_records ON public.tax_benefit_records;
CREATE TRIGGER set_updated_at_tax_benefit_records
    BEFORE UPDATE ON public.tax_benefit_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
