/* Personal best celebration for the golf games and tests (loaded by golfwarm.js).
   The share card code in each page (MGS, "mgs-golf") calls:
     MGPB.party(win, done)   when a round finishes with a new PB: a full-screen moment (NEW PERSONAL BEST, the score counting up,
                             gold confetti waves, a short chime, a buzz where the phone allows it), then "Take a picture",
                             "Share my PB" or "Carry on". done('photo'|'share'|null) opens the share card (and the photo picker).
     MGPB.frame(ctx, W, H, win)  draws the PB border on the share picture: gold frame, PB medal and "Personal best" ribbon.
   window.MGPB.busy() is true while the celebration or the share card is open (plan-return.js waits for it). */
(function(){
if(window.MGPB)return;
var LOGO='M400 538.9C326 530.5 262.6 470.4 250 396.4C240.3 339.9 255.7 284.9 292.3 245.4L300.7 236.3L295 200.9C291.8 181.4 289.1 164.6 288.8 163.5C288.3 161.1 293.2 150.6 235 278.7C209.4 334.9 188.2 381 187.9 381C187.6 381 165.6 331.7 139 271.5C112.4 211.3 90.3 162.3 90 162.8C89.6 163.2 81.3 209.1 71.4 264.7L53.5 366L26.7 366C1.6 366 -0.1 365.9 0.4 364.2C0.9 362.6 45.4 135.6 63.2 43.8C67.8 20.3 71.7 1 72 1';
function reduce(){try{return window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function css(){if(document.getElementById('mgpb-css'))return;var s=document.createElement('style');s.id='mgpb-css';s.textContent=[
 '#mgpb{position:fixed;inset:0;z-index:95;background:radial-gradient(circle at 50% 38%,#3a3200 0%,#141100 38%,#0B0B0B 72%);color:#F4F1EA;display:flex;flex-direction:column;align-items:center;justify-content:safe center;overflow-y:auto;text-align:center;padding:calc(20px + env(safe-area-inset-top,0px)) 22px calc(22px + env(safe-area-inset-bottom,0px));font-family:Inter,system-ui,sans-serif;overflow:hidden}',
 '#mgpb .mgpb-rays{position:absolute;left:50%;top:38%;width:180vmax;height:180vmax;margin:-90vmax 0 0 -90vmax;background:repeating-conic-gradient(rgba(255,217,0,.10) 0 6deg,transparent 6deg 18deg);animation:mgpbSpin 18s linear infinite;pointer-events:none}',
 '#mgpb .mgpb-in{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;max-width:460px;width:100%}',
 '#mgpb .mgpb-medal{flex:0 0 auto;box-sizing:border-box;width:104px;height:104px;padding:0;margin:0;border:0;border-radius:50%!important;background:radial-gradient(circle at 35% 30%,#fff6b0,#FFD900 45%,#c9a400 100%);color:#0B0B0B;display:flex;align-items:center;justify-content:center;font:400 50px Anton,Impact,sans-serif;box-shadow:0 0 0 8px rgba(255,217,0,.25),0 0 60px rgba(255,217,0,.6);animation:mgpbPop .7s cubic-bezier(.2,1.6,.4,1) both}',
 '#mgpb .mgpb-k{margin-top:10px;font-weight:800;font-size:13px;letter-spacing:5px;text-transform:uppercase;color:#FFD900;animation:mgpbUp .5s .25s both}',
 '#mgpb h2{margin:0;font:400 clamp(42px,12.5vw,66px)/.95 Anton,Impact,sans-serif;text-transform:uppercase;color:#FFD900;text-shadow:0 0 30px rgba(255,217,0,.5);animation:mgpbPop .8s .3s cubic-bezier(.2,1.6,.4,1) both}',
 '#mgpb .mgpb-g{font:400 22px Anton,Impact,sans-serif;text-transform:uppercase;letter-spacing:.5px;color:#F4F1EA;animation:mgpbUp .5s .5s both}',
 '#mgpb .mgpb-big{font:400 clamp(64px,20vw,104px)/1 Anton,Impact,sans-serif;color:#F4F1EA;animation:mgpbUp .5s .6s both}',
 '#mgpb .mgpb-ln{font-size:15px;color:#d9d5cb;animation:mgpbUp .5s .75s both}',
 '#mgpb .mgpb-btns{display:flex;flex-direction:column;gap:10px;width:100%;margin-top:12px;animation:mgpbUp .5s 1s both}',
 '#mgpb button{min-height:56px;border:0;cursor:pointer;font:400 21px Anton,Impact,sans-serif;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:10px}',
 '#mgpb .ph{background:#FFD900;color:#0B0B0B;animation:mgpbPulse 1.6s 1.4s ease-out infinite}',
 '#mgpb .sh{background:transparent;color:#FFD900;border:2px solid #FFD900}',
 '#mgpb .no{background:transparent;color:#9C988C;font:600 14px Inter,system-ui,sans-serif;text-transform:none;min-height:44px}',
 '#mgpb canvas{position:absolute;inset:0;pointer-events:none}',
 '@keyframes mgpbSpin{to{transform:rotate(360deg)}}',
 '@keyframes mgpbPop{0%{transform:scale(.2);opacity:0}100%{transform:scale(1);opacity:1}}',
 '@keyframes mgpbUp{0%{transform:translateY(18px);opacity:0}100%{transform:none;opacity:1}}',
 '@keyframes mgpbPulse{0%{box-shadow:0 0 0 0 rgba(255,217,0,.7)}70%{box-shadow:0 0 0 16px rgba(255,217,0,0)}100%{box-shadow:0 0 0 0 rgba(255,217,0,0)}}',
 '@media (prefers-reduced-motion:reduce){#mgpb *{animation:none!important}}'].join('');document.head.appendChild(s)}
/* a short rising "you did it" chime, quiet, only after the tap that finished the round */
function chime(){try{var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;var A=new AC(),t=A.currentTime+.05;
  [523.25,659.25,783.99,1046.5,1318.5].forEach(function(f,i){var o=A.createOscillator(),g=A.createGain(),s=t+i*.1;o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(i===4?.16:.11,s+.02);g.gain.exponentialRampToValueAtTime(.001,s+(i===4?1.4:.6));o.connect(g);g.connect(A.destination);o.start(s);o.stop(s+1.5)});
  setTimeout(function(){try{A.close()}catch(e){}},2600)}catch(e){}}
function buzz(){try{if(navigator.vibrate)navigator.vibrate([70,50,70,50,220])}catch(e){}}
/* gold confetti and firework bursts, three waves */
function confetti(host){if(reduce())return;var c=document.createElement('canvas'),x=c.getContext('2d'),W=c.width=innerWidth,H=c.height=innerHeight,P=[],cols=['#FFD900','#FFE866','#F4F1EA','#FFFFFF','#c9a400'],t0=Date.now();
  function wave(cx,cy,n,sp){for(var i=0;i<n;i++){var a=Math.random()*Math.PI*2,v=Math.random()*sp+3;P.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-6,s:5+Math.random()*8,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:cols[i%cols.length],b:Date.now()})}}
  wave(W/2,H*.32,160,15);setTimeout(function(){wave(W*.2,H*.25,90,12);wave(W*.8,H*.25,90,12)},500);setTimeout(function(){wave(W/2,H*.15,120,14)},1100);
  host.appendChild(c);
  (function f(){var t=Date.now()-t0;x.clearRect(0,0,W,H);P.forEach(function(p){p.vy+=.32;p.vx*=.985;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;var age=Date.now()-p.b;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.globalAlpha=Math.max(0,1-age/3200);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()});
    if(t<4600&&c.isConnected)requestAnimationFrame(f);else c.remove()})()}
/* the score counts up when it is a plain number (whole or decimal, with a sign or unit around it) */
function countUp(el,txt){var m=String(txt).match(/^([^\d\-+]*)([+\-−]?)(\d+(?:\.\d+)?)(.*)$/);if(!m||reduce()){el.textContent=txt;return}
  var pre=m[1],sg=m[2],end=parseFloat(m[3]),dp=(m[3].split('.')[1]||'').length,post=m[4],t0=null,D=1100;
  function step(ts){if(!t0)t0=ts;var k=Math.min(1,(ts-t0)/D),e=1-Math.pow(1-k,3);el.textContent=pre+sg+(end*e).toFixed(dp)+post;if(k<1)requestAnimationFrame(step);else el.textContent=txt}
  el.textContent=pre+sg+(0).toFixed(dp)+post;setTimeout(function(){requestAnimationFrame(step)},550)}
function party(w,done){css();var o=document.getElementById('mgpb');if(o)o.remove();o=document.createElement('div');o.id='mgpb';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','New personal best');
  o.innerHTML='<div class="mgpb-rays"></div><div class="mgpb-in"><div class="mgpb-medal">PB</div><div class="mgpb-k">New</div><h2>Personal<br>best</h2><div class="mgpb-g">'+esc(w.title||'')+'</div><div class="mgpb-big"></div><div class="mgpb-ln">'+esc(w.line||'')+'</div>'+
   '<div class="mgpb-btns"><button type="button" class="ph" data-a="photo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="13" r="3.6" stroke="currentColor" stroke-width="2.2"/></svg>Take a picture</button>'+
   '<button type="button" class="sh" data-a="share">Share my PB</button><button type="button" class="no" data-a="">Carry on</button></div></div>';
  document.body.appendChild(o);document.body.style.overflow='hidden';countUp(o.querySelector('.mgpb-big'),w.big||'');chime();buzz();confetti(o);
  o.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b)return;o.remove();document.body.style.overflow='';try{done&&done(b.dataset.a||null)}catch(err){}})}
/* the PB border on the share picture */
function frame(ctx,W,H,w){ctx.save();var gold=ctx.createLinearGradient(0,0,W,H);gold.addColorStop(0,'#fff1a0');gold.addColorStop(.35,'#FFD900');gold.addColorStop(.7,'#c9a400');gold.addColorStop(1,'#FFE866');
  ctx.strokeStyle=gold;ctx.lineWidth=18;ctx.strokeRect(22,22,W-44,H-44);ctx.lineWidth=4;ctx.strokeRect(50,50,W-100,H-100);
  /* corner stars */
  function star(cx,cy,r){ctx.beginPath();for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;ctx.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}ctx.closePath();ctx.fillStyle=gold;ctx.fill()}
  star(50,50,26);star(W-50,50,26);star(50,H-50,26);star(W-50,H-50,26);
  /* PB medal, top centre */
  var mx=W/2,my=150,R=78;ctx.shadowColor='rgba(255,217,0,.6)';ctx.shadowBlur=40;var rg=ctx.createRadialGradient(mx-24,my-28,8,mx,my,R);rg.addColorStop(0,'#fff6b0');rg.addColorStop(.5,'#FFD900');rg.addColorStop(1,'#b89500');
  ctx.fillStyle=rg;ctx.beginPath();ctx.arc(mx,my,R,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.lineWidth=6;ctx.strokeStyle='#0B0B0B';ctx.beginPath();ctx.arc(mx,my,R-12,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#0B0B0B';ctx.font='400 74px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('PB',mx,my+4);
  /* ribbon under the medal */
  var rw=520,rh=62,ry=my+R+18;ctx.fillStyle='#0B0B0B';ctx.fillRect(mx-rw/2-6,ry-6,rw+12,rh+12);ctx.fillStyle=gold;ctx.fillRect(mx-rw/2,ry,rw,rh);
  ctx.beginPath();ctx.moveTo(mx-rw/2,ry);ctx.lineTo(mx-rw/2-40,ry+rh/2);ctx.lineTo(mx-rw/2,ry+rh);ctx.fill();ctx.beginPath();ctx.moveTo(mx+rw/2,ry);ctx.lineTo(mx+rw/2+40,ry+rh/2);ctx.lineTo(mx+rw/2,ry+rh);ctx.fill();
  ctx.fillStyle='#0B0B0B';ctx.font='800 34px Inter, sans-serif';ctx.fillText('PERSONAL BEST',mx,ry+rh/2+2);
  ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.restore()}
function busy(){return !!(document.getElementById('mgpb')||document.querySelector('.mgs-sheet:not([hidden])'))}
window.MGPB={party:party,frame:frame,busy:busy};
})();
