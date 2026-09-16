import type { FormState } from './types'
import { LASTEN_DEF, TOESLAG_NAMEN } from './constants'

// Genereert een BUDGETOVERZICHT als .xlsx bestand met formules.
// Gebruikt Excel formules voor automatische berekeningen.

type WerkboekRij = {
  naam: string
  bedrag: number
  code: 'maand' | 'week' | '4 weken' | 'kwartaal' | 'jaar' | '10 maanden per jaar'
}

const PER_CODES = ['maand', 'week', '4 weken', 'kwartaal', 'jaar', '10 maanden per jaar']

function factorVanCode(code: string): number {
  switch (code) {
    case 'week': return 52 / 12
    case '4 weken': return 52 / 4 / 12
    case 'kwartaal': return 1 / 3
    case 'jaar': return 1 / 12
    case '10 maanden per jaar': return 10 / 12
    default: return 1
  }
}

function naarCode(per: string): WerkboekRij['code'] {
  switch (per) {
    case 'week': return 'week'
    case '4w': return '4 weken'
    case 'kwt': return 'kwartaal'
    case 'jaar': return 'jaar'
    case '10ter': return '10 maanden per jaar'
    default: return 'maand'
  }
}

// Formule: B = C * factor(periode)
function maandFormule(rij: number): string {
  return '=C' + rij + '*IF(D' + rij + '="week",52/12,IF(D' + rij + '="4 weken",52/4/12,IF(D' + rij + '="kwartaal",1/3,IF(D' + rij + '="jaar",1/12,IF(D' + rij + '="10 maanden per jaar",10/12,1)))))'
}

// Formule voor lege regels: "" als C leeg is
function legeFormule(rij: number): string {
  return '=IF(C' + rij + '="","",C' + rij + '*IF(D' + rij + '="week",52/12,IF(D' + rij + '="4 weken",52/4/12,IF(D' + rij + '="kwartaal",1/3,IF(D' + rij + '="jaar",1/12,IF(D' + rij + '="10 maanden per jaar",10/12,1))))))'
}

function beslagFormule(rij: number): string {
  return '=-C' + rij
}

function addPeriodeDropdown(ws: any, rij: number): void {
  ws.getCell(rij, 4).dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`"${PER_CODES.join(',')}"`],
    showErrorMessage: true,
    error: 'Kies een van: ' + PER_CODES.join(', '),
    showInputMessage: true,
    prompt: 'Kies de betaalperiode',
  }
}

// Bouwt het ExcelJS-workbook-object
export function bouwBudgetWerkboek(
  state: FormState,
  ExcelJS: typeof import('exceljs'),
): import('exceljs').Workbook {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Budgetoverzicht')
  
  let rij = 1

  // === HEADER ===
  ws.getCell(rij, 1).value = 'Budgetplan'
  ws.getCell(rij, 1).font = { bold: true, size: 16, color: { argb: 'FF2C3E50' } }
  ws.getCell(rij, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } }
  ws.getCell(rij, 1).border = { bottom: { style: 'medium', color: { argb: 'FF3498DB' } } }
  rij++
  
  ws.getCell(rij, 1).value = 'Omschrijving'
  ws.getCell(rij, 2).value = 'Maandbedrag'
  ws.getCell(rij, 3).value = 'Invoer (wijzig hier)'
  ws.getCell(rij, 4).value = 'Periode'
  
  for (let c = 1; c <= 4; c++) {
    ws.getCell(rij, c).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    ws.getCell(rij, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3498DB' } }
    ws.getCell(rij, c).border = { bottom: { style: 'thin', color: { argb: 'FF2980B9' } } }
  }
  rij++

  // === INKOMSTEN ===
  ws.getCell(rij, 1).value = 'Inkomsten:'
  ws.getCell(rij, 1).font = { bold: true, size: 12, color: { argb: 'FF27AE60' } }
  ws.getCell(rij, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F8F0' } }
  rij++

  const inkStart = rij

  // Inkomsten bronnen uit de tool
  const inkomsten: WerkboekRij[] = []
  state.inkomenData.forEach(d => {
    const bedrag = parseFloat(d.netto) || 0
    inkomsten.push({ naam: d.bron || 'Inkomstenbron', bedrag, code: naarCode(d.invoerPer || 'mnd') })
  })

  // Toeslagen uit de tool (behalve kinderbijslag - die gaat naar overige)
  Object.entries(state.toeslagenActief).forEach(([id, actief]) => {
    if (actief && id !== 'kinderbijslag') {
      const bedrag = parseFloat((state.toeslagenBedrag as Record<string, string>)[id] || '0') || 0
      inkomsten.push({ naam: TOESLAG_NAMEN[id] || id, bedrag, code: 'maand' })
    }
  })

  // Alimentatie
  if (state.alim_ontvangen === 'ja') {
    const ap = parseFloat(state.alim_partner) || 0
    if (ap > 0) inkomsten.push({ naam: 'Partneralimentatie', bedrag: ap, code: 'maand' })
    const ak = parseFloat(state.alim_kind) || 0
    if (ak > 0) inkomsten.push({ naam: 'Kinderalimentatie', bedrag: ak, code: 'maand' })
  }

  // Toon inkomsten-rijen
  inkomsten.forEach(r => {
    ws.getCell(rij, 1).value = r.naam
    ws.getCell(rij, 2).value = { formula: maandFormule(rij), result: r.bedrag * factorVanCode(r.code) }
    ws.getCell(rij, 3).value = r.bedrag
    ws.getCell(rij, 4).value = r.code
    addPeriodeDropdown(ws, rij)
    rij++
  })

  // Lege inkomsten-rijen
  for (let i = 0; i < 5; i++) {
    ws.getCell(rij, 2).value = { formula: legeFormule(rij) }
    addPeriodeDropdown(ws, rij)
    rij++
  }

  const inkEnd = rij - 1

  // TOTAAL INKOMEN
  ws.getCell(rij, 1).value = 'TOTAAL INKOMEN:'
  ws.getCell(rij, 1).font = { bold: true, color: { argb: 'FF27AE60' } }
  ws.getCell(rij, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5F5E3' } }
  ws.getCell(rij, 2).value = { formula: '=SUM(B' + inkStart + ':B' + inkEnd + ')' }
  ws.getCell(rij, 2).font = { bold: true, color: { argb: 'FF27AE60' } }
  ws.getCell(rij, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5F5E3' } }
  const totInkRij = rij
  rij += 2

  // === OVERIGE TOESLagen (kinderbijslag) ===
  ws.getCell(rij, 1).value = 'Overige toeslagen (informatief, tellen niet mee):'
  ws.getCell(rij, 1).font = { bold: true, size: 11, color: { argb: 'FF888888' } }
  ws.getCell(rij, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
  rij++
  
  // Kinderbijslag
  const kinderbijslagBedrag = state.toeslagenActief['kinderbijslag'] ? 
    parseFloat((state.toeslagenBedrag as Record<string, string>)['kinderbijslag'] || '0') || 0 : 0
  if (kinderbijslagBedrag > 0) {
    ws.getCell(rij, 1).value = 'Kinderbijslag'
    ws.getCell(rij, 2).value = { formula: '=C' + rij + '/3' }
    ws.getCell(rij, 3).value = kinderbijslagBedrag
    ws.getCell(rij, 4).value = 'kwartaal'
    addPeriodeDropdown(ws, rij)
    rij++
  }
  
  // Kindgebondenbudget (WÉL meegeteld dus hierboven bij inkomsten)
  // Maar als het niet bij inkomsten staat, hier tonen
  const kindgebondenBedrag = state.toeslagenActief['kindgebonden'] ? 
    parseFloat((state.toeslagenBedrag as Record<string, string>)['kindgebonden'] || '0') || 0 : 0
  if (kindgebondenBedrag > 0) {
    ws.getCell(rij, 1).value = 'Kindgebondenbudget'
    ws.getCell(rij, 2).value = { formula: '=C' + rij }
    ws.getCell(rij, 3).value = kindgebondenBedrag
    ws.getCell(rij, 4).value = 'maand'
    addPeriodeDropdown(ws, rij)
    rij++
  }
  rij++

  // === BESLAG ===
  // Beslag op inkomen uit de tool
  const beslagData = state.beslagData || []
  let beslagRij = -1
  beslagData.forEach(b => {
    const bedrag = parseFloat(b.bedrag) || 0
    if (bedrag > 0) {
      ws.getCell(rij, 1).value = 'Beslag: ' + (b.wie || 'Onbekend')
      ws.getCell(rij, 2).value = { formula: beslagFormule(rij) }
      ws.getCell(rij, 2).font = { color: { argb: 'FFE74C3C' } }
      ws.getCell(rij, 3).value = bedrag
      ws.getCell(rij, 4).value = 'maand'
      addPeriodeDropdown(ws, rij)
      beslagRij = rij
      rij++
    }
  })
  rij++

  // === UITGAVEN ===
  ws.getCell(rij, 1).value = 'Uitgaven:'
  ws.getCell(rij, 1).font = { bold: true, size: 12, color: { argb: 'FFE67E22' } }
  ws.getCell(rij, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF5E7' } }
  rij++

  const lastStart = rij

  const lasten: WerkboekRij[] = []
  LASTEN_DEF.forEach(def => {
    const w = state.lastenWaarden[def.id]
    const bedragStr = w && w.bedrag ? w.bedrag : ''
    if (!bedragStr) return
    const b = parseFloat(bedragStr) || 0
    lasten.push({ naam: def.post, bedrag: b, code: naarCode((w && w.per) || def.per) })
  })

  state.lastenExtra.forEach((e, i) => {
    const w = state.lastenWaarden[`extra_${i}`]
    const bedragStr = w && w.bedrag ? w.bedrag : ''
    if (!bedragStr) return
    const b = parseFloat(bedragStr) || 0
    lasten.push({ naam: e.post || 'Eigen post', bedrag: b, code: naarCode((w && w.per) || 'mnd') })
  })

  lasten.forEach(r => {
    ws.getCell(rij, 1).value = r.naam
    ws.getCell(rij, 2).value = { formula: maandFormule(rij), result: r.bedrag * factorVanCode(r.code) }
    ws.getCell(rij, 3).value = r.bedrag
    ws.getCell(rij, 4).value = r.code
    addPeriodeDropdown(ws, rij)
    rij++
  })

  for (let i = 0; i < 5; i++) {
    ws.getCell(rij, 2).value = { formula: legeFormule(rij) }
    addPeriodeDropdown(ws, rij)
    rij++
  }

  const lastEnd = rij - 1

  // TOTAAL UITGAVEN
  ws.getCell(rij, 1).value = 'TOTAAL UITGAVEN:'
  ws.getCell(rij, 1).font = { bold: true, color: { argb: 'FFE67E22' } }
  ws.getCell(rij, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDEBD0' } }
  ws.getCell(rij, 2).value = { formula: '=SUM(B' + lastStart + ':B' + lastEnd + ')' }
  ws.getCell(rij, 2).font = { bold: true, color: { argb: 'FFE67E22' } }
  ws.getCell(rij, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDEBD0' } }
  const totLastRij = rij
  rij += 2

  // === SALDO ===
  ws.getCell(rij, 1).value = 'TE BESTEDEN:'
  ws.getCell(rij, 1).font = { bold: true, size: 12 }
  ws.getCell(rij, 2).value = { formula: '=B' + totInkRij + (beslagRij > 0 ? '+B' + beslagRij : '') + '-B' + totLastRij }
  ws.getCell(rij, 2).font = { bold: true, size: 12 }
  ws.getCell(rij, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FFF4' } }
  ws.getCell(rij, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FFF4' } }
  ws.getCell(rij, 1).font.color = { argb: 'FF27AE60' }
  ws.getCell(rij, 2).font.color = { argb: 'FF27AE60' }
  rij += 2

  // === HELP SECTIE ===
  ws.getCell(rij, 1).value = '📖 Hoe voeg je een nieuwe rij toe?'
  ws.getCell(rij, 1).font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } }
  ws.getCell(rij, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF9E7' } }
  rij++

  ws.getCell(rij, 1).value = 'Optie 1 (simpel):'
  ws.getCell(rij, 1).font = { bold: true, color: { argb: 'FF3498DB' } }
  rij++
  ws.getCell(rij, 1).value = '1. Klik met de rechtermuisknop op een rij-nummer links'
  rij++
  ws.getCell(rij, 1).value = '2. Kies "Invoegen"'
  rij++
  ws.getCell(rij, 1).value = '3. Vul in kolom B (Maandbedrag) direct het maandbedrag in'
  rij++
  ws.getCell(rij, 1).value = '   (Bereken dit zelf: bijv. €500 per kwartaal = €500 ÷ 3 = €166,67 per maand)'
  rij++
  ws.getCell(rij, 1).value = ''
  rij++

  ws.getCell(rij, 1).value = 'Optie 2 (met automatische berekening):'
  ws.getCell(rij, 1).font = { bold: true, color: { argb: 'FF3498DB' } }
  rij++
  ws.getCell(rij, 1).value = '1. Klik met de rechtermuisknop op een rij-nummer links'
  rij++
  ws.getCell(rij, 1).value = '2. Kies "Invoegen"'
  rij++
  ws.getCell(rij, 1).value = '3. Kopieer deze formule en plak deze in kolom B:'
  rij++

  // Formule-vak (opvallend)
  ws.getCell(rij, 1).value = '=C??*ALS(D??="week",52/12,ALS(D??="4 weken",52/4/12,ALS(D??="kwartaal",1/3,ALS(D??="jaar",1/12,ALS(D??="10 maanden per jaar",10/12,1)))))'
  ws.getCell(rij, 1).font = { bold: true, size: 11, color: { argb: 'FF000000' } }
  ws.getCell(rij, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } }
  ws.getCell(rij, 1).border = { top: { style: 'thin', color: { argb: 'FFFFE082' } }, bottom: { style: 'thin', color: { argb: 'FFFFE082' } }, left: { style: 'thin', color: { argb: 'FFFFE082' } }, right: { style: 'thin', color: { argb: 'FFFFE082' } } }
  rij++

  ws.getCell(rij, 1).value = '4. Vervang de ?? door het rijnummer (bijv. 25 als het rij 25 is)'
  rij++
  ws.getCell(rij, 1).value = '5. Vul in kolom C het bedrag in'
  rij++
  ws.getCell(rij, 1).value = '6. Kies in kolom D de periode (maand, week, 4 weken, kwartaal, jaar of 10 maanden per jaar)'
  rij++
  ws.getCell(rij, 1).value = '7. Het maandbedrag in kolom B wordt nu automatisch berekend!'
  rij++
  ws.getCell(rij, 1).value = ''
  rij++

  ws.getCell(rij, 1).value = 'Voorbeeld:'
  ws.getCell(rij, 1).font = { italic: true, color: { argb: 'FF888888' } }
  rij++
  ws.getCell(rij, 1).value = 'Je ontvangt €600 per kwartaal. Je voegt rij 25 toe.'
  rij++
  ws.getCell(rij, 1).value = 'Formule in B25: =C25*ALS(D25="kwartaal",1/3,1)  →  B25 = €200 (automatisch)'
  rij++
  ws.getCell(rij, 1).value = 'In C25 vul je 600 in, in D25 kies je "kwartaal". Klaar!'
  rij++

  // === STYLING ===
  for (let r = 1; r <= rij; r++) {
    ws.getCell(r, 2).numFmt = '#,##0.00;-#,##0.00;'
    ws.getCell(r, 3).numFmt = '#,##0.00;-#,##0.00;'
  }

  ws.getColumn(1).width = 60
  ws.getColumn(2).width = 18
  ws.getColumn(3).width = 22
  ws.getColumn(4).width = 16

  wb.calcProperties = { fullCalcOnLoad: true }

  return wb
}

// Trigger een download van het .xlsx-bestand (client-side, geen opslag).
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
