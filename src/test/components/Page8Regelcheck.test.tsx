import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
import Page8Regelcheck from '../../components/pages/Page8Regelcheck'
import { renderWithState } from '../helpers'
import { mkInitial } from '../../utils'

describe('Page8Regelcheck — huurtoeslag houdt rekening met huurhoogte', () => {
  const basis = (huur: string) => {
    const s = mkInitial()
    s.eigen_woning = 'nee'
    s.bijstandsnorm = '1348'
    s.leefsituatie = 'alleenstaand'
    s.inkomenData = [{ bron: 'Werk', type: 'inkomen', netto: '1200', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
    s.lastenWaarden = { ...s.lastenWaarden, huur: { bedrag: huur, per: 'mnd', opm: '' } }
    s.toeslagenActief = { huur: true } as any
    return s
  }

  test('lage huur (<€30/mnd) → geen recht (Huur te laag)', () => {
    renderWithState(<Page8Regelcheck />, basis('15'))
    expect(screen.getByText(/Huur te laag/i)).toBeInTheDocument()
  })

  test('geen huur ingevuld → twijfel (niet blind "ja")', () => {
    renderWithState(<Page8Regelcheck />, basis('0'))
    expect(screen.getByText(/Huurbedrag niet ingevuld/i)).toBeInTheDocument()
  })

  test('realistische huur → onder grens-advies (geen "Huur te laag")', () => {
    renderWithState(<Page8Regelcheck />, basis('650'))
    expect(screen.queryByText(/Huur te laag/i)).not.toBeInTheDocument()
    expect(screen.getByText(/controleer Belastingdienst voor exacte hoogte/i)).toBeInTheDocument()
  })
})
