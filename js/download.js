// ── DOWNLOAD ───────────────────────────────────
function downloadWord() {
  const naam = `${document.getElementById('voornaam').value || ''} ${document.getElementById('achternaam').value || ''}`.trim() || 'Onbekend';
  const datum = document.getElementById('datum_intake').value || new Date().toISOString().split('T')[0];
  const consulent = document.getElementById('naam_consulent').value || document.getElementById('naam_consulent2').value || '—';
  const norm = parseFloat(document.getElementById('bijstandsnorm').value) || 0;
  const ink = getTotaalInkomen(); const pct = norm ? ink / norm * 100 : 0;
  const tot = getTotaalLasten(); const best = ink - tot;
  const schulden = schuldenData.reduce((s, d) => s + (parseFloat(d.b) || 0), 0);
  const ls = document.getElementById('leefsituatie').value, hK = gRV('kinderen') === 'ja';
  const bvv_ber = ink <= norm ? ink * 0.95 : norm * 0.95;
  const maxKey = ls === 'samenwonend' && hK ? 'samenwonend_kind' : ls;
  const bvv = Math.min(bvv_ber, BVV_MAX[maxKey] || BVV_MAX['alleenstaand']);

  // Aanvraag
  const aanvrTypes = ['budgetbeheer', 'schuldregeling', 'bewind_medisch', 'bewind_schuld', 'schuldhulpmaatje', 'overig_aanvr'];
  const aanvrLbls = { budgetbeheer: 'Budgetbeheer', schuldregeling: 'Schuldregeling', bewind_medisch: 'Beschermingsbewind (medisch)', bewind_schuld: 'Schuldenbewind', schuldhulpmaatje: 'Schuldhulpmaatje/Humanitas', overig_aanvr: 'Overige doorverwijzing' };
  const aanvraagTxt = aanvrTypes.filter(t => document.getElementById(`cb-${t}`)?.checked).map(t => aanvrLbls[t]).join(', ') || '—';

  // Kinderen
  const kinderenRows = hK ? kinderenData.map(k => `<tr><td style="border:1px solid #ccc;padding:4px 7px">${k.naam || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${k.geb || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${lftd(k.geb)}</td><td style="border:1px solid #ccc;padding:4px 7px">${k.coouder === 'ja' ? 'Ja' : 'Nee'}</td></tr>`).join('') : '';

  // Bankrekeningen
  const bankRows = bankData.map(b => `<tr><td style="border:1px solid #ccc;padding:4px 7px">${b.iban || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${b.naam || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${b.bank || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${b.type || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">€ ${b.saldo || '0'}</td><td style="border:1px solid #ccc;padding:4px 7px">${b.rood ? 'Ja' : 'Nee'}</td><td style="border:1px solid #ccc;padding:4px 7px">${b.nieuw || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${b.opm || ''}</td></tr>`).join('');

  // Inkomen
  const inkomenRows = inkomenData.map(d => `<tr><td style="border:1px solid #ccc;padding:4px 7px">${d.bron || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${d.type || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">€ ${(parseFloat(d.netto) || 0).toLocaleString('nl-NL')}</td><td style="border:1px solid #ccc;padding:4px 7px">${d.uren || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${d.beslag ? 'Ja — zie beslagleggers' : 'Nee'}</td></tr>`).join('');
  const beslagRows = beslagData.filter(b => b.wie).map(b => `<tr><td style="border:1px solid #ccc;padding:4px 7px">${b.wie}</td><td style="border:1px solid #ccc;padding:4px 7px">${b.soort || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${b.bedrag ? '€ ' + b.bedrag + '/mnd' : 'Onbekend'}</td></tr>`).join('');

  // Lasten
  const allDef = [...LASTEN_DEF, ...lastenExtra.map((_, i) => ({ id: `extra_${i}`, post: lastenExtra[i].post || 'Eigen post' }))];
  const lastenRows = allDef.filter(row => { if (row.autoOnly && gRV('heeft_auto') !== 'ja') return false; if (row.kinderOnly && !hK) return false; const w = lastenWaarden[row.id]; return w && parseFloat(w.bedrag) > 0; }).map(row => { const w = lastenWaarden[row.id]; const bdr = parseFloat(w.bedrag) || 0; const factor = PER_OPTIES.find(p => p.v === w.per)?.f || 1; const mnd = bdr * factor; return `<tr><td style="border:1px solid #ccc;padding:4px 7px">${row.post}</td><td style="border:1px solid #ccc;padding:4px 7px">€ ${bdr.toLocaleString('nl-NL')} ${PER_OPTIES.find(p => p.v === w.per)?.l || '/mnd'}</td><td style="border:1px solid #ccc;padding:4px 7px">€ ${mnd.toFixed(2)}/mnd</td><td style="border:1px solid #ccc;padding:4px 7px;font-size:9pt">${w.opm || ''}</td></tr>`; }).join('')
    + `<tr style="background:#eef7f2;font-weight:bold"><td style="border:1px solid #ccc;padding:4px 7px" colspan="2">Totaal vaste lasten</td><td style="border:1px solid #ccc;padding:4px 7px">€ ${tot.toFixed(2)}/mnd</td><td style="border:1px solid #ccc;padding:4px 7px"></td></tr>`
    + `<tr style="background:${best < 0 ? '#fdf3ef' : '#eef7f2'};font-weight:bold"><td style="border:1px solid #ccc;padding:4px 7px" colspan="2">Besteedbaar</td><td style="border:1px solid #ccc;padding:4px 7px;color:${best < 0 ? '#9d3d1d' : '#1a4b2d'}">€ ${best.toFixed(2)}/mnd</td><td style="border:1px solid #ccc;padding:4px 7px"></td></tr>`;

  // Schulden
  const schuldenRows = schuldenData.filter(s => s.s || s.b).map(s => `<tr><td style="border:1px solid #ccc;padding:4px 7px">${s.s || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${s.t || '—'}${s.subt ? ' (' + s.subt + ')' : ''}</td><td style="border:1px solid #ccc;padding:4px 7px">€ ${(parseFloat(s.b) || 0).toLocaleString('nl-NL')}</td><td style="border:1px solid #ccc;padding:4px 7px">${s.afl ? '€ ' + s.afl + '/mnd' : '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${(SCHULD_INFO[s.t] || {}).pref || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${(SCHULD_INFO[s.t] || {}).lei || '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${s.st || '—'}</td></tr>`).join('');

  // Toeslagen
  const tln = ['huur', 'zorg', 'kinderbijslag', 'kinderopvang', 'kindgebonden', 'bijzondere', 'aio'];
  const tnm = { huur: 'Huurtoeslag', zorg: 'Zorgtoeslag', kinderbijslag: 'Kinderbijslag (AKW)', kinderopvang: 'Kinderopvangtoeslag', kindgebonden: 'Kindgebonden budget', bijzondere: 'Bijzondere bijstand', aio: 'AIO (SVB)' };
  const toeslagenRows = tln.map(t => { const c = document.getElementById(`t-${t}`)?.checked, v = document.getElementById(`tv-${t}`)?.value, b = document.getElementById(`tbes-${t}`)?.checked; return `<tr><td style="border:1px solid #ccc;padding:4px 7px">${tnm[t]}</td><td style="border:1px solid #ccc;padding:4px 7px">${c ? '✅ Actief' : '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${c && v ? '€ ' + parseFloat(v).toLocaleString('nl-NL') : '—'}</td><td style="border:1px solid #ccc;padding:4px 7px">${c && b ? '⚠️ Ja' : 'Nee'}</td></tr>`; }).join('');

  // Verzekeringen — tabel
  const verzItems = [
    { n: 'AVP (aansprakelijkheid)', v: getTW('avp') },
    { n: 'Inboedelverzekering', v: getTW('inboedel') },
    { n: 'Uitvaartverzekering', v: getTW('uitvaart') },
    ...(document.getElementById('eigen_woning').value === 'ja' ? [{ n: 'Opstalverzekering', v: getTW('opstal') }] : []),
    { n: 'Zorgverzekering (aanv.)', v: getTW('zorgaanv') },
  ];
  const verzKleur = (v) => v === 'ja' ? 'color:#1a4b2d' : v === 'nee' ? 'color:#9d3d1d' : 'color:#7a5010';
  const verzTekst = (v) => v === 'ja' ? '✅ Aanwezig' : v === 'nee' ? '✗ Niet aanwezig' : v === 'aanvr' ? '→ Aanvragen' : v === 'nvt' ? 'N.v.t.' : '—';
  const verzRows = verzItems.map(item => `<tr><td style="border:1px solid #ccc;padding:4px 7px">${item.n}</td><td style="border:1px solid #ccc;padding:4px 7px;font-weight:600;${verzKleur(item.v)}">${verzTekst(item.v)}</td></tr>`).join('');

  // Adviezen
  const advHtml = advItems.filter(a => a.on).map(a => `<div style="margin:4px 0;padding:6px 10px;border-left:4px solid ${a.p === 'urg' ? '#e76f51' : a.p === 'med' ? '#b5853a' : '#52b788'};background:${a.p === 'urg' ? '#fdf3ef' : a.p === 'med' ? '#fdf6e9' : '#eef7f2'}"><strong>${a.t}</strong><br>${a.b}</div>`).join('');
  const crisisItems = ['cr-water', 'cr-energie', 'cr-ontruiming', 'cr-anders'].filter(id => document.getElementById(id)?.checked).map(id => ({ 0: 'water', 1: 'energie', 2: 'ontruiming', 3: 'anders' }[['cr-water', 'cr-energie', 'cr-ontruiming', 'cr-anders'].indexOf(id)]));

  const html = `<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8"><title>Intakerapportage ${naam}</title>
<style>body{font-family:Arial,sans-serif;font-size:10.5pt;color:#1a1a2e;margin:1.8cm;line-height:1.5}h1{font-size:17pt;border-bottom:3px solid #2d6a4f;padding-bottom:5px}h2{font-size:11.5pt;color:#2d6a4f;margin-top:15px;margin-bottom:4px;border-bottom:1px solid #d8d4c8;padding-bottom:2px}h3{font-size:10.5pt;color:#4a4a6a;margin-top:9px;margin-bottom:3px}table{border-collapse:collapse;width:100%;font-size:9.5pt;margin-top:4px}th{background:#2d6a4f;color:#fff;padding:4px 7px;text-align:left}td{padding:4px 7px;border:1px solid #ccc}tr:nth-child(even)td{background:#f7f9f7}.nt td{border:none!important;background:transparent!important;color:#555}.meta{color:#666;font-size:9pt}.footer{margin-top:26px;border-top:1px solid #ccc;padding-top:6px;font-size:8.5pt;color:#888}</style>
</head><body>
<h1>Intakerapportage Geldzorgen Schuldhulpverlening</h1>
<p class="meta">Datum: ${datum} | Consulent: ${consulent} | Cliëntnr: ${document.getElementById('clientnr').value || '—'} | <em>Vertrouwelijk</em></p>

<h2>1. Cliëntgegevens</h2>
<table class="nt" style="border:none">
<tr><td style="width:150px">Naam</td><td style="font-weight:600">${naam}</td><td style="width:120px">Geboortedatum</td><td>${document.getElementById('geboortedatum').value || '—'}</td></tr>
<tr><td>BSN</td><td>${document.getElementById('bsn').value || '—'}</td><td>Burgerlijke staat</td><td>${document.getElementById('burgstaat').value || '—'}</td></tr>
<tr><td>Adres</td><td>${document.getElementById('adres').value || '—'}</td><td>Woonplaats</td><td>${document.getElementById('woonplaats').value || '—'}</td></tr>
<tr><td>Telefoon</td><td>${document.getElementById('telefoon').value || '—'}</td><td>E-mail</td><td>${document.getElementById('email').value || '—'}</td></tr>
<tr><td>Nationaliteit</td><td>${document.getElementById('nationaliteit').value || '—'}</td><td>Leefsituatie</td><td>${ls || '—'}</td></tr></table>
${gRV('heeft_partner') === 'ja' ? `<h3>Partner</h3><table class="nt"><tr><td style="width:150px">Naam</td><td>${document.getElementById('partner_vnaam').value || ''} ${document.getElementById('partner_anaam').value || ''}</td><td style="width:120px">Geboortedatum</td><td>${document.getElementById('partner_geb').value || '—'}</td></tr><tr><td>BSN partner</td><td>${document.getElementById('partner_bsn').value || '—'}</td><td>In regeling?</td><td>${gRV('partner_reg') || '—'}</td></tr></table>` : ''}
${kinderenRows ? `<h3>Kinderen (thuiswonend)</h3><table><thead><tr><th>Naam</th><th>Geboortedatum</th><th>Leeftijd</th><th>Co-ouderschap</th></tr></thead><tbody>${kinderenRows}</tbody></table>` : ''}

<h2>2. Persoonlijke omstandigheden</h2>
${document.getElementById('persoonlijk').value ? `<h3>Woonsituatie / netwerk</h3><p style="font-size:9.5pt">${document.getElementById('persoonlijk').value}</p>` : ''}
${document.getElementById('opleiding_toel').value ? `<h3>Opleiding / werkervaring / perspectief</h3><p style="font-size:9.5pt">${document.getElementById('opleiding_toel').value}</p>` : ''}
${gRV('flank') === 'ja' ? `<h3>Flankerende hulpverlening</h3><p style="font-size:9.5pt">${document.getElementById('flank_inst').value || '—'} — ${document.getElementById('flank_naam').value || '—'} (${document.getElementById('flank_contact').value || '—'}) — ${document.getElementById('flank_aard').value || '—'}</p>` : ''}

<h2>3. Aanvraag & Crisis</h2>
<table class="nt"><tr><td style="width:150px">Aanvraag voor</td><td>${aanvraagTxt}</td></tr>
<tr><td>Crisis</td><td>${gRV('crisis') === 'ja' ? 'Ja' + (crisisItems.length ? ' (' + crisisItems.join(', ') + ')' : '') + (document.getElementById('crisis_toelichting').value ? ' — ' + document.getElementById('crisis_toelichting').value : '') : 'Nee'}</td></tr>
<tr><td>Eerdere aanvragen</td><td>${gRV('eerder_aanvr') === 'ja' ? 'Ja — ' + (document.getElementById('eerder_aanvr_toel').value || '') : 'Nee'}</td></tr></table>
<h3>Reden aanmelding / hulpvraag</h3><p style="font-size:9.5pt">${document.getElementById('hulpvraag').value || '—'}</p>

<h2>4. Bankrekening(en)</h2>
${bankRows ? `<table><thead><tr><th>IBAN</th><th>Tenaamstelling</th><th>Bank</th><th>Type</th><th>Saldo</th><th>Roodstand</th><th>Nieuwe rek. besproken</th><th>Afspraken</th></tr></thead><tbody>${bankRows}</tbody></table>` : '<p style="font-size:9.5pt">Geen bankrekeningen geregistreerd.</p>'}

<h2>5. Onderneming</h2>
<p style="font-size:9.5pt">${!gRV('ondernemer') || gRV('ondernemer') === 'nee' ? 'Geen onderneming.' : gRV('ondernemer') === 'actief' ? `Actief — ${document.getElementById('kvk_naam').value || '?'}, KvK: ${document.getElementById('kvk_nr').value || '?'}` : `Gestopt — ${document.getElementById('kvk_naam').value || '?'}, KvK: ${document.getElementById('kvk_nr').value || '?'}, uitgeschreven: ${document.getElementById('kvk_datum').value || '?'}`}</p>
${gRV('ondernemer') !== 'nee' && gRV('ondernemer') ? `<p style="font-size:9.5pt">Boekhouding: ${gRV('boekhouding') || '—'} | Aangiften: ${gRV('aangifte') || '—'}</p>${document.getElementById('kvk_toel').value ? `<p style="font-size:9.5pt"><em>${document.getElementById('kvk_toel').value}</em></p>` : ''}` : ''}

<h2>6. Vermogen</h2>
<table class="nt"><tr><td style="width:150px">Spaargeld</td><td>€ ${(parseFloat(document.getElementById('spaargeld').value) || 0).toLocaleString('nl-NL')}</td><td style="width:120px">Beleggingen</td><td>€ ${(parseFloat(document.getElementById('beleggingen').value) || 0).toLocaleString('nl-NL')}</td></tr>
<tr><td>Eigen woning</td><td>${document.getElementById('eigen_woning').value === 'ja' ? 'Ja (koop)' : 'Nee (huur)'}</td><td>Overig vermogen</td><td>€ ${(parseFloat(document.getElementById('overig_verm').value) || 0).toLocaleString('nl-NL')}</td></tr>
${gRV('heeft_auto') === 'ja' ? `<tr><td>Auto/motor</td><td>${document.getElementById('auto_kenteken').value || ''} ${document.getElementById('auto_merk').value || ''} | dagwaarde €${(parseFloat(document.getElementById('auto_waarde').value) || 0).toLocaleString('nl-NL')}</td><td>Behoud/verkoop</td><td>${getTW('auto_verm') || '—'}</td></tr>` : ''}</table>
<h3>Verzekeringen</h3>
<table><thead><tr><th>Verzekering</th><th>Status</th></tr></thead><tbody>${verzRows}</tbody></table>

<h2>7. Inkomen (per 1 jan 2026)</h2>
<table class="nt"><tr><td style="width:150px">Bijstandsnorm</td><td>€ ${norm.toLocaleString('nl-NL')}/mnd</td><td style="width:120px">Totaal inkomen</td><td>€ ${ink.toLocaleString('nl-NL')}/mnd (${pct.toFixed(0)}% van norm)</td></tr>
${gRV('alim_ontvangen') === 'ja' ? `<tr><td>Alimentatie ontvangen</td><td>Partner: €${document.getElementById('alim_partner').value || '0'}/mnd | Kind: €${document.getElementById('alim_kind').value || '0'}/mnd | Via LBIO: ${gRV('alim_lbio') || '—'}</td></tr>` : ''}</table>
${inkomenRows ? `<h3>Inkomstenbronnen</h3><table><thead><tr><th>Bron / Werkgever</th><th>Type</th><th>Netto/mnd</th><th>Dienstverband</th><th>Beslag?</th></tr></thead><tbody>${inkomenRows}</tbody></table>` : ''}
${beslagRows ? `<h3>Beslagleggende schuldeisers</h3><table><thead><tr><th>Schuldeiser</th><th>Soort</th><th>Bedrag</th></tr></thead><tbody>${beslagRows}</tbody></table>` : ''}
<p style="font-size:9.5pt">IIT: ${document.getElementById('iit')?.value || '—'}</p>

<h2>8. Toeslagen</h2>
<table><thead><tr><th>Regeling</th><th>Status</th><th>Bedrag</th><th>Beslag?</th></tr></thead><tbody>${toeslagenRows}</tbody></table>
<p style="font-size:9.5pt">FDMA: ${document.getElementById('fdma')?.value || '—'} | Kindsupport Meppel: ${document.getElementById('kindsupport')?.value || '—'}</p>

<h2>9. Vaste Lasten</h2>
<table><thead><tr><th>Post</th><th>Bedrag (periode)</th><th>Per maand</th><th>Opmerking</th></tr></thead><tbody>${lastenRows}</tbody></table>
<p style="font-size:9.5pt">Kwijtschelding GBLT: ${document.getElementById('kwgt')?.value || '—'} | Kwijtschelding gemeente: ${document.getElementById('kwgm')?.value || '—'}</p>

<h2>9a. Beslagvrije Voet (indicatief, jan 2026)</h2>
<table class="nt"><tr><td style="width:200px">Toe te passen BVV</td><td style="font-weight:bold">€ ${bvv.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td><td style="width:200px">Max. voor beslag beschikbaar</td><td style="font-weight:bold;color:${ink - bvv > 0 ? '#1a4b2d' : '#9d3d1d'}">€ ${(ink - bvv).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td></tr></table>

<h2>10. Schulden</h2>
${schuldenRows ? `<table><thead><tr><th>Schuldeiser</th><th>Soort</th><th>Openstaand</th><th>Aflossing</th><th>Preferent</th><th>Schone lei?</th><th>Status</th></tr></thead><tbody>${schuldenRows}</tbody></table><p style="font-weight:bold;font-size:9.5pt;margin-top:4px">Geschatte schuldenlast: € ${schulden.toLocaleString('nl-NL')}</p>` : '<p style="font-size:9.5pt">Geen schulden geregistreerd.</p>'}
<p style="font-size:9.5pt">Gezamenlijke schulden ex-partner: ${document.getElementById('sch-exparter').value || '—'} | Voedselbank: ${document.getElementById('voedselbank')?.value || '—'}</p>
${document.getElementById('schulden_opm').value ? `<p style="font-size:9.5pt"><em>${document.getElementById('schulden_opm').value}</em></p>` : ''}

<h2>11. Adviezen & Actiepunten</h2>
${advHtml || '<p style="font-size:9.5pt">Geen adviezen.</p>'}
${document.getElementById('conclusie').value ? `<h2>12. Conclusie / Afspraken / Afsluiting</h2><p style="font-size:10pt">${document.getElementById('conclusie').value.replace(/\n/g, '<br>')}</p>` : ''}

<div class="footer">Rapportage: ${new Date().toLocaleDateString('nl-NL')} | Consulent: ${consulent} | Cliëntnr: ${document.getElementById('clientnr').value || '—'} | Vertrouwelijk — Geldzorgen Schuldhulpverlening Meppel 2026</div>
</body></html>`;

  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `Intakerapportage_${naam.replace(/\s+/g, '_')}_${datum}.doc`; a.click(); URL.revokeObjectURL(url);
}
