import type { FormState } from './types'
import { LASTEN_DEF, TOESLAG_NAMEN } from './constants'

// Genereert een BUDGETOVERZICHT als ÉCHT .xlsx (Excel) bestand — niet .csv.
// Reden: een .csv ondersteunt geen formules, geen kolombreedte en geen
// cel-opmaak. Excel berekent formules in een .csv NIET bij openen (ze blijven
// als tekst staan → het saldo toont geen bedrag). Een .xlsx wél: de inwoner
// kan bedragen (kolom C) én periodes (kolom D) wijzigen en alles (maandbedrag,
// totalen, saldo) rekent automatisch door.
// Structuur (gespiegeld aan het Budgetplan .xls van de gemeente):
//   A = Post
//   B = Maandbedrag — FORMULE, verwijst naar C (invoer) × factor(D periode)
//   C = Invoer — het veld dat de cliënt invult / wijzigt bij verandering
//   D = Periode — dropdown (maand / week / kwartaal / jaar / 10-termijn)
//
// De formule in B kijkt naar C én D (een ándere kolom, zelfde rij) → géén
// zelf-referentie, dus géén kringverwijzing bij openen in Excel.
// Twee richtingen: het maandbedrag volgt altijd uit (invoer-bedrag × periode).
//
// Formules zijn ENGELSTALIG (SUM i.p.v. SOM) en zonder leading '=' — ExcelJS
// schrijft de formule anders als <f>=C5</f> (niet-conform OOXML) en Excel
// breekt de berekening bij "bewerken inschakelen". Zonder '=' is het <f>C5</f>.
//
// De zware `exceljs`-library wordt LAZY geladen (dynamic import) zodat die niet
// in de initiële app-bundle terechtkomt (code-splitting, <500KB waiver).

// Periode-codes (weergegeven in kolom D, met dropdown)
const PER_CODES = ['maand', 'week', 'kwartaal', 'jaar', '10-termijn'] as const
type PerCode = typeof PER_CODES[number]

// Tool-periode (mnd/week/kwt/jaar/10ter) -> code voor kolom D
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

// Maandbedrag-formule: verwijst naar C (invoer) én D (periode). De cliënt kan
// beide wijzigen en B volgt automatisch. Geen '=' — ExcelJS schrijft de
// formule anders niet-conform en Excel breekt de berekening bij bewerken.
// VLOOKUP naar een verborgen hulptabel (periode -> maandfactor): robuust in
// alle Excel-versies én compatibel met formule-validators (geen array-constante).
const PER_TABEL = 'Bureau!G1:H5' // verborgen hulptabel op het Bureau-blad
// IFERROR zodat een lege/verkeerde periode (D) nooit #WAARDE/#N/A geeft maar 0.
function maandFormule(rij: number): string {
  return `IFERROR(C${rij}*VLOOKUP(D${rij},${PER_TABEL},2,0),0)`
}
// Variant voor lege template-rijen: toont "" (leeg) zolang C leeg is, en vult
// automatisch als de cliënt C invult. Voorkomt "0,00" in ongebruikte rijen.
function maandFormuleLeeg(rij: number): string {
  return `IF(C${rij}="","",IFERROR(C${rij}*VLOOKUP(D${rij},${PER_TABEL},2,0),0))`
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
  // leest hieruit. Exact dezelfde strings als de dropdown in kolom D, anders
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

  let rij = 1
  // zet een tekstregel (A, optioneel B/C/D)
  const zet = (a: string, b?: string | number, c?: string | number, d?: string) => {
    ws.getCell(rij, 1).value = a
    if (b !== undefined) ws.getCell(rij, 2).value = b
    if (c !== undefined) ws.getCell(rij, 3).value = c
    if (d !== undefined) ws.getCell(rij, 4).value = d
    rij++
    return rij - 1
  }
  // zet een formule-regel: B = { formula, result }, C = invoer, D = periode (dropdown)
  // opties.bold -> A+B vet (voor totalen/saldo)
  // goud (C+D) wordt automatisch toegepast als de periode niet 'maand' is.
  // B (de formule) is altijd vergrendeld (locked) zodat de cliënt hem niet per
  // ongeluk overschrijft en de doorrekening breekt. C en D blijven bewerkbaar.
  const zetFormule = (a: string, formule: string, result: number, c?: string | number, d?: PerCode, opties: { bold?: boolean } = {}) => {
    ws.getCell(rij, 1).value = a
    if (opties.bold) ws.getCell(rij, 1).font = { bold: true }
    // GEEN leading '=' — anders schrijft ExcelJS <f>=...<f> (niet-conform) en
    // breekt Excel de berekening bij "bewerken inschakelen".
    const bCell = ws.getCell(rij, 2)
    bCell.value = { formula: formule.replace(/^=/, ''), result: Number(result.toFixed(2)) }
    bCell.protection = { locked: true } // B vergrendeld
    if (opties.bold) bCell.font = { bold: true }
    if (c !== undefined) {
      const cc = ws.getCell(rij, 3)
      cc.value = c
      cc.protection = { locked: false } // C bewerkbaar
    }
    if (d !== undefined) {
      const dc = ws.getCell(rij, 4)
      dc.value = d
      dc.protection = { locked: false } // D bewerkbaar
      dc.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${PER_CODES.join(',')}"`],
        showErrorMessage: true,
        error: 'Kies een van: ' + PER_CODES.join(', '),
        showInputMessage: true,
        prompt: 'Kies de betaalperiode via het pijltje in deze cel (verschijnt bij selectie).',
      }

      // Goud kleurtje op Invoer (C) + Periode (D) als de periode niet maandelijks is
      // — spiegelt de goud-markering in de tool (niet-maandelijkse lasten).
      if (d !== 'maand') {
        const goudBg = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF6E9' } } as any
        const goudFont = { color: { argb: 'FF7A5010' } } as any
        const cc = ws.getCell(rij, 3)
        cc.fill = goudBg
        cc.font = goudFont
        dc.fill = goudBg
        dc.font = goudFont
      }
    } else {
      // Lege template-rij: geen periode (D blijft leeg), géén dropdown, géén goud.
      ws.getCell(rij, 4).protection = { locked: false }
    }
    rij++
    return rij - 1
  }

  // Header-rij (A t/m D) — géén " (€)" in de headers
  ws.getCell(rij, 1).value = 'Budgetoverzicht'
  ws.getCell(rij, 1).font = { bold: true, size: 13 }
  ws.getCell(rij, 2).value = 'Maandbedrag'
  ws.getCell(rij, 2).font = { bold: true }
  ws.getCell(rij, 3).value = 'Invoer (wijzig hier)'
  ws.getCell(rij, 3).font = { bold: true }
  ws.getCell(rij, 4).value = 'Periode'
  ws.getCell(rij, 4).font = { bold: true }
  rij++ // lege regel tussen header en INKOMSTEN
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
  for (let i = 0; i < 2; i++) zetFormule('', maandFormuleLeeg(rij), 0, '', undefined)
  const inkEnd = rij - 1
  const totInk = inkomstWaarden.reduce((a, b) => a + b, 0)
  zetFormule('Totaal inkomen', `=SUM(B${inkStart}:B${inkEnd})`, totInk, undefined, undefined, { bold: true })

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
  for (let i = 0; i < 2; i++) zetFormule('', maandFormuleLeeg(rij), 0, '', undefined)
  const lastEnd = rij - 1
  const totLast = lastWaarden.reduce((a, b) => a + b, 0)
  zetFormule('Totaal uitgaven', `=SUM(B${lastStart}:B${lastEnd})`, totLast, undefined, undefined, { bold: true })

  rij++ // lege rij
  const totInkRij = inkEnd + 1
  const totLastRij = lastEnd + 1
  const saldoRij = rij
  zetFormule('SALDO (inkomen − uitgaven)', `=B${totInkRij}-B${totLastRij}`, totInk - totLast, undefined, undefined, { bold: true })
  const saldoCell = ws.getCell(saldoRij, 2)

  // Nummerformaat 2 decimalen op B (maandbedrag) en C (invoer)
  for (let r = 1; r <= saldoRij; r++) {
    ws.getCell(r, 2).numFmt = numFmt2
    ws.getCell(r, 3).numFmt = numFmt2
  }

  // SALDO: rood bij negatief budget (positief/ongebruikt blijft standaard zwart).
  // Voorwaardelijk nummerformaat — ExcelJS schrijft dit correct weg. Volgt
  // automatisch als de inwoner bedragen of periodes wijzigt.
  saldoCell.numFmt = '#,##0.00;[Red]-#,##0.00'

  // Uitklapbare groep: kolommen C (invoer) en D (periode) krijgen
  // outlineLevel 1, zodat Excel de [-]/[+]-pijltjes toont om de detailkolommen
  // in/uit te klappen. Blijft standaard uitgeklapt (zichtbaar); de cliënt kan de
  // groep inklappen zodat alleen Post + Maandbedrag overblijft.
  ;[3, 4].forEach(c => { ws.getColumn(c).outlineLevel = 1 })

  // Automatische kolombreedte: elke kolom krijgt de breedte van de langste
  // inhoud (+ marge), zodat alles net leesbaar is. ExcelJS heeft geen echte
  // auto-fit, dus meten we de langste waarde per kolom en zetten die als breedte.
  const colMax: Record<number, number> = {}
  const meet = (c: number, v: unknown) => {
    let len = 0
    if (v == null) len = 0
    else if (typeof v === 'string') len = v.length
    else if (typeof v === 'number') len = String(v).length
    else if (v && typeof v === 'object' && 'result' in (v as any)) len = String((v as any).result).length
    else len = String(v).length
    if (len > (colMax[c] || 0)) colMax[c] = len
  }
  ws.eachRow(r => {
    r.eachCell({ includeEmpty: false }, cell => {
      meet(Number(cell.col), cell.value)
    })
  })
  for (const c of [1, 2, 3, 4]) {
    const max = colMax[c] || 10
    // Kolom A (Post) krijgt een ruime vloer zodat labels altijd leesbaar zijn;
    // de overige kolommen blijven binnen de 30-cap.
    const cap = c === 1 ? 50 : 30
    const floor = c === 1 ? 38 : 10
    ws.getColumn(c).width = Math.min(Math.max(max + 2, floor), cap)
  }

  // Bladbeveiliging: kolom B (de maandbedrag-formules) is vergrendeld, zodat de
  // cliënt hem niet per ongeluk kan overschrijven en de doorrekening breekt.
  // C (invoer) en D (periode) zijn ontgrendeld en blijven bewerkbaar. Zonder
  // wachtwoord: via "Blad beveiliging opheffen" is het alsnog vrij te geven.
  ws.protect('', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
    pivotTables: false,
  })

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
