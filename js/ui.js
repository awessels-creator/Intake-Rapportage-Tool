function goTo(n) {
  document.querySelectorAll('.page').forEach((p, i) => p.classList.toggle('active', i === n));
  document.querySelectorAll('.ps').forEach((s, i) => { s.classList.remove('active', 'done'); if (i === n) s.classList.add('active'); else if (i < n) s.classList.add('done'); });
  if (n === 6) initLastenTabel();
  if (n === 8) buildRegelcheck();
  if (n === 9) buildAdvies();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setRadio(name, val, el) {
  document.querySelectorAll(`[data-radio="${name}"]`).forEach(e => e.classList.remove('sel'));
  document.querySelectorAll(`input[name="${name}"]`).forEach(e => { e.checked = e.value === val; });
  el.classList.add('sel');
  if (name === 'kinderen') { updateKinderen(); }
  if (name === 'heeft_auto') { updateAutoBlock(); }
  if (name === 'heeft_partner') {
    document.getElementById('partner-block').classList.toggle('hidden', val !== 'ja');
    checkPartnerConsistentie();
  }
  if (name === 'partner_reg') { document.getElementById('partner-reden-field').style.display = val === 'nee' ? '' : 'none'; }
  if (name === 'ondernemer') { document.getElementById('ondernemer-block').classList.toggle('hidden', val === 'nee'); }
  if (name === 'crisis') { document.getElementById('crisis-block').classList.toggle('hidden', val !== 'ja'); }
  if (name === 'flank') { document.getElementById('flank-block').classList.toggle('hidden', val !== 'ja'); }
  if (name === 'alim_ontvangen') { document.getElementById('alim-block').classList.toggle('hidden', val !== 'ja'); updateInkomen(); }
}

function gRV(name) { const c = document.querySelector(`input[name="${name}"]:checked`); return c ? c.value : null; }

function setTW(name, val, el) {
  twState[name] = val;
  el.closest('.tw').querySelectorAll('.twb').forEach(b => b.className = 'twb');
  el.className = `twb s${val}`;
  if (name.startsWith('avp') || name === 'inboedel' || name === 'opstal' || name === 'uitvaart') checkVerzekeringSignalen();
  if (name === 'auto_verm') { const n = document.getElementById('auto-note'); if (n) { n.textContent = val === 'behoud' ? 'Vastgelegd: behouden' : val === 'verkoop' ? 'Vastgelegd: verkopen' : 'Nog niet besproken'; } }
}

function getTW(name) { return twState[name] || ''; }
