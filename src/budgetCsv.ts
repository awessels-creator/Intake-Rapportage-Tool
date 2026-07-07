import type { FormState } from './types'
import { LASTEN_DEF, TOESLAG_NAMEN } from './constants'
import { getMndBedrag } from './utils'

// Genereert een CSV (Excel NL: ';' delimiter, ',' decimaal) budgetoverzicht
// met formules zodat de inwoner bedragen kan wijzigen.
// Inkomsten-blok → Lasten-blok → Saldo (formule).
export function genereerBudgetCSV(state: FormState): string {
  const rows: string[] = []

  // Titel
  rows.push('Budgetoverzicht;Maandbedrag (€)')
  rows.push(`Cliënt;${state.voornaam || ''} ${state.achternaam || ''}`.trim())

  // ── Inkomsten ──────────────────────────────────────────────
  rows.push('')
  rows.push('INKOMSTEN')
  const inkomstenRijen: { naam: string; bedrag: number }[] = []
  state.inkomenData.forEach(d => {
    const bedrag = parseFloat(d.netto) || 0
    if (bedrag > 0) inkomstenRijen.push({ naam: d.bron || 'Inkomstenbron', bedrag })
  })
  state.toeslagenActief && Object.entries(state.toeslagenActief).forEach(([id, actief]) => {
    if (actief) {
      const bedrag = parseFloat(state.toeslagenBedrag[id] || '0') || 0
      if (bedrag > 0) inkomstenRijen.push({ naam: TOESLAG_NAMEN[id] || id, bedrag })
    }
  })
  const startInk = rows.length + 1
  inkomstenRijen.forEach(r => rows.push(`${r.naam};${r.bedrag.toFixed(2).replace('.', ',')}`))
  const eindInk = rows.length
  rows.push(`Totaal inkomen;=SOM(B${startInk}:B${eindInk})`)

  // ── Lasten ─────────────────────────────────────────────────
  rows.push('')
  rows.push('UITGAVEN')
  const lastenRijen: { naam: string; bedrag: number }[] = []
  LASTEN_DEF.forEach(def => {
    const w = state.lastenWaarden[def.id]
    if (w && w.bedrag) {
      const mnd = getMndBedrag(w.bedrag, w.per || def.per)
      if (mnd > 0) lastenRijen.push({ naam: def.post, bedrag: mnd })
    }
  })
  state.lastenExtra.forEach(e => {
    const w = state.lastenWaarden[`extra_${state.lastenExtra.indexOf(e)}`]
    if (w && w.bedrag) {
      const mnd = getMndBedrag(w.bedrag, w.per || 'mnd')
      if (mnd > 0) lastenRijen.push({ naam: e.post || 'Eigen post', bedrag: mnd })
    }
  })
  const startLast = rows.length + 1
  lastenRijen.forEach(r => rows.push(`${r.naam};${r.bedrag.toFixed(2).replace('.', ',')}`))
  const eindLast = rows.length
  rows.push(`Totaal uitgaven;=SOM(B${startLast}:B${eindLast})`)

  // ── Saldo ──────────────────────────────────────────────────
  rows.push('')
  const totaalInkRij = eindInk + 1
  const totaalLastRij = eindLast + 1
  rows.push(`SALDO (inkomen − uitgaven);=B${totaalInkRij}-B${totaalLastRij}`)

  return rows.join('\r\n')
}

// Trigger een download van het CSV-bestand (client-side, geen opslag)
export function downloadBudgetCSV(state: FormState) {
  const csv = genereerBudgetCSV(state)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `budgetoverzicht_${(state.voornaam || 'cliënt')}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
