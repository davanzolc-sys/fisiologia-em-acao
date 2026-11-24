/* Pergunte à IA: chat dentro do site (Gemini via função do Netlify). Se o chat não estiver disponível, oferece abrir no ChatGPT/Claude. */
(() => {
const $ = s => document.querySelector(s);
const clean = t => (t || '').replace(/\s+/g, ' ').trim();
const API = '/api/ia';
let lesson = null, hist = [], busy = false;

function context() {
  const v = location.hash.replace('#', '') || 'inicio', out = [];
  const tab = $('#tabs a[aria-current=page]'), grp = $('#groups a[aria-current=page]');
  out.push('Parte do site: ' + clean((tab && !tab.hidden ? tab.textContent : grp ? grp.textContent : v)));
  const sec = document.getElementById('v-' + v), scopes = [];
  if (FA.SYSNAMES && FA.SYSNAMES.includes(v)) {
    scopes.push($('#corpo aside'));
    const t = $('#pl-time'), ph = $('#mini-ph');
    if (t) out.push('Momento do treino simulado: ' + clean(t.textContent) + (ph && ph.textContent ? ' (fase: ' + clean(ph.textContent) + ')' : ''));
  }
  if (sec) scopes.push(sec);
  const items = [];
  scopes.filter(Boolean).forEach(sc => {
    sc.querySelectorAll('.pl-f').forEach(f => { const l = f.querySelector('span'), sel = f.querySelector('select'), on = f.querySelector('[aria-pressed=true]'); const val = sel ? sel.options[sel.selectedIndex]?.text : on ? on.textContent : ''; if (l && val) items.push(clean(l.textContent) + ': ' + clean(val)); });
    sc.querySelectorAll('[aria-pressed=true]').forEach(b => { if (b.closest('.pl-f,.pl-speed')) return; const g = b.closest('[aria-label],[data-label]'); const l = g ? (g.getAttribute('aria-label') || g.dataset.label) : ''; items.push((l ? l + ': ' : '') + clean(b.textContent)); });
    sc.querySelectorAll('.field').forEach(f => { const l = f.querySelector('label,span'), o = f.querySelector('output'); if (l && o && f.offsetParent) items.push(clean(l.textContent.replace(o.textContent, '')) + ': ' + clean(o.textContent)); });
    const kv = sc.querySelector('.kv'); if (kv) items.push('Valores agora: ' + clean(kv.innerText).slice(0, 300));
  });
  const uniq = [...new Set(items.filter(x => x.length < 320))].slice(0, 16);
  if (uniq.length) out.push('Configuração na tela: ' + uniq.join('; '));
  if (lesson) out.push('Lição "' + lesson.t + '": ' + lesson.x.slice(0, 600));
  return out.join('\n');
}
function extPrompt(q) {
  return 'Sou estudante de Educação Física e estou usando o "Fisiologia em Ação", um simulador educacional de fisiologia do exercício (os valores são de um modelo simplificado).\n'
    + context() + '\n\nMinha dúvida: ' + q.trim()
    + '\n\nResponda em português, de forma didática: explique o mecanismo fisiológico, diga se o que o simulador mostra está correto ou simplificado, aponte se há debate na literatura e cite referências científicas quando possível.';
}
const esc = s => s.replace(/[&<>]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c]));
function md(s) {
  const lines = esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>').split('\n');
  let h = '', ul = false;
  for (const l of lines) {
    const m = l.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/);
    if (m) { if (!ul) { h += '<ul>'; ul = true; } h += '<li>' + m[1] + '</li>'; continue; }
    if (ul) { h += '</ul>'; ul = false; }
    const t = l.replace(/^#+\s*/, ''); if (t.trim()) h += (l.startsWith('#') ? '<p><b>' + t + '</b></p>' : '<p>' + t + '</p>');
  }
  return h + (ul ? '</ul>' : '');
}

const box = document.createElement('div');
box.innerHTML = `<button id="ia-fab" class="ia-fab" aria-expanded="false" aria-controls="ia-pan"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg><span>Perguntar à IA</span></button>
<section id="ia-pan" class="ia-pan" hidden aria-label="Perguntar à IA">
  <div class="ia-h"><b>Tire uma dúvida com IA</b><span><button class="ia-new" title="Nova conversa">Nova</button><button class="ia-x" aria-label="Fechar">×</button></span></div>
  <p class="ia-ctx" id="ia-ctx"></p>
  <div class="ia-log" id="ia-log" aria-live="polite"></div>
  <div class="ia-sug" id="ia-sug"></div>
  <form class="ia-form" id="ia-form"><textarea id="ia-q" rows="2" placeholder="Ex.: por que a FC continua subindo se a intensidade não mudou?"></textarea><button class="btn pri sm" type="submit">Enviar</button></form>
  <div class="ia-ext" id="ia-ext"><span>Ou abra em:</span><button class="lnk" data-ia="chatgpt">ChatGPT</button><button class="lnk" data-ia="claude">Claude</button><button class="lnk" data-ia="copy">Copiar pergunta</button></div>
  <p class="ia-note">A IA recebe o que está na sua tela para entender o contexto. Use para questionar o simulador também: modelos simplificam, e a IA pode errar. Confira nas referências.</p>
</section>`;
document.body.append(...box.children);

const pan = $('#ia-pan'), fab = $('#ia-fab'), q = $('#ia-q'), log = $('#ia-log');
const SUG = ['Isso acontece igual na vida real?', 'Qual o mecanismo por trás disso?', 'O que muda em uma pessoa treinada?', 'Me faça 3 perguntas de prova sobre isso.'];
$('#ia-sug').innerHTML = SUG.map(s => `<button class="chip-s">${s}</button>`).join('');

function showCtx() { $('#ia-ctx').textContent = context().split('\n').filter(x => !x.startsWith('Lição')).map(x => x.replace(/^Configuração na tela: /, '')).join(' · ').slice(0, 260) + (lesson ? ' · Lição: ' + lesson.t : ''); }
function open(l) {
  if (l) { lesson = l; reset(); }
  showCtx(); pan.hidden = false; fab.setAttribute('aria-expanded', 'true'); q.focus();
}
function close() { pan.hidden = true; fab.setAttribute('aria-expanded', 'false'); }
function reset() { hist = []; log.innerHTML = ''; $('#ia-sug').hidden = false; }
function add(role, html) { const d = document.createElement('div'); d.className = 'ia-msg ' + role; d.innerHTML = html; log.append(d); log.scrollTop = log.scrollHeight; return d; }

async function send(text) {
  text = text.trim(); if (!text || busy) return;
  busy = true; q.value = ''; $('#ia-sug').hidden = true;
  add('me', esc(text));
  const wait = add('bot', '<span class="ia-dots"><i></i><i></i><i></i></span> <small class="ia-st">Buscando artigos no PubMed…</small>');
  const st = setTimeout(() => { const e = wait.querySelector('.ia-st'); if (e) e.textContent = 'Lendo os resumos e escrevendo a resposta…'; }, 5000);
  const ac = new AbortController(), to = setTimeout(() => ac.abort(), 60000);
  hist.push({role: 'user', text});
  try {
    const r = await fetch(API, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({context: context(), messages: hist.slice(-10)}), signal: ac.signal});
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.text) throw Object.assign(new Error(j.error || 'indisponível'), {limite: j.limite});
    hist.push({role: 'model', text: j.text});
    const src = (j.sources || []).map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">[${x.n}] ${esc(x.author || '')}${x.author ? ' et al.' : ''}, ${esc(x.year || '')}</a> — ${esc(x.title || '')} <em>${esc(x.journal || '')}</em>${x.type ? ` · ${esc(x.type)}` : ''}</li>`).join('');
    wait.innerHTML = md(j.text) + (src ? `<div class="ia-src"><b>Fontes (PubMed)</b><ol>${src}</ol></div>` : '');
  } catch (e) {
    hist.pop();
    const lim = /limite|429/i.test(e.message);
    wait.classList.add('err');
    wait.innerHTML = (lim ? (e.limite === 'dia' ? 'A IA gratuita do site atingiu o limite de perguntas de hoje (renova durante a madrugada). ' : 'Muitas perguntas ao mesmo tempo: a IA gratuita do site tem um limite por minuto. Espere cerca de 1 minuto e envie de novo. ') : 'O chat do site não conseguiu responder agora. ') + (lim ? '' : `<small class="ia-det">(${esc(String(e.name === 'AbortError' ? 'demorou demais' : e.message)).slice(0, 220)})</small> `) + 'Você pode mandar a mesma pergunta, com o contexto da tela, para outra IA:'
      + `<div class="ia-ext in"><button class="lnk" data-ia="chatgpt" data-q="${esc(text).replace(/"/g, '&quot;')}">Abrir no ChatGPT</button><button class="lnk" data-ia="claude" data-q="${esc(text).replace(/"/g, '&quot;')}">Abrir no Claude</button></div>`;
  }
  clearTimeout(st); clearTimeout(to); busy = false; log.scrollTop = log.scrollHeight;
}

fab.addEventListener('click', () => pan.hidden ? open() : close());
pan.querySelector('.ia-x').addEventListener('click', close);
pan.querySelector('.ia-new').addEventListener('click', () => { lesson = null; reset(); showCtx(); q.focus(); });
$('#ia-sug').addEventListener('click', e => { const b = e.target.closest('button'); if (b) send(b.textContent); });
$('#ia-form').addEventListener('submit', e => { e.preventDefault(); send(q.value); });
q.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(q.value); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pan.hidden) close(); });
window.addEventListener('hashchange', () => { lesson = null; if (!pan.hidden) showCtx(); });

pan.addEventListener('click', async e => {
  const b = e.target.closest('[data-ia]'); if (!b) return;
  const text = b.dataset.q ? b.dataset.q.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : q.value || (hist.filter(h => h.role === 'user').pop() || {}).text || '';
  if (!text.trim()) { q.focus(); q.placeholder = 'Escreva sua dúvida primeiro'; return; }
  const p = extPrompt(text), k = b.dataset.ia;
  if (k === 'copy') { try { await navigator.clipboard.writeText(p); b.textContent = 'Copiado!'; } catch { b.textContent = 'Não deu para copiar'; } setTimeout(() => b.textContent = 'Copiar pergunta', 1800); return; }
  window.open((k === 'chatgpt' ? 'https://chatgpt.com/?q=' : 'https://claude.ai/new?q=') + encodeURIComponent(p), '_blank', 'noopener');
});

FA.askAI = open;
})();
