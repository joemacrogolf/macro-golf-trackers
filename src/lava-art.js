/* lava-art.js: the picture of each ball in Lava (pages/golf-left-is-lava.html).
   Overhead view of the green for that ball's distance, with the lava where the player set it:
   L / R: everything more than 10 yds off the pin line on that side; S: more than 10% short; G: more than 10% long
   (exactly where the scoring puts "In the lava"). Every ball gets its own green shape (golf-art.js makeGreen, seeded).
   LavaArt.svg({t, lava, seed, ball:{x,y} | null, ghost, label}) -> SVG string. Yards: pin at (0,0), x = right, y = long. */
(function(){
if(window.LavaArt)return;
var W=340,H=250,PX=4.4,CX=170,CY=128;
function map(x,y){return [CX+x*PX,CY-y*PX]}
function rng(seed){var x=Math.abs(Math.round(seed*7919))%2147483646+1;return function(){return (x=x*16807%2147483647)/2147483647}}
function f(n){return n.toFixed(1)}
/* the edge of the lava: a wavy line, as points in yards */
function edgePts(lava,t,R){var pts=[],ph=R()*6,amp=0.9+R()*0.7,i,v;
  if(lava==="L"||lava==="R"){var sg=lava==="L"?-1:1;for(i=0;i<=40;i++){v=-40+i*2;pts.push([sg*(10+amp*Math.sin(v/3.1+ph)+0.6*Math.sin(v/1.4+ph*2)),v])}return pts}
  var d=Math.max(5,0.1*t),sy=lava==="S"?-1:1;for(i=0;i<=40;i++){v=-40+i*2;pts.push([v,sy*(d+amp*Math.sin(v/3.3+ph)+0.6*Math.sin(v/1.5+ph*2))])}return pts}
/* the lava area as a polygon in pixels, closed off past the edge of the picture */
function lavaPoly(lava,pts){var P=pts.map(function(p){return map(p[0],p[1])}),out;
  if(lava==="L")out=P.concat([[-20,P[P.length-1][1]],[-20,P[0][1]]]);
  else if(lava==="R")out=P.concat([[W+20,P[P.length-1][1]],[W+20,P[0][1]]]);
  else if(lava==="S")out=P.concat([[P[P.length-1][0],H+20],[P[0][0],H+20]]);
  else out=P.concat([[P[P.length-1][0],-20],[P[0][0],-20]]);
  return "M"+out.map(function(p){return f(p[0])+" "+f(p[1])}).join("L")+"Z"}
function inLava(lava,t,x,y){if(lava==="L")return x<-10;if(lava==="R")return x>10;if(lava==="S")return y<-Math.max(5,0.1*t);return y>Math.max(5,0.1*t)}
function svg(o){
  var t=o.t||150,lava=o.lava||"L",R=rng((o.seed||1)*13+t),uid="la"+Math.floor(Math.random()*1e9),G=window.GART;
  var g='<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The green, with the lava '+({L:"left",R:"right",S:"short",G:"long"}[lava])+'">';
  g+='<defs>'+
   '<radialGradient id="'+uid+'m" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#ffe066"/><stop offset=".35" stop-color="#ff9a1f"/><stop offset=".75" stop-color="#ff4a0a"/><stop offset="1" stop-color="#b3140a"/></radialGradient>'+
   '<radialGradient id="'+uid+'c" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#4a1406"/><stop offset=".7" stop-color="#260803"/><stop offset="1" stop-color="#140301"/></radialGradient>'+
   '<filter id="'+uid+'b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>'+
   '<filter id="'+uid+'s" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.2"/></filter>'+
   '<pattern id="'+uid+'r" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#3f7d46"/><rect width="24" height="12" fill="#43834a"/></pattern>'+
  '</defs>';
  /* rough, and a fairway running up to the front of the green */
  g+='<rect width="'+W+'" height="'+H+'" fill="url(#'+uid+'r)"/>';
  var fwTop=map(0,-6)[1];g+='<path d="M'+f(CX-62)+' '+H+' C'+f(CX-54)+' '+f(H-60)+' '+f(CX-48)+' '+f(fwTop+30)+' '+f(CX-34)+' '+f(fwTop)+' L'+f(CX+34)+' '+f(fwTop)+' C'+f(CX+48)+' '+f(fwTop+30)+' '+f(CX+54)+' '+f(H-60)+' '+f(CX+62)+' '+H+'Z" fill="#6db05c"/>';
  var fwd='M'+f(CX-62)+' '+H+' C'+f(CX-54)+' '+f(H-60)+' '+f(CX-48)+' '+f(fwTop+30)+' '+f(CX-34)+' '+f(fwTop)+' L'+f(CX+34)+' '+f(fwTop)+' C'+f(CX+48)+' '+f(fwTop+30)+' '+f(CX+54)+' '+f(H-60)+' '+f(CX+62)+' '+H+'Z';
  g+='<clipPath id="'+uid+'f"><path d="'+fwd+'"/></clipPath><g clip-path="url(#'+uid+'f)">';for(var k=0;k<7;k++){var yy=H-k*26;g+='<rect x="0" y="'+f(yy-13)+'" width="'+W+'" height="13" fill="#79bb67" opacity=".6"/>'}g+='</g>';
  /* the green: its own shape every ball (bunkers never on the lava side) */
  var side=lava==="L"||lava==="R"?lava:null,Gr=G&&G.makeGreen?G.makeGreen(8+0.03*t,side,R,{pin:0.4,bunkers:true}):null;
  /* no bunkers in (or touching) the lava */
  if(Gr&&Gr.b)Gr.b=Gr.b.filter(function(b){var c=G.bunkC(Gr,b),pad=Math.max(b.rx,b.ry)+1;return !inLava(lava,t,c[0]-pad,c[1])&&!inLava(lava,t,c[0]+pad,c[1])&&!inLava(lava,t,c[0],c[1]-pad)&&!inLava(lava,t,c[0],c[1]+pad)});
  if(Gr)g+=G.greenSVG(Gr,map,PX,uid+"g");
  else{var p0=map(0,0);g+='<circle cx="'+p0[0]+'" cy="'+p0[1]+'" r="'+f((8+0.03*t)*PX)+'" fill="#98d886"/>'}
  /* the lava: heat glow on the grass, molten base, cooled crust plates with glowing seams, bubbles */
  var pts=edgePts(lava,t,R),poly=lavaPoly(lava,pts);
  g+='<path d="'+poly+'" fill="#ff5a14" opacity=".55" filter="url(#'+uid+'b)"/>';
  g+='<clipPath id="'+uid+'k"><path d="'+poly+'"/></clipPath><g clip-path="url(#'+uid+'k)"><rect width="'+W+'" height="'+H+'" fill="url(#'+uid+'m)"/>';
  for(var n=0;n<90;n++){var cx=R()*W,cy=R()*H,r=6+R()*16,a=[];for(var j=0;j<9;j++){var u=j/9*Math.PI*2,rr=r*(0.7+R()*0.45);a.push([cx+rr*Math.cos(u),cy+rr*Math.sin(u)*(0.75+R()*0.3)])}
    g+='<path d="M'+a.map(function(q){return f(q[0])+" "+f(q[1])}).join("L")+'Z" fill="url(#'+uid+'c)" opacity="'+(0.82+R()*0.18).toFixed(2)+'"/>'}
  for(n=0;n<14;n++){var bx=R()*W,by=R()*H,br=1.5+R()*3.5;g+='<circle cx="'+f(bx)+'" cy="'+f(by)+'" r="'+f(br)+'" fill="#ffd34d" opacity=".9"/><circle cx="'+f(bx-br*.3)+'" cy="'+f(by-br*.3)+'" r="'+f(br*.4)+'" fill="#fff6c2"/>'}
  g+='</g>';
  /* the glowing edge */
  var ed="M"+pts.map(function(p){var q=map(p[0],p[1]);return f(q[0])+" "+f(q[1])}).join("L");
  g+='<path d="'+ed+'" fill="none" stroke="#ffb02e" stroke-width="5" opacity=".75" filter="url(#'+uid+'s)"/><path d="'+ed+'" fill="none" stroke="#ffe08a" stroke-width="1.6"/>';
  /* LAVA label inside the lava */
  var lp=lava==="L"?map(-24,-26):lava==="R"?map(24,-26):lava==="S"?map(-22,-0.1*t-12):map(22,0.1*t+10);
  lp[0]=Math.max(28,Math.min(W-28,lp[0]));lp[1]=Math.max(30,Math.min(H-16,lp[1]));
  g+='<text x="'+f(lp[0])+'" y="'+f(lp[1])+'" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="22" letter-spacing="2" fill="#fff3c4" stroke="#5a1203" stroke-width="3" paint-order="stroke">LAVA</text>';
  /* distance and side */
  g+='<rect x="8" y="8" rx="3" width="'+(o.label?150:96)+'" height="26" fill="rgba(11,11,11,.78)"/><text x="16" y="26" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="800" fill="#FFD900">'+t+' YDS'+(o.label?'<tspan fill="#F4F1EA" font-weight="600"> · '+o.label+'</tspan>':'')+'</text>';
  /* the ball: where it finished (or where it will, while typing) */
  if(o.ball&&isFinite(o.ball.x)&&isFinite(o.ball.y)){
    var bxy=map(o.ball.x,o.ball.y),cl=[Math.max(8,Math.min(W-8,bxy[0])),Math.max(8,Math.min(H-8,bxy[1]))],off=cl[0]!==bxy[0]||cl[1]!==bxy[1],hot=inLava(lava,t,o.ball.x,o.ball.y);
    var from=map(o.ball.x*0.25,-40);g+='<path d="M'+f(from[0])+' '+f(from[1])+' Q'+f((from[0]+cl[0])/2-10)+' '+f((from[1]+cl[1])/2-40)+' '+f(cl[0])+' '+f(cl[1])+'" fill="none" stroke="'+(hot?'#ffe08a':'#FFFFFF')+'" stroke-width="2" stroke-dasharray="5 5" opacity="'+(o.ghost?.55:.85)+'"/>';
    if(hot)g+='<circle cx="'+f(cl[0])+'" cy="'+f(cl[1])+'" r="15" fill="none" stroke="#ffe08a" stroke-width="2.5" opacity=".9"/><circle cx="'+f(cl[0])+'" cy="'+f(cl[1])+'" r="24" fill="none" stroke="#ff7a1a" stroke-width="2" opacity=".6"/>';
    g+='<ellipse cx="'+f(cl[0]+1.5)+'" cy="'+f(cl[1]+2.5)+'" rx="6" ry="3.2" fill="rgba(0,0,0,.35)"/><circle cx="'+f(cl[0])+'" cy="'+f(cl[1])+'" r="6" fill="#FFFFFF" stroke="#0B0B0B" stroke-width="2" opacity="'+(o.ghost?.75:1)+'"/>';
    if(off)g+='<text x="'+f(cl[0])+'" y="'+f(cl[1]-12)+'" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" stroke="#0B0B0B" stroke-width="3" paint-order="stroke">off the picture</text>';
  }
  return g+'</svg>'}
window.LavaArt={svg:svg,inLava:inLava};
})();
