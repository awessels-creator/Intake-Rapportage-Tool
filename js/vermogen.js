// ── VERMOGEN ───────────────────────────────────
function updateVermogen() {
  const ls = document.getElementById('leefsituatie').value, grens = VGRENS[ls] || 8000;
  const sp = parseFloat(document.getElementById('spaargeld').value) || 0;
  const ov = parseFloat(document.getElementById('overig_verm').value) || 0;
  const bl = parseFloat(document.getElementById('beleggingen').value) || 0;
  const aw = gRV('heeft_auto') === 'ja' ? (parseFloat(document.getElementById('auto_waarde').value) || 0) : 0;
  const ew = document.getElementById('eigen_woning').value;
  document.getElementById('ow-field').style.display = ew === 'ja' ? '' : 'none';
  const owex = ew === 'ja' ? Math.max(0, (parseFloat(document.getElementById('overwaarde').value) || 0) - 67500) : 0;
  const tot = sp + ov + bl + aw + owex;
  const el = document.getElementById('vermogen-adv');
  if (tot > grens) el.innerHTML = `<div class="al aw"><span class="aic">⚠️</span><div><strong>Vermogen boven vrijstellingsgrens (€${grens.toLocaleString('nl-NL')})</strong>Totaal €${tot.toLocaleString('nl-NL')} — €${(tot - grens).toLocaleString('nl-NL')} te veel. Gevolgen voor bijstandsrecht.</div></div>`;
  else if (tot > 0) el.innerHTML = `<div class="al aok"><span class="aic">✅</span><div><strong>Vermogen binnen vrijstellingsgrens (€${grens.toLocaleString('nl-NL')})</strong>Totaal €${tot.toLocaleString('nl-NL')}.</div></div>`;
  else el.innerHTML = '';
  updateAutoAdv();
  updateVerzekeringVelden();
}

function updateVerzekeringVelden() {
  const ew = document.getElementById('eigen_woning').value;
  document.getElementById('opstal-field').style.display = ew === 'ja' ? '' : 'none';
}

function updateAutoBlock() {
  const h = gRV('heeft_auto') === 'ja';
  document.getElementById('auto-block').classList.toggle('hidden', !h);
  // lasten rows will be handled by initLastenTabel
}

function updateAutoAdv() {
  const el = document.getElementById('auto-adv'); if (!el || gRV('heeft_auto') !== 'ja') { if (el) el.innerHTML = ''; return; }
  const w = parseFloat(document.getElementById('auto_waarde').value) || 0, n = document.getElementById('auto-note');
  let h = '';
  if (w > 3000) h += `<div class="al ag" style="margin-top:7px"><span class="aic">🚗</span><div><strong>Autowaarde >€3.000</strong>Telt als vermogen. Noodzaak goed vastleggen.</div></div>`;
  const r = document.getElementById('auto_reden').value;
  if (r === 'werk' || r === 'medisch') { n.textContent = '✅ Werk/medisch = sterke grond voor behoud'; n.style.color = 'var(--ok)'; }
  else if (r === 'geen') { n.textContent = '⚠️ Geen bijzondere reden — verkoop kan worden verlangd'; n.style.color = 'var(--warn)'; }
  else n.textContent = '';
  el.innerHTML = h;
}

// ── VERZEKERING SIGNALEN ───────────────────────
function checkVerzekeringSignalen() {
  const el = document.getElementById('verzekering-sigs'); if (!el) return;
  let h = '';
  if (getTW('avp') === 'nee') h += `<div class="al ag"><span class="aic">🔔</span><div><strong>AVP ontbreekt</strong>Aansprakelijkheidsverzekering is niet aanwezig. Adviseer aanvragen.</div></div>`;
  if (getTW('inboedel') === 'nee') h += `<div class="al ag"><span class="aic">🔔</span><div><strong>Inboedelverzekering ontbreekt</strong>Adviseer aanvragen.</div></div>`;
  if (getTW('uitvaart') === 'nee') h += `<div class="al ai"><span class="aic">ℹ️</span><div><strong>Uitvaartverzekering ontbreekt</strong>Bespreek wenselijkheid.</div></div>`;
  if (document.getElementById('eigen_woning').value === 'ja' && getTW('opstal') === 'nee') h += `<div class="al aw"><span class="aic">⚠️</span><div><strong>Opstalverzekering ontbreekt bij koopwoning</strong>Bij hypotheek doorgaans verplicht.</div></div>`;
  el.innerHTML = h;
  checkVerzekeringLastenConsistentie();
}
