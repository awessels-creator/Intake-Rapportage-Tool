// src/hooks/useRegelingen.ts
// Hook die Wasm of JS-fallback gebruikt voor de regeling-checks

import { useState, useEffect, useMemo } from 'react';
import type { FormState } from '../types';
import { initWasm } from '../wasm/loader';
import { getFallbackResult } from '../wasm/fallback';
import { getTotaalInkomen, getTotaalLasten, lftdN, geenEigenAanslag as geenEigenAanslagJS } from '../utils';
import { VGRENS } from '../constants';

export interface RegelingenResult {
  fdma: number;           // 0 = nee, 1 = ja, 2 = check
  iit: number;            // 0 = nvt, 1 = nee, 2 = check
  kwijtschelding: number; // 0 = nee, 1 = ja, 2 = nvt
  kindsupport: number;    // 0 = nvt, 1 = ja
  voedselbank: number;    // 0 = nee, 1 = ja
}

export interface UseRegelingenResult {
  result: RegelingenResult | null;
  usingWasm: boolean;
  error: string | null;
}

function huishoudenGrootte(state: FormState): number {
  const ls = state.leefsituatie;
  const isSamenwonend = ls.startsWith('samenwonend') || ls.startsWith('pensioen_paar') || ls.startsWith('pensioen_gemengd');
  const kinderenTellen = state.kinderen === 'ja' ? (state.kinderenData.length || 1) : 0;
  return (isSamenwonend ? 2 : 1) + kinderenTellen;
}

function berekenVermogen(state: FormState): number {
  return (
    (parseFloat(state.spaargeld) || 0) +
    (parseFloat(state.overig_verm) || 0) +
    (parseFloat(state.beleggingen) || 0) +
    (parseFloat(state.overigVermogenBedrag) || 0) +
    state.voertuigen.reduce((s, v) => s + (parseFloat(v.waarde) || 0), 0)
  );
}

export function useRegelingen(state: FormState | null): UseRegelingenResult {
  const [wasmState, setWasmState] = useState<{ wasm: any; error: string | null } | null>(null);

  // Init Wasm bij mount
  useEffect(() => {
    let cancelled = false;
    initWasm().then(({ wasm, error }) => {
      if (!cancelled) setWasmState({ wasm, error });
    });
    return () => { cancelled = true; };
  }, []);

  // Berek input uit state
  const input = useMemo(() => {
    if (!state) return null;

    const norm = parseFloat(state.bijstandsnorm) || 0;
    const ink = getTotaalInkomen(state);
    const pct = norm && ink ? (ink / norm) * 100 : 0;
    const ls = state.leefsituatie;
    const isPensioen = ls.startsWith('pensioen');
    const leeftijd = lftdN(state.geboortedatum);
    const isJeugd = leeftijd >= 0 && leeftijd < 21;
    const geenAanslag = geenEigenAanslagJS(state);
    const tot = getTotaalLasten(state);
    const best = ink - tot;
    const vermogen = berekenVermogen(state);
    const grens = VGRENS[ls] || 8000;
    const hK = state.kinderen === 'ja';
    const huishouden = huishoudenGrootte(state);

    return {
      pct,
      vermogen,
      vermogenGrens: grens,
      leeftijd: leeftijd > 0 ? leeftijd : 0,
      isPensioen,
      isJeugd,
      geenAanslag,
      heeftKinderen: hK,
      besteedbaar: best,
      huishoudenGrootte: huishouden,
    };
  }, [state]);

  // Bereken result
  const result = useMemo(() => {
    if (!input) return null;

    if (wasmState?.wasm) {
      try {
        return {
          fdma: wasmState.wasm.checkFDMA(input.pct, input.vermogen, input.vermogenGrens),
          iit: wasmState.wasm.checkIIT(input.pct, input.leeftijd, input.isPensioen, input.isJeugd),
          kwijtschelding: wasmState.wasm.checkKwijtschelding(input.pct, input.geenAanslag),
          kindsupport: wasmState.wasm.checkKindsupport(input.heeftKinderen),
          voedselbank: wasmState.wasm.checkVoedselbank(input.besteedbaar, input.huishoudenGrootte),
        };
      } catch (e) {
        // Wasm-fout → fallback
        return getFallbackResult(
          input.pct, input.vermogen, input.vermogenGrens,
          input.leeftijd, input.isPensioen, input.isJeugd,
          input.geenAanslag, input.heeftKinderen,
          input.besteedbaar, input.huishoudenGrootte
        );
      }
    } else if (wasmState) {
      // Geen Wasm → fallback
      return getFallbackResult(
        input.pct, input.vermogen, input.vermogenGrens,
        input.leeftijd, input.isPensioen, input.isJeugd,
        input.geenAanslag, input.heeftKinderen,
        input.besteedbaar, input.huishoudenGrootte
      );
    }
    return null;
  }, [input, wasmState]);

  return {
    result,
    usingWasm: wasmState?.wasm != null,
    error: wasmState?.error || null,
  };
}
