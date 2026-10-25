// ---------- render
const IMG=new Map(),TINY='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
function pathOf(o){const p=o.pts;if(p.length<2)return`M${p[0][0]} ${p[0][1]}l.01 0`;let d=`M${p[0][0]} ${p[0][1]}`;for(let i=1;i<p.length-1;i++){const a=p[i],b=p[i+1];d+=`Q${a[0]} ${a[1]} ${(a[0]+b[0])/2} ${(a[1]+b[1])/2}`}const l=p[p.length-1];return d+`L${l[0]} ${l[1]}`}
const imgSrc=o=>o.src||(o.iid&&IMG.get(o.iid))||null;
function paint(o){if((o.pg||PGS[0].id)!==S.pg){unpaint(o.id);return}let g=els.get(o.id);if(!g){g=document.createElementNS(NS,'g');g.dataset.id=o.id;els.set(o.id,g);layerEl(o.t==='frame'?'__f':o.l).appendChild(g)}
 const c=col(o.c),st0=`stroke="${c}" stroke-width="${o.sw??2}" stroke-linecap="round" stroke-linejoin="round"`,st=st0+' fill="none"';
 const fo=o.fo??(o.fill?.18:0),fcl=col(o.fc||o.c);
 if(o.t==='text'){g.innerHTML=textSVG(o,c,0);const bb=g.firstChild.getBBox();o.w=o.ww>0?o.ww:Math.max(8,bb.width);o.h=Math.max(8,bb.height+o.s*.2);const pd=10;
  g.innerHTML=(fo>0||o.bw>0?`<rect x="${-pd}" y="${-pd}" width="${o.w+2*pd}" height="${o.h+2*pd}" rx="${Math.min(o.rd??10,o.w/2+pd,o.h/2+pd)}" fill="${fo>0?fcl:'none'}" fill-opacity="${fo}" stroke="${o.bw>0?c:'none'}" stroke-width="${o.bw||0}" pointer-events="all"/>`:'')+(o.ww>0?`<rect width="${o.w}" height="${o.h}" fill="none" pointer-events="all"/>`:'')+textSVG(o,c,o.w)}
 else if(o.t==='img'){let im=g.querySelector('image');if(!im){g.innerHTML=`<clipPath id="cp${o.id}"><rect/></clipPath><image preserveAspectRatio="none" clip-path="url(#cp${o.id})"/><rect fill="none" class="bd"/>`;im=g.querySelector('image')}
  const s=imgSrc(o),want=s||o.th||TINY;if(im.getAttribute('href')!==want)im.setAttribute('href',want);g.dataset.ph=s?'':'1';if(!s)need(o);
  im.setAttribute('width',o.w);im.setAttribute('height',o.h);const rx=Math.min(o.rd||0,o.w/2,o.h/2),bd=g.querySelector('.bd');[g.querySelector('clipPath rect'),bd].forEach(r=>{r.setAttribute('width',o.w);r.setAttribute('height',o.h);r.setAttribute('rx',rx)});bd.setAttribute('stroke',c);bd.setAttribute('stroke-width',o.bw||0);if(!s)bd.setAttribute('fill','rgba(128,128,128,.12)');else bd.setAttribute('fill','none')}
 else if(o.t==='frame'){g.innerHTML=`<rect width="${o.w}" height="${o.h}" rx="10" fill="var(--page)" stroke="rgba(128,128,128,.32)"/>`}
 else if(o.t==='rect'||o.t==='ellipse'){const fl=`fill="${fo>0?fcl:'none'}" fill-opacity="${fo}" pointer-events="all"`;g.innerHTML=o.t==='rect'?`<rect width="${o.w}" height="${o.h}" rx="${Math.min(o.rd??10,o.w/2,o.h/2)}" ${st0} ${fl}/>`:`<ellipse cx="${o.w/2}" cy="${o.h/2}" rx="${o.w/2}" ry="${o.h/2}" ${st0} ${fl}/>`}
 else{const d=pathOf(o);g.innerHTML=`<path d="${d}" stroke="transparent" stroke-width="${Math.max(14,o.sw+8)}" fill="none" stroke-linecap="round"/><path d="${d}" ${st} ${o.hl?'stroke-opacity=".35"':''}/>`+(o.t==='arrow'?arrowHead(o,c):'')}
 g.setAttribute('transform',`translate(${o.x} ${o.y}) rotate(${o.r||0} ${o.w/2} ${o.h/2})`);g.setAttribute('opacity',o.op??1);
 const L=layerEl(o.t==='frame'?'__f':o.l),z=o.z||0;if(g.parentNode!==L||g._z!==z){g._z=z;let n=[...L.children].find(x=>x!==g&&(x._z||0)>z);L.insertBefore(g,n||null)}}
function arrowHead(o,c){const p=o.pts,a=p[0],b=p[p.length-1],t=Math.atan2(b[1]-a[1],b[0]-a[0]),s=10+o.sw*2;return`<path d="M${b[0]-s*Math.cos(t-.45)} ${b[1]-s*Math.sin(t-.45)}L${b[0]} ${b[1]}L${b[0]-s*Math.cos(t+.45)} ${b[1]-s*Math.sin(t+.45)}" stroke="${c}" stroke-width="${o.sw}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`}
function unpaint(id){const g=els.get(id);if(g)g.remove();els.delete(id)}
let raf=0;function ovl(){cancelAnimationFrame(raf);raf=requestAnimationFrame(drawOvl)}
function drawOvl(){const O=$('O'),k=S.v.k;let h='';if(PRES||RO){O.innerHTML='';return}const sel=[...S.sel].map(i=>S.objs.get(i)).filter(Boolean);
 sel.forEach(o=>{h+=`<g transform="translate(${o.x} ${o.y}) rotate(${o.r||0} ${o.w/2} ${o.h/2})" pointer-events="none"><rect width="${o.w}" height="${o.h}" fill="none" stroke="#3b82f6" stroke-width="${1.5/k}" ${sel.length>1?`stroke-dasharray="${4/k}"`:''}/>`;
  if(sel.length===1)h+=[[0,0,'nw'],[o.w,0,'ne'],[0,o.h,'sw'],[o.w,o.h,'se']].map(([x,y,n])=>`<rect data-h="${n}" pointer-events="all" x="${x-5/k}" y="${y-5/k}" width="${10/k}" height="${10/k}" rx="${2/k}" fill="#fff" stroke="#3b82f6" stroke-width="${1.5/k}" style="cursor:${n==='nw'||n==='se'?'nwse':'nesw'}-resize"/>`).join('')+`<line x1="${o.w/2}" y1="0" x2="${o.w/2}" y2="${-22/k}" stroke="#3b82f6" stroke-width="${1.5/k}"/><circle data-h="rot" pointer-events="all" cx="${o.w/2}" cy="${-22/k}" r="${6/k}" fill="#fff" stroke="#3b82f6" stroke-width="${1.5/k}" style="cursor:grab"/>`;h+='</g>'});O.innerHTML=h}
function render(){els.forEach((g,id)=>{if(!S.objs.has(id))unpaint(id)});S.objs.forEach(paint);ovl();lazyScan()}
// ---------- lazy image loading (images live in their own documents)
const IQ=[],IFLY=new Set(),UP=new Set();let lzT=0;
function need(o){if(!o.iid||IMG.has(o.iid)||IFLY.has(o.iid)||!db)return;if(!IQ.includes(o.iid))IQ.push(o.iid);pump()}
function visible(o){const k=S.v.k,x=o.x*k+S.v.x,y=o.y*k+S.v.y,m=innerWidth*.5;return x<innerWidth+m&&x+o.w*k>-m&&y<innerHeight+m&&y+o.h*k>-m}
function lazyScan(){if(!db||lzT)return;lzT=setTimeout(()=>{lzT=0;S.objs.forEach(o=>{if(o.t==='img'&&!imgSrc(o)&&(o.pg||PGS[0].id)===S.pg&&visible(o))need(o)})},120)}
function pump(){while(IFLY.size<3&&IQ.length){const id=IQ.shift();if(IMG.has(id))continue;IFLY.add(id);db.doc(BP+'imgs/'+id).get().then(s=>{IFLY.delete(id);if(s.exists&&s.data().d){IMG.set(id,s.data().d);S.objs.forEach(o=>{if(o.iid===id&&!o.src){const g=els.get(o.id);if(g)paint(o)}})}else{IMG.set(id,TINY)}pump()}).catch(()=>{IFLY.delete(id);setTimeout(()=>{if(db)need({iid:id})},4000);pump()})}}
async function loadImgs(a){const ids=[...new Set(a.filter(o=>o.t==='img'&&o.iid&&!imgSrc(o)).map(o=>o.iid))];if(!ids.length||!db)return;await Promise.all(ids.map(async id=>{if(IMG.has(id))return;try{const s=await db.doc(BP+'imgs/'+id).get();if(s.exists&&s.data().d)IMG.set(id,s.data().d)}catch(e){}}))}
async function upImg(o){if(!db||!o.src)return;if(!o.iid)o.iid=rid();if(UP.has(o.iid))return;await db.doc(BP+'imgs/'+o.iid).set({d:o.src});UP.add(o.iid);IMG.set(o.iid,o.src)}
