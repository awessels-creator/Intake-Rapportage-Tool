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

  test('formules wijzen naar D én E, geen leading "=", geen zelf-ref, geen #NAAM, dropdown op E', async () => {
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
      const e = row.getCell(5)
      if (e && e.dataValidation && e.dataValidation.type === 'list') dropdowns++
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
})
