#include <emscripten/bind.h>
#include <cmath>
#include <algorithm>
#include <vector>

using namespace emscripten;

// 프론트엔드에서 넘겨줄 재무 데이터 구조체
struct FinancialData {
    double price;
    double shares;
    double prevShares;
    double netIncome;
    double prevNetIncome;
    double totalAssets;
    double prevTotalAssets;
    double totalLiabilities;
    double prevTotalLiabilities;
    double equity;
    double prevEquity;
    double cfo; // Cash Flow from Operations
    double eps;
    double prevEps;
    double bps;
    double currentAssets;
    double prevCurrentAssets;
    double currentLiabilities;
    double prevCurrentLiabilities;
    double grossProfit;
    double prevGrossProfit;
    double revenue;
    double prevRevenue;
};

// 분석 결과 반환 구조체
struct AnalysisResult {
    double grahamPrice;
    int fScore;
    int buffettScore;
    double roe;
    double debtToEquity;
};

// 가치투자 스코어링 클래스
class ValueAnalyzer {
public:
    static AnalysisResult analyze(FinancialData data) {
        AnalysisResult result = {0.0, 0, 0, 0.0, 0.0};

        // 1. 벤저민 그레이엄 적정 주가: sqrt(22.5 * EPS * BPS)
        // EPS나 BPS가 음수일 경우 실질적 가치 산정이 어려우므로 0 처리
        if (data.eps > 0 && data.bps > 0) {
            result.grahamPrice = std::sqrt(22.5 * data.eps * data.bps);
        } else {
            result.grahamPrice = 0.0;
        }

        // 2. 피오트로스키 F-스코어 (0~9점)
        int f = 0;
        
        // 수익성 지표
        if (data.netIncome > 0) f++; // 1. 당기순이익 양수
        
        double roa = (data.totalAssets > 0) ? data.netIncome / data.totalAssets : 0;
        if (roa > 0) f++; // 2. ROA 양수
        
        if (data.cfo > 0) f++; // 3. 영업현금흐름 양수
        if (data.cfo > data.netIncome) f++; // 4. 영업현금흐름 > 당기순이익 (수익의 질)

        // 재무구조 및 효율성 지표
        double prevRoa = (data.prevTotalAssets > 0) ? data.prevNetIncome / data.prevTotalAssets : 0;
        if (roa > prevRoa) f++; // 5. ROA 개선
        
        double leverage = (data.totalAssets > 0) ? data.totalLiabilities / data.totalAssets : 0;
        double prevLeverage = (data.prevTotalAssets > 0) ? data.prevTotalLiabilities / data.prevTotalAssets : 0;
        if (leverage < prevLeverage) f++; // 6. 부채비율(LTD/Assets) 감소
        
        double currentRatio = (data.currentLiabilities > 0) ? data.currentAssets / data.currentLiabilities : 0;
        double prevCurrentRatio = (data.prevCurrentLiabilities > 0) ? data.prevCurrentAssets / data.prevCurrentLiabilities : 0;
        if (currentRatio > prevCurrentRatio) f++; // 7. 유동비율 개선
        
        if (data.shares <= data.prevShares + 0.001) f++; // 8. 신주 발행 없음 (주식수 유지/감소)
        
        double grossMargin = (data.revenue > 0) ? data.grossProfit / data.revenue : 0;
        double prevGrossMargin = (data.prevRevenue > 0) ? data.prevGrossProfit / data.prevRevenue : 0;
        if (grossMargin > prevGrossMargin) f++; // 9. 매출총이익률 개선

        result.fScore = f;

        // 3. 워런 버핏 퀄리티 필터 (0~3점)
        int b = 0;
        
        // ROE >= 15%
        double roe = (data.equity > 0) ? (data.netIncome / data.equity) * 100.0 : 0;
        result.roe = roe;
        if (roe >= 15.0) b++;
        
        // 부채비율 <= 50%
        double d2e = (data.equity > 0) ? (data.totalLiabilities / data.equity) * 100.0 : 0;
        result.debtToEquity = d2e;
        if (d2e <= 50.0) b++;
        
        // EPS 증가
        if (data.eps > data.prevEps) b++;
        
        result.buffettScore = b;

        return result;
    }

    // 주식수 비교를 위한 헬퍼 필드 (FinancialData에 포함되지 않은 prevShares를 위해 shares 비교 로직 수정 필요시)
    // 여기서는 data.shares 가 현재 주식수, prevShares는 이전 주식수로 가정 (데이터 구조에 추가)
};

// Emscripten 바인딩
EMSCRIPTEN_BINDINGS(value_analyzer) {
    value_object<FinancialData>("FinancialData")
        .field("price", &FinancialData::price)
        .field("shares", &FinancialData::shares)
        .field("prevShares", &FinancialData::prevShares)
        .field("netIncome", &FinancialData::netIncome)
        .field("prevNetIncome", &FinancialData::prevNetIncome)
        .field("totalAssets", &FinancialData::totalAssets)
        .field("prevTotalAssets", &FinancialData::prevTotalAssets)
        .field("totalLiabilities", &FinancialData::totalLiabilities)
        .field("prevTotalLiabilities", &FinancialData::prevTotalLiabilities)
        .field("equity", &FinancialData::equity)
        .field("prevEquity", &FinancialData::prevEquity)
        .field("cfo", &FinancialData::cfo)
        .field("eps", &FinancialData::eps)
        .field("prevEps", &FinancialData::prevEps)
        .field("bps", &FinancialData::bps)
        .field("currentAssets", &FinancialData::currentAssets)
        .field("prevCurrentAssets", &FinancialData::prevCurrentAssets)
        .field("currentLiabilities", &FinancialData::currentLiabilities)
        .field("prevCurrentLiabilities", &FinancialData::prevCurrentLiabilities)
        .field("grossProfit", &FinancialData::grossProfit)
        .field("prevGrossProfit", &FinancialData::prevGrossProfit)
        .field("revenue", &FinancialData::revenue)
        .field("prevRevenue", &FinancialData::prevRevenue);

    value_object<AnalysisResult>("AnalysisResult")
        .field("grahamPrice", &AnalysisResult::grahamPrice)
        .field("fScore", &AnalysisResult::fScore)
        .field("buffettScore", &AnalysisResult::buffettScore)
        .field("roe", &AnalysisResult::roe)
        .field("debtToEquity", &AnalysisResult::debtToEquity);

    class_<ValueAnalyzer>("ValueAnalyzer")
        .class_function("analyze", &ValueAnalyzer::analyze);
}
