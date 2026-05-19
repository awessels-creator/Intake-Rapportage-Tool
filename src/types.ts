export interface KindItem {
  naam: string
  geb: string
  coouder: 'ja' | 'nee'
}

export interface BankItem {
  iban: string
  naam: string
  bank: string
  type: 'betaal' | 'spaar' | 'kind' | 'anders'
  saldo: string
  rood: boolean
  nieuw: string
  opm: string
}

export interface InkomenItem {
  bron: string
  type: string
  netto: string
  uren: string
  beslag: boolean
}

export interface BeslagItem {
  wie: string
  soort: string
  bedrag: string
}

export interface SchuldItem {
  s: string
  t: string
  subt: string
  b: string
  afl: string
  st: string
}

export interface AdviesItem {
  p: 'urg' | 'med' | 'low'
  t: string
  b: string
  on: boolean
  custom: boolean
}

export interface LastenWaarde {
  bedrag: string
  per: string
  opm: string
}

export interface FormState {
  currentPage: number
  // Page 0
  clientnr: string
  voornaam: string
  achternaam: string
  geboortedatum: string
  bsn: string
  burgstaat: string
  nationaliteit: string
  adres: string
  woonplaats: string
  telefoon: string
  email: string
  leefsituatie: string
  datum_intake: string
  heeft_partner: string
  partner_vnaam: string
  partner_anaam: string
  partner_geb: string
  partner_bsn: string
  partner_reg: string
  partner_niet_reden: string
  kinderen: string
  kinderenData: KindItem[]
  // Page 1
  persoonlijk: string
  opleiding_toel: string
  flank: string
  flank_inst: string
  flank_naam: string
  flank_contact: string
  flank_aard: string
  // Page 2
  naam_consulent: string
  crisis: string
  cr_water: boolean
  cr_energie: boolean
  cr_ontruiming: boolean
  cr_anders: boolean
  crisis_toelichting: string
  hulpvraag: string
  eerder_aanvr: string
  eerder_aanvr_toel: string
  bankData: BankItem[]
  ondernemer: string
  kvk_naam: string
  kvk_nr: string
  kvk_datum: string
  boekhouding: string
  aangifte: string
  kvk_toel: string
  // Page 3
  spaargeld: string
  overig_verm: string
  beleggingen: string
  eigen_woning: string
  overwaarde: string
  heeft_auto: string
  auto_kenteken: string
  auto_merk: string
  auto_bouwjaar: string
  auto_waarde: string
  auto_reden: string
  auto_verm: string
  vermogen_toel: string
  tw_avp: string
  tw_inboedel: string
  tw_opstal: string
  tw_uitvaart: string
  tw_zorgaanv: string
  // Page 4
  bijstandsnorm: string
  inkomenData: InkomenItem[]
  alim_ontvangen: string
  alim_partner: string
  alim_kind: string
  alim_lbio: string
  iit: string
  iit_datum: string
  beslagData: BeslagItem[]
  inkomen_toel: string
  // Page 5
  toeslagenActief: Record<string, boolean>
  toeslagenBedrag: Record<string, string>
  toeslagenBeslag: Record<string, boolean>
  // Page 6
  lastenWaarden: Record<string, LastenWaarde>
  lastenExtra: { post: string; per: string }[]
  // Page 7
  schuldenData: SchuldItem[]
  ach_huur: string
  ach_energie: string
  sch_exparter: string
  schulden_opm: string
  // Page 8
  fdma: string
  kwgt: string
  kwgm: string
  kindsupport: string
  voedselbank: string
  // Page 9
  advItems: AdviesItem[]
  cb_budgetbeheer: boolean
  cb_schuldregeling: boolean
  cb_bewind_medisch: boolean
  cb_bewind_schuld: boolean
  cb_schuldhulpmaatje: boolean
  cb_overig_aanvr: boolean
  overig_aanvr_txt: string
  conclusie: string
  naam_consulent2: string
  datum_rapportage: string
}
