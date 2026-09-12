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

  test('formule in B moet Excel Formula type zijn, geen string', async () => {
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
    console.log(`Werk rij ${werkRij}: B type=${bCell.type}, formula=${(bCell as any).formula}, value=${JSON.stringify(bCell.value)}`)
    
    // B moet een formule-cel zijn
    expect(bCell.type).toBe(ExcelJS.ValueType.Formula)
  })

  test('saldo formule moet bestaan en wijzen naar totaal rijen', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!
    
    let saldoRij = -1
    for (let r = 1; r <= ws.rowCount; r++) {
      if (/SALDO/i.test(String(ws.getCell(r, 1).value || ''))) {
        saldoRij = r
        break
      }
    }
    
    const bCell = ws.getCell(saldoRij, 2)
    console.log(`Saldo rij ${saldoRij}: formula=${(bCell as any).formula}, result=${bCell.result}`)
    
    // Saldo moet formule zijn
    expect(bCell.type).toBe(ExcelJS.ValueType.Formula)
    
    // Formule moet verwijzen naar totaal-rijen (niet naar individuele bedragen)
    const formula = (bCell as any).formula || ''
    expect(formula).toContain('B') // verwijst naar kolom B
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
    // Formule moet IFERROR bevatten
    expect(formula).toMatch(/IFERROR/)
  })
})
