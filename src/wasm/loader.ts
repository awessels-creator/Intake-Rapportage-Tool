// src/wasm/loader.ts
// Laadt de Wasm-module

declare const __VITE_BASE_URL__: string

let wasmModule: {
  checkFDMA(pct: number, vermogen: number, grens: number): number;
  checkIIT(pct: number, leeftijd: number, isPensioen: boolean, isJeugd: boolean): number;
  checkKwijtschelding(pct: number, geenAanslag: boolean): number;
  checkKindsupport(heeftKinderen: boolean): number;
  checkVoedselbank(besteedbaar: number, huishoudenGrootte: number): number;
} | null = null;

let wasmError: string | null = null;
let wasmLoading: Promise<{ wasm: typeof wasmModule; error: string | null }> | null = null;

export async function initWasm() {
  if (wasmModule) return { wasm: wasmModule, error: null };
  if (wasmError) return { wasm: null, error: wasmError };
  if (wasmLoading) return wasmLoading;

  wasmLoading = (async () => {
    try {
      const base = typeof __VITE_BASE_URL__ !== 'undefined' ? __VITE_BASE_URL__ : '/';
      const wasmUrl = `${base}wasm/index.wasm`;
      
      const response = await fetch(wasmUrl);
      const bytes = await response.arrayBuffer();
      const module = await WebAssembly.instantiate(bytes);
      const exports = module.instance.exports;

      wasmModule = {
        checkFDMA: (exports.checkFDMA as Function) as any,
        checkIIT: (exports.checkIIT as Function) as any,
        checkKwijtschelding: (exports.checkKwijtschelding as Function) as any,
        checkKindsupport: (exports.checkKindsupport as Function) as any,
        checkVoedselbank: (exports.checkVoedselbank as Function) as any,
      };

      return { wasm: wasmModule as any, error: null };
    } catch (error) {
      wasmError = error instanceof Error ? error.message : 'Wasm laden mislukt';
      return { wasm: null, error: wasmError };
    }
  })();

  return wasmLoading;
}
