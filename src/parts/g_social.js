// ---------- comments (pins on the canvas, threads stored as docs)
const CM=new Map();let cmOpen=null,usr=null,uid=null,ROLE='edit';
const canCmt=()=>ROLE!=='view'&&(uid||!db);
function cmSave(c){saveLocal();if(!db)return;const{pend,...d}=c;db.doc(BP+'cmt/'+c.id).set(d).catch(()=>toast('評論儲存失敗'))}
function cmDel(c){CM.delete(c.id);saveLocal();if(db)db.doc(BP+'cmt/'+c.id).delete().catch(()=>{})}
function drawCmts(){const box=$('cmts');if(!box)return;if(PRES){box.innerHTML='';return}let n=0;const h=[...CM.values()].filter(c=>c.pg===S.pg).sort((a,b)=>a.ts-b.ts).map(c=>{n++;const x=S.v.x+c.x*S.v.k,y=S.v.y+c.y*S.v.k;return`<button class="cpin${c.res?' res':''}${cmOpen===c.id?' on':''}" data-cm="${c.id}" style="transform:translate(${x}px,${y}px)" title="${esc((c.th&&c.th[0]?c.th[0].t:c.t||'').slice(0,60))}">${c.pend?'+':(c.th||[]).length>1?(c.th||[]).length:'💬'}</button>`}).join('');if(box._h!==h){box._h=h;box.innerHTML=h}}
function nameOf(m){return m.bn||'訪客'}
function cmPop(id){const c=CM.get(id);if(!c)return;cmOpen=id;const p=$('cpop'),x=Math.min(innerWidth-300,S.v.x+c.x*S.v.k+16),y=Math.max(60,Math.min(innerHeight-260,S.v.y+c.y*S.v.k));p.style.cssText=`display:flex;left:${Math.max(8,x)}px;top:${y}px`;
 const mine=m=>m.by&&m.by===uid;
 p.innerHTML=`<div class="lh"><span>評論${c.res?'（已解決）':''}</span><button class="b sm" data-cc="close">${ic('x')}</button></div><div class="cth">${(c.th||[]).map((m,i)=>`<div class="cm"><b>${esc(nameOf(m))}</b> <span class="mu2">${new Date(m.ts).toLocaleString('zh-TW',{hour12:false,month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>${mine(m)||ROLE==='edit'?`<button class="b sm xx" data-cc="delm" data-i="${i}" title="刪除這則">${ic('x')}</button>`:''}<div>${esc(m.t)}</div></div>`).join('')||'<div class="mu2">寫下第一則評論</div>'}</div><textarea id="cmt" rows="2" placeholder="${c.pend?'輸入評論…':'回覆…'}" maxlength="500"></textarea><div class="row" style="gap:6px"><button class="btn pri" data-cc="send" style="flex:1">${c.pend?'送出':'回覆'}</button>${c.pend?'':`<button class="btn" data-cc="res">${c.res?'重新開啟':'解決'}</button>`}${c.pend||ROLE!=='edit'&&!(c.th&&c.th[0]&&mine(c.th[0]))?'':'<button class="btn" data-cc="del">刪除</button>'}</div>`;
 drawCmts();setTimeout(()=>{const t=$('cmt');if(t)t.focus()},30)}
function closeCmt(){const c=cmOpen&&CM.get(cmOpen);if(c&&c.pend)CM.delete(c.id);cmOpen=null;const p=$('cpop');if(p)p.style.display='none';drawCmts()}
function newComment(p){if(!canCmt())return toast(uid||db?'你沒有留言權限':'登入 Claude 後才能留言');closeCmt();const c={id:rid(),pg:S.pg,x:p.x,y:p.y,ts:Date.now(),by:uid||null,th:[],res:false,pend:true};CM.set(c.id,c);cmPop(c.id)}
dAdd('click',e=>{const pin=e.target.closest('[data-cm]');if(pin){const wasOpen=cmOpen===pin.dataset.cm;closeCmt();if(!wasOpen)cmPop(pin.dataset.cm);return}
 const b=e.target.closest('[data-cc]');if(!b)return;const c=CM.get(cmOpen),a=b.dataset.cc;if(a==='close')return closeCmt();if(!c)return;
 if(a==='send'){const t=$('cmt').value.trim();if(!t)return;c.th=c.th||[];c.th.push({t,by:uid||null,bn:me,ts:Date.now()});delete c.pend;c.res=false;cmSave(c);cmPop(c.id)}
 else if(a==='res'){c.res=!c.res;cmSave(c);cmPop(c.id)}
 else if(a==='del'){cmDel(c);closeCmt()}
 else if(a==='delm'){c.th.splice(+b.dataset.i,1);if(!c.th.length){cmDel(c);closeCmt()}else{cmSave(c);cmPop(c.id)}}});
dAdd('keydown',e=>{if(e.target.id==='cmt'){e.stopPropagation();if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();document.querySelector('#cpop [data-cc="send"]').click()}if(e.key==='Escape')closeCmt()}},true);
// ---------- presence
const peersEl=new Map();let lp=0,psig='';
function prow(list){const L=list.filter(pr=>!pr.isMe&&(pr.presence||{}).b===BID).map(pr=>{const d=pr.presence||{};return{id:pr.peer,n:d.n||'訪客',c:d.c||'#a8a29e',e:d.e||'',x:d.x,y:d.y,p:d.p}});
 const sig=L.map(q=>q.id+q.n+q.c+q.e+(q.p===S.pg?1:0)+(q.x==null?0:1)).join('|')+'|'+S.pg;PEERS=L;if(sig===psig)return;psig=sig;const r=$('prow');r.textContent='';
 L.slice(0,5).forEach(q=>{const b=document.createElement('button');b.className='pe'+(q.p!==S.pg?' off':'');b.dataset.pid=q.id;b.title=q.n+(q.p!==S.pg?'（在其他頁面）':q.x==null?'（尚未移動游標）':'，點一下跳到對方的位置');b.appendChild(avatar(q.n,q.c,{emoji:q.e,img:''}));r.appendChild(b)});
 if(L.length>5){const m=document.createElement('span');m.className='pm';m.textContent='+'+(L.length-5);r.appendChild(m)}
 if(L.length){const m=document.createElement('span');m.className='pm';m.textContent=(L.length+1)+' 人在線';r.appendChild(m)}}
let PEERS=[],PRAW=[],pkEls=new Map(),pkR=0;
function psel(){cancelAnimationFrame(pkR);pkR=requestAnimationFrame(psel0)}
function psel0(){const want=new Map();if(!PRES&&room&&ACT.on)PRAW.forEach(pr=>{if(pr.isMe)return;const d=pr.presence||{};if(d.b!==BID||d.p!==S.pg||!Array.isArray(d.s))return;d.s.slice(0,12).forEach((id,ix)=>{const o=S.objs.get(id);if(!o)return;want.set(pr.peer+'|'+id,{o,c:d.c||'#a8a29e',n:(d.e?d.e+' ':'')+(d.n||'訪客'),ed:d.ed===id,lab:ix===0})})});
 want.forEach((w,key)=>{let el=pkEls.get(key);if(!el){el=document.createElement('div');el.className='pk';el.innerHTML='<span></span>';$('dots').appendChild(el);pkEls.set(key,el)}
  const k=S.v.k,o=w.o,x=S.v.x+o.x*k,y=S.v.y+o.y*k,W=Math.max(10,(o.w||0)*k),H=Math.max(10,(o.h||0)*k);el.style.cssText=`left:${x-3}px;top:${y-3}px;width:${W+6}px;height:${H+6}px;border-color:${w.c}`;
  const sp=el.firstChild;sp.style.background=w.c;sp.style.display=w.lab?'':'none';sp.textContent=w.n+(w.ed?' 正在編輯':' 選取中');el.classList.toggle('ed',w.ed)});
 pkEls.forEach((el,key)=>{if(!want.has(key)){el.remove();pkEls.delete(key)}})}
function jumpTo(id){const q=PEERS.find(z=>z.id===id);if(!q)return;if(q.p&&q.p!==S.pg)gotoPg(q.p);if(q.x==null)return;S.v.x=innerWidth/2-q.x*S.v.k;S.v.y=innerHeight/2-q.y*S.v.k;applyV();if(room)drawPeers(room.peers())}
$('prow').addEventListener('click',e=>{const b=e.target.closest('.pe');if(b)jumpTo(b.dataset.pid)});
let LC=null,PSEL={s:[],ed:null},psg='';
function sendPres(){if(!room||!BID)return;const o={n:me,c:myc,e:PF.emoji,b:BID,p:S.pg,s:PSEL.s,ed:PSEL.ed};if(LC){o.x=LC.x;o.y=LC.y}room.presence(o).catch(()=>{})}
function cursor(p){if(!room)return;LC={x:p.x,y:p.y};if(Date.now()-lp<50)return;lp=Date.now();sendPres()}
function announceSel(){if(!room||!BID)return;const s=[...S.sel].slice(0,12),ed=ta._o&&!ta.hidden?ta._o.id:null,sig=s.join(',')+'|'+(ed||'')+'|'+S.pg;if(sig===psg)return;psg=sig;PSEL={s,ed};sendPres()}
function drawPeers(list){const live=new Set();let n=0;list.forEach(pr=>{if(pr.isMe)return;const d=pr.presence||{};if(d.b!==BID)return;n++;if(d.x==null||d.p!==S.pg||PRES)return;live.add(pr.peer);let el=peersEl.get(pr.peer);if(!el){el=document.createElement('div');el.className='cur';el.innerHTML='<b></b><span></span>';$('dots').appendChild(el);peersEl.set(pr.peer,el)}el.firstChild.style.background=d.c;el.lastChild.style.background=d.c;el.lastChild.textContent=(d.e?d.e+' ':'')+(d.n||'訪客');el.style.transform=`translate(${S.v.x+d.x*S.v.k}px,${S.v.y+d.y*S.v.k}px)`;el._d=d});peersEl.forEach((el,id)=>{if(!live.has(id)){el.remove();peersEl.delete(id)}});peerN=n+1;PRAW=list;prow(list);psel();syncUI()}
// ---------- shortcuts
const HK=[['V / H','選取 / 平移（按住空白鍵暫時平移）'],['P / L / E','畫筆 / 螢光筆 / 橡皮擦'],['T','文字（雙擊文字可編輯，選取部分文字後可單獨套用格式）'],['R / O / A / N','矩形 / 圓形 / 箭頭 / 直線（Shift 等比）'],['I','插入圖片（亦可貼上 / 拖曳）'],['C','評論（點畫布放下留言）'],['Ctrl+Z / Ctrl+Shift+Z','復原 / 重做（含圖層調整）'],['Ctrl+D','複製選取'],['Ctrl+A','全選'],['Del / Backspace','刪除'],['[ / ]','移到最後 / 最前'],['方向鍵','微調位置（Shift 加快）'],['Ctrl+滾輪 / + −','縮放'],['雙指捏合 / 旋轉','手機平板縮放畫布；兩指都在選取物件上時縮放並旋轉該物件'],['Ctrl+0 / Shift+1','100% / 符合畫面'],['M','切換黑夜 / 白色版'],['F','開關圖層面板'],['F5 / Ctrl+Enter','開始放映'],['Ctrl+B / I / U','粗體 / 斜體 / 底線'],['Alt+A','AI 分析選取的文字／圖片'],['Ctrl+E','匯出選單'],['Esc','取消選取 / 結束放映']];
$('hb').innerHTML='<h3>快捷鍵</h3>'+HK.map(([k,d])=>`<p><span>${d}</span><kbd>${k}</kbd></p>`).join('');
$('bh').onclick=()=>$('help').style.display='grid';$('help').onclick=()=>$('help').style.display='none';
wAdd('keyup',e=>{if(e.code==='Space'){space=false}});
wAdd('keydown',e=>{
 if(PRES){const k=e.key;if(k==='Escape'){e.preventDefault();endPres()}else if(['ArrowRight','ArrowDown','PageDown',' ','Enter'].includes(k)){e.preventDefault();presGo(presPg+1)}else if(['ArrowLeft','ArrowUp','PageUp','Backspace'].includes(k)){e.preventDefault();presGo(presPg-1)}else if(k==='Home')presGo(0);else if(k==='End')presGo(PGS.length-1);return}
 if(!ta.hidden||/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&document.activeElement.type!=='range')return;const k=e.key.toLowerCase(),m=e.ctrlKey||e.metaKey;
 if(e.key==='F5'||(m&&e.key==='Enter')){e.preventDefault();startPres();return}
 if(e.altKey&&e.code==='KeyA'){e.preventDefault();aiOpen();return}
 if(e.code==='Space'){space=true;e.preventDefault();return}
 if(RO){if(k==='escape'){S.sel.clear();$('help').style.display='none';ovl()}else if(k==='h')setTool('hand');else if(k==='v')setTool('select');else if(k==='c')setTool('cmt');else if(k==='m')toggleTheme();else if(m&&k==='0'){e.preventDefault();zoomAt(innerWidth/2,innerHeight/2,1)}else if(e.shiftKey&&e.code==='Digit1')fit();return}
 if(m&&k==='z'){e.preventDefault();e.shiftKey?rdo():undo();return}if(m&&k==='y'){e.preventDefault();rdo();return}
 if(m&&k==='d'){e.preventDefault();act('dup');return}if(m&&k==='a'){e.preventDefault();setTool('select');S.sel=new Set(pgObjs().filter(o=>o.t!=='frame'&&ok(o)).map(o=>o.id));props();ovl();return}
 if(m&&k==='e'){e.preventDefault();toggleExm();return}if(m&&k==='0'){e.preventDefault();zoomAt(innerWidth/2,innerHeight/2,1);return}
 if(m&&k.length===1&&'biu'.includes(k)&&S.sel.size){e.preventDefault();const p={b:'b',i:'i',u:'ul'}[k],ids=[...S.sel].map(i=>S.objs.get(i)).filter(o=>o&&o.t==='text');if(ids.length){const v=!fmtOn(ids[0],p);chg(o=>{if(o.t==='text')setFmt(o,p,v);return{}});props()}return}
 if(m)return;
 if(k==='delete'||k==='backspace'){act('del');return}if(k==='escape'){if(S.tool!=='select'){setTool('select');return}S.sel.clear();['help','exm','vp','aip','pp'].forEach(i=>$(i).style.display='none');if($('lp').style.display==='flex')toggleLP();closeCmt();props();ovl();return}
 if(k==='?'||k==='/'&&e.shiftKey){$('help').style.display='grid';return}
 if(e.key==='!'||(e.shiftKey&&e.code==='Digit1')){fit();return}
 if(k==='['){act('back');return}if(k===']'){act('front');return}
 if(k==='+'||k==='='){zoomAt(innerWidth/2,innerHeight/2,S.v.k*1.2);return}if(k==='-'){zoomAt(innerWidth/2,innerHeight/2,S.v.k/1.2);return}
 if(k==='f'){toggleLP();return}if(k==='m'){toggleTheme();return}
 if(k.startsWith('arrow')&&S.sel.size){e.preventDefault();const d=e.shiftKey?10:1,b=[...S.sel].map(i=>cl(S.objs.get(i)));S.sel.forEach(i=>{const o=S.objs.get(i);if(k==='arrowleft')o.x-=d;if(k==='arrowright')o.x+=d;if(k==='arrowup')o.y-=d;if(k==='arrowdown')o.y+=d;put(o)});commit(b.map(x=>[x.id,x,cl(S.objs.get(x.id))]));return}
 const t=TOOLS.find(t=>t[2].toLowerCase()===k);if(t)setTool(t[0])});
// ---------- accounts
let prefsOK=false;
function savePrefs(){if(!prefsOK||!db||!uid)return;clearTimeout(savePrefs.h);savePrefs.h=setTimeout(()=>db.doc('data/users/'+uid+'/prefs').set({theme:R.dataset.wb,ai:AI.on,recent:S.recent,profile:PF}).catch(()=>{}),500)}
let ACC={id:null,name:'訪客',color:'#a8a29e'};const PF={name:'',color:'',emoji:'',img:''};
function avatar(n,c,p,sz){const a=document.createElement(p.img?'img':'span');a.className='av';if(sz)a.style.cssText=`width:${sz}px;height:${sz}px;font-size:${Math.round(sz*.45)}px`;if(p.img)a.src=p.img;else{a.style.background=c;a.textContent=p.emoji||(n.trim().charAt(0)||'?').toUpperCase()}return a}
function acct(v){if(v!==undefined)ACC=v&&v.id?{id:v.id,name:v.name||'使用者',color:/^#[0-9a-f]{3,8}$/i.test(v.color||'')?v.color:'#a8a29e'}:{id:null,name:me,color:myc};const n=PF.name||ACC.name,c=PF.color||ACC.color,e=$('acct');e.innerHTML='';e.appendChild(avatar(n,c,PF));const t=document.createElement('span');t.textContent=n+(ACC.id||window.__STANDALONE?'':'（未登入）');e.appendChild(t)}
const PCOL=['#ef4444','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#78716c'],PEMO=['😀','😎','🦊','🐱','🐼','🦄','🌵','🚀','🎨','🔥','🌙','🍀'];
function applyPF(){me=PF.name||ACC.name;myc=PF.color||ACC.color;acct();ppUI();savePrefs();sendPres()}
function ppUI(){const n=PF.name||ACC.name,c=PF.color||ACC.color;$('pp').innerHTML=`<div class="lh"><span>使用者帳號</span><button class="b sm" data-pp="close">${ic('x')}</button></div><div style="display:flex;gap:12px;align-items:center"><span id="ppav"></span><div style="flex:1;min-width:0"><div style="font-size:11px;color:var(--mut);margin-bottom:4px">${window.__STANDALONE?'本機使用者（資料存在此瀏覽器）':ACC.id?'已登入 Claude 帳號':'未登入（訪客）'}</div><input id="ppn" maxlength="20" placeholder="顯示名稱"></div></div><div class="row" style="gap:6px"><button class="btn" style="flex:1" data-pp="up">上傳圖像</button>${PF.img||PF.emoji?'<button class="btn" data-pp="clr">移除圖像</button>':''}</div><label>代表色（游標與頭像）</label><div class="sw" style="grid-template-columns:repeat(8,1fr)">${PCOL.map(x=>`<button data-pc="${x}" class="${x===c?'on':''}" style="background:${x}"></button>`).join('')}</div><label>表情符號頭像</label><div class="row" style="gap:2px">${PEMO.map(x=>`<button class="b sm" data-pe="${x}" style="font-size:15px">${x}</button>`).join('')}</div>${ACC.id||window.__STANDALONE?'':'<p>登入 Claude 後，這些設定才會在不同裝置保留。</p>'}`;$('ppav').appendChild(avatar(n,c,PF,48));$('ppn').value=n}
dAdd('click',e=>{if(e.target.closest('#acct')){const p=$('pp'),o=p.style.display==='flex';p.style.display=o?'none':'flex';if(!o)ppUI();return}
 const b=e.target.closest('[data-pp],[data-pc],[data-pe]');if(!b){if(!e.target.closest('#pp'))$('pp').style.display='none';return}
 const d=b.dataset;if(d.pp==='close')$('pp').style.display='none';else if(d.pp==='up')$('pfi').click();else if(d.pp==='clr'){PF.img='';PF.emoji='';applyPF()}else if(d.pc){PF.color=d.pc;applyPF()}else if(d.pe){PF.emoji=d.pe;PF.img='';applyPF()}});
dAdd('change',e=>{if(e.target.id==='ppn'){PF.name=e.target.value.trim().slice(0,20);applyPF()}});
$('pfi').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),s=Math.min(im.width,im.height);c.width=c.height=96;c.getContext('2d').drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,96,96);PF.img=c.toDataURL('image/jpeg',.85);PF.emoji='';URL.revokeObjectURL(im.src);applyPF()};im.onerror=()=>toast('無法讀取圖片');im.src=URL.createObjectURL(f)};
// ---------- layers (undoable)
function lyr(o){return S.layers.find(l=>l.id===o.l)||S.layers[0]}
function ok(o){const l=lyr(o);return l.vis&&!l.lock&&o.t!=='frame'}
function syncLayers(){const L=$('L');S.layers.forEach(l=>{let e=document.getElementById('ly-'+l.id);if(!e){e=document.createElementNS(NS,'g');e.id='ly-'+l.id}e.style.display=l.vis?'':'none';L.appendChild(e)});[...L.children].forEach(e=>{if(e.id!=='ly-__f'&&!S.layers.some(l=>'ly-'+l.id===e.id)){const f=document.getElementById('ly-'+S.layers[0].id);[...e.children].forEach(c=>f.appendChild(c));e.remove()}})}
function layerEl(id){if(id==='__f'){let e=document.getElementById('ly-__f');if(!e){e=document.createElementNS(NS,'g');e.id='ly-__f';$('L').prepend(e)}return e}const l=S.layers.find(x=>x.id===id)||S.layers[0];let e=document.getElementById('ly-'+l.id);if(!e){syncLayers();e=document.getElementById('ly-'+l.id)}return e}
function saveLayers(){syncLayers();layerUI();saveLocal();if(db&&!RO)db.doc(BP+'meta/layers').set({list:S.layers,u:cid}).catch(()=>{})}
function layerUI(){$('lp').innerHTML='<div class="lh"><span>圖層</span>'+(RO?'':'<button class="b sm" data-ly="add" title="新增圖層">'+ic('plus')+'</button>')+'</div>'+[...S.layers].reverse().map(l=>`<div class="lr ${l.id===S.al?'on':''}" data-l="${l.id}"><button class="b sm" data-ly="vis" title="顯示／隱藏">${ic(l.vis?'eye':'eyeoff')}</button><button class="b sm" data-ly="lock" title="鎖定／解鎖">${ic(l.lock?'lock':'unlock')}</button><span class="ln" data-ly="sel" title="點選設為目前圖層，雙擊重新命名">${esc(l.name)}</span>${RO?'':`<button class="b sm" data-ly="up" title="上移">${ic('up')}</button><button class="b sm" data-ly="down" title="下移">${ic('down')}</button><button class="b sm" data-ly="del" title="刪除圖層">${ic('x')}</button>`}</div>`).join('')}
function toggleLP(){const p=$('lp'),o=p.style.display==='flex';p.style.display=o?'none':'flex';$('bl').classList.toggle('on',!o)}
$('bl').onclick=toggleLP;
function layerChange(fn){const before=cl(S.layers),ob=new Map();const touch=o=>{if(!ob.has(o.id))ob.set(o.id,cl(o))};fn(touch);const ch=[['__layers',before,cl(S.layers)]];ob.forEach((b,id)=>{const o=S.objs.get(id);if(o)ch.push([id,b,cl(o)])});commit(ch);saveLayers();S.objs.forEach(paint);ovl();props()}
dAdd('click',e=>{const b=e.target.closest('[data-ly]');if(!b)return;const a=b.dataset.ly,row=b.closest('.lr'),id=row&&row.dataset.l,i=S.layers.findIndex(l=>l.id===id),L=S.layers[i];
 if(RO){if(a==='sel')return;if(L&&(a==='vis')){L.vis=!L.vis;syncLayers();layerUI();S.objs.forEach(paint)}return}
 if(a==='add')layerChange(()=>{const n={id:'l'+rid().slice(0,6),name:'圖層 '+(S.layers.length+1),vis:true,lock:false};S.layers.splice(S.layers.findIndex(l=>l.id===S.al)+1,0,n);S.al=n.id});
 else if(!L)return;
 else if(a==='sel'){S.al=id;layerUI();props()}
 else if(a==='vis'||a==='lock')layerChange(()=>{L[a]=!L[a];S.sel.forEach(x=>{const o=S.objs.get(x);if(o&&!ok(o))S.sel.delete(x)})});
 else if(a==='up'&&i<S.layers.length-1)layerChange(()=>{[S.layers[i],S.layers[i+1]]=[S.layers[i+1],S.layers[i]]});
 else if(a==='down'&&i>0)layerChange(()=>{[S.layers[i],S.layers[i-1]]=[S.layers[i-1],S.layers[i]]});
 else if(a==='del'){if(S.layers.length<2)return toast('至少要保留一個圖層');layerChange(touch=>{const t=S.layers[i?i-1:1];S.objs.forEach(o=>{if((o.l||S.layers[0].id)===id){touch(o);o.l=t.id;put(o)}});S.layers.splice(i,1);if(S.al===id)S.al=t.id})}});
dAdd('dblclick',e=>{if(RO)return;const n=e.target.closest('.ln');if(!n)return;const id=n.closest('.lr').dataset.l,L=S.layers.find(l=>l.id===id);n.innerHTML='<input>';const i=n.firstChild;i.value=L.name;i.focus();i.select();const done=()=>{if(!i.parentNode)return;const v=i.value.trim();if(v&&v!==L.name)layerChange(()=>{L.name=v});else layerUI()};i.onblur=done;i.onkeydown=ev=>{ev.stopPropagation();if(ev.key==='Enter')i.blur();if(ev.key==='Escape'){i.value=L.name;i.blur()}}});
// ---------- AI
const AI={on:true,mode:'a',ids:[],text:'',ac:null};
const MODES={a:['分析','請用繁體中文分析以下內容，依序列出：主旨、關鍵重點、可改進或需注意之處，精簡條列。'],s:['摘要','請用繁體中文將以下內容摘要成三句話以內。'],t:['翻譯／擷取文字','若輸入包含圖片，先擷取圖中的全部文字，再把文字翻譯成英文（原文為英文則翻成繁體中文）；若只有文字則直接翻譯。只輸出結果。'],r:['潤飾','請潤飾以下文字，保持原意與語氣，只輸出改寫後的版本。']};
const d2b=u=>{const[h,b]=u.split(','),m=h.match(/:(.*?);/)[1],bin=atob(b),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:m})};
function aiToggle(v,quiet){AI.on=v===undefined?!AI.on:v;$('bai').classList.toggle('on',AI.on);if(!AI.on){if(AI.ac)AI.ac.abort();$('aip').style.display='none'}if(!quiet)toast(AI.on?'AI 分析已開啟':'AI 分析已關閉');props();savePrefs()}
$('bai').onclick=()=>aiToggle();
function aiHead(){const hasT=AI.ids.some(i=>(S.objs.get(i)||{}).t==='text');$('aip').innerHTML=`<div class="lh"><span>✦ AI 分析</span><span style="display:flex;gap:4px"><button class="b sm" data-ai="cfg" title="AI 設定" aria-label="AI 設定">⚙</button><button class="b sm" data-ai="close">${ic('x')}</button></span></div><div class="chips">${Object.entries(MODES).filter(([k])=>k!=='r'||hasT).map(([k,v])=>`<button class="chip ${k===AI.mode?'on':''}" data-ai="m${k}">${v[0]}</button>`).join('')}</div><div class="res" id="air"></div><div class="row" style="gap:6px">${RO?'':'<button class="btn pri" data-ai="put" style="flex:1">放到畫布</button>'}<button class="btn" data-ai="copy" style="flex:1">複製</button><button class="btn" data-ai="stop">停止</button></div>`}
function aiOpen(){if(!AI.on)return toast('AI 分析目前是關閉的，可點上方 ✦ 開啟');const ids=[...S.sel].filter(i=>{const o=S.objs.get(i);return o&&(o.t==='text'||o.t==='img')});if(!ids.length)return toast('請先選取文字或圖片');AI.ids=ids;if(AI.mode==='r'&&!ids.some(i=>S.objs.get(i).t==='text'))AI.mode='a';$('aip').style.display='flex';aiHead();aiRun()}
function aiSetup(msg){const out=$('air');out.style.whiteSpace='normal';out.style.maxHeight='52vh';out.innerHTML=(msg?`<div class="fine" style="margin:0 0 8px">${msg}</div>`:'')+(window.__aiForm?window.__aiForm():'')}
window.__AISETUP=()=>aiSetup('');window.__AIRERUN=()=>aiRun();
function aiReady(){const c=(window.__AICFG&&window.__AICFG())||{};return !!(c.provider&&(c.provider==='local'||(c.provider==='custom'?c.base:c.key)))}
async function aiRun(){const out0=$('air');out0.style.whiteSpace='';out0.style.maxHeight='';if(!aiReady()){aiSetup('使用 AI 分析前，請先導入你自己的 AI。照下面三個步驟做，儲存後就會立刻開始分析。');return}if(AI.ac)AI.ac.abort();const out=$('air'),os=AI.ids.map(i=>S.objs.get(i)).filter(Boolean),tx=os.filter(o=>o.t==='text').map(o=>o.txt).join('\n---\n'),im=os.filter(o=>o.t==='img');AI.text='';out.textContent='分析中…';
 try{const sm=await claude.use('sample');if(!sm)throw{code:'unavailable'};let images;if(im.length){await loadImgs(im);const lim=await sm.limits();const srcs=im.map(imgSrc).filter(s=>s&&s.startsWith('data:'));if(lim.images&&srcs.length)images=srcs.map(d2b);else toast('目前環境不支援圖片分析，只會分析文字')}
  const ac=AI.ac=new AbortController(),prompt=MODES[AI.mode][1]+(tx?'\n\n文字內容：\n'+tx:'')+(images?`\n\n（另附 ${images.length} 張圖片）`:'');
  const r=await sm(prompt,{images,signal:ac.signal,cache:false,onProgress:p=>{out.textContent=p.text+(p.pct?'… '+p.pct+'%':'')},onText:u=>{AI.text=u.text;out.textContent=u.text}});AI.text=r.text;out.textContent=r.text||'（沒有結果）'}
 catch(e){if(e&&e.name==='AbortError')return;if(e&&e.code==='nolocal'){out.textContent=e.message;return}if(e&&(e.code==='nokey'||e.code==='badkey')){aiSetup(e.code==='nokey'?'請先設定 AI。':'金鑰無效或沒有權限，請重新設定。');return}out.textContent=e&&e.code==='not_granted'?'你尚未同意使用 AI，請再按一次分析並選擇允許。':e&&e.code==='rate_limited'?'使用太頻繁，請稍後再試。':'AI 目前無法使用'+(e&&e.message?'：'+e.message:'')}}
function aiPut(){if(RO||!AI.text)return;const a=AI.ids.map(i=>S.objs.get(i)).filter(Boolean);if(!a.length)return;const x=Math.max(...a.map(o=>o.x+o.w))+50,y=Math.min(...a.map(o=>o.y)),o={id:rid(),t:'text',x,y,w:10,h:30,r:0,txt:AI.text,s:18,c:'ink',op:1,ww:340,fo:.1,fc:null,bw:1,rd:10,z:Date.now()};put(o);commit([[o.id,null,cl(o)]]);toast('已放到畫布')}
dAdd('click',async e=>{const b=e.target.closest('[data-ai]');if(!b)return;const a=b.dataset.ai;
 if(a==='cfg'){const o=$('air');if(o.querySelector('.aif'))aiRun();else aiSetup('');return}if(a==='key'){DASH.gdlg();return}if(a==='close'){if(AI.ac)AI.ac.abort();$('aip').style.display='none'}else if(a==='stop'){if(AI.ac)AI.ac.abort()}else if(a==='put')aiPut();
 else if(a==='copy'){try{await navigator.clipboard.writeText(AI.text);toast('已複製')}catch(x){toast('無法複製，請手動選取文字')}}
 else if(a[0]==='m'){AI.mode=a[1];aiHead();aiRun()}});
