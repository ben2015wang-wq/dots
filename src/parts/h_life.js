// ---------- pages
function pgUI(){$('pgs').innerHTML=PGS.map((p,i)=>`<button class="b pgb${p.id===S.pg?' on':''}" data-pg="${p.id}" title="第 ${i+1} 頁">${i+1}</button>`).join('')+(RO?'':`<button class="b pgb" data-pg="+" title="新增頁面">${ic('plus')}</button>`+(PGS.length>1?`<button class="b pgb" data-pg="-" title="刪除目前頁面">${ic('del')}</button>`:''))}
function gotoPg(id){finishEdit();closeCmt();S.pg=id;S.sel.clear();render();pgUI();props();fit();drawCmts();if(room)drawPeers(room.peers())}
function mkFrame(pg){const t=ITEM.type,sz=t==='doc'?[794,1123]:t==='slide'?[1280,720]:null;if(!sz||S.objs.has('fr-'+pg))return;put({id:'fr-'+pg,t:'frame',x:0,y:0,w:sz[0],h:sz[1],r:0,pg,l:'l1',z:-1e12,op:1})}
function newPage(){const p={id:'p'+rid().slice(0,5),name:'頁面 '+(PGS.length+1)};PGS.push(p);DASH.patch(BID,{pages:PGS});mkFrame(p.id);pgUI();return p}
function addPage(){const p=newPage();gotoPg(p.id)}
function delPage(){if(PGS.length<2||RO)return;const id=S.pg;[...S.objs.values()].forEach(o=>{if((o.pg||PGS[0].id)===id)rm(o.id)});[...CM.values()].filter(c=>c.pg===id).forEach(cmDel);PGS=PGS.filter(p=>p.id!==id);DASH.patch(BID,{pages:PGS});gotoPg(PGS[0].id)}
dAdd('click',e=>{const b=e.target.closest('[data-pg]');if(!b)return;const v=b.dataset.pg;if(v==='+')addPage();else if(v==='-')delPage();else gotoPg(v)});
// ---------- templates
let zc=0;const Z=()=>Date.now()+(zc++);
const tx=(txt,x,y,s,o={})=>Object.assign({id:rid(),t:'text',x,y,w:10,h:s*1.3,r:0,txt,s,c:'ink',op:1,z:Z()},o);
const bx=(x,y,w,h,o={})=>Object.assign({id:rid(),t:'rect',x,y,w,h,r:0,c:'ink',sw:2,fo:0,fc:null,rd:12,op:1,z:Z()},o);
const STK=['#f59e0b','#22c55e','#3b82f6','#ec4899','#8b5cf6','#14b8a6'];
const boardCols=(title,cols)=>{const o=[tx(title,-(cols.length*320-20)/2,-330,40,{b:true})];cols.forEach(([h,col],i)=>{const x=-(cols.length*320-20)/2+i*320;o.push(bx(x,-240,300,560,{c:col,fo:.07,fc:col,sw:1.5}),tx(h,x+20,-220,24,{b:true,c:col}))});return o};
function docBuild(title,secs){const o=[],H=1123,top=70,bot=H-70;let y=top,pi=0;const place=(t,h)=>{if(y+h>bot&&y>top){pi++;y=top}t._p=pi;t.y=y;y+=h;o.push(t)};
 place(tx(title,60,0,38,{b:true,ww:674}),70);secs.forEach(([h,b])=>{place(tx(h,60,0,22,{b:true,ww:674}),42);const t=tx(b,60,0,16,{ww:674,ls:b.includes('\n')?'bullet':''});place(t,layout(t).length*16*1.25+28)});return{objs:o,pages:pi+1}}
function slideBuild(sl){const o=[];sl.forEach(([t,b],i)=>{if(i===0){o.push(bx(0,0,24,720,{fo:1,fc:'#3b82f6',c:'#3b82f6',sw:0,rd:0,_p:0}),tx(t,100,250,72,{b:true,ww:1080,_p:0}),tx(b,100,400,30,{ww:1080,op:.7,_p:0}))}else{o.push(bx(0,0,1280,10,{fo:1,fc:'#3b82f6',c:'#3b82f6',sw:0,rd:0,_p:i}),tx(t,80,70,50,{b:true,ww:1120,_p:i}),tx(b,80,200,30,{ww:1100,ls:'bullet',_p:i}))}});return{objs:o,pages:sl.length}}
const TPLS=[
 {type:'board',id:'bs',name:'腦力激盪',desc:'中央主題加六張便利貼',build:()=>{const o=[tx('腦力激盪',-120,-300,44,{b:true}),bx(-130,-200,260,90,{fo:.15,fc:'#3b82f6',c:'#3b82f6',rd:45,sw:2}),tx('主題',-24,-175,28,{b:true})];STK.forEach((c,i)=>{const x=-360+(i%3)*250,y=-60+Math.floor(i/3)*190;o.push(bx(x,y,230,160,{fo:.22,fc:c,c,sw:1.5,rd:8}),tx('想法 '+(i+1),x+16,y+16,20,{}))});return{objs:o,pages:1}}},
 {type:'board',id:'kb',name:'任務看板',desc:'待辦／進行中／完成三欄',build:()=>({objs:boardCols('任務看板',[['待辦','#ef4444'],['進行中','#f59e0b'],['完成','#22c55e']]),pages:1})},
 {type:'board',id:'rt',name:'團隊回顧',desc:'做得好／可改進／下次嘗試',build:()=>({objs:boardCols('團隊回顧',[['做得好','#22c55e'],['可改進','#f59e0b'],['下次嘗試','#3b82f6']]),pages:1})},
 {type:'doc',id:'mt',name:'會議記錄',desc:'議程、討論、決議與待辦',build:()=>docBuild('會議記錄',[['日期與參與者','日期：\n參與者：\n記錄人：'],['議程','1. \n2. \n3. '],['討論重點','在這裡記錄討論內容。'],['決議','在這裡寫下做出的決定。'],['待辦事項','負責人 ／ 事項 ／ 期限\n\n\n']])},
 {type:'doc',id:'pr',name:'專案提案',desc:'背景、目標、方案、時程與風險',build:()=>docBuild('專案提案',[['背景','說明為什麼現在要做這件事。'],['目標','希望達成的具體成果與衡量方式。'],['方案','建議的做法，以及考慮過的替代方案。'],['時程與資源','里程碑、所需人力與預算。'],['風險與因應','可能出現的問題與預備方案。']])},
 {type:'doc',id:'wk',name:'每週報告',desc:'完成、進行中、問題與下週計畫',build:()=>docBuild('每週報告',[['本週完成','項目一\n項目二'],['進行中','項目一\n項目二'],['遇到的問題','需要協助或決策的事項。'],['下週計畫','項目一\n項目二']])},
 {type:'slide',id:'pt',name:'產品簡報',desc:'封面、問題、解法、市場、團隊、Q&A',build:()=>slideBuild([['產品名稱','一句話說明你的產品'],['我們要解決的問題','目標使用者的痛點\n現有做法的不足\n問題有多普遍'],['我們的解法','核心功能\n與眾不同之處\n使用情境'],['市場機會','目標客群\n市場規模\n成長趨勢'],['團隊','成員與背景\n過去的成就'],['謝謝，歡迎提問','聯絡方式']])},
 {type:'slide',id:'rp',name:'成果報告',desc:'摘要、數據、下一步',build:()=>slideBuild([['成果報告','期間與報告人'],['摘要','三個最重要的結論\n對目標的達成情況'],['關鍵數據','指標一\n指標二\n指標三'],['下一步','近期行動\n需要的支援']])}];
const templates=()=>TPLS.map(({type,id,name,desc})=>({type,id,name,desc}));
function applyTpl(id){const t=TPLS.find(x=>x.id===id&&x.type===ITEM.type);if(!t)return;const r=t.build();while(PGS.length<r.pages)newPage();PGS.forEach(p=>mkFrame(p.id));
 r.objs.forEach(o=>{if(o._p!=null){o.pg=PGS[o._p].id;delete o._p}put(o);if(ITEM.type==='doc'&&o.t==='text')paginate(o)});
 DASH.patch(BID,{tpl:null});pgUI();render();fit()}
// ---------- legacy migration (old dashboard: strokes / text / slides)
const lgc=c=>{c=(c||'').toLowerCase();return['#f5f5f4','#fafaf9','#ffffff','#fff','#1c1917','#000','#000000','#e7e5e4','#f4f4f5'].includes(c)?'ink':(c||'ink')};
function migrate(d){const t=ITEM.type;let n=0;
 if(t==='board'&&Array.isArray(d.strokes)){d.strokes.forEach(k=>{let p=Array.isArray(k.p)?k.p:[];if(!p.length)return;if(p.length>400){const st=Math.ceil(p.length/400);p=p.filter((_,i)=>i%st===0||i===p.length-1)}const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]),x=Math.min(...xs),y=Math.min(...ys);put({id:rid(),t:'pen',x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y,r:0,pts:p.map(q=>[+(q[0]-x).toFixed(1),+(q[1]-y).toFixed(1)]),c:lgc(k.c),sw:k.w||3,op:1,z:Z()});n++})}
 else if(t==='doc'&&d.text){const o=tx(String(d.text),60,70,17,{ww:674,pg:PGS[0].id});put(o);paginate(o);n=1}
 else if(t==='slide'&&Array.isArray(d.s)&&d.s.length){while(PGS.length<d.s.length)newPage();PGS.forEach(p=>mkFrame(p.id));d.s.forEach((s,i)=>{const pg=PGS[i].id;put(tx(String(s.t||''),80,70,50,{b:true,ww:1120,pg}));put(tx(String(s.b||''),80,200,30,{ww:1100,pg}));n++})}
 if(n){DASH.patch(BID,{mig:1,data:null});toast('已把舊版內容轉換到新編輯器')}}
// ---------- board lifecycle
function seedBoard(){PGS.forEach(p=>mkFrame(p.id));
 if(!RO&&![...S.objs.values()].some(o=>o.t!=='frame')){
  if(ITEM.tpl)applyTpl(ITEM.tpl);
  else if(ITEM.data&&!ITEM.mig)migrate(ITEM.data);
  else if(ITEM.type==='image'&&!ITEM.init){ITEM.init=1;DASH.patch(BID,{init:1});const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=640;c.height=400;c.getContext('2d').drawImage(im,0,0,640,400);put({id:'seedimg',t:'img',x:-320,y:-200,w:640,h:400,r:0,src:c.toDataURL('image/jpeg',.82),iid:rid(),op:1,bw:0,rd:12,z:Z()});fit()};im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(DASH.art(BID))}}
 pgUI();render();fit()}
let fcTimer=0;
function subscribe(){unsubs.forEach(f=>{try{f()}catch(e){}});unsubs=[];if(!db)return;firstSnap=true;clearTimeout(fcTimer);syncUI();const cln=d=>JSON.parse(JSON.stringify(d));
 unsubs.push(db.doc(BP+'meta/layers').onSnapshot(s=>{if(!s.exists)return;const d=cln(s.data());if(d.u===cid||!Array.isArray(d.list)||!d.list.length)return;S.layers=d.list;if(!S.layers.some(l=>l.id===S.al))S.al=S.layers[0].id;syncLayers();S.objs.forEach(paint);layerUI();props()},()=>{}));
 unsubs.push(db.collection(BP+'vers').onSnapshot(s=>{VERS=[];s.docs.forEach(d=>{const v=cln(d.data());v.id=d.id;VERS.push(v)});if($('vp').style.display==='flex')verUI()},()=>{}));
 unsubs.push(db.collection(BP+'cmt').onSnapshot(s=>{s.docChanges().forEach(c=>{const id=c.doc.id;if(c.type==='removed'){const x=CM.get(id);if(x&&!x.pend){CM.delete(id);if(cmOpen===id)closeCmt()}}else{const d=cln(c.doc.data());d.id=id;if(!(CM.get(id)||{}).pend||true)CM.set(id,d)}});drawCmts();if(cmOpen&&CM.has(cmOpen)&&!CM.get(cmOpen).pend&&document.activeElement.id!=='cmt')cmPop(cmOpen)},()=>{}));
 unsubs.push(db.collection(BP+'objs').onSnapshot(s=>{
  s.docChanges().forEach(c=>{const id=c.doc.id;if(c.type==='removed'){if(!busy.has(id)&&!pend.has(id)){S.objs.delete(id);unpaint(id);S.sel.delete(id)}}else if(!busy.has(id)&&!pend.has(id)){const d=cln(c.doc.data());if(d&&d.t){if(d.u===cid&&S.objs.has(id))return;d.id=id;const old=S.objs.get(id);if(d.t==='img'&&old&&old.src&&old.iid===d.iid)d.src=old.src;else if(d.t==='img'&&d.iid&&IMG.has(d.iid))d.src=IMG.get(d.iid);S.objs.set(id,d);paint(d)}}});
  ovl();props();
  if(firstSnap){const empty=!s.docs||!s.docs.length;if(s.metadata&&s.metadata.fromCache&&empty){if(!fcTimer)fcTimer=setTimeout(()=>{if(firstSnap){firstSnap=false;seedBoard()}},2500);return}clearTimeout(fcTimer);firstSnap=false;seedBoard()}},e=>{db=null;syncUI();toast('同步中斷，改為本機模式');if(firstSnap){firstSnap=false;loadLocal();seedBoard()}}))}
let verTimer=0;
function open(it){ITEM=it;BID=it.id;BP='b/'+it.id+'/';ROLE=it.role||'edit';RO=ROLE!=='edit';PGS=it.pages&&it.pages.length?it.pages.map(p=>({...p})):[{id:'p1',name:'頁面 1'}];ACT.on=true;PRES=false;
 const D=$('dots');D.classList.add('on');D.classList.toggle('ro',RO);D.classList.remove('pres');
 S.objs.clear();els.forEach(g=>g.remove());els.clear();S.sel.clear();hist.length=0;redo.length=0;pend.clear();infl.clear();fails.clear();CM.clear();VERS=[];dirty=false;lastVerHash='';cmOpen=null;lastErr=null;ta._o=null;ta.hidden=true;
 S.layers=[{id:'l1',name:'圖層 1',vis:true,lock:false}];S.al='l1';S.pg=PGS[0].id;S.d.s={doc:17,slide:36}[it.type]||28;S.d.ww=it.type==='doc'?674:it.type==='slide'?1000:0;
 ['help','exm','vp','lp','aip','pp','cpop'].forEach(i=>$(i).style.display='none');$('bl').classList.remove('on');
 syncLayers();layerUI();pgUI();$('ititle').value=it.name;$('ititle').readOnly=RO;theme();setTool('select');applyV();ub();props();drawCmts();
 $('brand').dataset.role=RO?(ROLE==='comment'?'可留言':'唯讀'):'';
 if(db)subscribe();else{loadLocal();seedBoard()}
 syncUI();clearInterval(verTimer);verTimer=setInterval(()=>{if(ACT.on&&db&&!RO&&dirty)saveVersion('',true)},600000)}
function snap(){return new Promise(res=>{try{if(RO)return res(null);const a=pgObjs().filter(o=>o.t!=='frame');if(!a.length||S.pg!==PGS[0].id)return res(null);const fr=S.objs.get('fr-'+S.pg);let x1,y1,x2,y2;if(fr){x1=fr.x;y1=fr.y;x2=fr.x+fr.w;y2=fr.y+fr.h}else{const b=bounds(a);x1=b.x1;y1=b.y1;x2=b.x2;y2=b.y2}let w=x2-x1+(fr?0:60),h=y2-y1+(fr?0:60);const cx=(x1+x2)/2,cy=(y1+y2)/2;if(w/h>1.6)h=w/1.6;else w=h*1.6;
 const cs=getComputedStyle($('dots')),inner=$('L').innerHTML.replace(/var\(--ink\)/g,cs.getPropertyValue('--ink').trim()).replace(/var\(--page\)/g,cs.getPropertyValue('--page').trim()||'#fff'),bg=cs.getPropertyValue('--bg').trim();
 const s=`<svg xmlns="${NS}" width="480" height="300" viewBox="${cx-w/2} ${cy-h/2} ${w} ${h}"><rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="${bg}"/>${inner}</svg>`,im=new Image();
 im.onload=()=>{const c=document.createElement('canvas');c.width=480;c.height=300;c.getContext('2d').drawImage(im,0,0);const u=c.toDataURL('image/jpeg',.72);res(u.length<200000?u:null)};im.onerror=()=>res(null);im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s)}catch(e){res(null)}})}
function indexText(){const t=[...S.objs.values()].filter(o=>o.t==='text'&&o.txt).map(o=>o.txt).concat([...CM.values()].flatMap(c=>(c.th||[]).map(m=>m.t))).join(' ').replace(/\s+/g,' ').trim();return t.slice(0,2500)}
async function close(){if(!ACT.on)return;endPres();finishEdit();closeCmt();clearInterval(verTimer);const wasDirty=dirty&&!RO,u=await snap();
 if(!RO){if(u)DASH.thumb(BID,u);DASH.patch(BID,{ix:indexText()})}
 await Promise.race([flushNow(),new Promise(r=>setTimeout(r,5000))]);
 if(wasDirty&&db)await Promise.race([saveVersion('',true),new Promise(r=>setTimeout(r,6000))]);
 unsubs.forEach(f=>{try{f()}catch(e){}});unsubs=[];ACT.on=false;const D=$('dots');D.classList.remove('on','ro');['aip','pp','lp','vp','exm','cpop'].forEach(i=>$(i).style.display='none');peersEl.forEach(e=>e.remove());peersEl.clear();if(room)room.presence({b:null,x:null}).catch(()=>{})}
const canExit=()=>ACT.on&&!PRES&&!S.sel.size&&ta.hidden&&$('help').style.display!=='grid'&&['cpop','vp','lp','exm','aip','pp'].every(i=>$(i).style.display!=='flex');
// ---------- boot
R.dataset.wb=R.dataset.wb||'dark';
theme();setTool('select');applyV();ub();syncLayers();layerUI();pgUI();
$('back').innerHTML=ic('left');$('back').onclick=()=>DASH.exit();
$('ititle').oninput=e=>{if(!RO)DASH.patch(BID,{name:e.target.value||'未命名'})};
$('bsh').onclick=()=>DASH.share(BID);
$('syncbar').onclick=e=>{if(e.target.closest('button'))$('syncbar').hidden=true};
(async()=>{try{usr=await claude.use('user');if(usr){const v=await usr.me();uid=v.id;if(v.id){if(v.name)me=v.name;if(v.color&&/^#[0-9a-f]{3,8}$/i.test(v.color))myc=v.color}acct(v)}}catch(e){}
 if(!uid){me='訪客 '+Math.floor(Math.random()*900+100);myc=['#ef4444','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899'][Math.floor(Math.random()*6)];acct(null)}
 try{db=await claude.use('db')}catch(e){}
 if(db&&uid){try{const ps=await db.doc('data/users/'+uid+'/prefs').get();if(ps.exists){const p=JSON.parse(JSON.stringify(ps.data()));if(typeof p.ai==='boolean')aiToggle(p.ai,1);if(Array.isArray(p.recent))S.recent=p.recent.slice(0,4);if(p.profile&&typeof p.profile==='object'){['name','color','emoji','img'].forEach(k=>{if(typeof p.profile[k]==='string')PF[k]=p.profile[k]});me=PF.name||ACC.name;myc=PF.color||ACC.color;acct()}props()}}catch(e){}}prefsOK=true;
 try{room=await claude.use('room');if(room){room.onPeers(c=>drawPeers(c.peers));drawPeers(room.peers())}}catch(e){}
 $('bsh').style.display=window.__STANDALONE?'none':'';try{const sm=await claude.use('sample');if(!sm){AI.on=false;$('bai').style.display='none'}}catch(e){}
 if(ACT.on&&db&&!unsubs.length)subscribe();syncUI()})();
addEventListener('dots-storage-error',()=>toast('瀏覽器儲存空間已滿或無法寫入，請匯出備份並清出空間'));
return{open,close,canExit,theme:()=>theme(),templates};
})();
