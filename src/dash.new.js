const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const P={help:'M12 3a9 9 0 100 18 9 9 0 000-18zM9.5 9.5a2.5 2.5 0 114 2c-.8.6-1.5 1-1.5 2M12 17h.01',sun:'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',moon:'M20 14A8 8 0 0110 4a8 8 0 1010 10z',back:'M15 6l-6 6 6 6',minus:'M5 12h14',undo:'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',all:'M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z',clock:'M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z',star:'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',trash:'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',folder:'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z',plus:'M12 5v14M5 12h14',search:'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',dots:'M5 12h.01M12 12h.01M19 12h.01',grid:'M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z',list:'M4 6h16M4 12h16M4 18h16',x:'M6 6l12 12M18 6L6 18',chev:'M9 6l6 6-6 6',share:'M4 12v7h16v-7M12 3v12M8 7l4-4 4 4',lock:'M6 11h12v9H6zM8 11V8a4 4 0 018 0v3'};
const ic=n=>`<svg class="i" viewBox="0 0 24 24"><path d="${P[n]}"/></svg>`;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9),D=864e5,H=36e5,T={board:'白板',doc:'文件',slide:'簡報',image:'圖片'};
const FCOL=['#ef4444','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#a8a29e'],cln=x=>JSON.parse(JSON.stringify(x));
const R=document.documentElement,THUMBS={},cid=uid();let ddb=null,UID=null,UDB=null,usrN=null,UOWN=false;try{const t=localStorage.getItem('wbtheme2');if(t)R.dataset.wb=t}catch(e){}
// ---------- state: one document per item / folder (no more whole-index overwrite)
const st={items:[],folders:[]},by=id=>st.items.find(i=>i.id===id),fby=id=>st.folders.find(f=>f.id===id);
const CORE=['name','type','folder','star','trash','ts','pages','owner','acl','ord','seed'];
function seedData(){const n=Date.now(),r=(k,name,type,folder,star,ago)=>({id:'s'+k,name,type,folder,star,trash:false,ts:n-ago,seed:(k*137)%997});
 return{folders:[{id:'fs1',name:'專案 A',parent:null,color:FCOL[3],ord:1},{id:'fs2',name:'設計探索',parent:null,color:FCOL[4],ord:2},{id:'fs3',name:'封存',parent:null,color:FCOL[7],ord:3}],items:[
 r(1,'產品路線圖','board','fs1',1,.4*H),r(2,'品牌視覺探索','board','fs2',1,3*H),r(3,'使用者訪談紀錄','doc','fs1',0,7*H),r(4,'第四季營運簡報','slide','fs1',0,30*H),r(5,'登陸頁線框','board','fs2',0,2*D),r(6,'行銷活動腦力激盪','board',null,0,3*D),r(7,'設計系統規範','doc','fs2',1,5*D),r(8,'會議白板 10/21','board',null,0,6*D),r(9,'專案時程','board','fs1',0,9*D),r(10,'插畫素材 01','image','fs2',0,12*D),r(11,'競品分析','slide',null,0,16*D),r(12,'頭像草稿','image','fs2',0,21*D),r(13,'年度回顧','slide','fs3',0,40*D),r(14,'App 流程圖','board','fs3',0,66*D)]}}
let REC={};try{REC=JSON.parse(localStorage.getItem('dots-rec'))||{}}catch(e){}
function loadLocalState(){try{const j=JSON.parse(localStorage.getItem('dots-dash2'));if(j&&Array.isArray(j.items)&&Array.isArray(j.folders)){st.items=j.items;st.folders=j.folders;return true}}catch(e){}
 try{const j=JSON.parse(localStorage.getItem('dots-dash'));if(j&&Array.isArray(j.items)&&Array.isArray(j.folders)){st.items=j.items;st.folders=j.folders.map((f,i)=>({parent:null,color:FCOL[7],ord:i+1,...f}));return true}}catch(e){}return false}
function saveLocalState(){clearTimeout(saveLocalState.h);saveLocalState.h=setTimeout(()=>{try{localStorage.setItem('dots-dash2',JSON.stringify(st))}catch(e){try{localStorage.setItem('dots-dash2',JSON.stringify({items:st.items.map(({data,...r})=>r),folders:st.folders}))}catch(e2){}}},300)}
// write queue: merges fields per doc, one write in flight per doc, retries
const WQ=new Map(),WF=new Set();let wt=0,wfail=0;
function wq(path,fields,opt={}){const q=WQ.get(path)||{f:{}};if(opt.del){q.del=true;q.f={}}else{q.del=false;Object.assign(q.f,fields);if(opt.full)q.full=cln(opt.full)}WQ.set(path,q);if(ddb&&!wt)wt=setTimeout(wflush,250);syncState()}
function wflush(){wt=0;if(!ddb)return;for(const[p,q]of[...WQ]){if(WF.has(p))continue;WQ.delete(p);wsend(p,q)}if(WQ.size&&!wt)wt=setTimeout(wflush,300)}
async function wsend(p,q){WF.add(p);try{const r=ddb.doc(p);if(q.del)await r.delete();else{try{await r.update(q.f)}catch(e){if(q.full)await r.set(q.full);else throw e}}wfail=0}catch(e){wfail++;if(!WQ.has(p))WQ.set(p,q)}WF.delete(p);syncState();if(WQ.size&&!wt)wt=setTimeout(wflush,wfail?4000:300)}
function syncState(){const e=$('#syncst');if(!e)return;const n=WQ.size+WF.size;const t=window.__STANDALONE?'儲存在此瀏覽器':!ddb?(UID?'本機模式（無法連線）':'本機模式（未登入）'):n?`同步中…（${n}）`:'已同步到雲端';e.textContent=t;const sp=$('#gacc .t span');if(sp&&!window.__STANDALONE)sp.textContent=(window.__FB?'Google 帳號 · ':UID?'Claude 帳號 · ':'')+t}
const itemFields=o=>{const f={};CORE.forEach(k=>{if(o[k]!==undefined)f[k]=o[k]});return f};
function saveItem(o,extra){wq('dash/i_'+o.id,Object.assign(itemFields(o),extra||{}),{full:o});saveLocalState()}
function saveFolder(f){wq('dash/f_'+f.id,{name:f.name,parent:f.parent||null,color:f.color,ord:f.ord,owner:f.owner||null},{full:f});saveLocalState()}
function delItem(id){st.items=st.items.filter(i=>i.id!==id);wq('dash/i_'+id,null,{del:true});wq('thumbs/'+id,null,{del:true});delete THUMBS[id];saveLocalState();purgeBoard(id)}
async function purgeBoard(id){if(!ddb)return;for(const c of['objs','imgs','vers','vparts','cmt']){try{const s=await ddb.collection('b/'+id+'/'+c).get();for(const d of s.docs){try{await ddb.doc('b/'+id+'/'+c+'/'+d.id).delete()}catch(e){}}}catch(e){}}try{await ddb.doc('b/'+id+'/meta/layers').delete()}catch(e){}}
async function cloneBoard(src,dst){if(!ddb)return;for(const c of['objs','imgs','cmt']){try{const s=await ddb.collection('b/'+src+'/'+c).get();for(const d of s.docs){try{await ddb.doc('b/'+dst+'/'+c+'/'+d.id).set(cln(d.data()))}catch(e){}}}catch(e){}}try{const l=await ddb.doc('b/'+src+'/meta/layers').get();if(l.exists)await ddb.doc('b/'+dst+'/meta/layers').set(cln(l.data()))}catch(e){}}
// incoming docs
const SEEN=new Set();
function applyDoc(id,d,removed){if(!removed)SEEN.add(id);
 if(id.startsWith('i_')){const k=id.slice(2);if(removed){st.items=st.items.filter(i=>i.id!==k);return}if(WQ.has(id)||WF.has(id)){const o=by(k);if(o)return}d.id=k;const o=by(k);if(o)Object.assign(o,d);else st.items.push(d)}
 else if(id.startsWith('f_')){const k=id.slice(2);if(removed){st.folders=st.folders.filter(f=>f.id!==k);return}if(WQ.has(id)||WF.has(id))return;if(PERS()&&d.owner!==UID)return;d.id=k;const o=fby(k);if(o)Object.assign(o,d);else st.folders.push(d)}}
let firstDash=true,dashTimer=0,legacy=null,haveMarkers={};
function afterFirst(){firstDash=false;clearTimeout(dashTimer);
 st.items=st.items.filter(i=>SEEN.has('i_'+i.id)||WQ.has('dash/i_'+i.id)||WF.has('dash/i_'+i.id)||!!legacy);st.folders=st.folders.filter(f=>SEEN.has('f_'+f.id)||WQ.has('dash/f_'+f.id)||WF.has('dash/f_'+f.id)||!!legacy);
 if(legacy&&!haveMarkers.migrated&&legacy.st&&Array.isArray(legacy.st.items)){const L=legacy.st;L.folders.forEach((f,i)=>{if(!fby(f.id)){const n={id:f.id,name:f.name,parent:null,color:FCOL[7],ord:i+1};st.folders.push(n);saveFolder(n)}});L.items.forEach(it=>{if(!by(it.id)){const n={...it,owner:null};st.items.push(n);saveItem(n,it.data?{data:it.data}:{})}});wq('dash/migrated',{ts:Date.now()},{full:{ts:Date.now()}});toast('已把舊版作品庫轉成新的逐筆同步格式')}
 else if(PERS()){seedMine()}
 else if(!st.items.length&&!st.folders.length&&!haveMarkers.seeded&&!haveMarkers.migrated){const s=seedData();st.folders=s.folders;st.items=s.items;st.folders.forEach(saveFolder);st.items.forEach(i=>saveItem(i));wq('dash/seeded',{ts:Date.now()},{full:{ts:Date.now()}})}
 render()}
async function seedMine(){const key='dots-seeded-'+UID;let done=false;try{done=!!localStorage.getItem(key)}catch(e){}
 if(!done&&UDB){try{const sn=await UDB.doc('data/users/'+UID+'/seeded').get();done=!!sn.exists}catch(e){}}
 if(done||st.items.some(i=>i.owner===UID)||st.folders.some(f=>f.owner===UID)){render();return}
 const pf='u'+UID.replace(/[^A-Za-z0-9]/g,'').slice(0,8)+'_',sd=seedData();
 sd.folders.forEach(f=>{f.id=pf+f.id;f.owner=UID});sd.items.forEach(i=>{i.id=pf+i.id;if(i.folder)i.folder=pf+i.folder;i.owner=UID});
 st.folders=st.folders.concat(sd.folders);st.items=st.items.concat(sd.items);sd.folders.forEach(saveFolder);sd.items.forEach(i=>saveItem(i));
 try{localStorage.setItem(key,'1')}catch(e){}if(UDB){try{await UDB.doc('data/users/'+UID+'/seeded').set({ts:Date.now()})}catch(e){}}render()}
// who has a board open right now (Firebase presence docs), shown on its card
let LIVE={},livesig='',PDOCS=[];
function liveCalc(){const now=Date.now(),m={};PDOCS.forEach(d=>{let v;try{v=cln(d.data())}catch(e){return}const p=v&&v.p;if(!p||!p.b||!p.n||now-(v.ts||0)>20000||v.uid===UID)return;(m[p.b]=m[p.b]||[]).push({n:p.n,ed:!!((p.s&&p.s.length)||p.ed)})});const sig=JSON.stringify(m);if(sig!==livesig){livesig=sig;LIVE=m;render()}}
function liveWatch(x){if(!window.__FB)return;try{x.collection('presence').onSnapshot(s=>{PDOCS=s.docs||[];liveCalc()},()=>{});setInterval(liveCalc,5000)}catch(e){}}
const liveChip=id=>{const a=LIVE[id];if(!a||!a.length)return'';const nm=a.slice(0,2).map(x=>esc(x.n)).join('、')+(a.length>2?' 等'+a.length+'人':''),ed=a.some(x=>x.ed);return`<span class="live" title="${esc(a.map(x=>x.n).join('、'))}"><i></i>${nm} ${ed?'正在編輯':'正在檢視'}</span>`};
function connect(x){ddb=x;if(!x)return;syncState();liveWatch(x);
 x.collection('dash').onSnapshot(s=>{s.docChanges().forEach(c=>{const id=c.doc.id;if(id==='index'){if(c.type!=='removed')legacy=cln(c.doc.data());return}if(id==='seeded'||id==='migrated'){haveMarkers[id]=c.type!=='removed';return}applyDoc(id,c.type==='removed'?null:cln(c.doc.data()),c.type==='removed')});
  if(firstDash){const empty=!s.docs||!s.docs.length;if(s.metadata&&s.metadata.fromCache&&empty){if(!dashTimer)dashTimer=setTimeout(()=>{if(firstDash)afterFirst()},2500);return}afterFirst()}else render();saveLocalState()},()=>{ddb=null;syncState()});
}
// ---------- thumbnails: loaded lazily, only for cards that scroll into view
const TQ=[];let tfly=0;const tseen=new Set();
function wantThumb(id){if(THUMBS[id]||tseen.has(id)||!ddb)return;tseen.add(id);TQ.push(id);tpump()}
function tpump(){while(tfly<4&&TQ.length){const id=TQ.shift();tfly++;ddb.doc('thumbs/'+id).get().then(s=>{tfly--;if(s.exists){const v=s.data();if(v&&v.d){THUMBS[id]=v.d;const c=$(`.card[data-id="${id}"] .th`);if(c){const b=[...c.querySelectorAll('button')];c.querySelectorAll('svg:not(.i),img').forEach(e=>e.remove());c.insertAdjacentHTML('afterbegin',`<img src="${THUMBS[id]}" alt="">`)}}}tpump()}).catch(()=>{tfly--;tseen.delete(id);tpump()})}}
const IO=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){IO.unobserve(e.target);wantThumb(e.target.dataset.id)}}),{rootMargin:'300px'}):null;
// ---------- access control (enforced by this page only — see share dialog text)
function roleOf(it){const a=it.acl;if(!a||a.mode!=='list')return'edit';if(it.owner&&it.owner===UID)return'edit';if(!it.owner&&UID)return'edit';if(UOWN)return'edit';const m=(a.members||[]).find(m=>UID&&m.id===UID);return m?m.role:'none'}
const PERS=()=>!!window.__FB&&!!UID;
const visible=i=>{if(roleOf(i)==='none')return false;if(!PERS())return true;return i.owner===UID||!!(i.acl&&(i.acl.members||[]).some(m=>m.id===UID))||!!REC[i.id]};
const DASH={patch(id,p){const it=by(id);if(!it)return;Object.assign(it,p);const f={};Object.keys(p).forEach(k=>{f[k]=p[k]===undefined?null:p[k]});wq('dash/i_'+id,f,{full:it});saveLocalState()},thumb(id,u){THUMBS[id]=u;tseen.add(id);if(ddb)wq('thumbs/'+id,{d:u},{full:{d:u}})},exit(){return closeEd()},art(id){const it=by(id);return it?thumb(it).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '):''},share(id){shareDlg(id)},gdlg(){gDlg()}};
function setTheme(t){R.dataset.wb=t;try{localStorage.setItem('wbtheme2',t)}catch(e){}$('#thm').innerHTML=ic(t==='dark'?'sun':'moon')}
const V={nav:'all',q:'',type:'all',sort:'new',mode:'grid',sel:new Set()};
function rel(t){const m=(Date.now()-t)/6e4;if(m<1)return'剛剛';if(m<60)return Math.floor(m)+' 分鐘前';if(m<1440)return Math.floor(m/60)+' 小時前';if(m<2880)return'昨天';if(m<10080)return Math.floor(m/1440)+' 天前';return new Date(t).toLocaleDateString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit'})}
const full=t=>'建立於 '+new Date(t).toLocaleString('zh-TW',{hour12:false});
function toast(m){const t=$('#toast');t.textContent=m;t.style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.opacity=0,2400)}
// ten interface-style cover designs for items that have no captured preview yet
const CW='#fff',RC=(x,y,w,h,r,f,o)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}" fill-opacity="${o}"/>`,
 LN=(d,o,w)=>`<path d="${d}" stroke="#fff" stroke-opacity="${o}" stroke-width="${w||1.6}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const COV=[
 // 0 kanban board
 (h,A,B,C)=>{let s='';const P=[A,B,C];for(let k=0;k<3;k++){s+=RC(14+k*45,12,40,76,5,CW,.1)+RC(19+k*45,18,20,4,2,CW,.7);const n=k===1?2:3;for(let j=0;j<n;j++)s+=RC(19+k*45,28+j*20,30,15,3,P[(j+k)%3],.75)+RC(22+k*45,32+j*20,16,3,1.5,CW,.55)}return s},
 // 1 flowchart
 (h,A,B,C)=>RC(10,40,36,20,6,CW,.22)+RC(16,47,18,5,2.5,CW,.7)+`<polygon points="80,26 106,50 80,74 54,50" fill="${A}" fill-opacity=".62"/>`+RC(114,12,36,20,6,B,.72)+RC(114,68,36,20,6,C,.72)+LN('M46 50H54',.6)+LN('M106 50H110V22H114',.6)+LN('M106 50H110V78H114',.6)+LN('M80 74V84H114',.35,1.2),
 // 2 mind map
 (h,A,B,C)=>{let s='';const N=[[28,22,B],[26,76,C],[132,20,C],[136,72,B],[82,12,A]];N.forEach(n=>{s+=LN(`M80 52L${n[0]} ${n[1]}`,.4,1.4)});N.forEach(n=>{s+=`<ellipse cx="${n[0]}" cy="${n[1]}" rx="14" ry="8" fill="${n[2]}" fill-opacity=".72"/>`+RC(n[0]-7,n[1]-1.5,14,3,1.5,CW,.7)});return s+`<circle cx="80" cy="54" r="15" fill="${A}" fill-opacity=".85"/><circle cx="80" cy="54" r="6" fill="#fff" fill-opacity=".85"/>`},
 // 3 landing-page wireframe
 (h,A,B,C)=>{let s=RC(12,9,136,10,4,CW,.14)+RC(16,12,10,4,2,CW,.7)+RC(112,12,8,4,2,CW,.4)+RC(124,12,8,4,2,CW,.4)+RC(136,12,8,4,2,CW,.4)+RC(12,24,136,32,5,CW,.1)+RC(20,31,52,7,3.5,CW,.85)+RC(20,42,38,4,2,CW,.4)+RC(20,49,24,5,2.5,A,.9)+RC(96,29,44,22,4,A,.6);const P=[A,B,C];for(let k=0;k<3;k++)s+=RC(12+k*47,61,42,28,5,CW,.1)+RC(17+k*47,66,14,14,4,P[k],.75)+RC(35+k*47,68,10,3,1.5,CW,.55)+RC(35+k*47,75,7,3,1.5,CW,.3);return s},
 // 4 analytics dashboard
 (h,A,B,C)=>{let s=RC(9,9,22,82,5,CW,.12);for(let k=0;k<4;k++)s+=RC(13,15+k*12,14,5,2.5,CW,k===0?.8:.35);const P=[A,B,C];for(let k=0;k<3;k++)s+=RC(37+k*38,9,34,19,4,CW,.12)+RC(41+k*38,14,14,5,2,P[k],.95)+RC(41+k*38,21,22,3,1.5,CW,.35);s+=RC(37,33,66,58,5,CW,.1);[18,30,22,40,28,36].forEach((v,k)=>{s+=RC(43+k*10,85-v,6,v,2,k%2?B:A,.8)});s+=RC(107,33,44,58,5,CW,.1)+`<path d="M112 80L122 66L132 72L146 50V86H112Z" fill="${C}" fill-opacity=".35"/>`+LN('M112 80L122 66L132 72L146 50',.85,1.8);return s},
 // 5 calendar / timeline
 (h,A,B,C)=>{let s='';for(let k=0;k<6;k++)s+=LN(`M${40+k*20} 12V90`,.08,1);const off=[0,16,34,50,66],len=[44,54,36,46,34],P=[A,B,C,A,B];for(let k=0;k<5;k++)s+=RC(10,17+k*15,22,5,2.5,CW,.45)+RC(40+off[k],15+k*15,len[k],9,4.5,P[k],.78);return RC(36,8,116,6,3,CW,.14)+s},
 // 6 sticky notes
 (h,A,B,C)=>{const col=['hsl(48 90% 70%)','hsl(340 80% 78%)','hsl(140 55% 70%)','hsl(200 80% 74%)',A,B],pos=[[12,10],[56,14],[100,10],[18,52],[62,50],[104,54]],rot=[-4,3,-2,3,-3,4];let s='';pos.forEach((p,k)=>{s+=`<g transform="rotate(${rot[k]} ${p[0]+17} ${p[1]+15})">${RC(p[0],p[1],36,32,3,col[k],.92)}${RC(p[0]+5,p[1]+8,22,3,1.5,'#000',.2)}${RC(p[0]+5,p[1]+15,26,3,1.5,'#000',.14)}${RC(p[0]+5,p[1]+22,14,3,1.5,'#000',.14)}</g>`});return s},
 // 7 document
 (h,A,B,C)=>{let s=RC(38,9,84,84,5,CW,.92)+RC(47,18,38,6,3,`hsl(${h} 35% 28%)`,1)+RC(47,29,24,3,1.5,'#000',.2);for(let k=0;k<3;k++)s+=RC(47,37+k*7,66-(k%2)*12,3,1.5,'#000',.18);s+=RC(47,60,66,14,3,A,.55);for(let k=0;k<2;k++)s+=RC(47,79+k*6,56-k*14,3,1.5,'#000',.18);return s},
 // 8 slide deck
 (h,A,B,C)=>{let s='';for(let k=0;k<3;k++)s+=RC(9,12+k*27,30,21,3,CW,k===0?.28:.12)+RC(13,17+k*27,16,3,1.5,CW,.7)+RC(13,23+k*27,10,2.5,1.2,CW,.35);s+=RC(46,12,106,76,6,CW,.1)+RC(56,24,58,8,4,CW,.88)+RC(56,38,40,4,2,CW,.42)+RC(56,46,32,4,2,CW,.28)+RC(100,50,42,30,5,A,.68)+RC(56,62,30,6,3,B,.85);return s},
 // 9 mobile app screens
 (h,A,B,C)=>{let s='';[[30,8,0],[88,16,1]].forEach(p=>{const x=p[0],y=p[1];s+=RC(x,y,42,78,8,CW,.14)+RC(x+14,y+3,14,2.5,1.2,CW,.45)+RC(x+5,y+10,32,22,4,p[2]?B:A,.72);for(let k=0;k<3;k++)s+=RC(x+5,y+37+k*11,8,8,3,[A,B,C][(k+p[2])%3],.8)+RC(x+16,y+39+k*11,20,3,1.5,CW,.55)+RC(x+16,y+45+k*11,13,2.5,1.2,CW,.3)});return s}
];
const COVPOOL={board:[0,1,2,6,9],doc:[7,3],slide:[8,4],image:[5,9]};
function thumb(i){if(i.cover==null)return dotsCover();const h=((i.seed||0)*57)%360,sd=i.seed||0,k=(+i.cover%COV.length+COV.length)%COV.length,g='g'+i.id;
 const A=`hsl(${h} 65% 68%)`,B=`hsl(${(h+45)%360} 70% 70%)`,C=`hsl(${(h+200)%360} 60% 72%)`;
 return `<svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 30% 25%)"/><stop offset="1" stop-color="hsl(${(h+50)%360} 34% 12%)"/></linearGradient></defs><rect width="160" height="100" fill="url(#${g})"/>${COV[k](h,A,B,C)}</svg>`}
// no captured preview yet: an empty canvas (what a blank board really looks like), no icon
function dotsCover(){return `<svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice"><defs><pattern id="dcp" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r=".7" fill="var(--cvl,#8a8a8a)" fill-opacity=".45"/></pattern></defs><rect width="160" height="100" fill="var(--cvb,#fafaf9)"/><rect width="160" height="100" fill="url(#dcp)"/></svg>`}
// ---------- folders (nested, coloured, orderable)
const kids=p=>st.folders.filter(f=>(f.parent||null)===(p||null)).sort((a,b)=>(a.ord||0)-(b.ord||0)||a.name.localeCompare(b.name,'zh-Hant'));
const desc=id=>{const o=[];const w=p=>kids(p).forEach(f=>{o.push(f.id);w(f.id)});w(id);return o};
const path=id=>{const o=[];let f=fby(id),g=0;while(f&&g++<20){o.unshift(f.name);f=f.parent?fby(f.parent):null}return o.join(' / ')};
// ---------- listing + content search
const snip=(it,q)=>{const t=it.ix||'',k=t.toLowerCase().indexOf(q);if(k<0)return'';const a=Math.max(0,k-14);return(a?'…':'')+t.slice(a,k+q.length+30)};
function list(){let a=st.items.filter(visible);a=a.filter(i=>V.nav==='trash'?i.trash:!i.trash);
 if(V.nav==='star')a=a.filter(i=>i.star);else if(V.nav==='recent')a=a.filter(i=>REC[i.id]);else if(V.nav==='shared')a=a.filter(i=>i.owner!==UID);else if(!['all','trash'].includes(V.nav))a=a.filter(i=>i.folder===V.nav);
 if(V.type!=='all')a=a.filter(i=>i.type===V.type);
 if(V.q){const q=V.q.toLowerCase();a=a.filter(i=>i.name.toLowerCase().includes(q)||(i.ix||'').toLowerCase().includes(q)||T[i.type].includes(q))}
 const f=V.nav==='recent'?(x,y)=>(REC[y.id]||0)-(REC[x.id]||0):{new:(x,y)=>y.ts-x.ts,old:(x,y)=>x.ts-y.ts,name:(x,y)=>x.name.localeCompare(y.name,'zh-Hant'),type:(x,y)=>T[x.type].localeCompare(T[y.type],'zh-Hant')||y.ts-x.ts}[V.sort];return a.sort(f)}
const card=i=>{const q=V.q.toLowerCase(),hit=q&&!i.name.toLowerCase().includes(q)?snip(i,q):'',lock=i.acl&&i.acl.mode==='list';
 return`<article class="card${V.sel.has(i.id)?' sel':''}" draggable="true" data-id="${i.id}"><div class="th">${THUMBS[i.id]?`<img src="${THUMBS[i.id]}" alt="">`:thumb(i)}<button class="st${i.star?' on':''}" data-a="star" title="加上星號" aria-label="加上星號">${ic('star')}</button><button class="mn" data-a="menu" title="更多操作" aria-label="更多操作">${ic('dots')}</button>${liveChip(i.id)}</div><div class="ft"><div class="nm" title="${esc(i.name)}">${esc(i.name)}</div><div class="mt"><span class="tg">${T[i.type]}</span>${lock?`<span title="已限制分享對象">${ic('lock')}</span>`:''}<span title="${full(i.ts)}">${V.nav==='recent'&&REC[i.id]?'開啟於 '+rel(REC[i.id]):rel(i.ts)}</span></div>${hit?`<div class="hit">內容：${esc(hit)}</div>`:''}</div></article>`};
function nav(){const live=st.items.filter(i=>!i.trash&&visible(i)),c=f=>live.filter(f).length,row=(id,ico,l,n)=>`<div class="nv${V.nav===id?' on':''}" data-nav="${id}" tabindex="0">${ic(ico)}<span class="l">${l}</span><span class="n">${n}</span></div>`;
 $('#nv').innerHTML=(PERS()?`<div class="wsn">${esc(((CLU&&CLU.name)||(window.__ACCT&&window.__ACCT.user&&window.__ACCT.user.name)||'我')+' 的工作頁面')}</div>`:'')+row('all','all','所有作品',live.length)+row('recent','clock','最近開啟',c(i=>REC[i.id]))+(PERS()?row('shared','share','與我共用',c(i=>i.owner!==UID)):'')+row('star','star','已加星號',c(i=>i.star))+row('trash','trash','垃圾桶',st.items.filter(i=>i.trash&&visible(i)).length)+`<div class="nv" data-help="1" tabindex="0">${ic('help')}<span class="l">功能介紹</span></div>`;
 const rows=(p,d)=>kids(p).map(f=>{const k=kids(f.id),open=f.open!==false;return`<div class="nv${V.nav===f.id?' on':''}" data-nav="${f.id}" data-f="${f.id}" tabindex="0" style="padding-left:${10+d*14}px"><button class="tg2${k.length?'':' h'}${open?' o':''}" data-a="ftog" aria-label="展開或收合">${ic('chev')}</button><svg class="i" viewBox="0 0 24 24" style="color:${f.color||'var(--mu)'}"><path d="${P.folder}" fill="${f.color||'none'}" fill-opacity=".25"/></svg><span class="l">${esc(f.name)}</span><span class="n">${c(i=>i.folder===f.id)}</span><button class="x" data-a="fmenu" title="資料夾選項" aria-label="資料夾選項">${ic('dots')}</button></div>`+(open?rows(f.id,d+1):'')}).join('');
 $('#fl').innerHTML=rows(null,0)||'<div class="mu">還沒有資料夾，按上方 ＋ 新增</div>'}
function render(){nav();const a=list();[...V.sel].forEach(id=>{if(!a.some(i=>i.id===id))V.sel.delete(id)});
 const cf=fby(V.nav);$('#ttl').textContent={all:'所有作品',recent:'最近開啟',shared:'與我共用',star:'已加星號',trash:'垃圾桶'}[V.nav]||(cf?path(cf.id):'');$('#cnt').textContent=a.length+' 個項目'+(V.q?'（比對名稱與內容）':'');
 $('#chips').innerHTML=[['all','全部'],...Object.entries(T)].map(([k,l])=>`<button class="chip${V.type===k?' on':''}" data-t="${k}">${l}</button>`).join('');
 $('#grid').className='grid'+(V.mode==='list'?' list':'');
 const sub=cf?kids(cf.id).map(f=>`<button class="sf" data-go="${f.id}"><svg class="i" viewBox="0 0 24 24" style="color:${f.color||'var(--mu)'}"><path d="${P.folder}" fill="${f.color||'none'}" fill-opacity=".3"/></svg>${esc(f.name)}</button>`).join(''):'';
 $('#subs').innerHTML=sub;$('#subs').style.display=sub?'flex':'none';
 $('#grid').innerHTML=a.length?a.map(card).join(''):`<div class="empty"><b>${V.q||V.type!=='all'?'找不到符合的作品':V.nav==='trash'?'垃圾桶是空的':V.nav==='recent'?'還沒有開啟過的作品':V.nav==='shared'?'還沒有別人分享給你的作品':'這裡還沒有作品'}</b>${V.q||V.type!=='all'?'試試其他關鍵字或清除篩選':'按右上角「新增作品」開始，或把作品拖進來'}</div>`;
 if(IO)$$('.card').forEach(c=>{if(!THUMBS[c.dataset.id])IO.observe(c)});bar();syncState()}
function bar(){const n=V.sel.size,tr=V.nav==='trash',b=$('#sb');b.style.display=n?'flex':'none';b.innerHTML=`<span>已選取 ${n} 項</span>${tr?'<button data-b="res">還原</button><button class="d" data-b="del">永久刪除</button>':'<button data-b="star">加上星號</button><button class="d" data-b="trash">移到垃圾桶</button>'}<button data-b="clr">取消</button>`}
function mv(L,fn,msg){L.forEach(id=>{const o=by(id);if(o){fn(o);saveItem(o)}});render();if(msg)toast(msg)}
const ids=id=>V.sel.has(id)?[...V.sel]:[id];
function edit(el,val,cb){const i=document.createElement('input');i.value=val;i.className='ed';i.maxLength=60;el.replaceChildren(i);i.focus();i.select();let d=0;const done=ok=>{if(d)return;d=1;cb(ok?i.value.trim():'')};i.onblur=()=>done(1);i.onclick=e=>e.stopPropagation();i.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')done(1);if(e.key==='Escape')done(0)}}
function rename(id){const c=$(`.card[data-id="${id}"]`);if(!c)return;c.draggable=false;c.scrollIntoView({block:'nearest'});edit(c.querySelector('.nm'),by(id).name,v=>{if(v){by(id).name=v;saveItem(by(id))}render()})}
function renameFolder(id){const r=$(`[data-f="${id}"] .l`);if(!r)return;const f=fby(id);edit(r,f.name,v=>{if(v){f.name=v;saveFolder(f)}render()})}
function newFolder(parent){const sib=kids(parent||null),f={id:uid(),name:'新資料夾',owner:UID||null,parent:parent||null,color:FCOL[7],ord:(sib.length?Math.max(...sib.map(x=>x.ord||0)):0)+1};st.folders.push(f);if(parent){const p=fby(parent);p.open=true}saveFolder(f);nav();renameFolder(f.id)}
function create(type,tpl){const me=UID||null,it={id:uid(),name:tpl?tpl.name:'未命名'+T[type],type,folder:fby(V.nav)?V.nav:null,star:false,trash:false,ts:Date.now(),seed:Math.floor(Math.random()*997),owner:me};if(tpl)it.tpl=tpl.id;st.items.push(it);if(['trash','star','recent'].includes(V.nav))V.nav='all';V.type='all';V.q='';$('#q').value='';V.sel=new Set([it.id]);saveItem(it,tpl?{tpl:tpl.id}:{});render();if(tpl)openItem(it.id);else rename(it.id)}
function menu(m,x,y){const e=$('#menu');e.innerHTML='';m.forEach(k=>{const d=document.createElement('div');if(k==='-'){d.className='ms'}else{d.className='mi'+(k[2]?' d':'');d.textContent=k[0];d.onclick=()=>{e.style.display='none';k[1]()}}e.appendChild(d)});e.style.display='block';e.style.left=Math.max(8,Math.min(x,innerWidth-e.offsetWidth-8))+'px';e.style.top=Math.max(8,Math.min(y,innerHeight-e.offsetHeight-8))+'px'}
function folderPick(L,x,y){const m=[['頂層（不放在資料夾）',()=>mv(L,i=>i.folder=null,'已移出資料夾')]];const w=(p,d)=>kids(p).forEach(f=>{m.push([' '.repeat(d)+f.name,()=>mv(L,i=>{i.folder=f.id;i.trash=false},'已移至「'+f.name+'」')]);w(f.id,d+1)});w(null,0);menu(m,x,y)}
function itemMenu(id,x,y){const L=ids(id),it=by(id),m=[];
 if(it.trash)m.push(['還原',()=>mv(L,i=>i.trash=false,'已還原')],['永久刪除',()=>{L.forEach(delItem);V.sel.clear();render();toast('已永久刪除')},1]);
 else{const s=!it.star;if(L.length===1)m.push(['開啟',()=>openItem(id)],['重新命名',()=>rename(id)]);if(L.length===1)m.push(['分享與權限…',()=>shareDlg(id)]);m.push([s?'加上星號':'移除星號',()=>mv(L,i=>i.star=s,'已更新星號')],['建立副本',()=>dup(L)],'-',['移到資料夾…',()=>folderPick(L,x,y)]);if(it.folder)m.push(['移出資料夾',()=>mv(L,i=>i.folder=null,'已移出資料夾')]);m.push('-',['移到垃圾桶',()=>mv(L,i=>i.trash=true,'已移到垃圾桶'),1])}
 menu(m,x,y)}
async function dup(L){for(const x of L){const o=by(x);if(!o)continue;const n={...cln(o),id:uid(),name:o.name+' 副本',ts:Date.now(),owner:UID||o.owner||null};delete n.data;delete n.tpl;st.items.push(n);saveItem(n,{ix:o.ix||''});if(ddb){toast('正在複製內容…');await cloneBoard(o.id,n.id)}if(THUMBS[o.id])DASH.thumb(n.id,THUMBS[o.id])}render();toast('已建立副本')}
function folderMenu(id,x,y){const f=fby(id),sib=kids(f.parent||null),i=sib.findIndex(s=>s.id===id),m=[['重新命名',()=>renameFolder(id)],['新增子資料夾',()=>newFolder(id)],['顏色…',()=>menu(FCOL.map(c=>[({'#ef4444':'紅','#f59e0b':'橙','#22c55e':'綠','#3b82f6':'藍','#8b5cf6':'紫','#ec4899':'粉','#14b8a6':'青','#a8a29e':'灰'})[c],()=>{f.color=c;saveFolder(f);render()}]),x,y)],'-'];
 if(i>0)m.push(['上移',()=>swapOrd(sib[i-1],f)]);if(i<sib.length-1)m.push(['下移',()=>swapOrd(f,sib[i+1])]);
 m.push(['移到…',()=>{const bad=new Set([id,...desc(id)]),mm=[['頂層',()=>reparent(f,null)]];const w=(p,d)=>kids(p).forEach(g=>{if(bad.has(g.id))return;mm.push([' '.repeat(d)+g.name,()=>reparent(f,g.id)]);w(g.id,d+1)});w(null,0);menu(mm,x,y)}],'-',['刪除資料夾',()=>delFolder(id),1]);menu(m,x,y)}
function swapOrd(a,b){const ids=kids(a.parent||null);ids.forEach((f,i)=>{if(f.ord!==i+1){f.ord=i+1;saveFolder(f)}});const t=a.ord;a.ord=b.ord;b.ord=t;saveFolder(a);saveFolder(b);render()}
function reparent(f,p){const sib=kids(p);f.parent=p;f.ord=(sib.length?Math.max(...sib.map(x=>x.ord||0)):0)+1;if(p)fby(p).open=true;saveFolder(f);render();toast('已移動資料夾')}
function delFolder(id){const f=fby(id);st.items.forEach(i=>{if(i.folder===id){i.folder=f.parent||null;saveItem(i)}});st.folders.forEach(g=>{if(g.parent===id){g.parent=f.parent||null;saveFolder(g)}});st.folders=st.folders.filter(g=>g.id!==id);wq('dash/f_'+id,null,{del:true});saveLocalState();if(V.nav===id)V.nav=f.parent||'all';render();toast('已刪除資料夾「'+f.name+'」，其中的作品與子資料夾已上移一層')}
// ---------- share link (anyone with the link can open it)
function linkBlock(it,a){const u=linkFor(it.id),lock=a.mode==='list';
 if(!window.__STANDALONE&&!window.__FB)return '';
 if(!u)return `<p class="fine">這個頁面是以本機檔案開啟（file://），無法產生可分享的連結。請把網頁部署到網站後再使用。</p>`;
 return `<div class="lk"><div class="lkr"><input id="lku" readonly value="${esc(u)}"><button class="btn" data-s="copy">複製連結</button></div>
 <p class="fine">${window.__FB?(lock?'目前限制名單：只有名單內的人能用這個連結開啟。要讓知道連結的人都能編輯，請選下方第一項。':'知道這個連結的人，登入 Google 後都可以編輯。'):'目前是本機模式，作品只存在這個瀏覽器裡，這個連結只在這台裝置的這個瀏覽器有效。要讓別人用連結開啟，需要先設定 Firebase（見左下角帳號）。'}</p></div>`}
const ROLES={edit:'可編輯',comment:'可留言',view:'僅檢視'};
const linkFor=id=>location.origin==='null'||location.protocol==='file:'?'':location.origin+location.pathname+location.search+'#/b/'+id;
async function copyText(t){try{await navigator.clipboard.writeText(t);return true}catch(e){const i=document.createElement('textarea');i.value=t;i.style.cssText='position:fixed;opacity:0';document.body.appendChild(i);i.select();let ok=false;try{ok=document.execCommand('copy')}catch(x){}i.remove();return ok}}
function shareDlg(id){const it=by(id);if(!it)return;let m=$('#shm');if(!m){m=document.createElement('div');m.id='shm';m.className='modal';document.body.appendChild(m)}
 const isOwner=!it.owner||it.owner===UID||UOWN,a=it.acl||{mode:'open',members:[]},seen=Object.keys(it.seen||{}).filter(k=>k!==it.owner&&!(a.members||[]).some(x=>x.id===k));
 m.innerHTML=`<div class="mb"><div class="mh"><b>分享「${esc(it.name)}」</b><button class="ib" data-s="x">${ic('x')}</button></div>
 ${linkBlock(it,a)}
 ${window.__STANDALONE?'':`<label class="rd"><input type="radio" name="sm" value="open" ${a.mode!=='list'?'checked':''} ${isOwner?'':'disabled'}> 知道連結的人都可以編輯${window.__FB?'（需登入 Google）':''}</label>
 <label class="rd"><input type="radio" name="sm" value="list" ${a.mode==='list'?'checked':''} ${isOwner?'':'disabled'}> 只有下方名單中的人可以開啟（建立者永遠可編輯）</label>
 <div class="ml" id="sml">載入名單…</div>`}
 ${!window.__STANDALONE&&isOwner?`<input id="ssr" class="ssr" placeholder="搜尋要加入名單的人…" autocomplete="off"><div class="ml" id="ssh"></div>`:''}
 ${!window.__STANDALONE&&isOwner&&seen.length?`<div class="mu" style="padding:6px 0 2px">曾經開啟過的人，點一下加入名單：</div><div class="ml" id="ssn"></div>`:''}
 ${window.__STANDALONE?'':`<p class="fine">這是在作品庫與編輯器頁面中執行的權限：不會顯示、也不會讓名單外的人開啟。但資料本身存放在共享資料庫，懂技術的人仍可能繞過，所以請不要用它保護機密內容。${UID?'':'你目前尚未登入，無法辨識身分，限制名單的作品只有建立者之外的人看不到。'}</p>`}
 <div class="row2">${isOwner||window.__STANDALONE?'':'<span class="mu">只有建立者可以更改權限</span>'}<button class="btn" data-s="x">完成</button></div></div>`;m.style.display='grid';m.dataset.id=id;
 const people=async(idsl)=>{let ps={};try{if(usrN&&idsl.length)ps=await usrN.profiles(idsl)}catch(e){}return idsl.map(k=>({id:k,name:(ps[k]&&ps[k].name)||'使用者 '+k.slice(0,4)+(ps[k]&&ps[k].isMe?'（你）':'')}))};
 (async()=>{const mem=a.members||[],all=await people([...(it.owner?[it.owner]:[]),...mem.map(x=>x.id),...seen]);const nm=k=>(all.find(x=>x.id===k)||{}).name||k;
  const ml=$('#sml');if(ml)ml.innerHTML=(it.owner?`<div class="mr"><span>${esc(nm(it.owner))}</span><span class="mu">建立者</span></div>`:'<div class="mr"><span class="mu">尚無建立者（舊作品）</span></div>')+mem.map(x=>`<div class="mr"><span>${esc(nm(x.id))}</span>${isOwner?`<select data-s="role" data-k="${x.id}">${Object.entries(ROLES).map(([k,l])=>`<option value="${k}"${x.role===k?' selected':''}>${l}</option>`).join('')}</select><button class="ib" data-s="rm" data-k="${x.id}">${ic('x')}</button>`:`<span class="mu">${ROLES[x.role]}</span>`}</div>`).join('');
  const sn=$('#ssn');if(sn)sn.innerHTML=seen.map(k=>`<button class="chip" data-s="add" data-k="${k}">＋ ${esc(nm(k))}</button>`).join('')})()}
function shareSave(it,a){if(!it.owner&&UID)it.owner=UID;it.acl=a;saveItem(it);render();shareDlg(it.id)}
document.addEventListener('click',e=>{const m=$('#shm');if(!m||m.style.display!=='grid')return;const b=e.target.closest('[data-s]');if(e.target===m){m.style.display='none';return}if(!b)return;const it=by(m.dataset.id),a=cln(it.acl||{mode:'open',members:[]});a.members=a.members||[];const k=b.dataset.k;
 if(b.dataset.s==='copy'){const u=$('#lku');copyText(u.value).then(ok=>{toast(ok?'已複製連結':'複製失敗，請手動選取連結');if(!ok)u.select()});return}if(b.dataset.s==='x')m.style.display='none';else if(b.dataset.s==='add'){a.members.push({id:k,role:'edit'});a.mode='list';shareSave(it,a)}else if(b.dataset.s==='rm'){a.members=a.members.filter(x=>x.id!==k);shareSave(it,a)}});
document.addEventListener('input',async e=>{if(e.target.id!=='ssr'||!usrN||!usrN.search)return;const m=$('#shm'),it=by(m.dataset.id);let hits=[];try{hits=await usrN.search(e.target.value)}catch(x){}const a=it.acl||{members:[]},box=$('#ssh');if(!box)return;box.innerHTML='';hits.filter(h=>h.id!==it.owner&&!(a.members||[]).some(x=>x.id===h.id)).slice(0,6).forEach(h=>{const b=document.createElement('button');b.className='chip';b.dataset.s='add';b.dataset.k=h.id;b.textContent='＋ '+(h.name||h.id);box.appendChild(b)});if(!box.children.length&&e.target.value)box.innerHTML='<div class="mu">找不到符合的人</div>'});
document.addEventListener('change',e=>{const m=$('#shm');if(!m||m.style.display!=='grid')return;const t=e.target,it=by(m.dataset.id);if(!it)return;const a=cln(it.acl||{mode:'open',members:[]});a.members=a.members||[];
 if(t.name==='sm'){a.mode=t.value;shareSave(it,a)}else if(t.dataset.s==='role'){const x=a.members.find(x=>x.id===t.dataset.k);if(x){x.role=t.value;shareSave(it,a)}}});
// ---------- templates gallery
function tplDlg(){let m=$('#tpm');if(!m){m=document.createElement('div');m.id='tpm';m.className='modal';document.body.appendChild(m)}
 const T2=typeof DOTS!=='undefined'?DOTS.templates():[];m.innerHTML=`<div class="mb wide"><div class="mh"><b>新增作品</b><button class="ib" data-t2="x">${ic('x')}</button></div>${Object.entries(T).map(([k,l])=>`<div class="tsec"><div class="mu" style="padding:6px 0">${l}</div><div class="tgrid"><button class="tc" data-t2="blank" data-type="${k}"><i>${ic('plus')}</i><b>空白${l}</b><span>從零開始</span></button>${T2.filter(t=>t.type===k).map(t=>`<button class="tc" data-t2="tpl" data-type="${k}" data-id="${t.id}"><i style="background:linear-gradient(135deg,hsl(${(t.id.charCodeAt(0)*13)%360} 40% 30%),hsl(${(t.id.charCodeAt(1)*17)%360} 40% 18%))">${l[0]}</i><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></button>`).join('')}</div></div>`).join('')}</div>`;m.style.display='grid'}
document.addEventListener('click',e=>{const m=$('#tpm');if(!m||m.style.display!=='grid')return;const b=e.target.closest('[data-t2]');if(e.target===m){m.style.display='none';return}if(!b)return;const k=b.dataset.t2;m.style.display='none';if(k==='blank')create(b.dataset.type);else if(k==='tpl'){const t=DOTS.templates().find(x=>x.id===b.dataset.id&&x.type===b.dataset.type);create(b.dataset.type,t)}});

// ---------- account panel (identity comes from the viewer's Claude sign-in)
let CLU=null;
const GA={listeners:[],user:()=>null};
function accUI(){accUI0();try{syncState()}catch(e){}const f=$('#gfab'),g=$('#gacc');if(f&&g){const av=g.querySelector('.av');f.innerHTML=av?av.outerHTML:'';f.title=(g.querySelector('b')||{}).textContent||'帳號'}}
function accUI0(){const b=$('#gacc');if(!b)return;const u=CLU;if(window.__FB&&window.__ACCT&&window.__ACCT.user){const a=window.__ACCT.user;b.innerHTML=(a.photo?`<img class="av" src="${esc(a.photo)}" alt="" referrerpolicy="no-referrer">`:`<span class="av">${esc((a.name||'?').charAt(0).toUpperCase())}</span>`)+`<span class="t"><b>${esc(a.name||'已登入')}</b><span>Google 帳號 · 雲端同步</span></span>`;return}if(window.__STANDALONE){const a=(window.__ACCT||{}).user||{};b.innerHTML=(a.photo?`<img class="av" src="${esc(a.photo)}" alt="">`:a.name?`<span class="av">${esc(a.name.charAt(0).toUpperCase())}</span>`:`<span class="av">${ic('lock')}</span>`)+`<span class="t"><b>${esc(a.name||'本機使用者')}</b><span>資料存在這個瀏覽器</span></span>`;return}b.innerHTML=(u&&u.avatarUrl?`<img class="av" src="${u.avatarUrl}" alt="">`:`<span class="av">${u&&u.name?esc(u.name.charAt(0).toUpperCase()):ic('lock')}</span>`)+`<span class="t"><b>${UID?esc((u&&u.name)||'已登入'):'尚未登入'}</b><span>${UID?'Claude 帳號':'登入後才能同步與分享'}</span></span>`}
let PFP='';
function profForm(a){if(!(window.__ACCT&&window.__ACCT.updateProfile))return'';PFP=a.photo||'';
 return`<div class="pf"><span class="pfa" id="pfav">${pfAv(a.name,PFP)}</span><div class="pfb"><button class="btn sm" data-g="pfphoto">更換頭像</button><button class="btn sm gh" data-g="pfrm">移除頭像</button><input type="file" id="pff" accept="image/*" hidden></div></div>
 <label class="fine" for="pfn" style="display:block;margin:8px 0 4px">顯示名稱（其他人在分享名單、游標和留言中看到的名字）</label><input id="pfn" class="ssr" maxlength="30" value="${esc(a.name||'')}" autocomplete="off">
 <div class="gme" id="pfm"></div><div class="row2" style="justify-content:space-between">${window.__FB&&a.custom?'<button class="btn gh" data-g="pfreset">還原為 Google 資料</button>':'<span></span>'}<button class="btn" data-g="pfsave">儲存</button></div>`}
const pfAv=(n,ph)=>ph?`<img class="av" src="${esc(ph)}" alt="" referrerpolicy="no-referrer">`:`<span class="av">${esc((n||'?').charAt(0).toUpperCase())}</span>`;
function shrink(file,sz=128){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=sz;const k=Math.max(sz/im.width,sz/im.height),w=im.width*k,h=im.height*k;c.getContext('2d').drawImage(im,(sz-w)/2,(sz-h)/2,w,h);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.82))};im.onerror=()=>{URL.revokeObjectURL(u);no()};im.src=u})}
document.addEventListener('change',async e=>{if(e.target.id!=='pff')return;const f=e.target.files&&e.target.files[0];if(!f)return;try{PFP=await shrink(f);const v=$('#pfav');if(v)v.innerHTML=pfAv(($('#pfn')||{}).value,PFP)}catch(x){const m=$('#pfm');if(m)m.textContent='這個檔案不是可用的圖片。'}e.target.value=''});
function gDlg(){let m=$('#gam');if(!m){m=document.createElement('div');m.id='gam';m.className='modal';document.body.appendChild(m)}const u=CLU;
 if(window.__FB){const a=(window.__ACCT||{}).user||{};m.innerHTML=`<div class="mb gm"><div class="mh"><b>帳號</b><button class="ib" data-g="x">${ic('x')}</button></div><div class="acc" style="cursor:default">${a.photo?`<img class="av" src="${esc(a.photo)}" alt="" referrerpolicy="no-referrer">`:`<span class="av">${esc((a.name||'?').charAt(0))}</span>`}<span class="t"><b>${esc(a.name||'')}</b><span>${esc(a.email||'')}</span></span></div>${profForm(a)}<p class="fine">作品會同步到你的 Firebase 專案，其他登入的人開啟同一個網址即可即時協作。分享名單的限制由這個頁面執行，Firestore 規則只要求登入。</p><button class="btn" data-g="fbout" style="justify-content:center">登出</button></div>`;m.style.display='grid';return}
 if(window.__STANDALONE){m.innerHTML=`<div class="mb gm"><div class="mh"><b>關於資料與帳號</b><button class="ib" data-g="x">${ic('x')}</button></div>${profForm((window.__ACCT||{}).user||{})}<p class="fine" style="margin:10px 0 0">這是獨立網頁版，不需要登入。所有作品存在這個瀏覽器（IndexedDB），不會上傳到任何伺服器，也不會同步到其他裝置。同一個瀏覽器的多個分頁會即時同步。</p><p class=\"fine\" style=\"margin:10px 0 4px\"><b>連接 Firebase（多人協作與跨裝置同步）</b></p><textarea id=\"fbcfg\" class=\"ssr\" rows=\"6\" placeholder='貼上 Firebase 網頁應用程式設定，例如：&#10;{ \"apiKey\": \"...\", \"authDomain\": \"xxx.firebaseapp.com\", \"projectId\": \"xxx\", \"appId\": \"...\" }' style=\"font:12px ui-monospace,monospace\">${esc(localStorage.getItem('dots-fbconfig')||'')}</textarea><div class=\"gme\" id=\"fbme\"></div><div class=\"row2\" style=\"justify-content:space-between\"><button class=\"btn\" data-g=\"fbclr\" style=\"background:var(--hv);color:var(--tx)\">清除設定</button><button class=\"btn\" data-g=\"fbsave\">儲存並重新載入</button></div><p class="fine">要在裝置之間搬移或備份，請在編輯器右上角的匯出選單選「下載備份檔」，再到另一個瀏覽器「從備份檔匯入」。清除瀏覽器網站資料會刪掉作品，重要內容請先備份。</p></div>`;m.style.display='grid';return}
 m.innerHTML=`<div class="mb gm"><div class="mh"><b>帳號</b><button class="ib" data-g="x">${ic('x')}</button></div>`+(UID?`<div class="acc" style="cursor:default">${u&&u.avatarUrl?`<img class="av" src="${u.avatarUrl}" alt="">`:`<span class="av">${esc(((u&&u.name)||'?').charAt(0))}</span>`}<span class="t"><b>${esc((u&&u.name)||'已登入')}</b><span>Claude 帳號</span></span></div>`:`<p class="fine" style="margin:0">你目前沒有登入。請先登入 claude.ai，再重新開啟這個頁面；登入後作品會同步到雲端，也能使用分享名單。</p>`)+`<p class="fine">這個頁面無法直接使用 Google 登入：頁面的安全限制不允許連到 Google，也收不到 Google 登入後的轉址。身分來自你的 Claude 帳號；如果你的 Claude 帳號本來就是用 Google 登入，這裡就是同一個人。</p></div>`;m.style.display='grid'}
document.addEventListener('click',e=>{if(e.target.closest('#gacc,#gfab'))return gDlg();const m=$('#gam');if(!m||m.style.display!=='grid')return;if(e.target===m||e.target.closest('[data-g="x"]')){m.style.display='none';return}const k=(e.target.closest('[data-g]')||{dataset:{}}).dataset.g;
 if(k==='pfphoto'){$('#pff').click()}
 else if(k==='pfrm'){PFP='';const v=$('#pfav');if(v)v.innerHTML=pfAv($('#pfn').value,'')}
 else if(k==='pfsave'||k==='pfreset'){const msg=$('#pfm'),nm=($('#pfn')||{value:''}).value.trim();if(k==='pfsave'&&!nm){msg.textContent='請輸入顯示名稱。';return}
  msg.textContent='儲存中…';(k==='pfsave'?window.__ACCT.updateProfile({name:nm,photo:PFP}):window.__ACCT.resetProfile()).then(()=>{if(CLU&&window.__FB){}accUI();render();toast(k==='pfsave'?'已更新帳號資料':'已還原為 Google 資料');gDlg()}).catch(()=>{msg.textContent='儲存失敗，請確認網路連線與 Firestore 規則後再試。'})}
 else if(k==='fbout'&&window.__ACCT&&window.__ACCT.signOut)window.__ACCT.signOut();
 else if(k==='fbclr'){try{localStorage.removeItem('dots-fbconfig')}catch(x){}location.reload()}
 else if(k==='fbsave'){const t=$('#fbcfg').value.trim();try{let j;try{j=JSON.parse(t)}catch(x){j=JSON.parse(t.replace(/^[^{]*/,'').replace(/;?\s*$/,'').replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g,'$1"$2":').replace(/'/g,'"'))}if(!j.projectId||!j.apiKey)throw 0;localStorage.setItem('dots-fbconfig',JSON.stringify(j));location.reload()}catch(x){$('#fbme').textContent='設定格式不正確，請貼上 Firebase 提供的設定物件（需要 apiKey 與 projectId）。'}}});
accUI();
// grid events
const G=$('#grid');
G.addEventListener('click',e=>{const c=e.target.closest('.card');if(!c||e.target.closest('input'))return;const id=c.dataset.id,b=e.target.closest('button');
 if(b){if(b.dataset.a==='star'){const i=by(id);i.star=!i.star;saveItem(i);render()}else{const r=b.getBoundingClientRect();itemMenu(id,r.left,r.bottom+4)}return}
 if(e.detail>=2&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){openItem(id);return}
 if(e.ctrlKey||e.metaKey||e.shiftKey)V.sel.has(id)?V.sel.delete(id):V.sel.add(id);else V.sel=new Set(V.sel.size===1&&V.sel.has(id)?[]:[id]);updSel()});
function updSel(){$$('.card').forEach(c=>c.classList.toggle('sel',V.sel.has(c.dataset.id)));bar()}
G.addEventListener('dblclick',e=>{const c=e.target.closest('.card');if(c&&!e.target.closest('input,button'))openItem(c.dataset.id)});
G.addEventListener('contextmenu',e=>{const c=e.target.closest('.card');if(!c)return;e.preventDefault();if(!V.sel.has(c.dataset.id)){V.sel=new Set([c.dataset.id]);updSel()}itemMenu(c.dataset.id,e.clientX,e.clientY)});
$('#subs').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b){V.nav=b.dataset.go;V.sel.clear();render()}});
let drag=null;
G.addEventListener('dragstart',e=>{const c=e.target.closest('.card');if(!c)return;if(!V.sel.has(c.dataset.id))V.sel=new Set([c.dataset.id]);drag=[...V.sel];e.dataTransfer.setData('text/plain',drag.join(','));e.dataTransfer.effectAllowed='move';$$('.card').forEach(x=>{const s=V.sel.has(x.dataset.id);x.classList.toggle('sel',s);x.classList.toggle('drag',s)})});
G.addEventListener('dragend',()=>{drag=null;$$('.over').forEach(x=>x.classList.remove('over'));render()});
const side=$('#side');
side.addEventListener('dragover',e=>{const n=e.target.closest('.nv');if(!n||!drag)return;e.preventDefault();$$('.nv.over').forEach(x=>x!==n&&x.classList.remove('over'));n.classList.add('over')});
side.addEventListener('dragleave',e=>{const n=e.target.closest('.nv');if(n&&!n.contains(e.relatedTarget))n.classList.remove('over')});
side.addEventListener('drop',e=>{const n=e.target.closest('.nv');if(!n||!drag)return;e.preventDefault();const k=n.dataset.nav,L=drag,f=fby(k);drag=null;V.sel.clear();
 if(k==='trash')mv(L,i=>i.trash=true,'已移到垃圾桶');else if(k==='star')mv(L,i=>i.star=true,'已加上星號');else if(k==='recent')render();else mv(L,i=>{i.folder=f?f.id:null;i.trash=false},f?'已移至「'+f.name+'」':'已移出資料夾')});
side.addEventListener('click',e=>{const t=e.target.closest('[data-a]');const n=e.target.closest('.nv');
 if(t&&t.dataset.a==='ftog'){const f=fby(n.dataset.f);f.open=f.open===false;render();return}
 if(t&&t.dataset.a==='fmenu'){const r=t.getBoundingClientRect();folderMenu(n.dataset.f,r.left,r.bottom+4);return}
 if(n&&!e.target.closest('input')){V.nav=n.dataset.nav;V.sel.clear();document.body.classList.remove('nav');render()}});
side.addEventListener('contextmenu',e=>{const n=e.target.closest('[data-f]');if(n){e.preventDefault();folderMenu(n.dataset.f,e.clientX,e.clientY)}});
side.addEventListener('dblclick',e=>{const n=e.target.closest('[data-f]');if(n&&!e.target.closest('button'))renameFolder(n.dataset.f)});
side.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.classList.contains('nv'))e.target.click()});
// header + misc
$('#addf').innerHTML=ic('plus');$('#si').innerHTML=ic('search');$('#burger').innerHTML=ic('list');$('#new').innerHTML=ic('plus')+'新增作品';
$$('[data-m]').forEach(b=>b.innerHTML=ic(b.dataset.m));
$('#addf').onclick=()=>newFolder(fby(V.nav)?V.nav:null);
$('#q').oninput=e=>{V.q=e.target.value.trim();render()};
$('#sort').onchange=e=>{V.sort=e.target.value;render()};
$('#chips').onclick=e=>{const b=e.target.closest('[data-t]');if(b){V.type=b.dataset.t;render()}};
$$('[data-m]').forEach(b=>b.onclick=()=>{V.mode=b.dataset.m;$$('[data-m]').forEach(x=>x.classList.toggle('on',x===b));render()});
$('#burger').onclick=()=>document.body.classList.toggle('nav');
$('#new').onclick=()=>tplDlg();
$('#sb').onclick=e=>{const b=e.target.closest('[data-b]');if(!b)return;const L=[...V.sel],k=b.dataset.b;V.sel.clear();
 if(k==='star')mv(L,i=>i.star=true,'已加上星號');else if(k==='trash')mv(L,i=>i.trash=true,'已移到垃圾桶');else if(k==='res')mv(L,i=>i.trash=false,'已還原');else if(k==='del'){L.forEach(delItem);render();toast('已永久刪除')}else render()};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#menu'))$('#menu').style.display='none'});
addEventListener('keydown',e=>{if(ED.id&&e.key!=='Escape')return;const t=document.activeElement.tagName,typing=t==='INPUT'||t==='SELECT'||t==='TEXTAREA';
 if(e.key==='Escape'&&($('#shm')&&$('#shm').style.display==='grid'||$('#tpm')&&$('#tpm').style.display==='grid')){$$('.modal').forEach(m=>m.style.display='none');return}
 if(e.key==='/'&&!typing){e.preventDefault();$('#q').focus()}
 else if(e.key==='Escape'){if(ED.id){if(DOTS.canExit())closeEd();return}$('#menu').style.display='none';if(typing)document.activeElement.blur();V.sel.clear();render()}
 else if(!typing&&(e.key==='Delete'||e.key==='Backspace')&&V.sel.size){e.preventDefault();const L=[...V.sel];V.sel.clear();if(V.nav==='trash'){L.forEach(delItem);render()}else mv(L,i=>i.trash=true,'已移到垃圾桶')}
 else if(!typing&&e.key==='Enter'&&V.sel.size===1){openItem([...V.sel][0])}
 else if(!typing&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){e.preventDefault();V.sel=new Set(list().map(i=>i.id));render()}},true);
// editor bridge
const ED={id:null};
function recSave(){const ks=Object.keys(REC).sort((a,b)=>REC[b]-REC[a]).slice(0,60),o={};ks.forEach(k=>o[k]=REC[k]);REC=o;try{localStorage.setItem('dots-rec',JSON.stringify(REC))}catch(e){}clearTimeout(recSave.h);recSave.h=setTimeout(()=>{if(UDB&&UID)UDB.doc('data/users/'+UID+'/ro').set({m:REC}).catch(()=>{})},1200)}
function openItem(id){const it=by(id);if(!it||ED.id)return;const role=roleOf(it);if(role==='none')return toast('你沒有開啟這個作品的權限');
 ED.id=id;V.sel=new Set([id]);REC[id]=Date.now();recSave();
 if(UID&&!(it.seen&&it.seen[UID]&&Date.now()-it.seen[UID]<12*H)){it.seen=Object.assign(it.seen||{},{[UID]:Date.now()});wq('dash/i_'+id,{seen:{[UID]:it.seen[UID]}},{full:it})}
 if(window.__STANDALONE!==undefined&&linkFor(id)){try{history.replaceState(null,'','#/b/'+id)}catch(e){}}
 DOTS.open({id:it.id,type:it.type,name:it.name,pages:it.pages,init:it.init,role,tpl:it.tpl,data:it.data,mig:it.mig})}
function closeEd(){return DOTS.close().then(()=>{ED.id=null;if(/^#\/b\//.test(location.hash))try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}render()})}
// deep link: #/b/<id> opens that board as soon as the shared list has loaded
let PEND=null,PT=null;
function hashId(){const m=/^#\/b\/([\w-]+)/.exec(location.hash);return m?m[1]:null}
function pendTry(){if(!PEND)return;const it=by(PEND);if(it&&!ED.id){const id=PEND;PEND=null;clearInterval(PT);openItem(id)}}
function pendStart(){const id=hashId();if(!id||ED.id===id)return;PEND=id;clearInterval(PT);let n=0;PT=setInterval(()=>{pendTry();if(!PEND)return;if(++n>40){clearInterval(PT);PEND=null;toast('找不到這個作品：可能已被刪除，或你還沒有登入')}},400)}
window.addEventListener('hashchange',pendStart);
$('#thm').onclick=()=>setTheme(R.dataset.wb==='dark'?'light':'dark');setTheme(R.dataset.wb);
// boot: show local state immediately, then connect to the shared database
if(!loadLocalState()){/* wait for the database; fall back to samples if it is unavailable */}
render();
(async()=>{try{usrN=await claude.use('user');if(usrN){const v=await usrN.me();UID=v&&v.id||null;UOWN=!!(v&&v.isOwner);CLU=v;accUI();if(PERS()){st.folders=st.folders.filter(f=>f.owner===UID);render()}}}catch(e){}
 let x=null;try{x=await claude.use('db')}catch(e){}
 if(x){connect(x);if(UID){UDB=x;try{const s=await x.doc('data/users/'+UID+'/ro').get();if(s.exists){const m=cln(s.data()).m||{};Object.keys(m).forEach(k=>{REC[k]=Math.max(REC[k]||0,m[k])});recSave();render()}}catch(e){}}}
 else if(!st.items.length&&!st.folders.length){const s=seedData();st.folders=s.folders;st.items=s.items;saveLocalState();render()}
 syncState();pendStart()})();

// ---------- first-login intro tour (re-openable from the sidebar or with ?) ----------
const TOUR=[
 {k:4,t:'歡迎來到 DOTS',d:'DOTS 是一個即時協作的白板、文件與簡報工具。這個簡短導覽會帶你認識主要功能，隨時可以略過，之後也能從左側「功能介紹」再次打開。',l:['白板、文件、簡報與圖片都集中在同一個作品庫','登入後每個人有自己的工作頁面','多人可同時編輯，並看到彼此的游標']},
 {k:3,t:'建立你的第一個作品',d:'按右上角「新增作品」，從空白開始，或挑一個範本。',l:['白板範本：腦力激盪、任務看板、團隊回顧','文件範本：會議記錄、專案提案、每週報告','簡報範本：產品簡報、成果報告','用「資料夾」整理作品，可拖曳卡片放進資料夾']},
 {k:6,t:'白板工具與快速鍵',d:'進入白板後，左側工具列可直接點選，也能用鍵盤切換。繪圖工具用完不會自動跳回選取，可以連續畫；按 Esc 回到選取。',l:['V 選取、H 平移、P 畫筆、L 螢光筆、E 橡皮擦','T 文字、R 矩形、O 圓形、A 箭頭、N 直線','I 插入圖片、C 加評論','Ctrl+D 複製、Ctrl+0 重設縮放、Shift+1 符合畫面']},
 {k:2,t:'一起協作',d:'把作品分享給別人，大家就能在同一張畫布上一起工作。',l:['卡片的分享按鈕可產生連結：知道連結的人都能編輯','也可改成指定名單，只讓選定的人存取','編輯器左下角顯示目前在線上的人','可看到別人的游標，以及誰正在選取或編輯哪個物件']},
 {k:8,t:'文件與簡報',d:'不只是白板：寫文件、做簡報都在同一個地方，內容會自動儲存。',l:['文件：標題、內文、清單與表格','簡報：多頁投影片，可進入簡報模式播放','可匯出 PDF、PPTX 或圖片，也能下載 .dots 備份檔']},
 {k:7,t:'整理、搜尋與個人化',d:'作品變多時，用這些功能快速找到東西。',l:['按 / 鍵搜尋名稱或內容','星號標記常用作品；「最近開啟」回到剛看過的','刪除的作品先放垃圾桶，可還原','右上角切換深色／淺色；左下角帳號可改名稱與頭像']}
];
let TI=0;
function introKey(){const a=(window.__ACCT&&window.__ACCT.user)||{};return 'dots-intro-v1:'+(a.uid||a.id||a.email||UID||'local')}
function introDlg(i){let m=$('#itm');if(!m){m=document.createElement('div');m.id='itm';m.className='modal';document.body.appendChild(m)}
 TI=Math.max(0,Math.min(TOUR.length-1,i));const s=TOUR[TI],last=TI===TOUR.length-1;
 m.innerHTML=`<div class="mb it" role="dialog" aria-modal="true" aria-label="功能介紹"><button class="ib itx" data-it="x" aria-label="關閉">${ic('x')}</button><div class="itp">${thumb({id:'it'+TI,seed:TI*53+11,type:'board',cover:s.k})}</div><div class="itb"><div class="itn">${TI+1} / ${TOUR.length}</div><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p><ul>${s.l.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div class="itf"><div class="itd">${TOUR.map((_,k)=>`<i class="${k===TI?'on':''}" data-it="${k}"></i>`).join('')}</div><span class="itsp"></span>${TI?'<button class="btn gh" data-it="prev">上一步</button>':'<button class="btn gh" data-it="x">略過</button>'}<button class="btn" data-it="${last?'x':'next'}">${last?'開始使用':'下一步'}</button></div></div>`;
 m.style.display='grid'}
function introClose(){const m=$('#itm');if(m)m.style.display='none';try{localStorage.setItem(introKey(),'1')}catch(e){}}
document.addEventListener('click',e=>{if(e.target.closest('[data-help]')){introDlg(0);return}const m=$('#itm');if(!m||m.style.display!=='grid')return;if(e.target===m)return introClose();const b=e.target.closest('[data-it]');if(!b)return;const a=b.dataset.it;if(a==='x')introClose();else if(a==='next')introDlg(TI+1);else if(a==='prev')introDlg(TI-1);else introDlg(+a)});
document.addEventListener('keydown',e=>{const m=$('#itm'),open=m&&m.style.display==='grid';if(open){if(e.key==='Escape'){introClose();e.stopPropagation()}else if(e.key==='ArrowRight')introDlg(TI+1);else if(e.key==='ArrowLeft')introDlg(TI-1);return}const t=document.activeElement.tagName;if(e.key==='?'&&!ED.id&&t!=='INPUT'&&t!=='TEXTAREA'&&t!=='SELECT')introDlg(0)},true);
(function(){let n=0;const iv=setInterval(()=>{n++;const ready=window.__FB?!!(window.__ACCT&&window.__ACCT.user):true;if(n>150)return clearInterval(iv);if(!ready||document.getElementById('dots')&&document.getElementById('dots').classList.contains('on'))return;clearInterval(iv);let seen=false;try{seen=!!localStorage.getItem(introKey())}catch(e){}if(!seen)introDlg(0)},600)})();
