window.DOTS_FIREBASE={apiKey:"AIzaSyBfuO5iP4SXyYDjiYdeecUPT4T7sOaqOvw",authDomain:"dots-1773a.firebaseapp.com",projectId:"dots-1773a",storageBucket:"dots-1773a.firebasestorage.app",messagingSenderId:"804197027890",appId:"1:804197027890:web:531a27fbfa1f2064a1ec2b"};
// DOTS standalone runtime: a local stand-in for the Claude page runtime (db / user / room / downloads).
// Data lives in this browser's IndexedDB; tabs of the same browser stay in sync through BroadcastChannel.
(function(){
window.__STANDALONE=true;
let LP={};try{LP=JSON.parse(localStorage.getItem('dots-profile')||'{}')||{}}catch(e){}
const ME0={id:null,name:LP.name||'使用者',color:'#3b82f6',avatarUrl:LP.photo||'',isOwner:true,canEdit:true};
window.__ACCT={mode:'local',user:{name:LP.name||'',photo:LP.photo||''},updateProfile:async p=>{LP={name:p.name||'',photo:p.photo||''};try{localStorage.setItem('dots-profile',JSON.stringify(LP))}catch(e){}ME0.name=LP.name||'使用者';ME0.avatarUrl=LP.photo;window.__ACCT.user={name:LP.name,photo:LP.photo}}};
const seg=p=>p.split('/'),par=p=>{const s=seg(p);s.pop();return s.join('/')};
const mem=new Map(),subs=new Set();let ready=null,idb=null,q=Promise.resolve();
const bc=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('dots-db'):null;
const deep=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(deep);Object.freeze(o)}return o};
const cl=v=>JSON.parse(JSON.stringify(v));
const snapDoc=(path,data)=>{const d=data===undefined?undefined:deep(cl(data));return{id:seg(path).pop(),exists:data!==undefined,data:()=>d,metadata:{fromCache:false,hasPendingWrites:false}}};
function openIDB(){return new Promise(res=>{try{const r=indexedDB.open('dots-local',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)}catch(e){res(null)}})}
function init(){return ready||(ready=(async()=>{idb=await openIDB();if(idb){await new Promise(res=>{try{const tx=idb.transaction('kv'),st=tx.objectStore('kv'),c=st.openCursor();c.onsuccess=()=>{const cur=c.result;if(cur){mem.set(cur.key,cur.value);cur.continue()}else res()};c.onerror=()=>res()}catch(e){res()}})}else{try{const j=JSON.parse(localStorage.getItem('dots-kv')||'{}');Object.keys(j).forEach(k=>mem.set(k,j[k]))}catch(e){}}
 try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}})())}
function persist(path,val){q=q.then(()=>new Promise(res=>{if(idb){try{const tx=idb.transaction('kv','readwrite'),st=tx.objectStore('kv');val===undefined?st.delete(path):st.put(val,path);tx.oncomplete=()=>res();tx.onerror=()=>{window.dispatchEvent(new CustomEvent('dots-storage-error'));res()}}catch(e){res()}}else{try{const o={};mem.forEach((v,k)=>o[k]=v);localStorage.setItem('dots-kv',JSON.stringify(o))}catch(e){window.dispatchEvent(new CustomEvent('dots-storage-error'))}res()}}))}
function notify(path){subs.forEach(s=>{try{s.on(path)}catch(e){console.error(e)}})}
function apply(path,val,remote){if(val===undefined)mem.delete(path);else mem.set(path,val);if(!remote){persist(path,val);if(bc)bc.postMessage({p:path,v:val})}notify(path)}
if(bc)bc.onmessage=e=>{const m=e.data;if(!m)return;if(m.v===undefined||m.v===null&&false)mem.delete(m.p);else mem.set(m.p,m.v);notify(m.p)};
const docsOf=col=>{const n=seg(col).length;return[...mem.keys()].filter(k=>k.startsWith(col+'/')&&seg(k).length===n+1).sort().map(k=>[k,mem.get(k)])};
const err=(m,c)=>{const e=new Error(m);e.code=c;return e};
const db={
 doc(path){if(seg(path).length%2)throw new TypeError('bad doc path '+path);return{id:seg(path).pop(),path,
  get:async()=>{await init();return snapDoc(path,mem.get(path))},
  set:async data=>{await init();apply(path,cl(data))},
  update:async data=>{await init();if(!mem.has(path))throw err('document does not exist','invalid_argument');apply(path,Object.assign({},mem.get(path),cl(data)))},
  delete:async()=>{await init();apply(path,undefined)},
  onSnapshot(next,er){const s={on(p){if(p===path)next(snapDoc(path,mem.get(path)))}};subs.add(s);init().then(()=>{if(subs.has(s))next(snapDoc(path,mem.get(path)))});return()=>subs.delete(s)}}},
 collection(path){if(!(seg(path).length%2))throw new TypeError('bad collection path '+path);
  const mk=(ch)=>{const o={size:0,metadata:{fromCache:false,hasPendingWrites:false},docChanges:()=>ch};Object.defineProperty(o,'docs',{get:()=>docsOf(path).map(([k,v])=>snapDoc(k,v)),enumerable:true});Object.defineProperty(o,'empty',{get:()=>!docsOf(path).length});return o};
  const api={path,doc:id=>db.doc(path+'/'+(id||Math.random().toString(36).slice(2))),
   get:async()=>{await init();const docs=docsOf(path).map(([k,v])=>snapDoc(k,v));return{docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:{fromCache:false}}},
   onSnapshot(next,er){const known=new Set();const s={on(p){if(par(p)!==path)return;const v=mem.get(p),had=known.has(p);let ch;if(v===undefined){if(!had)return;known.delete(p);ch=[{type:'removed',doc:snapDoc(p,{})}]}else{known.add(p);ch=[{type:had?'modified':'added',doc:snapDoc(p,v)}]}next(mk(ch))}};subs.add(s);
    init().then(()=>{if(!subs.has(s))return;const all=docsOf(path);all.forEach(([k])=>known.add(k));next(mk(all.map(([k,v])=>({type:'added',doc:snapDoc(k,v)}))))});return()=>subs.delete(s)}};
  return api}};
// users: one local identity per browser (no accounts in the standalone build)
let LU=null;try{LU=localStorage.getItem('dots-uid')}catch(e){}if(!LU){LU='local-'+Math.random().toString(36).slice(2,10);try{localStorage.setItem('dots-uid',LU)}catch(e){}}
ME0.id=LU;const user={me:async()=>ME0,id:async()=>LU,profiles:async ids=>Object.fromEntries([].concat(ids).map(i=>[i,{id:i,name:i===LU?(ME0.name==='使用者'?'我':ME0.name):'使用者',isMe:i===LU,color:'#888',avatarUrl:i===LU?ME0.avatarUrl:''}])),search:async()=>[],isOwner:async()=>true,canEdit:async()=>true,can:async()=>true};
// presence between tabs of the same browser
const ME='p'+Math.random().toString(36).slice(2,8),peers=new Map(),pl=new Set();let myp={};const rb=bc?new BroadcastChannel('dots-room'):null;
const list=()=>[{peer:ME,isMe:true,presence:myp},...[...peers].map(([id,v])=>({peer:id,isMe:false,presence:v.p}))];
const emit=()=>pl.forEach(f=>{try{f({peers:list()})}catch(e){}});
if(rb){rb.onmessage=e=>{const m=e.data;if(!m||m.id===ME)return;if(m.leave)peers.delete(m.id);else peers.set(m.id,{p:m.p,t:Date.now()});emit()};setInterval(()=>{const n=Date.now();let c=false;peers.forEach((v,k)=>{if(n-v.t>8000){peers.delete(k);c=true}});if(c)emit()},3000);setInterval(()=>{if(Object.keys(myp).length)rb.postMessage({id:ME,p:myp})},4000);addEventListener('pagehide',()=>rb.postMessage({id:ME,leave:1}))}
const room={presence:async p=>{myp=p;if(rb)rb.postMessage({id:ME,p});emit()},peers:()=>list(),onPeers:f=>{pl.add(f);return()=>pl.delete(f)},emit:async()=>{},on:()=>()=>{}};
const downloads={save:async({filename,data})=>{const u=URL.createObjectURL(data),a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}};

// ================= Firebase backend (optional): Google sign-in + Firestore =================
const FBV='10.12.5',CFG=(()=>{try{if(window.DOTS_FIREBASE&&window.DOTS_FIREBASE.projectId)return window.DOTS_FIREBASE;const j=JSON.parse(localStorage.getItem('dots-fbconfig')||'null');return j&&j.projectId?j:null}catch(e){return null}})();
let MODE='local',FB=null,FAUTH=null,FS=null,FU=null,fbDb=null,fbUser=null,fbRoom=null;
const loadScript=u=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=()=>no(new Error('無法載入 Firebase 程式庫（需要網路）'));document.head.appendChild(s)});
// Firestore forbids arrays directly inside arrays: store [[x,y],...] as {__aa:1,d:[flat],l:[lengths]}
function enc(v){if(Array.isArray(v)){if(v.some(Array.isArray)){const d=[],l=[];v.forEach(x=>{if(!Array.isArray(x))throw new Error('mixed nested array');l.push(x.length);x.forEach(y=>d.push(y))});return{__aa:1,d,l}}return v.map(enc)}if(v&&typeof v==='object'){const o={};for(const k in v)if(v[k]!==undefined)o[k]=enc(v[k]);return o}return v}
function dec(v){if(Array.isArray(v))return v.map(dec);if(v&&typeof v==='object'){if(v.__aa===1&&Array.isArray(v.d)){const out=[];let i=0;v.l.forEach(n=>{out.push(v.d.slice(i,i+n));i+=n});return out}const o={};for(const k in v)o[k]=dec(v[k]);return o}return v}
function flat(o,pre,out){for(const k in o){const v=o[k],p=pre?pre+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v)&&!v.__aa&&Object.keys(v).length)flat(v,p,out);else out[p]=v}return out}
const wsnap=d=>({id:d.id,exists:d.exists,data:()=>d.exists?dec(d.data()):undefined,metadata:{fromCache:!!(d.metadata&&d.metadata.fromCache),hasPendingWrites:!!(d.metadata&&d.metadata.hasPendingWrites)}});
const COAL=new Map();
function coalesced(path,ref,data){return new Promise((ok,no)=>{let c=COAL.get(path);if(!c){c={rs:[],t:0};COAL.set(path,c)}c.data=data;c.rs.push([ok,no]);if(!c.t)c.t=setTimeout(()=>sendNow(path),350)})}
function sendNow(path){const c=COAL.get(path);if(!c)return;COAL.delete(path);clearTimeout(c.t);FS.doc(path).set(c.data).then(()=>c.rs.forEach(r=>r[0]()),e=>c.rs.forEach(r=>r[1](e)))}
function dropCoal(path){const c=COAL.get(path);if(c){clearTimeout(c.t);COAL.delete(path);c.rs.forEach(r=>r[0]())}}
addEventListener('pagehide',()=>{[...COAL.keys()].forEach(sendNow)});
const isObj=p=>/\/objs\//.test(p);
function mkFbDb(){return{
 doc(path){if(seg(path).length%2)throw new TypeError('bad doc path '+path);const ref=()=>FS.doc(path);return{id:seg(path).pop(),path,
  get:async()=>{if(COAL.has(path))sendNow(path);return wsnap(await ref().get())},
  set:async data=>{const e=enc(JSON.parse(JSON.stringify(data)));if(isObj(path))return coalesced(path,ref,e);dropCoal(path);await ref().set(e)},
  update:async data=>{if(COAL.has(path))sendNow(path);await ref().update(flat(enc(JSON.parse(JSON.stringify(data))),'',{}))},
  delete:async()=>{dropCoal(path);await ref().delete()},
  onSnapshot(next,er){return ref().onSnapshot(d=>next(wsnap(d)),er)}}},
 collection(path){if(!(seg(path).length%2))throw new TypeError('bad collection path '+path);const ref=()=>FS.collection(path);const wq=q=>({docs:q.docs.map(wsnap),size:q.size,empty:q.empty,metadata:{fromCache:!!q.metadata.fromCache,hasPendingWrites:!!q.metadata.hasPendingWrites},docChanges:()=>q.docChanges().map(c=>({type:c.type,doc:wsnap(c.doc)}))});
  return{path,doc:id=>fbDb.doc(path+'/'+(id||Math.random().toString(36).slice(2))),get:async()=>wq(await ref().get()),onSnapshot(next,er){return ref().onSnapshot(q=>next(wq(q)),er)}}}}}
const PALC=['#ef4444','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#78716c'];function colorOf(id){let h=0;for(const c of id)h=(h*31+c.charCodeAt(0))>>>0;return PALC[h%PALC.length]}
const prof=new Map();
var PRF={};
function mkFbUser(){const u=FU;const me={id:u.uid,name:(PRF.custom&&PRF.name)||u.displayName||u.email||'使用者',color:colorOf(u.uid),avatarUrl:PRF.custom?(PRF.photo||''):(u.photoURL||''),email:u.email||'',isOwner:false,canEdit:true};
 return{me:async()=>me,id:async()=>u.uid,isOwner:async()=>false,canEdit:async()=>true,can:async()=>true,
  profiles:async ids=>{const out={};await Promise.all([].concat(ids).map(async i=>{if(i===u.uid){out[i]={id:i,name:me.name,isMe:true,color:me.color,avatarUrl:me.avatarUrl};return}if(!prof.has(i)){try{const d=await FS.doc('profiles/'+i).get();prof.set(i,d.exists?d.data():{})}catch(e){prof.set(i,{})}}const p=prof.get(i);out[i]={id:i,name:p.name||'',isMe:false,color:colorOf(i),avatarUrl:p.photo||''}}));return out},
  search:async q=>{q=(q||'').trim().toLowerCase();try{let ref=FS.collection('profiles');ref=ref.orderBy('nameLower');if(q)ref=ref.startAt(q).endAt(q+'');const s=await ref.limit(8).get();return s.docs.map(d=>({id:d.id,name:d.data().name||'',color:colorOf(d.id),isMe:d.id===u.uid})).filter(p=>p.name&&!p.isMe)}catch(e){return[]}}}}
function mkFbRoom(){const ME2=FU.uid+'_'+Math.random().toString(36).slice(2,6),pp=new Set(),others=new Map();let mine={},lastW=0,tm=0;
 const list=()=>[{peer:ME2,isMe:true,presence:mine},...[...others].map(([id,v])=>({peer:id,isMe:false,presence:v.p}))];const emit=()=>pp.forEach(f=>{try{f({peers:list()})}catch(e){}});
 const write=()=>{tm=0;lastW=Date.now();FS.doc('presence/'+ME2).set({p:enc(JSON.parse(JSON.stringify(mine))),ts:Date.now(),uid:FU.uid}).catch(()=>{})};
 try{FS.collection('presence').onSnapshot(s=>{const now=Date.now();s.docChanges().forEach(c=>{const id=c.doc.id;if(id===ME2)return;if(c.type==='removed')others.delete(id);else{const d=c.doc.data();if(d&&now-d.ts<20000)others.set(id,{p:dec(d.p),t:d.ts});else others.delete(id)}});emit()},()=>{})}catch(e){}
 setInterval(()=>{const now=Date.now();let ch=false;others.forEach((v,k)=>{if(now-v.t>20000){others.delete(k);ch=true}});if(Object.keys(mine).length&&mine.b&&now-lastW>6000)write();if(ch)emit()},3000);
 addEventListener('pagehide',()=>{try{FS.doc('presence/'+ME2).delete()}catch(e){}});
 return{presence:async p=>{mine=p;emit();if(!tm){const wait=Math.max(0,700-(Date.now()-lastW));tm=setTimeout(write,wait)}},peers:list,onPeers:f=>{pp.add(f);return()=>pp.delete(f)},emit:async()=>{},on:()=>()=>{}}}
function gate(msg){return new Promise(res=>{const d=document.createElement('div');d.id='fbgate';d.style.cssText='position:fixed;inset:0;z-index:999;background:#0e0e10;color:#ececee;display:grid;place-items:center;font:14px -apple-system,"PingFang TC","Noto Sans TC",sans-serif;padding:16px';
 d.innerHTML='<div style="width:min(360px,100%);display:flex;flex-direction:column;gap:12px;text-align:center"><img src="{{LOGO_DK}}" alt="DOTS" style="height:56px;align-self:center"><div style="color:#8a8a93;line-height:1.6">登入後，你的作品會同步到雲端，並可與其他人即時協作。</div><button id="fbg" style="display:flex;align-items:center;justify-content:center;gap:10px;background:#fff;color:#3c4043;border:1px solid #dadce0;border-radius:10px;padding:11px 14px;font-weight:500;font-size:14px;cursor:pointer"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>使用 Google 登入</button><div id="fbe" style="color:#ff8080;min-height:18px;font-size:12.5px;line-height:1.5"></div><button id="fbl" style="background:none;border:0;color:#8a8a93;cursor:pointer;font-size:12.5px;text-decoration:underline">不登入，只在這個瀏覽器使用</button></div>';
 document.body.appendChild(d);const e=d.querySelector('#fbe');if(msg)e.textContent=msg;
 d.querySelector('#fbl').onclick=()=>{d.remove();res('local')};
 d.querySelector('#fbg').onclick=async()=>{e.textContent='';try{const pr=new FB.auth.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});await FAUTH.signInWithPopup(pr);d.remove();res('google')}catch(x){e.textContent=x.code==='auth/unauthorized-domain'?'這個網址尚未加入 Firebase 的「已授權網域」。':x.code==='auth/popup-blocked'?'登入視窗被瀏覽器擋住，請允許彈出視窗後再試。':x.code==='auth/popup-closed-by-user'?'登入視窗已關閉。':'登入失敗：'+(x.message||x.code)}};
})}
const READY=(async()=>{if(!CFG)return;
 try{if(location.protocol==='file:')throw new Error('Firebase 登入需要用 http(s) 網址開啟（例如放到 Firebase Hosting），不能直接雙擊開檔。');
  if(!window.firebase){for(const m of['app','auth','firestore'])await loadScript(`https://www.gstatic.com/firebasejs/${FBV}/firebase-${m}-compat.js`)}
  FB=window.firebase;if(!FB.apps.length)FB.initializeApp(CFG);FAUTH=FB.auth();FS=FB.firestore();try{FS.settings({ignoreUndefinedProperties:true,cacheSizeBytes:FB.firestore.CACHE_SIZE_UNLIMITED})}catch(e){}try{await FS.enablePersistence({synchronizeTabs:true})}catch(e){}
  FU=await new Promise(ok=>{const un=FAUTH.onAuthStateChanged(u=>{un();ok(u)})});
  if(!FU){await new Promise(r=>document.body?r():addEventListener('DOMContentLoaded',r,{once:true}));const c=await gate('');if(c==='google')FU=FAUTH.currentUser}
  if(FU){MODE='firebase';window.__STANDALONE=false;window.__FB=true;
   try{const d=await FS.doc('profiles/'+FU.uid).get();if(d.exists)PRF=d.data()||{}}catch(e){}
   fbDb=mkFbDb();fbUser=mkFbUser();fbRoom=mkFbRoom();
   const GN=FU.displayName||FU.email||'使用者',GP=FU.photoURL||'',cur=()=>PRF.custom?{name:PRF.name||GN,photo:PRF.photo||''}:{name:GN,photo:GP};
   window.__ACCT={mode:'firebase',user:{...cur(),email:FU.email,custom:!!PRF.custom},signOut:async()=>{try{await FAUTH.signOut()}catch(e){}location.reload()},
    updateProfile:async p=>{const n=(p.name||'').trim()||GN,ph=p.photo||'';await FS.doc('profiles/'+FU.uid).set({name:n,nameLower:n.toLowerCase(),photo:ph,custom:true},{merge:true});PRF={name:n,photo:ph,custom:true};const m=await fbUser.me();m.name=n;m.avatarUrl=ph;window.__ACCT.user={...cur(),email:FU.email,custom:true}},
    resetProfile:async()=>{await FS.doc('profiles/'+FU.uid).set({name:GN,nameLower:GN.toLowerCase(),photo:GP,custom:false},{merge:true});PRF={name:GN,photo:GP,custom:false};const m=await fbUser.me();m.name=GN;m.avatarUrl=GP;window.__ACCT.user={...cur(),email:FU.email,custom:false}}};
   if(!PRF.custom){try{await FS.doc('profiles/'+FU.uid).set({name:GN,nameLower:GN.toLowerCase(),photo:GP},{merge:true})}catch(e){}}}
 }catch(e){console.error(e);window.__fbError=e.message||String(e);if(document.body){const t=document.createElement('div');t.textContent='無法連線到 Firebase，已改用本機模式：'+window.__fbError;t.style.cssText='position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:999;background:#b45309;color:#fff;padding:8px 14px;border-radius:10px;font:13px sans-serif;max-width:90vw';document.addEventListener('DOMContentLoaded',()=>{});setTimeout(()=>document.body&&document.body.appendChild(t),400);setTimeout(()=>t.remove(),9000)}}})();
const caps={db:async()=>{await READY;if(MODE==='firebase')return fbDb;await init();return db},user:async()=>{await READY;return MODE==='firebase'?fbUser:user},room:async()=>{await READY;return MODE==='firebase'?fbRoom:room},downloads:async()=>downloads,sample:async()=>null};
window.claude={use:async n=>caps[n]?caps[n]():null};
})();
