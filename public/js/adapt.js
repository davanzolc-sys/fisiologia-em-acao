/* adaptações crônicas ao treino aeróbio e destreino */
{
const FA = window.FA, $ = FA.$, nf = FA.nf;
/* id, nome, ganho máx (%), tau treino (sem), tau destreino (sem), texto */
const VARS = [
  ['vp', 'Volume plasmático', 10, .6, .6, 'É a adaptação mais rápida: em 1 a 2 semanas o plasma aumenta ~10% (mais albumina e retenção de sódio). Melhora o enchimento do coração e a termorregulação. Também é a primeira a sumir no destreino, em dias.'],
  ['vs', 'Volume sistólico máximo', 15, 4, 3, 'No começo sobe pelo plasma maior; depois pela hipertrofia excêntrica do ventrículo esquerdo (cavidade maior). É o principal responsável pelo aumento do VO₂máx.'],
  ['vo2', 'VO₂máx', 18, 6, 5, 'Em sedentários sobe 15 a 20% em alguns meses, com grande variação individual (há quem responda pouco). No destreino cai ~7% nas primeiras 3 semanas e se estabiliza acima do nível inicial depois de alguns meses (Coyle et al., 1984; revisão de Barbieri et al., 2024).'],
  ['fcr', 'FC de repouso', -12, 6, 4, 'Cai por aumento do tônus vagal e do volume sistólico. Uma das adaptações mais fáceis de acompanhar com o aluno.'],
  ['mito', 'Enzimas oxidativas mitocondriais', 45, 4, 2.5, 'Sobem 40 a 50% em poucas semanas (Holloszy e Coyle, 1984): mais mitocôndrias, mais oxidação de gordura, menos lactato. Meia-vida de ~12 dias no destreino, por isso some rápido.'],
  ['cap', 'Capilares por fibra', 20, 8, 10, 'Crescem mais devagar e duram mais. Aumentam o tempo de trânsito do sangue e a extração de O₂.'],
  ['lt', 'Limiar de lactato (posição)', 18, 6, 3, 'O limiar vai para a direita: de ~55% para ~65% do VO₂máx ou mais. Para desempenho em provas longas, pesa tanto quanto o VO₂máx.'],
  ['gli', 'Glicogênio muscular de repouso', 25, 3, 2, 'Mais glicogênio guardado e mais capacidade de poupá-lo usando gordura.']
];
const A = {w: 12, d: 0, sel: 'vo2'};
const val = (v, t, w) => { const g = v[2] * (1 - Math.exp(-Math.min(t, w) / v[3])); return t <= w ? g : g * Math.exp(-(t - w) / v[4]); };

$('#a-w').addEventListener('input', e => { A.w = +e.target.value; render(true); });
$('#a-d').addEventListener('input', e => { A.d = +e.target.value; render(true); });
$('#a-list').addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) { A.sel = b.dataset.a; render(); } });

function render(fs) {
  ['w', 'd'].forEach(k => { const el = $('#a-' + k); if (!fs) el.value = A[k]; FA.rangeFill(el); });
  $('#a-o-w').textContent = A.w + ' semanas'; $('#a-o-d').textContent = A.d ? A.d + ' semanas' : 'nenhum';
  const now = A.w + A.d;
  $('#a-list').innerHTML = VARS.map(v => { const x = val(v, now, A.w), pk = val(v, A.w, A.w); return `<button class="row${A.sel === v[0] ? ' on' : ''}" data-a="${v[0]}" style="--c:var(--red)"><span>${v[1]}</span><span class="v">${x >= 0 ? '+' : '−'}${nf(Math.abs(x), 0)}%</span><span class="d">${A.d ? '<span class="dn">pico ' + (pk >= 0 ? '+' : '−') + nf(Math.abs(pk), 0) + '%</span>' : ''}</span></button>`; }).join('');
  const xmax = Math.max(12, Math.ceil((now + 2) / 4) * 4), ts = []; for (let t = 0; t <= now + 1e-9; t += .25) ts.push(t);
  const series = VARS.filter(v => v[0] !== A.sel).map(v => ({pts: ts.map(t => [t, val(v, t, A.w)]), color: 'var(--line2)', w: 1.5}));
  const sv = VARS.find(v => v[0] === A.sel);
  series.push({pts: ts.map(t => [t, val(sv, t, A.w)]), color: 'var(--red)', w: 3.5});
  const y = val(sv, now, A.w);
  const xt = []; for (let i = 0; i <= xmax; i += 4) xt.push(i);
  FA.lineChart($('#a-c1'), {xMin: 0, xMax: xmax, yMin: -15, yMax: 50, xTicks: xt, xFmt: v => v, yFmt: v => (v > 0 ? '+' : '') + v + '%', xLabel: 'semanas', yLabel: 'mudança em relação ao início (%)', hlines: [{y: 0, color: 'var(--mut)'}],
    areas: A.d ? [{pts: [[A.w, -15], [now, -15], [now, 50], [A.w, 50]], color: 'var(--blue)', op: .07}] : [],
    vlines: A.d ? [{x: A.w, color: 'var(--blue)', label: 'parou de treinar', dash: 1}] : [], series,
    point: {x: now, y, label: sv[1] + ' ' + (y >= 0 ? '+' : '−') + nf(Math.abs(y), 0) + '%'}});
  $('#a-txt').innerHTML = `<h3>${sv[1]}</h3><p>${sv[5]}</p><p class="note">Curvas típicas para um sedentário que começa treino aeróbio regular (3 a 5 vezes por semana, intensidade moderada a alta). Valores ilustrativos baseados em faixas da literatura; a resposta individual varia muito.</p>`;
}
FA.views = FA.views || {};
FA.views.adaptacoes = () => render();
FA.observe($('#a-c1'), () => { if (!$('#v-adaptacoes').hidden) render(); });
}
