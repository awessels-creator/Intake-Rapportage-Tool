import type { FormState, AdviesItem, BankItem, InkomenItem, SchuldItem, BeslagItem } from './types'
import { LASTEN_DEF, PER_OPTIES, VGRENS } from './constants'

export const nl = (n: number, dec = 0) =>
  n.toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec })

export const today = () => new Date().toISOString().split('T')[0]

export const mkBank = (): BankItem => ({ iban: '', naam: '', type: 'betaal', saldo: '', rood: false, nieuw: '', opm: '' })
export const mkInk = (): InkomenItem => ({ bron: '', type: '', netto: '', uren: '', beslag: false, invoerPer: 'mnd', inclVak: false, weekBedrag: '' })
export const mkSchuld = (): SchuldItem => ({ s: '', t: '', subt: '', b: '', afl: '', st: '' })
export const mkBeslag = (): BeslagItem => ({ wie: '', soort: '', bedrag: '' })

export function yearsSince(date: string, now: number = Date.now()): number | null {
  if (!date) return null
  return (now - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
}

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
    overwaarde: '', heeft_auto: '', auto_kenteken: '', auto_merk: '',
    auto_bouwjaar: '', auto_waarde: '', auto_reden: '', auto_verm: '',
    vermogen_toel: '', tw_avp: '', tw_inboedel: '', tw_opstal: '',
    tw_uitvaart: '', tw_zorgaanv: '', tw_wanbet: '',
    bijstandsnorm: '', inkomenData: [mkInk()],
    alim_ontvangen: '', alim_partner: '', alim_kind: '', alim_lbio: '',
    iit: '', iit_datum: '', beslagData: [], inkomen_toel: '',
    toeslagenActief: {}, toeslagenBedrag: {}, toeslagenBeslag: {}, toeslagenNaam: {},
    lastenWaarden: {}, lastenExtra: [],
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
  const sp = (parseFloat(state.spaargeld) || 0) + (parseFloat(state.overig_verm) || 0) + (parseFloat(state.beleggingen) || 0)
  const grens = VGRENS[ls] || 8000
  const tot = getTotaalLasten(state)
  const best = ink - tot

  const items: AdviesItem[] = []
  if (norm && ink) {
    if (pct < 100) items.push({ p: 'urg', t: 'Aanvullende bijstand / AIO aanvragen', b: `Inkomen €${ink.toFixed(0)} onder norm €${norm.toFixed(0)}. Direct bespreken bij gemeente of SVB.`, on: true, custom: false })
    if (pct >= 100 && pct < 105) items.push({ p: 'urg', t: 'IIT — tijdsduur controleren', b: 'Inkomen op bijstandsniveau. Na 3 jaar ≤105% norm kan IIT worden aangevraagd.', on: true, custom: false })
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
  if (state.tw_avp === 'nee') items.push({ p: 'low', t: 'AVP aanvragen', b: 'Aansprakelijkheidsverzekering ontbreekt.', on: true, custom: false })
  if (state.tw_inboedel === 'nee') items.push({ p: 'low', t: 'Inboedelverzekering aanvragen', b: 'Inboedelverzekering ontbreekt.', on: true, custom: false })
  if (state.eigen_woning === 'ja' && state.tw_opstal === 'nee') items.push({ p: 'med', t: 'Opstalverzekering afsluiten (koopwoning)', b: 'Bij koopwoning is opstalverzekering doorgaans verplicht.', on: true, custom: false })
  if (items.length === 0) items.push({ p: 'low', t: 'Geen acute actiepunten', b: 'Op basis van de ingevulde gegevens geen urgente adviezen.', on: true, custom: false })
  return items
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
  const hA = state.heeft_auto === 'ja'
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
