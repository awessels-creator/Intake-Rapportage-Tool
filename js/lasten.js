// ── VASTE LASTEN ───────────────────────────────
function initLastenTabel() {
  const hA = gRV('heeft_auto') === 'ja';
  const hK = gRV('kinderen') === 'ja';
  const ls = document.getElementById('leefsituatie').value;
  const nibud = NIBUD[ls];
  const tbody = document.getElementById('lasten-tbody'); tbody.innerHTML = '';
  const allDef = [...LASTEN_DEF, ...lastenExtra.map((e, i) => ({ id: `extra_${i}`, post: e.post || 'Eigen post', per: 'mnd', vast: false, extra: true, extraIdx: i }))];
  allDef.forEach(row => {
    if (row.autoOnly && !hA) return;
    if (row.kinderOnly && !hK) return;
    const w = lastenWaarden[row.id] || { bedrag: '', per: row.per || 'mnd', opm: '' };
    const nibHint = row.id === 'leef' && nibud ? ` (NIBUD: ±€${nibud}/mnd)` : '';
    const isGblt = row.gblt;
    const tr = document.createElement('tr'); tr.id = `lrow-${row.id}`;
    const perOpts = PER_OPTIES.map(p => `<option value="${p.v}" ${(w.per || row.per) === p.v ? 'selected' : ''}>${p.l}</option>`).join('');
    const maandEl = `<span id="lmnd-${row.id}" style="font-size:.72rem;color:var(--inkl);min-width:55px;display:inline-block"></span>`;
    tr.innerHTML = `<td class="lpost">${row.post}${row.extra ? `<button class="delbtn" style="font-size:.75rem" onclick="removeLastenExtra(${row.extraIdx})">✕</button>` : ''}</td>
<td class="lamt"><div class="ec"><input type="number" value="${w.bedrag || ''}" placeholder="0" id="lbdr-${row.id}" oninput="updateLastenRij('${row.id}')" style="padding:4px 6px 4px 16px;border:1.5px solid var(--rule);border-radius:4px;font-size:.79rem;font-family:'DM Sans',sans-serif;width:100%;outline:none"></div></td>
<td class="lper"><select id="lper-${row.id}" onchange="updateLastenRij('${row.id}')" style="font-size:.75rem;padding:3px 4px;border:1.5px solid var(--rule);border-radius:4px;font-family:'DM Sans',sans-serif;width:100%;outline:none">${perOpts}</select></td>
<td>${maandEl}</td>
<td class="lnote"><input type="text" value="${w.opm || ''}" placeholder="${row.id === 'leef' ? 'Bijv. boodschappen, kleding, persoonlijke verzorging' + nibHint : 'Bijzonderheden, achterstand, wie betaalt, kortingen...'}${isGblt ? ' | Kwijtschelding: zie Regelcheck' : ''}" id="lopm-${row.id}" onchange="lastenWaarden['${row.id}']={...(lastenWaarden['${row.id}']||{}),opm:this.value}" style="border:1.5px solid var(--rule);border-radius:4px;font-size:.79rem;font-family:'DM Sans',sans-serif;padding:4px 6px;width:100%;outline:none"></td>`;
    tbody.appendChild(tr);
    updateLastenRij(row.id);
  });
  updateLastenTotaal();
  checkVerzekeringLastenConsistentie();
}

function updateLastenRij(id) {
  const bdrEl = document.getElementById(`lbdr-${id}`); const perEl = document.getElementById(`lper-${id}`); const mndEl = document.getElementById(`lmnd-${id}`);
  if (!bdrEl || !perEl || !mndEl) return;
  const bdr = parseFloat(bdrEl.value) || 0; const per = perEl.value;
  const factor = PER_OPTIES.find(p => p.v === per)?.f || 1;
  const mnd = bdr * factor;
  lastenWaarden[id] = { bedrag: bdrEl.value, per, opm: document.getElementById(`lopm-${id}`)?.value || '' };
  mndEl.textContent = bdr > 0 ? `→ €${mnd.toFixed(2)}/mnd` : '';
  updateLastenTotaal();
  if (id === 'wa' || id === 'uitvaart') checkVerzekeringLastenConsistentie();
}

function getTotaalLasten() {
  const hA = gRV('heeft_auto') === 'ja'; const hK = gRV('kinderen') === 'ja';
  const allDef = [...LASTEN_DEF, ...lastenExtra.map((_, i) => ({ id: `extra_${i}` }))];
  return allDef.reduce((s, row) => {
    if (row.autoOnly && !hA) return s; if (row.kinderOnly && !hK) return s;
    const w = lastenWaarden[row.id]; if (!w || !w.bedrag) return s;
    const bdr = parseFloat(w.bedrag) || 0; const factor = PER_OPTIES.find(p => p.v === (w.per || 'mnd'))?.f || 1;
    return s + bdr * factor;
  }, 0);
}

function updateLastenTotaal() {
  const tot = getTotaalLasten();
  document.getElementById('lasten-totaal').textContent = `€ ${tot.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`;
  const ink = getTotaalInkomen();
  const row = document.getElementById('bvr-row'), sp = document.getElementById('besteedbaar');
  if (ink && tot) { const b = ink - tot; sp.textContent = `€ ${b.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`; row.className = b < 0 ? 'bvr neg' : 'bvr pos'; }
  else { sp.textContent = '—'; row.className = 'bvr'; }
  updateGbltAdv(); updateBVV();
}

function addLastenRij() {
  lastenExtra.push({ post: '', per: 'mnd' });
  const idx = lastenExtra.length - 1;
  initLastenTabel();
  // Focus on new row
  setTimeout(() => { const el = document.getElementById(`lbdr-extra_${idx}`); if (el) el.focus(); }, 100);
}

function removeLastenExtra(i) { lastenExtra.splice(i, 1); initLastenTabel(); }

// ── VERZEKERING ↔ LASTEN CONSISTENTIE ──────────
function checkVerzekeringLastenConsistentie() {
  const el = document.getElementById('verzekering-lasten-sigs'); if (!el) return;
  let h = '';
  // WA/inboedel
  const twInb = getTW('inboedel'); const waBdr = parseFloat(document.getElementById('lbdr-wa')?.value) || 0;
  if (twInb === 'nee' && waBdr > 0) h += `<div class="al aw"><span class="aic">⚠️</span><div><strong>Tegenstrijdigheid: WA+inboedel</strong>Op tabblad Vermogen staat inboedelverzekering op "Nee", maar er is een bedrag ingevuld bij de lasten. Controleer dit.</div></div>`;
  if ((twInb === 'ja' || twInb === 'aanvr') && waBdr === 0 && twInb === 'ja') h += `<div class="al ag"><span class="aic">💡</span><div><strong>WA+inboedel: geen bedrag ingevuld</strong>Inboedelverzekering is aanwezig maar er staat geen bedrag bij de lasten. Klopt dit? (Bijv. ouders betalen?)</div></div>`;
  // Uitvaart
  const twUitv = getTW('uitvaart'); const uitvBdr = parseFloat(document.getElementById('lbdr-uitvaart')?.value) || 0;
  if (twUitv === 'nee' && uitvBdr > 0) h += `<div class="al aw"><span class="aic">⚠️</span><div><strong>Tegenstrijdigheid: uitvaartverzekering</strong>Op tabblad Vermogen staat uitvaartverzekering op "Nee", maar er is een bedrag ingevuld bij de lasten. Controleer dit.</div></div>`;
  if (twUitv === 'ja' && uitvBdr === 0) h += `<div class="al ag"><span class="aic">💡</span><div><strong>Uitvaartverzekering: geen bedrag ingevuld</strong>Verzekering is aanwezig maar geen lasten ingevuld. Klopt dit? (Bijv. premie via derden?)</div></div>`;
  el.innerHTML = h;
}

// ── GBLT ADVIES ────────────────────────────────
function updateGbltAdv() {
  const norm = parseFloat(document.getElementById('bijstandsnorm').value) || 0;
  const ink = getTotaalInkomen();
  const el = document.getElementById('gblt-adv'); if (!el || !norm) return;
  const pct = ink / norm * 100;
  el.innerHTML = pct > 0 && pct < 120 ? `<div class="al aok" style="margin-top:9px"><span class="aic">💡</span><div><strong>! Kwijtschelding mogelijk — inkomen &lt;120% norm</strong>Controleer bij Regelcheck of kwijtschelding GBLT + gemeentelijke belastingen is aangevraagd/gehonoreerd.</div></div>` : '';
}

// ── BVV ────────────────────────────────────────
function updateBVV() {
  const ls = document.getElementById('leefsituatie').value;
  const ink = getTotaalInkomen();
  const norm = parseFloat(document.getElementById('bijstandsnorm').value) || 0;
  const hK = gRV('kinderen') === 'ja';
  const el = document.getElementById('bvv-panel'); if (!el || !ink || !norm) return;
  const pct = ink / norm; const bvv_ber = pct <= 1 ? ink * 0.95 : norm * 0.95;
  const maxKey = ls === 'samenwonend' && hK ? 'samenwonend_kind' : ls;
  const bvv_max = BVV_MAX[maxKey] || BVV_MAX['alleenstaand'];
  const bvv = Math.min(bvv_ber, bvv_max); const inhoud = ink - bvv;
  el.innerHTML = `<div class="bvvbox"><div class="bvvt">Beslagvrije Voet (indicatief, jan 2026)</div>
<div class="bvvg">
  <div class="bvvi"><div class="bvvl">Berekende BVV</div><div class="bvvv">€ ${bvv_ber.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</div></div>
  <div class="bvvi"><div class="bvvl">Wettelijk maximum</div><div class="bvvv">€ ${bvv_max.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</div></div>
  <div class="bvvi"><div class="bvvl">Toe te passen BVV</div><div class="bvvv">€ ${bvv.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</div></div>
  <div class="bvvi"><div class="bvvl">Max. voor beslag beschikbaar</div><div class="bvvv" style="${inhoud > 0 ? 'color:#52b788' : 'color:#e76f51'}">€ ${inhoud.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</div></div>
</div>
<div class="bvvn">${pct <= 1 ? 'Laag inkomen: 95% × netto inkomen' : 'Midden/hoog inkomen: 95% × bijstandsnorm'}. Exacte berekening via uwbeslagvrijevoet.nl.</div></div>`;
}
