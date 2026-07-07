import { describe, it, expect } from 'vitest'
import { evaluateRegelingen, mkInitial } from '../utils'
import type { FormState } from '../types'

function base(): FormState {
  const s = mkInitial()
  s.leefsituatie = 'alleenstaand'
  s.bijstandsnorm = '1348.49'
  s.inkomenData = [{ bron: 'werk', type: 'loon', netto: '1200', uren: '32u', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
  // vaste lasten: huur 600 -> besteedbaar = 1200-600 = 600
  s.lastenWaarden = { huur: { bedrag: '600', per: 'mnd', opm: '' } }
  return s
}

describe('evaluateRegelingen', () => {
  it('FDMA: recht op bij <110% norm en vermogen binnen grens', () => {
    const s = base() // 1200/1348 = 89% norm
    const b = evaluateRegelingen(s)
    expect(b.fdma.recht).toBe('ja')
  })

  it('FDMA: geen recht bij >110% norm', () => {
    const s = base()
    s.inkomenData[0].netto = '1600' // 1600/1348 = 119% -> >110
    const b = evaluateRegelingen(s)
    expect(b.fdma.recht).toBe('nee')
  })

  it('FDMA: geen recht bij vermogen boven grens', () => {
    const s = base()
    s.spaargeld = '9000' // grens alleenstaand = 8000
    const b = evaluateRegelingen(s)
    expect(b.fdma.recht).toBe('nee')
  })

  it('Kwijtschelding: recht op bij <120% norm', () => {
    const s = base() // 89%
    const b = evaluateRegelingen(s)
    expect(b.kwijtschelding_gblt.recht).toBe('ja')
  })

  it('Kwijtschelding: geen recht bij >=120% norm', () => {
    const s = base()
    s.inkomenData[0].netto = '1700' // 126%
    const b = evaluateRegelingen(s)
    expect(b.kwijtschelding_gblt.recht).toBe('nee')
  })

  it('IIT: nvt voor pensioengerechtigden', () => {
    const s = base()
    s.leefsituatie = 'pensioen_alleen'
    s.bijstandsnorm = '1450.99'
    const b = evaluateRegelingen(s)
    expect(b.iit.recht).toBe('nvt')
  })

  it('IIT: recht mogelijk bij <=105% norm (check op 3-jaars-termijn)', () => {
    const s = base() // 89%
    const b = evaluateRegelingen(s)
    expect(b.iit.recht).toBe('check')
  })

  it('Kindsupport: nvt zonder kinderen', () => {
    const s = base()
    const b = evaluateRegelingen(s)
    expect(b.kindsupport.recht).toBe('nvt')
  })

  it('Kindsupport: ja bij kinderen', () => {
    const s = base()
    s.kinderen = 'ja'
    const b = evaluateRegelingen(s)
    expect(b.kindsupport.recht).toBe('ja')
  })

  it('Voedselbank: recht op bij besteedbaar inkomen onder VB-norm', () => {
    const s = base() // besteedbaar 600 > 400 eenpers. -> geen
    s.inkomenData[0].netto = '900' // besteedbaar 300 < 400
    const b = evaluateRegelingen(s)
    expect(b.voedselbank.recht).toBe('ja')
  })

  it('Voedselbank: geen recht bij besteedbaar >= VB-norm', () => {
    const s = base() // besteedbaar 600 >= 400
    const b = evaluateRegelingen(s)
    expect(b.voedselbank.recht).toBe('nee')
  })

  it('Voedselbank: recht op bij negatief besteedbaar inkomen', () => {
    const s = base()
    s.inkomenData[0].netto = '500' // besteedbaar -100
    const b = evaluateRegelingen(s)
    expect(b.voedselbank.recht).toBe('ja')
  })
})
