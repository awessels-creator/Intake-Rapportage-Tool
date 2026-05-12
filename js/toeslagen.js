// ── TOESLAGEN ──────────────────────────────────
function toggleT(naam) {
  const cb = document.getElementById(`t-${naam}`);
  // Blokkeer huurtoeslag bij koopwoning
  if (naam === 'huur' && cb.checked && document.getElementById('eigen_woning').value === 'ja') {
    cb.checked = false;
    const sig = document.getElementById('ts-huur');
    if (sig) { sig.className = 'tsig w'; sig.style.display = 'block'; sig.textContent = '🚫 Koopwoning — geen recht op huurtoeslag'; setTimeout(() => { if (sig) sig.className = 'tsig'; }, 4000); }
    return;
  }
  const c = cb.checked;
  document.getElementById(`ta-${naam}`).classList.toggle('hidden', !c);
  document.getElementById(`tc-${naam}`).classList.toggle('on', c);
}

function checkSig() {
  const norm = parseFloat(document.getElementById('bijstandsnorm').value) || 0;
  const ink = getTotaalInkomen();
  const hK = gRV('kinderen') === 'ja';
  const ls = document.getElementById('leefsituatie').value, isPensioen = ls.startsWith('pensioen');
  const huurBdr = lastenWaarden['huur']?.bedrag ? parseFloat(lastenWaarden['huur'].bedrag) || 0 : 0;
  const sig = (id, ok, msg) => { const s = document.getElementById(`ts-${id}`); if (!s) return; s.className = ok ? 'tsig ok' : 'tsig w'; s.textContent = ok ? '✓ Plausibel' : msg; };
  // HUUR
  if (document.getElementById('t-huur')?.checked) {
    const isKoop = document.getElementById('eigen_woning').value === 'ja'; const v = parseFloat(document.getElementById('tv-huur').value) || 0;
    if (isKoop) sig('huur', false, '🚫 Koopwoning: geen recht op huurtoeslag');
    else if (v > 0) { let ok = true, m = ''; if (v < 30 || v > 950) { ok = false; m = '⚠️ Ongebruikelijk (normaal €30–€950/mnd)'; } else if (norm && ink > norm * 1.45) { ok = false; m = '⚠️ Inkomen lijkt te hoog voor huurtoeslag'; } else if (huurBdr > 0 && v > huurBdr * 0.9) { ok = false; m = '⚠️ Huurtoeslag bijna gelijk aan huurprijs — klopt zelden'; } sig('huur', ok, m); } else document.getElementById('ts-huur').className = 'tsig';
  }
  // ZORG
  if (document.getElementById('t-zorg')?.checked) { const v = parseFloat(document.getElementById('tv-zorg').value) || 0; if (v > 0) { let ok = true, m = ''; if (v < 10 || v > 165) { ok = false; m = '⚠️ Ongebruikelijk (normaal €10–€160/mnd)'; } else if (norm && ink > norm * 1.55) { ok = false; m = '⚠️ Inkomen lijkt te hoog'; } sig('zorg', ok, m); } else document.getElementById('ts-zorg').className = 'tsig'; }
  // KINDERBIJSLAG
  if (document.getElementById('t-kinderbijslag')?.checked) { const v = parseFloat(document.getElementById('tv-kinderbijslag').value) || 0; if (!hK && v > 0) sig('kinderbijslag', false, '⚠️ Kinderbijslag maar geen kinderen geregistreerd'); else if (v > 0 && (v < 80 || v > 900)) sig('kinderbijslag', false, '⚠️ Bedrag ongebruikelijk (normaal €80–€900/kwartaal)'); else if (v > 0) sig('kinderbijslag', true, ''); else document.getElementById('ts-kinderbijslag').className = 'tsig'; }
  // KOT
  if (document.getElementById('t-kinderopvang')?.checked) { const v = parseFloat(document.getElementById('tv-kinderopvang').value) || 0; if (!hK && v > 0) sig('kinderopvang', false, '⚠️ KOT maar geen kinderen'); else { document.getElementById('ts-kinderopvang').className = v > 0 ? 'tsig ok' : 'tsig'; if (v > 0) document.getElementById('ts-kinderopvang').textContent = '✓ Geregistreerd'; } }
  // WKB
  if (document.getElementById('t-kindgebonden')?.checked) { const v = parseFloat(document.getElementById('tv-kindgebonden').value) || 0; if (!hK && v > 0) sig('kindgebonden', false, '⚠️ WKB maar geen kinderen'); else if (norm && ink > norm * 1.6 && v > 0) sig('kindgebonden', false, '⚠️ Inkomen lijkt te hoog voor WKB'); else { document.getElementById('ts-kindgebonden').className = v > 0 ? 'tsig ok' : 'tsig'; if (v > 0) document.getElementById('ts-kindgebonden').textContent = '✓ Geregistreerd'; } }
  // AIO
  if (document.getElementById('t-aio')?.checked) { const v = parseFloat(document.getElementById('tv-aio').value) || 0; if (!isPensioen && v > 0) sig('aio', false, '⚠️ AIO alleen voor pensioengerechtigden (SVB)'); else { document.getElementById('ts-aio').className = v > 0 ? 'tsig ok' : 'tsig'; if (v > 0) document.getElementById('ts-aio').textContent = '✓ Geregistreerd'; } }
  // Ontbrekende toeslagen
  const ontbr = document.getElementById('toeslag-ontbr'); if (!ontbr) return; let h = '';
  if (hK) {
    if (!document.getElementById('t-kinderopvang')?.checked) h += `<div class="al ag" style="margin-top:7px"><span class="aic">🔔</span><div><strong>KOT niet geregistreerd</strong>Vraag na of kinderopvang wordt gebruikt.</div></div>`;
    if (!document.getElementById('t-kinderbijslag')?.checked) h += `<div class="al ai" style="margin-top:7px"><span class="aic">👶</span><div><strong>Kinderbijslag (AKW) niet geregistreerd</strong>Controleer SVB.</div></div>`;
  }
  ontbr.innerHTML = h;
}
