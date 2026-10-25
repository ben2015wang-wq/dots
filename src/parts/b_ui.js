// ---------- rich text model
const LKOK=u=>typeof u==='string'&&/^(https?:|mailto:)/i.test(u)?u:'';
const PLAIN={},NF={b:false,i:false,ul:false,st:false,c:null};
const runsOf=o=>o.runs&&o.runs.length?o.runs:(o.txt===''?[]:[{t:o.txt,b:!!o.b,i:!!o.i,ul:!!o.ul,st:!!o.st,lk:LKOK(o.lk)}]);
const fmtOn=(o,k)=>o.runs&&o.runs.length?o.runs.every(r=>r[k]):!!o[k];
function setFmt(o,k,v){o[k]=v;if(o.runs)o.runs.forEach(r=>{r[k]=v})}
function setColor(o,c){o.c=c;if(o.runs)o.runs.forEach(r=>{delete r.c})}
const plainOf=runs=>runs.map(r=>r.t).join('');
const MC=document.createElement('canvas').getContext('2d'),MW=new Map();
function chW(ch,f,o){const k=(f.b?'b':'n')+(f.i?'i':'n')+o.s+(o.ff||'s')+ch;let w=MW.get(k);if(w===undefined){MC.font=`${f.i?'italic ':''}${f.b?'700':'400'} ${o.s}px ${FF[o.ff]||FF.s}`;w=MC.measureText(ch).width;MW.set(k,w);if(MW.size>30000)MW.clear()}return w}
const brk=ch=>ch===' '||ch==='-'||/[⺀-￯]/.test(ch);
function layout(o){const runs=runsOf(o),ww=o.ww>0?o.ww:0,paras=[];let para=[];
 runs.forEach(r=>{const f={b:!!r.b,i:!!r.i,ul:!!r.ul,st:!!r.st,c:r.c||null,lk:LKOK(r.lk)||null};r.t.split('\n').forEach((p,k)=>{if(k>0){paras.push(para);para=[]}for(const ch of p)para.push({ch,f})})});paras.push(para);
 const lines=[];let n=o.ln0||0;
 paras.forEach(p=>{let chars=p;let pre=0;if(o.ls&&p.length){const pf=o.ls==='bullet'?'• ':(++n)+'. ';chars=[...pf].map(ch=>({ch,f:PLAIN,p:true})).concat(p);pre=chars.length-p.length}
  const hang=ww&&o.ls&&(o.al||'left')==='left'?chars.slice(0,pre).reduce((a,c)=>a+chW(c.ch,{},o),0):0;
  if(!ww){lines.push({chars,hard:true,ind:0});return}
  let cur=[],cw=0,lb=-1,first=true;
  const push=()=>{lines.push({chars:cur,hard:first,ind:first?0:hang});first=false};
  for(const c of chars){const w=chW(c.ch,c.f,o),lim=ww-(first?0:hang);
   if(cw+w>lim&&cur.length){let rest=[];if(lb>=0&&lb<cur.length-1){rest=cur.splice(lb+1)}push();cur=rest;cw=rest.reduce((a,x)=>a+chW(x.ch,x.f,o),0);lb=-1;cur.forEach((x,i)=>{if(brk(x.ch))lb=i})}
   cur.push(c);cw+=w;if(brk(c.ch))lb=cur.length-1}
  push()});
 return lines}
function segsOf(line){const out=[];line.chars.forEach(c=>{const l=out[out.length-1];if(l&&l.f===c.f)l.t+=c.ch;else out.push({t:c.ch,f:c.f})});return out}
function linesToRuns(lines){const out=[];lines.forEach((ln,i)=>{if(i>0&&ln.hard)out.push({t:'\n',...NF});segsOf({chars:ln.chars.filter(c=>!c.p)}).forEach(s=>{if(s.t)out.push({t:s.t,b:!!s.f.b,i:!!s.f.i,ul:!!s.f.ul,st:!!s.f.st,...(s.f.c?{c:s.f.c}:{}),...(s.f.lk?{lk:s.f.lk}:{})})})});return out}
function textSVG(o,c,w){const al=o.al||'left',an=al==='center'?'middle':al==='right'?'end':'start',X=al==='center'?w/2:al==='right'?w:0,lines=layout(o);
 const at=f=>`${f.b?' font-weight="700"':''}${f.i?' font-style="italic"':''}${f.ul||f.st||f.lk?` text-decoration="${[(f.ul||f.lk)&&'underline',f.st&&'line-through'].filter(Boolean).join(' ')}"`:''}${f.lk?` fill="#2563eb" data-lk="${esc(f.lk)}"`:f.c?` fill="${esc(f.c)}"`:''}`;
 return `<text font-size="${o.s}" fill="${c}" font-weight="400" font-family="${FF[o.ff]||FF.s}" text-anchor="${an}" style="white-space:pre">${lines.map((ln,i)=>{const sg=segsOf(ln);if(!sg.length)sg.push({t:' ',f:PLAIN});return sg.map((s,k)=>`<tspan${k?'':` x="${X+(al==='left'?ln.ind:0)}" dy="${i?1.25:1}em"`}${at(s.f)}>${esc(s.t)}</tspan>`).join('')}).join('')}</text>`}
const runsHTML=o=>runsOf(o).map(r=>r.t.split('\n').map(esc).join('<br>')===''?'':`<span style="${r.b?'font-weight:700;':''}${r.i?'font-style:italic;':''}${r.ul||r.st?`text-decoration:${[r.ul&&'underline',r.st&&'line-through'].filter(Boolean).join(' ')};`:''}${r.c&&!r.lk?`color:${esc(r.c)};`:''}">${r.lk?`<a href="${esc(r.lk)}" data-ul="1">`:''}${r.t.split('\n').map(esc).join('<br>')}${r.lk?'</a>':''}</span>`).join('');
function rgb2hex(s){const m=s.match(/\d+(\.\d+)?/g);if(!m)return s;return'#'+m.slice(0,3).map(x=>Math.round(+x).toString(16).padStart(2,'0')).join('')}
function domToRuns(root){const out=[],rc=getComputedStyle(root).color;
 const fmtOf=el=>{const cs=getComputedStyle(el),w=cs.fontWeight;let ul=false,st=false;const ha=el.closest&&el.closest('a[data-ul]'),h=ha&&root.contains(ha)?LKOK(ha.getAttribute('href')):'';for(let n=el;n&&n!==root.parentNode;n=n.parentElement){if(n.tagName==='A')continue;const d=getComputedStyle(n).textDecorationLine||'';if(d.includes('underline'))ul=true;if(d.includes('line-through'))st=true}return{b:w==='bold'||parseInt(w)>=600,i:cs.fontStyle==='italic'||cs.fontStyle==='oblique',ul,st,c:!h&&cs.color!==rc?rgb2hex(cs.color):null,lk:h||null}};
 const add=(t,f)=>{if(!t)return;const l=out[out.length-1];if(l&&l.b===f.b&&l.i===f.i&&l.ul===f.ul&&l.st===f.st&&(l.c||null)===(f.c||null)&&(l.lk||null)===(f.lk||null))l.t+=t;else{const r={t,b:f.b,i:f.i,ul:f.ul,st:f.st};if(f.c)r.c=f.c;if(f.lk)r.lk=f.lk;out.push(r)}};
 const endsNL=()=>{const l=out[out.length-1];return !l||l.t.endsWith('\n')};
 const walk=n=>{if(n.nodeType===3){add(n.nodeValue.replace(/​/g,''),fmtOf(n.parentElement));return}if(n.nodeType!==1)return;if(n.tagName==='BR'){add('\n',NF);return}
  const blk=/^(DIV|P|LI)$/.test(n.tagName);if(blk&&out.length&&!endsNL())add('\n',NF);n.childNodes.forEach(walk)};
 root.childNodes.forEach(walk);
 const lc=root.lastChild;if(lc&&lc.nodeName==='BR'&&out.length){const l=out[out.length-1];if(l.t.endsWith('\n')){l.t=l.t.slice(0,-1);if(!l.t)out.pop()}}
 return out}
// ---------- properties panel
function props(){
 const sel=[...S.sel].map(i=>S.objs.get(i)).filter(Boolean),f=sel[0],ty=new Set(sel.length?sel.map(o=>o.t):[S.tool==='hl'?'pen':S.tool]);
 const has=(...a)=>a.some(x=>ty.has(x)),show=!RO&&(sel.length||!['select','hand','eraser','image','cmt'].includes(S.tool));
 $('props').style.display=show?(innerWidth>640?'grid':'flex'):'none';if(!show)return;if(window.__placeProps)window.__placeProps();
 const gv=(k,d)=>f?(f[k]??d):(S.d[k]??d),cc=gv('c','ink'),sw=c=>`<button data-c="${c}" class="${c===cc?'on':''}" style="background:${col(c)}"></button>`;
 const LIM={s:[1,999],ww:[0,5000],w:[5,5000],sw:[0,100],bw:[0,100],rd:[0,500]},nvi=(p,v,mn,mx,sc,stp,u,ph='')=>`<span class="nvw"><input type="number" class="nv" data-pn="${p}" data-mn="${mn}" data-mx="${mx}" data-sc="${sc}" step="${stp}" value="${v}" placeholder="${ph}">${u}</span>`;
 const sl=(p,lab,mn,mx,v,sc=1,u='',stp=1)=>{const L=LIM[p]||[mn,mx];return `<div class="pq"><label>${lab}${nvi(p,p==='ww'&&!v?'':Math.round(v),L[0],L[1],sc,stp,u,p==='ww'?'自動':'')}</label><input type="range" data-p="${p}" data-sc="${sc}" data-u="${u}" min="${mn}" max="${mx}" step="${stp}" value="${Math.min(mx,Math.max(mn,v))}"></div>`};
 const onlyImg=ty.size===1&&has('img'),tx=has('text')&&!has('rect','ellipse'),fo=f?(f.fo??(f.fill?.18:0)):S.d.fo;
 let h=`<div class="pgrip" title="拖曳移動面板（雙擊還原位置）"></div><div class="pq full"><label>${onlyImg?'邊框顏色':'顏色'}</label><div class="sw">${[...PAL,...S.recent].map(sw).join('')}<div class="cp" title="自訂調色"><input type="color" data-col="c" value="${hex(cc)}"></div></div></div>`;
 if(has('rect','ellipse','text'))h+=`<div class="row pq full" style="align-items:center;gap:8px"><span style="font-size:11px;color:var(--mut)">${tx?'背景色':'填色'}</span><div class="cp" title="${tx?'背景色':'填色'}"><input type="color" data-col="fc" value="${hex(gv('fc',null)||cc)}"></div><button class="b" style="width:auto;padding:0 8px;font-size:11px;height:24px" data-a="fcauto">同線色</button></div>`;
 if(sel.length===1&&['img','rect','ellipse'].includes(f.t))h+=sl('w','尺寸（寬）',20,1600,f.w);
 if(sel.length===1)h+=`<div class="pq"><label>角度${nvi('r',Math.round(((f.r||0)%360+360)%360),0,360,1,1,'°')}</label></div>`;
 if(has('text')){h+=sl('s','字級',12,160,gv('s',28));h+=sl('ww','換行寬度',0,1200,gv('ww',0)||0,1,'',10);
  const on=k=>(f?fmtOn(f,k):gv(k,false))?' on':'',al=gv('al','left'),ls=gv('ls',''),B=(k,t,tt,sty='')=>`<button class="b sm${on(k)}" data-f="${k}" title="${tt}" style="font-weight:700;${sty}">${t}</button>`,V=(k,v,ico,tt,cur)=>`<button class="b sm${cur===v?' on':''}" data-f="${k}" data-v="${v}" title="${tt}">${ico}</button>`;
  h+=`<div class="row pq" style="gap:3px">${B('b','B','粗體 (Ctrl+B)')}${B('i','I','斜體 (Ctrl+I)','font-style:italic')}${B('ul','U','底線 (Ctrl+U)','text-decoration:underline')}${B('st','S','刪除線','text-decoration:line-through')}<button class="b sm${f&&fmtOn(f,'lk')?' on':''}" data-f="lk" title="文字連結 (Ctrl+K)">連結</button></div><div class="row pq" style="gap:3px">${V('al','left',ic('al1'),'靠左',al)}${V('al','center',ic('al2'),'置中',al)}${V('al','right',ic('al3'),'靠右',al)}${V('ls','bullet',ic('lb'),'項目符號',ls)}${V('ls','number',ic('ln'),'編號清單',ls)}</div><div class="pq"><select data-ff="1">${[['s','預設字體'],['f','襯線體'],['m','等寬體']].map(([v,n])=>`<option value="${v}" ${gv('ff','s')===v?'selected':''}>${n}</option>`).join('')}</select></div><div class="pq full" style="font-size:10px;color:var(--mut)">編輯文字時，選取部分文字再按 B／I／U／S 或顏色，只會套用到選取的字。</div>`}
 if(has('pen','line','arrow'))h+=sl('sw','線寬',1,24,gv('sw',3));
 if(has('rect','ellipse'))h+=sl('sw','邊框粗細',0,24,gv('sw',2));
 if(has('text','img'))h+=sl('bw','邊框粗細',0,16,gv('bw',0));
 if(has('rect','text','img'))h+=sl('rd','圓角',0,100,gv('rd',f&&f.t==='img'?0:10));
 if(has('rect','ellipse','text'))h+=sl('fo',tx?'背景透明度':'填色透明度',0,100,fo*100,100,'%');
 h+=sl('op','透明度',10,100,gv('op',1)*100,100,'%');
 if(sel.length)h+=`<div class="pq"><label>圖層</label><select id="lsel">${[...S.layers].reverse().map(l=>`<option value="${l.id}" ${(f.l||S.layers[0].id)===l.id?'selected':''}>${esc(l.name)}</option>`).join('')}</select></div>`;
 if(sel.length===1&&(f.bn||f.by))h+=`<div id="byl" class="pq" style="font-size:11px;color:var(--mut)">${f.bn?'建立者：'+esc(f.bn):''}</div>`;
 if(AI.on&&sel.some(o=>o.t==='text'||o.t==='img'))h+='<button class="btn pri full" data-a="ai">✦ AI 分析</button>';
 if(sel.length)h+=`<div class="row full"><button class="b" data-a="dup" title="複製 (Ctrl+D)">${ic('dup')}</button><button class="b" data-a="front" title="移到最前 (])">${ic('front')}</button><button class="b" data-a="back" title="移到最後 ([)">${ic('back')}</button><button class="b" data-a="del" title="刪除 (Del)">${ic('del')}</button></div>`;
 $('props').innerHTML=h;if(sel.length===1&&f.by&&!f.bn&&usr)usr.profiles([f.by]).then(p=>{const e=$('byl'),q=p[f.by];if(e&&q)e.textContent='建立者：'+(q.name||'訪客')+(q.isMe?'（你）':'')}).catch(()=>{})}
function setTool(t){if(RO&&!['select','hand'].includes(t)&&!(t==='cmt'&&ROLE!=='view'))return;if(PRES)return;if(t==='image'){$('fi').click();return}finishEdit();S.tool=t;if(t!=='select')S.sel.clear();document.querySelectorAll('#dots [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$('cv').style.cursor=t==='select'?'default':t==='hand'?'grab':t==='text'?'text':'crosshair';closeCmt();props();ovl()}
function setp(k,v){S.d[k]=v;if(k==='c'){chg(o=>{setColor(o,v);return{}})}else chg({[k]:v})}
dAdd('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.t)setTool(b.dataset.t);if(b.dataset.c){if(!applySelColor(col(b.dataset.c)==='var(--ink)'?hex('ink'):b.dataset.c)){setp('c',b.dataset.c)}props()}if(b.dataset.a)act(b.dataset.a)});
dAdd('input',e=>{const t=e.target,p=t.dataset.p;if(t.dataset.col){if(t.dataset.col==='c'&&applySelColor(t.value))return;setp(t.dataset.col,t.value);return}if(!p)return;const v=+t.value;
 if(p==='w')chg(o=>{const r=o.h/o.w,cx=o.x+o.w/2,cy=o.y+o.h/2,h=v*r;return{w:v,h,x:cx-v/2,y:cy-h/2}});else setp(p,v/(+t.dataset.sc||1));
 const nb=t.previousElementSibling.querySelector('.nv');if(nb)nb.value=p==='ww'&&!v?'':Math.round(v)});
dAdd('change',e=>{const t=e.target,p=t.dataset.pn;if(!p)return;if(t.value===''&&p!=='ww'||!isFinite(+t.value))return props();let v=Math.max(+t.dataset.mn,Math.min(+t.dataset.mx,+t.value||0));
 if(p==='w')chg(o=>{const r=o.h/o.w,cx=o.x+o.w/2,cy=o.y+o.h/2,h=v*r;return{w:v,h,x:cx-v/2,y:cy-h/2}});else if(p==='r')chg({r:+(((v%360)+360)%360).toFixed(1)});else setp(p,v/(+t.dataset.sc||1));props();ovl()});
dAdd('change',e=>{const t=e.target;if(t.id==='lsel'){chg({l:t.value});props();return}if(t.dataset.ff){setp('ff',t.value);props();refocus();return}if(t.dataset.col){const v=t.value;if(!PAL.includes(v)&&!S.recent.includes(v)){S.recent.unshift(v);S.recent.length=Math.min(S.recent.length,4);savePrefs()}props();refocus()}else if(t.dataset.p)props()});
// ---------- theme / view
function theme(t){if(t)R.dataset.wb=t;$('bt').innerHTML=ic(R.dataset.wb==='dark'?'sun':'moon');try{localStorage.setItem('wbtheme2',R.dataset.wb)}catch(e){}savePrefs()}
function toggleTheme(){theme(R.dataset.wb==='dark'?'light':'dark')}
$('bt').onclick=toggleTheme;
R.dataset.wb=R.dataset.wb||'dark';
try{const t=localStorage.getItem('wbtheme2');if(t)R.dataset.wb=t}catch(e){}
function applyV(){const v=S.v;$('w').setAttribute('transform',`translate(${v.x} ${v.y}) scale(${v.k})`);const c=$('cv').style,s=24*v.k;while(s<18)s*=2;c.backgroundSize=`${s}px ${s}px`;c.backgroundPosition=`${v.x}px ${v.y}px`;$('bz').textContent=Math.round(v.k*100)+'%';$('zs').value=100*Math.log(v.k/.1)/Math.log(60);ovl();peersEl.forEach(el=>{const d=el._d;if(d)el.style.transform=`translate(${S.v.x+d.x*S.v.k}px,${S.v.y+d.y*S.v.k}px)`});drawCmts();lazyScan();psel()}
const W=e=>({x:(e.clientX-S.v.x)/S.v.k,y:(e.clientY-S.v.y)/S.v.k});
function zoomAt(cx,cy,nk){nk=Math.max(.1,Math.min(6,nk));const v=S.v,wx=(cx-v.x)/v.k,wy=(cy-v.y)/v.k;v.k=nk;v.x=cx-wx*nk;v.y=cy-wy*nk;applyV()}
$('cv').addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey||e.metaKey)zoomAt(e.clientX,e.clientY,S.v.k*Math.exp(-e.deltaY*.01));else{S.v.x-=e.deltaX;S.v.y-=e.deltaY;applyV()}},{passive:false});
$('bz').onclick=()=>{zoomAt(innerWidth/2,innerHeight/2,1)};
$('zi').onclick=()=>zoomAt(innerWidth/2,innerHeight/2,S.v.k*1.25);$('zo').onclick=()=>zoomAt(innerWidth/2,innerHeight/2,S.v.k/1.25);$('zs').oninput=e=>zoomAt(innerWidth/2,innerHeight/2,.1*Math.pow(60,e.target.value/100));$('bf').innerHTML=ic('fit');$('bsn').innerHTML=ic('snap');
const bounds=a=>{let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;a.forEach(o=>{x1=Math.min(x1,o.x);y1=Math.min(y1,o.y);x2=Math.max(x2,o.x+o.w);y2=Math.max(y2,o.y+o.h)});return{x1,y1,x2,y2}};
function fit(){const fr=S.objs.get('fr-'+S.pg),a=fr?[fr]:pgObjs();if(!a.length){S.v={x:0,y:0,k:1};return applyV()}const b=bounds(a),k=Math.min(2,Math.min(innerWidth/(b.x2-b.x1+160),innerHeight/(b.y2-b.y1+240)));S.v={k,x:innerWidth/2-(b.x1+b.x2)/2*k,y:innerHeight/2-(b.y1+b.y2)/2*k};applyV()}
$('bf').onclick=fit;

// ---------- draggable properties panel (desktop)
(function(){const P=$('props');let pos=null;try{pos=JSON.parse(localStorage.getItem('dots-props-pos'))}catch(e){}
 function place(){if(innerWidth<=640){P.style.left=P.style.top=P.style.bottom=P.style.maxHeight=P.style.transform='';return}
  if(pos&&isFinite(pos.x)&&isFinite(pos.y)){const x=Math.max(0,Math.min(innerWidth-120,pos.x)),y=Math.max(0,Math.min(innerHeight-60,pos.y));P.style.left=x+'px';P.style.top=y+'px';P.style.bottom='auto';P.style.transform='none';P.style.maxHeight=Math.max(160,innerHeight-y-14)+'px'}
  else P.style.left=P.style.top=P.style.bottom=P.style.maxHeight=P.style.transform=''}
 window.__placeProps=place;addEventListener('resize',place);
 P.addEventListener('pointerdown',e=>{const g=e.target.closest('.pgrip');if(!g||innerWidth<=640)return;e.preventDefault();const r=P.getBoundingClientRect(),ox=e.clientX-r.left,oy=e.clientY-r.top;try{g.setPointerCapture(e.pointerId)}catch(x){}
  const mv=ev=>{pos={x:ev.clientX-ox,y:ev.clientY-oy};place()},up=()=>{g.removeEventListener('pointermove',mv);g.removeEventListener('pointerup',up);try{localStorage.setItem('dots-props-pos',JSON.stringify(pos))}catch(x){}};g.addEventListener('pointermove',mv);g.addEventListener('pointerup',up)});
 P.addEventListener('dblclick',e=>{if(e.target.closest('.pgrip')){pos=null;try{localStorage.removeItem('dots-props-pos')}catch(x){}place()}})})();
