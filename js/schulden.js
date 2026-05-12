// ── SCHULDEN ───────────────────────────────────
function addSchuld() { schuldenData.push({ s: '', t: '', subt: '', b: '', afl: '', pref: '', lei: '', st: '' }); renderSchulden(); }

function renderSchulden() {
  const tb = document.getElementById('schulden-tbody'); tb.innerHTML = '';
  schuldenData.forEach((s, i) => {
    const info = SCHULD_INFO[s.t] || { pref: '—', lei: '—' };
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input type="text" value="${s.s || ''}" placeholder="Schuldeiser" onchange="schuldenData[${i}].s=this.value" style="min-width:120px"></td>
<td><select onchange="schuldenData[${i}].t=this.value;updateSchuldInfo(${i})" style="min-width:110px">
  <option value="">—</option>
  <option value="huur" ${s.t === 'huur' ? 'selected' : ''}>Huurachterstand</option>
  <option value="energie" ${s.t === 'energie' ? 'selected' : ''}>Energieschuld</option>
  <option value="belasting" ${s.t === 'belasting' ? 'selected' : ''}>Belastingschuld</option>
  <option value="zorg" ${s.t === 'zorg' ? 'selected' : ''}>Zorgverzekeraar</option>
  <option value="krediet" ${s.t === 'krediet' ? 'selected' : ''}>Krediet/lening</option>
  <option value="incasso" ${s.t === 'incasso' ? 'selected' : ''}>Incasso</option>
  <option value="deurw" ${s.t === 'deurw' ? 'selected' : ''}>Deurwaarder</option>
  <option value="boete_mulder" ${s.t === 'boete_mulder' ? 'selected' : ''}>Boete (Mulder/CJIB)</option>
  <option value="boete_terwee" ${s.t === 'boete_terwee' ? 'selected' : ''}>Boete (Terwee/slachtoffer)</option>
  <option value="studie" ${s.t === 'studie' ? 'selected' : ''}>Studieschuld (DUO)</option>
  <option value="alimentatie" ${s.t === 'alimentatie' ? 'selected' : ''}>Alimentatieschuld</option>
  <option value="overig" ${s.t === 'overig' ? 'selected' : ''}>Overig</option>
</select>
${s.t === 'studie' ? `<div style="margin-top:4px"><select onchange="schuldenData[${i}].subt=this.value" style="font-size:.74rem;border:1.5px solid var(--rule);border-radius:4px;font-family:'DM Sans',sans-serif;padding:3px;width:100%;outline:none"><option value="">Aflosfase?</option><option value="nog_niet" ${s.subt === 'nog_niet' ? 'selected' : ''}>Nog geen aflosplicht</option><option value="lopend" ${s.subt === 'lopend' ? 'selected' : ''}>Lopend aflossing</option><option value="achterstand" ${s.subt === 'achterstand' ? 'selected' : ''}>Achterstand</option></select></div>` : ''}
</td>
<td><div style="position:relative;min-width:80px"><span style="position:absolute;left:5px;top:50%;transform:translateY(-50%);color:var(--inkl);font-size:.77rem">€</span><input type="number" value="${s.b || ''}" placeholder="0" style="padding-left:16px;border:1.5px solid var(--rule);border-radius:4px;font-size:.79rem;font-family:'DM Sans',sans-serif;width:100%;outline:none" onchange="schuldenData[${i}].b=this.value;updateSchTot()"></div></td>
<td><div style="position:relative;min-width:75px"><span style="position:absolute;left:5px;top:50%;transform:translateY(-50%);color:var(--inkl);font-size:.77rem">€</span><input type="number" value="${s.afl || ''}" placeholder="0" style="padding-left:16px;border:1.5px solid var(--rule);border-radius:4px;font-size:.79rem;font-family:'DM Sans',sans-serif;width:100%;outline:none" onchange="schuldenData[${i}].afl=this.value"></div></td>
<td id="pref-${i}" style="font-size:.72rem;color:var(--inkl);min-width:85px">${info.pref}</td>
<td id="lei-${i}" style="font-size:.72rem;color:var(--inkl);min-width:100px">${info.lei}</td>
<td><select onchange="schuldenData[${i}].st=this.value" style="min-width:90px"><option value="">—</option><option value="lopend">Lopend</option><option value="ach">Achterstand</option><option value="deurw">Deurwaarder</option><option value="betw">Betwist</option><option value="afg">Afgelost</option></select></td>
<td><button class="delbtn" onclick="schuldenData.splice(${i},1);renderSchulden();updateSchTot()">✕</button></td>`;
    tb.appendChild(tr);
  }); updateSchTot();
}

function updateSchuldInfo(i) {
  const t = schuldenData[i].t; const info = SCHULD_INFO[t] || { pref: '—', lei: '—' };
  const prefEl = document.getElementById(`pref-${i}`); const leiEl = document.getElementById(`lei-${i}`);
  if (prefEl) prefEl.textContent = info.pref; if (leiEl) leiEl.textContent = info.lei;
  renderSchulden();// re-render to show studieschuld dropdown
}

function updateSchTot() {
  const tot = schuldenData.reduce((s, d) => s + (parseFloat(d.b) || 0), 0);
  const r = document.getElementById('schulden-tot-row');
  if (tot > 0) { document.getElementById('schulden-tot').textContent = `€ ${tot.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`; r.classList.remove('hidden'); }
}
