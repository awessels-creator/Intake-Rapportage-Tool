import type { FormState } from './types'
import { SCHULD_INFO, LASTEN_DEF, PER_OPTIES, TOESLAGEN, TOESLAG_NAMEN, BVV_MAX } from './constants'
import { getTotaalInkomen, getTotaalLasten, lftd, nl } from './utils'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType,
  Header, Footer, PageNumber
} from 'docx'

const ORANGE = 'EA5403'
const DARK_GREEN = '1A4B2D'
const RED = '9D3D1D'
const GRAY = '555555'
const LIGHT_GRAY = 'F2F2F2'
const BORDER_COLOR = 'E0E0E0'

function cell(text: string, opts?: { bold?: boolean; color?: string; shading?: string; width?: number }): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: text || '—', bold: opts?.bold || false, color: opts?.color || '111111', font: 'Arial', size: 19 })] })],
    width: opts?.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts?.shading ? { fill: opts?.shading, type: ShadingType.CLEAR } : undefined,
    borders: { top: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR }, left: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR }, right: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR } },
  })
}

function headerCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', font: 'Arial', size: 19 })] })],
    shading: { fill: ORANGE, type: ShadingType.CLEAR },
    borders: { top: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR }, left: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR }, right: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR } },
  })
}

function spacer(): Paragraph { return new Paragraph({ children: [new TextRun({ text: '', size: 10 })] }) }

function h1(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, bold: true, size: 32, color: '111111', font: 'Arial' })], spacing: { before: 200, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ORANGE } } })
}

function h2(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, bold: true, size: 22, color: ORANGE, font: 'Arial' })], spacing: { before: 160, after: 40 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR } } })
}

function h3(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: GRAY, font: 'Arial' })], spacing: { before: 120, after: 40 } })
}

function para(text: string, opts?: { bold?: boolean; color?: string; size?: number }): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: text || '—', bold: opts?.bold || false, color: opts?.color || '111111', font: 'Arial', size: opts?.size || 19 })], spacing: { before: 20, after: 20 } })
}

function simpleTable(headers: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(h => headerCell(h)) }),
      ...rows.map((row, i) => new TableRow({ children: row.map(c => cell(c, { shading: i % 2 === 1 ? LIGHT_GRAY : undefined })) })),
    ],
  })
}

function ntRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, color: GRAY, font: 'Arial', size: 19 })] })], width: { size: 30, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: value || '—', color: '111111', font: 'Arial', size: 19 })] })], width: { size: 70, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
    ],
  })
}

function ntTable(rows: [string, string][]): Table {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map(([l, v]) => ntRow(l, v)) })
}

export async function downloadWord(state: FormState) {
  const naam = `${state.voornaam} ${state.achternaam}`.trim() || 'Onbekend'
  const datum = state.datum_intake || new Date().toISOString().split('T')[0]
  const consulent = state.naam_consulent || state.naam_consulent2 || '—'
  const norm = parseFloat(state.bijstandsnorm) || 0
  const ink = getTotaalInkomen(state)
  const pct = norm ? ink / norm * 100 : 0
  const tot = getTotaalLasten(state)
  const best = ink - tot
  const schulden = state.schuldenData.reduce((s, d) => s + (parseFloat(d.b) || 0), 0)
  const ls = state.leefsituatie
  const hK = state.kinderen === 'ja'
  const bvv_ber = ink <= norm ? ink * 0.95 : norm * 0.95
  const maxKey = ls === 'samenwonend' && hK ? 'samenwonend_kind' : ls
  const bvv = Math.min(bvv_ber, BVV_MAX[maxKey] || BVV_MAX['alleenstaand'])

  const children: (Paragraph | Table)[] = []

  children.push(h1('Intakerapportage Geldzorgen Schuldhulpverlening'))
  children.push(para(`Datum: ${datum} | Consulent: ${consulent} | Cliëntnr: ${state.clientnr || '—'} | Vertrouwelijk`, { color: '666666', size: 18 }))
  children.push(spacer())

  // 1. Cliëntgegevens
  children.push(h2('1. Cliëntgegevens'))
  children.push(ntTable([
    ['Cliëntnummer', state.clientnr || '—'], ['Naam', naam], ['Geboortedatum', state.geboortedatum || '—'],
    ['BSN', state.bsn || '—'], ['Burgerlijke staat', state.burgstaat || '—'], ['Nationaliteit', state.nationaliteit || '—'],
    ['Adres', state.adres || '—'], ['Woonplaats', state.woonplaats || '—'], ['Leefsituatie', ls || '—'],
    ['E-mailadres', state.email || '—'], ['Telefoonnummer', state.telefoon || '—'],
  ]))
  if (state.heeft_partner === 'ja') {
    children.push(h3('Partner'))
    children.push(ntTable([['Naam', `${state.partner_vnaam || ''} ${state.partner_anaam || ''}`], ['Geboortedatum', state.partner_geb || '—'], ['BSN partner', state.partner_bsn || '—'], ['In regeling?', state.partner_reg || '—']]))
  }
  if (hK && state.kinderenData.length > 0) {
    children.push(h3('Kinderen (thuiswonend)'))
    children.push(simpleTable(['Naam', 'Geboortedatum', 'Leeftijd', 'Co-ouderschap'], state.kinderenData.map(k => [k.naam || '—', k.geb || '—', lftd(k.geb), k.coouder === 'ja' ? 'Ja' : 'Nee'])))
  }
  children.push(spacer())

  // 2. Persoonlijke omstandigheden
  children.push(h2('2. Persoonlijke omstandigheden'))
  if (state.persoonlijk) { children.push(h3('Woonsituatie / netwerk')); children.push(para(state.persoonlijk)) }
  if (state.opleiding_toel) { children.push(h3('Opleiding / werkervaring / perspectief')); children.push(para(state.opleiding_toel)) }
  if (state.flank === 'ja') { children.push(h3('Flankerende hulpverlening')); children.push(para(`${state.flank_inst || '—'} — ${state.flank_naam || '—'} (${state.flank_contact || '—'}) — ${state.flank_aard || '—'}`)) }
  if (!state.persoonlijk && !state.opleiding_toel && state.flank !== 'ja') children.push(para('—'))
  children.push(spacer())

  // 3. Aanvraag & Crisis
  children.push(h2('3. Aanvraag & Crisis'))
  const crisisItems = ['cr_water', 'cr_energie', 'cr_ontruiming', 'cr_anders'].filter(k => state[k as keyof FormState]).map(k => ({ cr_water: 'water', cr_energie: 'energie', cr_ontruiming: 'ontruiming', cr_anders: 'anders' }[k] || k))
  children.push(ntTable([
    ['Crisis', state.crisis === 'ja' ? 'Ja' + (crisisItems.length ? ' (' + crisisItems.join(', ') + ')' : '') + (state.crisis_toelichting ? ' — ' + state.crisis_toelichting : '') : 'Nee'],
    ['Eerdere aanvragen', state.eerder_aanvr === 'ja' ? 'Ja — ' + (state.eerder_aanvr_toel || '') : 'Nee'],
  ]))
  children.push(h3('Reden aanmelding / hulpvraag')); children.push(para(state.hulpvraag || '—'))
  children.push(spacer())

  // 4. Bankrekening(en)
  children.push(h2('4. Bankrekening(en)'))
  if (state.bankData.length > 0) children.push(simpleTable(['IBAN', 'Tenaamstelling', 'Type', 'Saldo', 'Roodstand', 'Nieuwe rek. besproken'], state.bankData.map(b => [b.iban || '—', b.naam || '—', b.type || '—', `€ ${b.saldo || '0'}`, b.rood ? 'Ja' : 'Nee', b.nieuw || '—'])))
  else children.push(para('Geen bankrekeningen geregistreerd.'))
  if (state.bank_toelichting) children.push(para(state.bank_toelichting, { color: '666666' }))
  children.push(spacer())

  // 5. Onderneming
  children.push(h2('5. Onderneming'))
  const ondText = !state.ondernemer || state.ondernemer === 'nee' ? 'Geen onderneming.' : state.ondernemer === 'actief' ? `Actief — ${state.kvk_naam || '?'}, KvK: ${state.kvk_nr || '?'}` : `Gestopt — ${state.kvk_naam || '?'}, KvK: ${state.kvk_nr || '?'}, uitgeschreven: ${state.kvk_datum || '?'}`
  children.push(para(ondText))
  if (state.ondernemer && state.ondernemer !== 'nee') { children.push(para(`Boekhouding: ${state.boekhouding || '—'} | Aangiften: ${state.aangifte || '—'}`)); if (state.kvk_toel) children.push(para(state.kvk_toel, { color: '666666' })) }
  children.push(spacer())

  // 6. Vermogen
  children.push(h2('6. Vermogen'))
  const vermRows: [string, string][] = [['Spaargeld', `€ ${nl(parseFloat(state.spaargeld) || 0)}`], ['Beleggingen', `€ ${nl(parseFloat(state.beleggingen) || 0)}`], ['Eigen woning', state.eigen_woning === 'ja' ? 'Ja (koop)' : 'Nee (huur)'], ['Overig vermogen', `€ ${nl(parseFloat(state.overig_verm) || 0)}`]]
  if (state.heeft_auto === 'ja') { vermRows.push(['Auto/motor', `${state.auto_kenteken || ''} ${state.auto_merk || ''} | dagwaarde €${nl(parseFloat(state.auto_waarde) || 0)}`]); vermRows.push(['Behoud/verkoop', state.auto_verm || '—']) }
  children.push(ntTable(vermRows))
  children.push(h3('Verzekeringen'))
  const verzItems = [{ n: 'AVP (aansprakelijkheid)', v: state.tw_avp }, { n: 'Inboedelverzekering', v: state.tw_inboedel }, { n: 'Uitvaartverzekering', v: state.tw_uitvaart }, ...(state.eigen_woning === 'ja' ? [{ n: 'Opstalverzekering', v: state.tw_opstal }] : []), { n: 'Aanvullende zorgverzekering', v: state.tw_zorgaanv }, { n: 'Wanbetalersregeling (CAK)', v: state.tw_wanbet }]
  const verzTekst = (v: string) => v === 'ja' ? 'Aanwezig' : v === 'nee' ? 'Niet aanwezig' : v === 'aanvr' ? 'Aanvragen' : v === 'nvt' ? 'N.v.t.' : '—'
  children.push(simpleTable(['Verzekering', 'Status'], verzItems.map(item => [item.n, verzTekst(item.v)])))
  if (state.vermogen_toel) { children.push(h3('Toelichting vermogen en verzekeringen')); children.push(para(state.vermogen_toel)) }
  children.push(spacer())

  // 7. Inkomen
  children.push(h2('7. Inkomen (per 1 jan 2026)'))
  const inkRows: [string, string][] = [['Bijstandsnorm', `€ ${nl(norm)}/mnd`], ['Totaal inkomen', `€ ${nl(ink)}/mnd (${pct.toFixed(0)}% van norm)`]]
  if (state.alim_ontvangen === 'ja') inkRows.push(['Alimentatie ontvangen', `Partner: €${state.alim_partner || '0'}/mnd | Kind: €${state.alim_kind || '0'}/mnd | Via LBIO: ${state.alim_lbio || '—'}`])
  children.push(ntTable(inkRows))
  if (state.inkomenData.length > 0) { children.push(h3('Inkomstenbronnen')); children.push(simpleTable(['Bron / Werkgever', 'Type', 'Netto/mnd', 'Dienstverband', 'Beslag?'], state.inkomenData.map(d => [d.bron || '—', d.type || '—', `€ ${nl(parseFloat(d.netto) || 0)}`, d.uren || '—', d.beslag ? 'Ja' : 'Nee']))) }
  const beslagData = state.beslagData.filter(b => b.wie)
  if (beslagData.length > 0) { children.push(h3('Beslagleggende schuldeisers')); children.push(simpleTable(['Schuldeiser', 'Soort', 'Bedrag'], beslagData.map(b => [b.wie, b.soort || '—', b.bedrag ? `€ ${b.bedrag}/mnd` : 'Onbekend']))) }
  children.push(para(`IIT: ${state.iit || '—'}`)); children.push(spacer())

  // 8. Toeslagen
  children.push(h2('8. Toeslagen'))
  children.push(simpleTable(['Regeling', 'Status', 'Bedrag', 'Beslag?'], TOESLAGEN.map(t => { const actief = state.toeslagenActief[t]; const v = state.toeslagenBedrag[t]; const bes = state.toeslagenBeslag[t]; const rijnaam = t === 'overig_ink' && state.toeslagenNaam?.[t] ? state.toeslagenNaam[t] : TOESLAG_NAMEN[t]; return [rijnaam, actief ? 'Actief' : '—', actief && v ? `€ ${parseFloat(v).toLocaleString('nl-NL')}` : '—', actief && bes ? 'Ja' : 'Nee'] })))
  children.push(para(`FDMA: ${state.fdma || '—'} | Kindsupport Meppel: ${state.kindsupport || '—'}`)); children.push(spacer())

  // 9. Vaste Lasten
  children.push(h2('9. Vaste Lasten'))
  const allDef = [...LASTEN_DEF, ...state.lastenExtra.map((e, i) => ({ id: `extra_${i}`, post: e.post || 'Eigen post', per: 'mnd', autoOnly: false as const, kinderOnly: false as const }))]
  const lastenRows = allDef.filter(row => { if (row.autoOnly && state.heeft_auto !== 'ja') return false; if (row.kinderOnly && !hK) return false; const w = state.lastenWaarden[row.id]; return w && parseFloat(w.bedrag) > 0 }).map(row => { const w = state.lastenWaarden[row.id]; const bdr = parseFloat(w.bedrag) || 0; const factor = PER_OPTIES.find(p => p.v === w.per)?.f || 1; const mnd = bdr * factor; return [row.post, `€ ${nl(bdr)} ${PER_OPTIES.find(p => p.v === w.per)?.l || '/mnd'}`, `€ ${mnd.toFixed(2)}/mnd`, w.opm || ''] })
  const lastenTableRows = [...lastenRows, ['Totaal inkomen (incl. toeslagen)', '', `€ ${ink.toFixed(2)}/mnd`, ''], ['Totaal vaste lasten', '', `€ ${tot.toFixed(2)}/mnd`, ''], ['Besteedbaar', '', `€ ${best.toFixed(2)}/mnd`, '']]
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: ['Post', 'Bedrag (periode)', 'Per maand', 'Opmerking'].map(h => headerCell(h)) }),
      ...lastenTableRows.map((row, i) => new TableRow({ children: row.map((c) => { const isTotal = i >= lastenRows.length; const isBesteedbaar = i === lastenTableRows.length - 1; const shading = isTotal ? (isBesteedbaar ? (best < 0 ? 'FDF3EF' : 'EEF7F2') : 'F0F0F0') : (i % 2 === 1 ? LIGHT_GRAY : undefined); const color = isBesteedbaar ? (best < 0 ? RED : DARK_GREEN) : '111111'; return cell(c, { bold: isTotal, color, shading }) }) })),
    ],
  }))
  children.push(para(`Kwijtschelding GBLT: ${state.kwgt || '—'} | Kwijtschelding gemeente: ${state.kwgm || '—'}`)); children.push(spacer())

  // 9a. Beslagvrije Voet
  children.push(h2('9a. Beslagvrije Voet (indicatief, jan 2026)'))
  children.push(ntTable([['Toe te passen BVV', `€ ${bvv.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`], ['Max. voor beslag beschikbaar', `€ ${(ink - bvv).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`]]))
  children.push(spacer())

  // 10. Schulden
  children.push(h2('10. Schulden'))
  const schuldenData = state.schuldenData.filter(s => s.s || s.b)
  if (schuldenData.length > 0) { children.push(simpleTable(['Schuldeiser', 'Soort', 'Openstaand', 'Aflossing', 'Preferent', 'Schone lei?', 'Status'], schuldenData.map(s => [s.s || '—', (s.t || '—') + (s.subt ? ` (${s.subt})` : ''), `€ ${nl(parseFloat(s.b) || 0)}`, s.afl ? `€ ${s.afl}/mnd` : '—', (SCHULD_INFO[s.t] || {}).pref || '—', (SCHULD_INFO[s.t] || {}).lei || '—', s.st || '—']))); children.push(para(`Geschatte schuldenlast: € ${nl(schulden)}`, { bold: true })) }
  else children.push(para('Geen schulden geregistreerd.'))
  children.push(para(`Gezamenlijke schulden ex-partner: ${state.sch_exparter || '—'} | Voedselbank: ${state.voedselbank || '—'}`))
  if (state.schulden_opm) children.push(para(state.schulden_opm, { color: '666666' }))
  children.push(spacer())

  // 11. Samenvatting
  children.push(h2('11. Samenvatting Financiële Situatie'))
  children.push(ntTable([['Totaal inkomen', `€ ${nl(ink)}/mnd${norm ? ` (${pct.toFixed(0)}% van bijstandsnorm)` : ''}`], ['Totaal vaste lasten', `€ ${nl(tot)}/mnd`], ['Besteedbaar inkomen', `€ ${best.toFixed(2)}/mnd ${best < 0 ? 'NEGATIEF' : 'OK'}`], ['Totaal schulden (indicatief)', `€ ${nl(schulden)}`]]))
  children.push(spacer())

  // 12. Dienstverlening
  children.push(h2('12. Aanvraag Type Dienstverlening'))
  const diensten: [string, string][] = (['budgetbeheer', 'schuldregeling', 'bewind_medisch', 'bewind_schuld', 'schuldhulpmaatje'] as const).filter(k => state[`cb_${k}` as keyof FormState]).map(k => [{ budgetbeheer: 'Budgetbeheer', schuldregeling: 'Schuldregeling', bewind_medisch: 'Beschermingsbewind (medisch)', bewind_schuld: 'Schuldenbewind', schuldhulpmaatje: 'Schuldhulpmaatje/Humanitas' }[k] || k, 'Ja'])
  if (state.cb_overig_aanvr && state.overig_aanvr_txt) diensten.push([`Overig: ${state.overig_aanvr_txt}`, 'Ja'])
  if (diensten.length > 0) children.push(simpleTable(['Dienst', 'Aangevraagd'], diensten))
  else children.push(para('Geen dienstverlening geselecteerd.'))
  children.push(spacer())

  // 13. Adviezen
  children.push(h2('13. Adviezen & Actiepunten'))
  const advItems = state.advItems.filter(a => a.on)
  if (advItems.length > 0) {
    advItems.forEach(a => {
      const colors: Record<string, string> = { urg: 'E76F51', med: 'B5853A', laag: '02706D' }
      const bgColors: Record<string, string> = { urg: 'FDF3EF', med: 'FDF6E9', laag: 'E8EEEE' }
      children.push(new Paragraph({ children: [new TextRun({ text: a.t, bold: true, font: 'Arial', size: 19 }), new TextRun({ text: `\n${a.b}`, font: 'Arial', size: 19 })], spacing: { before: 60, after: 60 }, border: { left: { style: BorderStyle.SINGLE, size: 16, color: colors[a.p] || '02706D' } }, shading: { fill: bgColors[a.p] || 'E8EEEE', type: ShadingType.CLEAR } }))
    })
  } else children.push(para('Geen adviezen.'))

  if (state.conclusie) { children.push(h2('14. Conclusie / Afspraken / Afsluiting')); state.conclusie.split('\n').forEach(line => children.push(para(line))) }

  children.push(spacer())
  children.push(new Paragraph({ children: [new TextRun({ text: `Rapportage: ${new Date().toLocaleDateString('nl-NL')} | Consulent: ${consulent} | Cliëntnr: ${state.clientnr || '—'} | Vertrouwelijk — Geldzorgen Schuldhulpverlening Meppel 2026`, color: '888888', size: 17, font: 'Arial' })], spacing: { before: 200 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR } } }))

  const doc = new Document({
    creator: 'Geldzorgen Meppel', title: `Intakerapportage ${naam}`, description: 'Intakerapportage gegenereerd door de Intake-Rapportage Tool',
    sections: [{
      properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
      headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: 'Intakerapportage — Vertrouwelijk', color: '888888', size: 16, font: 'Arial' })], alignment: AlignmentType.RIGHT })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: 'Pagina ', color: '888888', size: 16, font: 'Arial' }), new TextRun({ children: [PageNumber.CURRENT], color: '888888', size: 16, font: 'Arial' })], alignment: AlignmentType.CENTER })] }) },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Intakerapportage_${naam.replace(/\s+/g, '_')}_${datum}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
