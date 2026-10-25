// ---------- data + sync (per-document write queue with retry) + local backup + versions
const pend=new Map(),infl=new Set(),fails=new Map();let ft=0,lastErr=null;
const CONNT=['text','rect','ellipse','img'];
function connect(c){const A=S.objs.get(c.ca),B=S.objs.get(c.cb);if(!A||!B)return false;
 const ac={x:A.x+A.w/2,y:A.y+A.h/2},bc={x:B.x+B.w/2,y:B.y+B.h/2},dx=bc.x-ac.x,dy=bc.y-ac.y,hz=(Math.abs(dx)-(A.w+B.w)/2)>=(Math.abs(dy)-(A.h+B.h)/2);
 let a,b;if(hz){a=[dx>=0?A.x+A.w:A.x,ac.y];b=[dx>=0?B.x:B.x+B.w,bc.y]}else{a=[ac.x,dy>=0?A.y+A.h:A.y];b=[bc.x,dy>=0?B.y:B.y+B.h]}
 c.cd=hz?'h':'v';c.cv=1;c.x=Math.min(a[0],b[0]);c.y=Math.min(a[1],b[1]);c.w=Math.abs(a[0]-b[0]);c.h=Math.abs(a[1]-b[1]);c.r=0;c.pts=[[a[0]-c.x,a[1]-c.y],[b[0]-c.x,b[1]-c.y]];return true}
function syncConns(o){let any=false;S.objs.forEach(c=>{if(c.ca&&(c.ca===o.id||c.cb===o.id)&&connect(c)){any=true;paint(c);dirty=true;if(db)c.u=cid;pend.set(c.id,c)}});if(any)queue()}
function put(o){if(RO)return;if(CONNT.includes(o.t))syncConns(o);if(!o.l)o.l=S.al;if(!o.pg)o.pg=S.pg;if(!o.by&&uid)o.by=uid;if(!o.bn)o.bn=me;S.objs.set(o.id,o);paint(o);ovl();dirty=true;if(db)o.u=cid;pend.set(o.id,o);queue()}
function rm(id){if(RO)return;S.objs.delete(id);unpaint(id);S.sel.delete(id);dirty=true;pend.set(id,null);queue();ovl()}
function queue(){if(db&&!ft)ft=setTimeout(flush,100);saveLocal();syncUI()}
function flush(){ft=0;if(!db)return;for(const[id,o]of[...pend]){if(infl.has(id))continue;pend.delete(id);send(id,o)}if(pend.size&&!ft)ft=setTimeout(flush,200)}
async function send(id,o){infl.add(id);try{const r=db.doc(BP+'objs/'+id);if(o===null)await r.delete();else if(o.t==='img'&&o.src){await upImg(o);const{src,...rest}=o;await r.set(rest)}else{const{src,...rest}=o;await r.set(o.t==='img'?rest:o)}fails.delete(id)}catch(e){lastErr=e;fails.set(id,(fails.get(id)||0)+1);if(!pend.has(id))pend.set(id,o);if(e&&e.code==='quota_exceeded')toast('資料庫已滿，無法儲存更多內容')}infl.delete(id);syncUI();if(pend.size&&!ft)ft=setTimeout(flush,fails.size?4000:150)}
function flushNow(){return new Promise(res=>{let n=0;const t=setInterval(()=>{flush();n++;if(!pend.size&&!infl.size||n>60||!db){clearInterval(t);res()}},100)})}
// sync status banner
function syncUI(){if(!ACT.on)return;let m='';if(RO)m='';else if(!db)m=uid?'目前無法連線到資料庫，變更只保存在這個瀏覽器。':'尚未登入 Claude，變更只保存在這個瀏覽器，不會同步給其他人。';else if(fails.size)m=`有 ${fails.size} 筆變更尚未同步${lastErr&&lastErr.code?'（'+lastErr.code+'）':''}，會自動重試。`;
 const b=$('syncbar');b.hidden=!m;if(m)$('syncmsg').textContent=m;$('stat').innerHTML=window.__STANDALONE?`<span class="dot"></span>${RO?'唯讀 · ':''}儲存在此瀏覽器${peerN>1?' · '+peerN+' 個分頁':''}`:db&&!fails.size?`<span class="dot"></span>${RO?'唯讀 · ':''}即時協作 · ${peerN} 人在線`:`<span class="dot off"></span>${RO?'唯讀':db?'同步中…':'本機模式'}`}
let peerN=1;
// local backup
function saveLocal(){if(!ACT.on||RO||!BID)return;clearTimeout(saveLocal.h);saveLocal.h=setTimeout(()=>{const pack=strip=>JSON.stringify({v:1,ts:Date.now(),objs:[...S.objs.values()].map(o=>strip&&o.t==='img'&&o.iid?(({src,...r})=>r)(o):o),layers:S.layers,pages:PGS,cm:[...CM.values()].filter(c=>!c.pend)});try{localStorage.setItem('dots-local-'+BID,pack(!!db))}catch(e){try{localStorage.setItem('dots-local-'+BID,pack(true))}catch(e2){if(!saveLocal.w){saveLocal.w=1;toast('瀏覽器的本機備份空間不足，建議匯出備份檔')}}}},900)}
function readLocal(){try{const j=JSON.parse(localStorage.getItem('dots-local-'+BID));return j&&Array.isArray(j.objs)?j:null}catch(e){return null}}
function loadLocal(){const j=readLocal();if(!j)return false;j.objs.forEach(o=>{S.objs.set(o.id,o)});if(Array.isArray(j.layers)&&j.layers.length)S.layers=j.layers;if(Array.isArray(j.pages)&&j.pages.length)PGS=j.pages;(j.cm||[]).forEach(c=>CM.set(c.id,c));syncLayers();return true}
// history
function commit(ch){ch=ch.filter(c=>JSON.stringify(c[1])!==JSON.stringify(c[2]));if(!ch.length)return;hist.push(ch);if(hist.length>100)hist.shift();redo.length=0;ub()}
function apply(ch,dir){let lay=false;ch.forEach(([id,b,a])=>{const v=dir?a:b;if(id==='__layers'){S.layers=cl(v);if(!S.layers.some(l=>l.id===S.al))S.al=S.layers[0].id;lay=true;return}if(v)put(cl(v));else rm(id)});if(lay){saveLayers()}S.objs.forEach(paint);props();ub();ovl()}
function undo(){const c=hist.pop();if(c){redo.push(c);apply(c,0)}}function rdo(){const c=redo.pop();if(c){hist.push(c);apply(c,1)}}
function ub(){$('bu').disabled=!hist.length;$('br').disabled=!redo.length}
$('bu').onclick=undo;$('br').onclick=rdo;
let sel0=null;function chg(p){const ids=[...S.sel];if(!ids.length||RO)return;if(!sel0)sel0=ids.map(i=>cl(S.objs.get(i)));ids.forEach(i=>{const o=S.objs.get(i);if(!o)return;Object.assign(o,typeof p==='function'?p(o):p);put(o)});props.skip=1;clearTimeout(chg.h);chg.h=setTimeout(()=>{const extra=[];sel0.forEach(b=>{const o=S.objs.get(b.id);if(o&&o.t==='text'&&('ww' in b||o.ww)){paginate(o).forEach(n=>extra.push([n.id,null,cl(n)]))}});commit(sel0.map(b=>[b.id,b,cl(S.objs.get(b.id))]).concat(extra));sel0=null},400)}
function act(a){const ids=[...S.sel].map(i=>S.objs.get(i)).filter(Boolean);if(RO)return;
 if(a==='ai')return aiOpen();if(a==='fcauto'){S.d.fc=null;chg({fc:null});props()}
 if(a==='del'){commit(ids.map(o=>[o.id,cl(o),null]));ids.forEach(o=>rm(o.id));props()}
 if(a==='dup'){const n=ids.map(o=>{const c=cl(o);c.id=rid();c.x+=24;c.y+=24;c.z=Date.now();if(c.t==='img'&&!c.src)c.src=imgSrc(o);put(c);return c});commit(n.map(c=>[c.id,null,cl(c)]));S.sel=new Set(n.map(c=>c.id));props()}
 if(a==='front'||a==='back'){const zs=[...S.objs.values()].map(o=>o.z||0),b=ids.map(cl);ids.forEach((o,i)=>{o.z=a==='front'?Math.max(...zs)+1+i:Math.min(...zs)-1-i;put(o)});commit(ids.map((o,i)=>[o.id,b[i],cl(o)]))}}
// ---------- version history (snapshots stored in chunks under 256 KiB)
let VERS=[],lastVerHash='';
const hashStr=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return h.toString(36)+s.length};
const chunk=arr=>{const parts=[];let cur=[],sz=0;arr.forEach(o=>{const n=JSON.stringify(o).length;if(sz+n>170000&&cur.length){parts.push(cur);cur=[];sz=0}cur.push(o);sz+=n});if(cur.length)parts.push(cur);return parts};
async function saveVersion(label,auto,force){if(!db||RO||!BID)return null;const objs=[...S.objs.values()].filter(o=>!pend.has(o.id)||pend.get(o.id)!==null);
 for(const o of objs){if(o.t==='img'&&o.src)await upImg(o)}
 const clean=objs.map(o=>{const{u,...r}=o;if(r.t==='img')delete r.src;return r}),hs=hashStr(JSON.stringify(clean)+JSON.stringify(S.layers)+JSON.stringify(PGS));
 if(!force&&hs===lastVerHash)return null;
 const vid='v'+Date.now().toString(36)+rid().slice(0,3),parts=chunk(clean);try{await flushNow();for(let i=0;i<parts.length;i++)await db.doc(BP+'vparts/'+vid+'_'+i).set({objs:parts[i]});
  await db.doc(BP+'vers/'+vid).set({ts:Date.now(),by:uid||null,bn:me,label:label||'',auto:!!auto,n:clean.length,np:PGS.length,parts:parts.length,h:hs,layers:S.layers,pages:PGS});lastVerHash=hs;dirty=false;pruneVers();return vid}catch(e){toast('版本儲存失敗'+(e&&e.code?'（'+e.code+'）':''));return null}}
async function pruneVers(){const list=[...VERS].sort((a,b)=>b.ts-a.ts);for(const v of list.slice(15)){try{for(let i=0;i<v.parts;i++)await db.doc(BP+'vparts/'+v.id+'_'+i).delete();await db.doc(BP+'vers/'+v.id).delete()}catch(e){}}}
async function restoreVersion(v){if(RO||!db)return;toast('還原中…');await saveVersion('還原前自動備份',true,true);let objs=[];try{for(let i=0;i<v.parts;i++){const s=await db.doc(BP+'vparts/'+v.id+'_'+i).get();if(s.exists)objs=objs.concat(JSON.parse(JSON.stringify(s.data().objs)))}}catch(e){return toast('讀取版本失敗')}
 finishEdit();const tgt=new Map(objs.map(o=>[o.id,o]));[...S.objs.keys()].forEach(id=>{if(!tgt.has(id))rm(id)});if(Array.isArray(v.pages)&&v.pages.length){PGS=v.pages.map(p=>({...p}));DASH.patch(BID,{pages:PGS})}if(Array.isArray(v.layers)&&v.layers.length){S.layers=JSON.parse(JSON.stringify(v.layers));if(!S.layers.some(l=>l.id===S.al))S.al=S.layers[0].id;saveLayers()}
 objs.forEach(o=>{const old=S.objs.get(o.id);if(old&&old.src&&old.iid===o.iid)o.src=old.src;put(o)});if(!PGS.some(p=>p.id===S.pg))S.pg=PGS[0].id;hist.length=0;redo.length=0;ub();S.sel.clear();render();pgUI();props();fit();toast('已還原到「'+new Date(v.ts).toLocaleString('zh-TW',{hour12:false})+'」的版本')}
function verUI(){const p=$('vp'),loc=readLocal();let h=`<div class="lh"><span>版本紀錄</span><button class="b sm" data-v="close">${ic('x')}</button></div>`;
 if(!db)h+='<div class="note">需要登入並連上資料庫，才會自動保存版本。目前只有這個瀏覽器的本機備份。</div>';else if(!RO)h+='<button class="btn pri" data-v="save">儲存目前版本</button>';
 h+=`<div class="vl">${[...VERS].sort((a,b)=>b.ts-a.ts).map(v=>`<div class="vr"><div><b>${new Date(v.ts).toLocaleString('zh-TW',{hour12:false,month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</b>${v.label?` · ${esc(v.label)}`:v.auto?' · 自動':''}<div class="mu2">${esc(v.bn||'訪客')} · ${v.n} 個物件 · ${v.np} 頁</div></div>${RO?'':`<button class="btn" data-v="res" data-id="${v.id}">還原</button>`}</div>`).join('')||'<div class="note">還沒有版本。離開編輯器時會自動儲存。</div>'}</div>`;
 if(loc&&!RO)h+=`<div class="vr"><div><b>本機備份</b><div class="mu2">${new Date(loc.ts).toLocaleString('zh-TW',{hour12:false})} · ${loc.objs.length} 個物件</div></div><button class="btn" data-v="loc">還原</button></div>`;
 p.innerHTML=h}
function toggleVP(){const p=$('vp'),o=p.style.display==='flex';p.style.display=o?'none':'flex';if(!o)verUI()}
$('bv').onclick=toggleVP;
dAdd('click',async e=>{const b=e.target.closest('[data-v]');if(!b)return;const a=b.dataset.v;if(a==='close')$('vp').style.display='none';
 else if(a==='save'){b.textContent='儲存中…';const id=await saveVersion('手動儲存',false,true);toast(id?'已儲存版本':'版本沒有變更或儲存失敗');verUI()}
 else if(a==='res'){if(b.dataset.arm!=='1'){b.dataset.arm='1';b.textContent='再按一次確認';setTimeout(()=>{if(b.isConnected){b.dataset.arm='';b.textContent='還原'}},3000);return}const v=VERS.find(x=>x.id===b.dataset.id);if(v){await restoreVersion(v);verUI()}}
 else if(a==='loc'){if(b.dataset.arm!=='1'){b.dataset.arm='1';b.textContent='再按一次確認';setTimeout(()=>{if(b.isConnected){b.dataset.arm='';b.textContent='還原'}},3000);return}importBoard(readLocal(),true)}});
