import { describe, test, expect } from 'vitest'
import { mkInitial } from '../utils'
import { bouwBudgetWerkboek } from '../budgetCsv'
import * as XLSX from 'xlsx'
import { writeFileSync } from 'fs'

describe('budget .xlsx export', () => {
  const maakState = () => {
    const s = mkInitial()
    s.voornaam = 'Jan'; s.achternaam = 'Jansen'
    s.inkomenData = [{ bron: 'Werk', type: 'inkomen', netto: '1500', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
    s.toeslagenActief = { zorgtoeslag: true } as any
    s.toeslagenBedrag = { zorgtoeslag: '100' } as any
    s.lastenWaarden = {
      leef: { bedrag: '100', per: 'week', opm: '' },
      huur: { bedrag: '800', per: 'mnd', opm: '' },
      eigenrisico: { bedrag: '385', per: 'jaar', opm: '' },
      gblt: { bedrag: '120', per: '10ter', opm: '' },
    }
    return s
  }

  test('genereert .xlsx met formules die naar D (invoer) verwijzen, geen zelf-ref', () => {
    const wb = bouwBudgetWerkboek(maakState(), XLSX)
    const ws = wb.Sheets['Budgetoverzicht']
    const range = XLSX.utils.decode_range(ws['!ref'] as string)

    // Verzamel alle formules in kolom B en controleer op zelf-referentie
    let zelfRef = false
    let saldoFormule = ''
    let totaalInkFormule = ''
    let totaalLastFormule = ''

    for (let r = range.s.r; r <= range.e.r; r++) {
      const b = XLSX.utils.encode_cell({ r, c: 1 }) // B
      const cell = ws[b]
      if (cell && typeof cell.f === 'string') {
        // zelf-referentie: formule mag niet naar zijn eigen B-cel verwijzen
        if (cell.f.includes(`B${r + 1}`)) zelfRef = true
        const a = XLSX.utils.encode_cell({ r, c: 0 }) // A (post-naam)
        const naam = (ws[a] && ws[a].v) || ''
        if (/SALDO/i.test(String(naam))) saldoFormule = cell.f
        if (/Totaal inkomen/i.test(String(naam))) totaalInkFormule = cell.f
        if (/Totaal uitgaven/i.test(String(naam))) totaalLastFormule = cell.f
      }
    }

    expect(zelfRef).toBe(false)
    // Totaal inkomen sommeert de inkomsten (B5:B6)
    expect(totaalInkFormule).toMatch(/^=SOM\(B5:B6\)$/)
    expect(totaalLastFormule).toMatch(/^=SOM\(B10:B13\)$/)
    // Saldo = totaal inkomen − totaal uitgaven
    expect(saldoFormule).toMatch(/^=B7-B14$/)
  })

  test('schrijft werkboek naar bestand voor externe verificatie', () => {
    const wb = bouwBudgetWerkboek(maakState(), XLSX)
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    writeFileSync('/tmp/verify_budget.xlsx', Buffer.from(buf))
    expect(buf.byteLength).toBeGreaterThan(1000)
  })
})
