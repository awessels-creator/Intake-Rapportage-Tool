// ── INKOMEN (meerdere bronnen) ──────────────────
function addInkomstenbron() { inkomenData.push({ bron: '', type: '', netto: '', uren: '', beslag: false }); renderInkomen(); }

function renderInkomen() {
  const tb = document.getElementById('inkomen-tbody'); tb.innerHTML = '';
  let heeftBeslag = false;
  inkomenData.forEach((d, i) => {
    if (d.beslag) heeftBeslag = true;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input type="text" value="${d.bron || ''}" placeholder="Naam werkgever / instantie" onchange="inkomenData[${i}].bron=this.value"></td>
<td><select onchange="inkomenData[${i}].type=this.value;updateInkomen()">
  <option value="">—</option>
  <option value="loon" ${d.type === 'loon' ? 'selected' : ''}>Loon/salaris</option>
  <option value="bijstand" ${d.type === 'bijstand' ? 'selected' : ''}>Bijstand (PW)</option>
  <option value="aow" ${d.type === 'aow' ? 'selected' : ''}>AOW/pensioen</option>
  <option value="aio" ${d.type === 'aio' ? 'selected' : ''}>AIO (SVB)</option>
  <option value="ww" ${d.type === 'ww' ? 'selected' : ''}>WW-uitkering</option>
  <option value="wia" ${d.type === 'wia' ? 'selected' : ''}>WIA/WAO</option>
  <option value="zzp" ${d.type === 'zzp' ? 'selected' : ''}>ZZP/ondernemer</option>
  <option value="anders" ${d.type === 'anders' ? 'selected' : ''}>Anders</option>
</select></td>
<td><div style="position:relative;min-width:90px"><span style="position:absolute;left:5px;top:50%;transform:translateY(-50%);color:var(--inkl);font-size:.77rem">€</span><input type="number" value="${d.netto || ''}" placeholder="0" style="padding-left:16px;border:1.5px solid var(--rule);border-radius:4px;font-size:.79rem;font-family:'DM Sans',sans-serif;width:100%;outline:none" onchange="inkomenData[${i}].netto=this.value;updateInkomen()"></div></td>
<td><input type="text" value="${d.uren || ''}" placeholder="Bijv. 32u / vast" onchange="inkomenData[${i}].uren=this.value"></td>
<td style="text-align:center"><label style="display:flex;align-items:center;gap:4px;font-size:.78rem;cursor:pointer;justify-content:center"><input type="checkbox" ${d.beslag ? 'checked' : ''} style="accent-color:var(--warn);width:13px;height:13px" onchange="inkomenData[${i}].beslag=this.checked;renderInkomen()"><span>Ja</span></label></td>
<td><button class="delbtn" onclick="inkomenData.splice(${i},1);renderInkomen();updateInkomen()">✕</button></td>`;
    tb.appendChild(tr);
  });
  document.getElementById('beslag-tabel-block').classList.toggle('hidden', !heeftBeslag);
}

function getTotaalInkomen() {
  const bronnen = inkomenData.reduce((s, d) => s + (parseFloat(d.netto) || 0), 0);
  const alimPart = gRV('alim_ontvangen') === 'ja' ? (parseFloat(document.getElementById('alim_partner')?.value) || 0) : 0;
  const alimKind = gRV('alim_ontvangen') === 'ja' ? (parseFloat(document.getElementById('alim_kind')?.value) || 0) : 0;
  return bronnen + alimPart + alimKind;
}

// ── INKOMEN ADVIEZEN ───────────────────────────
function updateInkomen() {
  const norm = parseFloat(document.getElementById('bijstandsnorm').value) || 0;
  const ink = getTotaalInkomen();
  const sEl = document.getElementById('norm-status'), aEl = document.getElementById('inkomen-adv');
  const iitBlock = document.getElementById('iit-inkomen-block');
  const ls = document.getElementById('leefsituatie').value, isPensioen = ls.startsWith('pensioen');
  if (!norm || !ink) { if (sEl) sEl.innerHTML = ''; if (aEl) aEl.innerHTML = ''; return; }
  const pct = ink / norm * 100;
  const bc = pct < 100 ? 'red' : pct < 105 ? 'orange' : pct < 120 ? 'yellow' : 'blue';
  if (sEl) sEl.innerHTML = `<span class="nb ${bc}">● ${pct.toFixed(1)}% van bijstandsnorm (€${norm.toLocaleString('nl-NL')})</span>`;
  let h = '';
  if (pct < 100) h += `<div class="al aw"><span class="aic">⚠️</span><div><strong>Inkomen onder bijstandsniveau</strong>€${ink.toFixed(0)} &lt; norm €${norm.toFixed(0)}. Aanvullende bijstand/AIO aanvragen.</div></div>`;
  if (pct >= 100 && pct < 105 && !isPensioen) h += `<div class="al ag"><span class="aic">⏱️</span><div><strong>IIT — tijdsduur controleren</strong>Na 3 jaar ≤120% norm kan IIT worden aangevraagd.</div></div>`;
  if (pct < 110 && !isPensioen) h += `<div class="al ai"><span class="aic">🎭</span><div><strong>FDMA — inkomen &lt;110% norm</strong>Controleer bij Regelcheck.</div></div>`;
  if (pct < 120) h += `<div class="al aok"><span class="aic">🏛️</span><div><strong>Kwijtschelding mogelijk — &lt;120% norm</strong>Controleer bij Vaste Lasten en Regelcheck.</div></div>`;
  if (aEl) aEl.innerHTML = h;
  if (iitBlock) iitBlock.style.display = (pct <= 120 && !isPensioen) ? '' : 'none';
  updateBVV(); checkSig();
}

function updateIIT() { const v = document.getElementById('iit').value; document.getElementById('iit-datum-field').style.display = (v === 'nee' || v === 'check') ? '' : 'none'; updateIITduur(); }

function updateIITduur() {
  const d = document.getElementById('iit_datum')?.value, inf = document.getElementById('iit-info'); if (!d || !inf) return;
  const jr = (new Date() - new Date(d)) / (1000 * 60 * 60 * 24 * 365.25);
  inf.textContent = jr >= 3 ? `✅ ${jr.toFixed(1)} jaar — IIT kan worden aangevraagd!` : `⏳ ${jr.toFixed(1)} jr — nog ${(3 - jr).toFixed(1)} jr te gaan`;
  inf.style.color = jr >= 3 ? 'var(--ok)' : 'var(--inkl)';
}
