// Tutor de IA do Fisiologia em Ação (Netlify Edge Function).
// 1) a IA transforma a dúvida numa busca em inglês para o PubMed
// 2) o site busca artigos reais (revisões e meta-análises primeiro) e lê os resumos
// 3) a IA responde com base nesses artigos, citando [1], [2]...; os links são montados pelo código
// Chaves (variáveis no Netlify): GEMINI_API_KEY (grátis) ou CLAUDE_API_KEY (pago, opcional).
// Obs.: não usar ANTHROPIC_API_KEY, porque o Netlify cria essa variável sozinho para o AI Gateway dele.

const env = k => (globalThis.Netlify?.env?.get?.(k)) ?? (globalThis.Deno?.env?.get?.(k)) ?? (typeof process !== 'undefined' ? process.env[k] : undefined);
const json = (o, status = 200) => new Response(JSON.stringify(o), {status, headers: {'Content-Type': 'application/json; charset=utf-8'}});
const EU = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';

const TUTOR = `Você é o tutor do "Fisiologia em Ação", simulador de fisiologia do exercício usado em cursos de Educação Física no Brasil. Seu aluno está na graduação: responda em nível universitário, com profundidade, sem respostas genéricas.

Como responder (português do Brasil):
1. Comece pela resposta direta em 1 ou 2 frases.
2. Explique o MECANISMO passo a passo (o que acontece na célula, no órgão, no sistema), com números típicos quando existirem (FC, VO₂, lactato, temperatura, % do débito etc.).
3. Ligue ao que o aluno vê na tela: comente os valores do simulador e diga se são realistas, simplificados ou incorretos, e por quê.
4. Diga o que ainda é debatido ou incerto na literatura e aponte equívocos comuns (ex.: "lactato causa fadiga", "limiar anaeróbio").
5. Termine com uma aplicação prática para o treino ou uma pergunta para o aluno pensar.
Use **negrito** para termos-chave e listas quando ajudarem. Em geral 200 a 400 palavras; mais curto se a pergunta for simples.

Evidências:
- Você recebe artigos encontrados agora no PubMed, numerados. Apoie as afirmações principais neles e cite assim: [1], [2]. Cite só números da lista.
- Se nenhum artigo da lista sustentar um ponto, você pode usar conhecimento consolidado de livros-texto (Kenney, Powers, McArdle), deixando claro que é conhecimento de livro-texto.
- Nunca invente artigos, autores, anos, números ou links. Se não souber, diga que não sabe.
- Prefira revisões sistemáticas e meta-análises; diga quando a evidência for fraca ou vier de poucos estudos.

Limites: foco em fisiologia do exercício, treinamento e saúde. Não faça diagnóstico nem prescrição médica individual. Se pedirem perguntas de prova, faça as perguntas e só dê o gabarito se o aluno pedir.`;

const PLAN = `Você monta buscas para o PubMed. Leia a dúvida de um estudante de fisiologia do exercício (e o contexto da tela) e responda SOMENTE um JSON:
{"buscar": true|false, "query": "<busca em inglês, 3 a 8 termos, pode usar AND/OR e termos MeSH>"}
Use "buscar": false só para mensagens sem conteúdo científico (cumprimentos, agradecimentos, pedidos de quiz sobre algo já explicado).`;

// ---------- provedores de IA ----------
const busy = new Map(); // modelos sobrecarregados recentemente
let listCache = null;
async function flashModels(key) {
  // pergunta ao Google quais modelos Flash existem nesta conta (cache de 1 h)
  if (listCache && listCache.t > Date.now() - 3600000) return listCache.m;
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {headers: {'x-goog-api-key': key}});
    const j = await r.json();
    const m = (j.models || []).filter(x => (x.supportedGenerationMethods || []).includes('generateContent'))
      .map(x => x.name.replace('models/', ''))
      .filter(n => /flash/.test(n) && !/image|tts|audio|live|embed|exp|preview|thinking|omni|latest/.test(n))
      .sort((a, b) => (/lite/.test(a) - /lite/.test(b)) || b.localeCompare(a, undefined, {numeric: true}));
    listCache = {t: Date.now(), m};
    return m;
  } catch { return []; }
}
async function gemini(system, msgs, {jsonOut = false, max = 3000} = {}) {
  // tenta o modelo principal e, se estiver sobrecarregado ou sem cota, outros modelos do Gemini
  const key = env('GEMINI_API_KEY');
  // ordem: modelo principal, Flash estáveis mais novos, e só depois os Lite (mais rápidos, porém mais simples)
  const list = await flashModels(key), full = list.filter(m => !/lite/.test(m)), lite = list.filter(m => /lite/.test(m));
  const models = [...new Set([env('GEMINI_MODEL') || 'gemini-flash-latest', ...full.slice(0, 3), 'gemini-flash-lite-latest', ...lite.slice(0, 1)])];
  const body = JSON.stringify({
    systemInstruction: {parts: [{text: system}]},
    contents: msgs.map(m => ({role: m.role === 'user' ? 'user' : 'model', parts: [{text: m.text}]})),
    generationConfig: {temperature: jsonOut ? 0 : 0.35, maxOutputTokens: max, ...(jsonOut ? {responseMimeType: 'application/json'} : {})}
  });
  let last = 'erro no Gemini', allQuota = true; const tried = [];
  const order = [...models.filter(m => !(busy.get(m) > Date.now())), ...models.filter(m => busy.get(m) > Date.now())];
  for (const model of order) {
    for (let tent = 0; tent < 2; tent++) {
      let r, j;
      try {
        r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': key}, body});
        j = await r.json().catch(() => ({}));
      } catch (e) { last = e.message; allQuota = false; await wait(700); continue; }
      if (r.ok) {
        const t = (j.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
        if (t) return t;
        last = 'resposta vazia'; allQuota = false; break;
      }
      last = j.error?.message || ('erro ' + r.status); tried.push(model + ':' + r.status);
      if (r.status === 429) break;                       // sem cota neste modelo: tenta o próximo
      allQuota = false;
      if (r.status === 404 || r.status === 400 && /model/i.test(last)) break; // modelo inexistente: próximo
      if (r.status === 401 || r.status === 403 || r.status === 400) throw new Error(last); // chave/pedido inválido
      if (tent === 1) busy.set(model, Date.now() + 120000);
      await wait(900 * (tent + 1));                      // 500/503 sobrecarga: espera e tenta de novo
    }
  }
  if (allQuota) throw Object.assign(new Error('limite de uso atingido'), {status: 429});
  throw new Error(last.slice(0, 90) + ' [tentados: ' + [...new Set(tried)].join(', ') + ']');
}
async function claude(system, msgs, {max = 3000} = {}) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: {'Content-Type': 'application/json', 'x-api-key': env('CLAUDE_API_KEY'), 'anthropic-version': '2023-06-01'},
    body: JSON.stringify({model: env('CLAUDE_MODEL') || 'claude-sonnet-5-5', max_tokens: max, system, messages: msgs.map(m => ({role: m.role === 'user' ? 'user' : 'assistant', content: m.text}))})
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 429) throw Object.assign(new Error('limite de uso atingido'), {status: 429});
  if (!r.ok) throw new Error(j.error?.message || 'erro no Claude');
  return (j.content || []).map(c => c.text || '').join('').trim();
}
const useClaude = () => !!env('CLAUDE_API_KEY') && (!env('GEMINI_API_KEY') || env('IA') === 'claude');
const llm = (s, m, o) => useClaude() ? claude(s, m, o) : gemini(s, m, o);

// ---------- PubMed ----------
const unent = s => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x?([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, /x/i.test(m) ? 16 : 10))).replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const tag = (x, t) => { const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? unent(m[1]) : ''; };
const ek = () => (env('NCBI_API_KEY') ? '&api_key=' + env('NCBI_API_KEY') : '') + '&tool=fisiologia-em-acao';
const wait = ms => new Promise(r => setTimeout(r, ms));

async function esearch(term, n) {
  const r = await fetch(`${EU}esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${n}&term=${encodeURIComponent(term)}${ek()}`);
  if (!r.ok) return [];
  const j = await r.json().catch(() => ({}));
  return j.esearchresult?.idlist || [];
}
async function pubmed(query) {
  const rev = await esearch(`(${query}) AND (review[pt] OR systematic review[pt] OR meta-analysis[pt]) AND 2010:3000[dp]`, 5);
  let ids = rev;
  if (ids.length < 4) { await wait(350); ids = [...new Set([...ids, ...(await esearch(`(${query}) AND 2005:3000[dp]`, 6))])].slice(0, 6); }
  if (!ids.length) return [];
  await wait(350);
  const r = await fetch(`${EU}efetch.fcgi?db=pubmed&retmode=xml&rettype=abstract&id=${ids.join(',')}${ek()}`);
  if (!r.ok) return [];
  const xml = await r.text();
  return xml.split('<PubmedArticle>').slice(1).map(a => {
    const pd = (a.match(/<PubDate>([\s\S]*?)<\/PubDate>/) || ['', ''])[1], pmid = tag(a, 'PMID'), year = tag(pd, 'Year') || (tag(pd, 'MedlineDate').match(/\d{4}/) || [''])[0];
    const abs = [...a.matchAll(/<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g)].map(m => { const l = m[1].match(/Label="([^"]+)"/); return (l ? l[1] + ': ' : '') + unent(m[2]); }).join(' ');
    const types = [...a.matchAll(/<PublicationType[^>]*>([^<]+)</g)].map(m => m[1]);
    return {pmid, year, title: tag(a, 'ArticleTitle'), journal: tag(a, 'ISOAbbreviation') || tag(a, 'Title'), author: tag(a, 'LastName'),
      type: types.find(t => /Meta-Analysis|Systematic Review|Review/.test(t)) || '', abstract: abs.slice(0, 1300)};
  }).filter(a => a.pmid && a.title);
}

// ---------- handler ----------
export default async (req) => {
  if (req.method === 'GET') {
    // diagnóstico: /api/ia?teste=1
    const info = {funcao: 'ok', gemini_key: !!env('GEMINI_API_KEY'), claude_key: !!env('CLAUDE_API_KEY'), modelo: useClaude() ? (env('CLAUDE_MODEL') || 'claude-sonnet-5-5') : (env('GEMINI_MODEL') || 'gemini-flash-latest')};
    if (new URL(req.url).searchParams.get('teste')) {
      if (!useClaude()) info.modelos_flash = await flashModels(env('GEMINI_API_KEY'));
      try { info.ia = await llm('Responda só: ok', [{role: 'user', text: 'teste'}], {max: 50}) || '(vazio)'; } catch (e) { info.ia_erro = e.message; }
      try { info.pubmed = (await esearch('cardiovascular drift exercise', 2)).length + ' artigos'; } catch (e) { info.pubmed_erro = e.message; }
    }
    return json(info);
  }
  if (req.method !== 'POST') return json({error: 'Use POST'}, 405);
  if (!env('GEMINI_API_KEY') && !env('CLAUDE_API_KEY')) return json({error: 'Chave da IA não configurada'}, 503);
  let body; try { body = await req.json(); } catch { return json({error: 'Pedido inválido'}, 400); }
  const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-10)
    .filter(m => m && typeof m.text === 'string' && (m.role === 'user' || m.role === 'model')).map(m => ({role: m.role, text: m.text.slice(0, 2500)}));
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return json({error: 'Sem pergunta'}, 400);
  const ctx = String(body.context || '').slice(0, 1500);
  const last = msgs[msgs.length - 1].text, prev = msgs.slice(-3, -1).map(m => (m.role === 'user' ? 'Aluno: ' : 'Tutor: ') + m.text.slice(0, 400)).join('\n');

  try {
    // 1) planejar a busca
    let arts = [];
    try {
      const plan = await llm(PLAN, [{role: 'user', text: `Contexto da tela:\n${ctx}\n\nConversa anterior:\n${prev || '(nenhuma)'}\n\nDúvida atual: ${last}`}], {jsonOut: true, max: 300});
      const p = JSON.parse((plan.match(/\{[\s\S]*\}/) || ['{}'])[0]);
      if (p.buscar !== false && p.query) arts = await pubmed(String(p.query).slice(0, 300));
    } catch (e) { if (e.status === 429) throw e; arts = []; }

    // 2) responder com as evidências
    const ev = arts.length
      ? arts.map((a, i) => `[${i + 1}] ${a.author || 'Autor'} et al., ${a.year}. ${a.title} ${a.journal}.${a.type ? ' (' + a.type + ')' : ''}\nResumo: ${a.abstract || '(sem resumo)'}`).join('\n\n')
      : '(A busca no PubMed não trouxe artigos para esta pergunta. Responda com conhecimento consolidado de livro-texto e avise o aluno que não houve artigos recuperados agora.)';
    const sys = `${TUTOR}\n\nO QUE O ALUNO ESTÁ VENDO NO SITE:\n${ctx}\n\nARTIGOS ENCONTRADOS AGORA NO PUBMED:\n${ev}`;
    const text = await llm(sys, msgs, {max: 3000});
    if (!text) return json({error: 'A IA não respondeu'}, 502);

    const cited = new Set([...text.matchAll(/\[(\d+)(?:\s*[,–-]\s*(\d+))*\]/g)].flatMap(m => m[0].match(/\d+/g).map(Number)));
    const sources = arts.map((a, i) => ({n: i + 1, pmid: a.pmid, author: a.author, year: a.year, title: a.title, journal: a.journal, type: a.type, url: `https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`}))
      .filter(s => cited.has(s.n));
    return json({text, sources});
  } catch (e) {
    if (e.status === 429) return json({error: 'limite de uso atingido'}, 429);
    return json({error: 'Falha ao falar com a IA: ' + e.message}, 502);
  }
};

export const config = {path: '/api/ia'};
