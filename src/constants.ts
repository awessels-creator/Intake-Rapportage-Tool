export const NORM: Record<string, number> = {
  alleenstaand: 1401.50, alleenstaande_ouder: 1401.50, samenwonend: 2002.13,
  pensioen_alleen: 1501.80, pensioen_paar: 2144.16, pensioen_gemengd: 2002.13,
}

export const VGRENS: Record<string, number> = {
  alleenstaand: 8000, alleenstaande_ouder: 16000, samenwonend: 16000,
  pensioen_alleen: 8000, pensioen_paar: 16000, pensioen_gemengd: 16000,
}

export const NIBUD: Record<string, number> = {
  alleenstaand: 540, alleenstaande_ouder: 620, samenwonend: 760,
  pensioen_alleen: 510, pensioen_paar: 720, pensioen_gemengd: 720,
}

export const BVV_MAX: Record<string, number> = {
  alleenstaand: 2191.42, alleenstaande_ouder: 2526.69, samenwonend: 2881.41,
  samenwonend_kind: 3155.31, pensioen_alleen: 2191.42, pensioen_paar: 2881.41,
  pensioen_gemengd: 2881.41,
}

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
}

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
  { id: 'leef', post: 'Levensonderhoud (NIBUD-richtlijn)', per: 'mnd', vast: true },
  { id: 'overig', post: 'Abonnementen / overig', per: 'mnd', vast: true },
]

export interface PerOptie { v: string; l: string; f: number }

export const PER_OPTIES: PerOptie[] = [
  { v: 'mnd', l: '/mnd', f: 1 },
  { v: 'week', l: '/week', f: 4.333 },
  { v: 'kwt', l: '/kwt', f: 1 / 3 },
  { v: 'jaar', l: '/jaar', f: 1 / 12 },
  { v: '10ter', l: '/10 term.', f: 10 / 12 },
]

export const TOESLAG_NAMEN: Record<string, string> = {
  huur: 'Huurtoeslag',
  zorg: 'Zorgtoeslag',
  kinderbijslag: 'Kinderbijslag (AKW)',
  kinderopvang: 'Kinderopvangtoeslag (KOT)',
  kindgebonden: 'Kindgebonden budget (WKB/KGB)',
  bijzondere: 'Bijzondere bijstand',
  aio: 'AIO — aanv. inkomensvoorziening ouderen (SVB)',
}

export const TOESLAGEN = ['huur', 'zorg', 'kinderbijslag', 'kinderopvang', 'kindgebonden', 'bijzondere', 'aio']
