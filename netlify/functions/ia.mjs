// Função do Netlify: recebe a pergunta do site e consulta o Gemini.
// A chave fica guardada no Netlify (variável GEMINI_API_KEY), nunca no código do site.
const SYSTEM = `Você é o tutor do "Fisiologia em Ação", um simulador educacional de fisiologia do exercício usado por estudantes de Educação Física no Brasil.
Responda sempre em português do Brasil, de forma didática e direta (em geral até 200 palavras, a não ser que peçam mais).
- Explique o mecanismo fisiológico, com uma analogia simples quando ajudar.
- Use o contexto da tela (valores do simulador) para tornar a resposta concreta.
- O simulador usa um modelo simplificado: se o aluno questionar um valor, avalie com honestidade se é realista, simplificado ou incorreto, e diga o porquê.
- Quando houver debate científico, diga isso. Cite autores e ano quando tiver segurança; nunca invente referências.
- Se pedirem perguntas de prova, faça perguntas e só dê o gabarito se o aluno pedir.
- Assuntos fora de fisiologia do exercício, treinamento e saúde: responda brevemente que o foco aqui é fisiologia.
- Não faça diagnóstico nem prescrição médica individual; oriente a procurar um profissional quando for o caso.`;

const json = (o, status = 200) => new Response(JSON.stringify(o), {status, headers: {'Content-Type': 'application/json'}});

export default async (req) => {
  if (req.method !== 'POST') return json({error: 'Use POST'}, 405);
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({error: 'Chave da IA não configurada'}, 503);
  let body; try { body = await req.json(); } catch { return json({error: 'Pedido inválido'}, 400); }
  const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-10)
    .filter(m => m && typeof m.text === 'string' && (m.role === 'user' || m.role === 'model'))
    .map(m => ({role: m.role, parts: [{text: m.text.slice(0, 2000)}]}));
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return json({error: 'Sem pergunta'}, 400);
  const ctx = String(body.context || '').slice(0, 1500);
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'x-goog-api-key': key},
      body: JSON.stringify({
        systemInstruction: {parts: [{text: SYSTEM + '\n\nO que o aluno está vendo agora no site:\n' + ctx}]},
        contents: msgs,
        generationConfig: {temperature: 0.4, maxOutputTokens: 2048}
      })
    });
    const j = await r.json();
    if (r.status === 429) return json({error: 'limite de uso atingido'}, 429);
    if (!r.ok) return json({error: (j.error && j.error.message) || 'erro na IA'}, 502);
    const text = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    if (!text) return json({error: 'A IA não respondeu'}, 502);
    return json({text});
  } catch (e) {
    return json({error: 'Falha ao falar com a IA'}, 502);
  }
};
