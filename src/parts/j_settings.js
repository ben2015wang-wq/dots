// ---------- settings (language, theme, snapping, dot grid, tour) ----------
let SET={lang:'zh',dots:true};try{Object.assign(SET,JSON.parse(localStorage.getItem('dots-set')||'{}'))}catch(e){}
if(SET.lang!=='en')SET.lang='zh';
function setSave(){try{localStorage.setItem('dots-set',JSON.stringify(SET))}catch(e){}}
function dotsApply(){$('cv').style.backgroundImage=SET.dots?'':'none'}
const EN=SET.lang==='en',CJK=/[一-鿿]/,I18K=Object.keys(I18N).filter(k=>k.length>3).sort((a,b)=>b.length-a.length);
function tr(s){if(!EN||!s||!CJK.test(s))return s;const t=s.trim();if(I18N[t]!==undefined)return s.replace(t,I18N[t]);let r=s;for(const k of I18K)if(r.includes(k))r=r.split(k).join(I18N[k]);for(const[a,b]of I18R)r=r.replace(new RegExp(a,'g'),b);return r}
const TRX='#cv,#ta,#cmts,#ititle,textarea,input,[contenteditable],script,style,.nosetr';
function trNode(n){if(n.nodeType===3){const p=n.parentElement;if(p&&!p.closest(TRX)){const v=tr(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v}}else if(n.nodeType===1){if(n.closest(TRX))return;['title','aria-label','placeholder'].forEach(a=>{if(n.hasAttribute&&n.hasAttribute(a)){const v=tr(n.getAttribute(a));if(v!==n.getAttribute(a))n.setAttribute(a,v)}});for(let c=n.firstChild;c;c=c.nextSibling)trNode(c)}}
if(EN){document.documentElement.lang='en';trNode(document.body);new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')trNode(m.target);else if(m.type==='attributes')trNode(m.target);else m.addedNodes.forEach(trNode)}}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']})}
IC.gear='M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z';
$('bh').insertAdjacentHTML('beforebegin',`<button class="b" id="bset" title="設定" aria-label="設定">${ic('gear')}</button>`);
const stp=document.createElement('div');stp.className='pn';stp.id='stp';$('dots').appendChild(stp);
function stpUI(){const seg=(k,o)=>o.map(([v,l])=>`<button class="sg${(k==='theme'?R.dataset.wb:k==='snap'?(SNAP?'1':'0'):k==='dots'?(SET.dots?'1':'0'):SET.lang)===v?' on':''}" data-k="${k}" data-v="${v}">${l}</button>`).join('');
 stp.innerHTML=`<div class="lh"><span>設定</span><button class="b sm" data-st="x" aria-label="關閉">✕</button></div>
<div class="sr"><label>語言</label><div class="sgs">${seg('lang',[['zh','繁體中文'],['en','English']])}</div></div>
<div class="sr"><label>主題</label><div class="sgs">${seg('theme',[['light','淺色'],['dark','深色']])}</div></div>
<div class="sr"><label>對齊輔助</label><div class="sgs">${seg('snap',[['1','開'],['0','關']])}</div></div>
<div class="sr"><label>圓點背景</label><div class="sgs">${seg('dots',[['1','顯示'],['0','隱藏']])}</div></div>
<div class="sr"><label>導覽</label><button class="btn" data-st="tour">重新顯示教學</button></div>
<div class="sr"><label>面板位置</label><button class="btn" data-st="pos">重設屬性面板位置</button></div>
<div class="sn">設定只存在這個瀏覽器。切換語言會重新載入頁面（作品內容不受影響）。</div>`}
function stpToggle(f){const o=stp.style.display==='flex';stp.style.display=f===false||o?'none':'flex';if(stp.style.display==='flex'){stpUI();if(typeof toggleExm==='function')toggleExm(false)}}
$('bset').onclick=e=>{e.stopPropagation();stpToggle()};
dAdd('click',e=>{const t=e.target;if(!t.closest('#stp')&&!t.closest('#bset')){stp.style.display='none';return}
 const g=t.closest('#stp [data-k]');if(g){const k=g.dataset.k,v=g.dataset.v;if(k==='lang'){if(v!==SET.lang){SET.lang=v;setSave();location.reload()}return}
  if(k==='theme')theme(v);else if(k==='snap')snapSet(v==='1');else if(k==='dots'){SET.dots=v==='1';setSave();dotsApply()}stpUI();if(EN)trNode(stp);return}
 const s=t.closest('#stp [data-st]');if(!s)return;const a=s.dataset.st;
 if(a==='x')stp.style.display='none';
 else if(a==='tour'){stp.style.display='none';const b=document.createElement('button');b.setAttribute('data-help','1');b.hidden=true;document.body.appendChild(b);b.click();b.remove()}
 else if(a==='pos'){try{localStorage.removeItem('dots-props-pos')}catch(x){}if(window.__placeProps)window.__placeProps();toast('已重設面板位置')}});
dotsApply();
// ---------- pop the current board / page out into its own window (second monitor, like detaching a document tab) ----------
IC.popout='M14 4h6v6M20 4l-9 9M18 14v5H5V6h5';
$('be').insertAdjacentHTML('afterend',`<button class="b" id="bpo" title="在新視窗開啟目前頁面" aria-label="在新視窗開啟目前頁面">${ic('popout')}</button>`);
$('bpo').onclick=()=>{if(!BID)return;const u=location.href.split('#')[0]+'#/b/'+BID+'&pg='+encodeURIComponent(S.pg);const w=window.open('','dots-'+BID+'-'+S.pg,'popup=yes,width='+Math.min(1280,screen.availWidth-80)+',height='+Math.min(820,screen.availHeight-80)+',left=60,top=60');if(w)setTimeout(()=>{try{w.location.href=u}catch(e){}},900);if(!w)toast('瀏覽器擋住了新視窗，請允許彈出視窗後再試');else toast('已在新視窗開啟，可拖到其他螢幕；兩個視窗會即時同步')};
(function(){const m=/[#&]pg=([\w-]+)/.exec(location.hash);if(!m)return;const want=decodeURIComponent(m[1]);let n=0;const iv=setInterval(()=>{n++;if(n>120)return clearInterval(iv);if(ACT.on&&PGS.some(p=>p.id===want)){clearInterval(iv);if(S.pg!==want)gotoPg(want)}},250)})();
// ---------- detach the properties panel into its own window ----------
IC.dock='M4 5h16v14H4zM4 9h16';
function popProps(){
 if(PWIN&&!PWIN.closed){PWIN.close();return}
 const w=window.open('','dots-props','popup=yes,width=420,height='+Math.min(760,screen.availHeight-100)+',left='+Math.max(0,(window.screenX||0)+60)+',top='+Math.max(0,(window.screenY||0)+80));
 if(!w){toast('瀏覽器擋住了新視窗，請允許彈出視窗後再試');return}
 const P=$('props'),home=P.parentNode,d=w.document;
 d.open();d.write('<!doctype html><html><head><meta charset="utf-8"><title>DOTS · 屬性</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>');d.close();
 d.documentElement.dataset.wb=R.dataset.wb;d.documentElement.lang=document.documentElement.lang;
 document.querySelectorAll('head style,head link[rel=stylesheet],body style').forEach(n=>{const c=n.cloneNode(true);if(c.tagName==='STYLE')c.textContent=c.textContent.replace(/max-width:\s*640px/g,'max-width:0px');d.head.appendChild(c)});
 const st=d.createElement('style');st.textContent='html,body{margin:0;height:100%;overflow:hidden;background:var(--bg,var(--page))}#dots.pw{position:fixed;inset:0;overflow:auto}#dots.pw #props{position:static!important;left:auto!important;top:auto!important;bottom:auto!important;transform:none!important;width:auto!important;max-height:none!important;height:100%;box-sizing:border-box;border:0;border-radius:0;box-shadow:none;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-content:start;gap:12px 18px;flex-wrap:nowrap;background:var(--page);backdrop-filter:none}#dots.pw #props .pq{display:flex;flex-direction:column}#dots.pw #props .pq.row{flex-direction:row}#dots.pw #props .full{grid-column:1/-1;flex-basis:auto}#dots.pw #props .pgrip{display:flex!important;cursor:default}#dots.pw #props[data-empty]{display:none!important}#dots.pw #pwe{display:none;position:absolute;inset:0;align-items:center;justify-content:center;text-align:center;padding:24px;color:var(--mut);font:13px/1.6 system-ui,sans-serif}#dots.pw #props[data-empty]~#pwe{display:flex}#dots.pw .pgpop{position:static}';d.head.appendChild(st);
 const wrap=d.createElement('div');wrap.id='dots';wrap.className='on pw';d.body.appendChild(wrap);
 const empty=d.createElement('div');empty.id='pwe';empty.textContent=tr('選取物件後，這裡會顯示它的屬性');
 P.dataset.pop='1';wrap.appendChild(P);wrap.appendChild(empty);PWIN=w;
 const sync=()=>{if(P.style.display==='none')P.setAttribute('data-empty','');else P.removeAttribute('data-empty')};sync();
 const mo=new MutationObserver(sync);mo.observe(P,{attributes:true,attributeFilter:['style']});
 const to=new MutationObserver(()=>{d.documentElement.dataset.wb=R.dataset.wb});to.observe(R,{attributes:true,attributeFilter:['data-wb']});
 const ty=['click','input','change','keydown','dblclick'];DREG.forEach(([t,f,o])=>{if(ty.includes(t))d.addEventListener(t,e=>{if(ACT.on)f(e)},o)});
 let back=false;const dock=()=>{if(back)return;back=true;mo.disconnect();to.disconnect();delete P.dataset.pop;P.removeAttribute('data-empty');try{home.appendChild(P)}catch(e){}PWIN=null;if(window.__placeProps)window.__placeProps();props();ovl()};
 w.addEventListener('pagehide',dock);addEventListener('pagehide',()=>{try{w.close()}catch(e){}});
 if(EN)trNode(d.body);props();toast('屬性面板已拖出為獨立視窗；再按一次面板上的按鈕即可收回')}

