#include <emscripten/emscripten.h>
#include <vector>
#include <numeric>
#include <cmath>
#include <algorithm>

extern "C" {

// 이동평균 계산 (SMA)
double getMA(const double* data, int n, int period) {
    if (n < period) return 0.0;
    double sum = 0.0;
    for (int i = n - period; i < n; ++i) sum += data[i];
    return sum / period;
}

// 기울기 계산
double getSlope(const double* data, int n, int period) {
    if (n < period + 1) return 0.0;
    double currentMA = getMA(data, n, period);
    double prevMA = getMA(data, n - 1, period);
    return currentMA - prevMA;
}

// RSI 계산 (14 period)
double calculateRSI(const double* data, int n, int period = 14) {
    if (n <= period) return 50.0;
    
    double gain = 0.0;
    double loss = 0.0;
    
    for (int i = n - period; i < n; ++i) {
        double diff = data[i] - data[i-1];
        if (diff >= 0) gain += diff;
        else loss -= diff;
    }
    
    if (loss == 0) return 100.0;
    double rs = (gain / period) / (loss / period);
    return 100.0 - (100.0 / (1.0 + rs));
}

// 표준편차 계산 (볼린저 밴드용)
double calculateStdDev(const double* data, int n, int period, double mean) {
    if (n < period) return 0.0;
    double sumSqDiff = 0.0;
    for (int i = n - period; i < n; ++i) {
        sumSqDiff += std::pow(data[i] - mean, 2);
    }
    return std::sqrt(sumSqDiff / period);
}

EMSCRIPTEN_KEEPALIVE
double analyzeMarket(const double* prices, const double* volumes, int n, int marketType) {
    if (n < 100) return 0.0;

    double ma5 = getMA(prices, n, 5);
    double ma20 = getMA(prices, n, 20);
    double ma60 = getMA(prices, n, 60);
    double ma120 = getMA(prices, n, 120);
    
    double s20 = getSlope(prices, n, 20);
    double rsi = calculateRSI(prices, n, 14);
    
    // 볼린저 밴드 계산
    double stdDev = calculateStdDev(prices, n, 20, ma20);
    double bbUpper = ma20 + (stdDev * 2.0);
    double bbLower = ma20 - (stdDev * 2.0);

    double score = 0.0;

    // 1. 배열 상태 (+3 / -3)
    if (ma5 > ma20 && ma20 > ma60 && ma60 > ma120) score += 3.0;
    else if (ma5 < ma20 && ma20 < ma60 && ma60 < ma120) score -= 3.0;

    // 2. 크로스 모멘텀 & 휩소 필터 (+2 / -2)
    bool golden = false;
    bool dead = false;
    for (int i = 0; i < 3; ++i) {
        int idx = n - i;
        if (idx < 21) continue;
        double m5 = getMA(prices, idx, 5);
        double m20 = getMA(prices, idx, 20);
        double pm5 = getMA(prices, idx - 1, 5);
        double pm20 = getMA(prices, idx - 1, 20);
        if (pm5 <= pm20 && m5 > m20) golden = true;
        if (pm5 >= pm20 && m5 < m20) dead = true;
    }
    
    if (golden) {
        // 휩소 필터: 20선 기울기가 양수일 때만 확신 점수 부여
        score += (s20 > 0) ? 2.0 : 1.0;
    } else if (dead) {
        score -= (s20 < 0) ? 2.0 : 1.0;
    }

    // 3. 기울기 동조 (+2 / -2)
    double s5 = getSlope(prices, n, 5);
    double s60 = getSlope(prices, n, 60);
    double s120 = getSlope(prices, n, 120);
    if (s5 > 0 && s20 > 0 && s60 > 0 && s120 > 0) score += 2.0;
    else if (s5 < 0 && s20 < 0 && s60 < 0 && s120 < 0) score -= 2.0;

    // 4. RSI 과열 브레이크 (RSI Penalty)
    if (rsi >= 70.0) score -= 2.0; // 과매수 고점 경고
    else if (rsi <= 30.0) score += 2.0; // 과매도 반등 기회

    // 5. 현재가 위치 & 볼린저 밴드
    double current = prices[n - 1];
    if (current > bbUpper) score -= 1.0; // 밴드 상단 돌파 시 단기 과열로 판단하여 점수 삭감
    else if (current < bbLower) score += 1.0; // 밴드 하단 이탈 시 과매도로 판단하여 가산점

    // 6. 거래량 이평선 필터 (나스닥)
    double volMA20 = getMA(volumes, n, 20);
    double currentVol = volumes[n - 1];
    
    if (marketType == 0) { // NASDAQ
        if (volMA20 > 0 && (currentVol / volMA20) >= 1.5) {
            if (current > prices[n - 2]) score += 1.0;
            else score -= 1.0;
        }
    } else { // FX
        if (s60 > 0 && s120 > 0) score += 1.0;
        if (current > ma60 && current > ma120) score += 1.0;
    }

    return std::max(-9.0, std::min(9.0, score));
}

}
