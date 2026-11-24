/* cinética do VO2, déficit de O2, EPOC e recuperação */
{
const FA = window.FA, $ = FA.$, nf = FA.nf;
const K = {dom: 'pes', tr: null, te: 6, act: false};
const DOM = {mod: ['Moderado', 'abaixo do VT1'], pes: ['Pesado', 'entre VT1 e VT2'], sev: ['Severo', 'acima do VT2']};
let D;

function build() {
  const tr = K.tr == null ? FA.S.P.tr : K.tr;
  const p = {...FA.S.P, tr, temp: 22, ur: 50, alt: 0, desid: 0, accH: 0, accA: 0};
  const m0 = FA.M({...p, int: 0}), t1 = m0.t1, t2 = m0.t2;
  const rel = K.dom === 'mod' ? .8 * t1 : K.dom === 'pes' ? (t1 + t2) / 2 : (t2 + 1) / 2 + .02;
  const mm = FA.M({...p, int: rel * 100, dur: 5}), mx = FA.M({...p, int: 100, dur: 5});
  const rest = m0.vo2L, ss = mm.vo2L, vmaxL = mx.vo2L;
  const tau = (tr ? 20 : 35) / 60;
  const sc = K.dom === 'mod' ? 0 : K.dom === 'pes' ? .10 * (ss - rest) : Math.max(0, vmaxL - ss);
  const tsc = K.dom === 'sev' ? 2 : 3, del = 1.75;
  const fr = {mod: .9, pes: .8, sev: .7}[K.dom], ts = {mod: 3, pes: 6, sev: 10}[K.dom] * (tr ? .75 : 1);
  const te = K.te, tEnd = te + 15, dt = 1 / 12;
  const on = t => rest + (ss - rest) * (1 - Math.exp(-t / tau)) + (t > del ? sc * (1 - Math.exp(-(t - del) / tsc)) : 0);
  const Ve = on(te);
  const vo2 = t => t < 0 ? rest : t <= te ? on(t) : rest + (Ve - rest) * (fr * Math.exp(-(t - te) / (tau * 1.1)) + (1 - fr) * Math.exp(-(t - te) / ts));
  const fcR = m0.fc, fcSS = mm.fc, fcMax = mx.fc;
  const fcOn = t => fcR + (fcSS - fcR) * (1 - Math.exp(-t / (tr ? .42 : .5))) + (K.dom === 'mod' ? 0 : (K.dom === 'sev' ? fcMax - fcSS : 6) * (t > 1.5 ? (1 - Math.exp(-(t - 1.5) / 3)) : 0));
  const fcE = Math.min(fcMax, fcOn(te)), a = tr ? .35 : .25;
  const fc = t => t < 0 ? fcR : t <= te ? Math.min(fcMax, fcOn(t)) : fcR + (fcE - fcR) * (a * Math.exp(-(t - te) / .8) + (1 - a) * Math.exp(-(t - te) / 8));
  const Lss = mm.lac, hl = K.act ? 10 : 20;
  const lacOn = t => 1 + (Lss - 1) * (1 - Math.exp(-t / 2)) + (K.dom === 'sev' ? .8 * t : 0);
  const Le = lacOn(te), Lpk = Le * (K.dom === 'mod' ? 1 : K.dom === 'pes' ? 1.05 : 1.1);
  const lac = t => t < 0 ? 1 : t <= te ? lacOn(t) : t <= te + 3 ? Le + (Lpk - Le) * (t - te) / 3 : 1 + (Lpk - 1) * Math.exp(-Math.LN2 * (t - te - 3) / hl);
  const ts_ = []; for (let t = -1; t <= tEnd + 1e-9; t += dt) ts_.push(+t.toFixed(4));
  let def = 0, epoc = 0;
  ts_.forEach(t => { if (t > 0 && t <= te) def += Math.max(0, ss - vo2(t)) * dt; if (t > te) epoc += (vo2(t) - rest) * dt; });
  D = {tr, rest, ss, vmaxL, te, tEnd, ts: ts_, vo2, fc, lac, def, epoc, hrr: fcE - fc(te + 1), fcE, lac15: lac(te + 15), Lpk, tau, mm, rel, hl};
}

function draw() {
  if (!D) build();
  const xt = []; for (let i = 0; i <= D.tEnd; i += 3) xt.push(i);
  const base = {xMin: -1, xMax: D.tEnd, xTicks: xt, xFmt: v => v + "'", vlines: [{x: 0, color: 'var(--mut)', label: 'início'}, {x: D.te, color: 'var(--mut)', label: 'fim', dash: 1}]};
  const ex = D.ts.filter(t => t >= 0 && t <= D.te), rec = D.ts.filter(t => t >= D.te);
  const defPoly = ex.map(t => [t, D.vo2(t)]).concat([[D.te, D.ss], [0, D.ss]]);
  const epPoly = rec.map(t => [t, D.vo2(t)]).concat([[D.tEnd, D.rest], [D.te, D.rest]]);
  FA.lineChart($('#k-c1'), {...base, yMin: 0, yMax: Math.max(D.ss, D.vo2(D.te)) * 1.15, yLabel: 'VO₂ (L/min)', xLabel: 'tempo (min)',
    areas: [{pts: defPoly, color: 'var(--blue)', op: .28}, {pts: epPoly, color: 'var(--amber)', op: .3}],
    hlines: [{y: D.ss, label: 'demanda estável', color: 'var(--blue)'}],
    series: [{pts: D.ts.map(t => [t, D.vo2(t)]), color: 'var(--red)', w: 3}]});
  FA.lineChart($('#k-c2'), {...base, yLabel: 'FC (bpm)', xLabel: 'tempo (min)', series: [{pts: D.ts.map(t => [t, D.fc(t)]), color: 'var(--red)', w: 3}]});
  FA.lineChart($('#k-c3'), {...base, yMin: 0, yLabel: 'Lactato (mmol/L)', xLabel: 'tempo (min)', series: [{pts: D.ts.map(t => [t, D.lac(t)]), color: 'var(--amber)', w: 3}]});
  $('#k-kpi').innerHTML = [
    ['Déficit de O₂', nf(D.def, 2) + ' L', 'área azul'],
    ['EPOC', nf(D.epoc, 1) + ' L', 'área laranja, 15 min'],
    ['Queda da FC em 1 min', nf(D.hrr, 0) + ' bpm', D.hrr > 12 ? 'recuperação vagal normal' : 'abaixo de 12: atenção'],
    ['Lactato após 15 min', nf(D.lac15, 1) + ' mmol/L', 'pico ' + nf(D.Lpk, 1) + ', meia-vida ~' + D.hl + ' min']
  ].map(([a, b, c]) => `<div><span>${a}</span><b>${b}</b><i>${c}</i></div>`).join('');
  const dm = DOM[K.dom];
  $('#k-dyn').innerHTML = `<p><b>${dm[0]} (${dm[1]}), ${nf(D.rel * 100, 0)}% do VO₂máx, ${D.te} min.</b> ${K.dom === 'mod' ? 'O VO₂ sobe em curva exponencial e estabiliza em 2 a 3 min (constante de tempo ~' + Math.round(D.tau * 60) + ' s). Sem componente lento: a demanda é atendida e o lactato quase não muda.' : K.dom === 'pes' ? 'Depois de ~2 min aparece o componente lento: o VO₂ continua subindo devagar e só estabiliza mais tarde, com custo maior que o previsto para a carga. Ligado ao recrutamento de fibras tipo II e à fadiga.' : 'Acima do VT2 o componente lento não para: o VO₂ sobe até o máximo, o lactato acumula sem parar e a exaustão chega em poucos minutos. É o domínio severo.'}</p>
  <p>${D.tr ? 'Treinado: o VO₂ responde mais rápido (mais capilares e mitocôndrias), o que reduz o déficit, e a FC cai mais rápido na recuperação. Como ele trabalha numa carga absoluta maior, o EPOC em litros pode até ser maior.' : 'Sedentário: cinética mais lenta, déficit maior para a mesma carga. Treinar acelera a resposta do VO₂ e a recuperação.'} Recuperação ${K.act ? 'ativa (pedalar ou trotar leve) remove o lactato cerca de duas vezes mais rápido, porque o músculo em atividade leve o oxida.' : 'passiva: a remoção do lactato é mais lenta. Teste a ativa para comparar.'}</p>`;
}

function btns() {
  FA.seg($('#k-segDom'), K.dom); FA.seg($('#k-segTr'), (K.tr == null ? FA.S.P.tr : K.tr) ? '1' : '0'); FA.seg($('#k-segRec'), K.act ? '1' : '0');
  $('#k-te').value = K.te; FA.rangeFill($('#k-te')); $('#k-o-te').textContent = K.te + ' min';
}
const upd = () => { build(); draw(); btns(); };
$('#k-segDom').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { K.dom = b.dataset.v; upd(); } });
$('#k-segTr').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { K.tr = b.dataset.v === '1'; upd(); } });
$('#k-segRec').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { K.act = b.dataset.v === '1'; upd(); } });
$('#k-te').addEventListener('input', e => { K.te = +e.target.value; upd(); });
FA.views = FA.views || {};
FA.views.cinetica = upd;
['#k-c1', '#k-c2', '#k-c3'].forEach(id => FA.observe($(id), () => { if (D && !$('#v-cinetica').hidden) draw(); }));
}
