// ── ÉÉN BRON VAN WAARHEID VOOR ALLE FINANCIËLE NORMEN ───────────────────────
// Elke periode bevat ALLE normen (bijstand, vermogen, vrijstelling, NIBUD, BVV).
// Bij een normwijziging vul je één nieuwe periode toe — niets anders aanpassen.
// De tool kiest automatisch de periode die op de huidige datum van kracht is.

export interface NormPeriode {
  vanaf: string                     // datum (YYYY-MM-DD) waarop deze normen ingaan
  model: string                     // stabiele model-code, bv. "2026-1" (1e helft) of "2026-2" (2e helft)
  label: string                     // leesbare periode-aanduiding voor in de UI
  bijstand: Record<string, number> // netto bijstandsnormen excl. vakantietoeslag (/mnd)
  vermogen: Record<string, number> // vrijstellingsgrens vermogen Participatiewet
  vrijstellingOverwaarde: number   // vrijstelling overwaarde eigen woning
  nibud: Record<string, number>    // NIBUD besteedbaar budget
  bvvMax: Record<string, number>   // wettelijke maximum beslagvrije voet
}

// ── HALFJAARLIJKSE UPDATE ───────────────────────────────────────────────────
// Normen wijzigen per 1 januari en per 1 juli. Voeg bij elke wijziging ÉÉN
// nieuwe periode toe aan NORM_PERIODES hieronder:
//   { vanaf: '2027-01-01', model: '2027-1', label: '1e helft 2027 (per 1 jan 2027)', bijstand: {...}, ... }
// De tool kiest automatisch de periode die op de huidige datum van kracht is.
// Geen overlap nodig: de nieuwe periode vervangt de oude zodra 'vanaf' is bereikt.
// Het `model` (bv. "2026-2") identificeert eenduidig welke normenset actief is —
// zichtbaar in de TopBar, het rapport en de bestandsnaam.

const NORM_PERIODES: NormPeriode[] = [
  {
    vanaf: '2026-07-01',
    model: '2026-2',
    label: '2e helft 2026 (per 1 juli 2026)',
    bijstand: {
      alleenstaand: 1348.49, alleenstaande_ouder: 1348.49, samenwonend: 1926.40,
      pensioen_alleen: 1450.99, pensioen_paar: 2071.51, pensioen_gemengd: 1926.40,
    },
    vermogen: {
      alleenstaand: 8000, alleenstaande_ouder: 16000, samenwonend: 16000,
      pensioen_alleen: 8000, pensioen_paar: 16000, pensioen_gemengd: 16000,
    },
    vrijstellingOverwaarde: 67500,
    nibud: {
      alleenstaand: 540, alleenstaande_ouder: 620, samenwonend: 760,
      pensioen_alleen: 510, pensioen_paar: 720, pensioen_gemengd: 720,
    },
    bvvMax: {
      alleenstaand: 2191.42, alleenstaande_ouder: 2526.69, samenwonend: 2881.41,
      samenwonend_kind: 3155.31, pensioen_alleen: 2191.42, pensioen_paar: 2881.41,
      pensioen_gemengd: 2881.41,
    },
  },
]

/** Geldige normperiode voor een gegeven datum (default: vandaag). */
export function getNormPeriode(op: string = new Date().toISOString().split('T')[0]): NormPeriode {
  const geldig = NORM_PERIODES
    .filter(p => p.vanaf <= op)
    .sort((a, b) => b.vanaf.localeCompare(a.vanaf))
  return geldig[0] ?? NORM_PERIODES[NORM_PERIODES.length - 1]
}

// Actuele periode (bij app-start bevroren — normen veranderen niet binnen een sessie)
export const NORMPERIODE = getNormPeriode()

// Model-code van de actieve periode (bv. "2026-2") — eenduidige identificatie
export const MODEL = NORMPERIODE.model

// ── MODEL-PREVIEW (voor de consulent: toekomstige normen alvast bekijken) ──────
// Bij een halfjaarlijkse update voeg je de nieuwe periode toe aan NORM_PERIODES.
// Met setNormPreview('2027-1') toont de tool tijdelijk die set (badge, tabellen,
// rapport, bestandsnaam) — handig om vóór de ingangsdatum te controleren hoe het
// eruitziet. clearNormPreview() of een herlaad zet de live datum weer terug.
let ACTIEF: NormPeriode = NORMPERIODE
export const PREVIEW_NORMPERIODE: { vanaf: string; model: string; label: string } | null =
  NORMPERIODE.model === ACTIEF.model ? null : { vanaf: ACTIEF.vanaf, model: ACTIEF.model, label: ACTIEF.label }

export function setNormPreview(model: string): void {
  const p = NORM_PERIODES.find(x => x.model === model)
  if (!p) return
  ACTIEF = p
  NORM = p.bijstand
  VGRENS = p.vermogen
  NIBUD = p.nibud
  BVV_MAX = p.bvvMax
  VRIJSTELLING_OVERWAARDE = p.vrijstellingOverwaarde
  document.dispatchEvent(new CustomEvent('norm-preview-change'))
}

export function clearNormPreview(): void {
  ACTIEF = NORMPERIODE
  NORM = NORMPERIODE.bijstand
  VGRENS = NORMPERIODE.vermogen
  NIBUD = NORMPERIODE.nibud
  BVV_MAX = NORMPERIODE.bvvMax
  VRIJSTELLING_OVERWAARDE = NORMPERIODE.vrijstellingOverwaarde
  document.dispatchEvent(new CustomEvent('norm-preview-change'))
}

export function getActivePeriode(): NormPeriode {
  return ACTIEF
}

/** Lijst van alle beschikbare modellen (voor de preview-dropdown), nieuwste eerst. */
export function getBeschikbareModellen(): NormPeriode[] {
  return [...NORM_PERIODES].reverse()
}

// Terugwaartse compatibiliteit + gemak: afgeleide constantes uit de actuele periode
export let NORM = NORMPERIODE.bijstand
export let VGRENS = NORMPERIODE.vermogen
export let NIBUD = NORMPERIODE.nibud
export let BVV_MAX = NORMPERIODE.bvvMax
export let VRIJSTELLING_OVERWAARDE = NORMPERIODE.vrijstellingOverwaarde

// Leesbare volgorde + labels voor de bijstandsnorm-tabel (Page4)
export const BIJSTAND_LABELS: { key: string; label: string }[] = [
  { key: 'alleenstaand', label: 'Alleenstaande / Alleenstaande ouder (21+)' },
  { key: 'samenwonend', label: 'Samenwonend / Gehuwd' },
  { key: 'pensioen_alleen', label: 'Pensioengerechtigde — alleenstaand (AIO SVB)' },
  { key: 'pensioen_paar', label: 'Pensioengerechtigde — beiden AOW-gerechtigd' },
]

// Leesbare volgorde voor de vermogensgrenzen-tabel (Page3)
export const VERMOGEN_LABELS: { key: string; label: string }[] = [
  { key: 'alleenstaand', label: 'Alleenstaande' },
  { key: 'alleenstaande_ouder', label: 'Alleenstaande ouder / Gezin' },
  { key: 'pensioen_alleen', label: 'Pensioengerechtigde — alleenstaand / paar' },
]

export interface SchuldInfo { pref: string; lei: string }

export const SCHULD_INFO: Record<string, SchuldInfo> = {
  huur: { pref: 'Ja', lei: 'Ja — preferent, valt mee in traject' },
  energie: { pref: 'Ja (bij afsluiting dreiging)', lei: 'Ja — in principe' },
  belasting: { pref: 'Ja — Belastingdienst is preferente crediteur', lei: 'Deels — CJIB-boetes vallen hier buiten' },
  zorg: { pref: 'Nee', lei: 'Ja' },
  krediet: { pref: 'Nee', lei: 'Ja' },
  incasso: { pref: 'Nee', lei: 'Ja' },
  deurw: { pref: 'Afhankelijk van soort', lei: 'Afhankelijk van onderliggende schuld' },
  boete_mulder: { pref: 'Ja — CJIB is preferent', lei: 'Nee — CJIB blijft doorlopen na schone lei' },
  boete_terwee: { pref: 'Ja — CJIB is preferent', lei: 'Nee — CJIB blijft doorlopen na schone lei' },
  studie: { pref: 'Nee', lei: 'Nee — DUO loopt na afloop schuldentraject door (hervatten)' },
  alimentatie: { pref: 'Ja — onderhoudsplicht is preferent', lei: 'Nee — lopende en achterstallige alimentatie door na traject' },
  overig: { pref: 'Nee', lei: 'Ja (tenzij specifieke uitzondering)' },
}

export interface LastenDef {
  id: string; post: string; per: string; vast: boolean
  verzSleutel?: string | null; autoOnly?: boolean; kinderOnly?: boolean; gblt?: boolean
  dierOnly?: boolean; defaultBedrag?: number
}

// Eigen risico ziektekostenverzekering — verandert per kalenderjaar.
// WIJZIGEN PER 1 JANUARI: zet hier het geldende wettelijke eigen risico.
// Wordt als default-ingang gebruikt bij de lastenpost 'Eigen risico ziektekosten' (zie LASTEN_DEF).
export const EIGEN_RISICO_JAAR = 385.00 // 2026

export const LASTEN_DEF: LastenDef[] = [
  { id: 'huur', post: 'Huur / Hypotheek', per: 'mnd', vast: true },
  { id: 'energie', post: 'Energie (gas + licht)', per: 'mnd', vast: true },
  { id: 'water', post: 'Water', per: 'mnd', vast: true },
  { id: 'zorgverzek', post: 'Zorgverzekering', per: 'mnd', vast: true },
  { id: 'wa', post: 'WA + inboedelverzekering', per: 'mnd', vast: true, verzSleutel: 'inboedel' },
  { id: 'uitvaart', post: 'Uitvaartverzekering', per: 'mnd', vast: true, verzSleutel: 'uitvaart' },
  { id: 'internet', post: 'Internet / telefoon / tv', per: 'mnd', vast: true },
  { id: 'gblt', post: 'GBLT (waterschapsbelasting)', per: '10ter', vast: true, gblt: true },
  { id: 'gemeentebel', post: 'Gemeentelijke belastingen', per: '10ter', vast: true, gblt: true },
  { id: 'cak', post: 'Eigen bijdrage CAK (Wmo/Wlz)', per: 'mnd', vast: true },
  { id: 'bank', post: 'Bankkosten', per: 'mnd', vast: true },
  { id: 'autoverzek', post: 'Autoverzekering', per: 'mnd', vast: false, autoOnly: true },
  { id: 'wegenb', post: 'Wegenbelasting', per: 'kwt', vast: false, autoOnly: true },
  { id: 'ko', post: 'Kinderopvang (eigen bijdrage)', per: 'mnd', vast: false, kinderOnly: true },
  { id: 'alim_betaald', post: 'Alimentatie (betaald)', per: 'mnd', vast: true },
  { id: 'betreg', post: 'Betalingsregelingen schulden', per: 'mnd', vast: true },
  { id: 'leef', post: 'Kosten levensonderhoud/huishoudgeld', per: 'week', vast: true },
  { id: 'overig', post: 'Abonnementen / overig', per: 'mnd', vast: true },
  { id: 'eigenrisico', post: 'Eigen risico ziektekosten (reservering)', per: 'jaar', vast: true, defaultBedrag: EIGEN_RISICO_JAAR },
  { id: 'contributie', post: 'Contributie / lidmaatschappen', per: 'mnd', vast: true },
  { id: 'huisdier_kosten', post: 'Huisdier(en) — voeding/verzorging', per: 'mnd', vast: false, dierOnly: true },
]

export interface PerOptie { v: string; l: string; f: number }

export const PER_OPTIES: PerOptie[] = [
  { v: 'mnd', l: '/mnd', f: 1 },
  { v: 'week', l: '/week', f: 4.333 },
  { v: 'kwt', l: '/kwt', f: 1 / 3 },
  { v: 'jaar', l: '/jaar', f: 1 / 12 },
  { v: '10ter', l: '/10 term.', f: 10 / 12 },
]

export const TOESLAG_GRENZEN_2026: Record<string, { alleen: number; samen: number; benadering?: boolean }> = {
  // Jaarlijkse toetsingsinkomen-grens 2026 (Bron: Belastingdienst). Maand = /12.
  zorg:          { alleen: 40857, samen: 51142 },                          // harde grens
  huur:          { alleen: 43500, samen: 48000, benadering: true },        // bij benadering (hangt van huur/samenstelling)
  kindgebonden:  { alleen: 57000, samen: 88000, benadering: true },        // bij benadering (alleenstaande ouder 1 kind ~57k)
}

export const TOESLAG_NAMEN: Record<string, string> = {
  huur: 'Huurtoeslag',
  zorg: 'Zorgtoeslag',
  kinderbijslag: 'Kinderbijslag (AKW)',
  kinderopvang: 'Kinderopvangtoeslag (KOT)',
  kindgebonden: 'Kindgebonden budget (WKB/KGB)',
  overig_ink: 'Overige inkomsten',
}

export const TOESLAGEN = ['huur', 'zorg', 'kinderbijslag', 'kinderopvang', 'kindgebonden', 'overig_ink']
