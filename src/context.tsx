import { createContext, useContext, useState, type ReactNode } from 'react'
import type { FormState } from './types'
import { mkInitial, buildSystemAdvItems } from './utils'

interface Ctx {
  state: FormState
  set: (patch: Partial<FormState>) => void
  goTo: (n: number) => void
  resetForm: () => void
}

const FormCtx = createContext<Ctx | null>(null)

export function FormProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FormState>(mkInitial)

  const set = (patch: Partial<FormState>) =>
    setState(prev => ({ ...prev, ...patch }))

  const goTo = (n: number) => {
    setState(prev => {
      let extra: Partial<FormState> = {}
      if (n === 9) {
        const custom = prev.advItems.filter(a => a.custom)
        extra = { advItems: [...buildSystemAdvItems(prev), ...custom] }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return { ...prev, currentPage: n, ...extra }
    })
  }

  const resetForm = () => {
    if (!confirm('Nieuw formulier starten? Alle gegevens worden gewist.')) return
    setState(mkInitial())
  }

  return <FormCtx.Provider value={{ state, set, goTo, resetForm }}>{children}</FormCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useForm() {
  const ctx = useContext(FormCtx)
  if (!ctx) throw new Error('useForm must be used within FormProvider')
  return ctx
}
