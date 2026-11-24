/* ilustrações com legendas numeradas (posições em % da imagem) */
{
const FA = window.FA;
FA.FIG = {
  coracao: {src: 'img/coracao.jpg', w: 1100, h: 825, alt: 'Coração em corte com as quatro câmaras', pins: [
    [31, 13, 'Veia cava superior', 'traz o sangue venoso da parte de cima do corpo'],
    [27, 41, 'Átrio direito', 'recebe o sangue pobre em O₂'],
    [33, 70, 'Ventrículo direito', 'bombeia para os pulmões, com pressão baixa'],
    [77, 22, 'Artérias pulmonares', 'levam o sangue venoso aos pulmões'],
    [63, 41, 'Átrio esquerdo', 'recebe o sangue oxigenado dos pulmões'],
    [66, 74, 'Ventrículo esquerdo', 'parede grossa: bombeia para o corpo todo. É ele que cresce com o treino aeróbio'],
    [55, 12, 'Aorta', 'distribui o débito cardíaco para músculos, pele e órgãos'],
    [26, 92, 'Veia cava inferior', 'traz o sangue das pernas; a bomba muscular ajuda o retorno no exercício']]},
  pulmoes: {src: 'img/pulmoes.jpg', w: 1400, h: 788, alt: 'Pulmões com a árvore brônquica e detalhe de um alvéolo', pins: [
    [24.5, 24, 'Traqueia', 'o ar entra e sai; VE = frequência × volume corrente'],
    [14, 42, 'Brônquios', 'se dividem em ramos cada vez menores'],
    [40, 74, 'Alvéolos', '~300 milhões de "bolsinhas" onde acontece a troca de gases'],
    [55, 63, 'Capilar com sangue venoso', 'chega com pouco O₂ e muito CO₂'],
    [68, 47, 'CO₂ saindo do sangue', 'vai para o alvéolo e é expirado'],
    [81, 50, 'O₂ entrando no sangue', 'se liga à hemoglobina das hemácias'],
    [93, 45, 'Capilar com sangue arterial', 'sai saturado (~98%) rumo ao coração']]},
  musculo: {src: 'img/musculo.jpg', w: 1400, h: 788, alt: 'Músculo da coxa ampliado até o interior da fibra', pins: [
    [8, 35, 'Músculo (quadríceps)', 'o motor da corrida'],
    [26, 45, 'Fascículo', 'feixe de fibras musculares'],
    [47, 47, 'Fibras musculares', 'cada uma é uma célula longa'],
    [78, 21, 'Capilar', 'traz glicose e ácidos graxos do sangue e O₂'],
    [71, 47, 'Mitocôndria', 'queima carboidrato e gordura com O₂ e produz ATP'],
    [84, 55, 'Glicogênio', 'estoque de carboidrato dentro da fibra'],
    [92, 64, 'Gotícula de gordura', 'triglicerídeo intramuscular'],
    [67, 70, 'Miofibrilas', 'onde actina e miosina geram a força']]},
  calor: {src: 'img/calor.jpg', w: 1400, h: 788, alt: 'Corredor perdendo calor', pins: [
    [36, 55, 'Calor produzido', '75 a 80% da energia vira calor nos músculos'],
    [43, 38, 'Pele quente', 'o sangue leva o calor do centro para a pele'],
    [13, 24, 'Convecção', 'o ar que passa leva calor, se estiver mais frio que a pele'],
    [64, 21, 'Evaporação do suor', 'a principal saída de calor no exercício; falha no ar úmido'],
    [90, 12, 'Radiação do sol', 'no calor, o ambiente coloca calor no corpo']]},
  rim: {src: 'img/rim.jpg', w: 1400, h: 788, alt: 'Rim em corte e néfron ampliado', pins: [
    [4, 42, 'Artéria renal', '~20% do débito em repouso; cai muito no exercício'],
    [4, 53, 'Veia renal', 'devolve o sangue filtrado'],
    [35, 13, 'Córtex', 'onde ficam os glomérulos'],
    [26, 21, 'Medula (pirâmides)', 'concentra a urina'],
    [25, 50, 'Pelve renal', 'recolhe a urina'],
    [13, 90, 'Ureter', 'leva a urina à bexiga'],
    [56, 16, 'Glomérulo', 'filtra o plasma (TFG ~120 mL/min em repouso)'],
    [77, 17, 'Túbulos', 'reabsorvem água, sódio e glicose'],
    [67, 82, 'Alça de Henle', 'cria o gradiente que permite concentrar a urina'],
    [89, 55, 'Ducto coletor', 'o ADH abre canais de água aqui: menos urina, mais concentrada']]},
  unidade: {src: 'img/unidade-motora.jpg', w: 1400, h: 788, alt: 'Unidades motoras pequena e grande', pins: [
    [26, 23, 'Medula espinhal', 'os corpos dos neurônios motores ficam no corno anterior'],
    [52, 25, 'Neurônio motor', 'o axônio leva o comando até as fibras'],
    [23, 78, 'Unidade motora pequena', 'poucas fibras, tipo I: recrutada primeiro, força baixa, resistente à fadiga'],
    [64, 75, 'Unidade motora grande', 'muitas fibras, tipo II: entra só com esforço alto ou perto da falha'],
    [88, 35, 'Junção neuromuscular', 'a acetilcolina passa o sinal do nervo para a fibra']]}
};
FA.figHTML = key => {
  const f = FA.FIG[key];
  return `<figure class="afig"><div class="afig-img"><img src="${f.src}" alt="${f.alt}" width="${f.w}" height="${f.h}" loading="lazy">${f.pins.map((p, i) => `<b class="pin" style="left:${p[0]}%;top:${p[1]}%" data-pin="${i}">${i + 1}</b>`).join('')}</div>
  <figcaption><ol class="pinlist">${f.pins.map((p, i) => `<li data-pin="${i}"><b>${p[2]}</b> <span>${p[3]}</span></li>`).join('')}</ol></figcaption></figure>`;
};
/* destaque cruzado: passar o mouse num número ou na legenda acende os dois */
document.addEventListener('mouseover', e => {
  const t = e.target.closest('[data-pin]'), fig = t && t.closest('.afig');
  document.querySelectorAll('.afig .on').forEach(x => x.classList.remove('on'));
  if (!fig) return;
  fig.querySelectorAll(`[data-pin="${t.dataset.pin}"]`).forEach(x => x.classList.add('on'));
});

/* glândulas: imagem com brilho proporcional ao hormônio (coords em 1024 x 1536) */
const GLAND = {hipofise: [[512, 96, 34, 26], [512, 146, 22, 24]], tireoide: [[512, 268, 48, 34]], supra: [[446, 548, 34, 26], [588, 545, 34, 26]], pancreas: [[515, 618, 72, 34]], rins: [[430, 612, 36, 50], [604, 608, 36, 50]]};
const GCOL = {hipofise: 'var(--plum)', tireoide: 'var(--red)', supra: 'var(--amber)', pancreas: 'var(--amber)', rins: 'var(--teal)'};
FA.glandImg = lv => {
  let s = '';
  Object.entries(GLAND).forEach(([k, arr]) => { const v = FA.cl(lv[k] || 0, 0, 1); arr.forEach(([x, y, rx, ry]) => {
    s += `<ellipse cx="${x}" cy="${y}" rx="${rx + 16}" ry="${ry + 16}" fill="${GCOL[k]}" fill-opacity="${(.12 + v * .6).toFixed(2)}" filter="url(#gglow)"/>`;
    if (v > .4) s += `<ellipse cx="${x}" cy="${y}" rx="${rx + 14}" ry="${ry + 14}" fill="none" stroke="${GCOL[k]}" stroke-width="7" stroke-opacity="${((v - .4) / .6).toFixed(2)}"/>`;
  }); });
  return `<div class="bimg"><img src="img/glandulas.jpg" alt="Glândulas endócrinas" width="768" height="1152"><svg viewBox="0 0 1024 1536" aria-hidden="true"><defs><filter id="gglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter></defs>${s}</svg></div>`;
};
}
