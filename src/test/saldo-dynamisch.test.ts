import { describe, test, expect } from 'vitest'
import { mkInitial } from '../utils'
import { bouwBudgetWerkboek } from '../budgetCsv'
import ExcelJS from 'exceljs'

describe('saldo dynamisch', () => {
  const maakState = () => {
    const s = mkInitial() as any
    s.voornaam = 'Jan'; s.achternaam = 'Jansen'
    s.inkomenData = [
      { bron: 'Werk', type: 'inkomen', netto: '1200', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' },
    ]
    s.toeslagenActief = { zorgtoeslag: true }
    s.toeslagenBedrag = { zorgtoeslag: '100' }
    s.lastenWaarden = {
      huur: { bedrag: '800', per: 'mnd', opm: '' },
    }
    return s
  }

  test('saldo formule gebruikt Totaal inkomen en Totaal uitgaven cellen', async () => {
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!
    
    // Vind rijen
    let totInkRij = -1, totLastRij = -1, saldoRij = -1
    for (let r = 1; r <= ws.rowCount; r++) {
      const a = String(ws.getCell(r, 1).value || '')
      if (/Totaal inkomen/i.test(a)) totInkRij = r
      if (/Totaal uitgaven/i.test(a)) totLastRij = r
      if (/SALDO/i.test(a)) saldoRij = r
    }
    
    // Saldo formule moet verwijzen naar de totaal-rijen
    const saldoCell = ws.getCell(saldoRij, 2)
    const formula = (saldoCell as any).formula || ''
    
    console.log(`Totaal inkomen rij: ${totInkRij}`)
    console.log(`Totaal uitgaven rij: ${totLastRij}`)
    console.log(`Saldo rij: ${saldoRij}`)
    console.log(`Saldo formule: ${formula}`)
    
    expect(formula).toContain(`B${totInkRij}`)
    expect(formula).toContain(`B${totLastRij}`)
  })
})
