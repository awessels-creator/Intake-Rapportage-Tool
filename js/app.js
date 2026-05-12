// ── RESET ──────────────────────────────────────
function resetForm() {
  if (!confirm('Nieuw formulier starten? Alle gegevens worden gewist.')) return;
  document.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]),select,textarea').forEach(e => e.value = '');
  document.querySelectorAll('input[type="checkbox"]').forEach(e => e.checked = false);
  document.querySelectorAll('input[type="radio"]').forEach(e => e.checked = false);
  document.querySelectorAll('.ri').forEach(r => r.classList.remove('sel'));
  document.querySelectorAll('.tc').forEach(c => c.classList.remove('on'));
  document.querySelectorAll('.tam').forEach(a => a.classList.add('hidden'));
  document.querySelectorAll('.twb').forEach(b => b.className = 'twb');
  Object.keys(twState).forEach(k => delete twState[k]);
  kinderenData = []; schuldenData = []; bankData = []; beslagData = []; inkomenData = []; advItems = []; lastenExtra = []; lastenWaarden = {};
  ['kinderen-tbody', 'schulden-tbody', 'bank-tbody', 'beslag-tbody', 'inkomen-tbody', 'lasten-tbody'].forEach(id => { const e = document.getElementById(id); if (e) e.innerHTML = ''; });
  ['kinderen-block', 'auto-block', 'partner-block', 'ondernemer-block', 'crisis-block', 'flank-block', 'overig-aanvr-block', 'alim-block', 'beslag-tabel-block', 'partner-fout'].forEach(id => { const e = document.getElementById(id); if (e) e.classList.add('hidden'); });
  ['iit-datum-field', 'ow-field', 'opstal-field', 'partner-reden-field'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; });
  ['norm-status', 'inkomen-adv', 'kind-adv', 'toeslag-ontbr', 'gblt-adv', 'vermogen-adv', 'auto-adv', 'kindsupport-alert', 'pensioen-alert', 'bvv-panel', 'adv-list', 'sum-grid', 'bank-rood-alert', 'fdma-sig', 'verzekering-sigs', 'verzekering-lasten-sigs', 'alim-alert'].forEach(id => { const e = document.getElementById(id); if (e) e.innerHTML = ''; });
  document.getElementById('schulden-tot-row')?.classList.add('hidden');
  document.getElementById('iit-inkomen-block').style.display = '';
  document.getElementById('datum_intake').value = new Date().toISOString().split('T')[0];
  document.getElementById('datum_rapportage').value = new Date().toISOString().split('T')[0];
  addBank(); addSchuld(); addInkomstenbron(); goTo(0);
}

// ── INIT ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('datum_intake').value = new Date().toISOString().split('T')[0];
  document.getElementById('datum_rapportage').value = new Date().toISOString().split('T')[0];
  addBank(); addSchuld(); addInkomstenbron();
  document.getElementById('datum_intake').addEventListener('change', function () {
    const d2 = document.getElementById('datum_intake2'); if (d2) d2.value = this.value;
  });
});
