/* teste incremental em rampa */
{
const FA = window.FA, $ = FA.$, nf = FA.nf;
const T = {tr: null, cur: null, playing: false, guess: false, g: [], shown: false, raf: 0};
let D = null;

function profile() { return {...FA.S.P, tr: T.tr == null ? FA.S.P.tr : T.tr, dur: 5}; }
function build() {
  const p = profile(), pts = [];
  let tEnd = 0;
  for (let t = 0; t <= 30; t += .25) {
    const int = 10 + 7.5 * t, m = FA.M({...p, int});
    pts.push({t, int, m});
    tEnd = t;
    if (m.rel >= 1.1) break;
  }
  const at = th => { const x = pts.find(o => o.m.rel >= th); return x || pts[pts.length - 1]; };
  D = {p, pts, tEnd, vt1: at(pts[0].m.t1), vt2: at(pts[0].m.t2), max: at(1)};
  if (T.cur == null || T.cur > tEnd) T.cur = tEnd;
}
const val = (o, k) => k === 'vo2L' ? o.m.vo2L : o.m[k];
const upTo = (k, sc = 1) => D.pts.filter(o => o.t <= T.cur + 1e-9).map(o => [o.t, val(o, k) * sc]);
const full = k => D.pts.map(o => val(o, k));

function draw() {
  if (!D) build();
  const reveal = !T.guess || T.shown;
  const xt = []; for (let i = 0; i <= D.tEnd; i += 2) xt.push(i);
  const base = {xMin: 0, xMax: D.tEnd, xTicks: xt, xFmt: v => v + "'", cursor: T.playing ? T.cur : null, xLabel: 'tempo de teste (min)'};
  const thr = reveal ? [{x: D.vt1.t, color: 'var(--amber)', label: 'VT1'}, {x: D.vt2.t, color: 'var(--red2)', label: 'VT2', row: 1}] : [];
  const gl = T.g.map((x, i) => ({x, color: 'var(--blue)', label: 'seu VT' + (i + 1), dash: 1, row: 2 + i}));
  const rng = (k, sc = 1) => { const a = full(k).map(v => v * sc); return [Math.min(...a), Math.max(...a)]; };
  const [a1, b1] = rng('vo2L'), [, b1b] = rng('vco2');
  FA.lineChart($('#t-c1'), {...base, yMin: 0, yMax: Math.max(b1, b1b) * 1.08, vlines: thr, series: [{pts: upTo('vo2L'), color: 'var(--red)', w: 3}, {pts: upTo('vco2'), color: 'var(--blue)', w: 2.5}], yLabel: 'VO₂ e VCO₂ (L/min)'});
  const e1 = full('vevo2'), e2 = full('vevco2');
  FA.lineChart($('#t-c2'), {...base, yMin: Math.min(...e1, ...e2) * .92, yMax: Math.max(...e1, ...e2) * 1.05, vlines: thr.concat(gl), series: [{pts: upTo('vevo2'), color: 'var(--red)', w: 3}, {pts: upTo('vevco2'), color: 'var(--blue)', w: 2.5}], yLabel: 'L de ar por L de gás'});
  const [, b3] = rng('lac');
  FA.lineChart($('#t-c3'), {...base, yMin: 0, yMax: b3 * 1.08, vlines: thr, hlines: [{y: 2, label: '2 mmol/L', color: 'var(--amber)'}, {y: 4, label: '4 mmol/L', color: 'var(--red2)'}], series: [{pts: upTo('lac'), color: 'var(--amber)', w: 3}], yLabel: 'lactato (mmol/L)'});
  const [a4, b4] = rng('fc');
  FA.lineChart($('#t-c4'), {...base, yMin: Math.floor(a4 / 10) * 10 - 5, yMax: b4 + 8, vlines: thr, series: [{pts: upTo('fc'), color: 'var(--red)', w: 3}], yLabel: 'FC (bpm)'});
  const [a5, b5] = rng('rer');
  FA.lineChart($('#t-c5'), {...base, yMin: Math.min(.78, a5 - .02), yMax: Math.max(1.15, b5 + .02), yDec: 2, vlines: thr, hlines: [{y: 1, label: 'RER 1,00'}, {y: 1.1, label: '1,10', color: 'var(--red2)'}], series: [{pts: upTo('rer'), color: 'var(--plum)', w: 3}], yLabel: 'RER (VCO₂/VO₂)'});
  const [, b6] = rng('ve');
  FA.lineChart($('#t-c6'), {...base, yMin: 0, yMax: b6 * 1.08, vlines: thr, series: [{pts: upTo('ve'), color: 'var(--blue)', w: 3}], yLabel: 'ventilação (L/min)'});
  readout(); summary();
}

function at(t) { let best = D.pts[0]; D.pts.forEach(o => { if (o.t <= t + 1e-9) best = o; }); return best; }
function readout() {
  const o = at(T.cur), m = o.m;
  const zone = m.rel < m.t1 ? 'abaixo do VT1 (domínio moderado)' : m.rel < m.t2 ? 'entre VT1 e VT2 (domínio pesado)' : m.rel < 1 ? 'acima do VT2 (domínio severo)' : 'VO₂máx atingido';
  $('#t-read').innerHTML = [['Tempo', `${Math.floor(o.t)}:${String(Math.round((o.t % 1) * 60)).padStart(2, '0')}`], ['Carga', FA.speed(m).replace('≈ ', '')], ['VO₂', nf(m.vo2, 1) + ' mL/kg/min'], ['% VO₂máx', nf(Math.min(100, m.relp), 0) + '%'], ['FC', nf(m.fc, 0) + ' bpm'], ['Lactato', nf(m.lac, 1) + ' mmol/L'], ['RER', nf(m.rer, 2)], ['VE', nf(m.ve, 0) + ' L/min']]
    .map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('') + `<p class="zone">${zone}</p>`;
}
function summary() {
  const last = D.pts[D.pts.length - 1], mm = D.max.m, p = D.p;
  const oneMinBefore = at(D.tEnd - 1).m;
  const plateau = last.m.vo2L - oneMinBefore.vo2L < .15;
  const rerOk = last.m.rer >= 1.1, fcOk = last.m.fc >= .95 * last.m.fcMax, lacOk = last.m.lac >= 8;
  const ck = (ok, t) => `<li class="${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'} ${t}</li>`;
  const row = (n, o) => `<tr><td>${n}</td><td>${nf(o.m.vo2, 1)}</td><td>${nf(Math.min(100, o.m.relp), 0)}%</td><td>${nf(o.m.fc, 0)}</td><td>${nf(o.m.lac, 1)}</td><td>${FA.speed(o.m).replace('≈ ', '')}</td></tr>`;
  $('#t-sum').innerHTML = `<div class="scroll"><table class="tbl"><thead><tr><th>Marco</th><th>VO₂ (mL/kg/min)</th><th>% máx</th><th>FC</th><th>Lactato</th><th>Carga</th></tr></thead><tbody>${T.guess && !T.shown ? '<tr><td colspan="6">Marque seus limiares no gráfico dos equivalentes e confira.</td></tr>' : row('VT1 (limiar aeróbio)', D.vt1) + row('VT2 (compensação respiratória)', D.vt2)}${row('VO₂máx', D.max)}</tbody></table></div>
  <h4>Critérios de VO₂máx (Howley, Bassett e Welch, 1995)</h4><p class="note">Atualização: critérios secundários (RER, FC, lactato) falham com frequência; hoje se recomenda confirmar o VO₂máx com uma fase de verificação supramáxima depois do teste (Poole e Jones, 2017).</p><ul class="crit">${ck(plateau, 'Platô do VO₂: menos de 150 mL/min de aumento no último minuto')}${ck(rerOk, 'RER ≥ 1,10 (pico ' + nf(last.m.rer, 2) + ')')}${ck(fcOk, 'FC ≥ 95% da prevista (pico ' + nf(last.m.fc, 0) + ' de ' + nf(last.m.fcMax, 0) + ' bpm)')}${ck(lacOk, 'Lactato ≥ 8 mmol/L (pico ' + nf(last.m.lac, 1) + ')')}</ul>
  <p class="note">Perfil: ${(p.tr ? 'treinado' : 'sedentário') + (p.sex === 'F' ? ', mulher' : ', homem') + ', ' + p.age + ' anos, ' + nf(p.alt, 0) + ' m, ' + p.temp + ' °C' + (p.bb ? ', betabloqueador' : '')}. Rampa de ~7,5% do VO₂máx por minuto. VO₂máx de ${nf(mm.vmax, 1)} mL/kg/min (${nf(mm.vmax * mm.mass / 1000, 2)} L/min).</p>`;
  if (T.guess && T.shown && T.g.length === 2) {
    const e1 = T.g[0] - D.vt1.t, e2 = T.g[1] - D.vt2.t, f = e => (e >= 0 ? '+' : '−') + nf(Math.abs(e), 1) + ' min';
    const good = Math.abs(e1) <= 1 && Math.abs(e2) <= 1;
    $('#t-guess').innerHTML = `<b class="${good ? 'ok' : 'no'}">${good ? 'Muito bom!' : 'Quase.'}</b> Seu VT1 ficou ${f(e1)} e seu VT2 ${f(e2)} do valor do modelo. Diferenças de até 1 min são comuns até entre avaliadores experientes.`;
  } else if (T.guess) $('#t-guess').textContent = T.g.length === 0 ? 'Toque no gráfico dos equivalentes onde o VE/VO₂ começa a subir (VT1).' : T.g.length === 1 ? 'Agora toque onde o VE/VCO₂ começa a subir (VT2).' : 'Pronto. Toque em Conferir.';
  else $('#t-guess').textContent = '';
}

$('#t-c2').addEventListener('click', e => {
  if (!T.guess || T.shown || T.g.length >= 2) return;
  const r = $('#t-c2').getBoundingClientRect(), W = r.width, L = W < 520 ? 42 : 54, R = 14;
  const t = FA.cl((e.clientX - r.left - L) / (W - L - R) * D.tEnd, 0, D.tEnd);
  T.g.push(Math.round(t * 4) / 4); draw(); btns();
});
function btns() {
  $('#t-mode').textContent = T.guess ? 'Sair do desafio' : 'Desafio: encontre os limiares';
  $('#t-check').hidden = !(T.guess && T.g.length === 2 && !T.shown);
  $('#t-again').hidden = !(T.guess && (T.shown || T.g.length));
  FA.seg($('#t-segTr'), (T.tr == null ? FA.S.P.tr : T.tr) ? '1' : '0');
  $('#t-play').textContent = T.playing ? 'Pausar' : (T.cur < D.tEnd ? 'Continuar' : 'Rodar o teste');
}
$('#t-mode').addEventListener('click', () => { const dq = $('#t-d2'); if (dq) dq.open = true; T.guess = !T.guess; T.g = []; T.shown = false; draw(); btns(); });
$('#t-check').addEventListener('click', () => { T.shown = true; draw(); btns(); });
$('#t-again').addEventListener('click', () => { T.g = []; T.shown = false; draw(); btns(); });
$('#t-segTr').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; T.tr = b.dataset.v === '1'; T.cur = null; T.g = []; T.shown = false; build(); draw(); btns(); });
$('#t-play').addEventListener('click', () => {
  if (T.playing) { T.playing = false; cancelAnimationFrame(T.raf); btns(); draw(); return; }
  if (T.cur >= D.tEnd) T.cur = 0;
  T.playing = true; btns();
  let last = performance.now();
  const step = now => { if (!T.playing) return; T.cur = Math.min(D.tEnd, T.cur + (now - last) / 1000 * (D.tEnd / 14)); last = now; draw(); if (T.cur >= D.tEnd) { T.playing = false; btns(); draw(); return; } T.raf = requestAnimationFrame(step); };
  T.raf = requestAnimationFrame(step);
});
$('#t-scrub').addEventListener('input', e => { T.playing = false; T.cur = +e.target.value / 1000 * D.tEnd; FA.rangeFill(e.target); draw(); btns(); });

FA.views = FA.views || {};
FA.views.teste = () => { T.cur = null; build(); draw(); btns(); $('#t-scrub').value = 1000; FA.rangeFill($('#t-scrub')); };
['#t-c1', '#t-c2', '#t-c3', '#t-c4', '#t-c5', '#t-c6'].forEach(id => FA.observe($(id), () => { if (D && !$('#v-teste').hidden) draw(); }));
}
