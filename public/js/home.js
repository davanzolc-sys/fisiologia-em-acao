/* página inicial: trilhas de aprendizado (explicação → ver na prática → conferir) e módulos */
{
const FA = window.FA, $ = FA.$;
const MODS = [
  ['#geral', 'Corpo em treino', 'Rode um treino e veja todos os sistemas trabalhando juntos, minuto a minuto.', 'img/corpo.jpg'],
  ['#coracao', 'Coração e circulação', 'Para onde vai o sangue em cada momento: músculo, pele, vísceras.', 'img/coracao.jpg'],
  ['#respiracao', 'Respiração', 'Ventilação, troca de gases no alvéolo e saturação.', 'img/pulmoes.jpg'],
  ['#combustivel', 'Combustível', 'Glicogênio, gordura e glicose sendo gastos; o "muro".', 'img/musculo.jpg'],
  ['#calor', 'Calor e água', 'Balanço térmico em watts, suor e desidratação.', 'img/calor.jpg'],
  ['#hormonios', 'Hormônios', 'Glândulas e hormônios que comandam o corpo no treino.', 'img/glandulas.jpg'],
  ['#rins', 'Rins e digestão', 'Fluxo renal, urina e esvaziamento gástrico.', 'img/rim.jpg'],
  ['#simulador', 'Simulador', 'Mexa em intensidade, calor, altitude, idade, sexo e veja ~45 variáveis.', null, 'SIM', 'var(--red)'],
  ['#teste', 'Teste incremental', 'Ergoespirometria em rampa: encontre o VT1 e o VT2.', null, 'VT', 'var(--blue)', 1],
  ['#cinetica', 'Cinética e EPOC', 'Déficit de O₂, componente lento e recuperação.', null, 'O₂', 'var(--teal)', 1],
  ['#energia', 'Sistemas energéticos', 'ATP-PCr, glicolítico e oxidativo; ressíntese de PCr.', null, 'ATP', 'var(--amber)'],
  ['#hemoglobina', 'Hemoglobina', 'Curva de dissociação e efeito Bohr.', null, 'Hb', 'var(--red2)', 1],
  ['#adaptacoes', 'Adaptações aeróbias', 'O que muda em semanas de treino e no destreino.', null, '↗', 'var(--plum)', 1],
  ['#forca', 'Força', 'Pressão arterial, recrutamento de unidades motoras, neural × hipertrofia.', 'img/unidade-motora.jpg'],
  ['#quiz', 'Quiz', 'Preveja a resposta do corpo e teste os conceitos.', null, '?', 'var(--ink)']
];
const B = {...FA.P0, int: 60, dur: 30};
/* lição: [título, explicação, o que observar, ação, [pergunta, opções, correta, explicação]] */
const TR = [
  {t: 'O corpo começa a se exercitar', c: 'var(--red)', l: [
    ['O coração acelera', 'Quando o exercício começa, os músculos precisam de muito mais O₂. O coração responde bombeando mais sangue: o débito cardíaco (FC × volume sistólico) vai de ~5 para até 20 L/min ou mais. No começo a FC sobe porque o "freio" vagal é retirado; depois, pela ação do simpático e da adrenalina.', 'a FC e o débito subindo nos primeiros minutos, e o coração da figura pulsando mais rápido.', {go: 'geral', sess: {proto: 'cont', env: 'ameno', drink: 0, cho: 0}, play: 1},
      ['O débito cardíaco é o resultado de:', ['FC × volume sistólico', 'FC + pressão arterial', 'Volume sistólico ÷ FC'], 0, 'É a quantidade de sangue por batimento vezes o número de batimentos por minuto.']],
    ['O sangue muda de endereço', 'Não adianta só bombear mais: o sangue precisa ir para quem está trabalhando. Os vasos do músculo ativo se dilatam e o simpático contrai os vasos de estômago, intestino e rins. Em repouso o músculo recebe ~20% do sangue; no esforço forte, até 80 a 85%.', 'a faixa vermelha dos músculos engrossando e a roxa das vísceras afinando.', {go: 'coracao', sess: {proto: 'cont', env: 'ameno'}, cur: 25},
      ['No exercício intenso, o fluxo de sangue para estômago e intestino:', ['Aumenta', 'Cai bastante', 'Não muda'], 1, 'Cai para ~20 a 30% do repouso. Por isso comer muito antes de treinar forte incomoda.']],
    ['A pressão arterial', 'A pressão sistólica (a "de cima") sobe porque o coração bombeia mais. A diastólica quase não muda: como os vasos dos músculos se abrem, a resistência total cai e compensa o débito maior.', 'clique em "Pressão diastólica" e leia o mecanismo ao lado.', {go: 'simulador', P: {...B, int: 100, dur: 5}, A: {...B, int: 0, dur: 5}, sel: 'pad'},
      ['Por que a diastólica quase não sobe no exercício aeróbio?', ['Porque o coração bate mais devagar', 'Porque os vasos do músculo ativo se dilatam e a resistência cai', 'Porque o sangue fica mais fino'], 1, 'Vasodilatação no músculo ativo reduz a resistência periférica total.']],
    ['A respiração acompanha', 'A ventilação sobe para trazer O₂ e, principalmente, eliminar o CO₂ produzido. No exercício leve cresce mais a profundidade de cada respiração; no intenso, a frequência. Os pulmões da figura inflam no ritmo calculado.', 'os pulmões respirando mais rápido e mais fundo conforme o treino avança.', {go: 'respiracao', sess: {proto: 'cont', env: 'ameno'}, play: 1},
      ['Em exercício intenso, a ventilação aumenta principalmente pela:', ['Frequência respiratória', 'Diminuição do CO₂', 'Queda do volume de cada respiração'], 0, 'O volume corrente estabiliza em ~50 a 60% da capacidade vital e a frequência assume.']],
    ['A volta à calma', 'Quando o treino acaba, a FC cai rápido no 1º minuto (o freio vagal volta) e depois devagar. O consumo de O₂ continua acima do repouso por um tempo para repor a fosfocreatina e o O₂ dos músculos: é o EPOC.', 'na recuperação, a FC caindo rápido e depois devagar.', {go: 'coracao', sess: {proto: 'cont', env: 'ameno'}, cur: 47},
      ['A queda rápida da FC no 1º minuto depois do exercício mostra:', ['A volta do controle vagal (parassimpático)', 'O fim da produção de lactato', 'A desidratação'], 0, 'Por isso a recuperação da FC é usada como marcador de saúde cardiovascular.']]]},
  {t: 'Energia: de onde vem o ATP', c: 'var(--amber)', l: [
    ['Três sistemas ao mesmo tempo', 'O músculo só usa ATP, e o estoque dura 2 a 3 segundos. Três sistemas o refazem: fosfocreatina (instantâneo, dura segundos), glicólise (rápida, dura até ~1 min) e oxidativo (lento, mas quase ilimitado). Todos funcionam juntos; o que muda é a proporção.', 'a barra mudando de cor quando você troca de 100 m para 800 m e 5.000 m.', {go: 'energia', sport: 0},
      ['Em um esforço máximo de ~75 segundos, a parte aeróbia da energia é cerca de:', ['10%', '50%', '90%'], 1, 'Perto de 75 s aeróbio e anaeróbio se igualam (Gastin, 2001).']],
    ['Carboidrato ou gordura?', 'O corpo queima os dois sempre. Em ritmo leve predomina a gordura; quanto mais intenso, maior a parte do carboidrato, que fornece energia mais rápido. É o conceito do "crossover".', 'compare o cenário A (leve) com o atual (forte) na variável "Energia de carboidratos".', {go: 'simulador', P: {...B, int: 85, dur: 15}, A: {...B, int: 35, dur: 15}, sel: 'cho'},
      ['Quanto mais intenso o exercício:', ['Mais gordura é usada', 'Mais carboidrato é usado', 'A proporção não muda'], 1, 'Brooks e Mercier, 1994.']],
    ['Lactato e limiares', 'O lactato é produzido o tempo todo e também é usado como combustível. Ele sobe no sangue quando a produção passa da remoção. Isso acontece em dois pontos: o 1º limiar (L1), quando começa a subir, e o 2º (L2), quando dispara. Eles dividem as zonas de treino.', 'a curva de lactato com as linhas L1 e L2 e a diferença entre sedentário e treinado.', {go: 'simulador', P: {...B, int: 85, dur: 15}, A: {...B, int: 85, dur: 15, tr: true}, sel: 'lac'},
      ['O lactato no sangue sobe rapidamente quando:', ['A produção supera a remoção', 'Acaba o oxigênio do músculo', 'O glicogênio acaba'], 0, 'Não é falta de O₂: o lactato é formado mesmo com oxigênio sobrando (Brooks, 2020).']],
    ['O "muro" da maratona', 'O glicogênio dos músculos que trabalham dura cerca de 90 a 120 min em ritmo forte. Quando acaba, a gordura não fornece energia rápido o bastante e o ritmo despenca. Ingerir carboidrato durante a prova poupa o fígado e mantém a glicemia.', 'os tanques esvaziando e o aviso de "bateu no muro". Depois mude o carboidrato para 60 g/h.', {go: 'combustivel', sess: {proto: 'marat', env: 'ameno', drink: .8, cho: 0}, cur: 150},
      ['O que mais ajuda a adiar o "muro"?', ['Beber só água', 'Ingerir carboidrato durante a prova', 'Sair mais rápido no início'], 1, 'Até 90 g/h em provas longas; atletas treinados toleram até ~120 g/h (Morton et al., 2026).']],
    ['Recuperando a fosfocreatina', 'Entre séries ou sprints a PCr volta, mas não na hora: ~50% em 30 s e quase tudo em 3 a 5 min. Quanto mais ácido o músculo ficou, mais devagar ela volta.', 'quanto da PCr volta com 30 s, 1 min e 3 min de descanso.', {go: 'energia', sport: 3},
      ['Depois de um sprint curto, cerca de metade da PCr volta em:', ['~3 segundos', '~30 segundos', '~10 minutos'], 1, 'Quase toda a PCr volta em 3 a 5 min.']]]},
  {t: 'Calor, água e ambiente', c: 'var(--plum)', l: [
    ['Todo exercício esquenta', 'Uns 75 a 80% da energia gasta vira calor. A temperatura central sobe até um platô proporcional à intensidade. O corpo joga calor fora pela pele: convecção, radiação e, principalmente, evaporação do suor.', 'as faixas de calor: produção entrando e as saídas pela pele e pelo suor.', {go: 'calor', sess: {proto: 'cont', env: 'ameno', drink: 0, cho: 0}, cur: 25},
      ['No exercício intenso, a principal forma de perder calor é:', ['Evaporação do suor', 'Respiração', 'Urina'], 0, 'Cada litro de suor evaporado retira ~580 kcal.']],
    ['O perigo da umidade', 'O suor só resfria quando evapora. No ar úmido ele escorre sem levar calor, o calor se acumula e a temperatura sobe mais. Por isso 32 °C úmido pode ser pior que 35 °C seco.', 'compare os ambientes "Calor úmido" e "Calor seco" no botão Mudar do player.', {go: 'calor', sess: {proto: 'long', env: 'calor', drink: 0, cho: 0}, cur: 60},
      ['Por que o calor úmido é mais perigoso?', ['O ar úmido é mais quente', 'O suor evapora menos e não resfria', 'A umidade aumenta a FC diretamente'], 1, 'Com o ar saturado de vapor, a evaporação fica limitada.']],
    ['Desidratação e deriva', 'Sem beber, o suor vai tirando água do sangue. Com menos volume, o coração enche menos, o volume sistólico cai e a FC sobe no mesmo ritmo: é a deriva cardiovascular. Acima de ~2% do peso o desempenho piora.', 'a desidratação passando de 2%. Depois mude para "bebe 0,8 L/h".', {go: 'calor', sess: {proto: 'long', env: 'calor', drink: 0, cho: 0}, cur: 100},
      ['Desidratação acima de ~2% do peso:', ['Melhora o desempenho', 'Piora o desempenho e aquece mais o corpo', 'Não muda nada'], 1, 'Cada 1% de perda eleva a FC e a temperatura central.']],
    ['Os rins guardam água', 'No exercício os rins recebem menos sangue e o hormônio ADH faz o rim devolver água ao corpo. Resultado: menos urina e mais escura. A cor da urina é um jeito simples de acompanhar a hidratação.', 'a produção de urina caindo e a cor ficando mais escura.', {go: 'rins', sess: {proto: 'long', env: 'calor', drink: 0, cho: 0}, cur: 100},
      ['No exercício, o ADH faz o rim:', ['Produzir mais urina', 'Reabsorver água e produzir menos urina', 'Parar de filtrar o sangue'], 1, 'Ele abre canais de água no ducto coletor.']],
    ['Treinar na altitude', 'O ar continua com 21% de O₂, mas a pressão é menor. Entra menos O₂ no sangue, o VO₂máx cai e o mesmo ritmo fica mais pesado. Em semanas, o corpo produz mais hemoglobina.', 'a saturação e a intensidade relativa a 3.600 m comparadas ao nível do mar.', {go: 'simulador', P: {...B, alt: 3600}, A: {...B}, sel: 'spo2'},
      ['Na altitude, o que cai?', ['A porcentagem de O₂ no ar', 'A pressão do ar e, com ela, a PO₂', 'A hemoglobina, na hora'], 1, 'A fração de O₂ é sempre 20,93%.']]]},
  {t: 'Força e hipertrofia', c: 'var(--blue)', l: [
    ['Quem trabalha primeiro', 'O músculo é comandado por unidades motoras. As pequenas (tipo I) entram primeiro; as grandes (tipo II), mais fortes, só quando a força exigida aumenta. É o princípio do tamanho.', 'a grade de unidades motoras na 1ª repetição com carga leve.', {go: 'forca', forca: {ex: 'leg', pct: 30, rir: 0, val: false, view: 1}},
      ['Quais unidades motoras são recrutadas primeiro?', ['As grandes, tipo II', 'As pequenas, tipo I', 'Todas ao mesmo tempo'], 1, 'Henneman, 1957.']],
    ['Carga leve até a falha', 'Com a fadiga, a mesma carga exige uma parte maior da força disponível. Perto da falha quase todas as unidades motoras entram, até as grandes. Por isso cargas leves levadas perto da falha geram hipertrofia parecida com cargas altas.', 'arraste "Ver repetição" da 1ª até a última e veja a grade se completar.', {go: 'forca', forca: {ex: 'leg', pct: 30, rir: 0, val: false}},
      ['Carga leve levada até perto da falha:', ['Não gera hipertrofia', 'Pode gerar hipertrofia parecida com a de carga alta', 'Só treina resistência'], 1, 'Para força máxima, cargas altas ainda são melhores (Lopez et al., 2021).']],
    ['Pressão e Valsalva', 'Na musculação a contração aperta as artérias e a pressão sobe muito, ao contrário do aeróbio. Prender o ar fazendo força (Valsalva) soma a pressão do tórax: no leg press pesado até a falha passa de 300 mmHg.', 'os picos de pressão com e sem Valsalva, e com repetições em reserva.', {go: 'forca', forca: {ex: 'leg', pct: 80, rir: 0, val: true}},
      ['O que mais aumenta os picos de pressão na musculação?', ['Respirar durante o movimento', 'Prender o ar fazendo força (Valsalva) perto da falha', 'Usar máquinas'], 1, 'Para hipertensos: expirar na subida e parar antes da falha.']],
    ['Quanto descansar', 'O descanso serve para recuperar a PCr e conseguir repetir as séries com boa carga. Para hipertrofia, a evidência mais recente mostra uma pequena vantagem para descansos acima de 60 s.', 'quanto da PCr volta com 1, 2 e 3 minutos.', {go: 'energia', sport: 3},
      ['Para hipertrofia, a meta-análise mais recente sugere descansos:', ['Menores que 30 s', 'Acima de 60 s, com pequena vantagem', 'De 10 minutos'], 1, 'Singer et al., 2024.']],
    ['Primeiro o cérebro, depois o músculo', 'Nas primeiras semanas a força sobe rápido sem o músculo crescer: o sistema nervoso aprende a recrutar mais unidades e coordenar melhor. A hipertrofia passa a pesar depois de ~6 a 8 semanas.', 'as áreas azul (neural) e vermelha (hipertrofia) ao longo das semanas.', {go: 'forca', forca: {w: 12, d: 0}},
      ['Nas primeiras semanas de treino, a força aumenta principalmente por:', ['Hipertrofia', 'Adaptações neurais', 'Novas fibras musculares'], 1, 'Moritani e deVries, 1979; Škarabot et al., 2021.']]]}
];
const done = FA.store.get('learn', {});
const key = (i, j) => i + '-' + j;
function render() {
  $('#homeMods').innerHTML = MODS.map(([h, t, d, img, ic, c, adv]) => `<a class="mod${adv ? ' adv' : ''}" href="${h}">${img ? `<span class="th" style="background-image:url('${img}')"></span>` : `<span class="th ic" style="--c:${c}"><b>${ic}</b></span>`}<div class="tx"><h3>${t}</h3><p>${d}</p></div></a>`).join('');
  $('#homeRot').innerHTML = TR.map((tr, i) => {
    const n = tr.l.filter((_, j) => done[key(i, j)]).length;
    return `<div class="trilha" style="--c:${tr.c}"><div class="tr-head"><h3>${tr.t}</h3><span>${n} de ${tr.l.length}</span></div><div class="tr-bar"><i style="width:${n / tr.l.length * 100}%"></i></div>
    ${tr.l.map((l, j) => `<details class="lic${done[key(i, j)] ? ' ok' : ''}"><summary><b class="lnum">${done[key(i, j)] ? '✓' : j + 1}</b><span>${l[0]}</span></summary>
      <div class="lbody"><p>${l[1]}</p><p class="obs"><b>Observe:</b> ${l[2]}</p><div class="lbt"><button class="btn pri sm" data-go="${i}-${j}">Ver na prática →</button><button class="btn sm" data-ask="${i}-${j}">Tenho uma dúvida</button></div>
      <div class="chk"><p class="chk-q">${l[4][0]}</p>${l[4][1].map((o, k) => `<button class="chk-o" data-a="${i}-${j}-${k}">${o}</button>`).join('')}<p class="chk-r" id="r-${i}-${j}"></p></div></div></details>`).join('')}</div>`;
  }).join('');
}
render();
$('#homeTour').addEventListener('click', () => $('#startTour').click());

function run(a) {
  if (a.sess) { Object.assign(FA.SS, a.sess); FA.SS.playing = false; FA.simulate(); FA.SS.cur = a.cur != null ? Math.min(a.cur, FA.SS.D.T) : 0; }
  if (a.P) { FA.S.P = {...a.P}; FA.S.AP = a.A ? {...a.A} : null; FA.S.sel = a.sel || 'fc'; }
  if (a.forca) { Object.assign(FA.forca, {view: null}, a.forca); }
  FA.go(a.go);
  setTimeout(() => {
    if (a.P) FA.sync();
    if (a.sess) FA.sessUpd();
    if (a.play) { const b = $('#pl-play'); if (b && !FA.SS.playing) b.click(); }
    if (a.sport != null) { const b = FA.$$('#e-sports button')[a.sport]; if (b) b.click(); }
    if (a.go === 'forca' && a.forca && a.forca.w != null) { const c = $('#f-c2'); if (c) c.scrollIntoView({behavior: 'smooth', block: 'center'}); }
    else window.scrollTo({top: 0, behavior: 'smooth'});
  }, 180);
}
$('#homeRot').addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) { const [i, j] = g.dataset.go.split('-').map(Number); run(TR[i].l[j][3]); return; }
  const ak = e.target.closest('[data-ask]');
  if (ak && FA.askAI) { const [i, j] = ak.dataset.ask.split('-').map(Number), l = TR[i].l[j]; FA.askAI({t: l[0], x: l[1].replace(/<[^>]+>/g, '')}); return; }
  const a = e.target.closest('[data-a]');
  if (!a) return;
  const [i, j, k] = a.dataset.a.split('-').map(Number), q = TR[i].l[j][4], ok = k === q[2];
  a.parentElement.querySelectorAll('.chk-o').forEach((b, idx) => { b.classList.toggle('right', idx === q[2] && ok); b.classList.toggle('wrong', idx === k && !ok); });
  $(`#r-${i}-${j}`).innerHTML = ok ? `<b class="ok">Isso!</b> ${q[3]}` : `<b class="no">Ainda não.</b> Releia a explicação ou veja na prática e tente de novo.`;
  if (ok && !done[key(i, j)]) {
    done[key(i, j)] = true; FA.store.set('learn', done);
    const det = a.closest('details'); det.classList.add('ok'); det.querySelector('.lnum').textContent = '✓';
    const tr = det.closest('.trilha'), n = TR[i].l.filter((_, jj) => done[key(i, jj)]).length;
    tr.querySelector('.tr-head span').textContent = `${n} de ${TR[i].l.length}`; tr.querySelector('.tr-bar i').style.width = (n / TR[i].l.length * 100) + '%';
  }
});
}
