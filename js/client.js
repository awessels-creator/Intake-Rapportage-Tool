// ── LEEFSITUATIE ───────────────────────────────
function onLsChange() {
  const ls = document.getElementById('leefsituatie').value;
  const n = NORM[ls];
  if (n) { document.getElementById('bijstandsnorm').value = n;['norm-hint', 'norm-hint2'].forEach(id => { const e = document.getElementById(id); if (e) { e.textContent = `Auto-ingevuld: €${n.toLocaleString('nl-NL')} (jan 2026, aanpasbaar)`; e.className = 'fn hi'; } }); }
  const isPensioen = ls.startsWith('pensioen');
  const pa = document.getElementById('pensioen-alert');
  pa.innerHTML = isPensioen ? `<div class="al ai" style="margin-top:7px"><span class="aic">👴</span><div><strong>Pensioengerechtigde</strong>AIO-norm via SVB. IIT en FDMA niet van toepassing. Kwijtschelding wel mogelijk.</div></div>` : '';
  if (isPensioen) { const iit = document.getElementById('iit'); if (iit) iit.value = 'nvt'; document.getElementById('iit-datum-field').style.display = 'none'; }
  updateInkomen(); updateVermogen();
  // Sync datum aanvraag
  const d = document.getElementById('datum_intake'); const d2 = document.getElementById('datum_intake2');
  if (d && d2) d2.value = d.value;
}

function checkLeeftijdPensioen() {
  const geb = document.getElementById('geboortedatum').value; if (!geb) return;
  const age = (new Date() - new Date(geb)) / (1000 * 60 * 60 * 24 * 365.25);
  const ls = document.getElementById('leefsituatie').value;
  if (age >= 67 && !ls.startsWith('pensioen')) document.getElementById('pensioen-alert').innerHTML = `<div class="al ag" style="margin-top:7px"><span class="aic">⚠️</span><div><strong>Cliënt is waarschijnlijk 67+ (pensioengerechtigde)</strong>Overweeg leefsituatie aan te passen.</div></div>`;
}

function checkPartnerConsistentie() {
  const bs = document.getElementById('burgstaat').value;
  const hp = gRV('heeft_partner');
  const needsP = (bs === 'gehuwd' || bs === 'geregistreerd' || bs === 'samenwonend');
  document.getElementById('partner-fout')?.classList.toggle('hidden', !(needsP && hp === 'nee'));
}
