/* exercício de força: pressão arterial, recrutamento e adaptações */
{
const FA = window.FA, $ = FA.$, nf = FA.nf;
const EX = {rosca: ['Rosca unilateral', .65], supino: ['Supino', .82], leg: ['Leg press bilateral', 1]};
const F = {ex: 'leg', pct: 75, rir: 0, val: true, view: null, w: 12, d: 0};
/* repetições máximas típicas por %1RM (variam muito entre pessoas e exercícios) */
const RM = [[30, 40], [40, 30], [50, 23], [60, 17], [65, 15], [70, 12], [75, 10], [80, 8], [85, 6], [90, 4], [95, 2], [100, 1]];
const repsMax = pct => { for (let i = 1; i < RM.length; i++) if (pct <= RM[i][0]) { const [a, ra] = RM[i - 1], [b, rb] = RM[i]; return Math.round(ra + (rb - ra) * (pct - a) / (b - a)); } return 1; };
/* a força máxima cai com a fadiga ao longo da série; o esforço relativo sobe até 100% na falha */
const fmax = (pct, k, rm) => rm <= 1 ? 100 : 100 - (100 - pct) * (k - 1) / (rm - 1);
const effort = (pct, k, rm) => Math.min(100, pct / fmax(pct, k, rm) * 100);

const MU = [];
{ let s = 7; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
  for (let i = 0; i < 60; i++) MU.push(['I', 1 + 34 * i / 59 + rnd() * 2]);
  for (let i = 0; i < 40; i++) MU.push(['IIa', 30 + 40 * i / 39 + rnd() * 2]);
  for (let i = 0; i < 20; i++) MU.push(['IIx', 62 + 26 * i / 19 + rnd() * 2]);
  for (let i = MU.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [MU[i], MU[j]] = [MU[j], MU[i]]; } }

function set() {
  const mf = EX[F.ex][1], rm = repsMax(F.pct), n = Math.max(1, rm - F.rir);
  const vs = F.val ? 1 : .62, vd = F.val ? 1 : .5;
  const fat = k => rm <= 1 ? 0 : (k - 1) / (rm - 1);
  const peak = k => { const e = effort(F.pct, k, rm) / 100; return [120 + mf * (130 * e ** 2 + 70 * fat(k)) * vs, 80 + mf * (105 * e ** 2 + 65 * fat(k)) * vd]; };
  const fc = k => 75 + Math.sqrt(mf) * (25 * effort(F.pct, k, rm) / 100 + 75 * fat(k));
  const tut = n * 3;
  const lac = 1 + mf * 7 * Math.min(1, tut / 40) * (.3 + .7 * fat(n));
  return {mf, rm, n, peak, fc, tut, lac, fat};
}

function render(fs) {
  const s = set();
  if (F.view == null || F.view > s.n) F.view = s.n;
  const el = $('#f-pct'); if (!fs) el.value = F.pct; FA.rangeFill(el);
  const rr = $('#f-rir'); if (!fs) rr.value = F.rir; FA.rangeFill(rr);
  const vr = $('#f-view'); vr.max = s.n; vr.value = F.view; FA.rangeFill(vr);
  $('#f-o-pct').textContent = F.pct + '% de 1RM';
  $('#f-h-pct').textContent = `Cerca de ${s.rm} ${s.rm > 1 ? 'repetições máximas' : 'repetição máxima'} com essa carga`;
  $('#f-o-rir').textContent = F.rir ? F.rir + ' em reserva' : 'até a falha';
  $('#f-h-rir').textContent = `A série termina na repetição ${s.n}`;
  $('#f-o-view').textContent = `${F.view} de ${s.n}`;
  FA.seg($('#f-segEx'), F.ex); FA.seg($('#f-segVal'), F.val ? '1' : '0');
  const [ps, pd] = s.peak(s.n);
  $('#f-kpi').innerHTML = [['Pico de pressão na série', nf(ps, 0) + '/' + nf(pd, 0), 'mmHg, na última repetição'], ['FC no fim da série', nf(s.fc(s.n), 0), 'bpm'], ['Repetições', s.n + ' de ' + s.rm, s.tut + ' s sob tensão'], ['Lactato após a série', nf(s.lac, 1), 'mmol/L, aproximado']]
    .map(([x, y, z]) => `<div><span>${x}</span><b>${y}</b><i>${z}</i></div>`).join('');
  /* onda de pressão: cada repetição gera um pico; a linha de base sobe com a fadiga (metaborreflexo) */
  const per = 3, tSet = s.n * per, tEnd = tSet + 15, S = [], D = [];
  for (let t = 0; t <= tEnd + 1e-9; t += .05) {
    let a, b;
    if (t < 3) { a = 120; b = 80; }
    else if (t < tSet + 3) {
      const tt = t - 3, k = Math.min(s.n, Math.floor(tt / per) + 1), ph = (tt % per) / per, [pk, pdk] = s.peak(k);
      const bs = 120 + (pk - 120) * .4 * s.fat(k), bd = 80 + (pdk - 80) * .4 * s.fat(k);
      const sh = F.val ? Math.sin(Math.PI * ph) ** .5 : Math.sin(Math.PI * ph) ** 2;
      a = bs + (pk - bs) * sh; b = bd + (pdk - bd) * sh;
    } else {
      const u = t - tSet - 3, drop = F.val ? 1 : .35;
      a = u < 4 ? 120 - 30 * drop * Math.sin(Math.PI * u / 4) : 120 + 4 * Math.exp(-(u - 4) / 4);
      b = u < 4 ? 80 - 18 * drop * Math.sin(Math.PI * u / 4) : 80;
    }
    S.push([t, a]); D.push([t, b]);
  }
  const xt = [], st = tEnd > 90 ? 20 : tEnd > 45 ? 10 : 5; for (let i = 0; i <= tEnd + 3; i += st) xt.push(i);
  FA.lineChart($('#f-c1'), {xMin: 0, xMax: tEnd + 3, yMin: 50, yMax: Math.max(220, ps + 20), xTicks: xt, xFmt: v => v + 's', xLabel: 'segundos (3 s por repetição)', yLabel: 'pressão arterial (mmHg)',
    hlines: [{y: 120, label: 'repouso 120/80', color: 'var(--mut)'}],
    areas: [{pts: [[3 + (F.view - 1) * per, 50], [3 + F.view * per, 50], [3 + F.view * per, Math.max(220, ps + 20)], [3 + (F.view - 1) * per, Math.max(220, ps + 20)]], color: 'var(--ink)', op: .07}],
    series: [{pts: S, color: 'var(--red)', w: 2}, {pts: D, color: 'var(--blue)', w: 2}],
    vlines: [{x: tSet + 3, color: 'var(--mut)', label: 'fim da série', dash: 1}]});
  /* recrutamento na repetição escolhida */
  const eff = effort(F.pct, F.view, s.rm), cnt = {I: [0, 0], IIa: [0, 0], IIx: [0, 0]};
  $('#f-mu').innerHTML = MU.map(([t, th]) => { const on = th <= eff; cnt[t][1]++; if (on) cnt[t][0]++; return `<i class="mu t${t}${on ? ' on' : ''}"></i>`; }).join('');
  const tot = cnt.I[0] + cnt.IIa[0] + cnt.IIx[0];
  $('#f-mu-head').innerHTML = `Repetição ${F.view}: o músculo precisa de <b>${nf(eff, 0)}%</b> da força que ainda consegue produzir. ${tot} de 120 unidades motoras ativas.`;
  $('#f-mu-leg').innerHTML = [['I', 'pequenas, resistentes'], ['IIa', 'intermediárias'], ['IIx', 'grandes, fortes, fatigáveis']].map(([t, d]) => `<div><i class="mu t${t} on"></i><span>Tipo ${t} (${d})</span><b>${cnt[t][0]}/${cnt[t][1]}</b></div>`).join('');
  chronic(fs);
}

function chronic(fs) {
  ['w', 'd'].forEach(k => { const el = $('#f-' + k); if (!fs) el.value = F[k]; FA.rangeFill(el); });
  $('#f-o-w').textContent = F.w + ' semanas'; $('#f-o-d').textContent = F.d ? F.d + ' semanas' : 'nenhum';
  const neu = (t, w) => { const g = 18 * (1 - Math.exp(-Math.min(t, w) / 2.5)); return t <= w ? g : g * (t - w <= 1 ? 1 : Math.exp(-(t - w - 1) / 6)); };
  const hip = (t, w) => { const g = 22 * (1 - Math.exp(-Math.max(0, Math.min(t, w) - 3) / 14)); return t <= w ? g : g * (t - w <= 3 ? 1 : Math.exp(-(t - w - 3) / 16)); };
  const end = F.w + F.d, ts = []; for (let t = 0; t <= end + 1e-9; t += .25) ts.push(t);
  const n = ts.map(t => [t, neu(t, F.w)]), h = ts.map(t => [t, neu(t, F.w) + hip(t, F.w)]);
  const N = neu(end, F.w), Hh = hip(end, F.w);
  const xmax = Math.max(12, Math.ceil((end + 2) / 4) * 4), xt = []; for (let i = 0; i <= xmax; i += 4) xt.push(i);
  FA.lineChart($('#f-c2'), {xMin: 0, xMax: xmax, yMin: 0, yMax: 45, xTicks: xt, xLabel: 'semanas', yFmt: v => '+' + v + '%', yLabel: 'ganho de força (1RM)',
    areas: ts.length > 1 ? [{pts: n.concat([[end, 0], [0, 0]]), color: 'var(--blue)', op: .55}, {pts: h.concat(n.slice().reverse()), color: 'var(--red)', op: .55}] : [],
    vlines: F.d ? [{x: F.w, color: 'var(--ink)', label: 'parou de treinar', dash: 1}] : [], point: {x: end, y: N + Hh, label: '+' + nf(N + Hh, 0) + '%'}});
  const iix = 12 - 8 * (1 - Math.exp(-F.w / 4)), iixNow = F.d ? iix + (16 - iix) * (1 - Math.exp(-F.d / 6)) : iix;
  $('#f-kpi2').innerHTML = [['Força (1RM)', '+' + nf(N + Hh, 0) + '%', 'neural +' + nf(N, 0) + ' · hipertrofia +' + nf(Hh, 0)], ['Área de secção transversa', '+' + nf(Hh * .7, 0) + '%', 'do músculo treinado'], ['Fibras IIx', nf(iixNow, 0) + '%', 'das fibras (início: 12%)']]
    .map(([x, y, z]) => `<div><span>${x}</span><b>${y}</b><i>${z}</i></div>`).join('');
}
$('#f-pct').addEventListener('input', e => { F.pct = +e.target.value; F.view = null; render(true); });
$('#f-rir').addEventListener('input', e => { F.rir = +e.target.value; F.view = null; render(true); });
$('#f-view').addEventListener('input', e => { F.view = +e.target.value; render(true); });
$('#f-w').addEventListener('input', e => { F.w = +e.target.value; chronic(true); });
$('#f-d').addEventListener('input', e => { F.d = +e.target.value; chronic(true); });
$('#f-segEx').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { F.ex = b.dataset.v; render(); } });
$('#f-segVal').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { F.val = b.dataset.v === '1'; render(); } });
$('#f-fig').innerHTML = FA.figHTML('unidade') + `<div><h3>Unidade motora</h3><p>Cada neurônio motor comanda um grupo de fibras: a unidade motora. Unidades pequenas (tipo I) têm poucas fibras e disparam primeiro; unidades grandes (tipo II) têm muitas fibras, produzem muita força e só entram quando o esforço sobe ou a fadiga aparece (princípio do tamanho, Henneman, 1957). É isso que a grade de pontos acima mostra a cada repetição.</p><p class="note">Passe o mouse ou toque nos números para ver cada estrutura.</p></div>`;
FA.forca = F;
FA.views = FA.views || {};
FA.views.forca = () => render();
['#f-c1', '#f-c2'].forEach(id => FA.observe($(id), () => { if (!$('#v-forca').hidden) render(); }));
}
