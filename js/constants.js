// ═══════════════════════════════════════════════
// CONSTANTEN 2026
// ═══════════════════════════════════════════════
const NORM = { alleenstaand: 1401.50, alleenstaande_ouder: 1401.50, samenwonend: 2002.13, pensioen_alleen: 1501.80, pensioen_paar: 2144.16, pensioen_gemengd: 2002.13 };
const VGRENS = { alleenstaand: 8000, alleenstaande_ouder: 16000, samenwonend: 16000, pensioen_alleen: 8000, pensioen_paar: 16000, pensioen_gemengd: 16000 };
const NIBUD = { alleenstaand: 540, alleenstaande_ouder: 620, samenwonend: 760, pensioen_alleen: 510, pensioen_paar: 720, pensioen_gemengd: 720 };
const BVV_MAX = { alleenstaand: 2191.42, alleenstaande_ouder: 2526.69, samenwonend: 2881.41, samenwonend_kind: 3155.31, pensioen_alleen: 2191.42, pensioen_paar: 2881.41, pensioen_gemengd: 2881.41 };

// PREFERENTIE & SCHONE LEI info per schuld type
const SCHULD_INFO = {
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
  overig: { pref: 'Nee', lei: 'Ja (tenzij specifieke uitzondering)' }
};

const LASTEN_DEF = [
  { id: 'huur', post: 'Huur / Hypotheek', per: 'mnd', vast: true, verzSleutel: null },
  { id: 'energie', post: 'Energie (gas + licht)', per: 'mnd', vast: true, verzSleutel: null },
  { id: 'water', post: 'Water', per: 'mnd', vast: true, verzSleutel: null },
  { id: 'zorgverzek', post: 'Zorgverzekering', per: 'mnd', vast: true, verzSleutel: null },
  { id: 'wa', post: 'WA + inboedelverzekering', per: 'mnd', vast: true, verzSleutel: 'inboedel' },
  { id: 'uitvaart', post: 'Uitvaartverzekering', per: 'mnd', vast: true, verzSleutel: 'uitvaart' },
  { id: 'internet', post: 'Internet / telefoon / tv', per: 'mnd', vast: true, verzSleutel: null },
  { id: 'gblt', post: 'GBLT (waterschapsbelasting)', per: '10ter', vast: true, verzSleutel: null, gblt: true },
  { id: 'gemeentebel', post: 'Gemeentelijke belastingen', per: '10ter', vast: true, verzSleutel: null, gblt: true },
  { id: 'cak', post: 'Eigen bijdrage CAK (Wmo/Wlz)', per: 'mnd', vast: true, verzSleutel: null },
  { id: 'bank', post: 'Bankkosten', per: 'mnd', vast: true, verzSleutel: null },
  { id: 'autoverzek', post: 'Autoverzekering', per: 'mnd', vast: false, autoOnly: true, verzSleutel: null },
  { id: 'wegenb', post: 'Wegenbelasting', per: 'kwt', vast: false, autoOnly: true, verzSleutel: null },
  { id: 'ko', post: 'Kinderopvang (eigen bijdrage)', per: 'mnd', vast: false, kinderOnly: true, verzSleutel: null },
  { id: 'alim_betaald', post: 'Alimentatie (betaald)', per: 'mnd', vast: true, verzSleutel: null },
  { id: 'betreg', post: 'Betalingsregelingen schulden', per: 'mnd', vast: true, verzSleutel: null },
  { id: 'leef', post: 'Levensonderhoud (NIBUD-richtlijn)', per: 'mnd', vast: true, verzSleutel: null },
  { id: 'overig', post: 'Abonnementen / overig', per: 'mnd', vast: true, verzSleutel: null },
];

const PER_OPTIES = [{ v: 'mnd', l: '/mnd', f: 1 }, { v: 'week', l: '/week', f: 4.333 }, { v: 'kwt', l: '/kwt', f: 1 / 3 }, { v: 'jaar', l: '/jaar', f: 1 / 12 }, { v: '10ter', l: '/10 term.', f: 10 / 12 }];
