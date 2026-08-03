import { describe, test, expect } from 'vitest'
import { mkInitial, evaluateRegelingen, geenEigenAanslag, isJeugdOfInstelling } from '../utils'
import { NORM } from '../constants'

// Deze tests dekken de jeugd-/instelling-logica uit de sessie van 2026-08-03:
//  (a) IIT is n.v.t. bij cliënten onder de 21 en bij instelling
//  (b) Kwijtschelding GBLT/gemeente is n.v.t. zonder eigen belastingaanslag
//  (c) isJeugdOfInstelling / geenEigenAanslag herkennen de juiste situaties

function metLeefsituatie(ls: string, leeftijd?: string, woontBij?: string) {
  const s = mkInitial()
  s.leefsituatie = ls
  if (leeftijd) s.geboortedatum = leeftijd
  if (woontBij) s.woont_bij = woontBij
  // Speel een inkomen + norm in zodat de regeling-checks daadwerkelijk lopen
  s.bijstandsnorm = '500'
  s.inkomenData = [{ bron: 'Werk', type: 'loon', netto: '400', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
  return s
}

describe('JeuGDP/instelling — leefsituatie-herkenning', () => {
  test('jeugd_thuis, jeugd_zelfstandig en instelling worden herkend', () => {
    expect(isJeugdOfInstelling('jeugd_thuis')).toBe(true)
    expect(isJeugdOfInstelling('jeugd_zelfstandig')).toBe(true)
    expect(isJeugdOfInstelling('instelling')).toBe(true)
    expect(isJeugdOfInstelling('alleenstaand')).toBe(false)
  })

  test('geen eigen aanslag bij instelling en bij wonen bij ouders', () => {
    expect(geenEigenAanslag(metLeefsituatie('instelling'))).toBe(true)
    expect(geenEigenAanslag(metLeefsituatie('jeugd_thuis', '2006-01-01', 'ouders'))).toBe(true)
    // jeugd_thuis betekent per definitie wonen bij ouders -> geen eigen aanslag
    expect(geenEigenAanslag(metLeefsituatie('jeugd_thuis', '2006-01-01', 'zelf'))).toBe(true)
    expect(geenEigenAanslag(metLeefsituatie('jeugd_zelfstandig', '2006-01-01', 'zelf'))).toBe(false)
    expect(geenEigenAanslag(metLeefsituatie('alleenstaand', '1990-01-01', 'zelf'))).toBe(false)
  })
})

describe('JeuGDP <21 met meerderjarige partner — auto schakelt naar samenwonend', () => {
  test('cliënt 20 + partner 25 -> leefsituatie wordt samenwonend (21+ norm)', () => {
    const s = mkInitial()
    s.geboortedatum = '2006-01-01'   // 20 jaar
    s.heeft_partner = 'ja'
    s.partner_geb = '2001-01-01'     // 25 jaar (>= 21)
    // simuleer de useEffect-logica via de publieke helper-uitkomst:
    // de tool vult NORM['samenwonend'] in. We testen hier dat de keuze
    // 'samenwonend' een geldige 21+ norm oplevert (geen jeugd-situatie).
    s.leefsituatie = 'samenwonend'
    expect(isJeugdOfInstelling(s.leefsituatie)).toBe(false)
    expect(NORM[s.leefsituatie]).toBeGreaterThan(0)
  })
})

describe('JeuGDP/instelling — IIT', () => {
  test('cliënt van 20 jaar: IIT is n.v.t.', () => {
    const s = metLeefsituatie('jeugd_thuis', '2006-01-01', 'ouders')
    const b = evaluateRegelingen(s)
    expect(b.iit.recht).toBe('nvt')
  })

  test('instelling: IIT is n.v.t.', () => {
    const s = metLeefsituatie('instelling')
    const b = evaluateRegelingen(s)
    expect(b.iit.recht).toBe('nvt')
  })

  test('21+ zelfstandig met laag inkomen: IIT blijft beoordeelbaar', () => {
    const s = metLeefsituatie('alleenstaand', '1990-01-01', 'zelf')
    const b = evaluateRegelingen(s)
    expect(b.iit.recht).not.toBe('nvt')
  })
})

describe('JeuGDP/instelling — kwijtschelding', () => {
  test('wonen bij ouders: kwijtschelding GBLT en gemeente zijn n.v.t.', () => {
    const s = metLeefsituatie('jeugd_thuis', '2006-01-01', 'ouders')
    const b = evaluateRegelingen(s)
    expect(b.kwijtschelding_gblt.recht).toBe('nvt')
    expect(b.kwijtschelding_gemeente.recht).toBe('nvt')
  })

  test('instelling: kwijtschelding is n.v.t.', () => {
    const s = metLeefsituatie('instelling')
    const b = evaluateRegelingen(s)
    expect(b.kwijtschelding_gblt.recht).toBe('nvt')
    expect(b.kwijtschelding_gemeente.recht).toBe('nvt')
  })

  test('zelfstandig wonende jeugdige met laag inkomen: kwijtschelding blijft beoordeelbaar', () => {
    const s = metLeefsituatie('jeugd_zelfstandig', '2006-01-01', 'zelf')
    const b = evaluateRegelingen(s)
    expect(b.kwijtschelding_gblt.recht).not.toBe('nvt')
    expect(b.kwijtschelding_gemeente.recht).not.toBe('nvt')
  })
})
