'use client';

/**
 * Wasm Service
 * Manages loading and providing access to WebAssembly modules.
 */

class WasmService {
  private modules: Map<string, any> = new Map();

  /**
   * Loads a Wasm module by name.
   * Expects JS glue code at /wasm/[name].js and Wasm at /wasm/[name].wasm
   */
  async getModule(name: string) {
    if (this.modules.has(name)) {
      return this.modules.get(name);
    }

    try {
      // Dynamic import of the JS glue code. 
      // Note: In Next.js, we might need to use a absolute URL or ensure the file is in the search path.
      // If the file is in public/wasm, we can't easily import it as a module in some environments.
      
      // A more reliable way for Next.js is to put the .js files in lib/wasm and .wasm in public/wasm.
      // But let's try the dynamic import from the generated path first.
      
      const { default: initModule } = await import(`@/lib/wasm/${name}.js`);
      
      const module = await initModule({
        locateFile: (path: string) => `/wasm/${path}`
      });
      
      // Wait for the module to be ready if it has a .then or is a promise
      if (module.ready) {
        await module.ready;
      }
      
      this.modules.set(name, module);
      return module;
    } catch (error) {
      console.error(`[WasmService] Error loading module ${name}:`, error);
      return null;
    }
  }

  /**
   * Helper for the winpercent calculation
   */
  async calculateRequiredWins(win: number, lose: number, targetPercent: number): Promise<number | null> {
    const module = await this.getModule('winpercent');
    if (!module) return null;

    // Use cwrap to get a typed function
    const calculate = module.cwrap('calculateRequiredWins', 'number', ['number', 'number', 'number']);
    return calculate(win, lose, targetPercent);
  }

  /**
   * Helper for market analysis using Wasm
   */
  async analyzeMarketWasm(prices: number[], volumes: number[], marketType: number): Promise<number | null> {
    const module = await this.getModule('marketanalysis');
    if (!module) return null;

    const n = prices.length;
    
    // 1. Allocate memory for arrays
    const pricePtr = module._malloc(n * 8); // double is 8 bytes
    const volPtr = module._malloc(n * 8);

    // 2. Fill memory
    module.HEAPF64.set(new Float64Array(prices), pricePtr / 8);
    module.HEAPF64.set(new Float64Array(volumes), volPtr / 8);

    try {
      // 3. Call Wasm function
      // analyzeMarket(double* prices, double* volumes, int n, int marketType)
      const analyze = module.cwrap('analyzeMarket', 'number', ['number', 'number', 'number', 'number']);
      const score = analyze(pricePtr, volPtr, n, marketType);
      return score;
    } catch (error) {
      console.error('[WasmService] Error in analyzeMarketWasm:', error);
      return null;
    } finally {
      // 4. Free memory
      module._free(pricePtr);
      module._free(volPtr);
    }
  }

  /**
   * Helper for value investment scoring using ValueAnalyzer (Embind)
   */
  async scoreValueInvestment(data: any): Promise<any> {
    const module = await this.getModule('value_score');
    if (!module) return null;

    try {
      // Embind classes are available on the module
      const result = module.ValueAnalyzer.analyze(data);
      return {
        grahamPrice: result.grahamPrice,
        fScore: result.fScore,
        buffettScore: result.buffettScore,
        roe: result.roe,
        debtToEquity: result.debtToEquity
      };
    } catch (error) {
      console.error('[WasmService] Error in scoreValueInvestment:', error);
      return null;
    }
  }

  /**
   * Helper for technical analysis using TechnicalAnalyzer (Embind)
   */
  async analyzeTechnical(ohlcvData: any[], strategyMode: number = 0): Promise<any> {
    const module = await this.getModule('technicalanalysis');
    if (!module) return null;

    try {
      // Create a vector for OHLCV
      const ohlcvVector = new module.OHLCVVector();
      ohlcvData.forEach(d => {
        ohlcvVector.push_back({
          open: d.open || d.value || 0,
          high: d.high || d.value || 0,
          low: d.low || d.value || 0,
          close: d.close || d.value || 0,
          volume: d.volume || 0,
          timestamp: BigInt(d.timestamp)
        });
      });

      const result = module.TechnicalAnalyzer.analyze(ohlcvVector, strategyMode);
      
      // Convert vector results back to JS arrays
      const supportLevels = [];
      const resistanceLevels = [];
      for (let i = 0; i < result.supportLevels.size(); i++) {
        supportLevels.push(result.supportLevels.get(i));
      }
      for (let i = 0; i < result.resistanceLevels.size(); i++) {
        resistanceLevels.push(result.resistanceLevels.get(i));
      }

      const formattedResult = {
        ma5: result.ma5,
        ma20: result.ma20,
        ma60: result.ma60,
        ma120: result.ma120,
        ema12: result.ema12,
        ema26: result.ema26,
        rsi: result.rsi,
        macd: result.macd,
        macdSignal: result.macdSignal,
        macdHist: result.macdHist,
        bbUpper: result.bbUpper,
        bbLower: result.bbLower,
        bbMiddle: result.bbMiddle,
        atr: result.atr,
        technicalScore: result.technicalScore,
        trendScore: result.trendScore,
        volatilityScore: result.volatilityScore,
        volumeScore: result.volumeScore,
        fearGreedScore: result.fearGreedScore,
        trendState: result.trendState,
        marketSentiment: result.marketSentiment,
        supportLevels,
        resistanceLevels
      };

      // Cleanup
      ohlcvVector.delete();
      // result is a value object in this case if it's a struct, but if it was a class it would need delete.
      // Embind structs returned as value objects don't need delete usually, 
      // but if we used class_ with a constructor we would.
      
      return formattedResult;
    } catch (error) {
      console.error('[WasmService] Error in analyzeTechnical:', error);
      return null;
    }
  }

  /**
   * Runs an arbitrary C/C++ compiled Wasm executable (with main function)
   * and returns its captured stdout.
   */
  async runWasmExecutable(name: string, args: string[] = []): Promise<string> {
    if (name.toLowerCase() === 'winpercent') {
      try {
        const wins = parseInt(args[0]) || 0;
        const losses = parseInt(args[1]) || 0;
        const target = parseFloat(args[2]) || 50;
        const result = await this.calculateRequiredWins(wins, losses, target);
        return `[🖥️ Wasm Engine - winpercent]\n${wins}승 ${losses}패 상태에서 목표 ${target}% 달성을 위해 필요한 연속 승수: ${result}승`;
      } catch (e: any) {
        return `[Err] winpercent 실행 실패: ${e.message}`;
      }
    }

    const output: string[] = [];
    try {
      const { default: initModule } = await import(`@/lib/wasm/${name.toLowerCase()}.js`);
      
      const module = await initModule({
        print: (text: string) => {
          output.push(text);
        },
        printErr: (text: string) => {
          output.push(`[Err] ${text}`);
        },
        arguments: args,
        locateFile: (path: string) => `/wasm/${path}`
      });

      if (module.ready) {
        await module.ready;
      }

      if (typeof module.callMain === 'function') {
        module.callMain(args);
      }

      return output.join('\n') || '[출력 결과 없음]';
    } catch (error: any) {
      console.error(`[WasmService] Error running executable ${name}:`, error);
      return `[System Error] 프로그램 '${name}' 실행에 실패했습니다: ${error.message}`;
    }
  }
}

export const wasmService = new WasmService();
