// src/wasm/fallback.ts
// JavaScript fallback voor als Wasm niet laadt

export const V1_JS_FALLBACK = {
  checkFDMA(pct: number, vermogen: number, grens: number): number {
    if (pct > 110) return 0;
    if (vermogen > grens) return 0;
    if (pct <= 0) return 2;
    return 1;
  },

  checkIIT(pct: number, leeftijd: number, isPensioen: boolean, isJeugd: boolean): number {
    if (isPensioen || isJeugd || leeftijd < 21) return 0;
    if (pct > 105) return 1;
    if (pct <= 0) return 2;
    return 2;
  },

  checkKwijtschelding(pct: number, geenAanslag: boolean): number {
    if (geenAanslag) return 2;
    if (pct >= 120) return 0;
    if (pct <= 0) return 2;
    return 1;
  },

  checkKindsupport(heeftKinderen: boolean): number {
    return heeftKinderen ? 1 : 0;
  },

  checkVoedselbank(besteedbaar: number, huishoudenGrootte: number): number {
    if (besteedbaar < 0) return 1;
    if (besteedbaar < 400 + 120 * (huishoudenGrootte - 1)) return 1;
    return 0;
  },
};

interface FallbackInput {
  pct: number;
  vermogen: number;
  vermogenGrens: number;
  leeftijd: number;
  isPensioen: boolean;
  isJeugd: boolean;
  geenAanslag: boolean;
  heeftKinderen: boolean;
  besteedbaar: number;
  huishoudenGrootte: number;
}

export function getFallbackResult(input: FallbackInput) {
  return {
    fdma: V1_JS_FALLBACK.checkFDMA(input.pct, input.vermogen, input.vermogenGrens),
    iit: V1_JS_FALLBACK.checkIIT(input.pct, input.leeftijd, input.isPensioen, input.isJeugd),
    kwijtschelding: V1_JS_FALLBACK.checkKwijtschelding(input.pct, input.geenAanslag),
    kindsupport: V1_JS_FALLBACK.checkKindsupport(input.heeftKinderen),
    voedselbank: V1_JS_FALLBACK.checkVoedselbank(input.besteedbaar, input.huishoudenGrootte),
  };
}
