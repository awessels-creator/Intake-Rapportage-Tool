// src/hooks/useRegelingen.ts
// Hook die Wasm of JS-fallback gebruikt voor de regeling-checks

import { useState, useEffect, useMemo } from 'react';
import type { FormState } from '../types';
import { initWasm } from '../wasm/loader';
import { getFallbackResult } from '../wasm/fallback';
import { getTotaalInkomen, getTotaalLasten, lftdN, geenEigenAanslag } from '../utils';
import { VGRENS } from '../constants';

export interface RegelingenResult {
  fdma: number;
  iit: number;
  kwijtschelding: number;
  kindsupport: number;
  voedselbank: number;
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

export function useRegelingen(state: FormState | null): RegelingenResult | null {
  const [wasm, setWasm] = useState<{
    checkFDMA(pct: number, vermogen: number, grens: number): number;
    checkIIT(pct: number, leeftijd: number, isPensioen: boolean, isJeugd: boolean): number;
    checkKwijtschelding(pct: number, geenAanslag: boolean): number;
    checkKindsupport(heeftKinderen: boolean): number;
    checkVoedselbank(besteedbaar: number, huishoudenGrootte: number): number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    initWasm().then(({ wasm }) => {
      if (!cancelled) setWasm(wasm);
    });
    return () => { cancelled = true; };
  }, []);

  const input = useMemo(() => {
    if (!state) return null;

    const norm = parseFloat(state.bijstandsnorm) || 0;
    const ink = getTotaalInkomen(state);
    const pct = norm && ink ? (ink / norm) * 100 : 0;
    const ls = state.leefsituatie;
    const leeftijd = lftdN(state.geboortedatum);

    return {
      pct,
      vermogen: berekenVermogen(state),
      vermogenGrens: VGRENS[ls] || 8000,
      leeftijd: leeftijd > 0 ? leeftijd : 0,
      isPensioen: ls.startsWith('pensioen'),
      isJeugd: leeftijd >= 0 && leeftijd < 21,
      geenAanslag: geenEigenAanslag(state),
      heeftKinderen: state.kinderen === 'ja',
      besteedbaar: ink - getTotaalLasten(state),
      huishoudenGrootte: huishoudenGrootte(state),
    };
  }, [state]);

  return useMemo(() => {
    if (!input) return null;

    if (wasm) {
      try {
        return {
          fdma: wasm.checkFDMA(input.pct, input.vermogen, input.vermogenGrens),
          iit: wasm.checkIIT(input.pct, input.leeftijd, input.isPensioen, input.isJeugd),
          kwijtschelding: wasm.checkKwijtschelding(input.pct, input.geenAanslag),
          kindsupport: wasm.checkKindsupport(input.heeftKinderen),
          voedselbank: wasm.checkVoedselbank(input.besteedbaar, input.huishoudenGrootte),
        };
      } catch {
        return getFallbackResult(input);
      }
    }
    return getFallbackResult(input);
  }, [input, wasm]);
}
