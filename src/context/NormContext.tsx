import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getActivePeriode, type NormPeriode } from '../constants'

interface Normen {
  NORMPERIODE: NormPeriode
  NORM: Record<string, number>
  VGRENS: Record<string, number>
  NIBUD: Record<string, number>
  BVV_MAX: Record<string, number>
  VRIJSTELLING_OVERWAARDE: number
}

const NormContext = createContext<Normen | null>(null)

function actieveNormen(): Normen {
  const p = getActivePeriode()
  return {
    NORMPERIODE: p,
    NORM: p.bijstand,
    VGRENS: p.vermogen,
    NIBUD: p.nibud,
    BVV_MAX: p.bvvMax,
    VRIJSTELLING_OVERWAARDE: p.vrijstellingOverwaarde,
  }
}

export function NormProvider({ children }: { children: ReactNode }) {
  const [normen, setNormen] = useState<Normen>(actieveNormen)
  useEffect(() => {
    const on = () => setNormen(actieveNormen())
    document.addEventListener('norm-preview-change', on)
    return () => document.removeEventListener('norm-preview-change', on)
  }, [])
  return <NormContext.Provider value={normen}>{children}</NormContext.Provider>
}

/** Levert de actuele (of gepreviewde) normenset. Herrendert automatisch bij model-wissel. */
export function useNormen(): Normen {
  const ctx = useContext(NormContext)
  if (!ctx) throw new Error('useNormen moet binnen <NormProvider> gebruikt worden')
  return ctx
}
