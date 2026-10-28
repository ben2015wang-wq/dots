// 日常行程本 standalone runtime (the installable app at /planner/).
// Stands in for the claude.ai page runtime: AI analysis runs on the user's own API key,
// shared with DOTS through the same `dots-ai` setting. Schedule data stays on this device.
(function(){
'use strict';
const KEYS = { events: 'dailyPlanner.events.v1', todos: 'dailyPlanner.todos.v1' };
const AIP = {
  anthropic: { n: 'Anthropic（Claude）', m: 'claude-sonnet-5-5', ms: ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5'], ph: 'sk-ant-…' },
  openai: { n: 'OpenAI（ChatGPT）', m: 'gpt-4o', ms: ['gpt-4o', 'gpt-4o-mini'], ph: 'sk-…' },
  gemini: { n: 'Google Gemini', m: 'gemini-3.8-flash', ms: ['gemini-3.8-flash'], ph: 'AIza…' },
};
const ls = {
  get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
};
function aiCfg(){
  let c = {};
  try { c = JSON.parse(ls.get('dots-ai') || '{}') || {}; } catch (e) {}
  if (!c.provider) { const k = ls.get('dots-aikey'); if (k) c = { provider: 'anthropic', key: k, model: ls.get('dots-aimodel') || '' }; }
  return c;
}
const configured = c => !!(c.provider && AIP[c.provider] && c.key);
const b64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });

/* ---------- AI (same call shape as the claude.ai `sample` capability) ---------- */
async function sample(input, o = {}){
  const c = aiCfg();
  if (!configured(c)) { openSettings('請先設定 AI 服務與金鑰，才能辨識圖片。'); throw { code: 'nokey', message: '尚未設定 AI 金鑰。請點右上角的齒輪設定。' }; }
  const pv = c.provider, model = c.model || AIP[pv].m;
  const imgs = [];
  for (const im of (o.images ? [].concat(o.images) : [])) imgs.push({ type: im.type || 'image/jpeg', data: await b64(im) });
  const msgs = typeof input === 'string' ? [{ role: 'user', content: input }] : input.map(m => ({ role: m.role, content: m.content }));
  const last = msgs.length - 1;
  let url, body, pick; const headers = { 'content-type': 'application/json' };
  if (pv === 'anthropic') {
    url = 'https://api.anthropic.com/v1/messages';
    Object.assign(headers, { 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' });
    body = { model, max_tokens: 4096, stream: true, messages: msgs.map((m, i) => i === last && imgs.length
      ? { role: m.role, content: [...imgs.map(g => ({ type: 'image', source: { type: 'base64', media_type: g.type, data: g.data } })), { type: 'text', text: m.content }] } : m) };
    pick = j => (j.type === 'content_block_delta' && j.delta && j.delta.text) || '';
  } else if (pv === 'gemini') {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(c.key)}`;
    body = { contents: msgs.map((m, i) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }, ...(i === last ? imgs.map(g => ({ inline_data: { mime_type: g.type, data: g.data } })) : [])] })) };
    pick = j => ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || '').join('');
  } else {
    url = 'https://api.openai.com/v1/chat/completions';
    headers.authorization = 'Bearer ' + c.key;
    body = { model, stream: true, messages: msgs.map((m, i) => i === last && imgs.length
      ? { role: m.role, content: [{ type: 'text', text: m.content }, ...imgs.map(g => ({ type: 'image_url', image_url: { url: `data:${g.type};base64,${g.data}` } }))] } : m) };
    pick = j => ((((j.choices || [])[0] || {}).delta || {}).content) || '';
  }
  let r;
  for (let t = 0; ; t++) {
    try { r = await fetch(url, { method: 'POST', signal: o.signal, headers, body: JSON.stringify(body) }); }
    catch (e) { if (e && e.name === 'AbortError') throw { code: 'aborted', message: '已停止' }; throw { code: 'network', message: '無法連線到 ' + AIP[pv].n + '，請檢查網路。' }; }
    if ((r.status === 503 || r.status === 529) && t < 2) { await new Promise(res => setTimeout(res, 2000 * (t + 1))); continue; }
    break;
  }
  if (!r.ok) {
    let m = ''; try { const j = await r.json(); m = (j.error && (j.error.message || j.error)) || j.message || ''; } catch (e) {}
    if (r.status === 401 || r.status === 403) { openSettings('金鑰無效或沒有權限，請重新輸入。'); throw { code: 'badkey', message: '金鑰無效或沒有權限，請重新設定。' }; }
    if (r.status === 429) throw { code: 'rate_limited', message: '已達使用量上限' };
    throw { code: 'api', message: String(m || ('HTTP ' + r.status)) };
  }
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '', text = '';
  try {
    for (;;) {
      const { done, value } = await rd.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const ln = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!ln.startsWith('data:') || ln.includes('[DONE]')) continue;
        try { const t = pick(JSON.parse(ln.slice(5))); if (t) { text += t; o.onText && o.onText({ text, delta: t }); } } catch (e) {}
      }
    }
  } catch (e) { if (e && e.name === 'AbortError') throw { code: 'aborted', message: '已停止' }; throw e; }
  return { text, truncated: false };
}
sample.limits = async () => ({ images: { maxCount: 5, maxBytes: 5 * 1024 * 1024, mediaTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } });
sample.json = async (input, o) => {
  const { text } = await sample(input, o);
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  try { return JSON.parse(s >= 0 && e > s ? text.slice(s, e + 1) : text); }
  catch (x) { throw { code: 'invalid_json', message: '回覆格式不完整', text }; }
};

// db / user are not served here: the page then keeps everything in this device's storage.
window.claude = { use: async n => (n === 'sample' ? sample : null) };
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

/* ---------- settings: AI key + backup ---------- */
let dlg = null;
function el(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
function buildSettings(){
  dlg = el(`<div class="scrim" id="setScrim" hidden>
  <form class="mb" id="setForm" autocomplete="off">
    <h3>設定</h3>
    <p class="status err" id="setMsg" hidden></p>
    <div class="fields">
      <label class="f full">AI 服務<select class="inp" id="set-pv">${Object.entries(AIP).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('')}</select></label>
      <label class="f full">API 金鑰<input class="inp" id="set-key" type="password" autocapitalize="off" autocorrect="off" spellcheck="false"></label>
      <label class="f full">模型<input class="inp" id="set-model" list="set-models" autocapitalize="off" autocorrect="off" spellcheck="false"><datalist id="set-models"></datalist></label>
      <p class="hint full">金鑰只存在這台裝置，用來辨識課表圖片；費用由該服務向你的帳號計算。和 DOTS 共用同一份設定。</p>
    </div>
    <div class="sh" style="padding:6px 0 0"><b>備份</b><span>資料只存在這台裝置</span></div>
    <div class="row">
      <button type="button" class="btn ghost" id="set-export">匯出備份</button>
      <label class="btn ghost" for="set-import">從備份還原</label>
      <input type="file" id="set-import" class="vh" accept="application/json,.json">
    </div>
    <p class="status" id="setBackupMsg"></p>
    <div class="actions">
      <span class="status">日常行程本 · App 版</span>
      <div class="r"><button type="button" class="btn ghost" id="setCancel">關閉</button><button type="submit" class="btn">儲存</button></div>
    </div>
  </form>
</div>`);
  document.body.appendChild(dlg);
  const $ = s => dlg.querySelector(s);
  const fillModels = () => { const p = AIP[$('#set-pv').value]; $('#set-models').innerHTML = p.ms.map(m => `<option value="${m}">`).join(''); $('#set-key').placeholder = p.ph; $('#set-model').placeholder = p.m; };
  $('#set-pv').onchange = () => { fillModels(); $('#set-model').value = ''; };
  $('#setCancel').onclick = closeSettings;
  dlg.addEventListener('mousedown', e => { if (e.target === dlg) closeSettings(); });
  $('#setForm').addEventListener('submit', e => {
    e.preventDefault();
    const prev = aiCfg();
    const c = Object.assign({}, prev, { provider: $('#set-pv').value, key: $('#set-key').value.trim(), model: $('#set-model').value.trim() });
    if (!c.key) { const m = $('#setMsg'); m.textContent = '請輸入 API 金鑰。'; m.hidden = false; return; }
    ls.set('dots-ai', JSON.stringify(c));
    closeSettings();
  });
  $('#set-export').onclick = () => {
    const data = { app: 'daily-planner', version: 1, exportedAt: new Date().toISOString(),
      events: JSON.parse(ls.get(KEYS.events) || '[]'), todos: JSON.parse(ls.get(KEYS.todos) || '[]') };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const name = `行程備份-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(() => {}); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  $('#set-import').onchange = async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    const msg = $('#setBackupMsg');
    try {
      const d = JSON.parse(await f.text());
      if (!d || !Array.isArray(d.events) || !Array.isArray(d.todos)) throw new Error('format');
      const merge = (key, list) => { const cur = JSON.parse(ls.get(key) || '[]'); const m = new Map(cur.map(x => [x.id, x])); list.forEach(x => x && x.id && m.set(x.id, x)); ls.set(key, JSON.stringify([...m.values()])); };
      merge(KEYS.events, d.events); merge(KEYS.todos, d.todos);
      msg.textContent = `已還原 ${d.events.length} 筆行程、${d.todos.length} 項待辦，重新載入中…`; msg.className = 'status ok';
      setTimeout(() => location.reload(), 800);
    } catch (x) { msg.textContent = '這不是行程本的備份檔。'; msg.className = 'status err'; }
  };
  fillModels();
}
function openSettings(note){
  if (!dlg) buildSettings();
  const c = aiCfg(), $ = s => dlg.querySelector(s);
  $('#set-pv').value = AIP[c.provider] ? c.provider : 'anthropic';
  $('#set-pv').onchange(); $('#set-key').value = c.key || ''; $('#set-model').value = c.model || '';
  const m = $('#setMsg'); m.textContent = note || ''; m.hidden = !note;
  $('#setBackupMsg').textContent = '';
  dlg.hidden = false;
}
function closeSettings(){ if (dlg) dlg.hidden = true; }

/* ---------- install hint (iOS Safari) + offline ---------- */
function installHint(){
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  if (!ios || standalone || ls.get('planner.hideInstall')) return;
  const b = el(`<div class="installhint" role="note"><span>安裝成 App：點 Safari 的<b>分享</b>按鈕 <svg class="i" viewBox="0 0 24 24"><path d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>，再選<b>加入主畫面</b>。</span><button type="button" class="ib" aria-label="關閉"><svg class="i"><use href="#i-x"/></svg></button></div>`);
  b.querySelector('button').onclick = () => { ls.set('planner.hideInstall', '1'); b.remove(); };
  document.body.appendChild(b);
}
document.addEventListener('DOMContentLoaded', () => {
  const st = document.createElement('style');
  st.textContent = `.installhint{position:fixed;left:max(12px,env(safe-area-inset-left,0px));right:max(12px,env(safe-area-inset-right,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:60;display:flex;gap:10px;align-items:center;background:var(--pop);border:1px solid var(--bd2);border-radius:14px;padding:12px 10px 12px 14px;box-shadow:0 12px 40px rgba(0,0,0,.35);font-size:13px}
.installhint span{flex:1;min-width:0}.installhint b{font-weight:600}.installhint svg.i{width:15px;height:15px;vertical-align:-2px;color:var(--ac)}
.installhint~.fab{bottom:calc(84px + env(safe-area-inset-bottom,0px))}
.hint.full{grid-column:1/-1}`;
  document.head.appendChild(st);
  const bar = document.querySelector('header.bar');
  if (bar) {
    const g = el(`<button class="ib" id="setBtn" aria-label="設定" title="設定"><svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg></button>`);
    g.onclick = () => openSettings();
    bar.appendChild(g);
  }
  const sync = document.querySelector('#sync span');
  if (sync) sync.textContent = '存在這台裝置';
  installHint();
  if (!configured(aiCfg())) {
    const s = document.getElementById('importStatus');
    if (s && !s.textContent) s.textContent = '第一次使用請先點右上角齒輪，設定 AI 金鑰。';
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSettings(); });
});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
