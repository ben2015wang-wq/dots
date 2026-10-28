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
  if (!configured(c)) { openSettings('請先設定 AI 服務與金鑰，才能辨識圖片。'); throw { code: 'nokey', message: '尚未設定 AI 金鑰。請點右上角的齒輪，在「AI 辨識」設定。' }; }
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

/* ---------- files: share sheet on iPhone, download elsewhere ---------- */
window.__plannerSave = async (name, text, mime) => {
  const blob = new Blob([text], { type: mime });
  const file = new File([blob], name, { type: mime });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') throw { code: 'declined' }; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  return 'downloaded';
};

/* ---------- settings sections added to the page's 設定 dialog: AI key + backup ---------- */
function el(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
function openSettings(note){
  if (window.__openPrefs) window.__openPrefs('prefAi', note);
}
function buildSettings(slot){
  slot.appendChild(el(`<div>
    <h4 id="prefAi">AI 辨識</h4>
    <div class="pgroup">
      <div class="prow"><span>AI 服務</span><select class="inp" id="set-pv">${Object.entries(AIP).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('')}</select></div>
      <div class="prow stack"><span>API 金鑰<small>只存在這台裝置，費用由該服務向你的帳號計算。和 DOTS 共用。</small></span>
        <input class="inp" id="set-key" type="password" autocapitalize="off" autocorrect="off" spellcheck="false" style="width:100%"></div>
      <div class="prow stack"><span>模型</span><input class="inp" id="set-model" list="set-models" autocapitalize="off" autocorrect="off" spellcheck="false" style="width:100%"><datalist id="set-models"></datalist></div>
      <div class="prow"><span id="set-state"></span><button type="button" class="btn" id="set-save">儲存金鑰</button></div>
    </div>
    <h4>備份</h4>
    <div class="pgroup">
      <div class="prow"><span>匯出備份<small>行程與待辦存成一個 .json 檔</small></span><button type="button" class="btn ghost" id="set-export">匯出</button></div>
      <div class="prow"><span>從備份還原<small>會合併到目前的資料</small></span><label class="btn ghost" for="set-import">選擇檔案</label><input type="file" id="set-import" class="vh" accept="application/json,.json"></div>
    </div>
    <p class="pnote" id="setBackupMsg" hidden></p>
  </div>`));
  const $ = s => slot.querySelector(s);
  const fillModels = () => { const p = AIP[$('#set-pv').value]; $('#set-models').innerHTML = p.ms.map(m => `<option value="${m}">`).join(''); $('#set-key').placeholder = p.ph; $('#set-model').placeholder = p.m; };
  const fill = () => {
    const c = aiCfg();
    $('#set-pv').value = AIP[c.provider] ? c.provider : 'anthropic'; fillModels();
    $('#set-key').value = c.key || ''; $('#set-model').value = c.model || '';
    $('#set-state').textContent = configured(c) ? '已設定 ✓' : '尚未設定';
  };
  $('#set-pv').onchange = () => { fillModels(); $('#set-model').value = ''; };
  $('#set-save').onclick = () => {
    const key = $('#set-key').value.trim();
    if (!key) { $('#set-state').textContent = '請輸入金鑰'; return; }
    ls.set('dots-ai', JSON.stringify(Object.assign({}, aiCfg(), { provider: $('#set-pv').value, key, model: $('#set-model').value.trim() })));
    $('#set-state').textContent = '已儲存 ✓';
    const s = document.getElementById('importStatus'); if (s && /金鑰/.test(s.textContent)) s.textContent = '';
  };
  $('#set-export').onclick = async () => {
    const msg = $('#setBackupMsg');
    const data = { app: 'daily-planner', version: 1, exportedAt: new Date().toISOString(),
      events: JSON.parse(ls.get(KEYS.events) || '[]'), todos: JSON.parse(ls.get(KEYS.todos) || '[]') };
    try { await window.__plannerSave(`planner-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
      msg.textContent = `已匯出 ${data.events.length} 筆行程、${data.todos.length} 項待辦。`; msg.className = 'pnote ok'; }
    catch (e) { if (e && e.code === 'declined') return; msg.textContent = '匯出失敗，請再試一次。'; msg.className = 'pnote err'; }
    msg.hidden = false;
  };
  $('#set-import').onchange = async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    const msg = $('#setBackupMsg'); msg.hidden = false;
    try {
      const d = JSON.parse(await f.text());
      if (!d || !Array.isArray(d.events) || !Array.isArray(d.todos)) throw new Error('format');
      const merge = (key, list) => { const cur = JSON.parse(ls.get(key) || '[]'); const m = new Map(cur.map(x => [x.id, x])); list.forEach(x => x && x.id && m.set(x.id, x)); ls.set(key, JSON.stringify([...m.values()])); };
      merge(KEYS.events, d.events); merge(KEYS.todos, d.todos);
      msg.textContent = `已還原 ${d.events.length} 筆行程、${d.todos.length} 項待辦，重新載入中…`; msg.className = 'pnote ok';
      setTimeout(() => location.reload(), 800);
    } catch (x) { msg.textContent = '這不是行程本的備份檔。'; msg.className = 'pnote err'; }
  };
  fill();
  document.getElementById('prefBtn')?.addEventListener('click', fill);
  return fill;
}

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
.installhint~.fab{bottom:calc(84px + env(safe-area-inset-bottom,0px))}`;
  document.head.appendChild(st);
  const slot = document.getElementById('prefApp');
  if (slot) buildSettings(slot);
  const sync = document.querySelector('#sync span');
  if (sync) sync.textContent = '存在這台裝置';
  installHint();
  if (!configured(aiCfg())) {
    const s = document.getElementById('importStatus');
    if (s && !s.textContent) s.textContent = '第一次使用請先點右上角齒輪，在「AI 辨識」設定金鑰。';
  }
});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
