# 📊 시장 지수 구성 종목 데이터 자동화 가이드

이 문서는 `ExchangeRateWidget` 및 기타 시장 분석 도구에서 사용되는 지수 구성 종목(KOSPI, NASDAQ, S&P 500 등)과 비중 데이터를 수동 업데이트 대신 자동으로 불러오기 위한 전략을 기록합니다.

## 1. 현재 상태 (2026-05-31)
- **방식**: 하드코딩 (Hardcoded)
- **위치**: `components/ExchangeRateWidget.tsx` 내 `INDEX_COMPONENTS` 상수
- **특이사항**: 2026년 5월 시장 상황(삼성전자 32.3%, SK하이닉스 29.3% 등)을 수동으로 반영함.

---

## 2. 자동화 로드맵 (Proposed Strategies)

### Strategy A: 전용 금융 API 서비스 이용 (가장 안정적)
가장 표준적인 방법으로, 유료/무료 금융 데이터 공급자의 REST API를 사용합니다.
- **추천 서비스**:
    - [Financial Modeling Prep](https://financialmodelingprep.com/): ETF Holdings API 제공.
    - [EODHD](https://eodhd.com/): 글로벌 시장 및 한국 시장 데이터 지원.
- **구현 방법**:
    ```typescript
    // app/api/market/constituents/route.ts (가상 코드)
    const res = await fetch(`https://api.eodhd.com/api/etf/069500.KO?api_token=YOUR_TOKEN&fmt=json`);
    const data = await res.json();
    return NextResponse.json(data.holdings.slice(0, 10));
    ```

### Strategy B: 공공데이터포털 KRX Open API (정석/무료)
한국거래소(KRX)에서 제공하는 공식 데이터를 사용하는 방법입니다.
- **필요 절차**:
    1. [공공데이터포털](https://www.data.go.kr/) 가입 및 '한국거래소' API 신청.
    2. API 키 발급 후 `Next.js` 환경변수에 저장.
- **장점**: 데이터의 법적/수치적 공신력이 가장 높고 무료임.

### Strategy C: 서버사이드 스크래핑 (현실적 우회로)
별도의 API 권한 없이 금융 포털 사이트의 데이터를 서버에서 추출합니다.
- **대상 사이트**: 네이버 페이 증권, Yahoo Finance, Investing.com
- **구현 도구**: `cheerio`, `puppeteer` (서버 리소스 고려 필요)
- **주의사항**: 사이트 UI 구조가 변경될 경우 파싱 코드를 수정해야 함.

---

## 3. 추천 개발 단계
1. **1단계 (관리 편의화)**: 현재 컴포넌트 내부의 데이터를 `lib/data/market-config.json`과 같은 설정 파일로 분리하여 코드 수정 없이 데이터만 관리.
2. **2단계 (서버 API 구축)**: `app/api/market/constituents/route.ts`를 생성하여 위 전략 중 하나를 선택해 구현.
3. **3단계 (프론트엔드 연동)**: `ExchangeRateWidget`에서 `useEffect`를 통해 위 API를 호출하도록 수정.

---

## 4. 참고 정보
- **KODEX 200 (KOSPI 200 ETF)**: `069500` (KRX)
- **Invesco QQQ (NASDAQ 100 ETF)**: `QQQ` (NASDAQ)
- **SPDR S&P 500 ETF**: `SPY` (NYSE)
