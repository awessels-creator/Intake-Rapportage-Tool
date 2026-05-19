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
  yearsSince,
} from '../utils'
import type { FormState } from '../types'

// Convenience helper: merge a partial state on top of a blank initial state
const s = (patch: Partial<FormState> = {}): FormState => ({ ...mkInitial(), ...patch })

// Reusable income item factory
const ink = (netto: string) => ({ bron: '', type: '', netto, uren: '', beslag: false })

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
})

// ─── getTotaalLasten ─────────────────────────────────────────────────────────

describe('getTotaalLasten', () => {
  test('returns 0 with no lasten values', () => {
    expect(getTotaalLasten(s())).toBe(0)
  })

  test('includes a monthly expense at face value', () => {
    expect(getTotaalLasten(s({ lastenWaarden: { huur: { bedrag: '800', per: 'mnd', opm: '' } } }))).toBeCloseTo(800)
  })

  test('converts weekly expense to monthly (×4.333)', () => {
    expect(getTotaalLasten(s({ lastenWaarden: { overig: { bedrag: '100', per: 'week', opm: '' } } }))).toBeCloseTo(433.3, 0)
  })

  test('converts quarterly expense to monthly (÷3)', () => {
    expect(getTotaalLasten(s({
      heeft_auto: 'ja',
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

  test('excludes auto-only rows when heeft_auto is not ja', () => {
    expect(getTotaalLasten(s({
      heeft_auto: 'nee',
      lastenWaarden: { autoverzek: { bedrag: '80', per: 'mnd', opm: '' } },
    }))).toBe(0)
  })

  test('includes auto-only rows when heeft_auto is ja', () => {
    expect(getTotaalLasten(s({
      heeft_auto: 'ja',
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

  // Verzekeringen
  test('shows AVP advice when tw_avp is nee', () => {
    expect(titles(s({ tw_avp: 'nee' }))).toContain('AVP aanvragen')
  })

  test('does not show AVP advice when tw_avp is ja', () => {
    expect(titles(s({ tw_avp: 'ja' }))).not.toContain('AVP aanvragen')
  })

  test('shows inboedelverzekering advice when tw_inboedel is nee', () => {
    expect(titles(s({ tw_inboedel: 'nee' }))).toContain('Inboedelverzekering aanvragen')
  })

  test('shows opstalverzekering advice when eigen_woning ja and tw_opstal nee', () => {
    expect(titles(s({ eigen_woning: 'ja', tw_opstal: 'nee' }))).toContain('Opstalverzekering afsluiten (koopwoning)')
  })

  test('does not show opstal when not a homeowner', () => {
    expect(titles(s({ eigen_woning: 'nee', tw_opstal: 'nee' }))).not.toContain('Opstalverzekering afsluiten (koopwoning)')
  })

  // Fallback
  test('returns single fallback item when no rules apply', () => {
    const items = buildSystemAdvItems(s())
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
    a.inkomenData.push({ bron: 'x', type: '', netto: '', uren: '', beslag: false })
    expect(b.inkomenData).toHaveLength(1)
  })
})

// ─── mkBeslag ────────────────────────────────────────────────────────────────

describe('mkBeslag', () => {
  test('returns a blank beslag item', () => {
    expect(mkBeslag()).toEqual({ wie: '', soort: '', bedrag: '' })
  })
})

// ─── yearsSince ──────────────────────────────────────────────────────────────

describe('yearsSince', () => {
  test('returns null if date is empty', () => {
    expect(yearsSince('')).toBeNull()
  })

  test('calculates correct years', () => {
    const now = new Date('2026-01-01').getTime()
    const past = '2023-01-01'
    expect(yearsSince(past, now)).toBeCloseTo(3, 1)
  })
})
