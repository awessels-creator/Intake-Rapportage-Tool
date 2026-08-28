import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { FormState } from './types'
import { mkInitial, buildSystemAdvItems } from './utils'

const STORAGE_KEY = 'irt-sessie'

interface Ctx {
  state: FormState
  set: (patch: Partial<FormState>) => void
  goTo: (n: number) => void
  resetForm: () => void
  wissen: () => void
  herstelVraag: boolean
  herstelSessie: () => void
  negeerHerstel: () => void
}

function leesSessie(): FormState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<FormState>
    // merge met mkInitial zodat nieuwe velden nooit ontbreken
    return { ...mkInitial(), ...parsed }
  } catch {
    return null
  }
}

function schrijfSessie(s: FormState) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* quota vol of niet beschikbaar — negeer */ }
}

function wisSessie() {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* negeer */ }
}

const FormCtx = createContext<Ctx | null>(null)

export function FormProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FormState>(mkInitial)
  const [herstelVraag, setHerstelVraag] = useState(false)

  // Bij opstart: check of er een niet-afgeronde sessie is
  useEffect(() => {
    const opgeslagen = leesSessie()
    if (opgeslagen && JSON.stringify(opgeslagen) !== JSON.stringify(mkInitial())) {
      setHerstelVraag(true)
    }
  }, [])

  // Autosave naar sessionStorage bij elke wijziging
  useEffect(() => {
    if (!herstelVraag) schrijfSessie(state)
  }, [state, herstelVraag])

  const set = (patch: Partial<FormState>) =>
    setState(prev => ({ ...prev, ...patch }))

  const goTo = (n: number) => {
    setState(prev => {
      let extra: Partial<FormState> = {}
      if (n === 9) {
        const newSystemItems = buildSystemAdvItems(prev)
        const existing = prev.advItems
        const merged = newSystemItems.map(newItem => {
          const found = existing.find(e => !e.custom && e.t === newItem.t)
          return found ? { ...newItem, on: found.on, b: found.b } : newItem
        })
        const customItems = existing.filter(e => e.custom)
        extra = { advItems: [...merged, ...customItems] }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return { ...prev, currentPage: n, ...extra }
    })
  }

  const resetForm = () => {
    if (!confirm('Nieuw formulier starten? Alle gegevens worden gewist.')) return
    wisSessie()
    setState(mkInitial())
  }

  const wissen = () => {
    wisSessie()
    setState(mkInitial())
    setHerstelVraag(false)
  }

  const herstelSessie = () => {
    const opgeslagen = leesSessie()
    if (opgeslagen) setState(opgeslagen)
    setHerstelVraag(false)
  }

  const negeerHerstel = () => {
    wisSessie()
    setHerstelVraag(false)
  }

  return (
    <FormCtx.Provider value={{ state, set, goTo, resetForm, wissen, herstelVraag, herstelSessie, negeerHerstel }}>
      {children}
    </FormCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useForm() {
  const ctx = useContext(FormCtx)
  if (!ctx) throw new Error('useForm must be used within FormProvider')
  return ctx
}
