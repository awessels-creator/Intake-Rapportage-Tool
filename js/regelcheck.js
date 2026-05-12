// ── REGELCHECK ─────────────────────────────────
function buildRegelcheck() {
  const norm = parseFloat(document.getElementById('bijstandsnorm').value) || 0;
  const ink = getTotaalInkomen();
  const ls = document.getElementById('leefsituatie').value, isPensioen = ls.startsWith('pensioen');
  const hK = gRV('kinderen') === 'ja';
  const pct = norm ? ink / norm * 100 : 0;
  const sp = (parseFloat(document.getElementById('spaargeld').value) || 0) + (parseFloat(document.getElementById('overig_verm').value) || 0) + (parseFloat(document.getElementById('beleggingen').value) || 0);
  const grens = VGRENS[ls] || 8000;
  const tot = getTotaalLasten(); const best = ink - tot;
  let iitJr = 0; const iitD = document.getElementById('iit_datum')?.value; if (iitD) iitJr = (new Date() - new Date(iitD)) / (1000 * 60 * 60 * 24 * 365.25);

  const regels = [
    { n: 'Aanvullende bijstand / AIO', norm: `&lt; €${norm.toLocaleString('nl-NL')}/mnd`, sit: `${pct.toFixed(0)}% van norm`, r: norm && ink ? pct < 100 ? 'ja' : 'nee' : 'twijfel', t: pct < 100 ? 'Inkomen onder norm — aanvraag gemeente of SVB (pensioengerechtigden)' : 'Inkomen op of boven norm' },
    { n: 'Individuele Inkomenstoeslag (IIT)', norm: '3 jr ≤120% norm; niet voor pensioengerechtigden', sit: isPensioen ? 'Pensioengerechtigde' : `${pct.toFixed(0)}%`, r: isPensioen ? 'nvt' : !norm || !ink ? 'twijfel' : pct >= 120 ? 'nee' : iitJr >= 3 ? 'ja' : 'twijfel', t: isPensioen ? 'N.v.t.' : pct >= 120 ? 'Inkomen boven 120%' : iitJr >= 3 ? '✓ 3 jaar bereikt — aanvragen!' : iitJr > 0 ? `${iitJr.toFixed(1)} jr — nog ${(3 - iitJr).toFixed(1)} jr te gaan` : 'Startdatum niet ingevuld bij Inkomen' },
    { n: 'Kwijtschelding GBLT', norm: '&lt; 120% norm, vermogen binnen grens', sit: `${pct.toFixed(0)}%`, r: norm && ink ? pct < 120 && sp <= grens ? 'ja' : pct >= 120 ? 'nee' : 'twijfel' : 'twijfel', t: pct >= 120 ? 'Inkomen ≥120%' : sp > grens ? 'Vermogen boven grens' : 'Voldoet — aanvragen bij GBLT' },
    { n: 'Kwijtschelding gemeentelijke belastingen', norm: '&lt; 120% norm, vermogen binnen grens', sit: `${pct.toFixed(0)}%`, r: norm && ink ? pct < 120 && sp <= grens ? 'ja' : pct >= 120 ? 'nee' : 'twijfel' : 'twijfel', t: pct >= 120 ? 'Inkomen ≥120%' : 'Aanvragen bij gemeente Meppel' },
    { n: 'Huurtoeslag', norm: 'Huurwoning, inkomen &lt; inkomensgrens', sit: document.getElementById('eigen_woning').value === 'ja' ? 'Koopwoning' : `${pct.toFixed(0)}%`, r: document.getElementById('eigen_woning').value === 'ja' ? 'nvt' : norm && ink ? pct < 130 ? 'ja' : 'twijfel' : 'twijfel', t: document.getElementById('eigen_woning').value === 'ja' ? 'Koopwoning — geen recht' : 'Check Belastingdienst voor exacte inkomensgrens' },
    { n: 'Zorgtoeslag', norm: 'Laag/midden inkomen', sit: `${pct.toFixed(0)}%`, r: norm && ink ? pct < 150 ? 'ja' : 'twijfel' : 'twijfel', t: 'Controleer Belastingdienst' },
    { n: 'Kindgebonden budget (WKB)', norm: 'Kinderen &lt;18 jr, laag inkomen', sit: hK ? `Ja; ${pct.toFixed(0)}%` : 'Geen kinderen', r: hK ? pct < 130 ? 'ja' : 'twijfel' : 'nvt', t: hK ? 'Controleer Belastingdienst' : 'Geen kinderen — n.v.t.' },
    { n: 'Voedselbank Meppel', norm: 'Structureel besteedbaar tekort', sit: best < 0 ? `Tekort €${Math.abs(best).toFixed(0)}/mnd` : best < 100 ? `Krap €${best.toFixed(0)}/mnd` : `€${best.toFixed(0)}/mnd`, r: ink > 0 && tot > 0 ? best < 0 ? 'ja' : best < 100 ? 'twijfel' : 'nee' : 'twijfel', t: 'Aanmelding via gemeente of direct bij voedselbank Meppel' }
  ];
  const cC = { ja: 'chip ja', nee: 'chip nee', twijfel: 'chip twijfel', nvt: 'chip nvt' };
  const cT = { ja: '✓ Waarsch. recht', nee: '✗ Geen recht', twijfel: '? Controleren', nvt: 'N.v.t.' };
  document.getElementById('regelcheck-tbody').innerHTML = regels.map(r => `<tr><td><strong>${r.n}</strong></td><td style="font-size:.7rem">${r.norm}</td><td style="font-size:.7rem">${r.sit}</td><td><span class="${cC[r.r] || 'chip nvt'}">${cT[r.r] || '?'}</span></td><td style="font-size:.7rem;color:var(--inkl)">${r.t}</td></tr>`).join('');

  // FDMA signaal
  const fdmaSig = document.getElementById('fdma-sig');
  if (fdmaSig) {
    if (!isPensioen && pct > 0 && pct < 110) fdmaSig.innerHTML = `<div class="al aok"><span class="aic">🎭</span><div><strong>FDMA — cliënt heeft hier waarschijnlijk recht op (${pct.toFixed(0)}% norm &lt;110%)</strong>Aanvragen bij gemeente Meppel als nog niet gedaan.</div></div>`;
    else if (!isPensioen && pct >= 110 && pct > 0) fdmaSig.innerHTML = `<div class="al aw"><span class="aic">✗</span><div><strong>FDMA — inkomen te hoog (${pct.toFixed(0)}% ≥110%)</strong>Geen recht op FDMA op basis van huidig inkomen.</div></div>`;
    else if (isPensioen) fdmaSig.innerHTML = `<div class="al ai"><span class="aic">ℹ️</span><div><strong>FDMA — niet van toepassing voor pensioengerechtigden</strong></div></div>`;
    else fdmaSig.innerHTML = '';
  }
  // Kindsupport
  const ksOuter = document.getElementById('kindsupport-outer');
  if (ksOuter) ksOuter.style.display = hK ? '' : 'none';
  updateKindsupportAlert();
}
