/* apresentação guiada + roteador */
{
const FA = window.FA, $ = FA.$, nf = FA.nf;
const B = {...FA.P0, int: 60, dur: 30};
const pc = (m, k) => nf(m[k] / m.q * 100, 0) + '%';
const STEPS = [
  {v: 'geral', t: 'O corpo inteiro durante um treino', x: () => `Uma corrida de 45 min simulada minuto a minuto. Cada órgão acende conforme trabalha, e os gráficos vão sendo desenhados enquanto o treino acontece. Cada sistema tem a sua aba logo acima.`, go: () => { FA.SS.proto = 'cont'; FA.SS.env = 'ameno'; FA.simulate(); FA.SS.cur = 0; FA.sessUpd(); $('#pl-play').click(); }},
  {v: 'calor', t: 'O mesmo treino no calor úmido', x: () => `A 32 °C e 75% de umidade o ar quase não aceita mais vapor: boa parte do suor escorre sem resfriar, o calor se acumula e a temperatura central sobe. As faixas mostram, em watts, por onde o calor entra e sai.`, go: () => { FA.SS.env = 'calor'; FA.simulate(); FA.SS.cur = FA.SS.D.T * .55; FA.sessUpd(); }},
  {v: 'simulador', t: 'Repouso: o ponto de partida', P: {...B, int: 0, dur: 5}, sel: 'q',
    x: m => `Em repouso o coração bombeia ~${nf(m.q, 1)} L/min a ${nf(m.fc, 0)} bpm. Os músculos recebem só ${pc(m, 'mus')} desse sangue; as vísceras, ${pc(m, 'visc')}. O coração na figura bate na frequência calculada.`},
  {v: 'simulador', t: 'Começou a correr (60% do VO₂máx)', P: {...B}, A: {...B, int: 0, dur: 5}, sel: 'mus',
    x: m => `O débito vai a ${nf(m.q, 1)} L/min e o músculo passa a receber ${pc(m, 'mus')}. Vasodilatação local no músculo, vasoconstrição simpática nas vísceras. As setas agora comparam com o repouso.`},
  {v: 'simulador', t: 'Passou do 2º limiar', P: {...B, int: 88, dur: 15}, A: {...B}, sel: 'lac',
    x: m => `A 88% o lactato chega a ${nf(m.lac, 1)} mmol/L, o pH cai para ${nf(m.ph, 2)} e a ventilação dispara (${nf(m.ve, 0)} L/min). A produção de lactato supera a remoção.`},
  {v: 'simulador', t: 'Esforço máximo', P: {...B, int: 100, dur: 5}, A: {...B, int: 0, dur: 5}, sel: 'pad',
    x: m => `No máximo o RER passa de 1 (${nf(m.rer, 2)}) pelo CO₂ do tamponamento. A sistólica vai a ${nf(m.pas, 0)} mmHg, mas a diastólica fica em ~${nf(m.pad, 0)}: a resistência periférica cai.`},
  {v: 'simulador', t: 'Mesma corrida no calor úmido', P: {...B, dur: 45, temp: 32, ur: 75}, A: {...B, dur: 45}, sel: 'pele',
    x: m => `Com 32 °C e 75% de umidade a pele pede ${nf(m.pele, 1)} L/min para dissipar calor. O músculo perde sangue, o volume sistólico cai e a FC sobe para ${nf(m.fc, 0)} bpm (deriva cardiovascular).`},
  {v: 'simulador', t: 'Mesma corrida em La Paz (3.600 m)', P: {...B, alt: 3600}, A: {...B}, sel: 'spo2',
    x: m => `A PO₂ inspirada cai para ${nf(m.pio2, 0)} mmHg e a SpO₂ para ${nf(m.spo2, 0)}%. O VO₂máx diminui, então o mesmo ritmo vira ${nf(m.relp, 0)}% do máximo: mais FC, mais lactato, mais ventilação.`},
  {v: 'simulador', t: 'Sedentário x treinado na mesma velocidade', P: {...B, int: 48, tr: true}, A: {...B, int: 70}, sel: 'lac',
    x: m => `Na mesma velocidade (~8 km/h) o treinado está a ${nf(m.relp, 0)}% do máximo: FC ${nf(m.fc, 0)} bpm e lactato ${nf(m.lac, 1)} mmol/L. Volume sistólico maior e limiares deslocados para a direita.`},
  {v: 'simulador', t: 'Aluno com betabloqueador', P: {...B, bb: true}, A: {...B}, sel: 'fc',
    x: m => `A FC fica em ${nf(m.fc, 0)} bpm e a máxima em ${nf(m.fcMax, 0)}. O volume sistólico e a extração compensam. Aplicação prática: prescrever pela percepção de esforço, não pela FC.`},
  {v: 'teste', t: 'Teste incremental', x: () => `O mesmo modelo gera um teste ergoespirométrico em rampa. VT1: o VE/VO₂ começa a subir; VT2: o VE/VCO₂ também. Embaixo, a checagem dos critérios de VO₂máx. Há um desafio para marcar os limiares no gráfico.`, go: () => { const b = $('#t-play'); if (b && b.textContent !== 'Pausar') b.click(); }},
  {v: 'cinetica', t: 'Déficit de O₂ e EPOC', x: () => `O VO₂ não acompanha a carga na hora: a diferença inicial (área azul) é coberta por PCr e glicólise. Depois do exercício o VO₂ fica elevado (área laranja, EPOC). Acima do VT1 aparece o componente lento.`},
  {v: 'energia', t: 'Sistemas energéticos', x: () => `Os três sistemas funcionam juntos; o que muda é a proporção. Em 50 m livre de natação (~25 s) a glicólise domina. Embaixo, quanto da PCr volta em cada tempo de descanso.`, go: () => { const b = FA.$$('#e-sports button')[2]; if (b) b.click(); }},
  {v: 'hemoglobina', t: 'Curva da hemoglobina', x: () => `No músculo em exercício intenso (calor, CO₂ e acidez) a curva vai para a direita: na mesma PO₂ venosa sai mais O₂. É o efeito Bohr explicando a diferença a-vO₂ maior.`, go: () => { const b = FA.$$('#h-pre button')[1]; if (b) b.click(); }},
  {v: 'forca', t: 'Força: pressão e recrutamento', x: () => `Leg press a 80% até a falha com Valsalva: picos de pressão acima de 300 mmHg. No painel ao lado, as unidades motoras sendo recrutadas pelo princípio do tamanho até a última repetição.`, go: () => { Object.assign(FA.forca, {ex: 'leg', pct: 80, rir: 0, view: null, val: true}); FA.views.forca(); }},
  {v: 'adaptacoes', t: 'Adaptações e destreino', x: () => `O que muda em semanas de treino aeróbio e o que se perde ao parar. O plasma muda em dias; capilares, em meses. Na aba Força estão os ganhos neurais e a hipertrofia. Para fechar, o Quiz testa tudo isso.`}
];
let ti = -1;
function show() {
  const s = STEPS[ti];
  if (s.v === 'simulador') { FA.S.P = {...s.P}; FA.S.AP = s.A ? {...s.A} : null; FA.S.sel = s.sel; }
  FA.go(s.v);
  if (s.v === 'simulador') FA.sync();
  if (s.go) setTimeout(s.go, 150);
  const m = FA.S.m || FA.M(FA.S.P);
  $('#tour').hidden = false;
  $('#tour').innerHTML = `<div class="tour-in"><p class="tour-n">${ti + 1} de ${STEPS.length}</p><h3>${s.t}</h3><p>${s.x(m)}</p><div class="btns"><button class="btn" id="tr-prev"${ti === 0 ? ' disabled' : ''}>Anterior</button><button class="btn pri" id="tr-next">${ti === STEPS.length - 1 ? 'Concluir' : 'Próximo'}</button><button class="btn ghost" id="tr-x" aria-label="Sair da apresentação">Sair</button></div></div>`;
  window.scrollTo({top: 0, behavior: 'smooth'});
}
$('#tour').addEventListener('click', e => {
  const id = e.target.id;
  if (id === 'tr-next') { if (ti >= STEPS.length - 1) { $('#tour').hidden = true; ti = -1; FA.go('quiz'); } else { ti++; show(); } }
  if (id === 'tr-prev' && ti > 0) { ti--; show(); }
  if (id === 'tr-x') { $('#tour').hidden = true; ti = -1; }
});
$('#startTour').addEventListener('click', () => { ti = 0; show(); });

/* roteador */
const ADV = ['teste', 'cinetica', 'hemoglobina', 'adaptacoes'];
const VIEWS = ['inicio', ...FA.SYSNAMES, 'simulador', 'teste', 'cinetica', 'energia', 'hemoglobina', 'adaptacoes', 'forca', 'quiz', 'referencias'];
function route() {
  const h = location.hash.replace('#', '');
  let v = VIEWS.includes(h) ? h : 'inicio';
  if (FA.simple && ADV.includes(v)) v = 'simulador';
  VIEWS.forEach(x => { $('#v-' + x).hidden = x !== v; });
  const tab = $(`#tabs a[href="#${v}"]`), g = tab ? tab.dataset.g : v === 'quiz' ? 'quiz' : v === 'inicio' ? 'inicio' : 'ref';
  FA.$$('#groups a').forEach(a => a.setAttribute('aria-current', a.dataset.g === g ? 'page' : 'false'));
  FA.$$('#tabs a').forEach(a => { a.hidden = a.dataset.g !== g; a.setAttribute('aria-current', a.getAttribute('href') === '#' + v ? 'page' : 'false'); });
  $('#tabs').hidden = !tab;
  const isSys = FA.SYSNAMES.includes(v);
  $('#corpo').hidden = !isSys;
  if (!isSys && FA.SS.playing) { FA.SS.playing = false; }
  FA.curSys = isSys ? v : null;
  if (isSys) { if (FA.SS.D) FA.simulate(); FA.sessEnsure(); FA.sysRender(); }
  const cur = $('#tabs a[aria-current=page]'); if (cur) cur.scrollIntoView({block: 'nearest', inline: 'center'});
  if (FA.views[v]) FA.views[v]();
}
FA.$$('#modeSeg button').forEach(b => b.addEventListener('click', () => FA.setSimple(b.dataset.v === '1')));
FA.seg($('#modeSeg'), FA.simple ? '1' : '0');
FA.onSimple = () => { FA.seg($('#modeSeg'), FA.simple ? '1' : '0'); if (FA.onSimpleSim) FA.onSimpleSim(); route(); };
FA.go = v => { if (location.hash !== '#' + v) { location.hash = v; } else route(); };
window.addEventListener('hashchange', route);
route();
}
