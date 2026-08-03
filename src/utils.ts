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
    kinderen: '', kinderenData: [], woont_bij: '',
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
    bijstandsnorm: '', norm_bron: '', inkomenData: [mkInk()],
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
    quickChecks: {}, quickRadio: {}, quickFree: {},
  }
}

export function buildSystemAdvItems(state: FormState): AdviesItem[] {
  const norm = parseFloat(state.bijstandsnorm) || 0
  const ink = getTotaalInkomen(state)
  const pct = norm && ink ? (ink / norm) * 100 : 0
  const ls = state.leefsituatie
  const hK = state.kinderen === 'ja'
  const isPensioen = ls.startsWith('pensioen')
  const isJeugd = lftdN(state.geboortedatum) >= 0 && lftdN(state.geboortedatum) < 21
  const sp = (parseFloat(state.spaargeld) || 0) + (parseFloat(state.overig_verm) || 0) + (parseFloat(state.beleggingen) || 0) + (parseFloat(state.overigVermogenBedrag) || 0) + state.voertuigen.reduce((s, v) => s + (parseFloat(v.waarde) || 0), 0)
  const grens = VGRENS[ls] || 8000
  const tot = getTotaalLasten(state)
  const best = ink - tot

  const items: AdviesItem[] = []
  if (norm && ink) {
    if (pct < 100) items.push({ p: 'urg', t: 'Aanvullende bijstand / AIO aanvragen', b: `Inkomen €${ink.toFixed(0)} onder norm €${norm.toFixed(0)}. Direct bespreken bij gemeente of SVB.`, on: true, custom: false })
    if (pct >= 100 && pct < 105 && !isPensioen && !isJeugd) items.push({ p: 'urg', t: 'IIT — tijdsduur controleren', b: 'Inkomen op bijstandsniveau. Na 3 jaar ≤105% norm kan IIT worden aangevraagd.', on: true, custom: false })
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
  // 'ja' = heeft het, 'nee' = bewust niet nodig/besproken, 'aanvr' = advies besproken.
  if (!state.tw_avp) items.push({ p: 'low', t: 'AVP aanvragen', b: 'Aansprakelijkheidsverzekering nog niet besproken. Adviseer aanvragen.', on: true, custom: false })
  else if (state.tw_avp === 'aanvr') items.push({ p: 'low', t: 'AVP aanvragen', b: 'Advies besproken AVP aan te vragen.', on: true, custom: false })
  if (!state.tw_inboedel) items.push({ p: 'low', t: 'Inboedelverzekering aanvragen', b: 'Inboedelverzekering nog niet besproken. Adviseer aanvragen.', on: true, custom: false })
  else if (state.tw_inboedel === 'aanvr') items.push({ p: 'low', t: 'Inboedelverzekering aanvragen', b: 'Advies besproken inboedelverzekering aan te vragen.', on: true, custom: false })
  if (state.eigen_woning === 'ja' && !state.tw_opstal) items.push({ p: 'med', t: 'Opstalverzekering afsluiten (koopwoning)', b: 'Bij koopwoning is opstalverzekering doorgaans verplicht.', on: true, custom: false })
  else if (state.eigen_woning === 'ja' && state.tw_opstal === 'aanvr') items.push({ p: 'med', t: 'Opstalverzekering afsluiten', b: 'Advies besproken opstalverzekering af te sluiten.', on: true, custom: false })
  if (!state.tw_uitvaart) items.push({ p: 'low', t: 'Uitvaartverzekering bespreken', b: 'Uitvaartverzekering nog niet besproken. Bespreek wenselijkheid en advies aanvragen.', on: true, custom: false })
  else if (state.tw_uitvaart === 'aanvr') items.push({ p: 'low', t: 'Uitvaartverzekering afsluiten', b: 'Advies besproken uitvaartverzekering af te sluiten.', on: true, custom: false })
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
  const isJeugd = lftdN(state.geboortedatum) >= 0 && lftdN(state.geboortedatum) < 21
  const isJeugdInst = isJeugdOfInstelling(ls)
  const geenAanslag = geenEigenAanslag(state)
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
  if (geenAanslag) {
    kwijtschelding_gblt = { recht: 'nvt', reden: 'Geen eigen belastingaanslag (woont bij ouders of in een instelling).' }
  } else if (norm && ink) {
    if (pct >= 120) kwijtschelding_gblt = { recht: 'nee', reden: `Inkomen ${pct.toFixed(0)}% norm (≥120%).` }
    else kwijtschelding_gblt = { recht: 'ja', reden: `Inkomen ${pct.toFixed(0)}% norm (<120%).` }
  }

  // Kwijtschelding gemeentelijke belastingen — inkomen <120% norm (zelfde toets, apart vast te leggen)
  let kwijtschelding_gemeente: RegelingVoorstel = { recht: 'check', reden: 'Nog onvoldoende gegevens (inkomen/norm).' }
  if (geenAanslag) {
    kwijtschelding_gemeente = { recht: 'nvt', reden: 'Geen eigen belastingaanslag (woont bij ouders of in een instelling).' }
  } else if (norm && ink) {
    if (pct >= 120) kwijtschelding_gemeente = { recht: 'nee', reden: `Inkomen ${pct.toFixed(0)}% norm (≥120%).` }
    else kwijtschelding_gemeente = { recht: 'ja', reden: `Inkomen ${pct.toFixed(0)}% norm (<120%).` }
  }

  // IIT — >=3 jaar aaneengesloten <=105% norm, niet voor pensioengerechtigden, niet onder de 21 jaar
  let iit: RegelingVoorstel = { recht: 'check', reden: 'Nog onvoldoende gegevens (inkomen/norm).' }
  if (norm && ink) {
    if (isPensioen) iit = { recht: 'nvt', reden: 'Niet voor pensioengerechtigden.' }
    else if (isJeugd) iit = { recht: 'nvt', reden: 'Niet voor cliënten jonger dan 21 jaar.' }
    else if (isJeugdInst) iit = { recht: 'nvt', reden: 'Niet van toepassing bij instelling/jeugd-onder-21-situatie.' }
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

// ── SNELVRAGENLIJST (zijpaneel, optie A) ────────────────────────────────────
// Definitieve 5-sectie-config (Crisis/Bank/Vermogen/Schulden zijn eruit gehaald).
// Elke check heeft een korte 'label' (chip) en volledige 's' (rapportzin).
// Radio's hebben een 'map' (waarde -> leesbare tekst). 'free' = vrij tekstveld.
export interface QuickItem { id: string; label: string; s: string }
export interface QuickGroup { label: string; type: 'check' | 'radio' | 'text'; items?: QuickItem[]; map?: Record<string, string>; id?: string; name?: string }
export interface QuickSection {
  key: string                       // gekoppeld state-veld (bestaand open veld)
  tabLabel: string
  groups: QuickGroup[]
}

export const QUICK_SECTIONS: QuickSection[] = [
  {
    key: 'persoonlijk', tabLabel: 'Achtergrond',
    groups: [
      { label: 'Woonsituatie', type: 'check', items: [
        { id: 'a_woon_eigen', label: 'Eigen woning', s: 'Cliënt woont in een eigen woning.' },
        { id: 'a_woon_huur', label: 'Huurwoning', s: 'Cliënt woont in een huurwoning.' },
        { id: 'a_woon_beschermd', label: 'Beschermd wonen', s: 'Cliënt verblijft in beschermd wonen.' },
        { id: 'a_woon_dakloos', label: 'Dak-/thuisloos', s: 'Cliënt is dak-/thuisloos.' },
        { id: 'a_woon_gedeeld', label: 'Gedeelde woning', s: 'Cliënt woont in een gedeelde woning.' },
        { id: 'a_woon_instelling', label: 'Instelling/opvang', s: 'Cliënt verblijft in een instelling of opvang.' },
      ] },
      { label: 'Sociale situatie', type: 'check', items: [
        { id: 'a_soc_isolatie', label: 'Isolement', s: 'Er is sprake van isolement of eenzaamheid.' },
        { id: 'a_soc_mantelzorg', label: 'Mantelzorger', s: 'Cliënt is mantelzorger.' },
        { id: 'a_soc_familie_betrokken', label: 'Familie betrokken', s: 'Familie is betrokken.' },
        { id: 'a_soc_familie_niet', label: 'Familie niet betrokken', s: 'Familie is niet betrokken.' },
        { id: 'a_soc_geen_familie', label: 'Geen familie', s: 'Cliënt heeft geen familie.' },
        { id: 'a_soc_vrienden', label: 'Vrienden/kenniskring', s: 'Cliënt heeft een vrienden/kennissenkring.' },
        { id: 'a_soc_sport', label: 'Sport/hobby/vereniging', s: 'Cliënt doet aan sport, een hobby of een vereniging.' },
      ] },
      { label: 'Gezondheid', type: 'check', items: [
        { id: 'a_gez_goed', label: 'Gezond', s: 'De gezondheid is goed.' },
        { id: 'a_gez_fysiek', label: 'Fysieke beperking/ziekte', s: 'Er is sprake van een fysieke beperking of ziekte.' },
        { id: 'a_gez_mentaal', label: 'Mentale problemen', s: 'Er zijn mentale problemen.' },
        { id: 'a_gez_wmo', label: 'WMO-indicatie', s: 'Cliënt heeft een WMO-indicatie.' },
      ] },
      { label: 'Middelengebruik / verslaving', type: 'check', items: [
        { id: 'a_mid_geen', label: 'Geen', s: 'Er is geen sprake van middelengebruik of verslaving.' },
        { id: 'a_mid_alcohol', label: 'Alcohol', s: 'Er is sprake van alcoholgebruik.' },
        { id: 'a_mid_drugs', label: 'Drugs', s: 'Er is sprake van drugsgebruik.' },
        { id: 'a_mid_gokken', label: 'Gokken', s: 'Er is sprake van gokken.' },
        { id: 'a_mid_gaming', label: 'Gaming/internet', s: 'Er is sprake van gaming of internetgebruik.' },
        { id: 'a_mid_hulp', label: 'Hulpverlening actief', s: 'Hulpverlening rond middelengebruik is actief.' },
      ] },
      { label: 'Overige aandachtspunten', type: 'check', items: [
        { id: 'a_ov_justitie', label: 'Justitieel verleden', s: 'Cliënt heeft een justitieel verleden.' },
        { id: 'a_ov_erfenis', label: 'Erfenis/boedel', s: 'Er speelt een erfenis- of boedelkwestie.' },
        { id: 'a_ov_analfabeet', label: 'Analfabeet/laaggeletterd', s: 'Cliënt is analfabeet of laaggeletterd.' },
        { id: 'a_ov_psych', label: 'Psychotische episode(s)', s: 'Er is sprake van psychotische episode(s), eventueel in het verleden.' },
        { id: 'a_ov_somatisch', label: 'Lichamelijk beperkt', s: 'Cliënt is lichamelijk beperkt.' },
      ] },
    ],
  },
  {
    key: 'opleiding_toel', tabLabel: 'Opleiding/Werk',
    groups: [
      { label: 'Opleidingsniveau', type: 'radio', name: 'b_opl', map: { geen: 'geen startkwalificatie', vmbo: 'VMBO', havo: 'HAVO', mbo1: 'MBO-1', mbo2: 'MBO-2', mbo3: 'MBO-3', mbo4: 'MBO-4', hbo: 'HBO', wo: 'WO' } },
      { label: 'Richting / soort opleiding', type: 'text', id: 'b_richting' },
      { label: 'Diploma behaald', type: 'radio', name: 'b_diploma', map: { ja: 'ja', nee: 'nee' } },
      { label: 'Werkervaring', type: 'radio', name: 'b_werk', map: { geen: 'geen', minder1: 'minder dan 1 jaar', '1tot5': '1 tot 5 jaar', meer5: 'meer dan 5 jaar' } },
      { label: 'Huidige arbeidssituatie', type: 'check', items: [
        { id: 'b_arbeid_werkzaam', label: 'Werkzaam', s: 'Cliënt is werkzaam.' },
        { id: 'b_arbeid_ww', label: 'WW', s: 'Cliënt ontvangt een WW-uitkering.' },
        { id: 'b_arbeid_wia', label: 'WIA/WAO', s: 'Cliënt ontvangt een WIA- of WAO-uitkering.' },
        { id: 'b_arbeid_zw', label: 'Ziektewet', s: 'Cliënt ontvangt een Ziektewet-uitkering.' },
        { id: 'b_arbeid_zzp', label: 'ZZP', s: "Cliënt is zzp'er." },
        { id: 'b_arbeid_geen', label: 'Niet werkzaam', s: 'Cliënt is niet werkzaam.' },
      ] },
      { label: 'Type contract', type: 'radio', name: 'b_contract', map: { vast: 'vast contract', tijdelijk: 'tijdelijk contract', detachering: 'detachering', geen: 'geen contract' } },
      { label: 'Toekomstperspectief', type: 'check', items: [
        { id: 'b_persp_goed', label: 'Goed perspectief', s: 'Het toekomstperspectief is goed.' },
        { id: 'b_persp_beperkt', label: 'Beperkt perspectief', s: 'Het toekomstperspectief is beperkt.' },
        { id: 'b_persp_reintegratie', label: 'Re-integratietraject', s: 'Er loopt een re-integratietraject.' },
        { id: 'b_persp_onbekend', label: 'Onbekend', s: 'Het toekomstperspectief is onbekend.' },
      ] },
    ],
  },
  {
    key: 'hulpvraag', tabLabel: 'Reden aanmelding',
    groups: [
      { label: 'Reden aanmelding', type: 'check', items: [
        { id: 'd_reden_schulden', label: 'Schulden/betalingsproblemen', s: 'Reden van aanmelding: schulden of betalingsproblemen.' },
        { id: 'd_reden_inkomen', label: 'Te laag inkomen', s: 'Reden van aanmelding: een te laag inkomen.' },
        { id: 'd_reden_crisis', label: 'Crisissituatie', s: 'Reden van aanmelding: een crisissituatie.' },
        { id: 'd_reden_anders', label: 'Anders', s: 'Reden van aanmelding: anders.' },
      ] },
      { label: 'Herkomst aanmelding', type: 'check', items: [
        { id: 'd_via_zelf', label: 'Zelf gemeld', s: 'Aanmelding: cliënt heeft zichzelf gemeld.' },
        { id: 'd_via_intern', label: 'Interne doorverwijzing', s: 'Aanmelding via interne doorverwijzing.' },
        { id: 'd_via_zorg', label: 'Via zorgaanbieder', s: 'Aanmelding via doorverwijzing door een zorgaanbieder.' },
      ] },
    ],
  },
  {
    key: 'kvk_toel', tabLabel: 'Onderneming',
    groups: [
      { label: 'Bedrijfsituatie', type: 'check', items: [
        { id: 'f_kvn_schulden', label: 'Zakelijke schulden', s: 'Er zijn zakelijke schulden.' },
        { id: 'f_kvn_priveschulden', label: 'Privé-schulden', s: 'Er zijn privé-schulden.' },
        { id: 'f_kvn_belasting', label: 'Belastingschulden', s: 'Er zijn belastingschulden.' },
        { id: 'f_kvn_boekhouding', label: 'Boekhouding niet op orde', s: 'De boekhouding is niet op orde.' },
        { id: 'f_kvn_uren', label: '>1225 uur/jaar (BBZ)', s: 'Er wordt meer dan 1225 uur per jaar in het bedrijf gewerkt (BBZ mogelijk).' },
      ] },
    ],
  },
  {
    key: 'inkomen_toel', tabLabel: 'Inkomen',
    groups: [
      { label: 'Inkomenssituatie', type: 'check', items: [
        { id: 'h_ink_stabiel', label: 'Stabiel inkomen', s: 'Het inkomen is stabiel.' },
        { id: 'h_ink_wisselend', label: 'Wisselend/onregelmatig', s: 'Het inkomen is wisselend of onregelmatig.' },
        { id: 'h_ink_aanvulling', label: 'Aanvulling nodig', s: 'Een aanvulling van het inkomen is nodig.' },
        { id: 'h_ink_toeslag', label: 'Toeslag mogelijk', s: 'Een aanvullende toeslag is mogelijk.' },
      ] },
    ],
  },
]

// Zet de aangevinkte items / keuzes / vrije tekst van de snelvragenlijst om in
// nette, lopende zinnen. Per sectie één array van zinnen. Wordt bij rapportage
// samengevoegd met de handmatige tekst in hetzelfde veld (downloadImpl.ts).
export function buildQuickText(state: FormState): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const sec of QUICK_SECTIONS) {
    const parts: string[] = []
    for (const g of sec.groups) {
      if (g.type === 'check') {
        for (const it of g.items || []) {
          if (state.quickChecks[it.id]) parts.push(it.s)
        }
      } else if (g.type === 'radio') {
        const v = state.quickRadio[g.name || '']
        if (v && g.map && g.map[v]) parts.push(`${g.label}: ${g.map[v]}`)
      } else if (g.type === 'text' && g.id) {
        const v = (state.quickFree[g.id] || '').trim()
        if (v) parts.push(g.id === 'b_richting' ? `Opleidingsrichting: ${v}` : v)
      }
    }
    out[sec.key] = parts
  }
  return out
}

// ── JEUGDAFTREKKING & INSTELLING ────────────────────────────────────────────
// Leefsituaties waarbij de cliënt NIET onder de reguliere (21+) bijstandsnorm
// valt. De tool rekent hier GEEN zelfstandige norm of beslagvrije voet uit,
// maar vraagt de consulent de juiste norm in te vullen (met bron) en laat de
// regeling-checks (IIT, kwijtschelding) waar nodig op n.v.t. staan.
export const JEUGDP_LEEFSITUATIES = ['jeugd_thuis', 'jeugd_zelfstandig', 'instelling'] as const
export type JeugdLeefsituatie = typeof JEUGDP_LEEFSITUATIES[number]

export function isJeugdOfInstelling(ls: string): boolean {
  return (JEUGDP_LEEFSITUATIES as readonly string[]).includes(ls)
}

// Cliënt heeft geen eigen belastingaanslag (woont bij ouders of in instelling)
// → kwijtschelding GBLT/gemeente is niet van toepassing.
export function geenEigenAanslag(state: FormState): boolean {
  if (state.leefsituatie === 'instelling') return true
  if (state.leefsituatie === 'jeugd_thuis') return true
  if (state.woont_bij === 'ouders' || state.woont_bij === 'instelling') return true
  return false
}

export function lftdN(geb: string): number {
  if (!geb) return -1
  const t = new Date(), d = new Date(geb)
  let a = t.getFullYear() - d.getFullYear()
  if (t < new Date(t.getFullYear(), d.getMonth(), d.getDate())) a--
  return a
}

export function lftd(geb: string): string {
  if (!geb) return '—'
  const n = lftdN(geb)
  return n >= 0 ? `${n} jr` : '—'
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
