import type { FormState } from './types'
import { LASTEN_DEF, TOESLAG_NAMEN } from './constants'

// Genereert een BUDGETOVERZICHT als .xlsx bestand.
// Simpele aanpak: alle waarden worden BEREKEND en als getallen weggeschreven.
// GEEN formules = GEEN kringverwijzing = GEEN "bewerken inschakelen" nodig.
// Als de gebruiker een rij toevoegt, hoeft Excel niks te doen.

type WerkboekRij = {
  naam: string
  bedrag: number
  code: 'maand' | 'week' | 'kwartaal' | 'jaar' | '10-termijn'
}

// code -> factor (maand-multiplier) voor de JS-berekening van de waarde
function factorVanCode(code: string): number {
  switch (code) {
    case 'week': return 52 / 12
    case 'kwartaal': return 1 / 3
    case 'jaar': return 1 / 12
    case '10-termijn': return 10 / 12
    default: return 1
  }
}

function naarCode(per: string): 'maand' | 'week' | 'kwartaal' | 'jaar' | '10-termijn' {
  switch (per) {
    case 'week': return 'week'
    case 'kwt': return 'kwartaal'
    case 'jaar': return 'jaar'
    case '10ter': return '10-termijn'
    default: return 'maand'
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

  // Header
  ws.getCell(rij, 1).value = 'Budgetplan:'
  ws.getCell(rij, 1).font = { bold: true, size: 14 }
  rij += 2

  // INKOMSTEN
  ws.getCell(rij, 1).value = 'Inkomsten:'
  ws.getCell(rij, 1).font = { bold: true }
  ws.getCell(rij, 4).value = 'Netto:'
  ws.getCell(rij, 5).value = 'Vul in deze kolom het inkomen'
  ws.getCell(rij, 7).value = 'Periode'
  rij++

  // Inkomsten bronnen uit de tool
  const inkomsten: WerkboekRij[] = []
  state.inkomenData.forEach(d => {
    const bedrag = parseFloat(d.netto) || 0
    inkomsten.push({ naam: d.bron || 'Inkomstenbron', bedrag, code: naarCode(d.invoerPer || 'mnd') })
  })

  // Toeslagen uit de tool
  Object.entries(state.toeslagenActief).forEach(([id, actief]) => {
    if (actief) {
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

  // Bereken TOTAAL INKOMEN
  let totaalInkomen = 0
  inkomsten.forEach(r => {
    const mndBedrag = r.bedrag * factorVanCode(r.code)
    totaalInkomen += mndBedrag
  })

  // Toon inkomsten-rijen
  inkomsten.forEach(r => {
    ws.getCell(rij, 1).value = r.naam
    ws.getCell(rij, 4).value = r.bedrag
    ws.getCell(rij, 5).value = r.code
    rij++
  })

  // TOTAAL INKOMEN
  ws.getCell(rij, 1).value = 'TOTAAL INKOMEN:'
  ws.getCell(rij, 1).font = { bold: true }
  ws.getCell(rij, 4).value = totaalInkomen
  ws.getCell(rij, 4).font = { bold: true }
  rij += 3

  // OVERIGE TOESLagen (kinderbijslag etc.) — ZICHTBAAR maar TELLEN NIET MEE
  ws.getCell(rij, 1).value = 'Overige toeslagen (informatief, tellen niet mee voor inkomen):'
  ws.getCell(rij, 1).font = { bold: true, color: { argb: 'FF888888' } }
  rij++

  const extraToeslagen: WerkboekRij[] = []
  Object.entries(state.toeslagenActief).forEach(([id, actief]) => {
    if (actief && id === 'kinderbijslag') {
      const bedrag = parseFloat((state.toeslagenBedrag as Record<string, string>)[id] || '0') || 0
      extraToeslagen.push({ naam: TOESLAG_NAMEN[id] || id, bedrag, code: 'kwartaal' })
    }
  })

  if (extraToeslagen.length > 0) {
    extraToeslagen.forEach(r => {
      ws.getCell(rij, 1).value = r.naam
      ws.getCell(rij, 4).value = r.bedrag
      ws.getCell(rij, 5).value = r.code
      rij++
    })
  }
  rij += 2

  // UITGAVEN
  ws.getCell(rij, 1).value = 'Uitgaven:'
  ws.getCell(rij, 1).font = { bold: true }
  ws.getCell(rij, 5).value = 'Vul in deze kolom het bedrag van de vaste last'
  ws.getCell(rij, 7).value = 'periode'
  rij++

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

  // Bereken TOTAAL UITGAVEN
  let totaalUitgaven = 0
  lasten.forEach(r => {
    const mndBedrag = r.bedrag * factorVanCode(r.code)
    totaalUitgaven += mndBedrag
  })

  // Toon uitgaven-rijen
  lasten.forEach(r => {
    ws.getCell(rij, 1).value = r.naam
    ws.getCell(rij, 4).value = r.bedrag
    ws.getCell(rij, 5).value = r.code
    rij++
  })

  // TOTAAL UITGAVEN
  ws.getCell(rij, 1).value = 'TOTAAL UITGAVEN:'
  ws.getCell(rij, 1).font = { bold: true }
  ws.getCell(rij, 4).value = totaalUitgaven
  ws.getCell(rij, 4).font = { bold: true }
  rij += 2

  // SALDO
  const saldo = totaalInkomen - totaalUitgaven
  ws.getCell(rij, 1).value = 'TE BESTEDEN:'
  ws.getCell(rij, 1).font = { bold: true }
  ws.getCell(rij, 4).value = saldo
  ws.getCell(rij, 4).font = { bold: true, color: { argb: saldo < 0 ? 'FFFF0000' : 'FF000000' } }

  // Nummerformaat 2 decimalen op kolom D en E
  for (let r = 1; r <= rij; r++) {
    ws.getCell(r, 4).numFmt = '#,##0.00'
    ws.getCell(r, 5).numFmt = '#,##0.00'
  }

  // Automatische kolombreedte
  for (const c of [1, 4, 5, 7]) {
    let maxLen = 10
    for (let r = 1; r <= rij; r++) {
      const v = String(ws.getCell(r, c).value || '')
      if (v.length > maxLen) maxLen = v.length
    }
    ws.getColumn(c).width = Math.min(maxLen + 2, 50)
  }

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
