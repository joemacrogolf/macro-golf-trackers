/* golf-art.js: shared hole and green pictures for the golf pages (Long Game Test, Driver Corridor, Paul Goddard plan).
   Everything is in window.GART. Yards: pin at (0,0), x = right, y = long.
   A green is a smooth blob round its own centre (gx,gy) with radius R(t) = k(1 + a2cos2(t-p2) + a3cos3(t-p3) + a4cos4(t-p4)),
   scaled to the area of a circle of radius r, so it is no easier or harder to hit than a round green of that size.
   makeGreen(r, hazSide, rnd, {pin: max pin offset as a share of the radius, bunkers: false to leave them out}). */
(function(){
var TAU=Math.PI*2;
function gRad(G,t){return G.k*(1+G.a2*Math.cos(2*(t-G.p2))+G.a3*Math.cos(3*(t-G.p3))+G.a4*Math.cos(4*(t-G.p4)))}
function circleG(r){return {k:r,a2:0,a3:0,a4:0,p2:0,p3:0,p4:0,gx:0,gy:0,b:[]}}
function gOf(s){return s.G||circleG(8+0.03*(s.d||150))}
var r3=x=>Math.round(x*1000)/1000;
function makeGreen(r,hazSide,rnd,opt){rnd=rnd||Math.random;opt=opt||{};const pm=opt.pin==null?0.45:opt.pin,nbOk=opt.bunkers!==false;let G;
  for(let n=0;n<300;n++){G={k:1,a2:0.1+rnd()*0.2,p2:rnd()*Math.PI,a3:rnd()*0.15,p3:rnd()*TAU,a4:rnd()*0.06,p4:rnd()*TAU,gx:0,gy:0,b:[]};
    let A=0,mn=9;for(let i=0;i<90;i++){const q=gRad(G,i/90*TAU);A+=q*q;mn=Math.min(mn,q)}A*=Math.PI/90;if(mn>=0.62)break}
  let A=0;for(let i=0;i<90;i++){const q=gRad(G,i/90*TAU);A+=q*q}A*=Math.PI/90;G.k=r/Math.sqrt(A/Math.PI);
  /* the pin: somewhere on the green, at least 4 yds from the edge */
  const ang=rnd()*TAU,off=Math.max(0,Math.min(rnd()*pm*gRad(G,ang),gRad(G,ang)-4));G.gx=-Math.cos(ang)*off;G.gy=-Math.sin(ang)*off;
  /* 0 to 2 greenside bunkers, never on the water / OB side */
  const nb=!nbOk?0:rnd()<0.3?0:rnd()<0.65?1:2;
  for(let i=0,tries=0;i<nb&&tries<40;tries++){const bt=rnd()*TAU,sg=hazSide==="L"?-1:hazSide==="R"?1:0;
    if(sg&&Math.cos(bt)*sg>-0.2)continue;if(G.b.some(b=>Math.abs(Math.atan2(Math.sin(b.t-bt),Math.cos(b.t-bt)))<1.2))continue;
    const ry=2.5+rnd()*1.2;G.b.push({t:r3(bt),d:r3(gRad(G,bt)+2+ry),rx:r3(4.5+rnd()*3),ry:r3(ry)});i++}
  ["k","a2","p2","a3","p3","a4","p4","gx","gy"].forEach(x=>G[x]=r3(G[x]));return G}
/* signed distance (yds) outside the green edge: 0 or less = on the green */
function gEdge(G,x,y){const dx=x-G.gx,dy=y-G.gy;return Math.hypot(dx,dy)-gRad(G,Math.atan2(dy,dx))}
function bunkC(G,b){return [G.gx+b.d*Math.cos(b.t),G.gy+b.d*Math.sin(b.t)]}
function inBunker(G,x,y){return (G.b||[]).some(b=>{const [cx,cy]=bunkC(G,b),vx=x-cx,vy=y-cy,a=(-vx*Math.sin(b.t)+vy*Math.cos(b.t))/b.rx,c=(vx*Math.cos(b.t)+vy*Math.sin(b.t))/b.ry;return a*a+c*c<=1})}
/* how far the green, its fringe and bunkers reach to one side of the pin */
function gReach(G,sg){let m=0;for(let i=0;i<90;i++){const t=i/90*TAU;m=Math.max(m,sg*(G.gx+(gRad(G,t)+2)*Math.cos(t)))}
  (G.b||[]).forEach(b=>{const [cx]=bunkC(G,b);m=Math.max(m,sg*cx+Math.max(b.rx,b.ry))});return m}
function rng(seed){let x=Math.abs(Math.round(seed*7919))%2147483646+1;return()=>(x=x*16807%2147483647)/2147483647}
var pth=a=>"M"+a.map(q=>q[0].toFixed(1)+" "+q[1].toFixed(1)).join("L")+"Z";
var LGC={deep:"#1f4a2a",tree:"#173a21",tree2:"#2a5a33",rough:"#3f7d46",fw:"#6db05c",fw2:"#79bb67",fringe:"#7fc46c",green:"#98d886",green2:"#a6e092",water:"#2b7fc4",water2:"#5aa3dd",sand:"#ecdfb3",lip:"#c9b680",ink:"#0B0B0B",white:"#FFFFFF",gold:"#FFD900",red:"#E0402B"};
function svgT(x,y,str,o={}){return `<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif" font-size="${o.s||10}" font-weight="${o.w||700}" text-anchor="${o.a||"middle"}" fill="${o.c||LGC.white}" letter-spacing=".5"${o.halo?' paint-order="stroke" stroke="rgba(0,0,0,.45)" stroke-width="3"':""}>${str}</text>`}
/* the green, its fringe, mowing stripes, bunkers and the flag. map(x,y) turns yards (pin at 0,0) into pixels, px = pixels per yard */
function greenSVG(G,map,px,id){const C=LGC;let g="";const ring=pad=>{const a=[];for(let i=0;i<96;i++){const t=i/96*TAU,R=gRad(G,t)+pad;a.push(map(G.gx+R*Math.cos(t),G.gy+R*Math.sin(t)))}return a};
  (G.b||[]).forEach(b=>{const [cx,cy]=bunkC(G,b),a=[],l=[];for(let i=0;i<40;i++){const u=i/40*TAU,w=1+0.07*Math.sin(3*u+b.t*5),ex=b.rx*w*Math.cos(u),ey=b.ry*w*Math.sin(u);
      const x=cx-ex*Math.sin(b.t)+ey*Math.cos(b.t),y=cy+ex*Math.cos(b.t)+ey*Math.sin(b.t);a.push(map(x,y));const x2=cx-(ex+0.6)*Math.sin(b.t)+(ey+0.6)*Math.cos(b.t),y2=cy+(ex+0.6)*Math.cos(b.t)+(ey+0.6)*Math.sin(b.t);l.push(map(x2,y2))}
    g+=`<path d="${pth(l)}" fill="${C.lip}"/><path d="${pth(a)}" fill="${C.sand}"/>`});
  const gp=pth(ring(0));g+=`<path d="${pth(ring(2))}" fill="${C.fringe}"/><clipPath id="${id}"><path d="${gp}"/></clipPath><path d="${gp}" fill="${C.green}"/>`;
  const [x0,y0]=map(G.gx,G.gy),w=Math.max(4,px*3);let st="";for(let k=-12;k<=12;k+=2)st+=`<rect x="${x0-200}" y="${y0+k*w}" width="400" height="${w}" fill="${C.green2}"/>`;
  g+=`<g clip-path="url(#${id})" opacity=".55">${st}</g><path d="${gp}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1"/>`;
  const [fx,fy]=map(0,0),fl=Math.max(14,px*6);g+=`<ellipse cx="${fx}" cy="${fy}" rx="2.6" ry="1.8" fill="${C.ink}"/><line x1="${fx}" y1="${fy}" x2="${fx}" y2="${fy-fl}" stroke="${C.white}" stroke-width="1.6"/><path d="M${fx} ${fy-fl} l${fl*0.5} ${fl*0.17} -${fl*0.5} ${fl*0.17}z" fill="${C.gold}"/>`;
  return g}
function ballSVG(x,y){return `<ellipse cx="${x+1.5}" cy="${y+2.5}" rx="5.5" ry="3" fill="rgba(0,0,0,.3)"/><circle cx="${x}" cy="${y}" r="5.5" fill="${LGC.white}" stroke="${LGC.ink}" stroke-width="2"/>`}
function holeSVG(s,ball){
  const C=LGC,T=svgT,R=rng((s.L||s.d)+(s.G?s.G.p3*100:0)),uid="g"+Math.floor(Math.random()*1e9);
  if(s.kind==="tee"){
    const W=300,H=ball?260:310,top=48,bot=H-24,L=s.L,sy=(bot-top)/L,X=y=>150+y*2.3,Y=d=>bot-d*sy,fh=s.fwHalf,h=s.haz,G=gOf(s);
    const sg=h?(h.side==="L"?-1:1):0,ph=R()*6;
    let g=`<rect width="${W}" height="${H}" fill="${C.deep}"/>`;
    /* trees down both sides (not where the water is) */
    for(let i=0;i<46;i++){const side=i%2?1:-1;if(h&&h.type==="water"&&side===sg&&i<40)continue;const d=R()*L*1.02,y=Y(d),edge=X(side*(fh+22+R()*8)),x=side<0?edge-8-R()*(edge-8):edge+8+R()*(W-edge-8),rr=6+R()*6;
      if(Math.abs(x-150)<(fh+24)*2.3)continue;g+=`<circle cx="${x}" cy="${y}" r="${rr}" fill="${C.tree}"/><circle cx="${x-rr*0.25}" cy="${y-rr*0.25}" r="${rr*0.6}" fill="${C.tree2}"/>`}
    /* rough and fairway with soft, wandering edges */
    const edge=(half,wob,d0,d1,taper)=>{const Lp=[],Rp=[];for(let d=d0;d<=d1;d+=8){const f=taper?Math.min(1,Math.sqrt(Math.max(0,(d-d0))/14),Math.sqrt(Math.max(0,(d1-d))/14)):1,w=half*Math.max(.25,f)+wob*Math.sin(d/41+ph)+wob*0.6*Math.sin(d/17+ph*2);Lp.push([X(-w),Y(d)]);Rp.push([X(w+wob*0.5*Math.sin(d/23+ph))+0,Y(d)])}return pth(Lp.concat(Rp.reverse()))};
    g+=`<path d="${edge(fh+20,2.5,-6,L+12,false)}" fill="${C.rough}"/>`;
    const f0=Math.min(110,L*0.3),fd=edge(fh,1.2,f0,L-22,true);
    g+=`<clipPath id="${uid}f"><path d="${fd}"/></clipPath><path d="${fd}" fill="${C.fw}"/><g clip-path="url(#${uid}f)">`;for(let d=f0;d<L;d+=40)g+=`<rect x="0" y="${Y(d+20)}" width="${W}" height="${Y(d)-Y(d+20)}" fill="${C.fw2}"/>`;g+=`</g>`;
    /* the green end of the hole */
    const gs=2.3*0.7,gx=150,gy=Y(L);g+=greenSVG(G,(x,y)=>[gx+x*gs,gy-y*gs],gs,uid+"g");
    /* tee box */
    g+=`<rect x="138" y="${bot+1}" width="24" height="12" rx="3" fill="${C.fw2}"/><circle cx="144" cy="${bot+6}" r="2" fill="${C.white}"/><circle cx="156" cy="${bot+6}" r="2" fill="${C.white}"/>`;
    if(h){
      if(h.type==="water"){const x1=X(sg*h.line),x2=sg<0?-4:W+4,yA=Y(L-5),yB=Y(Math.max(80,L*0.3));g+=waterSVG(x1,sg,yA,yB,x2,ph);g+=T((x1+sg*8+x2)/2,Y(L*0.55),"WATER",{s:10,halo:1})}
      if(h.type==="ob"){const x1=X(sg*h.line);g+=`<line x1="${x1}" y1="${Y(L+10)}" x2="${x1}" y2="${Y(40)}" stroke="${C.white}" stroke-width="1.5" stroke-dasharray="2 6" opacity=".85"/>`;for(let d=60;d<L+10;d+=35)g+=`<rect x="${x1-1.5}" y="${Y(d)-7}" width="3" height="11" fill="${C.white}"/><rect x="${x1-1.5}" y="${Y(d)+3}" width="3" height="2" fill="${C.ink}" opacity=".5"/>`;
        g+=T(sg<0?x1-16:x1+16,Y(L*0.55),"OB",{s:10,halo:1})}
      if(h.type==="bunker"){const xi=X(sg*h.inner),xo=X(sg*h.outer),cy=(Y(h.from)+Y(h.to))/2,rx=Math.abs(xo-xi)/2,ry=(Y(h.from)-Y(h.to))/2,cx=(xi+xo)/2,a=[],l=[];
        for(let i=0;i<40;i++){const u=i/40*TAU,w=1+0.08*Math.sin(3*u+ph);a.push([cx+rx*w*Math.cos(u),cy+ry*w*Math.sin(u)]);l.push([cx+(rx*w+2)*Math.cos(u),cy+(ry*w+2)*Math.sin(u)])}
        g+=`<path d="${pth(l)}" fill="${C.lip}"/><path d="${pth(a)}" fill="${C.sand}"/>`+T(sg<0?Math.min(xi,xo)-5:Math.max(xi,xo)+5,cy+3,h.from+"–"+h.to,{s:9,a:sg<0?"end":"start",halo:1})}}
    const lft=h&&h.side==="R";for(let d=100;d<L-30;d+=50){const y=Y(d);g+=lft?`<line x1="14" y1="${y}" x2="26" y2="${y}" stroke="${C.white}" stroke-width="1" opacity=".7"/>`+T(30,y+3,d,{s:9,a:"start",w:600,halo:1}):`<line x1="${W-26}" y1="${y}" x2="${W-14}" y2="${y}" stroke="${C.white}" stroke-width="1" opacity=".7"/>`+T(W-30,y+3,d,{s:9,a:"end",w:600,halo:1})}
    if(ball){const tot=ball.c,bx=X(Math.max(-62,Math.min(62,ball.o))),by=Y(Math.min(L+10,tot));
      g+=`<path d="M150 ${bot} Q ${(150+bx)/2} ${(bot+by)/2-30} ${bx} ${by}" fill="none" stroke="${C.gold}" stroke-width="2" stroke-dasharray="4 4"/>`+ballSVG(bx,by)}
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${s.L} yard hole${h?", "+h.name.toLowerCase():""}">${g}</svg>`;
  }
  /* approach: looking down on the green, centred on it */
  const G=gOf(s),h=s.haz,sg=h?(h.side==="L"?-1:1):0,W=300,H=ball?190:220,ph=R()*6;
  let ext=0,ey=0;for(let i=0;i<90;i++){const t=i/90*TAU,q=gRad(G,t)+2;ext=Math.max(ext,Math.abs(q*Math.cos(t)));ey=Math.max(ey,Math.abs(q*Math.sin(t)))}
  (G.b||[]).forEach(b=>{const [cx,cy]=bunkC(G,b);ext=Math.max(ext,Math.abs(cx-G.gx)+b.rx);ey=Math.max(ey,Math.abs(cy-G.gy)+b.rx)});
  const needX=Math.max(ext+6,h?Math.abs(sg*h.line-G.gx)+8:0),k=Math.min(4.4,136/needX,(H/2-26)/(ey+3)),cx=150,cy=H/2-6;
  const X=x=>cx+(x-G.gx)*k,Y=y=>cy-(y-G.gy)*k,map=(x,y)=>[X(x),Y(y)];
  let g=`<rect width="${W}" height="${H}" fill="${C.rough}"/>`;
  for(let i=0;i<26;i++){const x=R()*W,y=R()*H;if(Math.abs(x-cx)<(ext+4)*k&&Math.abs(y-cy)<(ey+4)*k)continue;g+=`<circle cx="${x}" cy="${y}" r="${1.5+R()*3}" fill="#376f3e" opacity=".7"/>`}
  /* fairway running up to the front of the green */
  let front=0,half=0;for(let i=0;i<90;i++){const t=i/90*TAU,q=gRad(G,t);front=Math.min(front,G.gy+q*Math.sin(t)-G.gy);half=Math.max(half,q*Math.abs(Math.cos(t)))}
  const fwHalf=Math.max(7,half*0.75),fy=G.gy+front+4,fa=[];for(let y=fy;y>=G.gy-80;y-=4)fa.push([X(G.gx-fwHalf-1.5*Math.sin(y/9+ph)),Y(y)]);const fb=[];for(let y=G.gy-80;y<=fy;y+=4)fb.push([X(G.gx+fwHalf+1.5*Math.sin(y/11+ph)),Y(y)]);
  g+=`<path d="${pth(fa.concat(fb))}" fill="${C.fw}"/>`;
  if(h){const x1=X(sg*h.line),x2=sg<0?-4:W+4;
    if(h.type==="ob"){g+=`<rect x="${Math.min(x1,x2)}" y="0" width="${Math.abs(x2-x1)}" height="${H}" fill="${C.deep}"/>`;for(let i=0;i<10;i++){const tx=x1+sg*(10+R()*(Math.abs(x2-x1)-10)),ty=R()*H,rr=6+R()*6;g+=`<circle cx="${tx}" cy="${ty}" r="${rr}" fill="${C.tree}"/><circle cx="${tx-rr*.25}" cy="${ty-rr*.25}" r="${rr*.6}" fill="${C.tree2}"/>`}
      g+=`<line x1="${x1}" y1="0" x2="${x1}" y2="${H}" stroke="${C.white}" stroke-width="1.5" stroke-dasharray="2 6" opacity=".85"/>`;for(let y=14;y<H;y+=34)g+=`<rect x="${x1-1.5}" y="${y}" width="3" height="11" fill="${C.white}"/>`;g+=T(x1+sg*16,cy+3,"OB",{s:10,halo:1})}
    else{g+=waterSVG(x1,sg,-30,H+30,x2,ph);g+=T((x1+sg*8+x2)/2,cy+3,"WATER",{s:10,halo:1})}}
  g+=greenSVG(G,map,k,uid);
  const lab=s.d+" yds to the flag";g+=`<rect x="${cx-58}" y="${H-24}" width="116" height="18" rx="9" fill="rgba(0,0,0,.45)"/>`+T(cx,H-11.5,lab,{s:10,w:600});
  if(ball){const bx=Math.max(8,Math.min(W-8,X(ball.o))),by=Math.max(8,Math.min(H-8,Y(ball.c-s.d)));
    g+=`<path d="M${cx} ${H+10} Q ${(cx+bx)/2} ${(H+by)/2-20} ${bx} ${by}" fill="none" stroke="${C.gold}" stroke-width="2" stroke-dasharray="4 4"/>`+ballSVG(bx,by)}
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Green, ${s.d} yards${h?", "+h.name.toLowerCase():""}">${g}</svg>`;
}
/* a tree seen from above */
function treeSVG(x,y,r){return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${LGC.tree}"/><circle cx="${(x-r*0.25).toFixed(1)}" cy="${(y-r*0.25).toFixed(1)}" r="${(r*0.6).toFixed(1)}" fill="${LGC.tree2}"/>`}
/* trees scattered over a box, skipping anything keep(x,y) says to leave clear */
function treesSVG(R,n,x0,x1,y0,y1,keep){let g="";for(let i=0;i<n;i++){const x=x0+R()*(x1-x0),y=y0+R()*(y1-y0),r=6+R()*6;if(keep&&keep(x,y,r))continue;g+=treeSVG(x,y,r)}return g}
/* smooth path through points (Catmull-Rom as cubic Beziers) */
function smooth(p){if(p.length<3)return "M"+p.map(q=>q[0].toFixed(1)+" "+q[1].toFixed(1)).join("L");let d=`M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for(let i=0;i<p.length-1;i++){const a=p[Math.max(0,i-1)],b=p[i],c=p[i+1],e=p[Math.min(p.length-1,i+2)];
    d+=`C${(b[0]+(c[0]-a[0])/6).toFixed(1)} ${(b[1]+(c[1]-a[1])/6).toFixed(1)} ${(c[0]-(e[0]-b[0])/6).toFixed(1)} ${(c[1]-(e[1]-b[1])/6).toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`}return d}
var wid=0;
/* ripples scattered over the water, away from the bank */
function ripples(R,n,inside){let g="";for(let i=0,k=0;i<n&&k<n*6;k++){const x=R.x0+R()*(R.x1-R.x0),y=R.y0+R()*(R.y1-R.y0);if(!inside(x,y))continue;const w=6+R()*7;
  g+=`<path d="M${(x-w).toFixed(1)} ${y.toFixed(1)} q${(w/2).toFixed(1)} -3 ${w.toFixed(1)} 0 t${w.toFixed(1)} 0" fill="none" stroke="${LGC.water2}" stroke-width="1.3" stroke-linecap="round" opacity="${(0.45+R()*0.4).toFixed(2)}"/>`;i++}return g}
/* water to one side of a hazard line at x (pixels), from y0 to y1, on side sg (-1 left, +1 right) out to xOut.
   The shoreline wanders only INTO the water (the line itself is where the penalty starts) and the ends are rounded off */
function waterSVG(x,sg,y0,y1,xOut,ph,stakes){ph=ph||0;const id="gw"+(++wid),R0=Math.min(22,(y1-y0)/2.5),a=[];
  const far=sg>0?Math.max(xOut,x+40):Math.min(xOut,x-40),span=Math.abs(far-x);
  /* the bank all the way round: in from the far edge along the top, down the hazard side, back out along the bottom.
     Every point sits on or inside the hazard area, so the picture never shows water where the ball would be safe */
  const cap=(yE,dir,rev)=>{const q=[];for(let k=0;k<=8;k++){const u=k/8,xx=far+(x-far)*u*0.75,yy=yE+dir*(3+5*Math.sin(u*Math.PI*1.4+ph+(dir>0?0:2))*Math.sin(u*Math.PI)+R0*0.35*u*u);q.push([xx,yy])}return rev?q.reverse():q};
  const top=y0>-20?cap(y0,1,false):[[far,y0]],bot=y1<9e3&&y1<y0+2000?cap(y1,-1,true):[[far,y1]];
  for(let y=y0;y<=y1+0.01;y+=4){const dy=Math.min(y-y0,y1-y),end=dy<R0?R0-Math.sqrt(Math.max(0,R0*R0-(R0-dy)*(R0-dy))):0,
    w=3.2+1.8*Math.sin(y/17+ph)+1.1*Math.sin(y/6.1+ph*2.3);a.push([x+sg*(w+end*(1+span/120)),y])}
  const ring=top.concat(a.slice(2,-2)).concat(bot),path=smooth(ring)+"Z",shore=smooth(a);
  let g=`<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x}" y1="0" x2="${far}" y2="0"><stop offset="0" stop-color="#4fa3e2"/><stop offset=".3" stop-color="${LGC.water}"/><stop offset="1" stop-color="#1c5f9e"/></linearGradient></defs>`;
  g+=`<path d="${path}" fill="url(#${id})"/><path d="${smooth(ring)}" fill="none" stroke="#bfe2f8" stroke-width="2" opacity=".75"/>`;
  const R=rng(ph*1000+y0);R.x0=Math.min(x,far);R.x1=Math.max(x,far);R.y0=y0+R0;R.y1=y1-R0;
  g+=ripples(R,Math.max(2,Math.round((y1-y0)/30)),(px,py)=>sg*(px-x)>16&&Math.abs(px-far)>8);
  if(stakes!==false)for(let y=y0+R0;y<y1-R0;y+=34)g+=`<rect x="${x-1.5}" y="${y}" width="3" height="10" fill="${LGC.red}"/>`;return g}
/* a burn across the hole between y1 (far bank) and y2 (near bank), x0 to x1, banks wander outward only */
function creekSVG(x0,x1,y1,y2,ph){ph=ph||0;const id="gw"+(++wid),top=[],bot=[];
  for(let x=x0;x<=x1+0.01;x+=6){top.push([x,y1-(1.6+1.2*Math.sin(x/21+ph)+0.7*Math.sin(x/7+ph*2))]);bot.push([x,y2+(1.6+1.2*Math.sin(x/25+ph*1.7)+0.7*Math.sin(x/8+ph))])}
  let g=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d93d6"/><stop offset=".5" stop-color="#1f68a8"/><stop offset="1" stop-color="#3d93d6"/></linearGradient></defs>`;
  const back=bot.slice().reverse();g+=`<path d="${smooth(top)}L${back[0][0]} ${back[0][1]}${smooth(back).replace(/^M[^C]*/,"")}Z" fill="url(#${id})"/>`;
  g+=`<path d="${smooth(top)}" fill="none" stroke="#bfe2f8" stroke-width="1.6" opacity=".75"/><path d="${smooth(bot)}" fill="none" stroke="#bfe2f8" stroke-width="1.6" opacity=".75"/>`;
  const R=rng(ph*1000+y1);R.x0=x0;R.x1=x1;R.y0=y1+3;R.y1=y2-3;g+=ripples(R,Math.round((x1-x0)/70),()=>true);return g}
/* white OB stakes along a vertical line */
function obSVG(x,y0,y1){let g=`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="${LGC.white}" stroke-width="1.5" stroke-dasharray="2 6" opacity=".85"/>`;
  for(let y=y0+12;y<y1-8;y+=34)g+=`<rect x="${x-1.5}" y="${y}" width="3" height="11" fill="${LGC.white}"/><rect x="${x-1.5}" y="${y+11}" width="3" height="2" fill="${LGC.ink}" opacity=".5"/>`;return g}
/* a bunker of any ellipse (pixels), with a darker lip */
function bunkerSVG(cx,cy,rx,ry,ph){const a=[],l=[];for(let i=0;i<40;i++){const u=i/40*TAU,w=1+0.08*Math.sin(3*u+(ph||0));a.push([cx+rx*w*Math.cos(u),cy+ry*w*Math.sin(u)]);l.push([cx+(rx*w+2)*Math.cos(u),cy+(ry*w+2)*Math.sin(u)])}
  return `<path d="${pth(l)}" fill="${LGC.lip}"/><path d="${pth(a)}" fill="${LGC.sand}"/>`}
window.GART={TAU,C:LGC,rng,pth,r3,gRad,circleG,gOf,makeGreen,gEdge,bunkC,inBunker,gReach,text:svgT,greenSVG,ballSVG,holeSVG,treeSVG,treesSVG,waterSVG,creekSVG,smooth,obSVG,bunkerSVG};
})();
