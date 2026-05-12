// ── BANK ───────────────────────────────────────
function addBank() { bankData.push({ iban: '', naam: '', bank: '', type: 'betaal', saldo: '', rood: false, nieuw: '', opm: '' }); renderBank(); }

function renderBank() {
  const tb = document.getElementById('bank-tbody'); tb.innerHTML = '';
  bankData.forEach((b, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input type="text" value="${b.iban || ''}" placeholder="NL00 BANK..." style="text-transform:uppercase;min-width:150px" onchange="bankData[${i}].iban=this.value"></td>
<td><input type="text" value="${b.naam || ''}" placeholder="T.n.v. ..." onchange="bankData[${i}].naam=this.value"></td>
<td><input type="text" value="${b.bank || ''}" placeholder="ING..." onchange="bankData[${i}].bank=this.value"></td>
<td><select onchange="bankData[${i}].type=this.value" style="min-width:75px"><option value="betaal" ${b.type === 'betaal' ? 'selected' : ''}>Betaal</option><option value="spaar" ${b.type === 'spaar' ? 'selected' : ''}>Spaar</option><option value="kind" ${b.type === 'kind' ? 'selected' : ''}>Kind</option><option value="anders" ${b.type === 'anders' ? 'selected' : ''}>Anders</option></select></td>
<td><div style="position:relative;min-width:80px"><span style="position:absolute;left:5px;top:50%;transform:translateY(-50%);color:var(--inkl);font-size:.77rem">€</span><input type="number" value="${b.saldo || ''}" placeholder="0" style="padding-left:15px;border:1.5px solid var(--rule);border-radius:4px;font-size:.79rem;font-family:'DM Sans',sans-serif;width:100%;outline:none" onchange="bankData[${i}].saldo=this.value"></div></td>
<td style="text-align:center"><label style="display:flex;align-items:center;gap:4px;font-size:.78rem;cursor:pointer;justify-content:center"><input type="checkbox" ${b.rood ? 'checked' : ''} style="accent-color:var(--warn);width:13px;height:13px" onchange="bankData[${i}].rood=this.checked;renderBankAlert()"><span style="color:${b.rood ? 'var(--warn)' : 'var(--inkl)'}">Rood</span></label></td>
<td><select onchange="bankData[${i}].nieuw=this.value" style="min-width:100px"><option value="" ${!b.nieuw ? 'selected' : ''}>—</option><option value="ja" ${b.nieuw === 'ja' ? 'selected' : ''}>Ja, besproken</option><option value="aanvragen" ${b.nieuw === 'aanvragen' ? 'selected' : ''}>Aanvragen</option><option value="nee" ${b.nieuw === 'nee' ? 'selected' : ''}>Niet nodig</option></select></td>
<td><input type="text" value="${b.opm || ''}" placeholder="Afspraken..." style="min-width:110px;border:1.5px solid var(--rule);border-radius:4px;font-size:.79rem;font-family:'DM Sans',sans-serif;padding:4px 6px;outline:none" onchange="bankData[${i}].opm=this.value"></td>
<td><button class="delbtn" onclick="bankData.splice(${i},1);renderBank();renderBankAlert()">✕</button></td>`;
    tb.appendChild(tr);
  }); renderBankAlert();
}

function renderBankAlert() {
  const el = document.getElementById('bank-rood-alert'); if (!el) return;
  el.innerHTML = bankData.some(b => b.rood) ? `<div class="al ag" style="margin-top:9px"><span class="aic">💡</span><div><strong>Roodstand aanwezig</strong>Adviseer nieuwe (gratis basis)bankrekening te openen. Noteer afspraken per rekening hierboven.</div></div>` : '';
}

// ── BESLAG ─────────────────────────────────────
function addBeslag() { beslagData.push({ wie: '', soort: '', bedrag: '' }); renderBeslag(); }

function renderBeslag() {
  const tb = document.getElementById('beslag-tbody'); if (!tb) return; tb.innerHTML = '';
  beslagData.forEach((b, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input type="text" value="${b.wie || ''}" placeholder="Naam schuldeiser" onchange="beslagData[${i}].wie=this.value"></td>
<td><select onchange="beslagData[${i}].soort=this.value"><option value="">—</option><option value="loonbeslag">Loonbeslag</option><option value="bankbeslag">Bankbeslag</option><option value="derdenbeslag">Derdenbeslag</option><option value="anders">Anders</option></select></td>
<td><div style="position:relative"><span style="position:absolute;left:5px;top:50%;transform:translateY(-50%);color:var(--inkl);font-size:.77rem">€</span><input type="number" value="${b.bedrag || ''}" placeholder="0" style="padding-left:16px;border:1.5px solid var(--rule);border-radius:4px;font-size:.79rem;font-family:'DM Sans',sans-serif;width:100%;outline:none" onchange="beslagData[${i}].bedrag=this.value"></div></td>
<td><button class="delbtn" onclick="beslagData.splice(${i},1);renderBeslag()">✕</button></td>`;
    tb.appendChild(tr);
  });
}
