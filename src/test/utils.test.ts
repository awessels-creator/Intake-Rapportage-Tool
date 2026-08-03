import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getMndBedrag,
  getTotaalInkomen,
  getTotaalLasten,
  getPct,
  buildSystemAdvItems,
  lftd,
  lftdN,
  updArr,
  rmArr,
  mkInitial,
  mkBeslag,
  buildQuickText,
  QUICK_SECTIONS,
} from '../utils'
import { NORM } from '../constants'
import type { FormState } from '../types'

// Convenience helper: merge a partial state on top of a blank initial state
const s = (patch: Partial<FormState> = {}): FormState => ({ ...mkInitial(), ...patch })

// Reusable income item factory
const ink = (netto: string) => ({ bron: '', type: '', netto, uren: '', beslag: false, invoerPer: 'mnd' as const, inclVak: false, weekBedrag: '' })

// ─── NORM (issue #13) ────────────────────────────────────────────────────────

describe('NORM', () => {
  test('alleenstaand is 1348.49 (excl. vakantietoeslag)', () => {
    expect(NORM['alleenstaand']).toBeCloseTo(1348.49, 2)
  })

  test('samenwonend is 1926.40 (excl. vakantietoeslag)', () => {
    expect(NORM['samenwonend']).toBeCloseTo(1926.40, 2)
  })

  test('pensioen_alleen is 1450.99 (excl. vakantietoeslag)', () => {
    expect(NORM['pensioen_alleen']).toBeCloseTo(1450.99, 2)
  })

  test('pensioen_paar is 2071.51 (excl. vakantietoeslag)', () => {
    expect(NORM['pensioen_paar']).toBeCloseTo(2071.51, 2)
  })
})

// ─── getMndBedrag ────────────────────────────────────────────────────────────

describe('getMndBedrag', () => {
  test.each([
    ['100',  'mnd',   100],
    ['100',  'week',  433.3],   // 100 × 4.333
    ['300',  'kwt',   100],     // 300 × (1/3)
    ['1200', 'jaar',  100],     // 1200 × (1/12)
    ['120',  '10ter', 100],     // 120 × (10/12)
    ['0',    'mnd',   0],
    ['',     'mnd',   0],
    ['abc',  'mnd',   0],
  ])('bedrag=%s per=%s → %s/mnd', (bedrag, per, expected) => {
    expect(getMndBedrag(bedrag, per)).toBeCloseTo(expected, 1)
  })
})

// ─── getTotaalInkomen ────────────────────────────────────────────────────────

describe('getTotaalInkomen', () => {
  test('returns 0 with blank initial state', () => {
    expect(getTotaalInkomen(s())).toBe(0)
  })

  test('sums a single income source', () => {
    expect(getTotaalInkomen(s({ inkomenData: [ink('1500')] }))).toBe(1500)
  })

  test('sums multiple income sources', () => {
    expect(getTotaalInkomen(s({ inkomenData: [ink('1000'), ink('500')] }))).toBe(1500)
  })

  test('includes partner + child alimony when alim_ontvangen is ja', () => {
    const result = getTotaalInkomen(s({
      inkomenData: [ink('1000')],
      alim_ontvangen: 'ja',
      alim_partner: '200',
      alim_kind: '150',
    }))
    expect(result).toBe(1350)
  })

  test('excludes alimony when alim_ontvangen is nee', () => {
    const result = getTotaalInkomen(s({
      inkomenData: [ink('1000')],
      alim_ontvangen: 'nee',
      alim_partner: '200',
      alim_kind: '150',
    }))
    expect(result).toBe(1000)
  })

  test('treats empty netto string as 0', () => {
    expect(getTotaalInkomen(s({ inkomenData: [ink('')] }))).toBe(0)
  })

  test('treats non-numeric netto as 0', () => {
    expect(getTotaalInkomen(s({ inkomenData: [ink('onbekend')] }))).toBe(0)
  })

  // Issue #9: toeslagen meetellen als inkomen (excl. kinderbijslag)
  test('includes active toeslagen (excl. kinderbijslag) in total', () => {
    const result = getTotaalInkomen(s({
      inkomenData: [ink('1400')],
      toeslagenActief: { zorg: true, huur: true, kinderbijslag: true },
      toeslagenBedrag: { zorg: '120', huur: '300', kinderbijslag: '260' },
    }))
    // 1400 + 120 + 300 = 1820 (kinderbijslag 260 excluded)
    expect(result).toBeCloseTo(1820)
  })

  test('excludes kinderbijslag from total', () => {
    const result = getTotaalInkomen(s({
      toeslagenActief: { kinderbijslag: true },
      toeslagenBedrag: { kinderbijslag: '260' },
    }))
    expect(result).toBe(0)
  })

  test('does not include inactive toeslagen', () => {
    const result = getTotaalInkomen(s({
      inkomenData: [ink('1000')],
      toeslagenActief: { zorg: false },
      toeslagenBedrag: { zorg: '120' },
    }))
    expect(result).toBe(1000)
  })
})

// ─── getTotaalLasten ─────────────────────────────────────────────────────────

describe('getTotaalLasten', () => {
  test('fresh mkInitial: eigen risico is vooringevuld (jaar → maand)', () => {
    // mkInitial seedt eigen risico (EIGEN_RISICO_JAAR per jaar) als reservering
    expect(getTotaalLasten(s())).toBeCloseTo(385 / 12, 2)
  })

  test('returns only the eigen-risico seed when no other lasten are filled', () => {
    expect(getTotaalLasten(s({ lastenWaarden: { eigenrisico: { bedrag: '', per: 'jaar', opm: '' } } }))).toBe(0)
  })

  test('includes a monthly expense at face value', () => {
    expect(getTotaalLasten(s({ lastenWaarden: { huur: { bedrag: '800', per: 'mnd', opm: '' } } }))).toBeCloseTo(800)
  })

  test('converts weekly expense to monthly (×4.333)', () => {
    expect(getTotaalLasten(s({ lastenWaarden: { overig: { bedrag: '100', per: 'week', opm: '' } } }))).toBeCloseTo(433.3, 0)
  })

  test('converts quarterly expense to monthly (÷3)', () => {
    expect(getTotaalLasten(s({
      voertuigen: [{ kenteken: 'AB-12-CD', merk: 'Opel', bouwjaar: '2015', waarde: '5000', reden: 'werk', behoud: 'behoud' }],
      lastenWaarden: { wegenb: { bedrag: '300', per: 'kwt', opm: '' } },
    }))).toBeCloseTo(100)
  })

  test('converts yearly expense to monthly (÷12)', () => {
    expect(getTotaalLasten(s({ lastenWaarden: { overig: { bedrag: '1200', per: 'jaar', opm: '' } } }))).toBeCloseTo(100)
  })

  test('sums multiple expense rows', () => {
    expect(getTotaalLasten(s({
      lastenWaarden: {
        huur:    { bedrag: '800', per: 'mnd', opm: '' },
        energie: { bedrag: '150', per: 'mnd', opm: '' },
      },
    }))).toBeCloseTo(950)
  })

  test('excludes auto-only rows when no voertuig filled in', () => {
    expect(getTotaalLasten(s({
      voertuigen: [{ kenteken: '', merk: '', bouwjaar: '', waarde: '', reden: '', behoud: '' }],
      lastenWaarden: { autoverzek: { bedrag: '80', per: 'mnd', opm: '' } },
    }))).toBe(0)
  })

  test('includes auto-only rows when a voertuig with waarde is present', () => {
    expect(getTotaalLasten(s({
      voertuigen: [{ kenteken: 'AB-12-CD', merk: 'Opel', bouwjaar: '2015', waarde: '5000', reden: 'werk', behoud: 'behoid' }],
      lastenWaarden: { autoverzek: { bedrag: '80', per: 'mnd', opm: '' } },
    }))).toBeCloseTo(80)
  })

  test('excludes kinderOnly rows when kinderen is not ja', () => {
    expect(getTotaalLasten(s({
      kinderen: 'nee',
      lastenWaarden: { ko: { bedrag: '200', per: 'mnd', opm: '' } },
    }))).toBe(0)
  })

  test('includes kinderOnly rows when kinderen is ja', () => {
    expect(getTotaalLasten(s({
      kinderen: 'ja',
      lastenWaarden: { ko: { bedrag: '200', per: 'mnd', opm: '' } },
    }))).toBeCloseTo(200)
  })

  test('includes a lastenExtra row when its value is set', () => {
    expect(getTotaalLasten(s({
      lastenExtra: [{ post: 'Sport', per: 'mnd' }],
      lastenWaarden: { extra_0: { bedrag: '50', per: 'mnd', opm: '' } },
    }))).toBeCloseTo(50)
  })

  test('skips rows with empty bedrag', () => {
    expect(getTotaalLasten(s({ lastenWaarden: { huur: { bedrag: '', per: 'mnd', opm: '' } } }))).toBe(0)
  })
})

// ─── getPct ──────────────────────────────────────────────────────────────────

describe('getPct', () => {
  test('returns 0 when bijstandsnorm is empty', () => {
    expect(getPct(s({ inkomenData: [ink('1000')], bijstandsnorm: '' }))).toBe(0)
  })

  test('returns 0 when income is 0', () => {
    expect(getPct(s({ bijstandsnorm: '1000' }))).toBe(0)
  })

  test('returns 100 when income equals norm', () => {
    expect(getPct(s({ bijstandsnorm: '1000', inkomenData: [ink('1000')] }))).toBeCloseTo(100)
  })

  test('returns 50 when income is half the norm', () => {
    expect(getPct(s({ bijstandsnorm: '2000', inkomenData: [ink('1000')] }))).toBeCloseTo(50)
  })

  test('returns >100 when income exceeds norm', () => {
    expect(getPct(s({ bijstandsnorm: '1000', inkomenData: [ink('1200')] }))).toBeCloseTo(120)
  })
})

// ─── buildSystemAdvItems ─────────────────────────────────────────────────────

describe('buildSystemAdvItems', () => {
  // Helper that builds a state with a specific income/norm ratio
  const withIncome = (inkomen: number, norm: number, extra: Partial<FormState> = {}) =>
    s({ bijstandsnorm: String(norm), inkomenData: [ink(String(inkomen))], ...extra })

  const titles = (state: FormState) => buildSystemAdvItems(state).map(i => i.t)

  // Income thresholds
  test('shows bijstand advice when income < 100% of norm', () => {
    expect(titles(withIncome(900, 1000))).toContain('Aanvullende bijstand / AIO aanvragen')
  })

  test('bijstand advice is marked urgent', () => {
    const item = buildSystemAdvItems(withIncome(900, 1000)).find(i => i.t.includes('bijstand'))
    expect(item?.p).toBe('urg')
  })

  test('does not show bijstand advice when income >= 100% norm', () => {
    expect(titles(withIncome(1000, 1000))).not.toContain('Aanvullende bijstand / AIO aanvragen')
  })

  test('shows IIT advice when income is between 100% and 105% of norm', () => {
    expect(titles(withIncome(1020, 1000))).toContain('IIT — tijdsduur controleren')
  })

  test('does not show IIT advice when income >= 105% of norm', () => {
    expect(titles(withIncome(1060, 1000))).not.toContain('IIT — tijdsduur controleren')
  })

  test('does NOT show IIT advice for a youth client (<21) even at 100-105% norm', () => {
    // Jeugdige van 16 jaar met inkomen op bijstandsniveau: IIT is wettelijk niet van toepassing
    expect(titles(withIncome(1020, 1000, { geboortedatum: '2010-01-01' }))).not.toContain('IIT — tijdsduur controleren')
  })

  test('shows FDMA advice when income < 110% norm', () => {
    expect(titles(withIncome(1050, 1000))).toContain('FDMA aanvragen bij gemeente Meppel')
  })

  test('does not show FDMA when income >= 110% norm', () => {
    expect(titles(withIncome(1150, 1000))).not.toContain('FDMA aanvragen bij gemeente Meppel')
  })

  test('shows kwijtschelding advice when income < 120% norm', () => {
    expect(titles(withIncome(1100, 1000))).toContain('Kwijtschelding GBLT + gemeentelijke belastingen')
  })

  test('does not show kwijtschelding when income >= 120% norm', () => {
    expect(titles(withIncome(1300, 1000))).not.toContain('Kwijtschelding GBLT + gemeentelijke belastingen')
  })

  // Children
  test('shows Kindsupport advice when kinderen is ja', () => {
    expect(titles(withIncome(1000, 1000, { kinderen: 'ja' }))).toContain('Kindsupport Meppel — bespreken en vastleggen')
  })

  test('does not show Kindsupport when kinderen is not ja', () => {
    expect(titles(withIncome(1000, 1000, { kinderen: 'nee' }))).not.toContain('Kindsupport Meppel — bespreken en vastleggen')
  })

  test('shows KOT check when kinderen ja and kinderopvang toeslag not active', () => {
    expect(titles(withIncome(1000, 1000, { kinderen: 'ja', toeslagenActief: {} }))).toContain('Kinderopvangtoeslag controleren')
  })

  test('hides KOT check when kinderopvang toeslag is active', () => {
    expect(titles(withIncome(1000, 1000, { kinderen: 'ja', toeslagenActief: { kinderopvang: true } }))).not.toContain('Kinderopvangtoeslag controleren')
  })

  // Vermogen
  test('shows vermogen alert when spaargeld exceeds vrijstellingsgrens for alleenstaand (€8000)', () => {
    expect(titles(s({ spaargeld: '9000', leefsituatie: 'alleenstaand' }))).toContain('Vermogen boven vrijstellingsgrens')
  })

  test('does not show vermogen alert when spaargeld is within grens', () => {
    expect(titles(s({ spaargeld: '5000', leefsituatie: 'alleenstaand' }))).not.toContain('Vermogen boven vrijstellingsgrens')
  })

  test('uses higher grens (€16000) for samenwonend', () => {
    expect(titles(s({ spaargeld: '12000', leefsituatie: 'samenwonend' }))).not.toContain('Vermogen boven vrijstellingsgrens')
    expect(titles(s({ spaargeld: '17000', leefsituatie: 'samenwonend' }))).toContain('Vermogen boven vrijstellingsgrens')
  })

  // Negatief besteedbaar inkomen
  test('shows negatief besteedbaar when lasten exceed income', () => {
    const state = s({
      bijstandsnorm: '1000',
      inkomenData: [ink('500')],
      lastenWaarden: { huur: { bedrag: '700', per: 'mnd', opm: '' } },
    })
    expect(titles(state)).toContain('URGENT: Negatief besteedbaar inkomen')
  })

  test('shows voedselbank advice when besteedbaar is negative', () => {
    const state = s({
      bijstandsnorm: '1000',
      inkomenData: [ink('500')],
      lastenWaarden: { huur: { bedrag: '700', per: 'mnd', opm: '' } },
    })
    expect(titles(state)).toContain('Voedselbank Meppel — aanmelding bespreken')
  })

  test('does not show negatief besteedbaar when income covers lasten', () => {
    const state = s({
      bijstandsnorm: '1000',
      inkomenData: [ink('1000')],
      lastenWaarden: { huur: { bedrag: '700', per: 'mnd', opm: '' } },
    })
    expect(titles(state)).not.toContain('URGENT: Negatief besteedbaar inkomen')
  })

  // Verzekeringen — nieuwe logica: leeg = advies, ja/nee = geen advies, aanvr = reminder
  test('shows AVP advice when tw_avp is empty', () => {
    expect(titles(s({ tw_avp: '' }))).toContain('AVP aanvragen')
  })

  test('does not show AVP advice when tw_avp is ja', () => {
    expect(titles(s({ tw_avp: 'ja' }))).not.toContain('AVP aanvragen')
  })

  test('does not show AVP advice when tw_avp is nee', () => {
    expect(titles(s({ tw_avp: 'nee' }))).not.toContain('AVP aanvragen')
  })

  test('shows AVP advice when tw_avp is aanvr', () => {
    expect(titles(s({ tw_avp: 'aanvr' }))).toContain('AVP aanvragen')
  })

  test('shows inboedelverzekering advice when tw_inboedel is empty', () => {
    expect(titles(s({ tw_inboedel: '' }))).toContain('Inboedelverzekering aanvragen')
  })

  test('does not show inboedel advice when tw_inboedel is ja', () => {
    expect(titles(s({ tw_inboedel: 'ja' }))).not.toContain('Inboedelverzekering aanvragen')
  })

  test('does not show inboedel advice when tw_inboedel is nee', () => {
    expect(titles(s({ tw_inboedel: 'nee' }))).not.toContain('Inboedelverzekering aanvragen')
  })

  test('shows inboedel advice when tw_inboedel is aanvr', () => {
    expect(titles(s({ tw_inboedel: 'aanvr' }))).toContain('Inboedelverzekering aanvragen')
  })

  test('shows opstalverzekering advice when eigen_woning ja and tw_opstal empty', () => {
    expect(titles(s({ eigen_woning: 'ja', tw_opstal: '' }))).toContain('Opstalverzekering afsluiten (koopwoning)')
  })

  test('does not show opstal advice when eigen_woning ja and tw_opstal nee', () => {
    expect(titles(s({ eigen_woning: 'ja', tw_opstal: 'nee' }))).not.toContain('Opstalverzekering afsluiten (koopwoning)')
  })

  test('shows opstal advice when eigen_woning ja and tw_opstal aanvr', () => {
    expect(titles(s({ eigen_woning: 'ja', tw_opstal: 'aanvr' }))).toContain('Opstalverzekering afsluiten')
  })

  test('does not show opstal when not a homeowner', () => {
    expect(titles(s({ eigen_woning: 'nee', tw_opstal: '' }))).not.toContain('Opstalverzekering afsluiten (koopwoning)')
  })

  // Uitvaartverzekering — nieuw: leeg = advies, ja/nee = geen advies, aanvr = advies-besproken
  test('shows uitvaartverzekering advice when tw_uitvaart is empty', () => {
    expect(titles(s({ tw_uitvaart: '' }))).toContain('Uitvaartverzekering bespreken')
  })

  test('does not show uitvaart advice when tw_uitvaart is ja', () => {
    expect(titles(s({ tw_uitvaart: 'ja' }))).not.toContain('Uitvaartverzekering bespreken')
  })

  test('does not show uitvaart advice when tw_uitvaart is nee', () => {
    expect(titles(s({ tw_uitvaart: 'nee' }))).not.toContain('Uitvaartverzekering bespreken')
  })

  test('shows uitvaart advice when tw_uitvaart is aanvr', () => {
    expect(titles(s({ tw_uitvaart: 'aanvr' }))).toContain('Uitvaartverzekering afsluiten')
  })

  // Fallback — verschijnt alleen als er werkelijk géén enkele regel een advies oplevert.
  // Bij een blanco intake leveren de lege verzekeringsvelden nu wél adviezen, dus vullen
  // we die op 'ja' (geen advies) om de fallback-conditie te testen.
  test('returns single fallback item when no rules apply', () => {
    const items = buildSystemAdvItems(s({ tw_avp: 'ja', tw_inboedel: 'ja', tw_uitvaart: 'ja', tw_opstal: 'ja' }))
    expect(items).toHaveLength(1)
    expect(items[0].t).toBe('Geen acute actiepunten')
  })

  test('fallback item is marked low priority', () => {
    expect(buildSystemAdvItems(s())[0].p).toBe('low')
  })

  // Item shape
  test('all generated items have on=true and custom=false', () => {
    const items = buildSystemAdvItems(withIncome(900, 1000))
    expect(items.every(i => i.on === true)).toBe(true)
    expect(items.every(i => i.custom === false)).toBe(true)
  })
})

// ─── lftdN ───────────────────────────────────────────────────────────────────

describe('lftdN', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('returns -1 for empty string', () => {
    expect(lftdN('')).toBe(-1)
  })

  test('returns correct age when birthday already passed this year', () => {
    // Born 1990-01-01, checking on 2026-01-15 → birthday passed → 36
    expect(lftdN('1990-01-01')).toBe(36)
  })

  test('returns one less when birthday has not yet passed this year', () => {
    // Born 1990-12-01, checking on 2026-01-15 → birthday not yet → 35
    expect(lftdN('1990-12-01')).toBe(35)
  })

  test('returns 0 for someone born today', () => {
    expect(lftdN('2026-01-15')).toBe(0)
  })
})

// ─── lftd ────────────────────────────────────────────────────────────────────

describe('lftd', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('returns em dash (—) for empty string', () => {
    expect(lftd('')).toBe('—')
  })

  test('returns formatted age with jr suffix', () => {
    expect(lftd('1990-01-01')).toBe('36 jr')
  })
})

// ─── updArr ──────────────────────────────────────────────────────────────────

describe('updArr', () => {
  test('updates the item at the given index', () => {
    expect(updArr([{ a: 1 }, { a: 2 }, { a: 3 }], 1, { a: 99 })).toEqual([{ a: 1 }, { a: 99 }, { a: 3 }])
  })

  test('merges partial patch, preserving other keys', () => {
    expect(updArr([{ a: 1, b: 'x' }], 0, { a: 2 })).toEqual([{ a: 2, b: 'x' }])
  })

  test('does not mutate the original array', () => {
    const arr = [{ a: 1 }]
    updArr(arr, 0, { a: 2 })
    expect(arr[0].a).toBe(1)
  })

  test('does not mutate the original item', () => {
    const item = { a: 1 }
    updArr([item], 0, { a: 2 })
    expect(item.a).toBe(1)
  })

  test('leaves other items untouched', () => {
    const arr = [{ a: 1 }, { a: 2 }]
    const result = updArr(arr, 0, { a: 99 })
    expect(result[1]).toEqual({ a: 2 })
  })
})

// ─── rmArr ───────────────────────────────────────────────────────────────────

describe('rmArr', () => {
  test('removes the item at the given index', () => {
    expect(rmArr(['a', 'b', 'c'], 1)).toEqual(['a', 'c'])
  })

  test('removes the first item', () => {
    expect(rmArr([1, 2, 3], 0)).toEqual([2, 3])
  })

  test('removes the last item', () => {
    expect(rmArr([1, 2, 3], 2)).toEqual([1, 2])
  })

  test('does not mutate the original array', () => {
    const arr = ['a', 'b']
    rmArr(arr, 0)
    expect(arr).toEqual(['a', 'b'])
  })
})

// ─── mkInitial ───────────────────────────────────────────────────────────────

describe('mkInitial', () => {
  test('starts on page 0', () => {
    expect(mkInitial().currentPage).toBe(0)
  })

  test('has one blank income source', () => {
    expect(mkInitial().inkomenData).toHaveLength(1)
    expect(mkInitial().inkomenData[0].netto).toBe('')
  })

  test('has one blank bank account', () => {
    expect(mkInitial().bankData).toHaveLength(1)
  })

  test('has one blank schuld', () => {
    expect(mkInitial().schuldenData).toHaveLength(1)
  })

  test('has no advItems', () => {
    expect(mkInitial().advItems).toHaveLength(0)
  })

  test('returns independent objects on each call (no shared references)', () => {
    const a = mkInitial()
    const b = mkInitial()
    a.inkomenData.push({ bron: 'x', type: '', netto: '', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' })
    expect(b.inkomenData).toHaveLength(1)
  })
})

// ─── mkBeslag ────────────────────────────────────────────────────────────────

describe('mkBeslag', () => {
  test('returns a blank beslag item', () => {
    expect(mkBeslag()).toEqual({ wie: '', soort: '', bedrag: '' })
  })
})

// ─── buildQuickText (snelvragenlijst, optie A) ──────────────────────────────

describe('buildQuickText', () => {
  test('zet aangevinkte checks om in rapportzinnen per sectie', () => {
    const state = s({
      quickChecks: { a_woon_huur: true, a_soc_vrienden: true, h_ink_wisselend: true },
    })
    const out = buildQuickText(state)
    expect(out.persoonlijk).toContain('Inwoner woont in een huurwoning.')
    expect(out.persoonlijk).toContain('Inwoner heeft een vrienden/kennissenkring.')
    expect(out.inkomen_toel).toContain('Het inkomen is wisselend of onregelmatig.')
  })

  test('aanspreektitel voornaam + geslacht man: eerste zin krijgt naam, rest "hij"', () => {
    const state = s({
      voornaam: 'Pietje', geslacht: 'man', aanspreektitel: 'voornaam',
      quickChecks: { a_woon_instelling: true, a_soc_sport: true, a_gez_goed: true, a_ov_justitie: true },
    })
    const out = buildQuickText(state)
    const pers = out.persoonlijk.join(' ')
    expect(pers).toContain('Pietje verblijft in een instelling of opvang')
    expect(pers).toContain('Hij heeft sociale of buitenshuis activiteiten')
    expect(pers).toContain('Hij heeft een justitieel verleden')
  })

  test('zonder aanspreektitel/geslacht blijft "Inwoner" (geen regressie)', () => {
    const state = s({ quickChecks: { a_woon_instelling: true, a_soc_sport: true } })
    const out = buildQuickText(state)
    expect(out.persoonlijk.join(' ')).toContain('Inwoner verblijft in een instelling of opvang')
    expect(out.persoonlijk.join(' ')).toContain('Inwoner heeft sociale of buitenshuis activiteiten')
  })

  test('aanspreektitel mevrouw + achternaam: "Mevrouw <naam>" als onderwerp', () => {
    const state = s({
      achternaam: 'Jansen', geslacht: 'vrouw', aanspreektitel: 'mevrouw',
      quickChecks: { a_woon_eigen: true, a_soc_sport: true },
    })
    const out = buildQuickText(state)
    const pers = out.persoonlijk.join(' ')
    expect(pers).toContain('Mevrouw Jansen woont in een eigen woning.')
    expect(pers).toContain('Zij heeft sociale of buitenshuis activiteiten')
  })

  test('geslacht vrouw + voornaam: "bij haar ouders" en vervolgzinnen met hoofdletter', () => {
    const state = s({
      voornaam: 'Pietje', geslacht: 'vrouw', aanspreektitel: 'voornaam',
      quickChecks: { a_woon_ouders: true, a_soc_vrienden: true, a_soc_sport: true, a_gez_mentaal: true },
    })
    const out = buildQuickText(state)
    const pers = out.persoonlijk.join(' ')
    expect(pers).toContain('Pietje woont nog bij haar ouders.')
    expect(pers).toContain('Zij heeft een vrienden/kennissenkring.')
    expect(pers).toContain('Zij heeft sociale of buitenshuis activiteiten')
    expect(pers).toContain('Er zijn mentale problemen.')
  })

  test('geslacht man + voornaam: "bij zijn ouders"', () => {
    const state = s({
      voornaam: 'Piet', geslacht: 'man', aanspreektitel: 'voornaam',
      quickChecks: { a_woon_ouders: true, a_soc_sport: true },
    })
    const out = buildQuickText(state)
    const pers = out.persoonlijk.join(' ')
    expect(pers).toContain('Piet woont nog bij zijn ouders.')
    expect(pers).toContain('Hij heeft sociale of buitenshuis activiteiten')
  })

  test('radio-keuzes komen als "label: waarde" in de zin', () => {
    const state = s({ quickRadio: { b_opl: 'havo', b_diploma: 'ja' } })
    const out = buildQuickText(state)
    expect(out.opleiding_toel).toContain('Opleidingsniveau: HAVO')
    expect(out.opleiding_toel).toContain('Diploma behaald: ja')
  })

  test('vrije tekst (opleidingsrichting) wordt overgenomen', () => {
    const state = s({ quickFree: { b_richting: 'sociaal werk' } })
    const out = buildQuickText(state)
    expect(out.opleiding_toel).toContain('Opleidingsrichting: sociaal werk')
  })

  test('lege snelvragenlijst geeft lege arrays per sectie', () => {
    const out = buildQuickText(s())
    for (const sec of QUICK_SECTIONS) {
      expect(out[sec.key]).toEqual([])
    }
  })

  test('ongevinkte items en ongekozen radio\'s verschijnen niet', () => {
    const state = s({ quickChecks: {}, quickRadio: {} })
    const out = buildQuickText(state)
    expect(out.persoonlijk.every(z => z.length > 0)).toBe(true)
    expect(out.opleiding_toel).toEqual([])
  })
})
