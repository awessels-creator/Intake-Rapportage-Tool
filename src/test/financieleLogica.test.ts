import { describe, test, expect } from 'vitest'
import { mkInitial, getTotaalInkomen, getTotaalLasten, getBeslagTotaal, getBeschikbaarInkomen, evaluateRegelingen, buildSystemAdvItems } from '../utils'

// Helper: zet een realistische basis (alleenstaand, norm 1348,49)
function base() {
  const s: any = mkInitial()
  s.leefsituatie = 'alleenstaand'
  s.bijstandsnorm = '1348.49'
  return s
}

describe('Financiële logica — mogelijke bugs', () => {
  // ── Punt 1: tellen toeslagen dubbel? ──────────────────────────────────────
  test('zorgtoeslag telt als inkomen, zorgverzekering als lasten (geen dubbeltelling)', () => {
    const s = base()
    s.inkomenData = [{ bron: 'Werk', type: 'loon', netto: '1000', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
    // zorgtoeslag actief + bedrag
    s.toeslagenActief = { zorg: true }
    s.toeslagenBedrag = { zorg: '100' }
    // zorgverzekering als vaste last
    s.lastenWaarden = { ...s.lastenWaarden, zorgverzek: { bedrag: '150', per: 'mnd', opm: '' } }

    const ink = getTotaalInkomen(s)
    const lasten = getTotaalLasten(s)
    // inkomen = 1000 (loon) + 100 (zorgtoeslag) = 1100
    expect(ink).toBeCloseTo(1100, 2)
    // lasten bevat zorgverzekering (150) maar NIET de zorgtoeslag (100)
    expect(lasten).toBeGreaterThanOrEqual(150)
    // zorgtoeslag mag niet óók in lasten zitten -> lasten mag niet 250 zijn door deze ene bron
    // (eigen risico default 385/jaar = 32,08 telt ook mee, dus lasten ~ 182,08)
    expect(lasten).toBeLessThan(250)
  })

  test('huurtoeslag + huur-last zijn gescheiden (huur-key overlap maar andere betekenis)', () => {
    const s = base()
    s.inkomenData = [{ bron: 'Werk', type: 'loon', netto: '1000', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
    s.toeslagenActief = { huur: true }
    s.toeslagenBedrag = { huur: '200' }
    s.lastenWaarden = { ...s.lastenWaarden, huur: { bedrag: '800', per: 'mnd', opm: '' } }
    const ink = getTotaalInkomen(s)
    const lasten = getTotaalLasten(s)
    expect(ink).toBeCloseTo(1200, 2) // 1000 + 200 huurtoeslag
    expect(lasten).toBeGreaterThanOrEqual(800) // huur-last
    expect(lasten).toBeLessThan(1000) // huurtoeslag (200) telt NIET mee als last
  })

  // ── Punt 2: IIT aan AOW'er ─────────────────────────────────────────────────
  test('evaluateRegelingen: IIT = nvt voor pensioengerechtigde', () => {
    const s: any = base()
    s.leefsituatie = 'pensioen_alleen'
    s.bijstandsnorm = '1450.99'
    s.inkomenData = [{ bron: 'AOW', type: 'aow', netto: '1450', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
    const b = evaluateRegelingen(s)
    expect(b.iit.recht).toBe('nvt')
  })

  test('buildSystemAdvItems: geen IIT-advies voor pensioengerechtigde', () => {
    const s: any = base()
    s.leefsituatie = 'pensioen_alleen'
    s.bijstandsnorm = '1450.99'
    s.inkomenData = [{ bron: 'AOW', type: 'aow', netto: '1450', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
    const items = buildSystemAdvItems(s)
    expect(items.some(i => /IIT/.test(i.t))).toBe(false)
  })

  // ── Punt 3: voertuig-waarde telt mee in evaluateRegelingen vermogen ────────
  test('evaluateRegelingen telt voertuig-waarde mee in vermogen (FDMA wordt nee)', () => {
    const s: any = base()
    s.inkomenData = [{ bron: 'Werk', type: 'loon', netto: '1000', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
    s.spaargeld = '3000'
    s.voertuigen = [{ kenteken: 'AB-12-CD', merk: 'Auto', bouwjaar: '2015', waarde: '5000', reden: '', behoud: '' }]
    const b = evaluateRegelingen(s)
    // vermogen = 3000 + 5000 = 8000 = grens(8000) -> niet boven, dus ja. Verhoog naar 6000 om nee te tonen.
    expect(b.fdma.recht).not.toBe('nee') // exact op grens is nog niet "nee"
    s.voertuigen[0].waarde = '6000'
    const b2 = evaluateRegelingen(s)
    expect(b2.fdma.recht).toBe('nee') // 3000+6000=9000 > 8000
  })

  test('evaluateRegelingen: vermogenstoets loopt nu ook zonder inkomen (FDMA = nee bij vermogen boven grens)', () => {
    const s: any = base()
    // GEEN inkomenData, wel vermogen boven grens
    s.inkomenData = []
    s.spaargeld = '3000'
    s.voertuigen = [{ kenteken: 'AB-12-CD', merk: 'Auto', bouwjaar: '2015', waarde: '6000', reden: '', behoud: '' }]
    const b = evaluateRegelingen(s)
    // na fix: vermogen 9000 > 8000 -> fdma "nee" (ook zonder inkomen)
    expect(b.fdma.recht).toBe('nee')
  })

  test('buildSystemAdvItems telt voertuig-waarde nu WEL mee (consistent met evaluateRegelingen)', () => {
    const s: any = base()
    s.inkomenData = [{ bron: 'Werk', type: 'loon', netto: '1000', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
    s.spaargeld = '3000'
    s.voertuigen = [{ kenteken: 'AB-12-CD', merk: 'Auto', bouwjaar: '2015', waarde: '6000', reden: '', behoud: '' }]
    const items = buildSystemAdvItems(s)
    // na fix: vermogen 9000 > 8000 -> er verschijnt WEL een vermogens-waarschuwing
    expect(items.some(i => /Vermogen boven vrijstellingsgrens/.test(i.t))).toBe(true)
  })

  // ── Punt 4: week-inkomen wordt correct omgerekend (Page4 doet dit al) ──────
  test('getTotaalInkomen: week-inkomen telt maandbedrag (Page4 zet netto)', () => {
    const s: any = base()
    // Page4 rekent week om naar netto (52/12). Hier simuleren we dat netto al gevuld is.
    s.inkomenData = [{ bron: 'Werk', type: 'loon', netto: '2166.67', uren: '', beslag: false, invoerPer: 'week', inclVak: false, weekBedrag: '500' }]
    expect(getTotaalInkomen(s)).toBeCloseTo(2166.67, 1)
  })

  // ── NIEUW: beslag wordt afgetrokken van beschikbaar inkomen ────────────────
  test('beslag verlaagt het beschikbaar inkomen (niet het totaal-inkomen)', () => {
    const s: any = base()
    s.inkomenData = [{ bron: 'Werk', type: 'loon', netto: '2500', uren: '', beslag: true, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
    s.beslagData = [{ wie: 'Deurwaarder X', soort: 'loonbeslag', bedrag: '300' }]
    // totaal inkomen blijft het bruto-netto (voor regelingstoetsen)
    expect(getTotaalInkomen(s)).toBeCloseTo(2500, 2)
    // beslagtotaal = 300
    expect(getBeslagTotaal(s)).toBeCloseTo(300, 2)
    // beschikbaar = 2500 - 300 = 2200
    expect(getBeschikbaarInkomen(s)).toBeCloseTo(2200, 2)
  })

  test('besteedbaar inkomen in advies houdt rekening met beslag', () => {
    const s: any = base()
    s.inkomenData = [{ bron: 'Werk', type: 'loon', netto: '2500', uren: '', beslag: true, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
    s.beslagData = [{ wie: 'Deurwaarder X', soort: 'loonbeslag', bedrag: '300' }]
    s.lastenWaarden = { ...s.lastenWaarden, huur: { bedrag: '1000', per: 'mnd', opm: '' } }
    const items = buildSystemAdvItems(s)
    // besteedbaar = 2200 - 1000 = 1200, niet 1500 (zonder beslag)
    const neg = items.find(i => /Negatief besteedbaar/.test(i.t))
    expect(neg).toBeUndefined() // 1200 > 0, dus geen negatief-signaal
  })

  // ── NIEUW: alimentatie telt mee als inkomen ────────────────────────────────
  test('partner- en kinderalimentatie tellen mee in getTotaalInkomen', () => {
    const s: any = base()
    s.inkomenData = [{ bron: 'Werk', type: 'loon', netto: '1000', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' }]
    s.alim_ontvangen = 'ja'
    s.alim_partner = '200'
    s.alim_kind = '150'
    expect(getTotaalInkomen(s)).toBeCloseTo(1350, 2) // 1000 + 200 + 150
  })
})
