// ── ADVIES ─────────────────────────────────────
function buildAdvies() {
  const norm = parseFloat(document.getElementById('bijstandsnorm').value) || 0;
  const ink = getTotaalInkomen(); const pct = norm ? ink / norm * 100 : 0;
  const ls = document.getElementById('leefsituatie').value; const hK = gRV('kinderen') === 'ja';
  const sp = (parseFloat(document.getElementById('spaargeld').value) || 0) + (parseFloat(document.getElementById('overig_verm').value) || 0) + (parseFloat(document.getElementById('beleggingen').value) || 0);
  const grens = VGRENS[ls] || 8000; const tot = getTotaalLasten(); const best = ink - tot;
  const schulden = schuldenData.reduce((s, d) => s + (parseFloat(d.b) || 0), 0);
  const naam = `${document.getElementById('voornaam').value || ''} ${document.getElementById('achternaam').value || ''}`.trim() || '—';

  document.getElementById('sum-grid').innerHTML = `
<div class="si"><div class="sl">Cliënt</div><div class="sv">${naam}</div></div>
<div class="si"><div class="sl">Inkomen</div><div class="sv">€ ${ink.toLocaleString('nl-NL')}/mnd</div></div>
<div class="si"><div class="sl">Niveau norm</div><div class="sv">${pct > 0 ? pct.toFixed(0) + '%' : '—'}</div></div>
<div class="si"><div class="sl">Vaste lasten</div><div class="sv">€ ${tot.toLocaleString('nl-NL')}/mnd</div></div>
<div class="si"><div class="sl">Besteedbaar</div><div class="sv" style="${best < 0 ? 'color:#e76f51' : 'color:#52b788'}">€ ${best.toLocaleString('nl-NL')}/mnd</div></div>
<div class="si"><div class="sl">Totaal schulden</div><div class="sv">€ ${schulden.toLocaleString('nl-NL')}</div></div>`;

  let items = [];
  if (norm && ink) {
    if (pct < 100) items.push({ p: 'urg', t: 'Aanvullende bijstand / AIO aanvragen', b: `Inkomen €${ink.toFixed(0)} onder norm €${norm.toFixed(0)}. Direct bespreken bij gemeente of SVB.`, on: true });
    if (pct >= 100 && pct < 105) items.push({ p: 'urg', t: 'IIT — tijdsduur controleren', b: 'Inkomen op bijstandsniveau. Na 3 jaar ≤120% norm kan IIT worden aangevraagd.', on: true });
    if (pct < 110) items.push({ p: 'med', t: 'FDMA aanvragen bij gemeente Meppel', b: 'Inkomen onder 110% norm.', on: true });
    if (pct < 120) items.push({ p: 'med', t: 'Kwijtschelding GBLT + gemeentelijke belastingen', b: 'Inkomen onder 120% norm. Aanvragen indien nog niet gedaan.', on: true });
  }
  if (hK) {
    items.push({ p: 'med', t: 'Kindsupport Meppel — bespreken en vastleggen', b: 'Cliënt heeft kinderen. Altijd informeren en vastleggen in dossier.', on: true });
    if (!document.getElementById('t-kinderopvang')?.checked) items.push({ p: 'low', t: 'Kinderopvangtoeslag controleren', b: 'Geen KOT geregistreerd. Navragen of kinderopvang wordt gebruikt.', on: true });
  }
  if (sp > grens) items.push({ p: 'urg', t: 'Vermogen boven vrijstellingsgrens', b: `€${sp.toLocaleString('nl-NL')} overschrijdt grens €${grens.toLocaleString('nl-NL')}.`, on: true });
  if (best < 0 && ink > 0) items.push({ p: 'urg', t: 'URGENT: Negatief besteedbaar inkomen', b: `Lasten €${tot.toLocaleString('nl-NL')} > inkomen €${ink.toLocaleString('nl-NL')}. Tekort €${Math.abs(best).toLocaleString('nl-NL')}/mnd.`, on: true });
  if (best < 0 && ink > 0) items.push({ p: 'med', t: 'Voedselbank Meppel — aanmelding bespreken', b: 'Op basis van financiële situatie voedselbank bespreken.', on: true });
  if (getTW('avp') === 'nee') items.push({ p: 'low', t: 'AVP aanvragen', b: 'Aansprakelijkheidsverzekering ontbreekt.', on: true });
  if (getTW('inboedel') === 'nee') items.push({ p: 'low', t: 'Inboedelverzekering aanvragen', b: 'Inboedelverzekering ontbreekt.', on: true });
  if (document.getElementById('eigen_woning').value === 'ja' && getTW('opstal') === 'nee') items.push({ p: 'med', t: 'Opstalverzekering afsluiten (koopwoning)', b: 'Bij koopwoning is opstalverzekering doorgaans verplicht.', on: true });
  if (items.length === 0) items.push({ p: 'low', t: 'Geen acute actiepunten', b: 'Op basis van de ingevulde gegevens geen urgente adviezen.', on: true });

  const custom = advItems.filter(a => a.custom);
  advItems = [...items, ...custom];
  renderAdvies();
}

function renderAdvies() {
  const el = document.getElementById('adv-list');
  el.innerHTML = advItems.map((a, i) => `
<div class="advi ${a.on ? a.p : 'off'}" id="advi-${i}">
  <div class="advhd">
    <input type="checkbox" class="advcb" ${a.on ? 'checked' : ''} onchange="advItems[${i}].on=this.checked;document.getElementById('advi-${i}').className='advi '+(this.checked?advItems[${i}].p:'off')">
    <div class="advtt">${a.t}</div>
    <button class="adveb" onclick="toggleAdvEdit(${i})">✏️</button>
  </div>
  <div class="advbd" id="advb-${i}">
    <span id="advtxt-${i}">${a.b}</span>
    <div id="advedit-${i}" style="display:none"><textarea class="advta" rows="2" id="advarea-${i}" oninput="advItems[${i}].b=this.value;document.getElementById('advtxt-${i}').textContent=this.value">${a.b}</textarea></div>
  </div>
</div>`).join('');
}

function toggleAdvEdit(i) { const ed = document.getElementById(`advedit-${i}`), txt = document.getElementById(`advtxt-${i}`), open = ed.style.display !== 'none'; ed.style.display = open ? 'none' : ''; txt.style.display = open ? '' : 'none'; if (!open) document.getElementById(`advarea-${i}`).focus(); }
function addCustomAdv() { advItems.push({ p: 'low', t: 'Eigen actiepunt', b: 'Beschrijf hier het actiepunt...', on: true, custom: true }); renderAdvies(); setTimeout(() => toggleAdvEdit(advItems.length - 1), 50); }
