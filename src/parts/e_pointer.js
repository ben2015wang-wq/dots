// ---------- pointer (mouse, pen and touch gestures)
let G=null,G2=null,noDraw=false;const ta=$('ta'),TP=new Map();
const hitBox=p=>{const a=[...S.objs.values()].filter(o=>(o.t==='text'||o.t==='img')&&ok(o)&&(o.pg||PGS[0].id)===S.pg).sort((a,b)=>(b.z||0)-(a.z||0));for(const o of a){const r=-(o.r||0)*Math.PI/180,dx=p.x-(o.x+o.w/2),dy=p.y-(o.y+o.h/2),lx=dx*Math.cos(r)-dy*Math.sin(r)+o.w/2,ly=dx*Math.sin(r)+dy*Math.cos(r)+o.h/2;if(lx>=-6&&lx<=o.w+6&&ly>=-6&&ly<=o.h+6)return o.id}return null};
const hitId=e=>{for(const t of document.elementsFromPoint(e.clientX,e.clientY)){const g=t.closest&&t.closest('g[data-id]');if(g){const o=S.objs.get(g.dataset.id);if(o&&ok(o))return o.id}}return hitBox(W(e))};
function defWW(p){if(ITEM&&ITEM.type==='doc'){const fr=S.objs.get('fr-'+S.pg);if(fr)return Math.max(120,Math.min(674,Math.round(fr.x+fr.w-60-p.x)))}return S.d.ww||0}
function abortG(){const g=G;G=null;if(!g)return;busy.clear();$('mq').setAttribute('display','none');
 if(g.m==='draw'||g.m==='shape')rm(g.o.id);else if(g.m==='mv')g.os.forEach(b=>put(cl(b)));else if(g.m==='rs'||g.m==='rot')put(cl(g.b));else if(g.m==='er')g.del.forEach(id=>{const e=els.get(id);if(e)e.style.opacity=''})}
function startG2(){abortG();const pts=[...TP.values()].slice(0,2),mid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};let o=null;
 if(!RO&&S.sel.size===1){const t=S.objs.get([...S.sel][0]);if(t&&ok(t)){const p={x:(mid.x-S.v.x)/S.v.k,y:(mid.y-S.v.y)/S.v.k},r=-(t.r||0)*Math.PI/180,dx=p.x-(t.x+t.w/2),dy=p.y-(t.y+t.h/2),lx=dx*Math.cos(r)-dy*Math.sin(r)+t.w/2,ly=dx*Math.sin(r)+dy*Math.cos(r)+t.h/2;if(lx>=-20&&lx<=t.w+20&&ly>=-20&&ly<=t.h+20)o=t}}
 G2={d0:Math.max(10,Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)),a0:Math.atan2(pts[1].y-pts[0].y,pts[1].x-pts[0].x),mid0:mid,v0:{...S.v},o,b:o?cl(o):null};if(o)busy.add(o.id)}
function moveG2(){const g=G2,pts=[...TP.values()].slice(0,2);if(!g||pts.length<2)return;const d=Math.max(10,Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)),a=Math.atan2(pts[1].y-pts[0].y,pts[1].x-pts[0].x),mid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2},s=d/g.d0;
 if(g.o){const b=g.b,o=g.o,dx=(mid.x-g.mid0.x)/S.v.k,dy=(mid.y-g.mid0.y)/S.v.k,cx=b.x+b.w/2+dx,cy=b.y+b.h/2+dy;let nw=Math.max(8,b.w*s),nh=Math.max(8,b.h*s);
  if(b.t==='text'){o.s=Math.max(8,+(b.s*s).toFixed(1));if(b.ww>0)o.ww=Math.max(40,b.ww*s)}
  o.w=nw;o.h=nh;o.x=cx-nw/2;o.y=cy-nh/2;if(o.pts)o.pts=b.pts.map(q=>[q[0]*nw/(b.w||1),q[1]*nh/(b.h||1)]);o.r=+(((b.r||0)+(a-g.a0)*180/Math.PI)%360).toFixed(1);put(o);if(o.t==='text'){const cx2=o.x+o.w/2,cy2=o.y+o.h/2;o.x+=cx-cx2;o.y+=cy-cy2;put(o)}}
 else{const k=Math.max(.1,Math.min(6,g.v0.k*s)),wx=(g.mid0.x-g.v0.x)/g.v0.k,wy=(g.mid0.y-g.v0.y)/g.v0.k;S.v.k=k;S.v.x=mid.x-wx*k;S.v.y=mid.y-wy*k;applyV()}}
function endG2(){const g=G2;G2=null;busy.clear();if(g&&g.o)commit([[g.b.id,g.b,cl(g.o)]])}
$('cv').addEventListener('mousedown',e=>{if(PRES)return;const a=document.activeElement;if(a&&a!==document.body&&a!==ta&&a.blur)a.blur();e.preventDefault()});
$('cv').addEventListener('pointerdown',e=>{if(PRES)return;if(e.target.closest&&e.target.closest('.cur'))return;finishEdit();closeCmt();try{$('cv').setPointerCapture(e.pointerId)}catch(x){}
 if(e.pointerType==='touch'){TP.set(e.pointerId,{x:e.clientX,y:e.clientY});if(TP.size===2){startG2();return}if(TP.size>2||noDraw)return}
 const p=W(e),t=S.tool;
 if((RO&&t!=='cmt')||e.button===1||space||t==='hand'){G={m:'pan',sx:e.clientX,sy:e.clientY,vx:S.v.x,vy:S.v.y};$('cv').style.cursor='grabbing';return}
 if(t==='select'){const hd=e.target.dataset&&e.target.dataset.h;const id=hitId(e);
  if(hd){const o=S.objs.get([...S.sel][0]);G={m:hd==='rot'?'rot':'rs',h:hd,o,b:cl(o)};busy.add(o.id);return}
  if(id){if(e.shiftKey){S.sel.has(id)?S.sel.delete(id):S.sel.add(id)}else if(!S.sel.has(id))S.sel=new Set([id]);const os=[...S.sel].map(i=>cl(S.objs.get(i)));G={m:'mv',p,os};os.forEach(o=>busy.add(o.id));props();ovl();return}
  S.sel.clear();G={m:'mq',p};props();ovl();return}
 if(t==='cmt'){newComment(p);return}
 if(!ok({l:S.al})){toast('目前圖層已鎖定或隱藏');return}
 if(t==='pen'||t==='hl'){const o={id:rid(),t:'pen',x:p.x,y:p.y,w:0,h:0,r:0,pts:[[0,0]],c:S.d.c,sw:t==='hl'?S.d.sw*4+6:S.d.sw,hl:t==='hl',op:S.d.op,z:Date.now()};G={m:'draw',o,ap:[[p.x,p.y]]};busy.add(o.id);put(o);return}
 if(t==='eraser'){G={m:'er',del:[]};erase(e);return}
 if(t==='text'){const id=hitId(e),ex=id&&S.objs.get(id);if(ex&&ex.t==='text')edit(ex);else{const o={id:rid(),t:'text',x:p.x,y:p.y,w:10,h:30,r:0,txt:'',s:S.d.s,c:S.d.c,op:S.d.op,b:!!S.d.b,i:!!S.d.i,ul:!!S.d.ul,st:!!S.d.st,al:S.d.al||'left',ls:S.d.ls||'',ff:S.d.ff||'s',ww:defWW(p),fo:S.d.fo,fc:S.d.fc,bw:S.d.bw,rd:S.d.rd,z:Date.now()};put(o);edit(o,1)}G=null;return}
 const o={id:rid(),t,x:p.x,y:p.y,w:0,h:0,r:0,c:S.d.c,sw:S.d.sw,fo:S.d.fo,fc:S.d.fc,rd:S.d.rd,op:S.d.op,z:Date.now()};if(t==='line'||t==='arrow')o.pts=[[0,0],[0,0]];G={m:'shape',o,p0:p};busy.add(o.id);put(o)});
$('cv').addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&TP.has(e.pointerId)){TP.set(e.pointerId,{x:e.clientX,y:e.clientY});if(G2){moveG2();return}}const p=W(e);cursor(p);if(!G)return;const g=G;
 if(g.m==='pan'){S.v.x=g.vx+e.clientX-g.sx;S.v.y=g.vy+e.clientY-g.sy;applyV()}
 else if(g.m==='mv'){let dx=p.x-g.p.x,dy=p.y-g.p.y;g.os.forEach(b=>{const o=S.objs.get(b.id);o.x=b.x+dx;o.y=b.y+dy;put(o)})}
 else if(g.m==='mq'){g.q=[g.p.x,g.p.y,p.x,p.y];const m=$('mq'),x=Math.min(g.q[0],g.q[2])*S.v.k+S.v.x,y=Math.min(g.q[1],g.q[3])*S.v.k+S.v.y;m.setAttribute('display','');m.setAttribute('x',x);m.setAttribute('y',y);m.setAttribute('width',Math.abs(g.q[2]-g.q[0])*S.v.k);m.setAttribute('height',Math.abs(g.q[3]-g.q[1])*S.v.k)}
 else if(g.m==='draw'){const o=g.o;g.ap.push([p.x,p.y]);const xs=g.ap.map(a=>a[0]),ys=g.ap.map(a=>a[1]);o.x=Math.min(...xs);o.y=Math.min(...ys);o.w=Math.max(...xs)-o.x;o.h=Math.max(...ys)-o.y;o.pts=g.ap.map(a=>[+(a[0]-o.x).toFixed(1),+(a[1]-o.y).toFixed(1)]);put(o)}
 else if(g.m==='shape'){const o=g.o,a=g.p0;let x=p.x,y=p.y;if(e.shiftKey){const d=Math.max(Math.abs(x-a.x),Math.abs(y-a.y));x=a.x+Math.sign(x-a.x)*d;y=a.y+Math.sign(y-a.y)*d}o.x=Math.min(a.x,x);o.y=Math.min(a.y,y);o.w=Math.abs(x-a.x);o.h=Math.abs(y-a.y);if(o.pts)o.pts=[[a.x-o.x,a.y-o.y],[x-o.x,y-o.y]];put(o)}
 else if(g.m==='er')erase(e);
 else if(g.m==='rot'){const o=g.o,cx=o.x+o.w/2,cy=o.y+o.h/2;let a=Math.atan2(p.y-cy,p.x-cx)*180/Math.PI+90;if(e.shiftKey)a=Math.round(a/15)*15;o.r=+a.toFixed(1);put(o)}
 else if(g.m==='rs'){const o=g.o,b=g.b,r=(b.r||0)*Math.PI/180,cx=b.x+b.w/2,cy=b.y+b.h/2,sx=g.h[1]==='e'?1:-1,sy=g.h[0]==='s'?1:-1;let dx=p.x-cx,dy=p.y-cy;const lx=dx*Math.cos(-r)-dy*Math.sin(-r),ly=dx*Math.sin(-r)+dy*Math.cos(-r),fx=-sx*b.w/2,fy=-sy*b.h/2;const wrap=o.t==='text'&&b.ww>0;let nw=Math.abs(lx-fx),nh=Math.abs(ly-fy),uni=!wrap&&(o.t==='img'||o.t==='text'||e.shiftKey);
  if(uni){const s=Math.max(.05,((lx-fx)*sx*b.w+(ly-fy)*sy*b.h)/(b.w*b.w+b.h*b.h));nw=b.w*s;nh=b.h*s}
  nw=Math.max(6,nw);nh=wrap?b.h:Math.max(6,nh);const mx=uni?fx+sx*nw/2:(lx+fx)/2,my=wrap?0:uni?fy+sy*nh/2:(ly+fy)/2,ncx=cx+mx*Math.cos(r)-my*Math.sin(r),ncy=cy+mx*Math.sin(r)+my*Math.cos(r);
  if(wrap)o.ww=Math.max(40,Math.round(nw));else if(o.t==='text')o.s=Math.max(8,+(b.s*nw/b.w).toFixed(1));o.w=nw;o.h=nh;o.x=ncx-nw/2;o.y=ncy-nh/2;if(o.pts)o.pts=b.pts.map(q=>[q[0]*nw/(b.w||1),q[1]*nh/(b.h||1)]);put(o)}});
function erase(e){const id=hitId(e);if(id&&!G.del.includes(id)){G.del.push(id);const g=els.get(id);if(g)g.style.opacity=.2}}
const end=e=>{if(!G)return;const g=G;G=null;busy.clear();$('mq').setAttribute('display','none');$('cv').style.cursor=S.tool==='hand'?'grab':S.tool==='select'?'default':'crosshair';
 if(g.m==='mv')commit(g.os.map(b=>[b.id,b,cl(S.objs.get(b.id))]));
 if(g.m==='rs'||g.m==='rot'){const o=g.o;let ex=[];if(o.t==='text'&&o.ww>0)ex=paginate(o).map(n=>[n.id,null,cl(n)]);commit([[g.b.id,g.b,cl(g.o)]].concat(ex))}
 if(g.m==='draw'||g.m==='shape'){const o=g.o;if(g.m==='shape'&&!o.pts&&o.w<4&&o.h<4){o.w=o.h=90;}if(o.pts&&o.pts.length&&g.m==='shape'&&o.w<3&&o.h<3){rm(o.id);return}put(o);commit([[o.id,null,cl(o)]]);if(g.m==='shape'){setTool('select');S.sel=new Set([o.id]);props();ovl()}}
 if(g.m==='er'&&g.del.length){const ch=g.del.map(i=>[i,cl(S.objs.get(i)),null]);g.del.forEach(rm);commit(ch)}
 if(g.m==='mq'&&g.q){const[x1,y1,x2,y2]=[Math.min(g.q[0],g.q[2]),Math.min(g.q[1],g.q[3]),Math.max(g.q[0],g.q[2]),Math.max(g.q[1],g.q[3])];S.objs.forEach(o=>{if(ok(o)&&(o.pg||PGS[0].id)===S.pg&&o.x<x2&&o.x+o.w>x1&&o.y<y2&&o.y+o.h>y1)S.sel.add(o.id)});props();ovl()}};
const up=e=>{if(e.pointerType==='touch'){TP.delete(e.pointerId);if(G2&&TP.size<2){endG2();noDraw=true}if(!TP.size)noDraw=false}if(G2)return;end(e)};
$('cv').addEventListener('pointerup',up);$('cv').addEventListener('pointercancel',up);
$('cv').addEventListener('dblclick',e=>{if(S.tool!=='select'||RO)return;const id=hitId(e),o=id&&S.objs.get(id);if(o&&o.t==='text')edit(o)});
// ---------- rich text editing (contenteditable)
function syncTa(o){const runs=domToRuns(ta);o.runs=runs;o.txt=plainOf(runs)}
function pos(o){const k=S.v.k,g=els.get(o.id);if(g)g.style.visibility='hidden';const fl=ta._rf||{};
 ta.style.cssText=`left:${S.v.x+o.x*k}px;top:${S.v.y+o.y*k}px;font-size:${o.s*k}px;color:${col(o.c)};font-weight:${fl.b?700:400};font-style:${fl.i?'italic':'normal'};text-decoration:${[fl.ul&&'underline',fl.st&&'line-through'].filter(Boolean).join(' ')||'none'};text-align:${o.al||'left'};font-family:${FF[o.ff]||FF.s};transform:rotate(${o.r||0}deg);transform-origin:${o.w/2*k}px ${o.h/2*k}px;width:${o.ww>0?o.ww*k:Math.max(120,o.w*k+40)}px;min-height:${o.s*k*1.25}px;white-space:${o.ww>0?'pre-wrap':'pre'};overflow-wrap:${o.ww>0?'break-word':'normal'}`}
function caretEnd(){const r=document.createRange();r.selectNodeContents(ta);r.collapse(false);const s=getSelection();s.removeAllRanges();s.addRange(r)}
function edit(o,isNew){if(RO)return;finishEdit();S.sel=new Set([o.id]);ovl();ta.hidden=false;ta._o=o;ta._b=isNew?null:cl(o);ta._rf=isNew?{b:!!o.b,i:!!o.i,ul:!!o.ul,st:!!o.st}:null;ta._rng=null;
 ta.innerHTML=isNew&&!o.txt?'':runsHTML(o);try{document.execCommand('styleWithCSS',false,true)}catch(e){}
 ta._pos=()=>pos(o);ta._pos();props();ta.focus();caretEnd();setTimeout(()=>{if(ta._o===o&&document.activeElement!==ta){ta.focus();caretEnd()}},30)}
function finishEdit(){const o=ta._o;if(!o)return;syncTa(o);ta._o=null;ta.hidden=true;ta.innerHTML='';const g=els.get(o.id);if(g)g.style.visibility='';
 if(!o.txt.trim()){if(ta._b)commit([[o.id,ta._b,null]]);rm(o.id);props();return}
 paint(o);put(o);const ex=paginate(o).map(n=>[n.id,null,cl(n)]);commit([[o.id,ta._b,cl(o)]].concat(ex));props()}
ta.addEventListener('input',()=>{const o=ta._o;if(!o)return;syncTa(o);paint(o);ta._pos();put(o)});
ta.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){finishEdit();return}if(e.key==='Enter'&&!e.isComposing){e.preventDefault();document.execCommand('insertLineBreak')}});
ta.addEventListener('paste',e=>{e.preventDefault();const t=(e.clipboardData||window.clipboardData).getData('text/plain');t.split(/\r?\n/).forEach((l,i)=>{if(i)document.execCommand('insertLineBreak');if(l)document.execCommand('insertText',false,l)})});
ta.addEventListener('blur',e=>{const rt=e.relatedTarget;if(rt&&rt.closest&&rt.closest('#props'))return;setTimeout(()=>{if(ta._o&&document.activeElement!==ta&&!(document.activeElement&&document.activeElement.closest&&document.activeElement.closest('#props')))finishEdit()},0)});
dAdd('selectionchange',()=>{if(ta.hidden||!ta._o)return;const s=getSelection();if(s.rangeCount&&ta.contains(s.anchorNode))ta._rng=s.getRangeAt(0).cloneRange();fmtState()});
function restoreSel(){if(!ta._o)return;ta.focus();if(ta._rng){const s=getSelection();s.removeAllRanges();s.addRange(ta._rng)}}
function refocus(){if(ta._o){restoreSel();}}
function fmtState(){if(!ta._o)return;[['b','bold'],['i','italic'],['ul','underline'],['st','strikeThrough']].forEach(([k,c])=>{const b=document.querySelector(`#dots [data-f="${k}"]`);if(b)b.classList.toggle('on',!!document.queryCommandState(c))})}
function applySelColor(c){if(!ta._o||!ta._rng||ta._rng.collapsed)return false;restoreSel();try{document.execCommand('styleWithCSS',false,true);document.execCommand('foreColor',false,c)}catch(e){return false}syncTa(ta._o);paint(ta._o);ta._pos();put(ta._o);return true}
dAdd('click',e=>{const b=e.target.closest('[data-f]');if(!b||RO)return;const k=b.dataset.f,v=b.dataset.v;
 if(ta._o&&['b','i','ul','st'].includes(k)){restoreSel();document.execCommand({b:'bold',i:'italic',ul:'underline',st:'strikeThrough'}[k]);syncTa(ta._o);paint(ta._o);ta._pos();put(ta._o);fmtState();return}
 const ids=[...S.sel].filter(i=>S.objs.has(i));if(!ids.length){S.d[k]=v===undefined?!S.d[k]:(k==='ls'&&S.d[k]===v?'':v);props();return}
 const f=S.objs.get(ids[0]);let val;if(['b','i','ul','st'].includes(k))val=!fmtOn(f,k);else val=(k==='ls'&&f[k]===v)?'':v;S.d[k]=val;chg(o=>{if(['b','i','ul','st'].includes(k))setFmt(o,k,val);else o[k]=val;return{}});props()});
$('props').addEventListener('mousedown',e=>{if(!ta.hidden&&!e.target.closest('input,select'))e.preventDefault()});
function paginate(o){if(!ITEM||ITEM.type!=='doc'||!(o.ww>0)||RO)return[];const added=[];let cur=o;
 for(let guard=0;guard<40;guard++){const fr=S.objs.get('fr-'+(cur.pg||PGS[0].id));if(!fr)break;const lh=cur.s*1.25,avail=Math.max(1,Math.floor((fr.y+fr.h-60-cur.y)/lh)),L=layout(cur);if(L.length<=avail)break;
  const keep=L.slice(0,avail),rest=L.slice(avail);let idx=PGS.findIndex(p=>p.id===(cur.pg||PGS[0].id)),next=PGS[idx+1];if(!next)next=newPage();const nf=S.objs.get('fr-'+next.id);
  const used=keep.filter(l=>l.hard&&l.chars.some(c=>!c.p)).length,n=Object.assign(cl(cur),{id:rid(),pg:next.id,y:(nf?nf.y:0)+60,x:cur.x,z:Date.now(),ln0:(cur.ln0||0)+(cur.ls==='number'?used:0)});delete n.src;delete n.u;
  cur.runs=linesToRuns(keep);cur.txt=plainOf(cur.runs);n.runs=linesToRuns(rest);n.txt=plainOf(n.runs);put(cur);put(n);added.push(n);cur=n}
 return added}
// ---------- images
$('fi').onchange=async e=>{for(const f of e.target.files)await addImg(f);e.target.value=''};
function addImg(f,at){if(RO)return Promise.resolve();return new Promise(res=>{const im=new Image();im.onload=()=>{let m=1400,q=.82,u;const cv=document.createElement('canvas'),ty=cv.toDataURL('image/webp').startsWith('data:image/webp')?'image/webp':'image/jpeg';
 for(let i=0;i<8;i++){const s=Math.min(1,m/Math.max(im.width,im.height));cv.width=Math.max(1,Math.round(im.width*s));cv.height=Math.max(1,Math.round(im.height*s));cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);u=cv.toDataURL(ty,q);if(u.length<200000)break;q=Math.max(.5,q-.08);m*=.82}
 const tc=document.createElement('canvas'),ts=48/Math.max(im.width,im.height);tc.width=Math.max(1,Math.round(im.width*ts));tc.height=Math.max(1,Math.round(im.height*ts));tc.getContext('2d').drawImage(im,0,0,tc.width,tc.height);const th=tc.toDataURL('image/jpeg',.5);
 const w=Math.min(360,cv.width),h=w*cv.height/cv.width,c=at||{x:(innerWidth/2-S.v.x)/S.v.k,y:(innerHeight/2-S.v.y)/S.v.k},o={id:rid(),t:'img',x:c.x-w/2,y:c.y-h/2,w,h,r:0,src:u,th,iid:rid(),op:1,z:Date.now()};IMG.set(o.iid,u);put(o);commit([[o.id,null,cl(o)]]);setTool('select');S.sel=new Set([o.id]);props();ovl();URL.revokeObjectURL(im.src);res()};im.onerror=res;im.src=URL.createObjectURL(f)})}
wAdd('paste',e=>{if(!ta.hidden||RO)return;const f=[...(e.clipboardData?.files||[])].find(f=>f.type.startsWith('image/'));if(f){e.preventDefault();addImg(f)}else{const t=e.clipboardData?.getData('text');if(t&&t.trim()){const x=(innerWidth/2-S.v.x)/S.v.k-60,y=(innerHeight/2-S.v.y)/S.v.k-20,o={id:rid(),t:'text',x,y,w:10,h:30,r:0,txt:t,s:S.d.s,c:S.d.c,op:1,ww:defWW({x,y}),z:Date.now()};put(o);commit([[o.id,null,cl(o)]]);paginate(o)}}});
wAdd('dragover',e=>e.preventDefault());
wAdd('drop',e=>{e.preventDefault();[...e.dataTransfer.files].filter(f=>f.type.startsWith('image/')).forEach(f=>addImg(f,W(e)))});
