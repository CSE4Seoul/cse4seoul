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
      
      const module = await initModule();
      
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
}

export const wasmService = new WasmService();
