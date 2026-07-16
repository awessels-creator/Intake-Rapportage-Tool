import type { FormState } from './types'
import { LASTEN_DEF, TOESLAG_NAMEN, PER_OPTIES } from './constants'

// Genereert een CSV (Excel NL: ';' delimiter, ',' decimaal) budgetoverzicht
// met ONDERLIGGENDE FORMULES zodat de inwoner bedragen kan wijzigen en alles
// automatisch doorrekent (net als in Excel).
//
// Kolommen:  A = Post
//            B = Invoer-bedrag (wat de consulent invulde, ongewijzigd)
//            C = Periode (label, bv. '/week')
//            D = Maandbedrag (€) — FORMULE die B omrekent met dezelfde factor
//                als de tool (week=4,333, kwt=/3, jaar=/12, 10 term=*10/12).
//                Wijzigt de inwoner B (of de invoer in de tool), dan rekent D
//                en het totaal/saldo automatisch door.
export function genereerBudgetCSV(state: FormState): string {
  const rows: string[] = []

  // Titel
  rows.push('Budgetoverzicht;Invoer;Periode;Maandbedrag (€)')
  rows.push(`Cliënt;${state.voornaam || ''} ${state.achternaam || ''};;`.trim())

  // Formule-factor naar NL-Excel-formule (verwijst naar kolom B, huidige rij)
  const formule = (rij: number, per: string): string => {
    const f = PER_OPTIES.find(p => p.v === per)?.f ?? 1
    if (f === 1) return `=B${rij}`
    if (f === 4.333) return `=B${rij}*4,333`
    if (f === 1 / 3) return `=B${rij}/3`
    if (f === 1 / 12) return `=B${rij}/12`
    if (f === 10 / 12) return `=B${rij}*10/12`
    return `=B${rij}*${String(f).replace('.', ',')}`
  }
  const perLabel = (per: string) => PER_OPTIES.find(p => p.v === per)?.l || '/mnd'
  const fmt = (n: number) => n.toFixed(2).replace('.', ',')

  // ── Inkomsten ──────────────────────────────────────────────
  rows.push('')
  rows.push('INKOMSTEN')
  const inkomstenRijen: { naam: string; bedrag: number; per: string }[] = []
  state.inkomenData.forEach(d => {
    const bedrag = parseFloat(d.netto) || 0
    if (bedrag > 0) inkomstenRijen.push({ naam: d.bron || 'Inkomstenbron', bedrag, per: d.invoerPer || 'mnd' })
  })
  Object.entries(state.toeslagenActief).forEach(([id, actief]) => {
    if (actief) {
      const bedrag = parseFloat(state.toeslagenBedrag[id] || '0') || 0
      if (bedrag > 0) inkomstenRijen.push({ naam: TOESLAG_NAMEN[id] || id, bedrag, per: 'mnd' })
    }
  })
  const startInk = rows.length + 1
  inkomstenRijen.forEach(r => {
    rows.push(`${r.naam};${fmt(r.bedrag)};${perLabel(r.per)};${formule(rows.length + 1, r.per)}`)
  })
  const eindInk = rows.length
  rows.push(`Totaal inkomen;;;=SOM(D${startInk}:D${eindInk})`)

  // ── Lasten ─────────────────────────────────────────────────
  rows.push('')
  rows.push('UITGAVEN')
  const lastenRijen: { naam: string; bedrag: number; per: string }[] = []
  LASTEN_DEF.forEach(def => {
    const w = state.lastenWaarden[def.id]
    if (w && w.bedrag) {
      const b = parseFloat(w.bedrag) || 0
      if (b > 0) lastenRijen.push({ naam: def.post, bedrag: b, per: w.per || def.per })
    }
  })
  state.lastenExtra.forEach((e, i) => {
    const w = state.lastenWaarden[`extra_${i}`]
    if (w && w.bedrag) {
      const b = parseFloat(w.bedrag) || 0
      if (b > 0) lastenRijen.push({ naam: e.post || 'Eigen post', bedrag: b, per: w.per || 'mnd' })
    }
  })
  const startLast = rows.length + 1
  lastenRijen.forEach(r => {
    rows.push(`${r.naam};${fmt(r.bedrag)};${perLabel(r.per)};${formule(rows.length + 1, r.per)}`)
  })
  const eindLast = rows.length
  rows.push(`Totaal uitgaven;;;=SOM(D${startLast}:D${eindLast})`)

  // ── Saldo ──────────────────────────────────────────────────
  rows.push('')
  const totaalInkRij = eindInk + 1
  const totaalLastRij = eindLast + 1
  rows.push(`SALDO (inkomen − uitgaven);;;=D${totaalInkRij}-D${totaalLastRij}`)

  return rows.join('\r\n')
}

// Trigger een download van het CSV-bestand (client-side, geen opslag)
export function downloadBudgetCSV(state: FormState) {
  const csv = genereerBudgetCSV(state)
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `budgetoverzicht_${(state.voornaam || 'cliënt')}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
