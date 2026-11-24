/* curva de dissociação da oxi-hemoglobina */
{
const FA = window.FA, $ = FA.$, nf = FA.nf;
const N = 2.7;
const H0 = {temp: 37, ph: 7.40, pco2: 40, dpg: 5, pa: 95, pv: 40, hb: 15, fet: false};
const H = {...H0};
const PRE = [
  ['Repouso', {...H0}],
  ['Músculo em exercício intenso', {...H0, temp: 40, ph: 7.20, pco2: 60, pv: 20}],
  ['Altitude (3.600 m) aclimatado', {...H0, dpg: 6.5, pa: 55, pv: 30, ph: 7.45, pco2: 30}],
  ['Hemoglobina fetal', {...H0, fet: true, pa: 30, pv: 20}],
  ['Hipotermia e alcalose', {...H0, temp: 34, ph: 7.55, pco2: 28}]
];
const p50 = h => h.fet ? 19 : 10 ** (Math.log10(26.8) + .024 * (h.temp - 37) - .48 * (h.ph - 7.4) + .06 * Math.log10(h.pco2 / 40)) + 1.2 * (h.dpg - 5);
const sat = (po2, P) => po2 <= 0 ? 0 : 100 / (1 + (P / po2) ** N);
const IDS = ['temp', 'ph', 'pco2', 'dpg', 'pa', 'pv'];

$('#h-pre').innerHTML = PRE.map((x, i) => `<button data-i="${i}">${x[0]}</button>`).join('');
$('#h-pre').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; Object.assign(H, PRE[+b.dataset.i][1]); render(); });
IDS.forEach(id => $('#h-' + id).addEventListener('input', e => { H[id] = +e.target.value; H.fet = false; render(true); }));

function render(fromSlider) {
  IDS.forEach(id => { const el = $('#h-' + id); if (!fromSlider) el.value = H[id]; FA.rangeFill(el); });
  $('#h-o-temp').textContent = nf(H.temp, 1) + ' °C'; $('#h-o-ph').textContent = nf(H.ph, 2); $('#h-o-pco2').textContent = H.pco2 + ' mmHg';
  $('#h-o-dpg').textContent = nf(H.dpg, 1) + ' mmol/L'; $('#h-o-pa').textContent = H.pa + ' mmHg'; $('#h-o-pv').textContent = H.pv + ' mmHg';
  FA.$$('#h-pre button').forEach(b => { const q = PRE[+b.dataset.i][1]; b.setAttribute('aria-pressed', String(Object.keys(q).every(k => q[k] === H[k]))); });
  const P = p50(H), Pn = 26.8;
  const xs = []; for (let x = 0; x <= 120; x += 1) xs.push(x);
  const sa = sat(H.pa, P), sv = sat(H.pv, P), san = sat(H.pa, Pn), svn = sat(H.pv, Pn);
  const ent = (sa - sv) / 100 * 1.34 * H.hb, entN = (san - svn) / 100 * 1.34 * H.hb;
  FA.lineChart($('#h-c1'), {xMin: 0, xMax: 120, yMin: 0, yMax: 100, xTicks: [0, 20, 40, 60, 80, 100, 120], yFmt: v => v + '%', xLabel: 'PO₂ (mmHg)', yLabel: 'saturação da hemoglobina (%)',
    series: [{pts: xs.map(x => [x, sat(x, Pn)]), color: 'var(--mut)', w: 2, dash: '6 5'}, {pts: xs.map(x => [x, sat(x, P)]), color: 'var(--red)', w: 3.5}],
    hlines: [{y: 50, label: 'P50', color: 'var(--mut)'}],
    vlines: [{x: H.pa, color: 'var(--red)', label: 'arterial'}, {x: H.pv, color: 'var(--blue)', label: 'venoso', row: 1}],
    areas: [{pts: [[H.pv, sv], [H.pa, sv], [H.pa, sa], [H.pv, sa]], color: 'var(--amber)', op: .18}]});
  const shift = P - Pn;
  $('#h-kpi').innerHTML = [
    ['P50', nf(P, 1) + ' mmHg', Math.abs(shift) < .5 ? 'normal (26,8)' : shift > 0 ? 'curva para a direita' : 'curva para a esquerda'],
    ['SaO₂ / SvO₂', nf(sa, 0) + '% / ' + nf(sv, 0) + '%', 'extração ' + nf((sa - sv) / sa * 100, 0) + '%'],
    ['O₂ entregue', nf(ent, 1) + ' mL/100 mL', (ent - entN >= 0 ? '+' : '−') + nf(Math.abs(ent - entN), 1) + ' vs. curva normal']
  ].map(([a, b, c]) => `<div><span>${a}</span><b>${b}</b><i>${c}</i></div>`).join('');
  $('#h-txt').innerHTML = H.fet ? `<p><b>Hemoglobina fetal:</b> liga 2,3-DPG mal e tem P50 ~19 mmHg. Com curva à esquerda, ela "puxa" O₂ do sangue materno na placenta mesmo com PO₂ baixa.</p>` :
    `<p>${shift > .5 ? '<b>Curva deslocada para a direita (efeito Bohr):</b> a Hb solta O₂ com mais facilidade. É o que acontece no músculo ativo: mais calor, mais CO₂, mais H⁺ e mais 2,3-DPG. Na mesma PO₂ venosa, mais O₂ sai para o tecido.' : shift < -.5 ? '<b>Curva para a esquerda:</b> a Hb segura o O₂. Ajuda a carregar O₂ no pulmão quando a PO₂ é baixa, mas dificulta a entrega no tecido.' : (H.dpg > 5.5 && H.ph > 7.42 ? '<b>Efeitos que se anulam:</b> na altitude o 2,3-DPG sobe (desloca para a direita), mas a hiperventilação causa alcalose (desloca para a esquerda). O resultado é uma P50 quase normal: carrega bem no pulmão e ainda entrega no tecido.' : 'Curva normal. Mexa na temperatura, no pH, no CO₂ ou no 2,3-DPG para ver o deslocamento.')}</p>
     <p>Repare no formato em S: na parte plana (PO₂ acima de ~60) a saturação quase não muda, por isso a SpO₂ se mantém até ~2.500 m de altitude. Na parte íngreme (20 a 40 mmHg, onde estão os capilares musculares) pequenas quedas de PO₂ liberam muito O₂.</p>`;
}
FA.views = FA.views || {};
FA.views.hemoglobina = () => render();
FA.observe($('#h-c1'), () => { if (!$('#v-hemoglobina').hidden) render(); });
}
