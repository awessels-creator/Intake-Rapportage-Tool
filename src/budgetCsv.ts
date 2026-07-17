import type { FormState } from './types'
import { LASTEN_DEF, TOESLAG_NAMEN, PER_OPTIES } from './constants'

// Genereert een BUDGETOVERZICHT als ÉCHT .xlsx (Excel) bestand — niet .csv.
// Reden: een .csv ondersteunt geen formules, geen kolombreedte en geen
// cel-opmaak. Excel berekent formules in een .csv NIET bij openen (ze blijven
// als tekst staan → het saldo toont geen bedrag). Een .xlsx wél: de inwoner
// kan bedragen wijzigen en alles (maandbedrag + totalen + saldo) rekent automatisch
// door, net als in het vertrouwde Budgetplan .xls van de gemeente.
//
// Structuur (gespiegeld aan het Budgetplan .xls):
//   A = Post
//   B = Maandbedrag (€) — FORMULE, verwijst naar D (invoer) × periode-factor
//   C = (lege kolom, voor leesbaarheid)
//   D = Invoer-bedrag (wat de consulent invulde; de inwoner kan dit wijzigen)
//   E = Periode (label, bv. '/week')
//
// De formule staat in B en kijkt naar D (een ándere kolom, zelfde rij) → géén
// zelf-referentie, dus géén kringverwijzing bij openen in Excel.
// Twee richtingen: het maandbedrag volgt altijd uit (invoer-bedrag × periode).
//
// De zware `xlsx`-library wordt LAZY geladen (dynamic import) zodat die niet in
// de initiële app-bundle terechtkomt (code-splitting, <500KB waiver).

type WerkboekRij = {
  naam: string
  bedrag: number
  per: string
}

// Multiplier van periode naar maand (voor de JS-berekening van de waarde)
function factor(per: string): number {
  const f = PER_OPTIES.find(p => p.v === per)?.f ?? 1
  return f
}
// NL-Excel formule (verwijst naar kolom D, de invoer-cel op dezelfde rij)
function formuleFactor(per: string): string {
  const f = factor(per)
  if (f === 1) return 'D{r}' // 1:1 (maand)
  if (f === 4.333) return 'D{r}*4,333' // week
  if (f === 1 / 3) return 'D{r}/3' // kwartaal
  if (f === 1 / 12) return 'D{r}/12' // jaar
  if (f === 10 / 12) return 'D{r}*10/12' // 10-termijn
  return `D{r}*${String(f).replace('.', ',')}`
}
const perLabel = (per: string) => PER_OPTIES.find(p => p.v === per)?.l || '/mnd'
// Betaalverkeer: maximaal 2 cijfers achter de komma
const fmt = (n: number) => Number(n.toFixed(2))

// Maakt een formule-cel aan MET gecachte waarde. Excel toont de waarde direct
// (geen "bewerken" nodig) en de @-bug (implicit intersection) verdwijnt, omdat
// de cel correct als number-formule { f, v, t:'n' } is gemarkeerd.
// SheetJS verwacht de formule in `f` ZONDER leading '=' — die strippen we.
function formuleCel(formule: string, waarde: number) {
  const f = formule.startsWith('=') ? formule.slice(1) : formule
  return { f, v: Number(waarde.toFixed(2)), t: 'n' as const }
}

// Bouwt het SheetJS-workbook-object (formules + opmaak). De `xlsx`-module
// wordt hier NIET geïmporteerd — die geven we door zodat de caller hem lazy
// kan laden en de workbook naar een bestand kan schrijven.
export function bouwBudgetWerkboek(
  state: FormState,
  XLSX: typeof import('xlsx'),
): import('xlsx').WorkBook {
  const rows: (string | number | object)[][] = []
  rows.push(['Budgetoverzicht', 'Maandbedrag (€)', '', 'Invoer', 'Periode'])
  rows.push([`Cliënt: ${state.voornaam || ''} ${state.achternaam || ''}`, '', '', '', ''])

  // Inkomsten
  rows.push([])
  rows.push(['INKOMSTEN'])
  const inkomsten: WerkboekRij[] = []
  state.inkomenData.forEach(d => {
    const bedrag = parseFloat(d.netto) || 0
    if (bedrag > 0) inkomsten.push({ naam: d.bron || 'Inkomstenbron', bedrag, per: d.invoerPer || 'mnd' })
  })
  Object.entries(state.toeslagenActief).forEach(([id, actief]) => {
    if (actief) {
      const bedrag = parseFloat((state.toeslagenBedrag as Record<string, string>)[id] || '0') || 0
      if (bedrag > 0) inkomsten.push({ naam: TOESLAG_NAMEN[id] || id, bedrag, per: 'mnd' })
    }
  })
  const inkStart = rows.length + 1 // 1-based rij van eerste inkomst
  const inkomstWaarden: number[] = []
  inkomsten.forEach(r => {
    const rij = rows.length + 1
    const w = r.bedrag * factor(r.per)
    inkomstWaarden.push(w)
    rows.push([r.naam, formuleCel(`=${formuleFactor(r.per).replace('{r}', String(rij))}`, w), '', fmt(r.bedrag), perLabel(r.per)])
  })
  const inkEnd = rows.length
  const totInk = inkomstWaarden.reduce((a, b) => a + b, 0)
  rows.push(['Totaal inkomen', formuleCel(`=SOM(B${inkStart}:B${inkEnd})`, totInk), '', '', ''])

  // Lasten
  rows.push([])
  rows.push(['UITGAVEN'])
  const lasten: WerkboekRij[] = []
  LASTEN_DEF.forEach(def => {
    const w = state.lastenWaarden[def.id]
    if (w && w.bedrag) {
      const b = parseFloat(w.bedrag) || 0
      if (b > 0) lasten.push({ naam: def.post, bedrag: b, per: w.per || def.per })
    }
  })
  state.lastenExtra.forEach((e, i) => {
    const w = state.lastenWaarden[`extra_${i}`]
    if (w && w.bedrag) {
      const b = parseFloat(w.bedrag) || 0
      if (b > 0) lasten.push({ naam: e.post || 'Eigen post', bedrag: b, per: w.per || 'mnd' })
    }
  })
  const lastStart = rows.length + 1
  const lastWaarden: number[] = []
  lasten.forEach(r => {
    const rij = rows.length + 1
    const w = r.bedrag * factor(r.per)
    lastWaarden.push(w)
    rows.push([r.naam, formuleCel(`=${formuleFactor(r.per).replace('{r}', String(rij))}`, w), '', fmt(r.bedrag), perLabel(r.per)])
  })
  const lastEnd = rows.length
  const totLast = lastWaarden.reduce((a, b) => a + b, 0)
  rows.push(['Totaal uitgaven', formuleCel(`=SOM(B${lastStart}:B${lastEnd})`, totLast), '', '', ''])

  // Saldo
  rows.push([])
  const totInkRij = inkEnd + 1
  const totLastRij = lastEnd + 1
  rows.push(['SALDO (inkomen − uitgaven)', formuleCel(`=B${totInkRij}-B${totLastRij}`, totInk - totLast), '', '', ''])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  // Kolombreedte: A breed genoeg voor "SALDO (inkomen − uitgaven)",
  // B maandbedrag, C leeg, D invoer, E periode.
  ws['!cols'] = [
    { wch: 42 }, // A
    { wch: 16 }, // B
    { wch: 3 },  // C
    { wch: 14 }, // D
    { wch: 12 }, // E
  ]
  // 2-decimaal nummerformaat op B (maandbedrag) en D (invoer)
  const numFmt = '#,##0.00'
  for (let r = 0; r < rows.length; r++) {
    const bCell = XLSX.utils.encode_cell({ r, c: 1 })
    const dCell = XLSX.utils.encode_cell({ r, c: 3 })
    if (ws[bCell]) ws[bCell].z = numFmt
    if (ws[dCell]) ws[dCell].z = numFmt
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Budgetoverzicht')
  return wb
}

// Trigger een download van het .xlsx-bestand (client-side, geen opslag).
// Laadt de `xlsx`-library pas op het moment van exporteren (code-splitting).
export async function downloadBudgetXLSX(state: FormState): Promise<void> {
  const XLSX = await import('xlsx')
  const wb = bouwBudgetWerkboek(state, XLSX)
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `budgetoverzicht_${(state.voornaam || 'cliënt')}_${new Date().toISOString().slice(0, 10)}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
