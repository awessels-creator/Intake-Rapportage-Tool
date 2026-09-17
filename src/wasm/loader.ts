// src/wasm/loader.ts
// Laadt de Wasm-module en geeft een typed object terug

import type { WasmModule, WasmLoaderResult } from './types';

let wasmModule: WasmModule | null = null;
let wasmError: string | null = null;
let wasmLoading: Promise<WasmLoaderResult> | null = null;

export async function initWasm(): Promise<WasmLoaderResult> {
  if (wasmModule) return { wasm: wasmModule, error: null };
  if (wasmError) return { wasm: null, error: wasmError };
  if (wasmLoading) return wasmLoading;

  wasmLoading = (async () => {
    try {
      const response = await fetch('/wasm/index.wasm');
      const bytes = await response.arrayBuffer();
      const module = await WebAssembly.instantiate(bytes);
      const exports = module.instance.exports;

      // Wrapper object met getypeerde functies
      wasmModule = {
        checkFDMA: (pct: number, vermogen: number, grens: number) => 
          (exports.checkFDMA as Function)(pct, vermogen, grens) as number,
        checkIIT: (pct: number, leeftijd: number, isPensioen: boolean, isJeugd: boolean) => 
          (exports.checkIIT as Function)(pct, leeftijd, isPensioen ? 1 : 0, isJeugd ? 1 : 0) as number,
        checkKwijtschelding: (pct: number, geenAanslag: boolean) => 
          (exports.checkKwijtschelding as Function)(pct, geenAanslag ? 1 : 0) as number,
        checkKindsupport: (heeftKinderen: boolean) => 
          (exports.checkKindsupport as Function)(heeftKinderen ? 1 : 0) as number,
        checkVoedselbank: (besteedbaar: number, huishoudenGrootte: number) => 
          (exports.checkVoedselbank as Function)(besteedbaar, huishoudenGrootte) as number,
      };

      return { wasm: wasmModule, error: null };
    } catch (error) {
      wasmError = error instanceof Error ? error.message : 'Wasm laden mislukt';
      return { wasm: null, error: wasmError };
    }
  })();

  return wasmLoading;
}

export function getWasm(): WasmModule | null {
  return wasmModule;
}

export function getWasmError(): string | null {
  return wasmError;
}

export function isWasmLoaded(): boolean {
  return wasmModule !== null;
}
