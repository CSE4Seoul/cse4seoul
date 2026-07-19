-- 1. Book Tracker (책 정보) 테이블
CREATE TABLE IF NOT EXISTS public.book_trackers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,              -- 책 제목
    author VARCHAR(255),                      -- 저자
    publisher VARCHAR(255),                   -- 출판사
    cover_image TEXT,                         -- 표지 이미지 URL
    total_pages INTEGER,                      -- 총 페이지 수
    current_page INTEGER DEFAULT 0 NOT NULL,   -- 현재 읽은 페이지 수
    status VARCHAR(50) DEFAULT 'reading' NOT NULL, -- 상태 (reading, completed, paused, to_read)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Book Notes (인상 깊은 구절 및 자신의 생각) 테이블
-- 공부용(study)이나 세부 기록을 위해 여러 구절과 메모를 하나의 책에 연결하여 다수 생성할 수 있도록 일대다 관계로 설계합니다.
CREATE TABLE IF NOT EXISTS public.book_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_tracker_id UUID REFERENCES public.book_trackers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    page_number INTEGER,                      -- 구절이 있는 페이지
    chapter VARCHAR(255),                     -- 챕터 또는 주제
    passage TEXT NOT NULL,                    -- 인상 깊은 구절 / 공부한 핵심 내용
    thoughts TEXT,                            -- 자신의 생각 / 요약 / 코멘트
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS (Row Level Security) 설정
ALTER TABLE public.book_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_notes ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 정의 (본인 데이터만 조회/추가/수정/삭제 가능)
-- Book Trackers Policies
CREATE POLICY "Users can select their own book trackers"
ON public.book_trackers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own book trackers"
ON public.book_trackers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own book trackers"
ON public.book_trackers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book trackers"
ON public.book_trackers FOR DELETE USING (auth.uid() = user_id);

-- Book Notes Policies
CREATE POLICY "Users can select their own book notes"
ON public.book_notes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own book notes"
ON public.book_notes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own book notes"
ON public.book_notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book notes"
ON public.book_notes FOR DELETE USING (auth.uid() = user_id);

-- 5. 인덱스 및 트리거 설정
-- 책 제목(title)으로 정렬 및 조회를 자주 수행하므로 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_book_trackers_user_title ON public.book_trackers(user_id, title);
CREATE INDEX IF NOT EXISTS idx_book_notes_book_tracker_id ON public.book_notes(book_tracker_id);

-- updated_at 자동 업데이트 트리거 함수 (이미 존재할 수 있지만, 없으면 생성)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 바인딩 (존재 시 재생성 방지 위해 DROP 후 CREATE가 안전하지만 마이그레이션이므로 기본 방식을 씁니다)
DROP TRIGGER IF EXISTS set_updated_at_book_trackers ON public.book_trackers;
CREATE TRIGGER set_updated_at_book_trackers
    BEFORE UPDATE ON public.book_trackers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_book_notes ON public.book_notes;
CREATE TRIGGER set_updated_at_book_notes
    BEFORE UPDATE ON public.book_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
