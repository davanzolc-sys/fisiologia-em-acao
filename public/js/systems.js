/* abas "Corpo em treino": um sistema por aba, tudo seguindo a sessão simulada */
{
const FA = window.FA, $ = FA.$, nf = FA.nf, cl = FA.cl, SS = FA.SS;
const pctQ = (f, k) => nf(f[k] / f.q * 100, 0) + '%';
const UCOL = ['#fbf8d8', '#f8f1b0', '#f3e48a', '#ecd66a', '#e2c14a', '#d4a63a', '#c38a2c', '#a66a1f'];
const ucolHex = c => UCOL[cl(Math.round(c) - 1, 0, 7)];
const lvl = f => ({cerebro: .5, pulmoes: f.ve / 110, coracao: f.q / 22, figado: f.glu / 100, intestino: f.visc / 2.4, rins: f.rbf / 1.1, supra: Math.max(f.adr, f.cort - 20) / 100, musculos: f.mus / 18, pele: f.pele / 3, suor: f.sw / 2, pancreas: Math.max(f.glu, 100 - f.ins * 2) / 100, hipofise: Math.max(f.adh, f.gh) / 100});
const kpi = arr => arr.filter(Boolean).map(([a, b, c, adv]) => `<div${adv ? ' class="adv"' : ''}><span>${a}</span><p><b>${b}</b>${c ? `<i>${c}</i>` : ''}</p></div>`).join('');

/* --- desenhos --- */
function drawHeat(svg, f) {
  const ins = [{n: 'Produção pelos músculos', short: 'Produção', v: f.hProd, c: 'var(--amber)', lab: nf(f.hProd, 0) + ' W'}];
  if (f.hDry < -5) ins.push({n: 'Ganho do ambiente', short: 'Do ambiente', v: -f.hDry, c: 'var(--red)', lab: nf(-f.hDry, 0) + ' W'});
  if (f.hStore < -5) ins.push({n: 'Calor saindo do corpo', short: 'Do corpo', v: -f.hStore, c: 'var(--plum)', lab: nf(-f.hStore, 0) + ' W'});
  const outs = [];
  if (f.hDry > 5) outs.push({n: 'Convecção e radiação', short: 'Convecção', v: f.hDry, c: 'var(--blue)', lab: nf(f.hDry, 0) + ' W'});
  outs.push({n: 'Respiração', v: f.hResp, c: 'var(--mut)', lab: nf(f.hResp, 0) + ' W'});
  if (f.hEvap > 5) outs.push({n: 'Evaporação do suor', short: 'Suor evaporado', v: f.hEvap, c: 'var(--teal)', lab: nf(f.hEvap, 0) + ' W'});
  if (f.hStore > 5) outs.push({n: 'Acumulado no corpo', short: 'Acumulado', v: f.hStore, c: 'var(--red)', lab: nf(f.hStore, 0) + ' W, aquecendo'});
  FA.sankey(svg, {ins, outs, node: 'Corpo', nodeSub: nf(f.tc, 1) + ' °C', nodeFill: `color-mix(in srgb, var(--red) ${cl((f.tc - 36.8) / 3 * 70, 5, 75).toFixed(0)}%, var(--panel))`, kmax: .35});
}
function drawFuel(svg, f) {
  const W = svg.clientWidth, H = svg.clientHeight; if (!W || !H) return;
  const D = SS.D, tanks = [
    {n: ['Glicogênio', 'muscular*'], lv: f.glyMp / 100, v: nf(f.glyM, 0) + ' g', r: f.musD, c: 'var(--amber)'},
    {n: ['Glicogênio', 'do fígado'], lv: f.glyLp / 100, v: nf(f.glyL, 0) + ' g', r: f.livD, c: 'var(--red2)'},
    {n: ['Glicose', 'no sangue'], lv: cl(f.gli / 110, 0, 1), v: nf(f.gli, 0) + ' mg/dL', r: null, c: 'var(--red)'},
    {n: ['Gordura', 'corporal'], lv: .97, v: nf((D.mass * (D.base.sex === 'F' ? .25 : .15) * 1000 - f.fatT) / 1000, 2) + ' kg', r: f.fatR, c: 'var(--blue)'}
  ];
  if (SS.cho > 0) tanks.push({n: ['Gel ou', 'bebida'], lv: f.ex ? .7 : .2, v: SS.cho + ' g/h', r: f.ingOx, c: 'var(--plum)'});
  const n = tanks.length, gw = W / n, tw = Math.min(90, gw * .56), top = 46, th = H - top - 58;
  svg.innerHTML = tanks.map((t, i) => {
    const x = gw * i + (gw - tw) / 2, fh = th * cl(t.lv, 0, 1);
    return `<text x="${x + tw / 2}" y="16" text-anchor="middle" font-size="13.5" font-weight="600" fill="var(--ink)">${t.n[0]}</text><text x="${x + tw / 2}" y="33" text-anchor="middle" font-size="13.5" font-weight="600" fill="var(--ink)">${t.n[1]}</text>
    <rect x="${x}" y="${top}" width="${tw}" height="${th}" rx="12" fill="var(--panel)" stroke="var(--ink)" stroke-width="1.5"/>
    <rect x="${x + 3}" y="${top + th - fh + 3}" width="${tw - 6}" height="${Math.max(0, fh - 6)}" rx="9" fill="${t.c}" fill-opacity=".85"/>
    ${[.25, .5, .75].map(q => `<line x1="${x}" x2="${x + 9}" y1="${top + th * q}" y2="${top + th * q}" stroke="var(--ink)"/>`).join('')}
    <text x="${x + tw / 2}" y="${top + th + 20}" text-anchor="middle" font-size="14" font-weight="600" fill="var(--ink)">${t.v}</text>
    <text x="${x + tw / 2}" y="${top + th + 38}" text-anchor="middle" font-size="13" fill="var(--mut)">${t.r == null ? 'mantida pelo fígado' : t.r > .005 ? '−' + nf(t.r, 2) + ' g/min' : 'parado'}</text>`;
  }).join('');
}
function drawLungs(svg, f) {
  const W = svg.clientWidth, H = svg.clientHeight; if (!W || !H) return;
  const s = Math.min(W / 300, H / 230), cx = W / 2, top = (H - 220 * s) / 2;
  const amp = (1 + cl(f.vt / 3.2, .05, 1) * .14).toFixed(3), per = (60 / Math.max(6, f.fr)).toFixed(2);
  const sat = cl((f.spo2 - 75) / 24, 0, 1), alv = [];
  let sd = 3; const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647;
  while (alv.length < 46) { const side = alv.length % 2 ? 1 : -1, x = 25 + rnd() * 85, y = 75 + rnd() * 135; if (((x - 66) / 40) ** 2 + ((y - 145) / 60) ** 2 < 1) alv.push([side * x, y]); }
  svg.innerHTML = `<g transform="translate(${cx} ${top}) scale(${s})">
   <path d="M-6 0 L-6 52 M6 0 L6 52 M-6 52 Q-18 60 -34 70 M6 52 Q18 60 34 70" stroke="var(--ink)" stroke-width="6" fill="none" stroke-linecap="round"/>
   <g class="breath" style="--a:${amp};animation-duration:${per}s">
    <path d="M-22 62 C-60 50 -112 90 -112 160 C-112 205 -80 220 -46 210 C-26 204 -18 190 -18 170 Z" fill="var(--blue)" fill-opacity=".2" stroke="var(--blue)" stroke-width="3"/>
    <path d="M22 62 C60 50 112 90 112 160 C112 205 80 220 46 210 C26 204 18 190 18 170 Z" fill="var(--blue)" fill-opacity=".2" stroke="var(--blue)" stroke-width="3"/>
    ${alv.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="var(--red)" fill-opacity="${(.25 + .7 * sat).toFixed(2)}"/>`).join('')}
   </g></g>`;
}
function drawKidney(svg, f) {
  const W = svg.clientWidth, H = svg.clientHeight; if (!W || !H) return;
  const ks = Math.min(W / 520, (H * .6) / 200), kx = W * .56, ky = H * .4, hx = kx - 38 * ks;
  const w = Math.max(3, f.rbf * 40 * ks), col = ucolHex(f.ucol), ux = kx + 10 * ks, uy = H - 44;
  svg.innerHTML = `<path d="M10 ${ky - w / 2} L${hx} ${ky - w / 2} L${hx} ${ky + w / 2} L10 ${ky + w / 2}Z" fill="var(--red)" fill-opacity=".8"/>
   <text x="12" y="${ky - w / 2 - 10}" font-size="14" font-weight="600" fill="var(--ink)">Sangue chegando: ${nf(f.rbf, 2)} L/min</text>
   <text x="12" y="${ky + w / 2 + 20}" font-size="13" fill="var(--mut)">${pctQ(f, 'rbf')} do débito cardíaco (repouso: ~20%)</text>
   <path d="M${hx} ${ky + 18 * ks} C${hx - 10} ${ky + 80 * ks} ${ux - 30} ${uy - 40} ${ux} ${uy - 24}" stroke="${col}" stroke-width="${3 + f.uflow * 4}" fill="none" stroke-linecap="round"/>
   <g transform="translate(${kx} ${ky}) scale(${ks})"><path d="M-20 -100 C50 -115 90 -55 85 0 C80 60 45 105 -15 100 C-50 96 -55 60 -40 30 C-30 15 -30 -15 -40 -30 C-55 -60 -50 -96 -20 -100Z" fill="var(--teal)" fill-opacity=".22" stroke="var(--teal)" stroke-width="${3 / ks}"/></g>
   <text x="${kx + 22 * ks}" y="${ky - 2}" text-anchor="middle" font-size="15" font-weight="600" fill="var(--ink)">TFG ${nf(f.gfr, 0)}</text>
   <text x="${kx + 22 * ks}" y="${ky + 16}" text-anchor="middle" font-size="13" fill="var(--mut)">mL/min filtrados</text>
   <circle cx="${ux}" cy="${uy}" r="22" fill="${col}" stroke="var(--ink)" stroke-width="1.5"/>
   <text x="${ux + 32}" y="${uy - 4}" font-size="14" font-weight="600" fill="var(--ink)">Urina: ${nf(f.uflow, 1)} mL/min</text>
   <text x="${ux + 32}" y="${uy + 14}" font-size="13" fill="var(--mut)">cor ${Math.round(f.ucol)} de 8 · ${nf(f.uosm, 0)} mOsm/kg</text>`;
}

/* --- configuração de cada aba --- */
const VIEWS = {
geral: {c: 'var(--ink)', mech: false, t: 'O corpo inteiro durante o treino', sub: 'Rode a sessão e veja todos os sistemas trabalhando juntos. Toque num órgão para ir à aba dele.', pic: 'body',
  charts: [
    {t: 'Frequência cardíaca (bpm)', s: [{k: 'fc', color: 'var(--red)'}]},
    {t: 'Temperatura central (°C)', s: [{k: 'tc', color: 'var(--plum)'}], o: {yDec: 1}},
    {t: 'Glicogênio (% do inicial)', s: [{k: 'glyMp', color: 'var(--amber)'}, {k: 'glyLp', color: 'var(--red2)', dash: '6 4'}], o: {yMin: 0, yMax: 100}, leg: [['Músculo', 'var(--amber)'], ['Fígado', 'var(--red2)']]},
    {t: 'Suor perdido e água bebida (L)', s: [{k: 'sweat', color: 'var(--teal)'}, {k: 'drunk', color: 'var(--blue)', dash: '6 4'}], o: {yMin: 0}, leg: [['Suor', 'var(--teal)'], ['Bebida', 'var(--blue)']], adv: 1}
  ],
  kpi: f => [['Fase', f.fase, f.ex ? (f.int > 100 ? 'esforço máximo' : f.int + '% do VO₂máx') : 'parado'], ['Gasto até agora', nf(f.choT * 4.1 + f.fatT * 9.3, 0) + ' kcal', nf(f.kcal, 1) + ' kcal/min agora']],
  txt: f => [
    `<b>Coração:</b> ${nf(f.fc, 0)} batimentos por minuto, bombeando ${nf(f.q, 1)} L de sangue por minuto (repouso: ~5 L). Os músculos recebem ${pctQ(f, 'mus')} desse sangue.`,
    `<b>Respiração:</b> ${nf(f.ve, 0)} L de ar por minuto em ${nf(f.fr, 0)} respirações.`,
    f.wall && `<b>Bateu no muro:</b> o glicogênio muscular acabou. Sem ele, só a gordura e a pouca glicose do sangue não sustentam esse ritmo; na prática a pessoa teria que diminuir muito ou parar.`,
    `<b>Energia:</b> ${nf(f.cho, 0)}% vem de carboidrato e ${nf(100 - f.cho, 0)}% de gordura. O glicogênio muscular está em ${nf(f.glyMp, 0)}%.`,
    `<b>Calor e água:</b> temperatura central de ${nf(f.tc, 1)} °C. Já saiu ${nf(f.sweat, 2)} L de suor${f.desid >= .5 ? ` (${nf(f.desid, 1)}% do peso)` : ''}.`,
    `<b>Digestão e rins:</b> intestino recebendo ${nf(f.visc / 2.4 * 100, 0)}% do sangue de repouso; os rins produzem ${nf(f.uflow, 1)} mL de urina por minuto.`,
    `<b>Hormônios:</b> adrenalina ${f.adr > 40 ? 'alta' : f.adr > 12 ? 'subindo' : 'baixa'}, insulina ${f.ins < 35 ? 'em queda' : 'perto do normal'}${f.cort > 50 ? ', cortisol elevado' : ''}.`]},
coracao: {fig: 'coracao', c: 'var(--red)', mech: true, t: 'Coração e circulação', sub: 'Para onde vai o sangue em cada momento do treino.', pic: 'flow',
  charts: [
    {t: 'Frequência cardíaca (bpm)', s: [{k: 'fc', color: 'var(--red)'}]},
    {t: 'Débito cardíaco (L/min)', s: [{k: 'q', color: 'var(--red2)'}], o: {yMin: 0}},
    {t: 'Volume sistólico (mL)', s: [{k: 'vs', color: 'var(--plum)'}], adv: 1},
    {t: 'Pressão arterial (mmHg)', s: [{k: 'pas', color: 'var(--red)'}, {k: 'pad', color: 'var(--blue)'}], leg: [['Sistólica', 'var(--red)'], ['Diastólica', 'var(--blue)']]},
    {t: 'Distribuição do sangue (L/min)', s: [{k: 'mus', color: 'var(--red)'}, {k: 'pele', color: 'var(--amber)'}, {k: 'visc', color: 'var(--plum)'}], o: {yMin: 0}, leg: [['Músculos', 'var(--red)'], ['Pele', 'var(--amber)'], ['Vísceras', 'var(--plum)']]}
  ],
  kpi: f => [['FC', nf(f.fc, 0) + ' bpm'], ['Débito cardíaco', nf(f.q, 1) + ' L/min'], ['Volume sistólico', nf(f.vs, 0) + ' mL', '', 1], ['Pressão', nf(f.pas, 0) + '/' + nf(f.pad, 0) + ' mmHg']],
  txt: f => {
    const D = SS.D, i = SS.D.frames.indexOf(f), prev = SS.D.frames[Math.max(0, i - 120)];
    return [FA.simple ? FA.WS.fc : `Na transição para o exercício a FC sobe em segundos (retirada vagal) e o débito acompanha o consumo de O₂. Ao parar, a FC cai rápido no 1º minuto e depois devagar.`,
      f.ex && f.t > 20 && f.vs < prev.vs - 2 && f.fc > prev.fc + 2 && `<b>Deriva cardiovascular agora:</b> no mesmo ritmo, a FC subiu de ${nf(prev.fc, 0)} para ${nf(f.fc, 0)} bpm e o volume sistólico caiu. Calor, suor e perda de plasma.`,
      /Pausa|Tiro|Sprint/.test(f.fase) && `Nos intervalos a FC não volta ao repouso entre os tiros: ela sobe a cada repetição, e o débito fica alto mesmo na pausa.`,
      !f.ex && f.t > 1 && `Recuperação: a FC está caindo; a queda no 1º minuto mostra a volta do controle vagal.`,
      D.base.temp >= 28 && f.ex && `No calor a pele recebe ${nf(f.pele, 1)} L/min e compete com os músculos.`];
  }},
respiracao: {fig: 'pulmoes', c: 'var(--blue)', mech: true, t: 'Respiração', sub: 'Os pulmões inflam no ritmo e na profundidade calculados para cada momento.', pic: 'lungs',
  charts: [
    {t: 'Ventilação (L/min)', s: [{k: 've', color: 'var(--blue)'}], o: {yMin: 0}},
    {t: 'Frequência respiratória (rpm)', s: [{k: 'fr', color: 'var(--teal)'}]},
    {t: 'Volume corrente (L)', s: [{k: 'vt', color: 'var(--plum)'}], o: {yDec: 1}, adv: 1},
    {t: 'Saturação de O₂ (%)', s: [{k: 'spo2', color: 'var(--red)'}], o: {yMax: 100}, adv: 1}
  ],
  kpi: f => [['Ventilação', nf(f.ve, 0) + ' L/min'], ['Respirações', nf(f.fr, 0) + ' por min'], ['Volume por respiração', nf(f.vt, 2) + ' L', '', 1], ['SpO₂', nf(f.spo2, 0) + '%', '', 1]],
  txt: f => [FA.simple ? FA.WS.ve : `No exercício leve a ventilação sobe mais pelo volume de cada respiração; no pesado, pela frequência. Acima do 2º limiar a ventilação dispara para eliminar o CO₂ extra do tamponamento da acidose.`,
    f.lac > 4 && f.ex && `Lactato em ${nf(f.lac, 1)} mmol/L: a respiração está acima do necessário para o O₂, compensando a acidez.`,
    SS.D.base.alt >= 1500 && `Na altitude a respiração é maior para o mesmo esforço e a saturação cai para ${nf(f.spo2, 0)}%.`,
    !f.ex && f.t > 1 && `Depois do exercício a ventilação continua alta por alguns minutos: repõe O₂ e elimina CO₂ (EPOC).`]},
combustivel: {fig: 'musculo', c: 'var(--amber)', mech: true, t: 'Combustível', sub: 'Quanto tem em cada estoque e com que velocidade está sendo gasto. *Glicogênio dos músculos que estão trabalhando.', pic: 'fuel',
  charts: [
    {t: 'Combustível queimado (g/min)', s: [{k: 'choR', color: 'var(--amber)'}, {k: 'fatR', color: 'var(--blue)'}], o: {yMin: 0, yDec: 1}, leg: [['Carboidrato', 'var(--amber)'], ['Gordura', 'var(--blue)']]},
    {t: 'Glicogênio (% do inicial)', s: [{k: 'glyMp', color: 'var(--amber)'}, {k: 'glyLp', color: 'var(--red2)', dash: '6 4'}], o: {yMin: 0, yMax: 100}, leg: [['Músculo', 'var(--amber)'], ['Fígado', 'var(--red2)']]},
    {t: 'Glicemia (mg/dL)', s: [{k: 'gli', color: 'var(--red)'}], o: {yMin: 55, yMax: 125, hlines: [{y: 70, label: 'hipoglicemia', color: 'var(--red2)'}]}},
    {t: 'Lactato (mmol/L)', s: [{k: 'lac', color: 'var(--amber)'}], o: {yMin: 0}, adv: 1}
  ],
  kpi: f => [['Carboidrato / gordura', nf(f.cho, 0) + '% / ' + nf(100 - f.cho, 0) + '%'], ['Gasto agora', nf(f.kcal, 1) + ' kcal/min'], ['Carboidrato usado', nf(f.choT, 0) + ' g', '', 1], ['Gordura usada', nf(f.fatT, 0) + ' g', '', 1]],
  txt: f => [FA.simple ? `O corpo queima carboidrato e gordura ao mesmo tempo. Quanto mais forte o exercício, mais carboidrato. O glicogênio do músculo é o tanque que acaba primeiro.` : `O carboidrato vem do glicogênio muscular e da glicose do sangue, que o fígado repõe. Em intensidade alta o glicogênio muscular é o principal; com o tempo a glicose do sangue e a gordura ganham espaço (Brooks e Mercier, 1994; Brooks, 2020).`,
    f.glyMp < 25 && f.ex && `<b>Glicogênio muscular em ${nf(f.glyMp, 0)}%:</b> perto de "bater no muro".`,
    f.wall && `<b>Bateu no muro:</b> sem glicogênio muscular o corpo depende de gordura e da pouca glicose do sangue. A gordura não fornece energia rápido o bastante para essa intensidade: na vida real o ritmo cairia muito ou a pessoa pararia.`,
    f.glyLp < 25 && f.ex && `<b>Fígado quase vazio:</b> a glicemia começa a cair${SS.cho ? ', mas o carboidrato ingerido segura' : '. Teste a opção de 60 g/h de carboidrato'}.`,
    SS.cho > 0 && f.ex && `Com ${SS.cho} g/h de carboidrato, ~${nf(f.ingOx, 1)} g/min vêm do que foi ingerido, poupando o fígado.`,
    `A gordura corporal tem energia para dias de exercício. O limite não é ela: é a velocidade com que ela consegue ser usada.`]},
calor: {fig: 'calor', c: 'var(--plum)', mech: true, t: 'Calor e água', sub: 'De onde vem o calor e por onde ele sai, em watts. O que não sai fica no corpo e a temperatura sobe.', pic: 'heat',
  charts: [
    {t: 'Temperatura central (°C)', s: [{k: 'tc', color: 'var(--red)'}], o: {yDec: 1, hlines: [{y: 39.5, label: '39,5 °C', color: 'var(--red2)'}]}},
    {t: 'Taxa de suor (L/h)', s: [{k: 'sw', color: 'var(--teal)'}], o: {yMin: 0, yDec: 1}},
    {t: 'Suor perdido e água bebida (L)', s: [{k: 'sweat', color: 'var(--teal)'}, {k: 'drunk', color: 'var(--blue)', dash: '6 4'}], o: {yMin: 0, yDec: 1}, leg: [['Suor', 'var(--teal)'], ['Bebida', 'var(--blue)']]},
    {t: 'Desidratação (% do peso)', s: [{k: 'desid', color: 'var(--red2)'}], o: {yMin: 0, yDec: 1, hlines: [{y: 2, label: '2%', color: 'var(--red2)'}]}, adv: 1}
  ],
  kpi: f => [['Temperatura central', nf(f.tc, 1) + ' °C'], ['Suor', nf(f.sw, 1) + ' L/h'], ['Desidratação', nf(f.desid, 1) + '%', 'do peso'], ['Suor que não evapora', nf(f.hDrip, 0) + ' W', 'escorre sem resfriar', 1]],
  txt: f => [FA.simple ? FA.WS.sw : `Uns 75 a 80% da energia vira calor. O corpo perde calor por convecção e radiação (se o ar está mais frio que a pele), pela respiração e pela evaporação do suor. Com o ar perto da temperatura da pele, só o suor resolve.`,
    SS.D.base.ur >= 70 && SS.D.base.temp >= 25 && `<b>Umidade alta:</b> o ar já está quase saturado de vapor e só aceita ~${nf(f.emax, 0)} W de evaporação. O resto do suor escorre sem resfriar.`,
    f.hDry < -5 && `<b>Ar mais quente que a pele:</b> o ambiente está colocando calor no corpo.`,
    f.desid >= 2 && `<b>${nf(f.desid, 1)}% de desidratação:</b> acima de ~2% o desempenho e a termorregulação pioram. ${SS.drink ? '' : 'Teste a opção de beber 0,8 L/h.'}`,
    !f.ex && f.t > 1 && `Parado, a produção de calor cai na hora, mas o corpo leva vários minutos para esfriar.`]},
hormonios: {c: 'var(--red2)', mech: true, t: 'Hormônios', sub: 'Quais glândulas estão trabalhando e o que cada hormônio faz no treino. Valores em índice de 0 a 100.', pic: 'glands',
  charts: [
    {t: 'Adrenalina e noradrenalina', s: [{k: 'adr', color: 'var(--red)'}, {k: 'na', color: 'var(--amber)'}], o: {yMin: 0, yMax: 100}, leg: [['Adrenalina', 'var(--red)'], ['Noradrenalina', 'var(--amber)']]},
    {t: 'Insulina e glucagon', s: [{k: 'ins', color: 'var(--blue)'}, {k: 'glu', color: 'var(--plum)'}], o: {yMin: 0, yMax: 100}, leg: [['Insulina', 'var(--blue)'], ['Glucagon', 'var(--plum)']]},
    {t: 'Cortisol e GH', s: [{k: 'cort', color: 'var(--red2)'}, {k: 'gh', color: 'var(--teal)'}], o: {yMin: 0, yMax: 100}, leg: [['Cortisol', 'var(--red2)'], ['GH', 'var(--teal)']], adv: 1},
    {t: 'ADH e aldosterona', s: [{k: 'adh', color: 'var(--blue)'}, {k: 'aldo', color: 'var(--amber)'}], o: {yMin: 0, yMax: 100}, leg: [['ADH', 'var(--blue)'], ['Aldosterona', 'var(--amber)']]}
  ],
  kpi: () => [],
  txt: f => [FA.simple ? `No exercício o corpo entra em "modo ação": hormônios que liberam combustível sobem (adrenalina, glucagon, cortisol) e a insulina cai. Hormônios que seguram água (ADH, aldosterona) também sobem.` : `O sistema nervoso simpático e a suprarrenal respondem em segundos; o eixo hipotálamo-hipófise-suprarrenal (cortisol) e o GH levam minutos e sobem mais em esforço intenso ou longo. Insulina cai, glucagon sobe: o fígado libera glicose.`,
    f.ex && f.int >= 85 && `Esforço intenso: catecolaminas disparam, fazendo o fígado liberar mais glicose do que o músculo usa.`,
    f.ex && f.t > 60 && `Com mais de uma hora, glucagon e cortisol sobem pela duração, mantendo a glicemia.`,
    !f.ex && f.t > 1 && `Ao parar, adrenalina e noradrenalina caem em minutos; cortisol, GH e ADH continuam altos por mais tempo.`]},
rins: {fig: 'rim', c: 'var(--teal)', mech: true, t: 'Rins, urina e digestão', sub: 'O rim recebe menos sangue e economiza água; a digestão fica em segundo plano.', pic: 'kidney',
  charts: [
    {t: 'Fluxo sanguíneo renal (L/min)', s: [{k: 'rbf', color: 'var(--red)'}], o: {yMin: 0, yDec: 1}},
    {t: 'Produção de urina (mL/min)', s: [{k: 'uflow', color: 'var(--amber)'}], o: {yMin: 0, yDec: 1}},
    {t: 'Concentração da urina (mOsm/kg)', s: [{k: 'uosm', color: 'var(--plum)'}], adv: 1},
    {t: 'Filtração glomerular (mL/min)', s: [{k: 'gfr', color: 'var(--teal)'}], adv: 1},
    {t: 'Esvaziamento do estômago (% do normal)', s: [{k: 'gast', color: 'var(--amber)'}], o: {yMin: 0, yMax: 105}}
  ],
  kpi: f => [['Fluxo renal', nf(f.rbf, 2) + ' L/min', pctQ(f, 'rbf') + ' do débito'], ['Urina', nf(f.uflow, 1) + ' mL/min'], ['Cor da urina', `<em class="swatch" style="background:${ucolHex(f.ucol)}"></em>${Math.round(f.ucol)} de 8`, 'escala de Armstrong'], ['TFG', nf(f.gfr, 0) + ' mL/min', '', 1]],
  txt: f => [FA.simple ? `No exercício os rins recebem menos sangue e produzem menos urina: o corpo guarda água. Urina escura no fim do treino é sinal de que faltou água.` : `O simpático contrai as arteríolas renais: o fluxo cai muito, a filtração cai menos (a fração filtrada aumenta). ADH e aldosterona fazem o rim reabsorver água e sódio.`,
    f.ucol >= 5 && `Urina cor ${Math.round(f.ucol)}: concentrada. Cores 1 a 3 indicam boa hidratação.`,
    f.ex && f.int >= 75 && `Acima de ~70% do VO₂máx o estômago esvazia mais devagar (${nf(f.gast, 0)}% do normal): géis e bebidas são mais bem tolerados em ritmo moderado.`,
    f.ex && f.int >= 85 && `Depois de esforço intenso é comum aparecer proteína na urina por algumas horas, sem significar doença.`]}
};

const PIC = {flow: (s, f) => FA.drawFlow(s, f), heat: drawHeat, fuel: drawFuel, lungs: drawLungs, kidney: drawKidney};
const BODYL = [
  ['cerebro', 'Cérebro', f => '~0,75 L/min de sangue', 'geral'], ['pulmoes', 'Pulmões', f => nf(f.ve, 0) + ' L/min de ar', 'respiracao'], ['coracao', 'Coração', f => nf(f.fc, 0) + ' bpm · ' + nf(f.q, 1) + ' L/min', 'coracao'], ['figado', 'Fígado', f => 'glicogênio ' + nf(f.glyLp, 0) + '%', 'combustivel'], ['supra', 'Suprarrenais', f => 'adrenalina ' + nf(f.adr, 0) + '/100', 'hormonios'],
  ['pele', 'Pele', f => nf(f.tc, 1) + ' °C · suor ' + nf(f.sw, 1) + ' L/h', 'calor'], ['intestino', 'Estômago e intestino', f => nf(f.visc / 2.4 * 100, 0) + '% do sangue de repouso', 'rins'], ['rins', 'Rins', f => 'urina ' + nf(f.uflow, 1) + ' mL/min', 'rins'], ['musculos', 'Músculos', f => pctQ(f, 'mus') + ' do sangue · glicogênio ' + nf(f.glyMp, 0) + '%', 'combustivel']];
const GL = [
  ['hipofise', 'Hipófise', [['ADH', 'adh', 'faz o rim segurar água'], ['GH', 'gh', 'libera gordura como combustível']]],
  ['supra', 'Suprarrenais', [['Adrenalina', 'adr', 'acelera o coração, libera glicose'], ['Cortisol', 'cort', 'mobiliza combustível'], ['Aldosterona', 'aldo', 'segura sódio e água']]],
  ['pancreas', 'Pâncreas', [['Insulina', 'ins', 'cai: o fígado pode liberar glicose'], ['Glucagon', 'glu', 'sobe: mantém a glicemia']]],
  ['coracao', 'Nervos simpáticos', [['Noradrenalina', 'na', 'contrai vasos das vísceras, acelera o coração']]]
];

function build(name) {
  const v = VIEWS[name], el = $('#v-' + name);
  if (el.dataset.built) return;
  const picHtml = v.pic === 'body' ? `<div class="bodywrap"><div class="blist" id="${name}-bl"></div><div class="bfig" id="${name}-body"></div><div class="blist" id="${name}-br"></div></div>`
    : v.pic === 'glands' ? `<div class="bodywrap g2"><div class="bfig" id="${name}-body"></div><div class="glist" id="${name}-gl"></div></div>`
    : `<div class="fig" style="min-height:${v.pic === 'fuel' ? 330 : 340}px"><svg id="${name}-pic"></svg></div>`;
  el.innerHTML = `<div class="sv" style="--c:${v.c}"><div class="sv-head"><h2>${v.t}</h2><p class="sub">${v.sub}</p></div>
    <div class="hero${v.pic === 'body' ? ' stack' : ''}"><div class="card hero-pic">${picHtml}</div>
    <aside class="card now"><h3>Agora</h3><div class="kv" id="${name}-kpi"></div><ul class="now-list" id="${name}-txt"></ul></aside></div>
    ${v.mech ? `<div class="card mech${v.fig ? ' has-fig' : ''}">${v.fig ? FA.figHTML(v.fig) : ''}<div><h3>Como funciona</h3><p id="${name}-mech"></p>${v.fig ? '<p class="note">Passe o mouse ou toque nos números para ver cada estrutura.</p>' : ''}</div></div>` : ''}
    <div class="charts">${v.charts.map((c, i) => `<div class="chart${c.adv ? ' adv' : ''}"><h3>${c.t}</h3>${c.leg ? `<div class="legend">${c.leg.map(([n, col]) => `<span style="--c:${col}">${n}</span>`).join('')}</div>` : ''}<div class="fig sm"><svg id="${name}-c${i}"></svg></div></div>`).join('')}</div></div>`;
  el.dataset.built = 1;
  el.addEventListener('click', e => { const o = e.target.closest('[data-o],[data-go]'); if (!o) return; const g = o.dataset.go || (BODYL.find(b => b[0] === o.dataset.o) || [])[3]; if (g && g !== name) FA.go(g); });
  FA.observe(el.querySelector('.charts'), () => { if (!el.hidden && SS.D) render(name); });
  const pic = $('#' + name + '-pic'); if (pic) FA.observe(pic, () => { if (!el.hidden && SS.D) render(name); });
}
function render(name) {
  build(name);
  const v = VIEWS[name], f = FA.frame();
  $('#' + name + '-kpi').innerHTML = kpi(v.kpi(f));
  if (v.pic === 'body') {
    $('#' + name + '-body').innerHTML = FA.bodyImg(lvl(f), f.fc);
    const item = b => `<button class="bl" data-go="${b[3]}" data-o="${b[0]}"><b>${b[1]}</b><span>${b[2](f)}</span></button>`;
    $('#' + name + '-bl').innerHTML = BODYL.slice(0, 5).map(item).join('');
    $('#' + name + '-br').innerHTML = BODYL.slice(5).map(item).join('');
  } else if (v.pic === 'glands') {
    const lv = lvl(f), only = {hipofise: lv.hipofise, supra: lv.supra, pancreas: lv.pancreas, coracao: f.na / 100};
    $('#' + name + '-body').innerHTML = FA.glandImg({hipofise: only.hipofise, supra: only.supra, pancreas: only.pancreas, tireoide: .25, rins: f.aldo / 100});
    $('#' + name + '-gl').innerHTML = GL.map(([o, n, hs]) => `<div class="gl"><h4>${n}</h4>${hs.map(([hn, k, d]) => `<div class="hrow"><span>${hn}</span><span class="hb"><i style="width:${f[k]}%"></i></span><b>${nf(f[k], 0)}</b><em>${d}</em></div>`).join('')}</div>`).join('');
  } else PIC[v.pic]($('#' + name + '-pic'), f);
  v.charts.forEach((c, i) => { if (c.adv && FA.simple) return; FA.tchart($('#' + name + '-c' + i), c.s, {...(c.o || {}), yLabel: (c.o && c.o.yLabel) || (c.t.charAt(0).toLowerCase() + c.t.slice(1) + (/\)$/.test(c.t) ? '' : ' (índice 0–100)'))}); });
  const items = v.txt(f), mech = v.mech ? items.shift() : null;
  if (mech) $('#' + name + '-mech').innerHTML = mech;
  const live = items.filter(Boolean);
  $('#' + name + '-txt').innerHTML = live.map(x => `<li>${x}</li>`).join('');
}
FA.SYSVIEW = {};
Object.keys(VIEWS).forEach(k => FA.SYSVIEW[k] = () => render(k));
FA.SYSNAMES = Object.keys(VIEWS);
}
