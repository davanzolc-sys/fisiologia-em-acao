/* sessão de treino simulada minuto a minuto + player + utilidades de desenho */
{
const FA = window.FA, $ = FA.$, nf = FA.nf, cl = FA.cl;

const rep = (n, a, b) => { const o = []; for (let i = 1; i <= n; i++) o.push(a(i), b(i)); return o; };
FA.PROTO = {
  cont30: {n: 'Corrida contínua (30 min)', seg: [[5, 35, 'Aquecimento'], [20, 65, 'Parte principal'], [5, 30, 'Volta à calma'], [15, 0, 'Recuperação']]},
  cont: {n: 'Corrida contínua (45 min)', seg: [[5, 35, 'Aquecimento'], [35, 65, 'Parte principal'], [5, 30, 'Volta à calma'], [15, 0, 'Recuperação']]},
  hiit: {n: 'Intervalado 4 × 4 min', seg: [[10, 50, 'Aquecimento'], ...rep(4, i => [4, 92, 'Tiro ' + i], i => [3, 45, 'Pausa ativa ' + i]), [5, 35, 'Volta à calma'], [15, 0, 'Recuperação']]},
  sprint: {n: 'Sprints 8 × 30 s', seg: [[10, 50, 'Aquecimento'], ...rep(8, i => [.5, 130, 'Sprint ' + i], i => [2, 25, 'Pausa ' + i]), [5, 30, 'Volta à calma'], [15, 0, 'Recuperação']]},
  cont60: {n: 'Corrida contínua (1 h)', seg: [[10, 40, 'Aquecimento'], [40, 68, 'Parte principal'], [10, 35, 'Volta à calma'], [15, 0, 'Recuperação']]},
  cont90: {n: 'Corrida contínua (1 h 30)', seg: [[10, 45, 'Aquecimento'], [70, 65, 'Parte principal'], [10, 35, 'Volta à calma'], [15, 0, 'Recuperação']]},
  long: {n: 'Longão (2 h)', seg: [[10, 50, 'Aquecimento'], [100, 68, 'Parte principal'], [10, 40, 'Volta à calma'], [15, 0, 'Recuperação']]},
  long150: {n: 'Longão (2 h 30)', seg: [[10, 50, 'Aquecimento'], [130, 65, 'Parte principal'], [10, 40, 'Volta à calma'], [15, 0, 'Recuperação']]},
  long3h: {n: 'Longão (3 h)', seg: [[10, 50, 'Aquecimento'], [160, 63, 'Parte principal'], [10, 40, 'Volta à calma'], [15, 0, 'Recuperação']]},
  marat: {n: 'Maratona em ritmo de prova (~3 h)', seg: [[10, 45, 'Aquecimento'], [175, 72, 'Prova'], [15, 0, 'Recuperação']]},
  walk: {n: 'Caminhada (40 min)', seg: [[40, 35, 'Caminhada'], [10, 0, 'Recuperação']]}
};
FA.ENV = {
  ameno: {n: 'Ameno (22 °C)', temp: 22, ur: 50, alt: 0},
  calor: {n: 'Calor úmido (32 °C, UR 75%)', temp: 32, ur: 75, alt: 0},
  seco: {n: 'Calor seco (35 °C, UR 25%)', temp: 35, ur: 25, alt: 0},
  frio: {n: 'Frio (5 °C)', temp: 5, ur: 50, alt: 0},
  alt: {n: 'Altitude (2.500 m, 15 °C)', temp: 15, ur: 40, alt: 2500}
};
const SS = FA.SS = {proto: 'cont', env: 'ameno', tr: null, drink: 0, cho: 0, cur: 0, playing: false, D: null, raf: 0, rate: 1};
const DT = 1 / 12; /* passo de 5 s */
const LAG = ['fc', 'q', 'pas', 'pad', 've', 'fr', 'vo2', 'kcal', 'rer', 'cho', 'lac', 'tc', 'sw', 'mus', 'pele', 'visc', 'spo2', 'na', 'adr', 'ins', 'glu', 'cort', 'gh', 'adh', 'aldo', 'rbf', 'gfr', 'uflow', 'uosm', 'dpv', 'hct', 'gast', 'relp', 'avo2'];
const TAU = {lac: [1.5, 20], tc: [6, 12], sw: [2, 5], cort: [10, 30], gh: [8, 20], ins: [4, 10], glu: [5, 15], adh: [5, 20], aldo: [10, 30], uflow: [5, 10], uosm: [8, 20], rbf: [2, 8], gfr: [2, 8], dpv: [1, 10], hct: [1, 10], gast: [3, 10], na: [.7, 3], adr: [.7, 3], rer: [1, 3], cho: [1, 3], kcal: [.5, 2], vo2: [.5, 2], spo2: [.5, 1], pele: [3, 5], fc: [.5, 1.5]};
const Ps = T => .6108 * Math.exp(17.27 * T / (T + 237.3));

function simulate() {
  const pr = FA.PROTO[SS.proto], env = FA.ENV[SS.env];
  const segs = []; let T = 0; pr.seg.forEach(([d, int, n]) => { segs.push({t0: T, t1: T + d, int, n}); T += d; });
  const base = {...FA.S.P, ...env, tr: SS.tr == null ? FA.S.P.tr : SS.tr, cho: 0, accH: 0, accA: 0, desid: 0};
  const Fm = base.sex === 'F', mass = Fm ? 60 : 70, area = Fm ? 1.6 : 1.9;
  const glyM0 = (base.tr ? 500 : 350) * mass / 70 * .6, glyL0 = Fm ? 80 : 100; /* glicogênio dos músculos ativos (~60% do total) */
  const dt = DT;
  let glyM = glyM0, glyL = glyL0, sweat = 0, drunk = 0, choT = 0, fatT = 0, exT = 0;
  const r0 = FA.M({...base, int: 0}), st = {};
  LAG.forEach(k => st[k] = r0[k]);
  let tcPrev = st.tc;
  const frames = [];
  for (let t = 0; t <= T + 1e-9; t += dt) {
    const sg = segs.find(s => t < s.t1 - 1e-9) || segs[segs.length - 1];
    const ex = sg.int > 0; if (ex) exT += dt;
    const desid = Math.max(0, sweat - drunk) / mass * 100;
    const p = {...base, int: sg.int, dur: Math.max(5, exT), desid, glycOv: glyM / glyM0 * 100, cho: ex ? SS.cho : 0};
    const m = FA.M(p);
    LAG.forEach(k => { const [u, d] = TAU[k] || [.5, 1.5]; const tg = m[k], tau = tg > st[k] ? u : d; st[k] += (tg - st[k]) * (1 - Math.exp(-dt / tau)); });
    /* combustíveis (g/min) */
    let choR = st.kcal * st.cho / 100 / 4.1, fatR = st.kcal * (1 - st.cho / 100) / 9.3, wall = false;
    const ing = ex ? SS.cho / 60 : 0;
    if (glyM < 1) { /* sem glicogênio muscular: só sobra glicose do sangue (fígado, gliconeogênese e o que foi ingerido) */
      const cap = Math.min(ing, 1) + (glyL > 1 ? .5 : .12);
      if (choR > cap) { fatR += (choR - cap) * 4.1 / 9.3; choR = cap; wall = ex; }
    }
    const choPct = st.kcal > 0 ? choR * 4.1 / st.kcal * 100 : st.cho;
    const gU = glyM < 1 ? choR : ex ? choR * (.12 + .3 * Math.min(1, exT / 120)) : choR * .6;
    const ingOx = Math.min(ing, gU, 1);
    const livD = Math.max(0, gU - ingOx - .12);
    glyL = Math.max(0, glyL - livD * dt);
    const musD = Math.max(0, choR - gU);
    glyM = Math.max(0, glyM - musD * dt);
    choT += choR * dt; fatT += fatR * dt;
    sweat += st.sw / 60 * dt; if (ex) drunk += SS.drink / 60 * dt;
    const gli = 90 + (m.r > .8 ? 25 * (m.r - .8) / .2 : 0) - (glyL < 25 ? (25 - glyL) * 1.1 * (1 - Math.min(1, ing)) : 0);
    /* balanço térmico (W) */
    const metab = st.kcal * 69.8, prod = metab * (ex ? .8 : 1);
    const tsk = cl(33 + (base.temp - 22) * .3 - (st.sw > .5 ? .8 : 0), 24, 36.5);
    const dry = 12 * area * (tsk - base.temp), resp = .08 * metab;
    const pot = st.sw * 675, emax = Math.max(0, 16.5 * 12 * area * (Ps(tsk) - base.ur / 100 * Ps(base.temp)));
    const dTc = (st.tc - tcPrev) / dt; tcPrev = st.tc;
    const need = prod - dry - resp - 3470 * mass * dTc / 60;
    const evap = cl(need, 0, Math.min(pot, emax));
    const store = prod - dry - resp - evap, drip = Math.max(0, pot - emax);
    const f = {t, int: sg.int, fase: sg.n, ex, rel: Math.min(130, m.relp), speed: FA.speed(m), ...st, cho: choPct, wall,
      vs: st.q * 1000 / st.fc, vt: st.ve / Math.max(6, st.fr), ph: 7.4 - .025 * (st.lac - 1), cer: .75, cor: .25 + .045 * (st.q - 5),
      glyM, glyL, glyMp: glyM / glyM0 * 100, glyLp: glyL / glyL0 * 100, gli, choR, fatR, gU, ingOx, livD, musD, choT, fatT,
      sweat, drunk, desid, hProd: prod, hDry: dry, hResp: resp, hEvap: evap, hStore: store, hDrip: drip, emax, tsk,
      ucol: cl(1 + (st.uosm - 200) / 130, 1, 8)};
    frames.push(f);
  }
  SS.D = {frames, segs, T, base, mass, glyM0, glyL0, area};
  if (SS.cur > T) SS.cur = T;
}
FA.simulate = simulate;
FA.frame = () => { const fr = SS.D.frames; const i = Math.min(fr.length - 1, Math.round(SS.cur / DT)); return fr[i]; };

/* gráfico no tempo: curva completa clara + parte já "vivida" forte + cursor */
FA.tchart = (svg, specs, o = {}) => {
  const D = SS.D; if (!D) return;
  const step = Math.max(1, Math.ceil(D.frames.length / 600)), fr = D.frames.filter((_, i) => i % step === 0 || i === D.frames.length - 1), all = [];
  const ser = specs.map(s => { const pts = fr.map(f => [f.t, s.f ? s.f(f) : f[s.k]]); pts.forEach(p => all.push(p[1])); return {pts, s}; });
  let lo = o.yMin != null ? o.yMin : Math.min(...all), hi = o.yMax != null ? o.yMax : Math.max(...all);
  if (hi - lo < 1e-6) { hi += 1; lo -= 1; }
  if (o.yMin == null) lo -= (hi - lo) * .08; if (o.yMax == null) hi += (hi - lo) * .1;
  const series = [];
  ser.forEach(({pts, s}) => { series.push({pts, color: 'var(--line2)', w: 1.5, dash: s.dash}); series.push({pts: pts.filter(p => p[0] <= SS.cur + 1e-9), color: s.color, w: 2.6, dash: s.dash}); });
  const areas = D.segs.filter(s => s.int >= 80).map(s => ({pts: [[s.t0, lo], [s.t1, lo], [s.t1, hi], [s.t0, hi]], color: 'var(--red)', op: .07}));
  const st = D.T > 90 ? 30 : D.T > 40 ? 10 : 5, xt = []; for (let i = 0; i <= D.T; i += st) xt.push(i);
  return FA.lineChart(svg, {series, areas, xMin: 0, xMax: D.T, xTicks: xt, xFmt: v => v + "'", cursor: SS.cur, yMin: lo, yMax: hi, yLabel: o.yLabel, xLabel: o.xLabel || 'tempo de treino (min)', hlines: o.hlines, yDec: o.yDec, yFmt: o.yFmt});
};

/* Sankey genérico: entradas -> nó central -> saídas */
FA.sankey = (svg, cfg) => {
  const W = svg.clientWidth, H = svg.clientHeight; if (!W || !H) return;
  const narrow = W < 560, tot = Math.max(1, Math.max(cfg.ins.reduce((a, b) => a + Math.max(0, b.v), 0), cfg.outs.reduce((a, b) => a + Math.max(0, b.v), 0)));
  const k = Math.min((H * .62) / tot, cfg.kmax || 1e9);
  const nw = Math.max(40, W * .08), laneIn = narrow ? 96 : 150, laneOut = W - (narrow ? 120 : 200), cx = (laneIn + laneOut) / 2, nx0 = cx - nw / 2, nx1 = cx + nw / 2, cy = H * .5;
  const nh = tot * k + 12;
  let s = `<rect x="${nx0}" y="${cy - nh / 2}" width="${nw}" height="${nh}" rx="12" fill="${cfg.nodeFill || 'var(--panel)'}" stroke="var(--ink)" stroke-width="1.5"/>`;
  const side = (arr, left) => {
    const vis = arr.filter(a => a.v > .5), gap = (H - 40) / Math.max(1, vis.length);
    let y0 = cy - vis.reduce((a, b) => a + b.v, 0) * k / 2;
    vis.forEach((a, i) => {
      const h = Math.max(2, a.v * k), yc = 20 + gap * (i + .5), yb = yc - h / 2;
      const xa = left ? laneIn : nx1, xb = left ? nx0 : laneOut, xm = (xa + xb) / 2;
      const ya = left ? yb : y0, yb2 = left ? y0 : yb;
      s += `<path d="M${xa},${ya}C${xm},${ya} ${xm},${yb2} ${xb},${yb2}L${xb},${yb2 + h}C${xm},${yb2 + h} ${xm},${ya + h} ${xa},${ya + h}Z" fill="${a.c}" fill-opacity="${a.op || .8}" ${a.dash ? 'stroke="' + a.c + '" stroke-dasharray="4 3"' : ''}/>`;
      const tx = left ? laneIn - 8 : laneOut + 8, an = left ? 'end' : 'start';
      s += `<text x="${tx}" y="${yc - 2}" text-anchor="${an}" font-size="14" font-weight="600" fill="var(--ink)">${narrow && a.short ? a.short : a.n}</text><text x="${tx}" y="${yc + 15}" text-anchor="${an}" font-size="13" fill="var(--mut)">${a.lab}</text>`;
      y0 += h;
    });
  };
  side(cfg.ins, true); side(cfg.outs, false);
  s += `<text x="${cx}" y="${cy + nh / 2 + 20}" text-anchor="middle" font-size="14" font-weight="600" fill="var(--ink)">${cfg.node}</text>`;
  if (cfg.nodeSub) s += `<text x="${cx}" y="${cy + nh / 2 + 37}" text-anchor="middle" font-size="13" fill="var(--mut)">${cfg.nodeSub}</text>`;
  svg.innerHTML = s;
};

/* silhueta do corpo com órgãos (viewBox, sem texto) */
FA.body = lv => {
  const o = (k, c) => `fill="${c}" fill-opacity="${(.18 + .82 * cl(lv[k] || 0, 0, 1)).toFixed(2)}" data-o="${k}" style="cursor:pointer"`;
  const sweat = lv.suor > .35 ? [[70, 110], [130, 140], [62, 200], [140, 230], [80, 300], [122, 330]].slice(0, Math.round(lv.suor * 6)).map(([x, y]) => `<path d="M${x} ${y}c-3 5-4 8 0 10c4-2 3-5 0-10z" fill="var(--blue)" fill-opacity=".7"/>`).join('') : '';
  return `<svg viewBox="0 0 200 400" role="img" aria-label="Corpo com órgãos">
  <g fill="var(--panel)" stroke="var(--line2)" stroke-width="2" ${'data-o="pele"'}>
   <circle cx="100" cy="38" r="27"/><rect x="90" y="62" width="20" height="14" rx="4"/>
   <rect x="64" y="72" width="72" height="156" rx="26"/>
   <rect x="38" y="80" width="22" height="130" rx="11" transform="rotate(8 49 80)"/><rect x="140" y="80" width="22" height="130" rx="11" transform="rotate(-8 151 80)"/>
   <rect x="70" y="214" width="28" height="172" rx="14"/><rect x="102" y="214" width="28" height="172" rx="14"/>
  </g>
  <path d="M64 120 Q60 80 100 74 Q140 80 136 120 L136 202 Q136 228 110 228 L90 228 Q64 228 64 202Z" fill="none" stroke="var(--amber)" stroke-width="${2 + 5 * cl(lv.pele || 0, 0, 1)}" stroke-opacity="${.25 + .75 * cl(lv.pele || 0, 0, 1)}" data-o="pele"/>
  <ellipse cx="100" cy="34" rx="18" ry="14" ${o('cerebro', 'var(--plum)')}/>
  <ellipse cx="84" cy="118" rx="13" ry="25" ${o('pulmoes', 'var(--blue)')}/><ellipse cx="116" cy="118" rx="13" ry="25" ${o('pulmoes', 'var(--blue)')}/>
  <path d="M104 150c-9-6-14-11-14-17c0-4 3-7 7-7c3 0 5 2 7 4c2-2 4-4 7-4c4 0 7 3 7 7c0 6-5 11-14 17z" ${o('coracao', 'var(--red)')}/>
  <ellipse cx="86" cy="164" rx="19" ry="10" ${o('figado', 'var(--red2)')}/>
  <ellipse cx="113" cy="168" rx="11" ry="8" ${o('intestino', 'var(--amber)')}/><rect x="84" y="180" width="32" height="28" rx="10" ${o('intestino', 'var(--amber)')}/>
  <ellipse cx="106" cy="177" rx="13" ry="3.5" ${o('pancreas', 'var(--plum)')}/>
  <circle cx="100" cy="45" r="4.5" ${o('hipofise', 'var(--teal)')}/>
  <ellipse cx="74" cy="190" rx="5" ry="10" ${o('rins', 'var(--teal)')}/><ellipse cx="126" cy="190" rx="5" ry="10" ${o('rins', 'var(--teal)')}/>
  <circle cx="74" cy="177" r="3.5" ${o('supra', 'var(--red)')}/><circle cx="126" cy="177" r="3.5" ${o('supra', 'var(--red)')}/>
  <ellipse cx="84" cy="270" rx="11" ry="42" ${o('musculos', 'var(--red)')}/><ellipse cx="116" cy="270" rx="11" ry="42" ${o('musculos', 'var(--red)')}/>
  <ellipse cx="84" cy="345" rx="8" ry="26" ${o('musculos', 'var(--red)')}/><ellipse cx="116" cy="345" rx="8" ry="26" ${o('musculos', 'var(--red)')}/>
  ${sweat}</svg>`;
};

/* corpo ilustrado (img/corpo.jpg) com órgãos que "acendem" conforme o trabalho */
const ORG = {
  cerebro: [[512, 62, 62, 42]], pulmoes: [[430, 385, 58, 95], [592, 385, 52, 95]], coracao: [[518, 378, 44, 50]], figado: [[442, 492, 54, 32]],
  intestino: [[548, 485, 42, 40], [510, 628, 96, 74]], rins: [[432, 578, 30, 33], [590, 578, 30, 33]], supra: [[440, 537, 21, 15], [580, 537, 21, 15]],
  musculos: [[405, 880, 60, 150], [610, 880, 60, 150], [395, 1240, 42, 130], [628, 1240, 42, 130]]
};
const OCOL = {cerebro: 'var(--plum)', pulmoes: 'var(--blue)', coracao: 'var(--red)', figado: 'var(--amber)', intestino: 'var(--plum)', rins: 'var(--teal)', supra: 'var(--amber)', musculos: 'var(--red)'};
FA.bodyImg = (lv, fc) => {
  let s = '';
  Object.entries(ORG).forEach(([k, arr]) => {
    const v = cl(lv[k] || 0, 0, 1);
    arr.forEach(([x, y, rx, ry]) => {
      s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" fill-opacity="${((1 - v) * .62).toFixed(2)}" data-o="${k}" style="cursor:pointer"/>`;
      if (v > .35) s += `<ellipse cx="${x}" cy="${y}" rx="${rx + 10}" ry="${ry + 10}" fill="none" stroke="${OCOL[k]}" stroke-width="9" stroke-opacity="${((v - .35) / .65 * .85).toFixed(2)}" filter="url(#bglow)" pointer-events="none"${k === 'coracao' ? ` class="beat" style="animation-duration:${(60 / Math.max(40, fc || 70)).toFixed(3)}s"` : ''}/>`;
    });
  });
  const drops = [[300, 470], [724, 470], [338, 700], [688, 700], [352, 1000], [668, 1000], [470, 300], [560, 300]].slice(0, Math.round(cl(lv.suor || 0, 0, 1) * 8));
  s += drops.map(([x, y]) => `<path d="M${x} ${y}c-9 15-12 24 0 30c12-6 9-15 0-30z" fill="var(--blue)" fill-opacity=".75"/>`).join('');
  return `<div class="bimg"><img src="img/corpo.jpg" alt="Corpo humano com órgãos internos" width="768" height="1152"><svg viewBox="0 0 1024 1536" aria-hidden="true"><defs><filter id="bglow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter></defs>${s}</svg></div>`;
};

/* player */
function phaseAt(t) { const s = SS.D.segs.find(x => t < x.t1 - 1e-9) || SS.D.segs[SS.D.segs.length - 1]; return s; }
const fmtT = t => { const s = Math.round(t * 60), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return h ? `${h}h${String(m).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`; };
function playerUI() {
  const D = SS.D, f = FA.frame(), sg = phaseAt(SS.cur);
  $('#pl-time').innerHTML = fmtT(SS.cur) + ` <small>de ${fmtT(D.T)}</small>`;
  FA.seg($('#pl-rate'), String(SS.rate));
  $('#pl-rinfo').textContent = `1 s de vídeo = ${SS.rate < 1 ? nf(SS.rate * 60, 0) + ' s' : SS.rate + ' min'} de treino · assistir tudo leva ${fmtT(D.T / SS.rate / 60)}`;
  $('#pl-phase').textContent = sg.n + (sg.int ? ` · ${sg.int > 100 ? 'esforço máximo' : sg.int + '% do VO₂máx'} · ${f.speed.replace('≈ ', '')}` : ' · parado');
  const sc = $('#pl-scrub'); sc.max = Math.round(D.T * 12); sc.value = Math.round(SS.cur * 12); FA.rangeFill(sc);
  const ic = SS.playing ? '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="5" height="16" rx="1.5" fill="currentColor"/><rect x="14" y="4" width="5" height="16" rx="1.5" fill="currentColor"/></svg>'
    : SS.cur >= D.T ? '<svg viewBox="0 0 24 24"><path d="M12 5a7 7 0 1 1-6.6 4.7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M4 4v6h6" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>';
  const pb = $('#pl-play'); pb.innerHTML = ic; $('#mini-play').innerHTML = ic; $('#mini-time').textContent = fmtT(SS.cur); $('#mini-ph').textContent = phaseAt(SS.cur).n; $('#mini-prog').style.width = (SS.cur / D.T * 100) + '%'; pb.setAttribute('aria-label', SS.playing ? 'Pausar' : SS.cur >= D.T ? 'Repetir o treino' : 'Rodar o treino');
  $('#pl-sum').textContent = [FA.PROTO[SS.proto].n, FA.ENV[SS.env].n.replace(/ \(.*\)/, ''), (SS.tr == null ? FA.S.P.tr : SS.tr) ? 'treinado' : 'sedentário', SS.drink ? 'bebe água' : 'sem água', SS.cho ? SS.cho + ' g/h carbo' : ''].filter(Boolean).join(' · ');
  $('#pl-proto').value = SS.proto; $('#pl-env').value = SS.env;
  FA.seg($('#pl-tr'), (SS.tr == null ? FA.S.P.tr : SS.tr) ? '1' : '0'); FA.seg($('#pl-drink'), String(SS.drink)); FA.seg($('#pl-cho'), String(SS.cho));
  $('#pl-bar').innerHTML = D.segs.map(s => `<i style="flex:${s.t1 - s.t0};background:${s.int === 0 ? 'var(--line)' : s.int >= 85 ? 'var(--red)' : s.int >= 55 ? 'var(--amber)' : 'var(--blue)'}" title="${s.n}"></i>`).join('') ;
}
FA.sysRender = () => { if (FA.curSys && FA.SYSVIEW[FA.curSys]) FA.SYSVIEW[FA.curSys](); };
function upd() { playerUI(); FA.sysRender(); }
FA.sessUpd = upd;
$('#pl-proto').innerHTML = Object.entries(FA.PROTO).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('');
$('#pl-env').innerHTML = Object.entries(FA.ENV).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('');
const reset = () => { stop(); simulate(); SS.cur = SS.D.T * .45; upd(); };
$('#pl-proto').addEventListener('change', e => { SS.proto = e.target.value; reset(); });
$('#pl-env').addEventListener('change', e => { SS.env = e.target.value; reset(); });
[['#pl-tr', v => SS.tr = v === '1'], ['#pl-drink', v => SS.drink = +v], ['#pl-cho', v => SS.cho = +v]].forEach(([id, fn]) => $(id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; fn(b.dataset.v); const c = SS.cur; stop(); simulate(); SS.cur = Math.min(c, SS.D.T); upd(); }));
$('#pl-rate').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; SS.rate = +b.dataset.v; playerUI(); });
$('#mini-play').addEventListener('click', () => $('#pl-play').click());
$('#pl-scrub').addEventListener('input', e => { stop(); SS.cur = +e.target.value / 12; upd(); });
function stop() { SS.playing = false; cancelAnimationFrame(SS.raf); }
$('#pl-play').addEventListener('click', () => {
  if (SS.playing) { stop(); upd(); return; }
  if (SS.cur >= SS.D.T) SS.cur = 0;
  SS.playing = true; let last = performance.now(), acc = 0;
  const step = now => {
    if (!SS.playing) return;
    const d = (now - last) / 1000; last = now; SS.cur = Math.min(SS.D.T, SS.cur + d * SS.rate); acc += d;
    if (acc > .033 || SS.cur >= SS.D.T) { acc = 0; upd(); }
    if (SS.cur >= SS.D.T) { stop(); upd(); return; }
    SS.raf = requestAnimationFrame(step);
  };
  SS.raf = requestAnimationFrame(step); upd();
});
FA.sessEnsure = () => { if (!SS.D) { simulate(); SS.cur = SS.D.T * .45; } playerUI(); };
FA.sessResim = () => { if (SS.D) { simulate(); } };
}
