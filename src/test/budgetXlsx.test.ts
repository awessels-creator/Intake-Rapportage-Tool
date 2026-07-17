import { describe, test, expect } from 'vitest'
import { mkInitial } from '../utils'
import { bouwBudgetWerkboek } from '../budgetCsv'
import ExcelJS from 'exceljs'

describe('budget .xlsx export', () => {
  const maakState = () => {
    const s = mkInitial() as any
    s.voornaam = 'Jan'; s.achternaam = 'Jansen'
    s.inkomenData = [{ bron: 'Werk', type: 'inkomen', netto: '1500', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
    s.toeslagenActief = { zorgtoeslag: true }
    s.toeslagenBedrag = { zorgtoeslag: '100' }
    s.lastenWaarden = {
      leef: { bedrag: '100', per: 'week', opm: '' },
      huur: { bedrag: '800', per: 'mnd', opm: '' },
      eigenrisico: { bedrag: '385', per: 'jaar', opm: '' },
      gblt: { bedrag: '120', per: '10ter', opm: '' },
    }
    return s
  }

  test('genereert .xlsx met formules die naar D (invoer) verwijzen, geen zelf-ref, geen #NAAM', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!

    let zelfRef = false
    let foutFormule = false
    let saldoFormule = ''
    let totaalInkFormule = ''
    let totaalLastFormule = ''
    let saldoNumFmt = ''

    ws.eachRow((row: any, r: number) => {
      const b = row.getCell(2)
      if (b && b.type === ExcelJS.ValueType.Formula) {
        const f: string = b.formula.replace(/^=/, '')
        if (f.includes(`B${r}`)) zelfRef = true
        if (f.includes('@') || f !== f.trim()) foutFormule = true
        const a = row.getCell(1).value
        if (/SALDO/i.test(String(a))) { saldoFormule = f; saldoNumFmt = b.numFmt || '' }
        if (/Totaal inkomen/i.test(String(a))) totaalInkFormule = f
        if (/Totaal uitgaven/i.test(String(a))) totaalLastFormule = f
      }
    })

    expect(zelfRef).toBe(false)
    expect(foutFormule).toBe(false)
    expect(totaalInkFormule).toMatch(/^SUM\(B5:B6\)$/)
    expect(totaalLastFormule).toMatch(/^SUM\(B10:B13\)$/)
    expect(saldoFormule).toMatch(/^B7-B14$/)
    // Rood bij negatief budget (positief/ongebruikt blijft zwart)
    expect(saldoNumFmt).not.toContain('Green')
    expect(saldoNumFmt).toContain('Red')
  })

  test('formule-cellen hebben een gecachte waarde (result) zodat Excel die direct toont', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!

    const lees = (rij: number) => ws.getCell(rij, 2)
    const werk = lees(5)
    const totInk = lees(7)
    const saldo = lees(16)

    expect(typeof werk.result).toBe('number')
    expect(typeof totInk.result).toBe('number')
    expect(typeof saldo.result).toBe('number')

    expect(werk.result).toBeCloseTo(1500, 1)
    expect(totInk.result).toBeCloseTo(1600, 1)
    expect(saldo.result).toBeCloseTo(234.59, 1)
  })

  test('schrijft werkboek naar bestand voor externe verificatie', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const buf = await wb.xlsx.writeBuffer()
    expect(buf.byteLength).toBeGreaterThan(1000)
  })
})
