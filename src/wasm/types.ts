// src/wasm/types.ts
// Type definities voor de Wasm-module

export interface WasmModule {
  checkFDMA(pct: number, vermogen: number, grens: number): number;
  checkIIT(pct: number, leeftijd: number, isPensioen: boolean, isJeugd: boolean): number;
  checkKwijtschelding(pct: number, geenAanslag: boolean): number;
  checkKindsupport(heeftKinderen: boolean): number;
  checkVoedselbank(besteedbaar: number, huishoudenGrootte: number): number;
}

export interface RegelingenResult {
  fdma: number;           // 0 = nee, 1 = ja, 2 = check
  iit: number;            // 0 = nvt, 1 = nee, 2 = check
  kwijtschelding: number; // 0 = nee, 1 = ja, 2 = nvt
  kindsupport: number;    // 0 = nvt, 1 = ja
  voedselbank: number;    // 0 = nee, 1 = ja
}

export interface WasmLoaderResult {
  wasm: WasmModule | null;
  error: string | null;
}
