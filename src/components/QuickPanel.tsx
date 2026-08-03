import { useState } from 'react'
import { useForm } from '../context'
import { QUICK_SECTIONS } from '../utils'

// Uitklapbaar zijpaneel met de snelvragenlijst (buiten de tabbladen, altijd bruikbaar).
// Vinkjes/keuzes worden bij rapportage samengevoegd met de handmatige tekst in
// de bestaande open velden (optie A) — zie utils.ts buildQuickText + downloadImpl.ts.

export default function QuickPanel() {
  const { state, set } = useForm()
  const [open, setOpen] = useState(false)
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({})

  const toggleCheck = (id: string) => {
    set({ quickChecks: { ...state.quickChecks, [id]: !state.quickChecks[id] } })
  }
  const setRadio = (name: string, value: string) => {
    set({ quickRadio: { ...state.quickRadio, [name]: value } })
  }
  const setFree = (id: string, value: string) => {
    set({ quickFree: { ...state.quickFree, [id]: value } })
  }
  const toggleSectie = (key: string) => {
    setOpenKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      {/* Vaste knop rechtsonder om het paneel te openen */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-300 bg-ok hover:bg-ok-dark text-white px-4 py-2.5 rounded-full shadow-lg text-[0.85rem] font-semibold flex items-center gap-2"
        aria-label="Snelvragenlijst openen"
      >
        <span className="text-[1.05rem] leading-none">☰</span>
        Snelvragenlijst
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-300 bg-black/30"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Paneel */}
      <aside
        className={`fixed top-0 right-0 h-full w-[380px] max-w-[92vw] bg-white shadow-[-6px_0_18px_rgba(0,0,0,.12)] z-400 flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-rule bg-accents">
          <span className="font-bold text-accent-dark text-[0.95rem]">Snelvragenlijst</span>
          <button
            onClick={() => setOpen(false)}
            className="border-none bg-transparent text-[1.2rem] cursor-pointer text-inkl px-2"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-3 py-3">
          <p className="text-[0.72rem] text-inkl mb-3 leading-snug">
            Vink snel aan wat van toepassing is. De aangevinkte punten komen bij het
            rapport als lopende tekst in de bestaande velden te staan (geen vinklijst).
          </p>

          {QUICK_SECTIONS.map(sec => {
            const isOpen = openKeys[sec.key] ?? false
            return (
              <div key={sec.key} className="border border-rule rounded-[7px] mb-2.5 overflow-hidden">
                <button
                  onClick={() => toggleSectie(sec.key)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-warm cursor-pointer text-[0.82rem] font-semibold text-ink"
                >
                  <span>{sec.tabLabel}</span>
                  <span className={`text-inkl transition-transform ${isOpen ? '' : '-rotate-90'}`}>▾</span>
                </button>
                {isOpen && (
                  <div className="px-3 py-2.5">
                    {sec.groups.map((g, gi) => (
                      <div key={gi} className="mb-2.5 last:mb-0">
                        <div className="text-[0.7rem] font-bold text-inkl mb-1">{g.label}</div>
                        {g.type === 'check' && (
                          <div className="flex flex-wrap gap-1.5">
                            {(g.items || []).map(it => {
                              const on = !!state.quickChecks[it.id]
                              return (
                                <label
                                  key={it.id}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[0.72rem] cursor-pointer transition-all ${on ? 'border-accent bg-accents text-accent-dark font-semibold' : 'border-rule bg-white text-ink hover:border-accent'}`}
                                >
                                  <input
                                    type="checkbox"
                                    className="accent-accent w-[13px] h-[13px]"
                                    checked={on}
                                    onChange={() => toggleCheck(it.id)}
                                  />
                                  {it.label}
                                </label>
                              )
                            })}
                          </div>
                        )}
                        {g.type === 'radio' && (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(g.map || {}).map(([val, lbl]) => {
                              const on = state.quickRadio[g.name || ''] === val
                              return (
                                <label
                                  key={val}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[0.72rem] cursor-pointer transition-all ${on ? 'border-accent bg-accents text-accent-dark font-semibold' : 'border-rule bg-white text-ink hover:border-accent'}`}
                                >
                                  <input
                                    type="radio"
                                    name={g.name}
                                    className="accent-accent w-[13px] h-[13px]"
                                    checked={on}
                                    onChange={() => setRadio(g.name || '', val)}
                                  />
                                  {lbl}
                                </label>
                              )
                            })}
                          </div>
                        )}
                        {g.type === 'text' && (
                          <input
                            type="text"
                            className="w-full border-[1.5px] border-rule rounded-[6px] text-[0.78rem] px-2 py-1.5 focus:outline-none focus:border-accent"
                            placeholder={g.id === 'b_richting' ? 'Bijv. sociaal werk, technisch...' : 'Vrije tekst'}
                            value={state.quickFree[g.id || ''] || ''}
                            onChange={e => setFree(g.id || '', e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>
    </>
  )
}
