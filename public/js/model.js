/* modelo fisiológico didático */
{
const FA = window.FA, cl = FA.cl, nf = FA.nf;

FA.P0 = {int: 60, dur: 30, temp: 22, ur: 50, alt: 0, desid: 0, tr: false, sex: 'M', age: 20, cho: 0, bb: false, accH: 0, accA: 0};

FA.M = function (p) {
  const tr = p.tr, F = p.sex === 'F', mass = F ? 60 : 70;
  const slMax = (tr ? 60 : 42) * (F ? .85 : 1) * (1 - Math.max(0, p.age - 25) * .009);
  const t1 = tr ? .65 : .50, t2 = tr ? .85 : .75;
  const aa = Math.min(1, p.accA / 21), ah = Math.min(1, p.accH / 14);
  const tEff = p.temp + (p.temp > 20 ? Math.max(0, p.ur - 50) * .15 : 0);
  const heat = Math.max(0, tEff - 25) * (1 - .6 * ah);
  const cold = Math.max(0, 10 - p.temp);
  const altF = Math.max(0, (p.alt - 1000) / 1000) * .07 * (1 - .25 * aa);
  const vmax = slMax * (1 - altF) * (1 - .012 * p.desid) * (1 - .006 * Math.max(0, tEff - 30) * (1 - .5 * ah)) * (p.bb ? .95 : 1);
  const req = 3.5 + (slMax - 3.5) * p.int / 100;
  const rel = (req - 3.5) / (vmax - 3.5), r = cl(rel, 0, 1);
  const shiv = p.int < 40 ? cold * .35 * (1 - p.int / 40) : 0;
  const vo2 = Math.min(req, vmax) + shiv, vo2L = vo2 * mass / 1000;
  const dur = p.int > 0 ? p.dur : 0, dt = Math.min(1, dur / 30), mf = mass / 70;
  const bbF = p.bb ? .78 : 1;
  const tc = 36.9 + Math.max(0, tEff - 35) * .05 + 2 * r * (1 - Math.exp(-dur / 12)) + heat * .05 * r * dt + Math.max(0, tEff - 33) * .07 * r * dt * (1 - .6 * ah) + .15 * p.desid * (r > .1 ? dt : .2) - (p.int < 30 ? cold * .01 : 0);
  const fcMax = (208 - .7 * p.age - Math.max(0, p.alt - 3000) / 1000 * 6) * bbF;
  const fcR = ((tr ? 55 : 72) + (F ? 3 : 0) + p.alt / 1000 * 4 * (1 - .6 * aa) + heat * .5 + p.desid * 1.5 + cold * .3) * (p.bb ? .82 : 1);
  const fc = Math.min(fcMax, fcR + (fcMax - fcR) * r + (r * Math.min(dur, 90) / 60 * 8 * (1 + heat / 8) + 5 * p.desid * r + Math.max(0, tc - 38.2) * 20 * r) * bbF);
  const q = (5 * mf + 5 * (vo2L - .245 * mf) + (r < .05 ? heat * .08 : 0) + p.alt / 1000 * .6 * r) * (1 - .025 * p.desid * r) * (1 - .004 * heat * r) * (p.bb ? .95 : 1);
  const vs = q * 1000 / fc;
  const pas = 118 - (F ? 6 : 0) + Math.max(0, p.age - 40) * .45 + 72 * r - heat * .4 * r - p.desid * 1.5 * r + cold * .5;
  const pad = 78 - 3 * r - heat * .3 + Math.max(0, p.age - 40) * .15 + cold * .5;
  const dpv = -12 * r - 2.5 * p.desid + (tr ? 12 : 0) + 8 * ah - (p.alt > 1500 ? (p.alt - 1500) / 1000 * 4 : 0);
  const hct0 = F ? 40 : 45, hb0 = F ? 13.5 : 15;
  const hmF = 1 + (p.alt > 1500 ? (p.alt - 1500) / 1000 * .03 * aa : 0);
  const hct = hct0 * hmF / (hct0 * hmF + (100 - hct0) * (1 + dpv / 100)) * 100;
  const hb = hb0 * hct / hct0;
  const spo2 = cl(98 - 9e-7 * p.alt ** 2 * (1 - .3 * aa) - r * p.alt / 1000 * 1.5 - (tr && r > .85 ? 2 * (r - .85) / .15 : 0), 60, 99);
  const cao2 = 1.34 * hb * spo2 / 100;
  const avo2 = vo2L * 100 / q;
  const pio2 = (760 * Math.exp(-p.alt / 8434) - 47) * .2093;
  const rate = (r < .25 ? .05 * r : .9 * (r / .75) ** 2.5) * (tr ? .75 : 1) * (1 + heat * .02) * (1 + p.alt / 1000 * .03) * (1 - .15 * p.cho / 90);
  const glyc = p.glycOv != null ? cl(p.glycOv, 0, 100) : cl(100 - rate * dur, 0, 100);
  const lac0 = r <= t1 ? 1 + .5 * (r / t1) ** 2 : r <= t2 ? 1.5 + 2.5 * ((r - t1) / (t2 - t1)) ** 1.5 : 4 + 7 * ((r - t2) / (1 - t2)) ** 1.6;
  const lac = lac0 * (1 + heat * .02 * r) * (.6 + .4 * glyc / 100);
  const ph = 7.40 - .025 * (lac - 1);
  const rer0 = r <= t1 ? .80 + .06 * r / t1 : r <= t2 ? .86 + .12 * (r - t1) / (t2 - t1) : .98 + .14 * (r - t2) / (1 - t2);
  const rer = cl(rer0 - (r > 0 ? (1 - glyc / 100) * .07 + (tr ? .02 * (1 - r) : 0) - .02 * p.cho / 90 : 0), .7, 1.15);
  const vco2L = vo2L * rer;
  const ve = Math.max(5, (7 * mf + 25 * (vco2L - .2 * mf) + (r > t2 ? 120 * (r - t2) ** 1.5 * mf : 0)) * (1 + p.alt / 1000 * .1 * (1 + .6 * aa)) + Math.max(0, tc - 38.5) * 8);
  const fr = 12 + 32 * r ** 1.4 + p.alt / 1000 * 1.5, vt = ve / fr;
  const cho = cl((rer - .707) / .293, 0, 1) * 100, kcal = vo2L * (3.941 + 1.106 * rer);
  const choF = cl(p.cho / 60, 0, 1);
  const gli = 90 + (r > .8 ? 25 * (r - .8) / .2 : 0) - (glyc < 30 ? (30 - glyc) / 30 * 25 * (1 - choF) : 0);
  const sw = r > .02 ? (.2 + 1.3 * r) * (1 + Math.max(0, tEff - 20) * .05) * (tr ? 1.15 : 1) * (F ? .85 : 1) * (1 + .2 * ah) * (1 - .04 * p.desid) * mf : Math.max(0, tEff - 30) * .03;
  const cer = .75, cor = .25 + .045 * (q - 5);
  const visc = 2.4 * mf * (1 - .72 * r) * (1 - .03 * p.desid);
  const pele = r > .02 ? Math.max(.15, .45 + Math.max(0, tEff - 18) / 17 * 2.6 * Math.min(1, r * 2.2) * (1 - .6 * Math.max(0, r - .7) / .3) * (1 - .08 * p.desid) - cold * .02) : Math.max(.12, .45 + Math.max(0, tEff - 28) * .08 - cold * .025);
  const mus = Math.max(.6, q - cer - cor - visc - pele);
  const na = cl(4 + 86 * r ** 3 + Math.min(10, dur / 12) * r + heat * .6 * r + p.alt / 1000 * 3 * (1 - .4 * aa) + p.desid * 2 + cold * 1.2, 0, 100);
  const adr = cl(3 + 85 * r ** 4 + (glyc < 30 ? (30 - glyc) * .6 * r * (1 - choF) : 0) + heat * .3 * r + p.alt / 1000 * 2, 0, 100);
  const ins = cl(50 * (1 - .55 * r - .25 * Math.min(1, dur / 90) * (r > .3 ? 1 : 0)) + choF * 10 * (r > 0 ? 1 : 0), 0, 100);
  const glu = cl(25 + 40 * r * Math.min(1, (dur + 10) / 60) + (r > 0 && glyc < 40 ? (40 - glyc) * .6 * (1 - choF) : 0), 0, 100);
  const cort = cl(30 + (r > .6 ? 50 * (r - .6) / .4 : 0) + (dur > 60 && r > .4 ? (dur - 60) / 60 * 20 * (1 - .5 * choF) : 0) + heat * .8 * r + p.alt / 1000 * 2, 0, 100);
  const gh = cl(10 + 70 * cl((r - .3) / .7, 0, 1) * Math.min(1, dur / 20 + .2), 0, 100);
  const adh = cl(15 + 45 * r ** 2 + p.desid * 12 + heat * 1.2 * r - cold * .8, 0, 100);
  const aldo = cl(20 + 40 * r + p.desid * 8 + heat * .8, 0, 100);
  const epoT = p.accA <= 2 ? .6 + .4 * p.accA / 2 : Math.max(.45, 1 - (p.accA - 2) / 19 * .55);
  const epo = cl(15 + (p.alt > 500 ? p.alt / 1000 * 15 * epoT : 0), 0, 100);
  const rbf = cl(1.1 * mf * (1 - .75 * r) * (1 - .04 * p.desid) * (1 - .012 * heat * r) + cold * .01, .15, 1.6);
  const gfr = cl(120 * mf * (1 - .3 * r ** 1.5) * (1 - .03 * p.desid), 40, 140);
  const uflow = cl((1 - .7 * r) * (1 - .15 * p.desid) * (1 - .01 * heat) + cold * .06, .1, 3);
  const uosm = cl(300 + 9 * (adh - 15) - cold * 10, 80, 1200);
  const gast = cl(100 * (r < .7 ? 1 : 1 - (r - .7) * 2.5) * (1 - .05 * p.desid) * (1 - .01 * heat), 5, 100);
  const tlim = rel >= 1 ? 3 : r > t2 ? 3 + 40 * ((1 - r) / (1 - t2)) ** 1.5 : 999;
  return {fc, vs, q, pas, pad, avo2, mus, pele, visc, cer, cor, ve, fr, vt, spo2, pio2, hb, cao2, vo2, relp: rel * 100, lac, ph, rer, vco2: vco2L, vevo2: ve / vo2L, vevco2: ve / vco2L, cho, kcal, glyc, gli, tc, sw, dpv, hct, na, adr, ins, glu, cort, gh, adh, aldo, epo, rbf, gfr, uflow, uosm, gast,
    req, vmax, t1, t2, thr: t1, r, rel, tlim, dur, mass, vo2L, fcMax, tEff};
};

FA.SYS = [
  {k: 'cv', n: 'Cardiovascular', c: 'var(--red)', v: ['fc', 'vs', 'q', 'pas', 'pad', 'avo2', 'mus', 'pele', 'visc']},
  {k: 're', n: 'Respiratório e sangue', c: 'var(--blue)', v: ['ve', 'fr', 'vt', 'vevo2', 'vevco2', 'spo2', 'pio2', 'hb', 'cao2']},
  {k: 'en', n: 'Energético', c: 'var(--amber)', v: ['vo2', 'relp', 'lac', 'ph', 'rer', 'cho', 'kcal', 'glyc', 'gli']},
  {k: 'th', n: 'Temperatura e água', c: 'var(--plum)', v: ['tc', 'sw', 'dpv', 'hct']},
  {k: 'ho', n: 'Hormônios', c: 'var(--red2)', v: ['na', 'adr', 'ins', 'glu', 'cort', 'gh', 'adh', 'aldo', 'epo']},
  {k: 'rn', n: 'Rins e digestão', c: 'var(--teal)', v: ['rbf', 'gfr', 'uflow', 'uosm', 'gast']}
];
/* nome, unidade, casas, limiar absoluto para "≈" */
FA.V = {
  fc: ['Frequência cardíaca', 'bpm', 0], vs: ['Volume sistólico', 'mL', 0], q: ['Débito cardíaco', 'L/min', 1], pas: ['Pressão sistólica', 'mmHg', 0, 3], pad: ['Pressão diastólica', 'mmHg', 0, 5], avo2: ['Diferença a-vO₂', 'mL/100 mL', 1],
  mus: ['Fluxo para músculos', 'L/min', 1], pele: ['Fluxo para a pele', 'L/min', 1], visc: ['Fluxo para vísceras', 'L/min', 1],
  ve: ['Ventilação (VE)', 'L/min', 0], fr: ['Frequência respiratória', 'rpm', 0], vt: ['Volume corrente', 'L', 2], vevo2: ['Equivalente VE/VO₂', '', 1, .8], vevco2: ['Equivalente VE/VCO₂', '', 1, .8], spo2: ['Saturação de O₂', '%', 0, 1.5], pio2: ['PO₂ inspirada', 'mmHg', 0], hb: ['Hemoglobina', 'g/dL', 1, .3], cao2: ['Conteúdo arterial de O₂', 'mL/100 mL', 1, .4],
  vo2: ['VO₂', 'mL/kg/min', 1], relp: ['Intensidade relativa', '% VO₂máx', 0], lac: ['Lactato sanguíneo', 'mmol/L', 1], ph: ['pH sanguíneo', '', 2, .02], rer: ['Quociente respiratório (RER)', '', 2, .03], cho: ['Energia de carboidratos', '%', 0, 4], kcal: ['Gasto energético', 'kcal/min', 1], glyc: ['Glicogênio muscular', '% restante', 0, 3], gli: ['Glicemia', 'mg/dL', 0, 4],
  tc: ['Temperatura central', '°C', 1, .2], sw: ['Taxa de suor', 'L/h', 1, .1], dpv: ['Volume plasmático', '% vs. base', 0, 2], hct: ['Hematócrito', '%', 0, 1],
  na: ['Noradrenalina', 'índice', 0, 4], adr: ['Adrenalina', 'índice', 0, 4], ins: ['Insulina', 'índice', 0, 4], glu: ['Glucagon', 'índice', 0, 4], cort: ['Cortisol', 'índice', 0, 4], gh: ['GH', 'índice', 0, 4], adh: ['ADH (vasopressina)', 'índice', 0, 4], aldo: ['Aldosterona', 'índice', 0, 4], epo: ['Eritropoetina (EPO)', 'índice', 0, 4],
  rbf: ['Fluxo sanguíneo renal', 'L/min', 2], gfr: ['Filtração glomerular (TFG)', 'mL/min', 0], uflow: ['Produção de urina', 'mL/min', 1, .1], uosm: ['Concentração da urina', 'mOsm/kg', 0], gast: ['Esvaziamento gástrico', '% do repouso', 0, 4]
};
FA.HORM = new Set(FA.SYS[4].v);
FA.SIMPLEV = new Set(['fc', 'q', 'pas', 'mus', 'pele', 'visc', 've', 'fr', 'spo2', 'vo2', 'lac', 'cho', 'kcal', 'glyc', 'gli', 'tc', 'sw', 'adr', 'ins', 'cort', 'adh', 'uflow', 'uosm']);
FA.sysOf = k => FA.SYS.find(s => s.v.includes(k));
FA.fmt = (k, x) => nf(x, FA.V[k][2]);
FA.unit = k => FA.HORM.has(k) ? '/100' : FA.V[k][1];
FA.dirOf = (k, a, b) => { const d = b - a, e = FA.V[k][3]; const big = e !== undefined ? Math.abs(d) >= e : Math.abs(d) / Math.max(Math.abs(a), 1e-6) >= .03; return big ? (d > 0 ? '↑' : '↓') : '≈'; };
FA.restOf = p => ({...p, int: 0, dur: 5, temp: 22, ur: 50, alt: 0, desid: 0, cho: 0, accH: 0, accA: 0});
FA.desc = p => {
  const a = [p.int ? p.int + '% do VO₂máx, ' + p.dur + ' min' : 'repouso', p.temp + ' °C' + (p.temp > 20 && p.ur !== 50 ? ' (UR ' + p.ur + '%)' : ''), nf(p.alt, 0) + ' m'];
  if (p.desid) a.push(nf(p.desid, 1) + '% desidratado');
  a.push((p.tr ? 'treinado' : 'sedentário') + (p.sex === 'F' ? ', mulher' : '') + (p.age !== 20 ? ', ' + p.age + ' anos' : ''));
  if (p.bb) a.push('betabloqueador');
  if (p.cho) a.push(p.cho + ' g/h de carboidrato');
  if (p.accH) a.push(p.accH + ' dias aclimatando ao calor');
  if (p.accA) a.push(p.accA + ' dias na altitude');
  return a.join(' · ');
};
FA.speed = m => { const v = m.req; if (v <= 3.6) return 'repouso'; if (v <= 14.3) return `≈ caminhar a ${nf((v - 3.5) / .1 * .06, 1)} km/h`; const run = (v - 3.5) / .2 * .06; return run >= 6 ? `≈ correr a ${nf(run, 1)} km/h` : '≈ caminhada rápida em subida'; };

/* explicações: primeiro item = mecanismo; demais = condicionais */
const T = s => `<span class="tag">${s}</span>`;
FA.W = {
fc: (m, p) => [`A FC sobe quase em linha reta com a intensidade relativa. Até ~100 bpm o que pesa é a retirada do tônus vagal (parassimpático) sobre o nó sinoatrial; acima disso, a ativação simpática e as catecolaminas assumem.`,
  p.tr && `${T('Treinado:')} FC de repouso menor (mais tônus vagal e mais volume sistólico), mas FCmáx praticamente igual: a reserva de FC é maior.`,
  p.age > 30 && `${T(p.age + ' anos:')} a FCmáx cai com a idade (≈ 208 − 0,7 × idade, Tanaka 2001), hoje ${nf(m.fcMax, 0)} bpm. A mesma intensidade relativa dá FC absoluta menor.`,
  p.bb && `${T('Betabloqueador:')} bloqueia receptores β1 do coração. FC de repouso e máxima ficam ~20 a 25% menores; o VS e a extração de O₂ compensam em parte. Por isso a prescrição por FC deixa de valer: usa-se a escala de percepção de esforço (Borg).`,
  m.tEff >= 28 && m.r > 0 && `${T('Calor:')} parte do sangue vai para a pele, o retorno venoso cai, o volume sistólico cai e a FC sobe para manter o débito (deriva cardiovascular).`,
  p.accH > 0 && `${T('Aclimatação ao calor (' + p.accH + ' dias):')} mais plasma e suor mais precoce reduzem a FC no calor; quase completa em 10 a 14 dias.`,
  p.desid >= 1 && `${T('Desidratação de ' + nf(p.desid, 1) + '%:')} menos plasma, menor pré-carga. A FC sobe cerca de 3 a 8 bpm por 1% de massa perdida (Montain e Coyle, 1992).`,
  p.alt >= 1500 && `${T('Altitude:')} o VO₂máx cai, então a mesma carga vira uma fração maior dele; somado à hipóxia que ativa o simpático, a FC fica maior para a mesma velocidade.`,
  p.temp < 10 && m.r < .3 && `${T('Frio:')} o tremor aumenta o metabolismo e a vasoconstrição periférica eleva a pressão; a FC sobe um pouco.`,
  m.r > 0 && p.dur >= 40 && `${T('Tempo longo:')} com ${p.dur} min a FC deriva para cima mesmo sem mudar o ritmo, efeito de calor acumulado e perda de plasma.`],
vs: (m, p) => [`O volume sistólico sobe com o exercício pela lei de Frank-Starling (mais retorno venoso pela bomba muscular e respiratória) e pela maior contratilidade simpática. Em sedentários ele estabiliza por volta de 40 a 60% do VO₂máx; em treinados pode continuar subindo.`,
  p.tr && `${T('Treinado:')} coração com cavidade maior e mais volume plasmático: VS bem mais alto em repouso e no esforço. É a principal adaptação que explica o VO₂máx maior.`,
  p.sex === 'F' && `${T('Mulher:')} coração e volume sanguíneo menores em média, VS absoluto menor; a FC compensa um pouco.`,
  p.bb && `${T('Betabloqueador:')} com a FC limitada, o enchimento diastólico fica mais longo e o VS aumenta.`,
  (m.tEff >= 28 || p.desid >= 1) && m.r > 0 && `${T('Calor ou desidratação:')} menos sangue volta ao coração (pele dilatada, plasma reduzido), o enchimento diminui e o VS cai.`,
  m.r > 0 && p.dur >= 40 && `Com o passar do tempo o VS cai aos poucos enquanto a FC sobe: é a deriva cardiovascular (Coyle e González-Alonso, 2001; Souissi et al., 2021).`,
  p.alt >= 1500 && `Na altitude o plasma diminui nos primeiros dias e o VS cai, compensado pela FC.`],
q: (m, p) => [`Débito cardíaco = FC × VS. Ele sobe linearmente com o consumo de O₂: cerca de 5 a 6 L de sangue a mais para cada litro de O₂. Vai de ~5 L/min em repouso a ~18 L/min (sedentário) ou ~25 L/min (treinado) no máximo.`,
  p.tr && `O treinado alcança um débito máximo maior porque o VS é maior; a FCmáx é a mesma.`,
  p.alt >= 1500 && m.r > 0 && `Na hipóxia aguda o débito para uma mesma carga submáxima fica um pouco maior, compensando o sangue com menos O₂.`,
  (m.tEff >= 30 || p.desid >= 2) && m.r > .6 && `Em intensidade alta no calor ou desidratado, o débito começa a cair: o coração não consegue atender músculo e pele ao mesmo tempo.`],
pas: (m, p) => [`A sistólica sobe com o exercício dinâmico porque o débito cardíaco aumenta: de ~120 para 170 a 200 mmHg no máximo. Subir é o esperado; não subir, ou cair com o aumento da carga, é sinal de alerta em teste de esforço.`,
  p.age > 40 && `Com a idade as artérias ficam mais rígidas e a sistólica de repouso e de esforço tende a ser maior.`,
  m.tEff >= 28 && m.r > 0 && `No calor, a vasodilatação da pele reduz a resistência periférica e segura um pouco a pressão.`,
  p.temp < 10 && `O frio contrai os vasos da pele e aumenta a pressão.`,
  `No exercício de força com carga alta a resposta é bem diferente: veja a aba Força.`],
pad: (m, p) => [`A diastólica fica estável ou cai levemente no exercício aeróbio: as arteríolas dos músculos ativos se dilatam (metabólitos, NO, K⁺, adenosina) e a resistência periférica total cai, compensando o débito maior. Na prova, o certo é "mantém ou cai pouco".`,
  `No exercício de força com carga alta a compressão mecânica dos vasos (e a manobra de Valsalva) faz a diastólica subir muito: veja a aba Força.`,
  m.tEff >= 28 && `O calor dilata os vasos da pele e baixa um pouco a diastólica.`],
avo2: (m, p) => [`É quanto O₂ os tecidos retiram de cada 100 mL de sangue (equação de Fick: VO₂ = DC × dif. a-vO₂). Sobe de ~5 em repouso para 15 a 17 no máximo: o músculo ativo recebe a maior parte do fluxo e extrai muito mais O₂ (efeito Bohr: calor, CO₂ e acidez soltam O₂ da hemoglobina; veja a aba Hemoglobina).`,
  p.tr && `Treinamento aeróbio aumenta capilares e mitocôndrias, o que amplia a extração periférica.`,
  p.bb && `Com betabloqueador a extração aumenta para compensar o débito menor.`,
  p.alt >= 1500 && `Na altitude o sangue arterial chega com menos O₂ (${nf(m.cao2, 1)} mL/100 mL), então sobra menos para extrair.`],
mus: (m, p) => [`Em repouso os músculos recebem ~20% do débito. No esforço máximo chegam a 80 a 85%, por dois mecanismos: vasodilatação local no músculo ativo (simpatólise funcional) e vasoconstrição simpática nos órgãos que podem esperar.`,
  m.tEff >= 28 && m.r > 0 && `${T('Calor:')} a pele compete pelo débito. O músculo recebe menos do que receberia a 20 °C na mesma intensidade, e isso ajuda a explicar a queda de rendimento (Rowell, 1974; Joyner e Casey, 2015).`],
pele: (m, p) => [`O fluxo para a pele é a via de levar calor do centro do corpo à superfície. Cresce no exercício leve e moderado conforme a temperatura central sobe, e é limitado em intensidades muito altas, quando o simpático prioriza o músculo.`,
  m.tEff >= 28 && `${T('Calor (' + p.temp + ' °C' + (p.ur > 50 ? ', UR ' + p.ur + '%' : '') + '):')} com ambiente quente o gradiente pele–ar é pequeno, então o corpo manda muito mais sangue à pele e depende do suor.`,
  p.ur >= 70 && p.temp > 20 && `${T('Umidade alta:')} o suor evapora mal e escorre sem resfriar. O estresse térmico real fica como se fizesse ${nf(m.tEff, 0)} °C.`,
  p.temp < 10 && `${T('Frio:')} vasoconstrição da pele para conservar calor; o fluxo cai abaixo do repouso normal.`,
  p.desid >= 1 && `Desidratado, o corpo protege o volume central e reduz o fluxo para a pele, o que aquece mais rápido o centro.`],
visc: (m, p) => [`Fígado, intestino e rins recebem ~45% do débito em repouso. No exercício o simpático os contrai e o fluxo cai para ~20 a 30% do valor de repouso: sobra sangue para músculo e pele.`,
  m.r > .7 && `Por isso comer muito antes de treinar forte pode dar desconforto: a digestão fica com pouco fluxo.`,
  p.desid >= 1 && `A queda do fluxo renal ativa o sistema renina-angiotensina-aldosterona.`],
ve: (m, p) => [`A ventilação acompanha a produção de CO₂. Até o 1º limiar ventilatório (VT1) sobe em proporção ao VO₂; entre VT1 e VT2 sobe junto com o VCO₂ extra do tamponamento do H⁺ pelo bicarbonato (tamponamento isocápnico); acima do VT2 dispara, porque o próprio H⁺ estimula os quimiorreceptores (compensação respiratória). Veja a aba Teste incremental.`,
  p.alt >= 1500 && `${T('Altitude:')} a PO₂ baixa estimula os corpos carotídeos (resposta ventilatória à hipóxia). Respira-se mais para a mesma carga, até em repouso.`,
  p.accA > 0 && p.alt >= 1500 && `Nos primeiros dias na altitude a ventilação continua aumentando (aclimatação ventilatória), e o rim elimina bicarbonato para corrigir a alcalose respiratória.`,
  m.tc >= 38.5 && `Com temperatura central de ${nf(m.tc, 1)} °C a hipertermia também estimula a respiração.`],
fr: (m, p) => [`Em esforço leve a ventilação aumenta principalmente pelo volume corrente; em intensidades altas a frequência respiratória responde por quase todo o aumento, chegando a 40 a 50 rpm.`],
vt: (m, p) => [`O volume corrente sobe até cerca de 50 a 60% da capacidade vital e então estabiliza: aumentar mais custaria trabalho respiratório demais, e a frequência assume.`],
vevo2: (m, p) => [`Litros de ar ventilados para cada litro de O₂ consumido. Cai no início do exercício e fica no mínimo até o VT1; quando começa a subir sem que o VE/VCO₂ suba junto, você encontrou o 1º limiar ventilatório.`],
vevco2: (m, p) => [`Litros de ar para cada litro de CO₂ produzido. Fica estável ou cai um pouco até o VT2 (o CO₂ extra do bicarbonato é eliminado na mesma proporção). Quando passa a subir, a ventilação está compensando a acidose: é o VT2, ou ponto de compensação respiratória.`],
spo2: (m, p) => [`A saturação depende da PO₂ alveolar e da curva de dissociação da hemoglobina. Na parte plana da curva (ao nível do mar) a SpO₂ fica em 97 a 98% mesmo no esforço máximo, na maioria das pessoas.`,
  p.alt >= 1500 && `${T('Altitude de ' + nf(p.alt, 0) + ' m:')} a PO₂ inspirada cai para ${nf(m.pio2, 0)} mmHg e o alvéolo trabalha na parte íngreme da curva. No exercício o sangue passa mais rápido pelo capilar pulmonar e satura menos ainda.`,
  p.accA > 0 && p.alt >= 1500 && `Com ${p.accA} dias de aclimatação a ventilação maior eleva a PO₂ alveolar e a saturação melhora um pouco.`,
  p.tr && m.r > .85 && `Atletas treinados podem dessaturar mesmo ao nível do mar no esforço máximo (hipoxemia arterial induzida pelo exercício; Dempsey e Wagner, 1999).`],
pio2: (m, p) => [`A fração de O₂ no ar é sempre 20,93%. O que muda com a altitude é a pressão barométrica: PIO₂ = (Pb − 47) × 0,2093. Ao nível do mar dá ~150 mmHg; a 3.600 m (La Paz), ~95 mmHg.`],
hb: (m, p) => [`A concentração de hemoglobina muda no exercício quase só por concentração do sangue: quando o plasma sai dos vasos, a mesma Hb fica em menos volume.`,
  p.sex === 'F' && `Mulheres têm, em média, Hb ~1,5 g/dL menor, por efeito da testosterona sobre a eritropoese e das perdas menstruais.`,
  p.tr && `No treinado o plasma aumenta mais que as hemácias e a Hb parece menor ("pseudoanemia do atleta"), embora a massa total de Hb seja maior.`,
  p.alt >= 1500 && `Na altitude a Hb sobe primeiro pela perda de plasma (dias) e depois por produção nova de hemácias via EPO (semanas).`],
cao2: (m, p) => [`CaO₂ ≈ 1,34 × Hb × SaO₂. É quanto O₂ cada 100 mL de sangue arterial carrega (~20 mL/100 mL ao nível do mar). O O₂ dissolvido no plasma é desprezível perto disso.`,
  p.alt >= 1500 && `Na altitude o CaO₂ cai pela queda da saturação; aclimatação (mais Hb) recupera parte disso. Base do "viver no alto, treinar embaixo" (Levine e Stray-Gundersen, 1997; meta-análise de Deng et al., 2025).`],
vo2: (m, p) => [`O VO₂ é a carga absoluta: quanto O₂ o corpo usa por minuto e por kg. Em repouso vale 3,5 mL/kg/min (1 MET). Para a mesma velocidade o VO₂ é praticamente igual em qualquer pessoa ou ambiente; o que muda é quanto isso representa do máximo de cada um.`,
  p.temp < 10 && m.r < .3 && `${T('Frio:')} o tremor aumenta o VO₂ em repouso e em esforço leve.`,
  m.rel > 1 && `A carga pedida (${nf(m.req, 1)}) passa do VO₂máx disponível (${nf(m.vmax, 1)}): o excedente vem do metabolismo anaeróbio e o esforço dura pouco.`],
relp: (m, p) => [`Intensidade relativa = carga ÷ VO₂máx disponível agora. É ela, e não a velocidade, que comanda FC, lactato, temperatura e hormônios.`,
  p.alt >= 1500 && `Na altitude o VO₂máx cai ~7% a cada 1.000 m acima de ~1.000 m (Wehrlin e Hallén, 2006). Hoje ele está em ${nf(m.vmax, 1)} mL/kg/min, então o mesmo ritmo fica relativamente mais pesado.`,
  p.age > 25 && `O VO₂máx cai cerca de 1% ao ano a partir dos 25 anos em sedentários; o treino reduz essa perda pela metade.`,
  (p.desid >= 2 || m.tEff >= 30) && `Calor forte e desidratação acima de ~2% também reduzem o VO₂máx.`],
lac: (m, p) => [`O lactato no sangue é o saldo entre produção (glicólise rápida, fibras tipo II, catecolaminas) e remoção (coração, fígado, fibras oxidativas). Até o 1º limiar fica perto do repouso (~1 a 2 mmol/L); entre os limiares sobe devagar até ~4 mmol/L; acima do 2º limiar dispara.`,
  p.tr && `${T('Treinado:')} os limiares vão para a direita (~65% e ~85% do VO₂máx) por mais mitocôndrias, mais transportadores MCT e mais remoção. Na mesma intensidade relativa, menos lactato.`,
  m.glyc < 40 && m.r > 0 && `Com glicogênio baixo a glicólise desacelera e o lactato tende a cair mesmo com o esforço parecendo mais difícil.`,
  m.tEff >= 28 && m.r > 0 && `O calor aumenta catecolaminas e glicogenólise, o que eleva um pouco o lactato.`],
ph: (m, p) => [`O pH cai no exercício intenso pelo acúmulo de H⁺, que vem principalmente da hidrólise de ATP e da glicólise. O lactato em si não é a causa da acidose; ele sobe junto e funciona como marcador (Robergs et al., 2004; Brooks, 2020). Bicarbonato, fosfatos e proteínas tamponam, e a hiperventilação elimina CO₂ para compensar.`],
rer: (m, p) => [`RER = VCO₂ ÷ VO₂. Gordura pura dá ~0,70; carboidrato puro, 1,00. Ele sobe com a intensidade porque o corpo passa a usar mais carboidrato, e passa de 1,0 no esforço máximo por causa do CO₂ extra do tamponamento pelo bicarbonato. RER ≥ 1,10 é um dos critérios de VO₂máx.`,
  m.r > 0 && p.dur >= 45 && `Em exercício longo o RER cai aos poucos: o glicogênio diminui e a oxidação de gordura aumenta.`,
  p.cho > 0 && m.r > 0 && `Ingerindo ${p.cho} g/h de carboidrato, parte da energia vem dessa glicose e o RER fica um pouco mais alto.`,
  p.tr && `Treinados oxidam mais gordura na mesma intensidade relativa, poupando glicogênio.`],
cho: (m, p) => [`Conceito do "crossover" (Brooks e Mercier, 1994; Brooks, 2020): quanto maior a intensidade, maior a parte da energia vinda de carboidrato; em repouso e em esforço leve predomina a gordura. Calculado aqui pelo RER não proteico.`,
  m.r > 0 && p.dur >= 60 && `Com tempo longo a contribuição de gordura volta a crescer porque o glicogênio está acabando.`],
kcal: (m, p) => [`Cada litro de O₂ consumido libera cerca de 4,7 (gordura) a 5,0 kcal (carboidrato). Por isso o gasto energético acompanha o VO₂ absoluto (e a massa corporal), e o tipo de substrato muda só um pouco o valor.`],
glyc: (m, p) => [`O glicogênio muscular é gasto mais rápido quanto maior a intensidade: em ~70 a 75% do VO₂máx dura cerca de 90 a 120 min sem ingestão de carboidrato. Abaixo de ~25% quase não se gasta.`,
  p.tr && `Treinados guardam mais glicogênio e o poupam usando mais gordura.`,
  p.cho > 0 && `Carboidrato durante o exercício (${p.cho} g/h) protege principalmente o glicogênio do fígado e a glicemia; a economia de glicogênio muscular é pequena.`,
  (m.tEff >= 28 || p.alt >= 1500) && m.r > 0 && `Calor e altitude aceleram o uso de glicogênio (mais catecolaminas, mais glicogenólise).`,
  m.glyc < 20 && m.r > 0 && `Abaixo de ~20% o ritmo não se sustenta: é o famoso "bater no muro".`],
gli: (m, p) => [`A glicemia fica estável porque o fígado libera glicose (glicogenólise e gliconeogênese) na mesma velocidade em que o músculo a capta, comandado por glucagon alto, insulina baixa e catecolaminas.`,
  m.r > .8 && `Em esforço muito intenso as catecolaminas fazem o fígado liberar mais glicose do que é usado, e a glicemia sobe.`,
  m.glyc < 30 && m.r > 0 && (p.cho >= 60 ? `Com ${p.cho} g/h de carboidrato a glicemia se mantém mesmo com o glicogênio muscular baixo.` : `Em exercício muito longo o glicogênio hepático acaba e a glicemia cai. Ingerir carboidrato evita isso: 30 a 60 g/h em treinos de 1 a 2,5 h e até 90 g/h (glicose + frutose) em provas mais longas; atletas treinados podem tolerar até ~120 g/h (Morton et al., 2026).`)],
tc: (m, p) => [`Cerca de 75 a 80% da energia gasta vira calor. A temperatura central sobe até um novo platô proporcional à intensidade relativa, e esse platô quase não depende do ambiente enquanto o corpo consegue dissipar o calor (Nielsen, 1938; Cramer et al., 2022).`,
  m.tEff >= 28 && `${T('Ambiente a ' + p.temp + ' °C' + (p.ur > 50 ? ' com UR ' + p.ur + '%' : '') + ':')} a perda por convecção e radiação diminui e o corpo depende do suor; o platô sobe.`,
  p.accH > 0 && `A aclimatação ao calor baixa a temperatura central de repouso e de exercício e adianta o início do suor (Périard et al., 2021).`,
  p.desid >= 1 && `Desidratação eleva a temperatura central em ~0,1 a 0,2 °C para cada 1% de massa perdida.`,
  m.tc >= 39.5 && `Acima de ~39,5 a 40 °C o desempenho cai e aumenta o risco de doença pelo calor.`],
sw: (m, p) => [`Evaporar 1 L de suor retira cerca de 580 kcal. A taxa de suor sobe com a intensidade e com o calor e costuma ficar entre 0,5 e 2 L/h. A recomendação é beber para evitar perder mais de ~2% da massa corporal (Sawka et al., 2007; Périard et al., 2021).`,
  p.tr && `Treinados (e aclimatados) começam a suar mais cedo e suam mais.`,
  p.accH > 0 && `Com aclimatação ao calor o suor aumenta e fica mais diluído (perde-se menos sódio).`,
  p.sex === 'F' && `Mulheres suam em média um pouco menos, principalmente pela menor massa corporal e taxa metabólica absoluta.`,
  p.ur >= 70 && p.temp > 20 && `Com umidade alta boa parte do suor escorre sem evaporar e não resfria.`,
  p.desid >= 2 && `Muito desidratado, o corpo passa a economizar água e sua menos, o que aquece o centro.`],
dpv: (m, p) => [`No exercício o plasma escapa para o interstício do músculo ativo (pressão capilar e osmolalidade maiores) e se perde no suor. Em esforço intenso cai 10 a 15% em poucos minutos.`,
  p.tr && `Treinamento aeróbio aumenta o volume plasmático de base em ~10 a 15% em uma a duas semanas.`,
  p.accH > 0 && `A aclimatação ao calor também expande o plasma.`,
  p.alt > 1500 && `Na altitude o plasma diminui nos primeiros dias (diurese e perda respiratória de água).`,
  p.desid >= 1 && `Desidratação de ${nf(p.desid, 1)}% reduz ainda mais o plasma.`],
hct: (m, p) => [`O hematócrito sobe no exercício por hemoconcentração (menos plasma, mesmas hemácias), não por produção nova de hemácias.`,
  p.tr && `No treinado o hematócrito de repouso é um pouco menor porque o plasma aumentou mais que as hemácias.`,
  p.accA > 7 && p.alt > 1500 && `Depois de semanas na altitude a massa de hemácias aumenta de verdade.`],
na: (m, p) => [`A noradrenalina vem das terminações simpáticas. Sobe pouco até ~50% do VO₂máx e depois de forma exponencial; contrai vasos das vísceras, aumenta FC e contratilidade.`,
  (m.tEff >= 28 || p.alt >= 1500 || p.desid >= 1 || p.temp < 10) && `Calor, frio, altitude e desidratação são estresses extras que aumentam a resposta simpática.`],
adr: (m, p) => [`A adrenalina vem da medula da suprarrenal e responde sobretudo a esforços intensos e à queda da glicemia. Estimula glicogenólise no músculo e no fígado e lipólise.`],
ins: (m, p) => [`A insulina cai no exercício (ação alfa-adrenérgica sobre as células beta do pâncreas). Mesmo assim o músculo capta glicose, porque a contração leva o GLUT4 à membrana sem precisar de insulina.`,
  p.cho > 0 && m.r > 0 && `Ingerir carboidrato durante o exercício segura um pouco a queda da insulina.`],
glu: (m, p) => [`O glucagon sobe com a intensidade e principalmente com a duração, mantendo a liberação de glicose pelo fígado.`],
cort: (m, p) => [`O cortisol sobe em esforços acima de ~60% do VO₂máx e em exercícios longos; estimula gliconeogênese e mobilização de gordura e proteína.`,
  p.cho > 0 && p.dur > 60 && `Carboidrato durante provas longas atenua a subida do cortisol.`],
gh: (m, p) => [`O GH sobe com intensidade acima do limiar e com alguns minutos de esforço; favorece a lipólise e poupa glicose.`],
adh: (m, p) => [`O ADH responde ao aumento da osmolalidade e à queda de volume plasmático: faz o rim reabsorver água para conservar líquido.`,
  p.desid >= 1 && `Com ${nf(p.desid, 1)}% de desidratação a resposta é forte.`,
  p.temp < 10 && `No frio a vasoconstrição aumenta o volume central e o ADH cai: é a diurese induzida pelo frio.`],
aldo: (m, p) => [`Menos fluxo renal e mais simpático ativam renina-angiotensina; a aldosterona faz o rim reter sódio e, junto, água.`],
epo: (m, p) => [`A EPO é produzida no rim quando ele detecta hipóxia (via HIF). Sobe em horas na altitude, faz pico em 1 a 3 dias e depois cai parcialmente; o efeito no número de hemácias leva semanas.`,
  p.alt < 1500 && `Ao nível do mar e em altitudes baixas ela praticamente não muda com o exercício.`]
};
FA.W.rbf = (m, p) => [`Em repouso os rins recebem ~20% do débito cardíaco (~1,1 L/min). No exercício o simpático contrai as arteríolas renais e o fluxo cai para 25 a 50% do repouso: o sangue vai para músculo e pele.`, p.desid >= 1 && `A desidratação reduz ainda mais o fluxo renal.`, m.r > .8 && `Em esforço muito intenso e longo (principalmente no calor e desidratado) essa queda pode chegar a lesão renal aguda transitória.`];
FA.W.gfr = (m, p) => [`A filtração glomerular cai menos que o fluxo renal: a arteríola eferente também se contrai e mantém a pressão no glomérulo. A fração filtrada aumenta.`, m.r > .7 && `Depois de esforços intensos é comum aparecer proteína na urina por algumas horas (proteinúria do exercício), sem significado de doença.`];
FA.W.uflow = (m, p) => [`A produção de urina cai no exercício: menos filtração e mais ADH e aldosterona fazendo o rim reabsorver água e sódio. O corpo guarda água para o suor e para o volume de sangue.`, p.temp < 10 && `No frio a vasoconstrição joga sangue para o centro, o ADH cai e a vontade de urinar aumenta (diurese do frio).`, p.desid >= 1 && `Desidratado, o rim economiza ainda mais.`];
FA.W.uosm = (m, p) => [`Com ADH alto o rim devolve água ao sangue e a urina sai mais concentrada e escura. A cor da urina é um jeito prático de acompanhar a hidratação do aluno (escala de cor de Armstrong).`];
FA.W.gast = (m, p) => [`Até ~70% do VO₂máx o estômago esvazia quase no ritmo normal. Acima disso, com pouco fluxo para as vísceras, a digestão desacelera: por isso géis e bebidas são mais bem tolerados em ritmo moderado.`, (m.tEff >= 28 || p.desid >= 2) && `Calor e desidratação pioram o esvaziamento e aumentam desconfortos intestinais em provas longas.`];

/* explicações em linguagem simples (versão simples) */
FA.WS = {
  fc: `O coração bate mais rápido para mandar mais sangue com oxigênio para os músculos. Quanto mais forte o exercício, mais batimentos.`,
  q: `É quanto sangue o coração bombeia por minuto. Em repouso ~5 litros; num exercício forte pode passar de 20 litros.`,
  pas: `A pressão "de cima" sobe no exercício porque o coração está bombeando mais sangue.`,
  mus: `Os músculos que trabalham recebem muito mais sangue, porque precisam de oxigênio e combustível.`,
  pele: `A pele recebe sangue para jogar o calor do corpo para fora. No calor ela "rouba" sangue dos músculos.`,
  visc: `Estômago, intestino e rins recebem menos sangue no exercício: o corpo prioriza os músculos.`,
  ve: `É quanto ar entra nos pulmões por minuto. Sobe com o exercício para pegar oxigênio e tirar gás carbônico.`,
  fr: `Quantas vezes você respira por minuto.`,
  spo2: `Quanto do sangue está carregado de oxigênio. Normal é 95 a 99%; na altitude cai.`,
  vo2: `Quanto oxigênio o corpo usa por minuto. É a medida da "força do motor" aeróbio.`,
  lac: `O lactato sobe quando o exercício fica pesado. Ele não é o vilão da dor muscular: serve até de combustível. É um sinal de que a intensidade passou do limiar.`,
  cho: `Quanto da energia vem do carboidrato. Exercício leve usa mais gordura; exercício forte usa mais carboidrato.`,
  kcal: `Quantas calorias o corpo gasta por minuto.`,
  glyc: `É o estoque de carboidrato dentro do músculo. Quando acaba, a pessoa "quebra" e não consegue manter o ritmo.`,
  gli: `O açúcar no sangue. O fígado trabalha para mantê-lo estável; em treinos muito longos sem comer, pode cair.`,
  tc: `A temperatura do corpo sobe no exercício porque os músculos produzem calor. Acima de ~40 °C fica perigoso.`,
  sw: `O suor resfria o corpo quando evapora. No calor a pessoa pode perder 1 a 2 litros por hora.`,
  adr: `A adrenalina é o hormônio do "modo ação": acelera o coração e libera combustível.`,
  ins: `A insulina cai no exercício. Mesmo assim o músculo consegue pegar açúcar do sangue.`,
  cort: `O cortisol sobe em treinos fortes ou longos e ajuda a liberar combustível.`,
  adh: `O ADH é o hormônio que segura água no corpo: faz o rim produzir menos urina.`,
  uflow: `No exercício o corpo produz menos urina para guardar água.`,
  uosm: `Quanto mais concentrada, mais escura a urina. Urina escura é sinal de pouca água.`
};
FA.why = (k, m, p) => FA.simple && FA.WS[k] ? [FA.WS[k]] : FA.W[k](m, p).filter(Boolean);
}
