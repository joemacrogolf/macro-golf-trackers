/* Macro Golf · interactive scored drills for coach-built plans (Joe, 13 Nov 2026).
   Jack's drills from Paul Goddard's plan (pages/golf-paul-goddard.html) and the Practice Plan (pages/golf-practice-plan.html),
   same drawings and scoring, run full screen from the Practice tab of pages/coach-plan.html:
     drill-ladder          Ladder up to 70 yds: each shot must carry to where the last one finished, until 70 yds
     drill-strike          Strike station: 5 balls, tap where each came off the iron face, heat map and centre count
     drill-landing-ladder  Landing ladder: 5 zones from 10 yds, up 1-5 then back down 5-1, Hit / Missed
   MGDrills.open(kind, rec, onChange): rec = {res:[], done:false} (kept by the caller in S), onChange(rec) after every tap.
   MGDrills.summary(kind, rec) -> short text of the score. PBs: S.drillPB[kind] = {best, last, n}. */
var MGDrills=(function(){
if(window.MGDrills)return window.MGDrills;
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var KINDS={
  'drill-ladder':{title:'Ladder up to 70 yds',lines:['Start with a short chip. Every shot must carry to where the last ball finished.','Each shot gets longer and the target changes every time, until you reach 70 yds.']},
  'drill-strike':{title:'Strike station',balls:5,lines:['Strike set up station: low point check and strike spray (foot spray works too).','Hit 5 balls. Tap where each ball came off the face.']},
  'drill-landing-ladder':{title:'Landing ladder',lines:['Lay a club on the ground 10 yds away, then five more behind it, 6 ft (2 paces) apart. That makes 5 landing zones.','Chip one ball into zone 1, then 2, 3, 4 and 5. Then work back down: 5, 4, 3, 2, 1.','Tap Hit if it landed in the zone, Missed if it didn’t, then go to the next zone either way. 1 point a zone.']}
};
function has(kind){return !!KINDS[kind]}

/* ---------- drawings (Jack's) ---------- */
var FT=function(x,y,str,o){o=o||{};return '<text x="'+x+'" y="'+y+'" font-family="Inter,Arial,sans-serif" font-size="'+(o.s||10)+'" font-weight="'+(o.w||700)+'" text-anchor="'+(o.a||'middle')+'" fill="'+(o.c||'#FFFFFF')+'" letter-spacing=".5">'+str+'</text>'};
function faceSVG(hits,heat){
  var FACE='M94 40 L222 57 C231 58 237 64 238 73 L242 121 C243 134 235 142 221 142 L86 143 C58 143 41 127 39 99 C37 68 55 42 94 40 Z';
  var g='<defs><linearGradient id="pdBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f6f4"/><stop offset="1" stop-color="#e7e6e1"/></linearGradient>'+
   '<linearGradient id="pdMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".18" stop-color="#eef0f2"/><stop offset=".62" stop-color="#d5d9de"/><stop offset=".9" stop-color="#b7bcc3"/><stop offset="1" stop-color="#9fa5ad"/></linearGradient>'+
   '<radialGradient id="pdToe" cx=".12" cy=".45" r=".5"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#8f959d" stop-opacity=".35"/></radialGradient>'+
   '<linearGradient id="pdHosel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a8adb4"/><stop offset=".35" stop-color="#f4f5f6"/><stop offset=".7" stop-color="#cfd3d8"/><stop offset="1" stop-color="#8e949b"/></linearGradient>'+
   '<linearGradient id="pdShaft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e949b"/><stop offset=".45" stop-color="#f2f3f4"/><stop offset="1" stop-color="#7d838a"/></linearGradient>'+
   '<radialGradient id="pdHeat"><stop offset="0" stop-color="#E0352B" stop-opacity=".75"/><stop offset=".45" stop-color="#F5A800" stop-opacity=".45"/><stop offset="1" stop-color="#FFD900" stop-opacity="0"/></radialGradient>'+
   '<filter id="pdSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>'+
   '<filter id="pdShadow" x="-10%" y="-10%" width="130%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".22"/></filter>'+
   '<clipPath id="pdClip"><path d="'+FACE+'"/></clipPath></defs><rect width="300" height="170" fill="url(#pdBg)"/>';
  g+='<g filter="url(#pdShadow)"><path d="M262 -6 L281 0 L276 18 L257 12 Z" fill="url(#pdShaft)"/><path d="M257 12 L276 18 L273 27 L254 21 Z" fill="#111"/><path d="M256 15 L275 21" stroke="#FFD900" stroke-width="1.2"/>'+
   '<path d="M254 21 L273 27 C266 52 258 82 251 112 C249 122 244 128 236 130 L226 72 C236 58 246 40 254 21 Z" fill="url(#pdHosel)"/>';
  g+='<path d="'+FACE+'" fill="url(#pdMetal)"/><path d="'+FACE+'" fill="url(#pdToe)"/></g><g clip-path="url(#pdClip)">';
  for(var y=44;y<142;y+=2.2)g+='<line x1="30" y1="'+y+'" x2="250" y2="'+(y+0.4)+'" stroke="#ffffff" stroke-width=".5" opacity=".18"/>';
  for(var k=0;k<11;k++){var yy=58+k*6,x1=76+(k>8?(k-8)*3:0),x2=204-(k>8?(k-8)*2:0);
    g+='<line x1="'+x1+'" y1="'+yy+'" x2="'+x2+'" y2="'+yy+'" stroke="#8a9098" stroke-width="1.6" stroke-linecap="round"/><line x1="'+x1+'" y1="'+(yy+1.3)+'" x2="'+x2+'" y2="'+(yy+1.3)+'" stroke="#ffffff" stroke-width=".7" opacity=".75" stroke-linecap="round"/>'}
  g+='<path d="M60 136 C70 141 78 142 88 142 L220 141" fill="none" stroke="#7f858d" stroke-width="2.5" opacity=".55"/>';
  if(heat&&hits.length)g+='<g filter="url(#pdSoft)">'+hits.map(function(h){return '<circle cx="'+h.x+'" cy="'+h.y+'" r="20" fill="url(#pdHeat)"/>'}).join('')+'</g>';
  g+='</g><path d="'+FACE+'" fill="none" stroke="#6f757d" stroke-width="1.6"/><path d="M92 43 L221 60" stroke="#ffffff" stroke-width="1.6" opacity=".9" stroke-linecap="round"/>';
  g+='<rect x="108" y="74" width="62" height="40" rx="12" fill="none" stroke="#0B0B0B" stroke-width="1.2" stroke-dasharray="4 4" opacity=".45"/>';
  g+=FT(48,30,'TOE',{c:'#77715F',s:9,a:'start'})+FT(232,160,'HEEL',{c:'#77715F',s:9,a:'end'});
  hits.forEach(function(h,i){var last=i===hits.length-1;g+=(last?'<circle cx="'+h.x+'" cy="'+h.y+'" r="11" fill="none" stroke="#FFD900" stroke-width="2.5"/>':'')+
    '<circle cx="'+h.x+'" cy="'+h.y+'" r="7" fill="#0B0B0B" stroke="#ffffff" stroke-width="1.5"/>'+FT(h.x,h.y+3,i+1,{s:8,c:'#FFFFFF'})});
  return '<svg viewBox="0 0 300 170" class="pd-tap" role="img" aria-label="Iron club face. Tap where the ball came off the face">'+g+'</svg>'}
function faceZone(h){var hz=h.x<108?'Toe':h.x>170?'Heel':'Centre',vz=h.y<74?'high':h.y>114?'low':'';return {hz:hz,vz:vz,centre:hz==='Centre'&&!vz}}
function faceSummary(hits){if(!hits.length)return '';var z=hits.map(faceZone),c=z.filter(function(x){return x.centre}).length,cnt={};
  z.forEach(function(x){if(!x.centre){var k=x.hz+(x.vz?' '+x.vz:'');cnt[k]=(cnt[k]||0)+1}});
  var mis=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]});return c+' of '+hits.length+' in the middle'+(mis.length?' · most misses '+mis[0].toLowerCase()+' ('+cnt[mis[0]]+')':'')}
var PT=function(x,y,str,o){return FT(x,y,str,o)};
function ladderSVG(res){var W=300,H=120,g='<rect width="'+W+'" height="'+H+'" fill="#6aa85a"/>',X=function(yd){return 34+Math.min(78,yd)/78*250};
  [10,20,30,40,50,60].forEach(function(d){g+='<line x1="'+X(d)+'" y1="22" x2="'+X(d)+'" y2="'+(H-28)+'" stroke="#FFFFFF" stroke-opacity=".35"/>'+PT(X(d),H-12,d,{s:9,c:'#0B0B0B'})});
  g+='<line x1="'+X(70)+'" y1="16" x2="'+X(70)+'" y2="'+(H-24)+'" stroke="#FFD900" stroke-width="3"/>'+PT(X(70),12,'70 YDS',{s:9,c:'#0B0B0B'});
  g+='<rect x="18" y="'+(H/2-16)+'" width="10" height="28" fill="#0B0B0B"/>';
  res.forEach(function(s,i){var x=X(s.c),y=H/2-2+(i%2?-10:10);g+='<circle cx="'+x+'" cy="'+y+'" r="7" fill="'+(s.ok===false?'#E0352B':'#FFFFFF')+'" stroke="#0B0B0B" stroke-width="2"/>'+PT(x,y+3,i+1,{s:8,c:'#0B0B0B'})});
  return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Ladder to 70 yards">'+g+'</svg>'}
var LAD_Z=[[10,12],[12,14],[14,16],[16,18],[18,20]],LAD_SEQ=[0,1,2,3,4,4,3,2,1,0];
function landSVG(res){var W=340,H=410,top=46,k=24,y=function(d){return top+(20-d)*k},by=H-34,n=res.length,done=n>=LAD_SEQ.length,zi=done?-1:LAD_SEQ[n],up=n<5;
  var g='<rect width="'+W+'" height="'+H+'" fill="#2d5a27"/>';for(var i=0;i<12;i++)g+='<rect x="0" y="'+(i*36)+'" width="'+W+'" height="18" fill="#336530" opacity=".55"/>';
  LAD_Z.forEach(function(z,i){var on=i===zi,y1=y(z[1]),y2=y(z[0]);g+='<rect x="54" y="'+y1+'" width="232" height="'+(y2-y1)+'" fill="'+(on?'#FFD900':'#fff')+'" opacity="'+(on?.85:.06)+'"/>';
    g+='<text x="34" y="'+((y1+y2)/2+7)+'" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="20" fill="'+(on?'#FFD900':'#F4F1EA')+'">'+(i+1)+'</text>';
    res.map(function(r,j){return {r:r,z:LAD_SEQ[j]}}).filter(function(m){return m.z===i}).forEach(function(m,j){var cx=254-j*22,cy=(y1+y2)/2;
      g+='<circle cx="'+cx+'" cy="'+cy+'" r="8" fill="'+(m.r?'#1f8a4c':'#b3261e')+'" stroke="#fff" stroke-width="1.5"/><text x="'+cx+'" y="'+(cy+4)+'" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">'+(m.r?'✓':'✕')+'</text>'});
    if(on)g+='<text x="'+(W/2-30)+'" y="'+((y1+y2)/2+6)+'" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="17" fill="#0B0B0B">LAND IT HERE</text>'});
  [10,12,14,16,18,20].forEach(function(d){var yy=y(d);g+='<line x1="60" y1="'+yy+'" x2="262" y2="'+yy+'" stroke="#C9C6BE" stroke-width="3" stroke-linecap="round"/><rect x="262" y="'+(yy-3)+'" width="20" height="6" rx="2" fill="#141414"/><text x="'+(W-8)+'" y="'+(yy+4)+'" text-anchor="end" font-size="11" font-weight="700" fill="#F4F1EA">'+d+' yds</text>'});
  g+='<line x1="'+W/2+'" y1="'+(y(10)+10)+'" x2="'+W/2+'" y2="'+(by-14)+'" stroke="#F4F1EA" stroke-width="1.5" stroke-dasharray="4 5" opacity=".7"/><text x="'+(W/2-8)+'" y="'+((y(10)+by)/2+4)+'" text-anchor="end" font-size="11" font-weight="700" fill="#F4F1EA">10 yds to the first club</text>';
  g+='<circle cx="'+W/2+'" cy="'+by+'" r="7" fill="#fff" stroke="#999"/><text x="'+W/2+'" y="'+(by+24)+'" text-anchor="middle" font-size="11" font-weight="700" fill="#F4F1EA">YOU</text>';
  if(zi>=0){var z=LAD_Z[zi],ty=y((z[0]+z[1])/2);g+='<path d="M'+W/2+' '+(by-10)+' Q '+(W/2+70)+' '+((by+ty)/2)+' '+(W/2+40)+' '+(ty+8)+'" fill="none" stroke="#FFD900" stroke-width="3" stroke-dasharray="7 5"/><path d="M'+(W/2+40)+' '+(ty+8)+' l10 -2 l-6 9 z" fill="#FFD900"/>';
    g+='<rect x="8" y="6" width="'+(up?118:134)+'" height="22" fill="#0B0B0B"/><text x="16" y="22" font-family="Anton,Impact,sans-serif" font-size="14" fill="#FFD900">'+(up?'GOING UP ↑':'COMING DOWN ↓')+'</text>'}
  g+='<text x="'+(W-8)+'" y="22" text-anchor="end" font-size="11" font-weight="700" fill="#F4F1EA">6 ft between clubs</text>';
  return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Landing ladder">'+g+'</svg>'}

/* ---------- scoring ---------- */
function isDone(kind,res){if(kind==='drill-ladder')return !!(res.length&&res[res.length-1].c>=70);if(kind==='drill-strike')return res.length>=KINDS[kind].balls;if(kind==='drill-landing-ladder')return res.length>=LAD_SEQ.length;return false}
function score(kind,res){if(kind==='drill-ladder')return {pts:res.filter(function(x){return x.ok}).length,of:Math.max(0,res.length-1)};
  if(kind==='drill-strike')return {pts:res.filter(function(h){return faceZone(h).centre}).length,of:res.length};
  if(kind==='drill-landing-ladder')return {pts:res.filter(Boolean).length,of:LAD_SEQ.length};return {pts:0,of:0}}
function summary(kind,rec){if(!rec||!rec.res||!rec.res.length)return '';var s=score(kind,rec.res);
  if(kind==='drill-ladder')return (isDone(kind,rec.res)?'70 yds reached · ':'')+s.pts+' of '+s.of+' carried to the last ball';
  if(kind==='drill-strike')return faceSummary(rec.res);return s.pts+' of '+s.of+' points'}
function pbFor(kind){var S=window.S||{};return (S.drillPB||{})[kind]||null}
function savePB(kind,rec){var S=window.S;if(!S||rec.pb)return;var s=score(kind,rec.res),P=S.drillPB=S.drillPB||{},old=P[kind]||{best:null,n:0};
  rec.newPB=old.best===null||s.pts>old.best;P[kind]={best:old.best===null?s.pts:Math.max(old.best,s.pts),last:s.pts,n:(old.n||0)+1,t:Date.now()};rec.pb=true}

/* ---------- full-screen runner ---------- */
function css(){if(document.getElementById('pd-css'))return;var s=document.createElement('style');s.id='pd-css';s.textContent=[
 '#pd{position:fixed;inset:0;z-index:99990;background:#F4F1EA;overflow:auto;-webkit-overflow-scrolling:touch;font:15px/1.45 Inter,system-ui,sans-serif;color:#0B0B0B}',
 '#pd .pd-in{max-width:520px;margin:0 auto;padding:14px 16px 40px;display:flex;flex-direction:column;gap:12px}',
 '#pd .pd-top{display:flex;align-items:center;justify-content:space-between;gap:10px;position:sticky;top:0;background:#F4F1EA;padding:8px 0;z-index:2}',
 '#pd .pd-x{min-height:44px;padding:0 14px;border:2px solid #0B0B0B;background:#fff;font:700 14px Inter,sans-serif;cursor:pointer}',
 '#pd h2{margin:0;font:400 28px/1 Anton,Impact,sans-serif;text-transform:uppercase}',
 '#pd .pd-k{font:700 11px Inter,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:#8a7f00}',
 '#pd ul{margin:0;padding-left:18px;color:#3B3830;font-size:14px}',
 '#pd .pd-call{background:#0B0B0B;color:#F4F1EA;padding:14px 16px;border-left:6px solid #FFD900}',
 '#pd .pd-call b{display:block;font:400 34px/1 Anton,Impact,sans-serif;color:#FFD900;margin-top:4px}#pd .pd-call b small{font:600 14px Inter,sans-serif;color:#F4F1EA;margin-left:6px}',
 '#pd .pd-viz svg{display:block;width:100%;height:auto;border:1px solid #D9D4C7}#pd .pd-tap{cursor:crosshair;touch-action:manipulation}',
 '#pd .pd-meter{height:10px;background:#E6E1D3}#pd .pd-meter i{display:block;height:100%;background:#FFD900}',
 '#pd .pd-row{display:flex;gap:10px}#pd .pd-row>*{flex:1}',
 '#pd input{min-height:52px;font:600 20px Inter,sans-serif;padding:0 14px;border:2px solid #0B0B0B;width:100%;box-sizing:border-box}',
 '#pd .pd-b{min-height:54px;border:0;font:400 20px Anton,Impact,sans-serif;text-transform:uppercase;cursor:pointer;background:#0B0B0B;color:#FFD900}',
 '#pd .pd-b.ok{background:#1f8a4c;color:#fff}#pd .pd-b.no{background:#b3261e;color:#fff}#pd .pd-b.y{background:#FFD900;color:#0B0B0B}',
 '#pd .pd-link{background:none;border:0;text-decoration:underline;font:600 14px Inter,sans-serif;color:#3B3830;cursor:pointer;align-self:flex-start;padding:6px 0}',
 '#pd .pd-chips{display:flex;flex-wrap:wrap;gap:6px}#pd .pd-chips span{min-width:34px;text-align:center;padding:4px 8px;font:700 13px Inter,sans-serif;background:#fff;border:1px solid #D9D4C7}',
 '#pd .pd-chips .ok{background:#1f8a4c;color:#fff;border-color:#1f8a4c}#pd .pd-chips .no{background:#b3261e;color:#fff;border-color:#b3261e}',
 '#pd .pd-pb{display:flex;justify-content:space-between;font:600 13px Inter,sans-serif;color:#77715F}#pd .pd-new{color:#8a7f00;font-weight:800}',
 '#pd .pd-muted{color:#77715F;font-size:14px}'].join('');document.head.appendChild(s)}
function open(kind,rec,onChange){if(!KINDS[kind])return;css();rec.res=rec.res||[];var K=KINDS[kind];
  var el=document.getElementById('pd');if(el)el.remove();el=document.createElement('div');el.id='pd';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');document.body.appendChild(el);
  var y0=window.scrollY;document.documentElement.style.overflow='hidden';
  function close(){el.remove();document.documentElement.style.overflow='';window.scrollTo(0,y0);onChange(rec,true)}
  function changed(){rec.done=isDone(kind,rec.res);if(rec.done){rec.at=new Date().toISOString().slice(0,10);savePB(kind,rec)}else{rec.pb=false;rec.newPB=false}onChange(rec,false);draw()}
  function draw(){var res=rec.res,n=res.length,done=isDone(kind,res),pb=pbFor(kind),h='';
    h+='<div class="pd-top"><span class="pd-k">Practice drill</span><button type="button" class="pd-x" data-pd="close">'+(done?'Done':'Close')+'</button></div><h2>'+esc(K.title)+'</h2>';
    if(!n)h+='<ul>'+K.lines.map(function(l){return '<li>'+esc(l)+'</li>'}).join('')+'</ul>';
    if(kind==='drill-ladder'){var last=res[n-1],top=last?last.c:0,hits=res.filter(function(x){return x.ok}).length;
      h+='<div class="pd-call"><span class="pd-k" style="color:#F4F1EA">'+(done?'Ladder done':last?'Carry it to where your last ball finished':'First shot')+'</span><b>'+(done?'70<small>yds reached</small>':last?last.c+'<small>yds</small>':'Chip')+'</b></div>'+
        '<div class="pd-viz">'+ladderSVG(res)+'</div><div class="pd-meter"><i style="width:'+Math.min(100,top/70*100)+'%"></i></div><span class="pd-muted">'+hits+' of '+Math.max(0,n-1)+' carried to the last ball · '+top+' / 70 yds</span>';
      if(n)h+='<div class="pd-chips">'+res.map(function(s){return '<span class="'+(s.ok===null?'':s.ok?'ok':'no')+'">'+s.c+'</span>'}).join('')+'</div>';
      if(!done)h+='<label><span class="pd-k">Where this ball finished (yds)</span><input id="pd-in" inputmode="numeric" placeholder="e.g. '+(top?top+8:15)+'"></label>'+
        (n?'<div class="pd-row"><button type="button" class="pd-b ok" data-pd="lad" data-v="1">Carried to it</button><button type="button" class="pd-b no" data-pd="lad" data-v="0">Didn’t</button></div>':'<button type="button" class="pd-b" data-pd="lad" data-v="1">Enter</button>')}
    if(kind==='drill-strike'){var cc=res.filter(function(x){return faceZone(x).centre}).length;
      h+='<div class="pd-call"><span class="pd-k" style="color:#F4F1EA">'+(done?'Your strike map':'Ball '+(n+1)+' of '+K.balls)+'</span><b>'+cc+'<small>of '+n+' in the middle</small></b></div>'+
        '<div class="pd-viz" id="pd-face">'+faceSVG(res,done||n>=3)+'</div>'+(done?'':'<p class="pd-muted" style="margin:0">Tap where it came off the face.</p>')+(n?'<span class="pd-muted">'+esc(faceSummary(res))+'</span>':'')}
    if(kind==='drill-landing-ladder'){var tot=LAD_SEQ.length,zi=done?-1:LAD_SEQ[n],pts=res.filter(Boolean).length;
      h+='<div class="pd-viz">'+landSVG(res)+'</div><div class="pd-call"><span class="pd-k" style="color:#F4F1EA">'+(done?'Ladder done':'Ball '+(n+1)+' of '+tot+' · '+(n<5?'going up':'coming down'))+'</span><b>'+(done?pts+'<small>of '+tot+' points</small>':'Zone '+(zi+1)+'<small>'+LAD_Z[zi][0]+'–'+LAD_Z[zi][1]+' yds</small>')+'</b></div>';
      if(!done)h+='<div class="pd-row"><button type="button" class="pd-b ok" data-pd="lr" data-v="1">✓ Hit</button><button type="button" class="pd-b no" data-pd="lr" data-v="0">✕ Missed</button></div>';
      if(n)h+='<div class="pd-chips">'+res.map(function(r){return '<span class="'+(r?'ok':'no')+'">'+(r?'✓':'✕')+'</span>'}).join('')+'</div>'}
    if(done){var s=score(kind,res);h+='<div class="pd-call" style="border-left-color:#1f8a4c"><span class="pd-k" style="color:#F4F1EA">'+(rec.newPB?(pb&&pb.n>1?'★ New personal best':'First go: the score to beat'):'Drill done')+'</span><b>'+s.pts+'<small>'+(kind==='drill-strike'?'of '+s.of+' in the middle':kind==='drill-ladder'?'carried to the last ball':'of '+s.of+' points')+'</small></b></div>'+
      '<button type="button" class="pd-b y" data-pd="close">Done · back to my plan</button><button type="button" class="pd-link" data-pd="again">Go again</button>'}
    if(pb)h+='<div class="pd-pb"><span>Personal best '+pb.best+'</span><span>Last time '+pb.last+'</span></div>';
    if(n&&!done)h+='<button type="button" class="pd-link" data-pd="undo">Undo last</button>';
    el.innerHTML='<div class="pd-in">'+h+'</div>';
    var f=el.querySelector('#pd-face svg');if(f&&!done)f.addEventListener('click',function(e){var r=f.getBoundingClientRect(),vb=f.viewBox.baseVal;rec.res.push({x:Math.round((e.clientX-r.left)/r.width*vb.width),y:Math.round((e.clientY-r.top)/r.height*vb.height)});changed()});
    var inp=el.querySelector('#pd-in');if(inp){inp.addEventListener('keydown',function(e){if(e.key==='Enter'){var b=el.querySelector('[data-pd="lad"]');if(b)b.click()}})}}
  el.addEventListener('click',function(e){var b=e.target.closest('[data-pd]');if(!b)return;var a=b.dataset.pd,v=b.dataset.v;
    if(a==='close'){close();return}
    if(a==='undo'){rec.res.pop();changed();return}
    if(a==='again'){rec.res=[];rec.pb=false;rec.newPB=false;changed();return}
    if(a==='lad'){var t=parseFloat((el.querySelector('#pd-in')||{}).value);if(!(t>0)){var i=el.querySelector('#pd-in');if(i)i.focus();return}var first=!rec.res.length;rec.res.push({c:Math.round(t),ok:first?null:v==='1'});changed();var e2=el.querySelector('#pd-in');if(e2)e2.focus();return}
    if(a==='lr'){rec.res.push(v==='1');changed();return}});
  document.addEventListener('keydown',function esc2(e){if(e.key==='Escape'&&document.getElementById('pd')){close();document.removeEventListener('keydown',esc2)}});
  draw()}
return {has:has,open:open,summary:summary,isDone:isDone,KINDS:KINDS}})();
