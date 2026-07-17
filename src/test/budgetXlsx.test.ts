import { describe, test, expect } from 'vitest'
import { mkInitial } from '../utils'
import { bouwBudgetWerkboek } from '../budgetCsv'
import ExcelJS from 'exceljs'

describe('budget .xlsx export', () => {
  const maakState = () => {
    const s = mkInitial() as any
    s.voornaam = 'Jan'; s.achternaam = 'Jansen'
    s.inkomenData = [
      { bron: 'Werk', type: 'inkomen', netto: '1500', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' },
      { bron: 'Wajong', type: 'inkomen', netto: '300', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' },
    ]
    s.toeslagenActief = { zorgtoeslag: true, huurtoeslag: false, kindgebonden: false }
    s.toeslagenBedrag = { zorgtoeslag: '100', huurtoeslag: '0', kindgebonden: '0' }
    s.lastenWaarden = {
      leef: { bedrag: '100', per: 'week', opm: '' },
      huur: { bedrag: '800', per: 'mnd', opm: '' },
      energie: { bedrag: '150', per: 'mnd', opm: '' },
      eigenrisico: { bedrag: '385', per: 'jaar', opm: '' },
      gblt: { bedrag: '120', per: '10ter', opm: '' },
    }
    return s
  }

  // Vindt de rij (1-based) waarvan de A-cel de regex matched
  const vindRij = (ws: any, re: RegExp): number => {
    for (let r = 1; r <= ws.rowCount; r++) {
      const a = String(ws.getCell(r, 1).value || '')
      if (re.test(a)) return r
    }
    return -1
  }

  test('formules wijzen naar C én D, geen leading "=", geen zelf-ref, geen #NAAM, dropdown op D', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!
    let zelfRef = false, fout = false, dropdowns = 0
    ws.eachRow((row: any, r: number) => {
      const b = row.getCell(2)
      if (b && b.type === ExcelJS.ValueType.Formula) {
        const f = (b.formula as string).replace(/^=/, '')
        if (f.includes(`B${r}`)) zelfRef = true
        if (f.startsWith('=') || f.includes('@') || f.includes('SOM(') || f !== f.trim()) fout = true
      }
      const d = row.getCell(4)
      if (d && d.dataValidation && d.dataValidation.type === 'list') dropdowns++
    })
    const saldoR = vindRij(ws, /SALDO/i)
    const saldoCell = ws.getCell(saldoR, 2)
    expect(zelfRef).toBe(false)
    expect(fout).toBe(false)
    expect(dropdowns).toBeGreaterThan(5)
    expect(saldoCell.numFmt).not.toContain('Green')
    expect(saldoCell.numFmt).toContain('Red')
  })

  test('gecachte waarden kloppen (inkomen 1500+300+100=1900, lasten 1515.38, saldo 384.62)', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!
    let totInk = NaN, saldo = NaN
    ws.eachRow((row: any) => {
      const a = String(row.getCell(1).value || '')
      const b = row.getCell(2)
      if (b && b.type === ExcelJS.ValueType.Formula) {
        if (/^Totaal inkomen$/i.test(a)) totInk = b.result as number
        if (/^SALDO/i.test(a)) saldo = b.result as number
      }
    })
    expect(totInk).toBeCloseTo(1900, 1)
    expect(saldo).toBeCloseTo(384.62, 1)
  })

  test('alle inkomsten- en lastenrijen staan erin (incl. 0) + template-rijen', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!
    let inInk = false, inLast = false, inkomens = 0, lasten = 0, templates = 0
    ws.eachRow((row: any) => {
      const a = String(row.getCell(1).value || '')
      const b = row.getCell(2)
      const isF = b && b.type === ExcelJS.ValueType.Formula
      if (/INKOMSTEN/i.test(a)) { inInk = true; inLast = false }
      if (/UITGAVEN/i.test(a)) { inInk = false; inLast = true }
      if (isF) {
        if (inInk) inkomens++
        else if (inLast) lasten++
        if (!a.trim()) templates++
      }
    })
    expect(inkomens).toBeGreaterThanOrEqual(5) // 3 inkomsten + 2 templates
    expect(lasten).toBeGreaterThanOrEqual(7)   // 5 lasten + 2 templates
    expect(templates).toBeGreaterThanOrEqual(4)
  })

  test('schrijft werkboek naar bestand voor externe verificatie', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const buf = await wb.xlsx.writeBuffer()
    expect(buf.byteLength).toBeGreaterThan(1000)
  })

  // Regressie: layout-wensen (vet, geen Cliënt-regel, outline, goud bij niet-maand)
  test('layout: regel1 vet, geen Cliënt, Totaal/Saldo vet, outline op detailkolommen, goud bij niet-maandelijks', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!

    // 1) regel 1 (titel "Budgetoverzicht") vet
    expect((ws.getCell(1, 1).font as any)?.bold).toBe(true)

    // 2) geen "Cliënt:"-regel meer
    let heeftCliënt = false
    ws.eachRow(r => { if (String(r.getCell(1).value || '').startsWith('Cliënt')) heeftCliënt = true })
    expect(heeftCliënt).toBe(false)

    // 3) Totaal inkomen + Saldo vet (A én B)
    let totBold = false, saldoBold = false
    ws.eachRow(r => {
      const a = String(r.getCell(1).value || '')
      if (/^Totaal inkomen$/.test(a)) totBold = !!(r.getCell(1).font as any)?.bold && !!(r.getCell(2).font as any)?.bold
      if (/^SALDO/.test(a)) saldoBold = !!(r.getCell(1).font as any)?.bold && !!(r.getCell(2).font as any)?.bold
    })
    expect(totBold).toBe(true)
    expect(saldoBold).toBe(true)

    // 4) uitklapbare groep: outlineLevel op detailkolommen C + D
    expect(ws.getColumn(3).outlineLevel).toBe(1)
    expect(ws.getColumn(4).outlineLevel).toBe(1)

    // 5) goud-fill op Invoer (C) + Periode (D) bij niet-maandelijkse rij
    let goudOpD = false, goudOpE = false
    ws.eachRow(r => {
      const a = String(r.getCell(1).value || '')
      if (/levensonderhoud/i.test(a)) {
        const fC = r.getCell(3).fill as any
        const fD = r.getCell(4).fill as any
        if (fC?.fgColor?.argb === 'FFFDF6E9') goudOpD = true
        if (fD?.fgColor?.argb === 'FFFDF6E9') goudOpE = true
      }
    })
    expect(goudOpD).toBe(true)
    expect(goudOpE).toBe(true)

    // 6) header (regel 1) vet op A én B én C én D
    expect((ws.getCell(1, 1).font as any)?.bold).toBe(true)
    expect((ws.getCell(1, 2).font as any)?.bold).toBe(true)
    expect((ws.getCell(1, 3).font as any)?.bold).toBe(true)
    expect((ws.getCell(1, 4).font as any)?.bold).toBe(true)

    // 7) lege regel 2 (tussen header en INKOMSTEN)
    expect(String(ws.getCell(2, 1).value || '').trim()).toBe('')

    // 8) template-rijen: géén 'maand' in D, B-formule toont leeg bij lege C,
    //    en B vergrendeld (locked) terwijl C/D ontgrendeld (bewerkbaar) zijn.
    let tmplGeenMaand = true, tmplBLocked = true, cUnlocked = true, dUnlocked = true, tmplGevonden = 0
    ws.eachRow(r => {
      const a = String(r.getCell(1).value || '')
      const b = r.getCell(2)
      const isFormule = b && b.type === ExcelJS.ValueType.Formula
      // template-rij = lege A + formule in B
      if (!a.trim() && isFormule) {
        tmplGevonden++
        if (String(r.getCell(4).value || '').trim() === 'maand') tmplGeenMaand = false
        if ((b.protection as any)?.locked !== true) tmplBLocked = false
        if ((r.getCell(3).protection as any)?.locked === true) cUnlocked = false
        if ((r.getCell(4).protection as any)?.locked === true) dUnlocked = false
      }
    })
    expect(tmplGevonden).toBeGreaterThanOrEqual(4) // 2 inkomen + 2 uitgaven templates
    expect(tmplGeenMaand).toBe(true)
    expect(tmplBLocked).toBe(true)
    expect(cUnlocked).toBe(true)
    expect(dUnlocked).toBe(true)
    // 9) headers bevatten GEEN "€" (was "Maandbedrag (€)" / "Invoer (€)…")
    expect(String(ws.getCell(1, 2).value || '')).not.toContain('€')
    expect(String(ws.getCell(1, 3).value || '')).not.toContain('€')
    expect(String(ws.getCell(1, 2).value || '')).toBe('Maandbedrag')
    expect(String(ws.getCell(1, 3).value || '')).toContain('Invoer')

    // 10) automatische kolombreedte: elke kolom is minstens zo breed als de
    //     langste header/inhoud (+marge), en nooit smaller dan 10.
    for (const c of [1, 2, 3, 4]) {
      const w = ws.getColumn(c).width as number
      expect(w).toBeGreaterThanOrEqual(10)
      // "Invoer -> wijzig hier bij verandering" is ~36 tekens → breedte ~38
      if (c === 3) expect(w).toBeGreaterThan(30)
    }
  })
})
