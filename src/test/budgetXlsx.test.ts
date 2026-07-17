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
    let foutFormule = false
    let saldoFormule = ''
    let totaalInkFormule = ''
    let totaalLastFormule = ''

    for (let r = range.s.r; r <= range.e.r; r++) {
      const b = XLSX.utils.encode_cell({ r, c: 1 }) // B
      const cell = ws[b]
      if (cell && typeof cell.f === 'string') {
        // zelf-referentie: formule mag niet naar zijn eigen B-cel verwijzen
        if (cell.f.includes(`B${r + 1}`)) zelfRef = true
        // geen '@' (implicit intersection bug) en géén leading/trailing whitespace
        if (cell.f.includes('@') || cell.f !== cell.f.trim()) foutFormule = true
        const a = XLSX.utils.encode_cell({ r, c: 0 }) // A (post-naam)
        const naam = (ws[a] && ws[a].v) || ''
        if (/SALDO/i.test(String(naam))) saldoFormule = cell.f
        if (/Totaal inkomen/i.test(String(naam))) totaalInkFormule = cell.f
        if (/Totaal uitgaven/i.test(String(naam))) totaalLastFormule = cell.f
      }
    }

    expect(zelfRef).toBe(false)
    expect(foutFormule).toBe(false) // geen @ en geen whitespace in formules
    // Totaal inkomen sommeert de inkomsten (B5:B6)
    expect(totaalInkFormule).toMatch(/^SOM\(B5:B6\)$/)
    expect(totaalLastFormule).toMatch(/^SOM\(B10:B13\)$/)
    // Saldo = totaal inkomen − totaal uitgaven
    expect(saldoFormule).toMatch(/^B7-B14$/)
  })

  test('formule-cellen hebben een gecachte waarde (v) zodat Excel die direct toont', () => {
    const wb = bouwBudgetWerkboek(maakState(), XLSX)
    const ws = wb.Sheets['Budgetoverzicht']

    // Vind de B-cellen voor Werk (rij5), Totaal inkomen (rij7), Saldo (rij16)
    const lees = (rij: number) => ws[XLSX.utils.encode_cell({ r: rij - 1, c: 1 })]
    const werk = lees(5)
    const totInk = lees(7)
    const saldo = lees(16)

    // Elke formule-cel moet een numerieke gecachte waarde hebben (niet leeg)
    expect(typeof werk.v).toBe('number')
    expect(typeof totInk.v).toBe('number')
    expect(typeof saldo.v).toBe('number')

    // Verwachte waarden: Werk 1500*mnd=1500; Totaal ink 1500+100=1600;
    // Lasten: 800 + 120*10/12 + 100*4,333 + 385/12 = 1365,41; Saldo 1600-1365,41=234,59
    expect(werk.v).toBeCloseTo(1500, 1)
    expect(totInk.v).toBeCloseTo(1600, 1)
    expect(saldo.v).toBeCloseTo(234.59, 1)
  })

  test('schrijft werkboek naar bestand voor externe verificatie', () => {
    const wb = bouwBudgetWerkboek(maakState(), XLSX)
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    writeFileSync('./verify_budget.xlsx', Buffer.from(buf))
    expect(buf.byteLength).toBeGreaterThan(1000)
  })
})
