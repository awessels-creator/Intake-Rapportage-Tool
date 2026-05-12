// ── KINDEREN ───────────────────────────────────
function updateKinderen() {
  const h = gRV('kinderen') === 'ja';
  document.getElementById('kinderen-block').classList.toggle('hidden', !h);
  if (h && kinderenData.length === 0) addKind();
  updateKindAdv();
  // alimentatie vraag tonen bij kinderen
  document.getElementById('alim-block').classList.toggle('hidden', !(gRV('alim_ontvangen') === 'ja'));
  if (h) { const alAl = document.getElementById('alim-alert'); if (alAl) alAl.innerHTML = `<div class="al ai" style="margin-top:6px"><span class="aic">💰</span><div><strong>Kinderalimentatie</strong>Cliënt heeft kinderen — controleer of kinderalimentatie ontvangen wordt en of dit als inkomstenbron is meegenomen.</div></div>`; }
  else { const alAl = document.getElementById('alim-alert'); if (alAl) alAl.innerHTML = ''; }
}

function addKind() { kinderenData.push({ naam: '', geb: '', coouder: 'nee' }); renderKinderen(); }

function renderKinderen() {
  const tb = document.getElementById('kinderen-tbody'); tb.innerHTML = '';
  kinderenData.forEach((k, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input type="text" value="${k.naam || ''}" placeholder="Naam kind" onchange="kinderenData[${i}].naam=this.value"></td>
<td><input type="date" value="${k.geb || ''}" onchange="kinderenData[${i}].geb=this.value;updateKindAdv()"></td>
<td style="font-size:.76rem;color:var(--inkl)">${lftd(k.geb)}</td>
<td><select onchange="kinderenData[${i}].coouder=this.value"><option value="nee">Nee</option><option value="ja" ${k.coouder === 'ja' ? 'selected' : ''}>Ja</option></select></td>
<td><button class="delbtn" onclick="kinderenData.splice(${i},1);renderKinderen()">✕</button></td>`;
    tb.appendChild(tr);
  }); updateKindAdv();
}

function lftd(geb) { if (!geb) return '—'; const t = new Date(), d = new Date(geb); let a = t.getFullYear() - d.getFullYear(); if (t < new Date(t.getFullYear(), d.getMonth(), d.getDate())) a--; return a >= 0 ? `${a} jr` : '—'; }
function lftdN(geb) { if (!geb) return -1; const t = new Date(), d = new Date(geb); let a = t.getFullYear() - d.getFullYear(); if (t < new Date(t.getFullYear(), d.getMonth(), d.getDate())) a--; return a; }

function updateKindAdv() {
  const el = document.getElementById('kind-adv'); if (!el || gRV('kinderen') !== 'ja') { if (el) el.innerHTML = ''; return; }
  let h = '';
  kinderenData.filter(k => k.geb).forEach(k => {
    const a = lftdN(k.geb); if (a < 0) return;
    if (a < 4) h += `<div class="al ai" style="margin-top:6px"><span class="aic">👶</span><div><strong>${k.naam || 'Kind'} (${a} jr)</strong>Check peuteropvang/VVE.</div></div>`;
    else if (a < 12) h += `<div class="al ai" style="margin-top:6px"><span class="aic">🎒</span><div><strong>${k.naam || 'Kind'} (${a} jr)</strong>Check schoolkostenfonds, sport/cultuurregelingen.</div></div>`;
    else if (a < 18) h += `<div class="al ag" style="margin-top:6px"><span class="aic">🎓</span><div><strong>${k.naam || 'Kind'} (${a} jr)</strong>OV-abonnement, schoolkosten, einde kinderbijslag bij 18e verjaardag.</div></div>`;
  });
  el.innerHTML = h;
}

function updateKindsupportAlert() {
  const el = document.getElementById('kindsupport-alert'); if (!el) return;
  el.innerHTML = gRV('kinderen') === 'ja' ? `<div class="al ap"><span class="aic">🤝</span><div><strong>Kindsupport Meppel — altijd bespreken!</strong>Cliënt heeft kinderen. Vraag naar Kindsupport Meppel en leg gebruik vast.</div></div>` : '';
}
