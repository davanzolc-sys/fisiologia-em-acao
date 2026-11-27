/* utilidades compartilhadas */
window.FA = window.FA || {};
{
const FA = window.FA;
FA.$ = s => document.querySelector(s);
FA.$$ = s => Array.from(document.querySelectorAll(s));
FA.cl = (x, a, b) => Math.max(a, Math.min(b, x));
FA.nf = (x, d) => (+x).toLocaleString('pt-BR', {minimumFractionDigits: d, maximumFractionDigits: d});
FA.store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem('fa-' + k) || 'null'); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('fa-' + k, JSON.stringify(v)); } catch (e) {} }
};
FA.niceStep = range => { const r = range / 4, p = 10 ** Math.floor(Math.log10(r || 1)), n = r / p; return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p; };

/* gráfico de linhas genérico, desenhado no tamanho real do svg
   cfg: {series:[{pts,color,w,dash,label}], areas:[{pts,color,op}], xMin,xMax,yMin,yMax,
         xTicks:[...], xFmt, yFmt, xLabel, yLabel, vlines:[{x,color,label,dash}], hlines:[{y,color,label}],
         point:{x,y,label,color}, cursor:x, logX } */
FA.lineChart = (svg, cfg) => {
  const W = svg.clientWidth, H = svg.clientHeight;
  if (!W || !H) return null;
  const narrow = W < 520;
  const all = [];
  (cfg.series || []).forEach(s => s.pts.forEach(p => all.push(p[1])));
  (cfg.areas || []).forEach(s => s.pts.forEach(p => all.push(p[1])));
  let lo = cfg.yMin != null ? cfg.yMin : Math.min(...all), hi = cfg.yMax != null ? cfg.yMax : Math.max(...all);
  if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1; }
  if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
  if (cfg.yMin == null || cfg.yMax == null) { const pd = (hi - lo) * .08; if (cfg.yMin == null) lo -= pd; if (cfg.yMax == null) hi += pd; }
  const L = narrow ? 42 : 54, R = cfg.R || 14, T = Math.max(cfg.T || 12, cfg.yLabel ? 30 : 12), B = cfg.xLabel ? 44 : 26;
  const lx = v => cfg.logX ? Math.log(v) : v;
  const x0 = lx(cfg.xMin), x1 = lx(cfg.xMax);
  const X = v => L + (W - L - R) * (lx(v) - x0) / (x1 - x0);
  const Y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const st = FA.niceStep(hi - lo), dec = cfg.yDec != null ? cfg.yDec : st < .1 ? 2 : st < 1 ? 1 : 0;
  let s = '';
  for (let v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st) {
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="12.5" fill="var(--mut)">${cfg.yFmt ? cfg.yFmt(v) : FA.nf(v, dec)}</text>`;
  }
  let xt = cfg.xTicks || [];
  if (narrow && xt.length > 4) xt = xt.filter((_, i) => i % 2 === 0);
  s += xt.map(v => `<text x="${X(v)}" y="${H - B + 18}" text-anchor="middle" font-size="12.5" fill="var(--mut)">${cfg.xFmt ? cfg.xFmt(v) : v}</text>`).join('');
  if (cfg.xLabel) s += `<text x="${L + (W - L - R) / 2}" y="${H - 5}" text-anchor="middle" font-size="13" font-weight="600" fill="var(--mut)">${cfg.xLabel} →</text>`;
  if (cfg.yLabel) s += `<text x="4" y="14" font-size="13" font-weight="600" fill="var(--mut)">↑ ${cfg.yLabel}</text>`;
  (cfg.hlines || []).forEach(h => { if (h.y < lo || h.y > hi) return; s += `<line x1="${L}" x2="${W - R}" y1="${Y(h.y)}" y2="${Y(h.y)}" stroke="${h.color || 'var(--mut)'}" stroke-dasharray="4 4"/>` + (h.label ? `<text x="${W - R - 4}" y="${Y(h.y) - 5}" text-anchor="end" font-size="12.5" fill="${h.color || 'var(--mut)'}">${h.label}</text>` : ''); });
  (cfg.areas || []).forEach(a => { if (a.pts.length < 2) return; s += `<polygon fill="${a.color}" fill-opacity="${a.op || .2}" points="${a.pts.map(p => X(p[0]) + ',' + Y(p[1])).join(' ')}"/>`; });
  (cfg.vlines || []).forEach(v => { if (v.x < cfg.xMin || v.x > cfg.xMax) return; s += `<line x1="${X(v.x)}" x2="${X(v.x)}" y1="${T}" y2="${H - B}" stroke="${v.color}" stroke-width="2" ${v.dash ? 'stroke-dasharray="5 4"' : ''}/>` + (v.label ? `<text x="${X(v.x) + 5}" y="${T + 13 + (v.row || 0) * 16}" font-size="12.5" font-weight="600" fill="${v.color}">${v.label}</text>` : ''); });
  (cfg.series || []).forEach(sr => { if (sr.pts.length < 2) return; s += `<polyline fill="none" stroke="${sr.color}" stroke-width="${sr.w || 2.5}" stroke-linejoin="round" ${sr.dash ? `stroke-dasharray="${sr.dash}"` : ''} points="${sr.pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ')}"/>`; });
  if (cfg.cursor != null) s += `<line x1="${X(cfg.cursor)}" x2="${X(cfg.cursor)}" y1="${T}" y2="${H - B}" stroke="var(--ink)" stroke-width="1.5"/>`;
  if (cfg.point) { const p = cfg.point, px = X(p.x), py = Y(p.y), right = px > W * .62; s += `<circle cx="${px}" cy="${py}" r="6" fill="${p.color || 'var(--red)'}" stroke="var(--bg)" stroke-width="2.5"/>` + (p.label ? `<text x="${right ? px - 10 : px + 10}" y="${Math.max(T + 14, py - 10)}" text-anchor="${right ? 'end' : 'start'}" font-size="14" font-weight="600" fill="var(--ink)">${p.label}</text>` : ''); }
  svg.innerHTML = s;
  const inv = px => { const t = (px - L) / (W - L - R); const v = x0 + t * (x1 - x0); return cfg.logX ? Math.exp(v) : v; };
  return {X, Y, inv, L, R, W, H};
};

FA.simple = FA.store.get('simple', false);
document.documentElement.classList.toggle('simple', FA.simple);
FA.setSimple = v => { FA.simple = v; FA.store.set('simple', v); document.documentElement.classList.toggle('simple', v); if (FA.onSimple) FA.onSimple(); };
FA.observe = (el, fn) => { const ro = new ResizeObserver(() => fn()); ro.observe(el); return ro; };

/* liga um range a output e trilho preenchido */
FA.rangeFill = el => el.style.setProperty('--f', ((el.value - el.min) / (el.max - el.min) * 100) + '%');
FA.seg = (el, val) => el.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(val))));

/* gaveta (abre e fecha) com gráfico e explicação em abas
   o = {id, t, ico, val, leg:[[nome,cor]], open, adv, body, ex:{o,p,l,a}}  (a = true: aba "Agora" preenchida depois) */
FA.EXT = [['o', 'O que é'], ['p', 'Por que olhar'], ['l', 'Como ler'], ['a', 'Agora']];
FA.exHTML = (id, ex) => {
  const tabs = FA.EXT.filter(([k]) => ex[k]);
  return `<div class="ex" data-ex="${id}"><div class="ex-tabs" role="tablist">${tabs.map(([k, n], i) => `<button role="tab" data-k="${k}" aria-selected="${i === 0}">${n}</button>`).join('')}</div>
    ${tabs.map(([k], i) => `<div class="ex-p" data-k="${k}" ${i ? 'hidden' : ''}${k === 'a' && ex.a === true ? ` id="${id}-now"` : ''}>${ex[k] === true ? '' : ex[k]}</div>`).join('')}</div>`;
};
FA.dw = o => `<details class="dw${o.adv ? ' adv' : ''}${o.ex ? ' has-ex' : ''}" id="${o.id}"${o.open ? ' open' : ''} style="${o.c ? '--c:' + o.c : ''}">
  <summary><span class="dw-t">${o.t}</span><span class="dw-v" id="${o.id}-val">${o.val || ''}</span><span class="dw-ch" aria-hidden="true"></span></summary>
  <div class="dw-b">${o.body != null ? `<div class="dw-main">${o.leg ? `<div class="legend">${o.leg.map(([n, col, cls]) => `<span${cls ? ` class="${cls}"` : ''} style="--c:${col}">${n}</span>`).join('')}</div>` : ''}${o.body}</div>` : ''}${o.ex ? FA.exHTML(o.id, o.ex) : ''}</div></details>`;
FA.dwSet = (id, val, now) => { const v = document.getElementById(id + '-val'); if (v && val != null) v.innerHTML = val; const n = document.getElementById(id + '-now'); if (n && now != null) n.innerHTML = now; };
document.addEventListener('click', e => {
  const b = e.target.closest('.ex-tabs button'); if (!b) return;
  const box = b.closest('.ex');
  box.querySelectorAll('.ex-tabs button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
  box.querySelectorAll('.ex-p').forEach(p => p.hidden = p.dataset.k !== b.dataset.k);
});
/* transforma blocos já escritos no HTML em gavetas: <div data-dw="id" data-t="título" data-open data-ex='{"o":..}'> conteúdo </div> */
FA.dwUpgrade = root => (root || document).querySelectorAll('[data-dw]').forEach(el => {
  const ex = el.dataset.ex ? FA.EXP[el.dataset.ex] : null, wrap = document.createElement('div');
  wrap.innerHTML = FA.dw({id: el.dataset.dw, t: el.dataset.t, open: el.hasAttribute('data-open'), adv: el.classList.contains('adv'), body: '', ex, c: el.dataset.c});
  const d = wrap.firstElementChild; d.querySelector('.dw-main').append(...el.childNodes); el.replaceWith(d);
});
FA.EXP = FA.EXP || {};
}
