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
