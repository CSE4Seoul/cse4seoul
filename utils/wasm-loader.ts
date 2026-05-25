'use client';

/**
 * Generic Wasm Loader
 * This utility helps loading Emscripten-compiled Wasm modules.
 */

interface WasmModule {
  _calculateRequiredWins?: (win: number, lose: number, target: number) => number;
  cwrap: (fnName: string, returnType: string | null, argTypes: string[]) => any;
  // Add other possible functions as they are added to C++ files
}

export async function loadWasmModule(moduleName: string): Promise<any> {
  try {
    // In Next.js, we can use dynamic imports for the JS glue code
    // The compiled JS file should be in public/wasm/
    // However, dynamic import() usually works better with files in src/
    // Since it's in public/wasm, we might need to fetch it or use it as a script.
    
    // BUT, since we want to treat it as a module, it's better to have it in the source tree 
    // or use a path that Next.js can resolve if configured.
    
    // Alternatively, we can use the default export from the generated JS.
    // Let's assume for now we might want to move it to lib/wasm or similar for easier bundling.
    
    // For now, let's try to import from the public directory if possible, 
    // but usually, it's safer to have it in lib/wasm and import it there.
    
    // Let's create lib/wasm and move the files there, but we still need to serve the .wasm file.
    // Emscripten's locateFile will help.
    
    const Module = (await import(`../public/wasm/${moduleName}.js`)).default;
    
    const wasmModule = await Module({
      locateFile: (path: string) => `/wasm/${path}`,
    });
    
    return wasmModule;
  } catch (error) {
    console.error(`Failed to load Wasm module: ${moduleName}`, error);
    throw error;
  }
}
