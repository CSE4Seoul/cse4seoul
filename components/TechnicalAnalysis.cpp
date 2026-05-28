#include <emscripten/bind.h>
#include <vector>
#include <cmath>
#include <algorithm>
#include <string>
#include <numeric>

using namespace emscripten;

struct OHLCV {
    double open;
    double high;
    double low;
    double close;
    double volume;
    long long timestamp;
};

struct TechnicalResult {
    double ma5;
    double ma20;
    double ma60;
    double ma120;
    double ema12;
    double ema26;
    double rsi;
    double macd;
    double macdSignal;
    double macdHist;
    double bbUpper;
    double bbLower;
    double bbMiddle;
    double atr;
    double technicalScore;
    double trendScore;
    double volatilityScore;
    double volumeScore;
    double fearGreedScore;
    std::string trendState; // "Strong Bullish", "Bullish", "Neutral", "Bearish", "Strong Bearish"
    std::string marketSentiment; // "Extreme Greed", "Greed", "Neutral", "Fear", "Extreme Fear"
    std::vector<double> supportLevels;
    std::vector<double> resistanceLevels;
};

class TechnicalAnalyzer {
public:
    static TechnicalResult analyze(std::vector<OHLCV> data, int strategyMode) {
        TechnicalResult result;
        int n = data.size();
        if (n < 120) return result; // Need enough data for 120MA

        std::vector<double> closes;
        std::vector<double> volumes;
        for (const auto& d : data) {
            closes.push_back(d.close);
            volumes.push_back(d.volume);
        }

        // 1. Moving Averages
        result.ma5 = calculateSMA(closes, 5);
        result.ma20 = calculateSMA(closes, 20);
        result.ma60 = calculateSMA(closes, 60);
        result.ma120 = calculateSMA(closes, 120);
        result.ema12 = calculateEMA(closes, 12);
        result.ema26 = calculateEMA(closes, 26);

        // 2. RSI
        result.rsi = calculateRSI(closes, 14);

        // 3. MACD
        calculateMACD(closes, result.macd, result.macdSignal, result.macdHist);

        // 4. Bollinger Bands
        double stdDev;
        result.bbMiddle = result.ma20;
        stdDev = calculateStdDev(closes, 20, result.bbMiddle);
        result.bbUpper = result.bbMiddle + (2.0 * stdDev);
        result.bbLower = result.bbMiddle - (2.0 * stdDev);

        // 5. ATR (Average True Range)
        result.atr = calculateATR(data, 14);

        // 6. Support & Resistance
        calculateLevels(data, result.supportLevels, result.resistanceLevels);

        // 7. Scoring
        double score = 0.0;
        
        // Trend Score (Moving Average Alignment)
        double trend = 0.0;
        if (result.ma5 > result.ma20) trend += 10;
        if (result.ma20 > result.ma60) trend += 15;
        if (result.ma60 > result.ma120) trend += 15;
        if (closes.back() > result.ma20) trend += 10;
        result.trendScore = trend;

        // Volume Score
        double avgVol = 0;
        for(int i = n-20; i < n; ++i) avgVol += volumes[i];
        avgVol /= 20;
        double volRatio = volumes.back() / (avgVol > 0 ? avgVol : 1.0);
        result.volumeScore = std::min(20.0, volRatio * 5.0);

        // RSI & MACD Momentum
        double momentum = 0.0;
        if (result.rsi > 30 && result.rsi < 70) momentum += 10;
        else if (result.rsi <= 30) momentum += 15; // Overbought recovery chance
        else momentum -= 5; // Oversold caution

        if (result.macdHist > 0) momentum += 10;

        // Fear & Greed (Proxy)
        // High volatility + falling price = Fear
        // Low volatility + rising price = Greed
        double recentReturn = (closes.back() - closes[n-20]) / closes[n-20];
        double volFactor = result.atr / closes.back();
        double fg = 50.0 + (recentReturn * 200.0) - (volFactor * 500.0);
        result.fearGreedScore = std::max(0.0, std::min(100.0, fg));

        if (result.fearGreedScore > 80) result.marketSentiment = "Extreme Greed";
        else if (result.fearGreedScore > 60) result.marketSentiment = "Greed";
        else if (result.fearGreedScore > 40) result.marketSentiment = "Neutral";
        else if (result.fearGreedScore > 20) result.marketSentiment = "Fear";
        else result.marketSentiment = "Extreme Fear";

        // Strategy Adjustments
        // 0: Conservative, 1: Growth/Momentum, 2: Swing, 3: AI/High-Vol
        score = trend + momentum + result.volumeScore;
        
        if (strategyMode == 1) { // Growth
            score += (volRatio > 1.2 ? 10 : 0);
        } else if (strategyMode == 2) { // Swing
            if (result.rsi < 40) score += 15;
            if (closes.back() < result.bbLower) score += 10;
        }

        result.technicalScore = std::max(0.0, std::min(100.0, score));

        // Trend State
        if (trend >= 40) result.trendState = "Strong Bullish";
        else if (trend >= 25) result.trendState = "Bullish";
        else if (trend >= 10) result.trendState = "Neutral";
        else if (trend >= -10) result.trendState = "Bearish";
        else result.trendState = "Strong Bearish";

        return result;
    }

private:
    static double calculateSMA(const std::vector<double>& data, int period) {
        if (data.size() < period) return 0.0;
        double sum = std::accumulate(data.end() - period, data.end(), 0.0);
        return sum / period;
    }

    static double calculateEMA(const std::vector<double>& data, int period) {
        if (data.size() < period) return 0.0;
        double multiplier = 2.0 / (period + 1);
        double ema = calculateSMA(std::vector<double>(data.begin(), data.begin() + period), period);
        for (size_t i = period; i < data.size(); ++i) {
            ema = (data[i] - ema) * multiplier + ema;
        }
        return ema;
    }

    static double calculateRSI(const std::vector<double>& data, int period) {
        if (data.size() < period + 1) return 50.0;
        double gain = 0, loss = 0;
        for (size_t i = data.size() - period; i < data.size(); ++i) {
            double diff = data[i] - data[i-1];
            if (diff > 0) gain += diff;
            else loss -= diff;
        }
        if (loss == 0) return 100.0;
        double rs = (gain / period) / (loss / period);
        return 100.0 - (100.0 / (1.0 + rs));
    }

    static void calculateMACD(const std::vector<double>& data, double& macd, double& signal, double& hist) {
        if (data.size() < 35) return;
        std::vector<double> macdLine;
        double multiplier12 = 2.0 / (12 + 1);
        double multiplier26 = 2.0 / (26 + 1);
        double multiplier9 = 2.0 / (9 + 1);
        
        double ema12 = calculateSMA(std::vector<double>(data.begin(), data.begin() + 12), 12);
        double ema26 = calculateSMA(std::vector<double>(data.begin(), data.begin() + 26), 26);
        
        for (size_t i = 26; i < data.size(); ++i) {
            ema12 = (data[i] - ema12) * multiplier12 + ema12;
            ema26 = (data[i] - ema26) * multiplier26 + ema26;
            macdLine.push_back(ema12 - ema26);
        }
        
        macd = macdLine.back();
        signal = calculateSMA(macdLine, 9);
        hist = macd - signal;
    }

    static double calculateStdDev(const std::vector<double>& data, int period, double mean) {
        double sum = 0;
        for (size_t i = data.size() - period; i < data.size(); ++i) {
            sum += std::pow(data[i] - mean, 2);
        }
        return std::sqrt(sum / period);
    }

    static double calculateATR(const std::vector<OHLCV>& data, int period) {
        if (data.size() < period + 1) return 0.0;
        double trSum = 0;
        for (size_t i = data.size() - period; i < data.size(); ++i) {
            double tr1 = data[i].high - data[i].low;
            double tr2 = std::abs(data[i].high - data[i-1].close);
            double tr3 = std::abs(data[i].low - data[i-1].close);
            trSum += std::max({tr1, tr2, tr3});
        }
        return trSum / period;
    }

    static void calculateLevels(const std::vector<OHLCV>& data, std::vector<double>& supports, std::vector<double>& resistances) {
        // Simple Pivot Point based levels + Local Min/Max
        int n = data.size();
        if (n < 20) return;
        
        // Use last 20 days for levels
        double high = 0, low = 1e18, close = data.back().close;
        for(int i = n-20; i < n; ++i) {
            high = std::max(high, data[i].high);
            low = std::min(low, data[i].low);
        }
        
        double pivot = (high + low + close) / 3.0;
        supports.push_back(pivot * 2.0 - high); // S1
        supports.push_back(pivot - (high - low)); // S2
        resistances.push_back(pivot * 2.0 - low); // R1
        resistances.push_back(pivot + (high - low)); // R2
    }
};

EMSCRIPTEN_BINDINGS(technical_analyzer) {
    value_object<OHLCV>("OHLCV")
        .field("open", &OHLCV::open)
        .field("high", &OHLCV::high)
        .field("low", &OHLCV::low)
        .field("close", &OHLCV::close)
        .field("volume", &OHLCV::volume)
        .field("timestamp", &OHLCV::timestamp);

    value_object<TechnicalResult>("TechnicalResult")
        .field("ma5", &TechnicalResult::ma5)
        .field("ma20", &TechnicalResult::ma20)
        .field("ma60", &TechnicalResult::ma60)
        .field("ma120", &TechnicalResult::ma120)
        .field("ema12", &TechnicalResult::ema12)
        .field("ema26", &TechnicalResult::ema26)
        .field("rsi", &TechnicalResult::rsi)
        .field("macd", &TechnicalResult::macd)
        .field("macdSignal", &TechnicalResult::macdSignal)
        .field("macdHist", &TechnicalResult::macdHist)
        .field("bbUpper", &TechnicalResult::bbUpper)
        .field("bbLower", &TechnicalResult::bbLower)
        .field("bbMiddle", &TechnicalResult::bbMiddle)
        .field("atr", &TechnicalResult::atr)
        .field("technicalScore", &TechnicalResult::technicalScore)
        .field("trendScore", &TechnicalResult::trendScore)
        .field("volatilityScore", &TechnicalResult::volatilityScore)
        .field("volumeScore", &TechnicalResult::volumeScore)
        .field("fearGreedScore", &TechnicalResult::fearGreedScore)
        .field("trendState", &TechnicalResult::trendState)
        .field("marketSentiment", &TechnicalResult::marketSentiment)
        .field("supportLevels", &TechnicalResult::supportLevels)
        .field("resistanceLevels", &TechnicalResult::resistanceLevels);

    register_vector<OHLCV>("OHLCVVector");
    register_vector<double>("DoubleVector");

    class_<TechnicalAnalyzer>("TechnicalAnalyzer")
        .class_function("analyze", &TechnicalAnalyzer::analyze);
}
