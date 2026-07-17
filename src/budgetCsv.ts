import type { FormState } from './types'
import { LASTEN_DEF, TOESLAG_NAMEN } from './constants'

// Genereert een BUDGETOVERZICHT als ÉCHT .xlsx (Excel) bestand — niet .csv.
// Reden: een .csv ondersteunt geen formules, geen kolombreedte en geen
// cel-opmaak. Excel berekent formules in een .csv NIET bij openen (ze blijven
// als tekst staan → het saldo toont geen bedrag). Een .xlsx wél: de inwoner
// kan bedragen (kolom D) én periodes (kolom E) wijzigen en alles (maandbedrag,
// totalen, saldo) rekent automatisch door.
//
// Structuur (gespiegeld aan het Budgetplan .xls van de gemeente):
//   A = Post
//   B = Maandbedrag (€) — FORMULE, verwijst naar D (invoer) × factor(E periode)
//   C = (lege kolom, voor leesbaarheid)
//   D = Invoer (€) — het veld dat de cliënt invult / wijzigt bij verandering
//   E = Periode — dropdown (maand / week / kwartaal / jaar / 10-termijn)
//
// De formule in B kijkt naar D én E (een ándere kolom, zelfde rij) → géén
// zelf-referentie, dus géén kringverwijzing bij openen in Excel.
// Twee richtingen: het maandbedrag volgt altijd uit (invoer-bedrag × periode).
//
// Formules zijn ENGELSTALIG (SUM i.p.v. SOM) en zonder leading '=' — ExcelJS
// schrijft de formule anders als <f>=D5</f> (niet-conform OOXML) en Excel
// breekt de berekening bij "bewerken inschakelen". Zonder '=' is het <f>D5</f>.
//
// De zware `exceljs`-library wordt LAZY geladen (dynamic import) zodat die niet
// in de initiële app-bundle terechtkomt (code-splitting, <500KB waiver).

// Periode-codes (weergegeven in kolom E, met dropdown)
const PER_CODES = ['maand', 'week', 'kwartaal', 'jaar', '10-termijn'] as const
type PerCode = typeof PER_CODES[number]

// Tool-periode (mnd/week/kwt/jaar/10ter) -> code voor kolom E
function naarCode(per: string): PerCode {
  switch (per) {
    case 'week': return 'week'
    case 'kwt': return 'kwartaal'
    case 'jaar': return 'jaar'
    case '10ter': return '10-termijn'
    default: return 'maand'
  }
}
// code -> factor (maand-multiplier) voor de JS-berekening van de waarde
function factorVanCode(code: PerCode): number {
  switch (code) {
    case 'week': return 52 / 12
    case 'kwartaal': return 1 / 3
    case 'jaar': return 1 / 12
    case '10-termijn': return 10 / 12
    default: return 1
  }
}

// Maandbedrag-formule: verwijst naar D (invoer) én E (periode). De cliënt kan
// beide wijzigen en B volgt automatisch. Geen '=' — ExcelJS schrijft de
// formule anders niet-conform en Excel breekt de berekening bij bewerken.
// VLOOKUP naar een verborgen hulptabel (periode -> maandfactor): robuust in
// alle Excel-versies én compatibel met formule-validators (geen array-constante).
const PER_TABEL = 'Bureau!G1:H5' // verborgen hulptabel op het Bureau-blad
// IFERROR zodat een lege/verkeerde periode (E) nooit #WAARDE/#N/A geeft maar 0.
function maandFormule(rij: number): string {
  return `IFERROR(D${rij}*VLOOKUP(E${rij},${PER_TABEL},2,0),0)`
}

// Betaalverkeer: maximaal 2 cijfers achter de komma
const fmt = (n: number) => Number(n.toFixed(2))
const numFmt2 = '#,##0.00'

type WerkboekRij = {
  naam: string
  bedrag: number
  code: PerCode
}

// Bouwt het ExcelJS-workbook-object (formules + opmaak + dropdown + rood saldo).
// De `exceljs`-module wordt hier NIET geïmporteerd — die geven we door zodat
// de caller hem lazy kan laden.
export function bouwBudgetWerkboek(
  state: FormState,
  ExcelJS: typeof import('exceljs'),
): import('exceljs').Workbook {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Budgetoverzicht')

  // Verborgen hulptabel: periode -> maandfactor. De VLOOKUP in kolom B
  // leest hieruit. Exact dezelfde strings als de dropdown in kolom E, anders
  // geeft VLOOKUP #N/A.
  const bureau = wb.addWorksheet('Bureau')
  bureau.state = 'hidden'
  const perTabel: [PerCode, number][] = [
    ['maand', 1],
    ['week', 52 / 12],
    ['kwartaal', 1 / 3],
    ['jaar', 1 / 12],
    ['10-termijn', 10 / 12],
  ]
  perTabel.forEach(([code, fac], i) => {
    bureau.getCell(i + 1, 7).value = code // G
    bureau.getCell(i + 1, 8).value = fac  // H
  })

  // Kolombreedte: A breed genoeg voor "SALDO (inkomen − uitgaven)",
  // B maandbedrag, C leeg, D invoer, E periode.
  ws.columns = [
    { width: 42 }, // A
    { width: 16 }, // B
    { width: 3 },  // C
    { width: 16 }, // D
    { width: 14 }, // E
  ]

  let rij = 1
  // zet een tekstregel (A, optioneel B/D/E)
  const zet = (a: string, b?: string | number, d?: string | number, e?: string) => {
    ws.getCell(rij, 1).value = a
    if (b !== undefined) ws.getCell(rij, 2).value = b
    if (d !== undefined) ws.getCell(rij, 4).value = d
    if (e !== undefined) ws.getCell(rij, 5).value = e
    rij++
    return rij - 1
  }
  // zet een formule-regel: B = { formula, result }, D = invoer, E = periode (dropdown)
  const zetFormule = (a: string, formule: string, result: number, d?: string | number, e?: PerCode) => {
    ws.getCell(rij, 1).value = a
    // GEEN leading '=' — anders schrijft ExcelJS <f>=...<f> (niet-conform) en
    // breekt Excel de berekening bij "bewerken inschakelen".
    ws.getCell(rij, 2).value = { formula: formule.replace(/^=/, ''), result: Number(result.toFixed(2)) }
    if (d !== undefined) ws.getCell(rij, 4).value = d
    if (e !== undefined) {
      const ec = ws.getCell(rij, 5)
      ec.value = e
      ec.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${PER_CODES.join(',')}"`],
        showErrorMessage: true,
        error: 'Kies een van: ' + PER_CODES.join(', '),
      }
    }
    rij++
    return rij - 1
  }

  // Header-rij (A t/m E)
  ws.getCell(rij, 1).value = 'Budgetoverzicht'
  ws.getCell(rij, 2).value = 'Maandbedrag (€) — automatisch'
  ws.getCell(rij, 4).value = 'Invoer (€) — wijzig hier bij verandering'
  ws.getCell(rij, 5).value = 'Periode'
  rij++
  zet(`Cliënt: ${state.voornaam || ''} ${state.achternaam || ''}`)
  rij++ // lege rij
  zet('INKOMSTEN')

  // Inkomsten: alle bronnen uit de tool (ook als bedrag 0 is, zodat de cliënt
  // ze in Excel kan invullen) + toeslagen + 2 lege template-rijen.
  const inkomsten: WerkboekRij[] = []
  state.inkomenData.forEach(d => {
    const bedrag = parseFloat(d.netto) || 0
    inkomsten.push({ naam: d.bron || 'Inkomstenbron', bedrag, code: naarCode(d.invoerPer || 'mnd') })
  })
  Object.entries(state.toeslagenActief).forEach(([id, actief]) => {
    if (actief) {
      const bedrag = parseFloat((state.toeslagenBedrag as Record<string, string>)[id] || '0') || 0
      inkomsten.push({ naam: TOESLAG_NAMEN[id] || id, bedrag, code: 'maand' })
    }
  })
  const inkStart = rij
  const inkomstWaarden: number[] = []
  inkomsten.forEach(r => {
    const formule = maandFormule(rij)
    const w = r.bedrag * factorVanCode(r.code)
    inkomstWaarden.push(w)
    zetFormule(r.naam, formule, w, r.bedrag ? fmt(r.bedrag) : '', r.code)
  })
  // 2 lege template-rijen zodat de cliënt extra inkomen kan toevoegen
  for (let i = 0; i < 2; i++) zetFormule('', maandFormule(rij), 0, '', 'maand')
  const inkEnd = rij - 1
  const totInk = inkomstWaarden.reduce((a, b) => a + b, 0)
  zetFormule('Totaal inkomen', `=SUM(B${inkStart}:B${inkEnd})`, totInk)

  rij++ // lege rij
  zet('UITGAVEN')

  // Lasten: alleen posten die in de tool zijn ingevuld (bedrag niet leeg),
  // plus auto/dier/kinder-specifieke posten als die van toepassing zijn.
  // Niet-ingevulde posten weglaten — anders staan er tientallen lege rijen
  // met #WAARDE in het bestand. Extra posts (lastenExtra) ook alleen als gevuld.
  const hA = state.voertuigen.some(v => v.kenteken || v.merk || (parseFloat(v.waarde) || 0) > 0)
  const hD = state.huisdieren === 'ja'
  const hK = state.kinderen === 'ja'
  const lasten: WerkboekRij[] = []
  LASTEN_DEF.forEach(def => {
    if (def.autoOnly && !hA) return
    if (def.dierOnly && !hD) return
    if (def.kinderOnly && !hK) return
    const w = state.lastenWaarden[def.id]
    const bedragStr = w && w.bedrag ? w.bedrag : ''
    if (!bedragStr) return // niet ingevuld in de tool → weglaten
    const b = parseFloat(bedragStr) || 0
    lasten.push({ naam: def.post, bedrag: b, code: naarCode((w && w.per) || def.per) })
  })
  state.lastenExtra.forEach((e, i) => {
    const w = state.lastenWaarden[`extra_${i}`]
    const bedragStr = w && w.bedrag ? w.bedrag : ''
    if (!bedragStr) return // lege extra post → weglaten
    const b = parseFloat(bedragStr) || 0
    lasten.push({ naam: e.post || 'Eigen post', bedrag: b, code: naarCode((w && w.per) || 'mnd') })
  })
  const lastStart = rij
  const lastWaarden: number[] = []
  lasten.forEach(r => {
    const formule = maandFormule(rij)
    const w = r.bedrag * factorVanCode(r.code)
    lastWaarden.push(w)
    zetFormule(r.naam, formule, w, r.bedrag ? fmt(r.bedrag) : '', r.code)
  })
  for (let i = 0; i < 2; i++) zetFormule('', maandFormule(rij), 0, '', 'maand')
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

  // SALDO: rood bij negatief budget (positief/ongebruikt blijft standaard zwart).
  // Voorwaardelijk nummerformaat — ExcelJS schrijft dit correct weg. Volgt
  // automatisch als de inwoner bedragen of periodes wijzigt.
  saldoCell.numFmt = '#,##0.00;[Red]-#,##0.00'

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
