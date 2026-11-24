/* simulador principal */
{
const FA = window.FA, $ = FA.$, nf = FA.nf, V = FA.V;
const S = FA.S = {P: {...FA.P0, ...FA.store.get('p', {})}, AP: null, sel: 'fc'};
let m, ref;

const PRE = [
  ['Repouso', {int: 0, dur: 5, temp: 22, ur: 50, alt: 0, desid: 0, cho: 0}],
  ['Caminhada', {int: 30, dur: 30, temp: 22, ur: 50, alt: 0, desid: 0, cho: 0}],
  ['Corrida moderada', {int: 60, dur: 30, temp: 22, ur: 50, alt: 0, desid: 0, cho: 0}],
  ['No 2º limiar', {int: 78, dur: 20, temp: 22, ur: 50, alt: 0, desid: 0, cho: 0}],
  ['Esforço máximo', {int: 100, dur: 5, temp: 22, ur: 50, alt: 0, desid: 0, cho: 0}],
  ['Maratona no calor', {int: 65, dur: 120, temp: 30, ur: 75, alt: 0, desid: 3, cho: 0}],
  ['Treino em La Paz', {int: 60, dur: 30, temp: 15, ur: 40, alt: 3600, desid: 0, cho: 0}],
  ['Frio intenso', {int: 20, dur: 30, temp: -5, ur: 50, alt: 0, desid: 0, cho: 0}]
];
$('#presets').innerHTML = PRE.map((x, i) => `<button data-i="${i}">${x[0]}</button>`).join('');
$('#presets').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.P = {...S.P, ...PRE[+b.dataset.i][1]}; FA.go('simulador'); sync(); });

const RANGES = ['int', 'dur', 'temp', 'ur', 'alt', 'desid', 'age', 'cho', 'accH', 'accA'];
RANGES.forEach(id => $('#' + id).addEventListener('input', e => { S.P[id] = +e.target.value; sync(true); }));
[['#segTr', 'tr', v => v === '1'], ['#segSex', 'sex', v => v], ['#segBb', 'bb', v => v === '1']].forEach(([sel, key, f]) =>
  $(sel).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.P[key] = f(b.dataset.v); sync(); }));
$('#fixA').addEventListener('click', () => { S.AP = {...S.P}; sync(); });
$('#clrA').addEventListener('click', () => { S.AP = null; sync(); });
$('#resetP').addEventListener('click', () => { S.P = {...FA.P0}; S.AP = null; sync(); });

function dl(k) {
  const a = ref[k], b = m[k], d = FA.dirOf(k, a, b), diff = b - a;
  const cls = d === '↑' ? 'up' : d === '↓' ? 'dn' : 'eq';
  return `<span class="${cls}">${d} ${d === '≈' ? '' : (diff > 0 ? '+' : '−') + nf(Math.abs(diff), V[k][2])}</span>`;
}

function sync(fromSlider) {
  const P = S.P;
  RANGES.forEach(id => { const el = $('#' + id); if (!fromSlider || +el.value !== P[id]) el.value = P[id]; FA.rangeFill(el); });
  FA.seg($('#segTr'), P.tr ? '1' : '0'); FA.seg($('#segSex'), P.sex); FA.seg($('#segBb'), P.bb ? '1' : '0');
  m = FA.M(P); ref = S.AP ? FA.M(S.AP) : FA.M(FA.restOf(P));
  S.m = m;
  $('#o-int').textContent = P.int ? P.int + '% VO₂máx' : 'repouso';
  $('#h-int').textContent = `Carga ${nf(m.req, 1)} mL/kg/min, ${FA.speed(m)}${Math.abs(m.relp - P.int) >= 3 ? ' · relativa agora: ' + nf(m.relp, 0) + '%' : ''}`;
  $('#o-dur').textContent = P.int ? P.dur + ' min' : '—';
  $('#o-temp').textContent = P.temp + ' °C';
  $('#o-ur').textContent = P.ur + '%';
  $('#h-ur').textContent = P.temp > 20 && P.ur > 50 ? `Estresse térmico equivalente a ~${nf(m.tEff, 0)} °C` : 'Pesa quando está quente: o suor evapora menos';
  $('#o-alt').textContent = nf(P.alt, 0) + ' m';
  $('#h-alt').textContent = `PO₂ inspirada ${nf(m.pio2, 0)} mmHg`;
  $('#o-desid').textContent = nf(P.desid, 1) + '%';
  $('#o-age').textContent = P.age + ' anos';
  $('#h-age').textContent = `VO₂máx ${nf(m.vmax, 1)} mL/kg/min · FCmáx ${nf(m.fcMax, 0)} bpm`;
  $('#o-cho').textContent = P.cho + ' g/h';
  $('#o-accH').textContent = P.accH ? P.accH + ' dias' : 'nenhuma';
  $('#o-accA').textContent = P.accA ? P.accA + ' dias' : 'chegou agora';
  $('#accAf').style.opacity = P.alt >= 1500 ? 1 : .55;
  FA.$$('#presets button').forEach(b => { const q = PRE[+b.dataset.i][1]; b.setAttribute('aria-pressed', String(Object.keys(q).every(k => q[k] === P[k]))); });
  $('#clrA').hidden = !S.AP; $('#lgA').hidden = !S.AP;
  $('#fixA').textContent = S.AP ? 'Atualizar cenário A' : 'Fixar como cenário A';
  $('#alab').textContent = S.AP ? 'Cenário A: ' + FA.desc(S.AP) : 'Fixe um cenário para comparar: as setas passam a mostrar a diferença em relação a ele.';
  $('#refline').textContent = (S.AP ? 'Setas comparam com o cenário A.' : 'Setas comparam com o repouso a 22 °C, ao nível do mar, hidratado, mesma pessoa.') + ' Toque em qualquer variável para ver o mecanismo.';
  $('#gs-ex').textContent = (P.int ? P.int + '% do VO₂máx · ' + P.dur + ' min' : 'repouso');
  $('#gs-amb').textContent = P.temp + ' °C · ' + nf(P.alt, 0) + ' m' + (P.desid ? ' · ' + nf(P.desid, 1) + '% desidratado' : ' · hidratado');
  $('#gs-pes').textContent = (P.tr ? 'treinado' : 'sedentário') + ' · ' + (P.sex === 'F' ? 'mulher' : 'homem') + ' · ' + P.age + ' anos' + (P.bb ? ' · betabloqueador' : '');
  $('#gs-est').textContent = [P.cho ? P.cho + ' g/h carbo' : '', P.accH ? P.accH + ' d calor' : '', P.accA ? P.accA + ' d altitude' : ''].filter(Boolean).join(' · ') || 'nenhuma';
  FA.store.set('p', P);
  renderRead(); renderSys(); renderWhy(); drawFlow(); drawCurve();
}
FA.sync = sync;

function renderRead() {
  const ks = FA.simple ? ['fc', 'q', 've', 'kcal', 'tc', 'sw'] : ['fc', 'q', 've', 'lac', 'tc', 'spo2'], P = S.P, w = [];
  if (m.rel > 1) w.push(`A carga passa do VO₂máx disponível (${nf(m.relp, 0)}%): só dá para manter por poucos minutos. Os valores mostram o pico.`);
  else if (P.int && P.dur > m.tlim) w.push(`Acima do 2º limiar, essa intensidade raramente é mantida por ${P.dur} min; o limite típico fica perto de ${nf(Math.round(m.tlim / 5) * 5, 0)} min.`);
  if (P.int && m.glyc < 20) w.push(`Glicogênio muscular em ${nf(m.glyc, 0)}%: fadiga por depleção ("bater no muro").`);
  if (m.tc >= 39.5) w.push(`Temperatura central de ${nf(m.tc, 1)} °C: rendimento em queda e risco de doença pelo calor.`);
  if (m.spo2 < 90) w.push(`SpO₂ abaixo de 90%: hipoxemia importante.`);
  if (m.gli < 70) w.push(`Glicemia de ${nf(m.gli, 0)} mg/dL: hipoglicemia do exercício prolongado.`);
  $('#read').innerHTML = ks.map(k => `<button class="ro${S.sel === k ? ' on' : ''}" data-k="${k}"><span>${V[k][0]}</span><b>${FA.fmt(k, m[k])}<small>${V[k][1]}</small></b><i>${dl(k)}</i></button>`).join('') + (w.length ? `<div class="warn">${w.map(x => `<p>${x}</p>`).join('')}</div>` : '');
}
function renderSys() {
  const vis = k => !FA.simple || FA.SIMPLEV.has(k);
  $('#systems').innerHTML = FA.SYS.filter(s => s.v.some(vis)).map(s => `<section class="sys" style="--c:${s.c}"><h3>${s.n}</h3>${s.v.filter(vis).map(k => `<button class="row${S.sel === k ? ' on' : ''}" data-k="${k}"><span>${V[k][0]}</span><span class="v">${FA.fmt(k, m[k])}${FA.HORM.has(k) ? '' : ` <small>${V[k][1]}</small>`}</span><span class="d">${dl(k)}</span>${FA.HORM.has(k) ? `<span class="bar"><i style="width:${m[k]}%"></i></span>` : ''}</button>`).join('')}</section>`).join('');
}
function renderWhy() {
  const k = S.sel, s = FA.sysOf(k), t = FA.why(k, m, S.P), u = FA.unit(k);
  $('#why').style.setProperty('--c', s.c);
  $('#why').innerHTML = `<h3>${V[k][0]}</h3><div class="big">${FA.fmt(k, m[k])} <small>${u}</small></div><p class="ref">${S.AP ? 'Cenário A' : 'Repouso'}: ${FA.fmt(k, ref[k])} ${u} · ${dl(k)}</p>${t.map((x, i) => `<p class="${i ? 'cond' : ''}">${x}</p>`).join('')}`;
  $('#cv').value = k;
}
function pick(k) { if (!V[k]) return; if (FA.simple && !FA.SIMPLEV.has(k)) k = 'fc'; S.sel = k; renderRead(); renderSys(); renderWhy(); drawCurve(); }
FA.pick = pick;
$('#v-simulador').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) pick(b.dataset.k); });

$('#cv').innerHTML = FA.SYS.map(s => `<optgroup label="${s.n}">${s.v.map(k => `<option value="${k}">${V[k][0]}</option>`).join('')}</optgroup>`).join('');
$('#cv').addEventListener('change', e => pick(e.target.value));

const DEST = [['cer', 'Cérebro', 'Cérebro', 'var(--blue)'], ['mus', 'Músculos em atividade', 'Músculos', 'var(--red)'], ['pele', 'Pele', 'Pele', 'var(--amber)'], ['visc', 'Vísceras (fígado, intestino, rins)', 'Vísceras', 'var(--plum)'], ['cor', 'Coração (coronárias)', 'Coração', 'var(--red2)']];
const fs = $('#fsvg');
FA.drawFlow = (fs, m) => {
  const W = fs.clientWidth, H = fs.clientHeight; if (!W || !H || !m) return;
  const narrow = W < 520, hs = Math.min(H * .40, W * (narrow ? .30 : .24)), hx = Math.max(hs * .55 + 4, W * .15), cy = H * .46;
  const k = (H * .66) / 27, x0 = hx + hs * .2, x1 = W * (narrow ? .50 : .56), lx = x1 + 12, longN = W - lx > 260;
  let y0 = cy - m.q * k / 2; const parts = [];
  DEST.forEach((d, i) => { const f = m[d[0]], h = Math.max(2, f * k), yc = 34 + i * (H - 68) / 4; parts.push({d, f, h, ya: y0, yb: yc - h / 2, yc}); y0 += h; });
  const xm = (x0 + x1) / 2;
  let s = parts.map(o => `<path class="ribbon" data-k="${o.d[0]}" fill="${o.d[3]}" fill-opacity=".82" d="M${x0},${o.ya}C${xm},${o.ya} ${xm},${o.yb} ${x1},${o.yb}L${x1},${o.yb + o.h}C${xm},${o.yb + o.h} ${xm},${o.ya + o.h} ${x0},${o.ya + o.h}Z"><title>${o.d[1]}</title></path><rect x="${x1}" y="${o.yb}" width="5" height="${o.h}" fill="${o.d[3]}"/>`).join('');
  s += parts.map(o => `<g data-k="${['cer', 'cor'].includes(o.d[0]) ? 'q' : o.d[0]}" style="cursor:pointer"><text x="${lx}" y="${o.yc - 3}" font-size="15" font-weight="600" fill="var(--ink)">${longN ? o.d[1] : o.d[2]}</text><text x="${lx}" y="${o.yc + 15}" font-size="13.5" fill="var(--mut)">${nf(o.f, 1)} L/min · ${nf(o.f / m.q * 100, 0)}%</text></g>`).join('');
  const sc = hs / 100, tx = hx - hs / 2, ty = cy - hs * .5;
  s += `<g class="beat" style="animation-duration:${(60 / m.fc).toFixed(3)}s"><path transform="translate(${tx} ${ty}) scale(${sc})" d="M50 92C20 70 3 52 3 32C3 16 15 5 29 5C39 5 46 11 50 19C54 11 61 5 71 5C85 5 97 16 97 32C97 52 80 70 50 92Z" fill="var(--red)"/><path transform="translate(${tx} ${ty}) scale(${sc})" d="M22 18C14 22 11 30 13 38" stroke="#ffffff99" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
  const ly = Math.min(H - 26, ty + hs * .98 + 20);
  s += `<g data-k="q" style="cursor:pointer"><text x="${hx}" y="${ly}" text-anchor="middle" font-size="14" fill="var(--mut)">Débito cardíaco</text><text x="${hx}" y="${ly + 20}" text-anchor="middle" font-size="17" font-weight="600" fill="var(--ink)">${nf(m.q, 1)} L/min</text></g>`;
  fs.innerHTML = s;
};
function drawFlow() { FA.drawFlow(fs, m); }
FA.observe(fs, drawFlow);

const cs = $('#csvg');
function drawCurve() {
  if (!m) return;
  const k = S.sel, xs = []; for (let i = 0; i <= 100; i += 2) xs.push(i);
  const series = [];
  if (S.AP) series.push({pts: xs.map(i => [i, FA.M({...S.AP, int: i})[k]]), color: 'var(--blue)', dash: '7 5'});
  series.push({pts: xs.map(i => [i, FA.M({...S.P, int: i})[k]]), color: 'var(--red)', w: 3});
  const find = t => { for (let i = 0; i <= 100; i++) if (FA.M({...S.P, int: i}).r > t) return i; return null; };
  const v1 = find(m.t1), v2 = find(m.t2), vl = [];
  if (v1 != null) vl.push({x: v1, color: 'var(--amber)', label: 'L1'});
  if (v2 != null) vl.push({x: v2, color: 'var(--amber)', label: 'L2', dash: 1});
  FA.lineChart(cs, {series, xMin: 0, xMax: 100, xTicks: [0, 20, 40, 60, 80, 100], xFmt: v => v + '%', xLabel: 'intensidade (% do VO₂máx ao nível do mar)', yLabel: V[k][0] + (FA.HORM.has(k) ? ' (índice 0–100)' : V[k][1] ? ' (' + V[k][1] + ')' : ''), vlines: vl,
    point: {x: S.P.int, y: m[k], label: FA.fmt(k, m[k]) + ' ' + (FA.HORM.has(k) ? '' : V[k][1])}});
  $('#cvsub').textContent = `${V[k][0]}${FA.HORM.has(k) ? ' (índice 0–100)' : V[k][1] ? ' (' + V[k][1] + ')' : ''} de 0 a 100% da carga, mantendo as outras condições atuais. L1 e L2: 1º e 2º limiares.`;
}
FA.observe(cs, drawCurve);
FA.onSimpleSim = () => { if (FA.simple && !FA.SIMPLEV.has(S.sel)) S.sel = 'fc'; sync(); };
sync();
}
