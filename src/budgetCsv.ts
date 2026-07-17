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
// Formules zijn ENGELSTALIG (SUM i.p.v. SOM, decimaal PUNT) omdat SheetJS/ExcelJS
// een neutrale locale schrijft. Excel herkent SUM altijd (NL-Excel toont het als
// SOM) — zo voorkomen we #NAAM bij openen.
//
// De zware `exceljs`-library wordt LAZY geladen (dynamic import) zodat die niet
// in de initiële app-bundle terechtkomt (code-splitting, <500KB waiver).

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
// NL-Excel formule (verwijst naar kolom D, de invoer-cel op dezelfde rij).
// Engelstalig + decimaal PUNT (zie boven).
function formuleFactor(per: string): string {
  const f = factor(per)
  if (f === 1) return 'D{r}' // 1:1 (maand)
  if (f === 4.333) return 'D{r}*4.333' // week
  if (f === 1 / 3) return 'D{r}/3' // kwartaal
  if (f === 1 / 12) return 'D{r}/12' // jaar
  if (f === 10 / 12) return 'D{r}*10/12' // 10-termijn
  return `D{r}*${String(f)}`
}
const perLabel = (per: string) => PER_OPTIES.find(p => p.v === per)?.l || '/mnd'
// Betaalverkeer: maximaal 2 cijfers achter de komma
const fmt = (n: number) => Number(n.toFixed(2))
const numFmt2 = '#,##0.00'

// Bouwt het ExcelJS-workbook-object (formules + opmaak + groen/rood saldo).
// De `exceljs`-module wordt hier NIET geïmporteerd — die geven we door zodat
// de caller hem lazy kan laden.
export function bouwBudgetWerkboek(
  state: FormState,
  ExcelJS: typeof import('exceljs'),
): import('exceljs').Workbook {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Budgetoverzicht')

  // Kolombreedte: A breed genoeg voor "SALDO (inkomen − uitgaven)",
  // B maandbedrag, C leeg, D invoer, E periode.
  ws.columns = [
    { width: 42 }, // A
    { width: 16 }, // B
    { width: 3 },  // C
    { width: 14 }, // D
    { width: 12 }, // E
  ]

  let rij = 1
  // zet een tekstregel (A, optioneel B/D/E). Voor formule-cellen gebruik je
  // zetFormule() hieronder — die zet B als { formula, result }.
  const zet = (a: string, b?: string | number, d?: string | number, e?: string) => {
    ws.getCell(rij, 1).value = a
    if (b !== undefined) ws.getCell(rij, 2).value = b
    if (d !== undefined) ws.getCell(rij, 4).value = d
    if (e !== undefined) ws.getCell(rij, 5).value = e
    rij++
    return rij - 1
  }
  const zetFormule = (a: string, formule: string, result: number, d?: string | number, e?: string) => {
    ws.getCell(rij, 1).value = a
    ws.getCell(rij, 2).value = { formula: formule, result: Number(result.toFixed(2)) }
    if (d !== undefined) ws.getCell(rij, 4).value = d
    if (e !== undefined) ws.getCell(rij, 5).value = e
    rij++
    return rij - 1
  }

  // Header-rij (A t/m E) apart zetten
  ws.getCell(rij, 1).value = 'Budgetoverzicht'
  ws.getCell(rij, 2).value = 'Maandbedrag (€)'
  ws.getCell(rij, 4).value = 'Invoer'
  ws.getCell(rij, 5).value = 'Periode'
  rij++
  zet(`Cliënt: ${state.voornaam || ''} ${state.achternaam || ''}`)
  rij++ // lege rij
  zet('INKOMSTEN')

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
  const inkStart = rij
  const inkomstWaarden: number[] = []
  inkomsten.forEach(r => {
    const formule = `=${formuleFactor(r.per).replace('{r}', String(rij))}`
    const w = r.bedrag * factor(r.per)
    inkomstWaarden.push(w)
    zetFormule(r.naam, formule, w, fmt(r.bedrag), perLabel(r.per))
  })
  const inkEnd = rij - 1
  const totInk = inkomstWaarden.reduce((a, b) => a + b, 0)
  zetFormule('Totaal inkomen', `=SUM(B${inkStart}:B${inkEnd})`, totInk)

  rij++ // lege rij
  zet('UITGAVEN')

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
  const lastStart = rij
  const lastWaarden: number[] = []
  lasten.forEach(r => {
    const formule = `=${formuleFactor(r.per).replace('{r}', String(rij))}`
    const w = r.bedrag * factor(r.per)
    lastWaarden.push(w)
    zetFormule(r.naam, formule, w, fmt(r.bedrag), perLabel(r.per))
  })
  const lastEnd = rij - 1
  const totLast = lastWaarden.reduce((a, b) => a + b, 0)
  zetFormule('Totaal uitgaven', `=SUM(B${lastStart}:B${lastEnd})`, totLast)

  rij++ // lege rij
  const totInkRij = inkEnd + 1
  const totLastRij = lastEnd + 1
  const saldoRij = rij
  zetFormule('SALDO (inkomen − uitgaven)', `=B${totInkRij}-B${totLastRij}`, totInk - totLast)
  const saldoCell = ws.getCell(saldoRij, 2)

  // Nummerformaat 2 decimalen op B (maandbedrag) en D (invoer)
  for (let r = 1; r <= saldoRij; r++) {
    ws.getCell(r, 2).numFmt = numFmt2
    ws.getCell(r, 4).numFmt = numFmt2
  }

  // SALDO: groen bij positief/ongebruikt, rood bij negatief budget.
  // Voorwaardelijk nummerformaat — ExcelJS schrijft dit correct weg (anders
  // dan SheetJS). Volgt automatisch als de inwoner bedragen wijzigt.
  saldoCell.numFmt = '[Green]#,##0.00;[Red]-#,##0.00'

  return wb
}

// Trigger een download van het .xlsx-bestand (client-side, geen opslag).
// Laadt de `exceljs`-library pas op het moment van exporteren (code-splitting).
export async function downloadBudgetXLSX(state: FormState): Promise<void> {
  const ExcelJS = await import('exceljs')
  const wb = bouwBudgetWerkboek(state, ExcelJS)
  const buf = await wb.xlsx.writeBuffer()
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
