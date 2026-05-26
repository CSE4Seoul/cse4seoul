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
}

export const wasmService = new WasmService();
