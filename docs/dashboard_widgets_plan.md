# 📋 학습 기록 & 세금/혜택 비교 대시보드 위젯 기획 및 개발 프롬프트

본 문서는 로그인한 사용자를 위한 **[1. 매일 공부 기록 및 복습/TXT 추출 위젯]**과 **[2. 세금 납부 및 혜택 비교(배당소득세 15.4%, K-패스 환급금 등) 위젯]**의 상세 기획, DB 설계, UI/UX 구조 및 AI 개발 실행 프롬프트를 담고 있습니다.

---

## 📌 1. 시스템 전체 개요 (Overview)

- **대상 사용자**: 로그인(인증)된 유저
- **주요 목적**: 
  1. 개인별 매일의 학습 내용을 기록하고, 지정 일자의 공부 내용을 양식(`[YYYY-MM-DD] 내용`)으로 모아 복습 및 `.txt` 파일로 추출/보관.
  2. 납부한 세금(배당소득세 15.4% 자동 계산 포함)과 제공받은 혜택/환급금(K-패스 대중교통 환급금 등)을 등록/수정/조회하여 실질 혜택 및 순 손익을 직관적으로 비교 분석.
- **기술 스택**: Next.js (App Router, React 18+), Supabase (PostgreSQL, Row Level Security), Tailwind CSS, Lucide Icons.

---

## 📑 2. 위젯 1: 매일 학습 기록 & 복습/TXT 추출 위젯 (Daily Study Widget)

### 2.1 주요 기능 요구사항
1. **일일 공부 내용 줄글 기록 (CRUD)**
   - 날짜(기본 오늘), 과목/주제, 학습 상세 내용(줄글/멀티라인) 입력 및 저장.
   - 기존 작성 내역 수정 및 삭제 지원.
2. **날짜별 지정 복습 모드 (Review Mode)**
   - 특정 기간(최근 7일, 최근 30일, 전체) 또는 사용자가 지정한 복수 날짜의 공부 내역 모아보기.
   - 복습 텍스트 표준 출력 포맷:
     ```text
     [2026-08-10] 공부 내용...
     [2026-08-11] 수학 공부 내용...
     ```
3. **TXT 파일 추출 & 클립보드 복사**
   - 모아본 복습 내역을 원클릭으로 `.txt` 텍스트 파일 다운로드.
   - 클립보드 원클릭 복사 지원.
4. **검색 및 과목별 필터링**
   - 키워드 검색 및 과목(수학, 영어, 개발 등) 필터링.

---

## 📑 3. 위젯 2: 세금 납부 & 혜택 비교 위젯 (Tax & Benefit Comparison Widget)

### 3.1 주요 기능 요구사항
1. **세금(Tax) 기록 & 배당소득세 자동 계산기**
   - 배당소득세 (기본 15.4%), 근로소득세, 지방소득세 등 등록/수정/삭제.
   - **배당소득세 계산기 기능**: 배당금 원금을 입력하면 15.4% 세금(국세 14% + 지방소득세 1.4%)과 실수령액을 자동 계산하여 즉시 기록 등록.
2. **혜택 및 환급금(Benefit) 기록**
   - K-패스 대중교통 환급금, 연말정산 환급금, 청년수당 등 등록/수정/삭제.
3. **손익 및 세금 vs 혜택 수치 비교 대시보드**
   - **총 납부 세금** vs **총 받은 혜택/환급금** 비교 Card 제공.
   - **순 혜택(Net Benefit = 받은 혜택 - 납부 세금)** 및 **세금 대비 혜택 비율(%)** 자동 산출.
4. **데이터 수정 및 재조회 (CRUD & Local Cache)**
   - 등록된 항목의 금액, 날짜, 비고, 카테고리 실시간 수정/삭제/조회.
   - 네트워크 지연 시 LocalStorage 백업 및 Supabase DB 연동.

---

## 🗄️ 4. 데이터베이스(DB) 테이블 설계 (Database Schema)

### 4.1 `study_logs` (학습 기록 테이블)
```sql
CREATE TABLE IF NOT EXISTS public.study_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 설정 및 인덱스
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own study logs"
ON public.study_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON public.study_logs(user_id, log_date DESC);
```

### 4.2 `tax_benefit_records` (세금 및 혜택 기록 테이블)
```sql
CREATE TABLE IF NOT EXISTS public.tax_benefit_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    record_type VARCHAR(20) NOT NULL, -- 'tax' (세금) 또는 'benefit' (혜택/환급금)
    category VARCHAR(100) NOT NULL,  -- 예: '배당소득세', '근로소득세', 'K-패스 환급금'
    title VARCHAR(255) NOT NULL,     -- 제목/적요 (예: "8월 배당소득세", "7월 K-패스 환급")
    amount NUMERIC(15, 2) NOT NULL,   -- 금액 (원)
    tax_rate NUMERIC(5, 2) DEFAULT 15.40, -- 세율 (%): 배당소득세 기본 15.4%
    record_date DATE NOT NULL,       -- 거래/지출/수령 일자
    notes TEXT,                       -- 추가 비고
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 설정 및 인덱스
ALTER TABLE public.tax_benefit_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tax benefit records"
ON public.tax_benefit_records FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tax_benefit_user_date ON public.tax_benefit_records(user_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_tax_benefit_user_type ON public.tax_benefit_records(user_id, record_type);
```

---

## 🎨 5. UI / UX Layout 구조

### 5.1 학습 기록 & 복습 위젯 레이아웃
```text
+------------------------------------------------------------------------+
| 📚 일일 학습 기록 & 복습 노하우                      [ ✍️ 작성 | 📖 복습 모드 ] |
+------------------------------------------------------------------------+
| [✍️ 작성 탭]                                                            |
| 날짜 [2026-08-12]  과목 [ 수학 / 개발 / 영어 ]                            |
| 내용 (줄글 입력...)                                                      |
| [💾 기록 저장하기]                                                       |
|                                                                        |
| [📖 복습 탭]                                                            |
| 필터: ( ) 전체  ( ) 최근 7일  ( ) 최근 30일  ( ) 직접 지정                      |
| +--------------------------------------------------------------------+ |
| | [2026-08-10] 리액트 상태 관리 및 훅 복습 내용...                    | |
| | [2026-08-11] 수학 미적분 기본 개념 및 문제 풀이...                   | |
| +--------------------------------------------------------------------+ |
| [📋 클립보드 복사]   [📥 TXT 파일로 추출 (.txt)]                           |
+------------------------------------------------------------------------+
```

### 5.2 세금 & 혜택 비교 위젯 레이아웃
```text
+------------------------------------------------------------------------+
| 💸 세금 납부 & 혜택/환급 비교 대시보드                                    |
+------------------------------------------------------------------------+
| +-------------------+  +-------------------+  +-------------------+ |
| | 🔴 총 납부 세금   |  | 🟢 총 받은 혜택   |  | ⚖️ 순 손익 혜택   | |
| | ₩ 154,000         |  | ₩ 250,000         |  | + ₩ 96,000        | |
| +-------------------+  +-------------------+  +-------------------+ |
|                                                                        |
| [🧮 배당소득세(15.4%) 빠른 계산기 열기]                                   |
|                                                                        |
| [➕ 내역 추가 / 수정 폼]                                                 |
| 구분: (•) 세금 ( ) 혜택/환급   분류: [ 배당소득세 (15.4%) ▾ ]               |
| 제목: [ 8월 국내주식 배당 세금 ]   금액: [ 15,400 ]원                       |
| [💾 내역 저장]                                                         |
|                                                                        |
| 📜 최근 입력 목록 (수정 | 삭제 가능)                                       |
| - [2026-08-10] [세금] 배당소득세: ₩ 15,400                               |
| - [2026-08-05] [혜택] K-패스 환급금: ₩ 23,500                            |
+------------------------------------------------------------------------+
```

---

## 🤖 6. AI 개발 실행 프롬프트 (Prompt for AI Assistant / Developer)

아래 프롬프트를 AI 에이전트 또는 개발자에게 전달하여 위젯을 즉시 구현/확장할 수 있습니다.

```markdown
[시스템 명령어]
당신은 Next.js 및 Supabase 전문 풀스택 개발자입니다. 로그인한 사용자를 위한 2가지 핵심 대시보드 위젯을 구현해 주세요.

[요구사항 1: 매일 학습 기록 & 복습/TXT 추출 위젯 (components/widgets/DailyStudyWidget.tsx)]
1. Supabase 'study_logs' 테이블과 연동하여 사용자의 일일 학습 기록을 C.R.U.D 처리하세요.
2. 폼에서 날짜, 과목(subject), 줄글 내용(content)을 입력하여 저장할 수 있어야 합니다.
3. [복습 탭]에서는 작성된 공부 내용을 아래와 같은 형식으로 조합하여 한 번에 보여주세요:
   [YYYY-MM-DD] 공부 내용
   [YYYY-MM-DD] 수학 공부 내용
4. 기간 필터(전체, 최근 7일, 최근 30일, 사용자 지정 날짜)를 지원하세요.
5. 복습 내역을 `.txt` 파일로 다운로드하는 기능(Blob 이용)과 클립보드에 복사하는 기능을 구현하세요.

[요구사항 2: 세금 및 혜택 비교 위젯 (components/widgets/TaxBenefitWidget.tsx)]
1. Supabase 'tax_benefit_records' 테이블과 연동하여 납부 세금과 받은 혜택(환급금)을 관리하세요.
2. 배당소득세(15.4%), K-패스 환급금, 근로소득세, 연말정산 등 주요 카테고리를 기본 제공하세요.
3. 배당금 원금을 입력하면 15.4% 세금을 자동 계산해 주는 '배당소득세 계산기' 기능을 포함하세요.
4. 상단 요약 카드에 [총 납부 세금], [총 받은 혜택], [순 손익/혜택 금액]을 계산하여 직관적으로 보여주세요.
5. 입력된 모든 데이터는 언제든지 수정 및 삭제(CRUD)가 가능해야 합니다.

[공통 요구사항]
- Supabase DB 통신 실패 시 LocalStorage를  fallback 백업으로 활용하여 데이터 손실이 없도록 처리하세요.
- Tailwind CSS를 사용하여 반응형 및 세련된 모던 UI 디자인을 제공하세요.
- TypeScript 인터페이스를 엄격히 선언하세요.
```

---

## 🚀 7. 검증 및 확인 테스트 체크리스트 (Verification Checklist)

- [x] **Database**: Supabase `study_logs`, `tax_benefit_records` 테이블 및 RLS 정책 생성 완료 (`018_create_study_and_tax_widgets.sql`).
- [x] **Study Widget**: 일자별 줄글 기록, `[YYYY-MM-DD] 내용` 복습 포맷, `.txt` 파일 다운로드 기능 구현 완료.
- [x] **Tax/Benefit Widget**: 배당소득세 15.4% 계산기, K-패스 환급금 등 세금 vs 혜택 수치 비교 카드 및 CRUD 기능 구현 완료.
- [x] **UI/UX**: Tailwind CSS 기반 반사/다크모드 완벽 대응 컴포넌트 탑재.
