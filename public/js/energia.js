/* sistemas energéticos em esforço máximo + ressíntese de PCr */
{
const FA = window.FA, $ = FA.$, nf = FA.nf;
const AER = [[5, 3], [10, 6], [15, 12], [20, 18], [30, 27], [45, 37], [60, 45], [75, 51], [90, 56], [120, 63], [180, 73], [240, 79], [360, 85], [600, 90], [900, 93]];
const PCR = [[5, .75], [10, .55], [20, .4], [30, .32], [60, .22], [120, .16], [240, .12], [900, .1]];
const interp = (tab, s) => { if (s <= tab[0][0]) return tab[0][1]; for (let i = 1; i < tab.length; i++) if (s <= tab[i][0]) { const [a, va] = tab[i - 1], [b, vb] = tab[i], f = (Math.log(s) - Math.log(a)) / (Math.log(b) - Math.log(a)); return va + (vb - va) * f; } return tab[tab.length - 1][1]; };
const split = s => { const aer = interp(AER, s), an = 100 - aer, pc = an * interp(PCR, s); return {pcr: pc, gli: an - pc, aer}; };
const SPORTS = [['100 m rasos', 10], ['200 m rasos', 21], ['50 m livre (natação)', 25], ['Série de 10 a 12 repetições', 35], ['400 m rasos', 47], ['100 m livre (natação)', 55], ['800 m', 110], ['200 m livre (natação)', 120], ['1.500 m', 220], ['400 m livre (natação)', 250], ['3.000 m', 500], ['5.000 m', 800]];
const E = {s: 30, rest: 60, tr: false, act: false};
const toS = v => Math.round(Math.exp(Math.log(5) + v / 1000 * (Math.log(900) - Math.log(5))));
const toV = s => (Math.log(s) - Math.log(5)) / (Math.log(900) - Math.log(5)) * 1000;
const fmtT = s => s < 60 ? s + ' s' : Math.floor(s / 60) + ' min' + (s % 60 ? ' ' + (s % 60) + ' s' : '');
const DEP = [[5, 35], [10, 55], [20, 72], [30, 80], [60, 85], [120, 80], [300, 70], [900, 50]];
const ACID = [[5, 0], [10, .2], [20, .6], [30, 1], [120, 1], [300, .7], [900, .3]];
/* PCr (% do repouso) após t s de descanso, depois de um esforço máximo de s segundos */
const pcrRec = (t, s, tr, act) => {
  const end = 100 - interp(DEP, s), g = interp(ACID, s);
  const tf = (tr ? 22 : 32) * (1 + .9 * g) * (act ? 1.35 : 1), sf = .2 + .35 * g, tsl = 170 * (1 + .5 * g) * (act ? 1.2 : 1);
  return end + (100 - end) * ((1 - sf) * (1 - Math.exp(-t / tf)) + sf * (1 - Math.exp(-t / tsl)));
};

$('#e-sports').innerHTML = SPORTS.map((x, i) => `<button data-i="${i}">${x[0]}</button>`).join('');
$('#e-sports').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; E.s = SPORTS[+b.dataset.i][1]; render(); });
$('#e-dur').addEventListener('input', e => { E.s = toS(+e.target.value); render(true); });
$('#e-rest').addEventListener('input', e => { E.rest = +e.target.value; render(); });
$('#e-segTr').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { E.tr = b.dataset.v === '1'; render(); } });
$('#e-segRec').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { E.act = b.dataset.v === '1'; render(); } });

function render(fromSlider) {
  const sp = split(E.s);
  if (!fromSlider) $('#e-dur').value = toV(E.s);
  FA.rangeFill($('#e-dur'));
  $('#e-o-dur').textContent = fmtT(E.s);
  FA.$$('#e-sports button').forEach(b => b.setAttribute('aria-pressed', String(SPORTS[+b.dataset.i][1] === E.s)));
  const parts = [['ATP-PCr', sp.pcr, 'var(--blue)'], ['Glicolítico', sp.gli, 'var(--amber)'], ['Oxidativo', sp.aer, 'var(--red)']];
  $('#e-bar').innerHTML = parts.map(([n, v, c]) => `<div style="width:${v}%;background:${c}" title="${n}">${v >= 12 ? nf(v, 0) + '%' : ''}</div>`).join('');
  $('#e-leg').innerHTML = parts.map(([n, v, c]) => `<div><i style="background:${c}"></i><span>${n}</span><b>${nf(v, 0)}%</b></div>`).join('');
  const dom = sp.aer >= 50 ? 'O sistema oxidativo já fornece mais da metade da energia.' : sp.pcr > sp.gli ? 'A fosfocreatina domina: potência máxima, mas acaba em segundos.' : 'A glicólise anaeróbia é a principal fonte: muita potência, acúmulo de H⁺ e fadiga rápida.';
  $('#e-txt').innerHTML = `<p><b>${fmtT(E.s)} de esforço máximo:</b> ${dom} ${E.s >= 60 && E.s <= 90 ? 'Perto de 75 s as contribuições aeróbia e anaeróbia se igualam (Gastin, 2001).' : ''}</p>
  <p>Os três sistemas funcionam juntos desde o primeiro segundo; o que muda é a proporção. ATP armazenado dura 2 a 3 s; a PCr sustenta potência máxima por ~6 a 10 s; a glicólise domina entre ~10 e 60 s; depois disso o oxidativo assume.${E.s > 240 ? ' Valores acima de 4 min são estimativas extrapoladas.' : ''}</p>`;
  const xs = []; for (let i = 0; i <= 60; i++) xs.push(Math.exp(Math.log(5) + i / 60 * (Math.log(900) - Math.log(5))));
  const a1 = xs.map(s => [s, split(s).pcr]), a2 = xs.map(s => [s, split(s).pcr + split(s).gli]);
  FA.lineChart($('#e-c1'), {xMin: 5, xMax: 900, logX: true, yMin: 0, yMax: 100, xTicks: [5, 10, 30, 60, 120, 300, 900], xFmt: s => fmtT(s).replace(' min', "'").replace(' s', 's'), yFmt: v => v + '%', yLabel: 'energia fornecida por cada sistema (%)', xLabel: 'duração do esforço máximo (escala log)',
    areas: [{pts: a1.concat([[900, 0], [5, 0]]), color: 'var(--blue)', op: .75}, {pts: a2.concat(a1.slice().reverse()), color: 'var(--amber)', op: .75}, {pts: [[5, 100], [900, 100]].concat(a2.slice().reverse()), color: 'var(--red)', op: .75}],
    vlines: [{x: E.s, color: 'var(--ink)', label: fmtT(E.s)}]});
  /* PCr */
  $('#e-rest').value = E.rest; FA.rangeFill($('#e-rest'));
  $('#e-o-rest').textContent = fmtT(E.rest);
  FA.seg($('#e-segTr'), E.tr ? '1' : '0'); FA.seg($('#e-segRec'), E.act ? '1' : '0');
  const pr = pcrRec(E.rest, E.s, E.tr, E.act), end = 100 - interp(DEP, E.s), g = interp(ACID, E.s);
  const half = (() => { const tgt = end + (100 - end) / 2; for (let t = 0; t <= 600; t++) if (pcrRec(t, E.s, E.tr, E.act) >= tgt) return t; return 600; })();
  $('#e-dep').innerHTML = `Depois de <b>${fmtT(E.s)}</b> de esforço máximo a PCr cai para cerca de <b>${nf(end, 0)}%</b> do repouso${g > .5 ? ', com o músculo bem ácido' : g > .15 ? ', com acidose moderada' : ', quase sem acidose'}. Metade do que foi gasto volta em ~${fmtT(half)}.`;
  $('#e-pcr').innerHTML = `<b>${nf(pr, 0)}%</b> da PCr de repouso`;
  const ts = []; for (let t = 0; t <= 300; t += 5) ts.push(t);
  FA.lineChart($('#e-c2'), {xMin: 0, xMax: 300, yMin: 0, yMax: 100, xTicks: [0, 30, 60, 120, 180, 240, 300], xFmt: fmtT, yFmt: v => v + '%', xLabel: 'tempo de descanso', yLabel: 'PCr (% do valor de repouso)',
    series: [{pts: ts.map(t => [t, pcrRec(t, 6, E.tr, false)]), color: 'var(--mut)', w: 2, dash: '6 5'}, {pts: ts.map(t => [t, pcrRec(t, E.s, E.tr, E.act)]), color: 'var(--blue)', w: 3}], point: {x: E.rest, y: pr, label: nf(pr, 0) + '%', color: 'var(--blue)'}});
  const why = [];
  why.push(g > .5 ? 'A acidose deixa a ressíntese mais lenta: a reação da creatina quinase depende do pH e a fase lenta da recuperação fica maior.' : 'Esforços curtos quase não acidificam o músculo, então a PCr volta rápido: em 30 a 60 s grande parte já está de volta.');
  why.push(E.tr ? 'Treinados aeróbios recuperam mais rápido, porque a ressíntese usa ATP das mitocôndrias.' : 'A ressíntese usa ATP das mitocôndrias: quem tem mais capacidade aeróbia recupera mais rápido (teste o Treinado).');
  why.push(E.act ? 'Na recuperação ativa o músculo continua gastando ATP e O₂, e a PCr volta mais devagar (Spencer et al., 2006). A ativa ajuda a remover lactato, mas atrapalha a PCr; para sprints repetidos, a passiva costuma ser melhor.' : 'Recuperação passiva favorece a PCr. A ativa remove lactato mais rápido, mas deixa a PCr voltar mais devagar.');
  why.push(E.rest <= 45 ? 'Com descanso tão curto a próxima série começa com pouca PCr e depende mais da glicólise.' : E.rest >= 150 ? 'Descanso longo: recuperação quase completa, bom para força máxima e potência. Para hipertrofia, a meta-análise mais recente mostra uma pequena vantagem para descansos acima de 60 s, provavelmente porque permitem manter mais volume (Singer et al., 2024).' : '');
  $('#e-pcrtxt').innerHTML = why.filter(Boolean).join(' ');
}
FA.views = FA.views || {};
FA.views.energia = () => render();
['#e-c1', '#e-c2'].forEach(id => FA.observe($(id), () => { if (!$('#v-energia').hidden) render(); }));
}
