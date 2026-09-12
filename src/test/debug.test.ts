import { describe, test, expect } from 'vitest'
import { mkInitial } from '../utils'
import { bouwBudgetWerkboek } from '../budgetCsv'
import ExcelJS from 'exceljs'

describe('excel formules debug', () => {
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

  test('formules in bestand checken', async () => {
    const ExcelJS = (await import('exceljs')).default
    const wb = bouwBudgetWerkboek(maakState(), ExcelJS)
    const ws = wb.getWorksheet('Budgetoverzicht')!
    
    console.log('=== ALLE CELLEN ===')
    for (let r = 1; r <= ws.rowCount; r++) {
      const a = ws.getCell(r, 1).value
      const b = ws.getCell(r, 2)
      const c = ws.getCell(r, 3).value
      const d = ws.getCell(r, 4).value
      
      const bVal = b.type === ExcelJS.ValueType.Formula 
        ? `FORMULA: ${(b as any).formula}` 
        : `VALUE: ${JSON.stringify(b.value)}`
      
      console.log(`R${r}: A="${a}" | B=${bVal} | C=${c} | D=${d}`)
    }
    
    // Check calcProperties
    console.log('\n=== CALC PROPERTIES ===')
    console.log('wb.calcProperties:', JSON.stringify((wb as any).calcProperties))
  })
})
