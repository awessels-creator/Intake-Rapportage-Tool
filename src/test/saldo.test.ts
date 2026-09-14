import { describe, test, expect } from 'vitest'
import { mkInitial } from '../utils'
import { bouwBudgetWerkboek } from '../budgetCsv'
import ExcelJS from 'exceljs'

describe('budget saldo doorrekenen', () => {
  const maakState = () => {
    const s = mkInitial() as any
    s.voornaam = 'Jan'; s.achternaam = 'Jansen'
    s.inkomenData = [
      { bron: 'Werk', type: 'inkomen', netto: '1500', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' },
    ]
    s.toeslagenActief = { zorgtoeslag: true, huurtoeslag: false, kindgebonden: false, kinderbijslag: false }
    s.toeslagenBedrag = { zorgtoeslag: '100', huurtoeslag: '0', kindgebonden: '0', kinderbijslag: '0' }
    s.lastenWaarden = {
      leef: { bedrag: '100', per: 'week', opm: '' },
      huur: { bedrag: '800', per: 'mnd', opm: '' },
      eigenrisico: { bedrag: '385', per: 'jaar', opm: '' },
    }
    return s
  }

  test('formule in B moet Excel Formula type zijn', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!
    
    // Vind een inkomstenrij (Werk)
    let werkRij = -1
    for (let r = 1; r <= ws.rowCount; r++) {
      if (String(ws.getCell(r, 1).value || '').includes('Werk')) {
        werkRij = r
        break
      }
    }
    
    const bCell = ws.getCell(werkRij, 2)
    
    // B moet een formule-cel zijn
    expect(bCell.type).toBe(ExcelJS.ValueType.Formula)
  })

  test('saldo (TE BESTEDEN) formule moet bestaan en wijzen naar totaal rijen', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!
    
    // Zoek naar TE BESTEDEN (niet SALDO)
    let saldoRij = -1
    for (let r = 1; r <= ws.rowCount; r++) {
      if (/TE BESTEDEN/i.test(String(ws.getCell(r, 1).value || ''))) {
        saldoRij = r
        break
      }
    }
    
    expect(saldoRij).toBeGreaterThan(-1)
    
    const bCell = ws.getCell(saldoRij, 2)
    expect(bCell.type).toBe(ExcelJS.ValueType.Formula)
    
    // Formule moet verwijzen naar B
    const formula = (bCell as any).formula || ''
    expect(formula).toContain('B')
  })

  test('formule wijst naar C en D', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!
    
    // Eerste formule-rij (header over slaan)
    let eersteFormuleRij = -1
    for (let r = 5; r <= ws.rowCount; r++) {
      const b = ws.getCell(r, 2)
      if (b.type === ExcelJS.ValueType.Formula) {
        eersteFormuleRij = r
        break
      }
    }
    
    const bCell = ws.getCell(eersteFormuleRij, 2)
    const formula = (bCell as any).formula || ''
    
    // Moet verwijzen naar C en D van dezelfde rij
    expect(formula).toContain(`C${eersteFormuleRij}`)
    expect(formula).toContain(`D${eersteFormuleRij}`)
    // Formule moet IF bevatten (niet IFERROR)
    expect(formula).toMatch(/IF\(/)
  })
})
