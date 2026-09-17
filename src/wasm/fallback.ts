// src/wasm/fallback.ts
// JavaScript fallback — exacte kopie van de checks uit utils.ts
// Geactiveerd als Wasm niet laadt

import type { WasmModule, RegelingenResult } from './types';

export const V1_JS_FALLBACK: WasmModule = {
  checkFDMA(pct: number, vermogen: number, grens: number): number {
    if (pct > 110) return 0;    // nee
    if (vermogen > grens) return 0; // nee
    if (pct <= 0) return 2;     // check
    return 1;                   // ja
  },

  checkIIT(pct: number, leeftijd: number, isPensioen: boolean, isJeugd: boolean): number {
    if (isPensioen) return 0;           // nvt
    if (isJeugd || leeftijd < 21) return 0; // nvt
    if (pct > 105) return 1;            // nee
    if (pct <= 0) return 2;             // check
    return 2;                           // check
  },

  checkKwijtschelding(pct: number, geenAanslag: boolean): number {
    if (geenAanslag) return 2;          // nvt
    if (pct >= 120) return 0;           // nee
    if (pct <= 0) return 2;             // check
    return 1;                           // ja
  },

  checkKindsupport(heeftKinderen: boolean): number {
    return heeftKinderen ? 1 : 0;       // ja of nvt
  },

  checkVoedselbank(besteedbaar: number, huishoudenGrootte: number): number {
    if (besteedbaar < 0) return 1;      // altijd ja bij negatief
    const norm = 400 + 120 * (huishoudenGrootte - 1);
    if (besteedbaar < norm) return 1;   // ja
    return 0;                           // nee
  },
};

export function getFallbackResult(
  pct: number,
  vermogen: number,
  vermogenGrens: number,
  leeftijd: number,
  isPensioen: boolean,
  isJeugd: boolean,
  geenAanslag: boolean,
  heeftKinderen: boolean,
  besteedbaar: number,
  huishoudenGrootte: number
): RegelingenResult {
  return {
    fdma: V1_JS_FALLBACK.checkFDMA(pct, vermogen, vermogenGrens),
    iit: V1_JS_FALLBACK.checkIIT(pct, leeftijd, isPensioen, isJeugd),
    kwijtschelding: V1_JS_FALLBACK.checkKwijtschelding(pct, geenAanslag),
    kindsupport: V1_JS_FALLBACK.checkKindsupport(heeftKinderen),
    voedselbank: V1_JS_FALLBACK.checkVoedselbank(besteedbaar, huishoudenGrootte),
  };
}
