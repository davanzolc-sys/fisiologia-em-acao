/* quiz: preveja a resposta + conceitos */
{
const FA = window.FA, $ = FA.$, nf = FA.nf, V = FA.V;
const B = {...FA.P0, int: 60, dur: 30};
const PRED = [
  ['Mesma corrida (60%) ao nível do mar e depois a 3.000 m', {...B}, {...B, alt: 3000}, ['fc', 'spo2', 'lac', 've']],
  ['Corrida a 60% por 30 min: de 20 °C para 35 °C', {...B, temp: 20}, {...B, temp: 35}, ['fc', 'vs', 'tc', 'pele']],
  ['Do repouso para 85% do VO₂máx', {...B, int: 0, dur: 5}, {...B, int: 85, dur: 10}, ['fc', 'pad', 'visc', 'ins']],
  ['Corrida a 70%: minuto 10 e depois minuto 90', {...B, int: 70, dur: 10}, {...B, int: 70, dur: 90}, ['fc', 'vs', 'glyc', 'rer']],
  ['Corrida a 65% por 45 min: hidratado e depois 3% desidratado', {...B, int: 65, dur: 45}, {...B, int: 65, dur: 45, desid: 3}, ['fc', 'vs', 'tc', 'adh']],
  ['Repouso ao nível do mar e depois repouso a 4.000 m', {...B, int: 0, dur: 5}, {...B, int: 0, dur: 5, alt: 4000}, ['fc', 've', 'spo2', 'epo']],
  ['Mesma carga absoluta (~8 km/h): sedentário e depois treinado', {...B, int: 70}, {...B, int: 48, tr: true}, ['fc', 'lac', 'rer', 'vs']],
  ['Mesma intensidade relativa (70%): sedentário e depois treinado', {...B, int: 70}, {...B, int: 70, tr: true}, ['vs', 'q', 'lac']],
  ['De 60% para 100% do VO₂máx', {...B, int: 60, dur: 10}, {...B, int: 100, dur: 5}, ['ph', 'rer', 'pad', 'mus']],
  ['Corrida a 60% em 30 °C: UR de 40% para 85%', {...B, temp: 30, ur: 40}, {...B, temp: 30, ur: 85}, ['tc', 'pele', 'fc']],
  ['Corrida a 60%: sem e depois com betabloqueador', {...B}, {...B, bb: true}, ['fc', 'vs', 'avo2']],
  ['Corrida a 70% por 120 min: sem e depois com 60 g/h de carboidrato', {...B, int: 70, dur: 120}, {...B, int: 70, dur: 120, cho: 60}, ['gli', 'glyc', 'cort']],
  ['Caminhada leve a 22 °C e depois a −5 °C', {...B, int: 15, dur: 30}, {...B, int: 15, dur: 30, temp: -5}, ['vo2', 'pele', 'na']],
  ['Recém-chegado a 3.600 m e depois de 21 dias lá (repouso)', {...B, int: 0, dur: 5, alt: 3600}, {...B, int: 0, dur: 5, alt: 3600, accA: 21}, ['hb', 'spo2', 'fc']],
  ['Corrida a 60% em 35 °C: sem e depois com 14 dias de aclimatação', {...B, temp: 35}, {...B, temp: 35, accH: 14}, ['fc', 'tc', 'sw']]
];
const MC = [
  ['Durante um exercício aeróbio progressivo, a pressão diastólica:', ['Sobe na mesma proporção da sistólica', 'Mantém-se ou cai levemente', 'Cai pela metade', 'Sobe só acima do VO₂máx'], 1, 'A vasodilatação no músculo ativo reduz a resistência periférica, compensando o débito maior.'],
  ['A principal fonte de H⁺ na acidose do exercício intenso é:', ['A dissociação do ácido lático', 'A hidrólise de ATP e reações da glicólise', 'O CO₂ do ciclo de Krebs', 'A quebra de proteínas'], 1, 'O lactato sobe junto e é um ótimo marcador, mas não é a causa direta (Robergs et al., 2004; Brooks, 2020).'],
  ['O RER passa de 1,0 no esforço máximo porque:', ['O corpo passa a oxidar proteína', 'O bicarbonato tampona H⁺ e libera CO₂ extra', 'O VO₂ cai no final', 'A gordura gera mais CO₂'], 1, 'O CO₂ "não metabólico" do tamponamento aumenta o VCO₂ além do VO₂.'],
  ['O 2º limiar ventilatório (VT2) é identificado quando:', ['O VE/VO₂ começa a subir', 'O VE/VCO₂ começa a subir', 'O VO₂ faz platô', 'A FC para de subir'], 1, 'Até o VT2 o VE/VCO₂ é estável (tamponamento isocápnico); depois sobe pela compensação respiratória da acidose.'],
  ['A principal adaptação central que explica o VO₂máx maior do atleta de endurance é:', ['FC máxima maior', 'Volume sistólico maior', 'Hemoglobina muito maior', 'Pulmões maiores'], 1, 'A FCmáx não muda com o treino; o VS e o débito máximo, sim.'],
  ['A 3.600 m de altitude, a fração de O₂ do ar inspirado é:', ['Cerca de 13%', '20,93%, igual ao nível do mar', '25%', 'Depende da temperatura'], 1, 'O que cai é a pressão barométrica, e com ela a PO₂.'],
  ['Nas primeiras 4 a 6 semanas de treino de força, o ganho de força vem principalmente de:', ['Hipertrofia', 'Adaptações neurais', 'Aumento de tendões', 'Mais fibras IIx'], 1, 'Mais recrutamento, frequência de disparo e coordenação (Moritani e deVries, 1979; Škarabot et al., 2021).'],
  ['A fase rápida do EPOC se deve principalmente a:', ['Remoção do lactato', 'Ressíntese de PCr e recarga de O₂ da mioglobina e hemoglobina', 'Digestão', 'Hipertrofia muscular'], 1, 'A remoção do lactato pesa pouco no EPOC (Gaesser e Brooks, 1984; Børsheim e Bahr, 2003).'],
  ['Em um esforço máximo de ~75 s, a contribuição aeróbia é de aproximadamente:', ['10%', '25%', '50%', '90%'], 2, 'É o ponto em que aeróbio e anaeróbio se igualam (Gastin, 2001).'],
  ['No músculo ativo, a curva de dissociação da Hb se desloca para a direita por causa de:', ['Menos temperatura e mais pH', 'Mais temperatura, mais CO₂, menor pH e mais 2,3-DPG', 'Menos 2,3-DPG', 'Mais O₂ dissolvido'], 1, 'É o efeito Bohr, que facilita a entrega de O₂.'],
  ['Deriva cardiovascular é:', ['Queda da FC em exercício longo', 'Aumento progressivo da FC com queda do VS em intensidade constante', 'Aumento da pressão diastólica', 'Arritmia benigna'], 1, 'Associada ao calor, à perda de plasma e ao aumento do fluxo para a pele (Coyle e González-Alonso, 2001; Souissi et al., 2021).'],
  ['Qual hormônio cai durante o exercício aeróbio?', ['Glucagon', 'Cortisol', 'Insulina', 'Noradrenalina'], 2, 'A contração leva GLUT4 à membrana sem precisar de insulina.'],
  ['Em um aluno que usa betabloqueador, a intensidade deve ser controlada principalmente por:', ['FC de reserva', 'Percepção de esforço (Borg)', 'Fórmula 220 − idade', 'Lactato capilar sempre'], 1, 'O betabloqueador achata a resposta da FC.'],
  ['O platô da temperatura central no exercício depende principalmente:', ['Da temperatura ambiente', 'Da intensidade relativa', 'Da umidade', 'Do sexo'], 1, 'Dentro da faixa compensável, o ambiente quase não muda o platô (Nielsen, 1938; Cramer et al., 2022).'],
  ['Pelo princípio do tamanho, as primeiras unidades motoras recrutadas são:', ['Tipo IIx grandes', 'Tipo I pequenas', 'Aleatórias', 'As do músculo antagonista'], 1, 'Henneman, 1957.'],
  ['Durante esforço intenso, o fluxo sanguíneo para as vísceras:', ['Aumenta', 'Não muda', 'Cai para ~20 a 30% do repouso', 'Zera'], 2, 'Vasoconstrição simpática redireciona sangue ao músculo e à pele.'],
  ['Após um sprint, em quanto tempo ~50% da PCr está ressintetizada?', ['3 s', '~30 s', '5 min', '24 h'], 1, 'Quase total em 3 a 5 min.'],
  ['Para remover lactato após um esforço intenso, é melhor:', ['Ficar parado', 'Fazer recuperação ativa leve', 'Fazer sprints', 'Tomar bicarbonato sempre'], 1, 'O músculo ativo em baixa intensidade oxida o lactato.'],
  ['Uma adaptação típica da aclimatação ao calor é:', ['Menos volume plasmático', 'Suor mais precoce e mais diluído', 'FC maior no calor', 'Menos suor'], 1, 'Também aumenta o plasma e reduz a FC e a temperatura central (Périard et al., 2021).'],
  ['Qual é um critério clássico de VO₂máx em teste incremental?', ['FC acima de 220', 'Platô do VO₂ apesar do aumento da carga', 'RER abaixo de 0,9', 'Lactato abaixo de 2'], 1, 'Os critérios secundários (RER ≥ 1,10, FC próxima da prevista, lactato ≥ 8 mmol/L) são pouco confiáveis; hoje se recomenda uma fase de verificação (Poole e Jones, 2017).'],
  ['No leg press pesado até a falha com Valsalva, a pressão arterial pode chegar a:', ['140/90', '180/100', 'Mais de 300/200', 'Cair abaixo de 100'], 2, 'MacDougall et al. (1985) mediram ~320/250 mmHg em média.'],
  ['Séries com carga leve (~30 a 40% de 1RM) levadas até perto da falha:', ['Não causam hipertrofia', 'Causam hipertrofia parecida com cargas altas', 'Só ganham força máxima', 'Recrutam só fibras tipo I'], 1, 'A fadiga força o recrutamento das unidades de limiar alto (Schoenfeld et al., 2017; Lopez et al., 2021). Para força máxima, cargas altas ainda são superiores.']
];
const Q = {mode: 'pred', i: 0, ans: {}, done: false, sc: FA.store.get('score', [0, 0]), order: []};
const shuffle = n => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
Q.order = shuffle(PRED.length); Q.morder = shuffle(MC.length); Q.perm = null;

const expl = (k, m, p) => { const it = FA.why(k, m, p); const s = it.length > 1 && !['pas', 'pad'].includes(k) ? it[it.length - 1] : it[0].split('. ')[0] + '.'; return s.replace(/<[^>]+>/g, ''); };
function render() {
  FA.seg($('#q-seg'), Q.mode);
  $('#q-score').textContent = `${Q.sc[0]} de ${Q.sc[1]} acertos`;
  if (Q.mode === 'pred') {
    const [t, a, b, vs] = PRED[Q.order[Q.i % PRED.length]], ma = FA.M(a), mb = FA.M(b);
    $('#q-body').innerHTML = `<p class="q-t">${t}</p><p class="q-s">Para cada variável: sobe, fica parecida ou cai?</p>${vs.map(k => { const real = FA.dirOf(k, ma[k], mb[k]); return `<div class="qv"><span>${V[k][0]}</span><div class="ch">${['↑', '≈', '↓'].map(d => `<button data-q="${k}" data-d="${d}" aria-pressed="${Q.ans[k] === d}" aria-label="${d === '↑' ? 'sobe' : d === '↓' ? 'cai' : 'parecida'}"${Q.done ? ' disabled' : ''}>${d}</button>`).join('')}</div>${Q.done ? `<p class="res"><span class="${Q.ans[k] === real ? 'ok' : 'no'}">${Q.ans[k] === real ? 'Certo' : 'Resposta: ' + real}</span> · ${FA.fmt(k, ma[k])} → ${FA.fmt(k, mb[k])} ${FA.HORM.has(k) ? '' : V[k][1]}. ${expl(k, mb, b)}</p>` : ''}</div>`; }).join('')}
    <div class="btns" style="margin-top:14px">${Q.done ? `<button class="btn pri" id="q-next">Próximo desafio</button><button class="btn" id="q-open">Abrir no simulador</button>` : `<button class="btn pri" id="q-check">Conferir</button>`}</div>`;
  } else {
    const [t, ops, c, ex] = MC[Q.morder[Q.i % MC.length]];
    if (!Q.perm || Q.perm.length !== ops.length) Q.perm = shuffle(ops.length);
    $('#q-body').innerHTML = `<p class="q-t">${t}</p><div class="mc">${Q.perm.map(j => [ops[j], j]).map(([o, j]) => `<button data-m="${j}" class="${Q.done ? (j === c ? 'right' : Q.ans.m === j ? 'wrong' : '') : ''}"${Q.done ? ' disabled' : ''}>${o}</button>`).join('')}</div>${Q.done ? `<p class="res"><span class="${Q.ans.m === c ? 'ok' : 'no'}">${Q.ans.m === c ? 'Certo.' : 'Não é essa.'}</span> ${ex}</p><div class="btns"><button class="btn pri" id="q-next">Próxima pergunta</button></div>` : ''}`;
  }
}
$('#q-seg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; Q.mode = b.dataset.v; Q.i = 0; Q.perm = null; Q.ans = {}; Q.done = false; render(); });
$('#q-reset').addEventListener('click', () => { Q.sc = [0, 0]; FA.store.set('score', Q.sc); render(); });
$('#q-body').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.q && !Q.done) { Q.ans[b.dataset.q] = b.dataset.d; render(); return; }
  if (b.dataset.m != null && !Q.done) {
    Q.ans.m = +b.dataset.m; Q.done = true; Q.sc[1]++; if (Q.ans.m === MC[Q.morder[Q.i % MC.length]][2]) Q.sc[0]++; FA.store.set('score', Q.sc); render(); return;
  }
  if (b.id === 'q-check') {
    const [, a, bb, vs] = PRED[Q.order[Q.i % PRED.length]]; if (vs.some(k => !Q.ans[k])) { $('#q-body .q-s').textContent = 'Responda todas as variáveis antes de conferir.'; return; }
    const ma = FA.M(a), mb = FA.M(bb); vs.forEach(k => { Q.sc[1]++; if (Q.ans[k] === FA.dirOf(k, ma[k], mb[k])) Q.sc[0]++; });
    FA.store.set('score', Q.sc); Q.done = true; render();
  }
  if (b.id === 'q-next') { Q.i++; Q.ans = {}; Q.done = false; Q.perm = null; render(); }
  if (b.id === 'q-open') { const [, a, bb, vs] = PRED[Q.order[Q.i % PRED.length]]; FA.S.AP = {...a}; FA.S.P = {...bb}; FA.S.sel = vs[0]; FA.go('simulador'); FA.sync(); }
});
FA.PRED = PRED; FA.MC = MC;
FA.views = FA.views || {};
FA.views.quiz = render;
}
