import type { FormState } from './types'
import { SCHULD_INFO, LASTEN_DEF, PER_OPTIES, TOESLAGEN, TOESLAG_NAMEN, BVV_MAX } from './constants'
import { getTotaalInkomen, getTotaalLasten, lftd, nl } from './utils'

export function downloadWord(state: FormState) {
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

  const aanvrLbls: Record<string, string> = {
    budgetbeheer: 'Budgetbeheer', schuldregeling: 'Schuldregeling',
    bewind_medisch: 'Beschermingsbewind (medisch)', bewind_schuld: 'Schuldenbewind',
    schuldhulpmaatje: 'Schuldhulpmaatje/Humanitas', overig_aanvr: 'Overige doorverwijzing',
  }
  const aanvraagTxt = (['budgetbeheer', 'schuldregeling', 'bewind_medisch', 'bewind_schuld', 'schuldhulpmaatje', 'overig_aanvr'] as const)
    .filter(k => state[`cb_${k}` as keyof FormState])
    .map(k => aanvrLbls[k])
    .join(', ') || '—'

  const kinderenRows = hK
    ? state.kinderenData.map(k => `<tr><td>${k.naam || '—'}</td><td>${k.geb || '—'}</td><td>${lftd(k.geb)}</td><td>${k.coouder === 'ja' ? 'Ja' : 'Nee'}</td></tr>`).join('')
    : ''

  const bankRows = state.bankData.map(b =>
    `<tr><td>${b.iban || '—'}</td><td>${b.naam || '—'}</td><td>${b.bank || '—'}</td><td>${b.type || '—'}</td><td>€ ${b.saldo || '0'}</td><td>${b.rood ? 'Ja' : 'Nee'}</td><td>${b.nieuw || '—'}</td><td>${b.opm || ''}</td></tr>`
  ).join('')

  const inkomenRows = state.inkomenData.map(d =>
    `<tr><td>${d.bron || '—'}</td><td>${d.type || '—'}</td><td>€ ${nl(parseFloat(d.netto) || 0)}</td><td>${d.uren || '—'}</td><td>${d.beslag ? 'Ja' : 'Nee'}</td></tr>`
  ).join('')

  const beslagRows = state.beslagData.filter(b => b.wie).map(b =>
    `<tr><td>${b.wie}</td><td>${b.soort || '—'}</td><td>${b.bedrag ? '€ ' + b.bedrag + '/mnd' : 'Onbekend'}</td></tr>`
  ).join('')

  const allDef = [
    ...LASTEN_DEF,
    ...state.lastenExtra.map((e, i) => ({ id: `extra_${i}`, post: e.post || 'Eigen post', per: 'mnd', autoOnly: false as const, kinderOnly: false as const })),
  ]
  const lastenRows = allDef
    .filter(row => {
      if (row.autoOnly && state.heeft_auto !== 'ja') return false
      if (row.kinderOnly && !hK) return false
      const w = state.lastenWaarden[row.id]
      return w && parseFloat(w.bedrag) > 0
    })
    .map(row => {
      const w = state.lastenWaarden[row.id]
      const bdr = parseFloat(w.bedrag) || 0
      const factor = PER_OPTIES.find(p => p.v === w.per)?.f || 1
      const mnd = bdr * factor
      return `<tr><td>${row.post}</td><td>€ ${nl(bdr)} ${PER_OPTIES.find(p => p.v === w.per)?.l || '/mnd'}</td><td>€ ${mnd.toFixed(2)}/mnd</td><td style="font-size:9pt">${w.opm || ''}</td></tr>`
    })
    .join('')
    + `<tr style="background:#eef7f2;font-weight:bold"><td colspan="2">Totaal vaste lasten</td><td>€ ${tot.toFixed(2)}/mnd</td><td></td></tr>`
    + `<tr style="background:${best < 0 ? '#fdf3ef' : '#eef7f2'};font-weight:bold"><td colspan="2">Besteedbaar</td><td style="color:${best < 0 ? '#9d3d1d' : '#1a4b2d'}">€ ${best.toFixed(2)}/mnd</td><td></td></tr>`

  const schuldenRows = state.schuldenData.filter(s => s.s || s.b).map(s =>
    `<tr><td>${s.s || '—'}</td><td>${s.t || '—'}${s.subt ? ' (' + s.subt + ')' : ''}</td><td>€ ${nl(parseFloat(s.b) || 0)}</td><td>${s.afl ? '€ ' + s.afl + '/mnd' : '—'}</td><td>${(SCHULD_INFO[s.t] || {}).pref || '—'}</td><td>${(SCHULD_INFO[s.t] || {}).lei || '—'}</td><td>${s.st || '—'}</td></tr>`
  ).join('')

  const toeslagenRows = TOESLAGEN.map(t => {
    const actief = state.toeslagenActief[t]
    const v = state.toeslagenBedrag[t]
    const bes = state.toeslagenBeslag[t]
    return `<tr><td>${TOESLAG_NAMEN[t]}</td><td>${actief ? '✅ Actief' : '—'}</td><td>${actief && v ? '€ ' + parseFloat(v).toLocaleString('nl-NL') : '—'}</td><td>${actief && bes ? '⚠️ Ja' : 'Nee'}</td></tr>`
  }).join('')

  const verzItems = [
    { n: 'AVP (aansprakelijkheid)', v: state.tw_avp },
    { n: 'Inboedelverzekering', v: state.tw_inboedel },
    { n: 'Uitvaartverzekering', v: state.tw_uitvaart },
    ...(state.eigen_woning === 'ja' ? [{ n: 'Opstalverzekering', v: state.tw_opstal }] : []),
    { n: 'Zorgverzekering (aanv.)', v: state.tw_zorgaanv },
  ]
  const verzKleur = (v: string) => v === 'ja' ? 'color:#1a4b2d' : v === 'nee' ? 'color:#9d3d1d' : 'color:#7a5010'
  const verzTekst = (v: string) => v === 'ja' ? '✅ Aanwezig' : v === 'nee' ? '✗ Niet aanwezig' : v === 'aanvr' ? '→ Aanvragen' : v === 'nvt' ? 'N.v.t.' : '—'
  const verzRows = verzItems.map(item => `<tr><td>${item.n}</td><td style="font-weight:600;${verzKleur(item.v)}">${verzTekst(item.v)}</td></tr>`).join('')

  const advHtml = state.advItems.filter(a => a.on).map(a =>
    `<div style="margin:4px 0;padding:6px 10px;border-left:4px solid ${a.p === 'urg' ? '#e76f51' : a.p === 'med' ? '#b5853a' : '#02706d'};background:${a.p === 'urg' ? '#fdf3ef' : a.p === 'med' ? '#fdf6e9' : '#e8eeee'}"><strong>${a.t}</strong><br>${a.b}</div>`
  ).join('')

  const crisisItems = ['cr_water', 'cr_energie', 'cr_ontruiming', 'cr_anders']
    .filter(k => state[k as keyof FormState])
    .map(k => ({ cr_water: 'water', cr_energie: 'energie', cr_ontruiming: 'ontruiming', cr_anders: 'anders' }[k] || k))

  const tdS = 'style="border:1px solid #ccc;padding:4px 7px"'

  const html = `<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8"><title>Intakerapportage ${naam}</title>
<style>body{font-family:Arial,sans-serif;font-size:10.5pt;color:#111111;margin:1.8cm;line-height:1.5}h1{font-size:17pt;border-bottom:3px solid #ea5403;padding-bottom:5px}h2{font-size:11.5pt;color:#ea5403;margin-top:15px;margin-bottom:4px;border-bottom:1px solid #e0e0e0;padding-bottom:2px}h3{font-size:10.5pt;color:#555555;margin-top:9px;margin-bottom:3px}table{border-collapse:collapse;width:100%;font-size:9.5pt;margin-top:4px}th{background:#ea5403;color:#fff;padding:4px 7px;text-align:left}td{padding:4px 7px;border:1px solid #e0e0e0}tr:nth-child(even)td{background:#f2f2f2}.nt td{border:none!important;background:transparent!important;color:#555}.meta{color:#666;font-size:9pt}.footer{margin-top:26px;border-top:1px solid #e0e0e0;padding-top:6px;font-size:8.5pt;color:#888}</style>
</head><body>
<h1>Intakerapportage Geldzorgen Schuldhulpverlening</h1>
<p class="meta">Datum: ${datum} | Consulent: ${consulent} | Cliëntnr: ${state.clientnr || '—'} | <em>Vertrouwelijk</em></p>

<h2>1. Cliëntgegevens</h2>
<table class="nt" style="border:none">
<tr><td ${tdS} style="width:150px">Naam</td><td ${tdS} style="font-weight:600">${naam}</td><td ${tdS} style="width:120px">Geboortedatum</td><td ${tdS}>${state.geboortedatum || '—'}</td></tr>
<tr><td ${tdS}>BSN</td><td ${tdS}>${state.bsn || '—'}</td><td ${tdS}>Burgerlijke staat</td><td ${tdS}>${state.burgstaat || '—'}</td></tr>
<tr><td ${tdS}>Adres</td><td ${tdS}>${state.adres || '—'}</td><td ${tdS}>Woonplaats</td><td ${tdS}>${state.woonplaats || '—'}</td></tr>
<tr><td ${tdS}>Telefoon</td><td ${tdS}>${state.telefoon || '—'}</td><td ${tdS}>E-mail</td><td ${tdS}>${state.email || '—'}</td></tr>
<tr><td ${tdS}>Nationaliteit</td><td ${tdS}>${state.nationaliteit || '—'}</td><td ${tdS}>Leefsituatie</td><td ${tdS}>${ls || '—'}</td></tr></table>
${state.heeft_partner === 'ja' ? `<h3>Partner</h3><table class="nt"><tr><td style="width:150px">Naam</td><td>${state.partner_vnaam || ''} ${state.partner_anaam || ''}</td><td style="width:120px">Geboortedatum</td><td>${state.partner_geb || '—'}</td></tr><tr><td>BSN partner</td><td>${state.partner_bsn || '—'}</td><td>In regeling?</td><td>${state.partner_reg || '—'}</td></tr></table>` : ''}
${kinderenRows ? `<h3>Kinderen (thuiswonend)</h3><table><thead><tr><th>Naam</th><th>Geboortedatum</th><th>Leeftijd</th><th>Co-ouderschap</th></tr></thead><tbody>${kinderenRows}</tbody></table>` : ''}

<h2>2. Persoonlijke omstandigheden</h2>
${state.persoonlijk ? `<h3>Woonsituatie / netwerk</h3><p style="font-size:9.5pt">${state.persoonlijk}</p>` : ''}
${state.opleiding_toel ? `<h3>Opleiding / werkervaring / perspectief</h3><p style="font-size:9.5pt">${state.opleiding_toel}</p>` : ''}
${state.flank === 'ja' ? `<h3>Flankerende hulpverlening</h3><p style="font-size:9.5pt">${state.flank_inst || '—'} — ${state.flank_naam || '—'} (${state.flank_contact || '—'}) — ${state.flank_aard || '—'}</p>` : ''}

<h2>3. Aanvraag & Crisis</h2>
<table class="nt"><tr><td style="width:150px">Aanvraag voor</td><td>${aanvraagTxt}</td></tr>
<tr><td>Crisis</td><td>${state.crisis === 'ja' ? 'Ja' + (crisisItems.length ? ' (' + crisisItems.join(', ') + ')' : '') + (state.crisis_toelichting ? ' — ' + state.crisis_toelichting : '') : 'Nee'}</td></tr>
<tr><td>Eerdere aanvragen</td><td>${state.eerder_aanvr === 'ja' ? 'Ja — ' + (state.eerder_aanvr_toel || '') : 'Nee'}</td></tr></table>
<h3>Reden aanmelding / hulpvraag</h3><p style="font-size:9.5pt">${state.hulpvraag || '—'}</p>

<h2>4. Bankrekening(en)</h2>
${bankRows ? `<table><thead><tr><th>IBAN</th><th>Tenaamstelling</th><th>Bank</th><th>Type</th><th>Saldo</th><th>Roodstand</th><th>Nieuwe rek. besproken</th><th>Afspraken</th></tr></thead><tbody>${bankRows}</tbody></table>` : '<p style="font-size:9.5pt">Geen bankrekeningen geregistreerd.</p>'}

<h2>5. Onderneming</h2>
<p style="font-size:9.5pt">${!state.ondernemer || state.ondernemer === 'nee' ? 'Geen onderneming.' : state.ondernemer === 'actief' ? `Actief — ${state.kvk_naam || '?'}, KvK: ${state.kvk_nr || '?'}` : `Gestopt — ${state.kvk_naam || '?'}, KvK: ${state.kvk_nr || '?'}, uitgeschreven: ${state.kvk_datum || '?'}`}</p>
${state.ondernemer && state.ondernemer !== 'nee' ? `<p style="font-size:9.5pt">Boekhouding: ${state.boekhouding || '—'} | Aangiften: ${state.aangifte || '—'}</p>${state.kvk_toel ? `<p style="font-size:9.5pt"><em>${state.kvk_toel}</em></p>` : ''}` : ''}

<h2>6. Vermogen</h2>
<table class="nt"><tr><td style="width:150px">Spaargeld</td><td>€ ${nl(parseFloat(state.spaargeld) || 0)}</td><td style="width:120px">Beleggingen</td><td>€ ${nl(parseFloat(state.beleggingen) || 0)}</td></tr>
<tr><td>Eigen woning</td><td>${state.eigen_woning === 'ja' ? 'Ja (koop)' : 'Nee (huur)'}</td><td>Overig vermogen</td><td>€ ${nl(parseFloat(state.overig_verm) || 0)}</td></tr>
${state.heeft_auto === 'ja' ? `<tr><td>Auto/motor</td><td>${state.auto_kenteken || ''} ${state.auto_merk || ''} | dagwaarde €${nl(parseFloat(state.auto_waarde) || 0)}</td><td>Behoud/verkoop</td><td>${state.auto_verm || '—'}</td></tr>` : ''}</table>
<h3>Verzekeringen</h3>
<table><thead><tr><th>Verzekering</th><th>Status</th></tr></thead><tbody>${verzRows}</tbody></table>

<h2>7. Inkomen (per 1 jan 2026)</h2>
<table class="nt"><tr><td style="width:150px">Bijstandsnorm</td><td>€ ${nl(norm)}/mnd</td><td style="width:120px">Totaal inkomen</td><td>€ ${nl(ink)}/mnd (${pct.toFixed(0)}% van norm)</td></tr>
${state.alim_ontvangen === 'ja' ? `<tr><td>Alimentatie ontvangen</td><td>Partner: €${state.alim_partner || '0'}/mnd | Kind: €${state.alim_kind || '0'}/mnd | Via LBIO: ${state.alim_lbio || '—'}</td></tr>` : ''}</table>
${inkomenRows ? `<h3>Inkomstenbronnen</h3><table><thead><tr><th>Bron / Werkgever</th><th>Type</th><th>Netto/mnd</th><th>Dienstverband</th><th>Beslag?</th></tr></thead><tbody>${inkomenRows}</tbody></table>` : ''}
${beslagRows ? `<h3>Beslagleggende schuldeisers</h3><table><thead><tr><th>Schuldeiser</th><th>Soort</th><th>Bedrag</th></tr></thead><tbody>${beslagRows}</tbody></table>` : ''}
<p style="font-size:9.5pt">IIT: ${state.iit || '—'}</p>

<h2>8. Toeslagen</h2>
<table><thead><tr><th>Regeling</th><th>Status</th><th>Bedrag</th><th>Beslag?</th></tr></thead><tbody>${toeslagenRows}</tbody></table>
<p style="font-size:9.5pt">FDMA: ${state.fdma || '—'} | Kindsupport Meppel: ${state.kindsupport || '—'}</p>

<h2>9. Vaste Lasten</h2>
<table><thead><tr><th>Post</th><th>Bedrag (periode)</th><th>Per maand</th><th>Opmerking</th></tr></thead><tbody>${lastenRows}</tbody></table>
<p style="font-size:9.5pt">Kwijtschelding GBLT: ${state.kwgt || '—'} | Kwijtschelding gemeente: ${state.kwgm || '—'}</p>

<h2>9a. Beslagvrije Voet (indicatief, jan 2026)</h2>
<table class="nt"><tr><td style="width:200px">Toe te passen BVV</td><td style="font-weight:bold">€ ${bvv.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td><td style="width:200px">Max. voor beslag beschikbaar</td><td style="font-weight:bold;color:${ink - bvv > 0 ? '#1a4b2d' : '#9d3d1d'}">€ ${(ink - bvv).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td></tr></table>

<h2>10. Schulden</h2>
${schuldenRows ? `<table><thead><tr><th>Schuldeiser</th><th>Soort</th><th>Openstaand</th><th>Aflossing</th><th>Preferent</th><th>Schone lei?</th><th>Status</th></tr></thead><tbody>${schuldenRows}</tbody></table><p style="font-weight:bold;font-size:9.5pt;margin-top:4px">Geschatte schuldenlast: € ${nl(schulden)}</p>` : '<p style="font-size:9.5pt">Geen schulden geregistreerd.</p>'}
<p style="font-size:9.5pt">Gezamenlijke schulden ex-partner: ${state.sch_exparter || '—'} | Voedselbank: ${state.voedselbank || '—'}</p>
${state.schulden_opm ? `<p style="font-size:9.5pt"><em>${state.schulden_opm}</em></p>` : ''}

<h2>11. Adviezen & Actiepunten</h2>
${advHtml || '<p style="font-size:9.5pt">Geen adviezen.</p>'}
${state.conclusie ? `<h2>12. Conclusie / Afspraken / Afsluiting</h2><p style="font-size:10pt">${state.conclusie.replace(/\n/g, '<br>')}</p>` : ''}

<div class="footer">Rapportage: ${new Date().toLocaleDateString('nl-NL')} | Consulent: ${consulent} | Cliëntnr: ${state.clientnr || '—'} | Vertrouwelijk — Geldzorgen Schuldhulpverlening Meppel 2026</div>
</body></html>`

  const blob = new Blob([html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Intakerapportage_${naam.replace(/\s+/g, '_')}_${datum}.doc`
  a.click()
  URL.revokeObjectURL(url)
}
