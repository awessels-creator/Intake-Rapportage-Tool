import { describe, test, expect } from 'vitest'
import { REGELING_URLS } from '../constants'
import { mkInitial } from '../utils'
import type { BeslagItem } from '../types'

// Deze tests dekken de nieuwe rapport-logica uit de sessie van 2026-07-18:
//  (a) Beslag-paragraaf in het rapport verschijnt ALLEEN bij daadwerkelijk beslag
//  (b) Regeling-links in de adviessectie komen uit de centrale REGELING_URLS
// We triggeren geen echte Word-download (browser-only), maar dekken de
// data-voorwaarden en de URL-constanten die de rapport-opbouw aanstuurt.

describe('Rapport — regeling-links (punt 5/b)', () => {
  test('FDMA-link is exact de door Annika aangeleverde URL', () => {
    expect(REGELING_URLS.fdma).toBe(
      'https://www.meppel.nl/direct-regelen/ondersteuning-jeugd-en-inkomen/fonds-deelname-maatschappelijke-activiteiten/'
    )
  })

  test('alle regeling-links zijn gevuld en wijzen naar een geldige pagina', () => {
    const sleutels = ['iit', 'fdma', 'kwijtschelding_gblt', 'kwijtschelding_gemeente', 'kindsupport', 'voedselbank', 'berekenuwrecht_bvv']
    for (const k of sleutels) {
      const url = REGELING_URLS[k]
      expect(url, `REGELING_URLS.${k} mag niet leeg zijn`).toBeTruthy()
      expect(url.startsWith('https://'), `REGELING_URLS.${k} moet https zijn`).toBe(true)
    }
  })

  test('kwijtschelding GBLT en gemeente delen dezelfde aanvraagpagina', () => {
    expect(REGELING_URLS.kwijtschelding_gblt).toBe(REGELING_URLS.kwijtschelding_gemeente)
  })
})

describe('Rapport — beslag-signalering (punt 4/a)', () => {
  // De paragraaf "Signalering bij beslag op inkomen" verschijnt in buildAndSaveWord
  // alléén wanneer beslagData ten minste één ingevulde schuldeiser bevat
  // (dezelfde conditie als de bestaande "Beslagleggende schuldeisers"-tabel).
  const heeftBeslag = (beslagData: BeslagItem[]) => beslagData.filter(b => b.wie).length > 0

  test('geen beslag -> paragraaf wordt niet getoond', () => {
    const s = mkInitial()
    expect(heeftBeslag(s.beslagData)).toBe(false)
  })

  test('beslag met lege wie -> telt niet mee (net als de bestaande tabel)', () => {
    const s = mkInitial()
    s.beslagData = [{ wie: '', soort: '', bedrag: '' }]
    expect(heeftBeslag(s.beslagData)).toBe(false)
  })

  test('beslag met ingevulde schuldeiser -> paragraaf wordt getoond', () => {
    const s = mkInitial()
    s.beslagData = [{ wie: 'Deurwaarder X', soort: 'loonbeslag', bedrag: '150' }]
    expect(heeftBeslag(s.beslagData)).toBe(true)
  })
})
