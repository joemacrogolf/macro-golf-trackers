/* Macro Golf \u00b7 Warm-up before every training session, with a Demo video on every warm-up exercise (Joe, 14 Nov).
   Loaded by every training plan: templates/parts/70-tail.html (1-to-1 plans incl. /coach-plan, Build a Plan (training)),
   Dan Jones, Harry and Kevin. Also used by the Plan Builder for its warm-up library.
   1. Template-built plans (#blocks + SESSIONS): a "Warm-up" box above each session, ticked off per session
      (S.warm[curKey()] = {index:true}). What's in it: SESSIONS[day].warmup, else CLIENT.warmup, else the Macro Golf
      standard golf warm-up. CLIENT.warmup = false (or {items:[],video:'none'}) turns it off. Plans that already put a
      'Warm up' block in their sessions (e.g. Colin Howard) keep theirs and get no extra box.
      Shape: CLIENT.warmup = {video:'auto'|'express'|'full'|'upper'|'lower'|'core'|'none', items:[{name,reps}] or [[name,reps]]}
   2. Pages with their own warm-up rows (.warm-row: Dan Jones, the parked Pure plans) get a Demo button on each row.
   3. Harry / Kevin (#warmCard): the standard warm-up list with Demo buttons under their "Warm-up done" tick.
   Every warm-up exercise is from the exercise library (Mobility / Stability demonstrations, with Wistia IDs). */
var MGWarm=(function(){
if(window.MGWarm)return window.MGWarm;
var EX=[["Kettlebell Adductor Stretch","6ovzjgv79g",0,0,1],["Global Tilt Extension Stretch","rpu76yrdcc",0,0,0],["Glute Focussed Superman","dhmevvzxot",0,0,0],["Glute Superman x Reverse Lunge Complex","qff12iyz4z",1,0,0],["TRX Split Squat","o48gwxixya",1,0,1],["Supermans","go1lz3ihds",0,0,0],["Glute Bridge","3qgo2waat8",0,0,0],["Elevated Glute Bridge","ejtkfiw8sq",0,0,1],["Side Bridge","skj5ibcx5k",1,0,0],["Single Leg Elevated Glute Bridge","nirz1lfsee",1,0,1],["Step Downs","famdpgyiib",1,0,0],["Deep Box Pistol Squat","ahomila3j4",1,0,1],["Glute Activation Routine","9dg5g7qqcw",0,0,0],["Loop Band 45 Degree Kick Back","s52slefl7s",0,1,0],["Loop Band Front Kick","uv7gpngz30",0,1,0],["Loop Band Abduction","yxuuyhcf0j",0,1,0],["TRX Hamstring Curl","cag6zapzxz",0,0,1],["Wall Supported Single Leg RDL","ltl3669qk9",1,0,1],["Brooks Squat","03s3o7a0vb",0,0,0],["Hip Drops","n9fwyzz7m2",0,0,0],["Lunge Activation Complex","qa6kqjz555",1,0,0],["Single Leg Deficit Hop","a32w1rx0kh",1,0,0],["TRX Press Up","kq0h360vjw",0,0,1],["Banded Press with Rotation","y6y4vfeit9",1,1,0],["Dorsal Raise","r81tzy7r3h",0,0,0],["TRX Single Arm Row","vwt0g620cy",1,0,1],["TRX Row","c3zluk456d",0,0,1],["Kettlebell Halo","ycb9dg991i",0,0,1],["Kettlebell Grip Curl and Press","51t7svaizf",0,0,1],["ITW Routine","1ljehzbxle",0,0,0],["Shoulder Stability Raise with Band","ejt2txzrhf",0,1,0],["High Pull with Band","4c7eu6k0ql",0,1,0],["Face Pull with Band","w23oo5ihbv",0,1,0],["Shoulder Stability Press","y99geaoikv",0,1,0],["Plank with Twist","faqokse199",0,0,0],["Side Plank","iwxg09ewo3",1,0,0],["Plank With Reach","46xcp4euof",0,0,0],["Deadbug","w45cbyb1a6",0,0,0],["Mountain Climbers","olqq9nw829",0,0,0],["Plank with Shoulder Taps","q9q0re2e18",0,0,0],["Palof Press","88okur49vf",0,1,1],["Palof with Disassociation","hs37ku4zy5",0,1,1],["Core Box","zxfzx1ub63",0,0,0],["Core Box with Legs","uv7up7qc64",0,0,0],["Diagonal Bird Dogs","g0xxl1uv6a",0,0,0],["Golf Swing Chop","alo4aascb4",0,0,1],["Half Kneeling Chop","80742alfs5",1,0,0],["Bird Dog Legs Only","7a0n3hbxyf",0,0,0],["Banded Half Kneeling Chop","b6hf36ohyq",1,1,0],["Banded Rotations","65xg0b94m7",1,1,0],["Bird Dog Arms Only","6oo4x6du8j",0,0,0],["Table Tops","74a0dec4i8",0,0,0],["Plank Twists","i9zgw4706f",0,0,0],["Banded Coil","gyhenb4ydm",0,1,0],["Core Stability Chop","jgc9dc3l6o",0,1,1],["Golf Club DeadBug","k3sctwmeux",0,0,1],["Stability Chop","45iirh93y0",0,1,1],["Cable Walk Outs","4s9v8tm2j1",0,0,1],["Table Top with Shoulder Taps","5lyegngi2w",0,0,0],["Knees Up Disassociation","kjxstjmydl",0,0,0],["Ground Reaction Force Kettlebell Swing","h0efo261i9",0,0,1],["Curl Ups","dxxwt2ej3w",0,0,0],["Kettlebell Sway","z343w2ohyk",0,0,1],["Kettlebell Golf Swing","nrq5gwx4pn",0,0,1],["High Hands Slam","fj4h8ymkn4",0,0,1],["Resistence GRF Sequence","uu6tmuccp1",0,1,1],["Resistance Step with Rotation","64ny2t1dl9",1,1,1],["Split Press with Rotation","co2s2pc4jz",1,1,1],["Step Rotation Sequence","yq2xoeozeo",1,0,0],["Jump Back Overhead Slam","6brn2xqidy",0,0,1],["Single Leg Palof Press","gpe71kq5x6",1,1,1],["Pilates Criss Cross","getfiawl3x",0,0,0],["Pilates Lateral Breathing","1aub7u5e73",1,0,0],["Pilates Neutral Position","zfgbx5svtb",0,0,0],["Pilates Single Leg Stretch","h81r45duzn",1,0,0],["Pilates Chin to Chest","h06m0qnvco",0,0,0],["Pilates 100","4g4f365vv6",0,0,0],["Pilates Glute Bridge","nrfyfa4w0r",0,0,0],["Pilates Scoop","ixplqnx9ux",0,0,0],["Pilates Double Straight Leg Stretch","yj4uk6mjid",0,0,0],["Pilates Double Leg Stretch","sjtfhvgvq1",0,0,0],["Pilates Shoulders Up and Down","b3r1z4r3jj",0,0,0],["Pailtes Arm Over Head Chest Lift Table Top","lwxfmn317b",0,0,0],["Low to High Cable Cross Chop","ezp7ozj4b9",0,0,1],["Pilates Arm Over Head Chest Lift","p5nxtsbtr5",0,0,0],["Pilates Double Leg Table Top","idwmoxpztb",0,0,0],["Pilates Single Leg Table Top","7bo1ir53e9",1,0,0],["Pilates Chest Lift","i86bp0yjz4",0,0,0],["Pilates Arms over Head","8tllsnu1ag",0,0,0],["Seated Spinal Rotation with Tilt","ad5ak30qeh",1,0,0],["Standing Straight Leg Hip Turns","1inwzuddab",0,0,0],["Supine Glute Stretch","8jabyhgg0j",0,0,0],["Reach Under With Extension","ue775fpk9p",0,0,0],["Overhead Backswing Stretch","v0xby9f4ti",0,0,0],["Supported Hamstring Stretch","dgx62lrnbe",0,0,0],["Pelvic Step Up","hgd5qpeb66",1,0,0],["Supported Pelvic Rotation","4h9cdqgjhj",1,0,0],["Clam Shells","6gjf97npbh",1,0,0],["Aeroplanes","vk599vxqvf",1,0,0],["Open Books","t4qk3va7ui",0,0,0],["Half Kneeling Spine Rotations","treqrctbno",1,0,0],["Seated Trunk Side Bend","aim5j4yver",1,0,0],["Standing Helicopters","q5qfwio2jb",0,0,0],["Foam Roller Tilts","ckipgag7dd",0,0,1],["Window Wipers","g53y8utoas",0,0,0],["Pelvic Tilt With Assistance","6p9uylefss",0,0,0],["Lateral Hip Raise","v93e6gzwr5",1,0,0],["Adductor Stretch","4y029mrc6r",0,0,0],["90 90","mzzxvcdgp0",1,0,0],["Supported Stalk Turn","gmxbrffhnw",0,0,0],["Hip Flexor Stretch with Side Bend","4v3ahr5ebm",1,0,0],["Cat Cow","eiqp0zdwjw",0,0,0]]; /* [name, wistia, each side, band, other kit] */
var VIDS={express:['Express 5 Minute Golf Warm Up','rxkqwwoq0t',5],full:['Full Body Warm Up','9fiyljfsxn',3],upper:['Upper Body Warm Up','54gjsobpxj',5],lower:['Lower Body Warm Up','38uets7li0',5],core:['Core Warm Up','jmn8hs1z42',4]};
var STD=[['Standing Helicopters','10'],['Standing Straight Leg Hip Turns','8'],['Half Kneeling Spine Rotations','6 / side'],['Cat Cow','8'],['Aeroplanes','5 / side'],['Diagonal Bird Dogs','6 / side']];
function norm(s){return String(s||'').toLowerCase().replace(/^\d+\s*[x\u00d7]\s*/,'').replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').replace(/\b(the|with|a)\b/g,' ').replace(/s\b/g,'').replace(/\s+/g,' ').trim()}
var MAP={};EX.forEach(function(e){MAP[norm(e[0])]=e[1]});
function idFor(n){var k=norm(n);if(!k)return null;if(MAP[k])return MAP[k];for(var q in MAP)if(q.indexOf(k+' ')===0)return MAP[q];try{if(window.MGVideo&&MGVideo.idFor){var v=MGVideo.idFor(n);if(v)return v}}catch(e){}return null}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function play(name,id,label){if(window.MGVideo&&MGVideo.open)MGVideo.open(name,id,label||'Warm-up demo');else window.open('https://fast.wistia.net/embed/iframe/'+id,'_blank')}
var DEMO='<svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>';
function demoBtn(name,id){return '<button type="button" class="mgw-demo" data-mgw-v="'+esc(id)+'" data-mgw-n="'+esc(name)+'" aria-label="Demo video: '+esc(name)+'">'+DEMO+'Demo</button>'}
function autoVid(d){var t=String((d&&(d.title+' '+(d.short||'')))||'').toLowerCase(),up=/upper|push|pull|press|arm|chop|wrist|shoulder/.test(t),lo=/lower|leg|squat|hinge|vertical|lunge|glute/.test(t);
  return up&&!lo?'upper':lo&&!up?'lower':'full'}
function items(list){return (list||[]).map(function(x){return Array.isArray(x)?{name:x[0],reps:x[1]||''}:{name:x.name||'',reps:x.reps||''}}).filter(function(x){return String(x.name).trim()})}
function hasOwnWarm(d){return (d.blocks||[]).some(function(b){return /warm/i.test(b.label||'')||(b.ex||[]).some(function(e){return /warm/i.test(e.kind||'')})})}
function cfg(d){var c=d&&d.warmup!==undefined?d.warmup:(window.CLIENT&&CLIENT.warmup);
  if(c===false||c===null)return null;
  if(c===undefined){if(hasOwnWarm(d))return null;c={video:'auto',items:STD}}
  if(Array.isArray(c))c={video:'auto',items:c};
  var it=items(c.items),v=c.video==null?'auto':c.video;if(v==='auto')v=autoVid(d);if(!VIDS[v])v=null;
  if(!it.length&&!v)return null;return {items:it,video:v,note:c.note||''}}
function videoRow(v,alone){var V=VIDS[v];return '<div class="mgw-vid"><div><b>'+(alone?'Follow along':'Short on time?')+'</b><span>'+(alone?'':'Follow along instead: ')+esc(V[0])+' \u00b7 '+V[2]+' min</span></div><button type="button" class="mgw-play" data-mgw-v="'+V[1]+'" data-mgw-n="'+esc(V[0])+'">'+DEMO+'Play</button></div>'}

/* ---------- 1. template-built plans ---------- */
function okT(){return typeof SESSIONS==='object'&&typeof curKey==='function'&&typeof S==='object'&&document.getElementById('blocks')&&!document.getElementById('warmBox')}
var openState={};
function renderT(){if(!okT())return;css();var d=SESSIONS[S.day],box=document.getElementById('mgwBox'),c=d&&cfg(d);
  if(!c){if(box)box.remove();return}
  var host=document.getElementById('blocks');
  if(!box){box=document.createElement('details');box.id='mgwBox';box.className='warmbox mgw';var sec=document.querySelector('.live')||host;sec.parentNode.insertBefore(box,sec);
    box.addEventListener('toggle',function(){openState[curKey()]=box.open})}
  S.warm=S.warm||{};var k=curKey(),w=S.warm[k]||{},n=c.items.filter(function(x,i){return w[i]}).length,all=c.items.length?n===c.items.length:!!w.v;
  var mins=c.items.length?Math.max(5,Math.round(c.items.length*1.2)):VIDS[c.video][2];
  box.innerHTML='<summary><div><div class="disp">Warm-up</div><p>'+(c.items.length?c.items.length+' exercises \u00b7 about '+mins+' min':'Follow-along video \u00b7 '+mins+' min')+' \u00b7 before you start</p></div><span class="wcount'+(all?' all':'')+'">'+(all?'Done':c.items.length?n+'/'+c.items.length:'0/1')+'</span></summary>'+
    (c.note?'<p class="objective" style="padding:0 16px 12px;margin:0">'+esc(c.note)+'</p>':'')+
    (c.items.length?'<div class="warm">'+c.items.map(function(x,i){var on=!!w[i],id=idFor(x.name);
      return '<div class="warm-row mgw-row'+(on?' on':'')+'"><label for="mgw-'+i+'"><input type="checkbox" id="mgw-'+i+'" data-mgw="'+i+'"'+(on?' checked':'')+'><span class="disp">'+esc(x.name)+'</span>'+(x.reps?'<span class="r">'+esc(x.reps)+'</span>':'')+'</label>'+(id?demoBtn(x.name,id):'')+'</div>'}).join('')+'</div>':
      '<div class="warm"><div class="warm-row mgw-row'+(w.v?' on':'')+'"><label for="mgw-v"><input type="checkbox" id="mgw-v" data-mgw="v"'+(w.v?' checked':'')+'><span class="disp">'+esc(VIDS[c.video][0])+'</span></label></div></div>')+
    (c.video?videoRow(c.video,!c.items.length):'');
  box.open=k in openState?openState[k]:!all}
function onChange(e){var t=e.target;if(!t||!t.dataset||t.dataset.mgw==null||!okT())return;var k=curKey(),c=cfg(SESSIONS[S.day]);
  S.warm=S.warm||{};S.warm[k]=S.warm[k]||{};S.warm[k][t.dataset.mgw]=t.checked;
  var all=c.items.length?c.items.every(function(x,i){return S.warm[k][i]}):!!S.warm[k].v;if(all)openState[k]=false;
  try{save()}catch(x){}renderT()}
function hook(){var o=window.renderDay;if(typeof o!=='function'||o.__mgw)return false;var f=function(){var r=o.apply(this,arguments);try{renderT()}catch(e){}return r};f.__mgw=1;window.renderDay=f;try{renderT()}catch(e){}return true}

/* ---------- 2. existing warm-up rows (Dan Jones, Pure plans) + 3. Harry / Kevin ---------- */
function decorate(){var rows=document.querySelectorAll('.warm-row:not(.mgw-row):not([data-mgwd])');if(rows.length)css();
  [].forEach.call(rows,function(r){r.setAttribute('data-mgwd','1');var t=r.querySelector('.disp'),id=t&&idFor(t.textContent);if(!id)return;
    var s=document.createElement('span');s.innerHTML=demoBtn(t.textContent.trim(),id);var b=s.firstChild,rr=r.querySelector('.r');if(rr)r.insertBefore(b,rr.nextSibling);else r.appendChild(b)});
  var wc=document.getElementById('warmCard');if(wc&&!document.getElementById('blocks')&&!wc.querySelector('.mgw-list')){css();var d=document.createElement('div');d.className='mgw-list';
    d.innerHTML='<p class="mgw-k">Golf warm-up \u00b7 tap Demo to see each one</p>'+STD.map(function(x){var id=idFor(x[0]);return '<div class="mgw-li"><span>'+esc(x[0])+'</span><span class="r">'+esc(x[1])+'</span>'+(id?demoBtn(x[0],id):'')+'</div>'}).join('')+videoRow('full');
    wc.appendChild(d)}}
function onClick(e){var b=e.target.closest&&e.target.closest('[data-mgw-v]');if(!b)return;e.preventDefault();e.stopPropagation();play(b.dataset.mgwN,b.dataset.mgwV,b.classList.contains('mgw-play')?'Follow-along warm-up':'Warm-up demo')}

function css(){if(document.getElementById('mgw-css'))return;var s=document.createElement('style');s.id='mgw-css';s.textContent=[
 '.mgw{margin:0 0 14px}',
 '.mgw-row{cursor:default;gap:10px}.mgw-row label{display:flex;align-items:center;gap:14px;flex:1;min-width:0;cursor:pointer}',
 '.mgw-row label input{width:22px;height:22px;accent-color:var(--ink,#0B0B0B);flex-shrink:0}',
 '.mgw-demo,.mgw-play{display:inline-flex;align-items:center;gap:5px;border:0;background:var(--ink,#0B0B0B);color:var(--yellow,#FFDA00);font:700 11px/1 var(--sans,Inter,sans-serif);letter-spacing:1.1px;text-transform:uppercase;padding:8px 10px;min-height:32px;cursor:pointer;flex-shrink:0;border-radius:0}',
 '.warm-row .mgw-demo{margin-left:8px}',
 '.mgw-vid{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-top:1px solid var(--hair,#E6E2D8);background:var(--cream,#F4F1EA)}',
 '.mgw-vid b{display:block;font:700 11px var(--sans,Inter,sans-serif);letter-spacing:1.2px;text-transform:uppercase;color:var(--ink,#0B0B0B)}.mgw-vid span{font-size:14px;color:var(--body,#3a3a36)}',
 '.mgw-play{background:var(--yellow,#FFDA00);color:var(--ink,#0B0B0B);padding:10px 14px}',
 '.mgw-list{margin-top:10px;border-top:1px solid var(--hair,#E6E2D8)}.mgw-k{margin:10px 0 4px;font:700 11px var(--sans,Inter,sans-serif);letter-spacing:1.2px;text-transform:uppercase;color:var(--muted,#77746c)}',
 '.mgw-li{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--hair,#E6E2D8)}.mgw-li span:first-child{flex:1}.mgw-li .r{font-family:var(--display);white-space:nowrap}',
 '.mgw-list .mgw-vid{margin-top:8px}'].join('');document.head.appendChild(s)}

function init(){document.addEventListener('change',onChange);document.addEventListener('click',onClick,true);var n=0;(function go(){if(hook()||++n>25)return;setTimeout(go,200)})();
  decorate();new MutationObserver(function(){decorate()}).observe(document.body,{childList:true,subtree:true})}
if(typeof document!=='undefined'&&document.addEventListener&&!window.MGW_NOAUTO){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else setTimeout(init,0)}
return {EX:EX,VIDS:VIDS,STD:STD,idFor:idFor,cfg:cfg,render:renderT};
})();
