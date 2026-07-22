import type { FormState, AdviesItem, BankItem, InkomenItem, SchuldItem, BeslagItem, VoertuigItem } from './types'
import { LASTEN_DEF, PER_OPTIES, VGRENS, EIGEN_RISICO_JAAR } from './constants'

export const nl = (n: number, dec = 0) =>
  n.toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec })

export const today = () => new Date().toISOString().split('T')[0]

export const mkBank = (): BankItem => ({ iban: '', naam: '', type: 'betaal', saldo: '', rood: false, nieuw: '', opm: '' })
export const mkInk = (): InkomenItem => ({ bron: '', type: '', netto: '', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' })
export const mkSchuld = (): SchuldItem => ({ s: '', t: '', subt: '', b: '', afl: '', st: '' })
export const mkBeslag = (): BeslagItem => ({ wie: '', soort: '', bedrag: '' })
export const mkVoertuig = (): VoertuigItem => ({ kenteken: '', merk: '', bouwjaar: '', waarde: '', reden: '', behoud: '' })

export function yearsSince(date: string, now: number = Date.now()): number | null {
  if (!date) return null
  return (now - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
}

// BSN 11-proef: 9 cijfers, gewogen som (2,4,6,8,10,12,14,16,18) deelbaar door 11
export function bsn11Proef(bsn: string): boolean {
  const s = bsn.trim()
  if (!/^\d{9}$/.test(s)) return false
  const digits = s.split('').map(Number)
  const weights = [9, 8, 7, 6, 5, 4, 3, 2, -1]
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0)
  return sum % 11 === 0
}

// Voortgangs-indicator verwijderd (gebruiker zag geen meerwaarde)
export function mkInitial(): FormState {
  const d = today()
  return {
    currentPage: 0,
    clientnr: '', voornaam: '', achternaam: '', geboortedatum: '', bsn: '',
    burgstaat: '', nationaliteit: '', adres: '', woonplaats: '', telefoon: '',
    email: '', leefsituatie: '', datum_intake: d,
    heeft_partner: '', partner_vnaam: '', partner_anaam: '', partner_geb: '',
    partner_bsn: '', partner_reg: '', partner_niet_reden: '',
    kinderen: '', kinderenData: [],
    persoonlijk: '', opleiding_toel: '', flank: '', flank_inst: '', flank_naam: '',
    flank_contact: '', flank_aard: '',
    naam_consulent: '', crisis: '', cr_water: false, cr_energie: false,
    cr_ontruiming: false, cr_anders: false, crisis_toelichting: '', hulpvraag: '',
    eerder_aanvr: '', eerder_aanvr_toel: '',
    bankData: [mkBank()], bank_toelichting: '',
    ondernemer: '', kvk_naam: '', kvk_nr: '', kvk_datum: '', boekhouding: '',
    aangifte: '', kvk_toel: '',
    spaargeld: '', overig_verm: '', beleggingen: '', eigen_woning: 'nee',
    overwaarde: '', voertuigen: [mkVoertuig()],
    overigVermogenOms: '', overigVermogenBedrag: '',
    vermogen_toel: '', tw_avp: '', tw_inboedel: '', tw_opstal: '',
    tw_uitvaart: '', tw_zorgaanv: '', tw_wanbet: '',
    huisdieren: '', huisdieren_oms: '',
    bijstandsnorm: '', inkomenData: [mkInk()],
    alim_ontvangen: '', alim_partner: '', alim_kind: '', alim_lbio: '',
    iit: '', iit_datum: '', beslagData: [], inkomen_toel: '',
    toeslagenActief: {}, toeslagenBedrag: {}, toeslagenBeslag: {}, toeslagenNaam: {},
    lastenWaarden: { eigenrisico: { bedrag: String(EIGEN_RISICO_JAAR), per: 'jaar', opm: '' } }, lastenExtra: [],
    schuldenData: [mkSchuld()],
    ach_huur: 'nee', ach_energie: 'nee', sch_exparter: 'nvt', schulden_opm: '',
    fdma: '', kwgt: '', kwgm: '', kindsupport: '', voedselbank: '',
    advItems: [], cb_budgetbeheer: false, cb_schuldregeling: false,
    cb_bewind_medisch: false, cb_bewind_schuld: false, cb_schuldhulpmaatje: false,
    cb_overig_aanvr: false, overig_aanvr_txt: '', conclusie: '',
    naam_consulent2: '', datum_rapportage: d,
  }
}

export function buildSystemAdvItems(state: FormState): AdviesItem[] {
  const norm = parseFloat(state.bijstandsnorm) || 0
  const ink = getTotaalInkomen(state)
  const pct = norm && ink ? (ink / norm) * 100 : 0
  const ls = state.leefsituatie
  const hK = state.kinderen === 'ja'
  const isPensioen = ls.startsWith('pensioen')
  const sp = (parseFloat(state.spaargeld) || 0) + (parseFloat(state.overig_verm) || 0) + (parseFloat(state.beleggingen) || 0) + (parseFloat(state.overigVermogenBedrag) || 0) + state.voertuigen.reduce((s, v) => s + (parseFloat(v.waarde) || 0), 0)
  const grens = VGRENS[ls] || 8000
  const tot = getTotaalLasten(state)
  const best = ink - tot

  const items: AdviesItem[] = []
  if (norm && ink) {
    if (pct < 100) items.push({ p: 'urg', t: 'Aanvullende bijstand / AIO aanvragen', b: `Inkomen €${ink.toFixed(0)} onder norm €${norm.toFixed(0)}. Direct bespreken bij gemeente of SVB.`, on: true, custom: false })
    if (pct >= 100 && pct < 105 && !isPensioen) items.push({ p: 'urg', t: 'IIT — tijdsduur controleren', b: 'Inkomen op bijstandsniveau. Na 3 jaar ≤105% norm kan IIT worden aangevraagd.', on: true, custom: false })
    if (pct < 110) items.push({ p: 'med', t: 'FDMA aanvragen bij gemeente Meppel', b: 'Inkomen onder 110% norm.', on: true, custom: false })
    if (pct < 120) items.push({ p: 'med', t: 'Kwijtschelding GBLT + gemeentelijke belastingen', b: 'Inkomen onder 120% norm. Aanvragen indien nog niet gedaan.', on: true, custom: false })
  }
  if (hK) {
    items.push({ p: 'med', t: 'Kindsupport Meppel — bespreken en vastleggen', b: 'Cliënt heeft kinderen. Altijd informeren en vastleggen in dossier.', on: true, custom: false })
    if (!state.toeslagenActief['kinderopvang']) items.push({ p: 'low', t: 'Kinderopvangtoeslag controleren', b: 'Geen KOT geregistreerd. Navragen of kinderopvang wordt gebruikt.', on: true, custom: false })
  }
  if (sp > grens) items.push({ p: 'urg', t: 'Vermogen boven vrijstellingsgrens', b: `€${nl(sp)} overschrijdt grens €${nl(grens)}.`, on: true, custom: false })
  if (best < 0 && ink > 0) {
    items.push({ p: 'urg', t: 'URGENT: Negatief besteedbaar inkomen', b: `Lasten €${nl(tot)} > inkomen €${nl(ink)}. Tekort €${nl(Math.abs(best))}/mnd.`, on: true, custom: false })
    items.push({ p: 'med', t: 'Voedselbank Meppel — aanmelding bespreken', b: 'Op basis van financiële situatie voedselbank bespreken.', on: true, custom: false })
  }
  // Verzekeringen: alleen adviseren als het veld leeg is (nog niet besproken).
  // 'ja' = heeft het, 'nee' = bewust niet nodig/besproken, 'aanvr' = afspraak gemaakt (reminder).
  if (!state.tw_avp) items.push({ p: 'low', t: 'AVP aanvragen', b: 'Aansprakelijkheidsverzekering nog niet besproken. Adviseer aanvragen.', on: true, custom: false })
  else if (state.tw_avp === 'aanvr') items.push({ p: 'low', t: 'AVP aanvragen (afspraak)', b: 'Advies besproken AVP aan te vragen.', on: true, custom: false })
  if (!state.tw_inboedel) items.push({ p: 'low', t: 'Inboedelverzekering aanvragen', b: 'Inboedelverzekering nog niet besproken. Adviseer aanvragen.', on: true, custom: false })
  else if (state.tw_inboedel === 'aanvr') items.push({ p: 'low', t: 'Inboedelverzekering aanvragen (afspraak)', b: 'Advies besproken inboedelverzekering aan te vragen.', on: true, custom: false })
  if (state.eigen_woning === 'ja' && !state.tw_opstal) items.push({ p: 'med', t: 'Opstalverzekering afsluiten (koopwoning)', b: 'Bij koopwoning is opstalverzekering doorgaans verplicht.', on: true, custom: false })
  else if (state.eigen_woning === 'ja' && state.tw_opstal === 'aanvr') items.push({ p: 'med', t: 'Opstalverzekering afsluiten (afspraak)', b: 'Advies besproken opstalverzekering af te sluiten.', on: true, custom: false })
  if (items.length === 0) items.push({ p: 'low', t: 'Geen acute actiepunten', b: 'Op basis van de ingevulde gegevens geen urgente adviezen.', on: true, custom: false })
  return items
}

export type RegelingVoorstel =
  | { recht: 'ja'; reden: string }
  | { recht: 'nee'; reden: string }
  | { recht: 'check'; reden: string }
  | { recht: 'nvt'; reden: string }

export interface RegelingBeoordeling {
  fdma: RegelingVoorstel
  kwijtschelding_gblt: RegelingVoorstel
  kwijtschelding_gemeente: RegelingVoorstel
  iit: RegelingVoorstel
  kindsupport: RegelingVoorstel
  voedselbank: RegelingVoorstel
}

// Voedselbank ZWD: norm besteedbaar inkomen voor voeding+kleding (per 2025)
const VB_NORM_EENPERS = 400
const VB_NORM_PERPERS = 120

function huishoudenGrootte(state: FormState): number {
  if (state.leefsituatie.startsWith('samenwonend') || state.leefsituatie.startsWith('pensioen_paar') || state.leefsituatie.startsWith('pensioen_gemengd')) {
    return 2 + (state.kinderen === 'ja' ? (state.kinderenData.length || 1) : 0)
  }
  return 1 + (state.kinderen === 'ja' ? (state.kinderenData.length || 1) : 0)
}

export function evaluateRegelingen(state: FormState): RegelingBeoordeling {
  const norm = parseFloat(state.bijstandsnorm) || 0
  const ink = getTotaalInkomen(state)
  const pct = norm && ink ? (ink / norm) * 100 : 0
  const ls = state.leefsituatie
  const hK = state.kinderen === 'ja'
  const isPensioen = ls.startsWith('pensioen')
  const tot = getTotaalLasten(state)
  const best = ink - tot
  const sp = (parseFloat(state.spaargeld) || 0) + (parseFloat(state.overig_verm) || 0) + (parseFloat(state.beleggingen) || 0) + (parseFloat(state.overigVermogenBedrag) || 0) + state.voertuigen.reduce((s, v) => s + (parseFloat(v.waarde) || 0), 0)
  const grens = VGRENS[ls] || 8000
  const overwaarde = parseFloat(state.overwaarde) || 0

  // FDMA — inkomen <=110% norm, vermogen <= grens, overwaarde <= 67500 (bij koop)
  let fdma: RegelingVoorstel = { recht: 'check', reden: 'Nog onvoldoende gegevens (inkomen/norm).' }
  // Vermogenstoets loopt altijd (ook zonder inkomen): vermogen boven grens = geen FDMA.
  if (sp > grens) {
    fdma = { recht: 'nee', reden: `Vermogen €${nl(sp)} boven grens €${nl(grens)}.` }
  } else if (state.eigen_woning === 'ja' && overwaarde > 67500) {
    fdma = { recht: 'nee', reden: `Overwaarde €${nl(overwaarde)} > €67.500.` }
  } else if (norm && ink) {
    if (pct > 110) fdma = { recht: 'nee', reden: `Inkomen ${pct.toFixed(0)}% norm (>110%).` }
    else fdma = { recht: 'ja', reden: `Inkomen ${pct.toFixed(0)}% norm (≤110%), vermogen €${nl(sp)} (≤€${nl(grens)}).` }
  }

  // Kwijtschelding GBLT — inkomen <120% norm
  let kwijtschelding_gblt: RegelingVoorstel = { recht: 'check', reden: 'Nog onvoldoende gegevens (inkomen/norm).' }
  if (norm && ink) {
    if (pct >= 120) kwijtschelding_gblt = { recht: 'nee', reden: `Inkomen ${pct.toFixed(0)}% norm (≥120%).` }
    else kwijtschelding_gblt = { recht: 'ja', reden: `Inkomen ${pct.toFixed(0)}% norm (<120%).` }
  }

  // Kwijtschelding gemeentelijke belastingen — inkomen <120% norm (zelfde toets, apart vast te leggen)
  let kwijtschelding_gemeente: RegelingVoorstel = { recht: 'check', reden: 'Nog onvoldoende gegevens (inkomen/norm).' }
  if (norm && ink) {
    if (pct >= 120) kwijtschelding_gemeente = { recht: 'nee', reden: `Inkomen ${pct.toFixed(0)}% norm (≥120%).` }
    else kwijtschelding_gemeente = { recht: 'ja', reden: `Inkomen ${pct.toFixed(0)}% norm (<120%).` }
  }

  // IIT — >=3 jaar aaneengesloten <=105% norm, niet voor pensioengerechtigden
  let iit: RegelingVoorstel = { recht: 'check', reden: 'Nog onvoldoende gegevens (inkomen/norm).' }
  if (norm && ink) {
    if (isPensioen) iit = { recht: 'nvt', reden: 'Niet voor pensioengerechtigden.' }
    else if (pct > 105) iit = { recht: 'nee', reden: `Inkomen ${pct.toFixed(0)}% norm (>105%).` }
    else iit = { recht: 'check', reden: `Inkomen ${pct.toFixed(0)}% norm (≤105%) — controleer 3-jaars-termijn (IIT-datum).` }
  }

  // Kindsupport — alleen bij kinderen
  const kindsupport: RegelingVoorstel = !hK
    ? { recht: 'nvt', reden: 'Geen kinderen geregistreerd.' }
    : { recht: 'ja', reden: 'Kinderen in gezin — altijd bespreken.' }

  // Voedselbank — besteedbaar inkomen negatief OF onder VB-norm (400 + 120 p.p.)
  const vbNorm = VB_NORM_EENPERS + VB_NORM_PERPERS * (huishoudenGrootte(state) - 1)
  let voedselbank: RegelingVoorstel = { recht: 'check', reden: 'Nog onvoldoende gegevens (inkomen).' }
  if (ink > 0) {
    if (best < 0) voedselbank = { recht: 'ja', reden: `Let op: besteedbaar inkomen €${nl(best)} (negatief). Cliënt mogelijk ook in aanmerking voor Voedselbank, ondanks VB-norm. Doorvragen.` }
    else if (best < vbNorm) voedselbank = { recht: 'ja', reden: `Besteedbaar inkomen €${nl(best)} < VB-norm €${nl(vbNorm)} (${huishoudenGrootte(state)} pers.).` }
    else voedselbank = { recht: 'nee', reden: `Besteedbaar inkomen €${nl(best)} ≥ VB-norm €${nl(vbNorm)}.` }
  }

  return { fdma, kwijtschelding_gblt, kwijtschelding_gemeente, iit, kindsupport, voedselbank }
}

export function lftd(geb: string): string {
  if (!geb) return '—'
  const n = lftdN(geb)
  return n >= 0 ? `${n} jr` : '—'
}

export function lftdN(geb: string): number {
  if (!geb) return -1
  const t = new Date(), d = new Date(geb)
  let a = t.getFullYear() - d.getFullYear()
  if (t < new Date(t.getFullYear(), d.getMonth(), d.getDate())) a--
  return a
}

export function getTotaalInkomen(state: FormState): number {
  const bronnen = state.inkomenData.reduce((s, d) => s + (parseFloat(d.netto) || 0), 0)
  const alimPart = state.alim_ontvangen === 'ja' ? (parseFloat(state.alim_partner) || 0) : 0
  const alimKind = state.alim_ontvangen === 'ja' ? (parseFloat(state.alim_kind) || 0) : 0
  const TOESLAGEN_EXCL = ['kinderbijslag']
  const toeslagenInk = Object.entries(state.toeslagenActief)
    .filter(([key, actief]) => actief && !TOESLAGEN_EXCL.includes(key))
    .reduce((s, [key]) => s + (parseFloat(state.toeslagenBedrag[key] || '0') || 0), 0)
  return bronnen + alimPart + alimKind + toeslagenInk
}

export function getTotaalLasten(state: FormState): number {
  const hA = state.voertuigen.some(v => v.kenteken || v.merk || (parseFloat(v.waarde) || 0) > 0)
  const hK = state.kinderen === 'ja'
  const allDef = [
    ...LASTEN_DEF,
    ...state.lastenExtra.map((_, i) => ({ id: `extra_${i}`, autoOnly: false as const, kinderOnly: false as const })),
  ]
  return allDef.reduce((s, row) => {
    if (row.autoOnly && !hA) return s
    if (row.kinderOnly && !hK) return s
    const w = state.lastenWaarden[row.id]
    if (!w || !w.bedrag) return s
    const bdr = parseFloat(w.bedrag) || 0
    const factor = PER_OPTIES.find(p => p.v === (w.per || 'mnd'))?.f || 1
    return s + bdr * factor
  }, 0)
}

export function getMndBedrag(bedrag: string, per: string): number {
  const bdr = parseFloat(bedrag) || 0
  const factor = PER_OPTIES.find(p => p.v === per)?.f || 1
  return bdr * factor
}

export function getPct(state: FormState): number {
  const norm = parseFloat(state.bijstandsnorm) || 0
  const ink = getTotaalInkomen(state)
  if (!norm || !ink) return 0
  return (ink / norm) * 100
}

export function updArr<T>(arr: T[], idx: number, patch: Partial<T>): T[] {
  return arr.map((item, i) => (i === idx ? { ...item, ...patch } : item))
}

export function rmArr<T>(arr: T[], idx: number): T[] {
  return arr.filter((_, i) => i !== idx)
}
