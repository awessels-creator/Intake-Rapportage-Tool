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

  const vindRij = (ws: any, re: RegExp): number => {
    for (let r = 1; r <= ws.rowCount; r++) {
      const a = String(ws.getCell(r, 1).value || '')
      if (re.test(a)) return r
    }
    return -1
  }

  test('formules wijzen naar C én D, geen zelf-ref, geen #NAAM, dropdown op D', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!
    let zelfRef = false, fout = false, dropdowns = 0
    ws.eachRow((row: any, r: number) => {
      const b = row.getCell(2)
      if (b && b.type === ExcelJS.ValueType.Formula) {
        const f = (b.formula as string).replace(/^=/, '')
        if (f.includes(`B${r}`)) zelfRef = true
        if (f.startsWith('=') || f.includes('@') || f.includes('SOM(') || f.includes('ALS(') || f !== f.trim()) fout = true
      }
      const d = row.getCell(4)
      if (d && d.dataValidation && d.dataValidation.type === 'list') dropdowns++
    })
    expect(zelfRef).toBe(false)
    expect(fout).toBe(false)
    expect(dropdowns).toBeGreaterThan(5)
  })

  test('formule in B moet Excel Formula type zijn, geen string', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!
    
    let werkRij = -1
    for (let r = 1; r <= ws.rowCount; r++) {
      if (String(ws.getCell(r, 1).value || '').includes('Werk')) {
        werkRij = r
        break
      }
    }
    
    const bCell = ws.getCell(werkRij, 2)
    expect(bCell.type).toBe(ExcelJS.ValueType.Formula)
  })

  test('totaal inkomen formule is SUM', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!
    const totInkRij = vindRij(ws, /Totaal inkomen/i)
    const bCell = ws.getCell(totInkRij, 2)
    const formula = (bCell as any).formula || ''
    expect(formula).toContain('SUM')
  })
})
