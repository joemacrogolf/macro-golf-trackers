/* Macro Golf · Swap this exercise (training plans built from templates/, i.e. clients/*.js and Build My Plan)
   A "Swap" button on every exercise: 2 suggestions (same kind of movement, kit the client is more likely to have)
   or type your own; then "Just today" or "For the rest of the plan".
   Saved in S.swaps: {plan:{<id>:{n,from,k,t}}, day:{<sessKey>:{<id>:{n,from,t}}}, log:[{t,k,id,from,to,scope}]}.
   Logs of a swapped exercise are kept under '<id>~<slug>' so load suggestions follow the new exercise, not the old one.
   The coach dashboard (pages/coach.html) reads S.swaps.log and flags 1-to-1 clients who swapped.
   The engine calls MGSwap.apply(e, sessKey) from activeEx(). */
var MGSwap=(function(){
var LIB={"pull":["Pull Up|g|0","Cable Lat Pull Down|g","Cable Single Arm Lat Pull Down|g|s","Banded Lat Pull Down|b|0","Cable Row|g","Dumbbell Single Arm Row|h|s","Banded Row|b|0","Cable Straight Arm Pull Downs|g","Dumbbell Pull Over|h","Face Pull with Band|b|0"],"push":["Dumbbell Incline Bench Press|g","Dumbbell Flat Bench Press|g","Dumbbell Floor Press|h","Press Up|b|0","Elevated Press Up|b|0","Kneeling Landmine Single Shoulder Press|g|s","Single Arm Kneeling Shoulder Press|h|s","Banded Shoulder Press|b|0"],"legs":["Dumbbell Goblet Squat|h","Banded Deadlift|b|0","Dumbbell RDL|h","Cable RDL|g","Dumbbell Split Squat|h|s","Split Squat|b|0|s","Dumbbell Reverse Lunge|h|s","Reverse Lunge|b|0|s","Dumbbell Side Lunge|h|s","Lateral Lunge|b|0|s","Laying Leg Curl|g","Single Leg Glute Bridge|b|0|s","Leg Extension Machine|g","Dumbbell Step Ups|h|s"],"rot":["Cable Woodchop|g|s","Banded Half Kneeling Chop|b|0|s","Cable Full Rotation|g|s","Pallof Press|g|s","Pallof Press|b|0|s"],"chop":["High Hands Slam|g","Med Ball Slam|g","Jump Back Overhead Slam|g","Overhead Throw|g","Kettlebell Snatch|g|s","Banded Lat Pull Down|b|0","Banded Half Kneeling Chop|b|0|s","Low to High Cable Cross Chop|g|s","Low to High Cross Chop with Band|b|0|s","Cable Power Row|g","Banded Power Row|b|0"],"vert":["Counter Movement Jump|b|0","Box Jumps|g|0","Power Jumps|b|0","Forward Power Lunge|b|0|s","Single Leg Deficit Hop|b|0|s","Dumbbell Step Ups|h|s","Explosive Step Downs|b|0|s","GRF Kettlebell Swing|g"],"wrist":["Supine Chest Throws|g","Power Press Up|b|0","Elevated Power Press Up|b|0","GRF Cable Push|g|s","Dumbbell Push Press|h","Banded Single Arm Push Press|b|0|s","GRF Landmine Press|g|s"],"lat":["Med Ball Discus Throw|g|s","Banded Rotations|b|0|s","Banded Press with Rotation|b|0|s","Skater Jumps|b|0|s","Heiden to Vertical Jump|b|0|s","Power Lunge|b|0|s"],"seq":["Golf Swing Row (Backswing)|g|s","Golf Swing Row (Downswing)|g|s","Resistance Step with Rotation|g|s","Split Press with Rotation|g|s","Single Leg Pallof Press|g|s"],"core":["Core Stability Chop|g|s","Kettlebell Halo|g"],"curl":["Dumbbell Bicep Curl|h","Banded Bicep Curl|b|0","Cable Bicep Curl|g","Dumbbell Hammer Curl|h"],"tri":["Overhead Dumbbell Tricep Extension|h","Resistance Band Tricep Extensions|b|0","Tricep Push Down|g","Close Grip Press Up|b|0"],"delt":["Dumbbell Lateral Raise|h","Banded Lateral Raise|b|0","Cable Lateral Raise|g","Dumbbell Rear Delt Fly|h"],"hips":["Banded Lateral Walk|b|0","Banded Clamshell|b|0","Copenhagen Plank|b|0","Cable Hip Abduction|g","Cable Hip Adduction|g"],"ham":["Dumbbell RDL|h","Swiss Ball Hamstring Curl|b|0","Single Leg Glute Bridge|b|0","Laying Leg Curl|g"]};
var RULES=[[/leg curl|hamstring|nordic/,'ham'],[/leg press|hack squat|leg extension/,'legs'],[/curl/,'curl'],[/tricep|pushdown|skull/,'tri'],[/lateral raise|rear delt|front raise/,'delt'],
 [/adduct|abduct|clam|lateral walk|copenhagen/,'hips'],[/jump|hop|bound|step down|pogo/,'vert'],[/slam|chop/,'chop'],[/wrist|snap|release/,'wrist'],
 [/throw|scoop|shot put|toss|rotational/,'lat'],[/woodchop|rotation|pallof|anti.?rot/,'rot'],[/plank|dead bug|bird dog|carry|crunch|hollow|core|bear/,'core'],
 [/row|pull|\bchin|\blat\b/,'pull'],[/press|push|bench|dip|fly|flye/,'push'],[/squat|lunge|rdl|deadlift|leg|step up|thrust|bridge|split|calf|hinge|glute/,'legs']];
var ALL={};Object.keys(LIB).forEach(function(g){LIB[g]=LIB[g].map(function(s){var p=s.split('|');var x={n:p[0],eq:p[1],bw:p.indexOf('0')>1,side:p.indexOf('s')>1,g:g};ALL[x.n.toLowerCase()]=x;return x})});
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'x'}
function ord(k){var m=String(k).match(/^w(\d+)-s(\d+)$/);return m?(+m[1])*100+(+m[2]):-1}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function group(name,kind){var n=String(name||'').toLowerCase(),x=ALL[n];if(x)return x.g;
  for(var i=0;i<RULES.length;i++)if(RULES[i][0].test(n))return RULES[i][1];return /power/i.test(kind||'')?'chop':null}
/* 2 suggestions: something with dumbbells/home kit and something with bands or no kit, never the same exercise */
function nm(s){return String(s||'').toLowerCase().replace(/\bdb\b/g,'dumbbell').replace(/\bkb\b/g,'kettlebell').replace(/s\b/g,'').replace(/\s+/g,' ').trim()}
function suggest(e){var g=group(e.name,e.kind);if(!g||!LIB[g])return [];var cur=nm(e.name),me=ALL[String(e.name).toLowerCase()],pool=LIB[g].filter(function(x){return nm(x.n)!==cur});
  var want=me&&me.eq==='b'?['h','b','g']:me&&me.eq==='h'?['b','h','g']:['h','b','g'],out=[];
  var W=['row','shoulder','bench','pre up','pre','pull down','pull up','squat','lunge','deadlift','rdl','step','bridge','thrust','curl','raise','chop','slam','throw','jump','hop','rotation','pallof','plank','single arm','single leg'],sc=function(x){var a=nm(x.n),n=0;W.forEach(function(w){if(cur.indexOf(w)>=0&&a.indexOf(w)>=0)n++});return n};
  pool=pool.map(function(x,i){return {x:x,s:sc(x),i:i}}).sort(function(a,b){return b.s-a.s||a.i-b.i}).map(function(o){return o.x});
  want.forEach(function(q){if(out.length<2){var f=pool.filter(function(x){return x.eq===q&&out.indexOf(x)<0})[0];if(f)out.push(f)}});
  pool.forEach(function(x){if(out.length<2&&out.indexOf(x)<0)out.push(x)});return out}
function store(){var S=window.S;S.swaps=S.swaps||{};S.swaps.plan=S.swaps.plan||{};S.swaps.day=S.swaps.day||{};S.swaps.log=S.swaps.log||[];return S.swaps}
function current(id,k){var W=window.S&&window.S.swaps;if(!W)return null;var d=W.day&&W.day[k]&&W.day[k][id];if(d)return d.n?d:null;
  var p=W.plan&&W.plan[id];if(p&&p.n&&ord(k)>=ord(p.k||'w0-s0'))return p;return null}
function apply(e,k){if(!e)return e;var s=current(e.id,k);if(!s)return e;var lib=ALL[String(s.n).toLowerCase()];
  var c={};for(var key in e)c[key]=e[key];c.id=e.id+'~'+slug(s.n);c.baseId=e.id;c.name=s.n;c.swappedFrom=e.name;c.swapScope=s.k?'plan':'day';c.focus='';
  c.note='Swapped from '+e.name+(s.k?' for the rest of the plan.':' for today.');if(lib){c.inc=lib.bw?null:(typeof e.inc==='number'?e.inc:(lib.eq==='h'?2:2.5));c.side=lib.side||e.side}return c}
function log(k,id,from,to,scope){var W=store();W.log.push({t:new Date().toISOString(),d:today(),k:k,id:id,from:from,to:to||'',scope:scope});if(W.log.length>100)W.log=W.log.slice(-100)}
function set(k,e,name,scope){var W=store(),id=e.baseId||e.id,from=e.swappedFrom||e.name;
  if(scope==='plan'){W.plan[id]={n:name,from:from,k:k,t:new Date().toISOString()};if(W.day[k])delete W.day[k][id]}
  else{W.day[k]=W.day[k]||{};W.day[k][id]={n:name,from:from,t:new Date().toISOString()}}
  W.names=W.names||{};W.names[id+'~'+slug(name)]=name;
  /* sets already typed in this session move across to the new exercise */
  var L=window.S.logs&&window.S.logs[k],cur=e.id,nid=id+'~'+slug(name);if(L&&L[cur]&&!L[nid]&&cur!==nid){L[nid]=L[cur];delete L[cur]}
  log(k,id,from,name,scope)}
function undo(k,e){var W=store(),id=e.baseId||e.id;
  if(e.swapScope==='plan'){var p=W.plan[id];if(p&&ord(p.k)<ord(k)){W.day[k]=W.day[k]||{};W.day[k][id]={n:'',from:e.swappedFrom,t:new Date().toISOString()}}else delete W.plan[id]} /* earlier sessions keep the swap they were logged with */
  else if(W.day[k]){delete W.day[k][id]}
  var L=window.S.logs&&window.S.logs[k];if(L&&L[e.id]&&!L[id]){L[id]=L[e.id];delete L[e.id]}
  log(k,id,e.swappedFrom||'',e.swappedFrom||'','back')}
function css(){if(document.getElementById('mgsw-css'))return;var s=document.createElement('style');s.id='mgsw-css';s.textContent=[
 '.swapbtn{display:inline-flex;align-items:center;gap:5px;margin-top:8px;min-height:34px;padding:0 10px;border:1.5px solid var(--ink,#0B0B0B);background:transparent;font:700 11px Inter,system-ui,sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:var(--ink,#0B0B0B);cursor:pointer}',
 '.swapbtn:focus-visible,.mgsw button:focus-visible,.mgsw input:focus-visible{outline:3px solid #FFD900;outline-offset:2px}',
 '.swapped-from{display:block;margin-top:5px;font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:#C8571B}',
 '.mgsw{position:fixed;inset:0;z-index:99999;background:rgba(11,11,11,.72);display:flex;align-items:flex-end;justify-content:center;font-family:Inter,system-ui,sans-serif}',
 '.mgsw-box{background:#F4F1EA;color:#0B0B0B;width:100%;max-width:520px;max-height:92vh;overflow:auto;padding:22px 18px 26px;border-top:6px solid #FFD900}',
 '@media(min-width:700px){.mgsw{align-items:center}.mgsw-box{border-top:0;border-left:6px solid #FFD900}}',
 '.mgsw h3{font-family:Anton,Impact,sans-serif!important;font-weight:400;text-transform:uppercase;font-size:26px;line-height:1.05;margin:4px 0 6px;color:#0B0B0B!important}',
 '.mgsw .k{font-weight:700;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#6f6b62;margin:16px 0 8px}',
 '.mgsw p{margin:0;font-size:14px;line-height:1.45;color:#3d3a34}',
 '.mgsw .opt{display:flex;width:100%;text-align:left;align-items:center;gap:10px;min-height:56px;padding:10px 14px;margin-bottom:8px;border:2px solid #0B0B0B;background:#fff;font:600 16px Inter,system-ui,sans-serif;color:#0B0B0B;cursor:pointer}',
 '.mgsw .opt small{display:block;font-weight:400;font-size:12.5px;color:#6f6b62;margin-top:2px}',
 '.mgsw .opt[aria-pressed=true]{background:#0B0B0B;color:#F4F1EA}.mgsw .opt[aria-pressed=true] small{color:#c9c4b8}',
 '.mgsw input[type=text]{width:100%;min-height:52px;border:2px solid #0B0B0B;background:#fff;padding:0 12px;font:400 16px Inter,system-ui,sans-serif;color:#0B0B0B}',
 '.mgsw .scope{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mgsw .scope .opt{justify-content:center;text-align:center;flex-direction:column;gap:0}',
 '.mgsw .go{width:100%;min-height:54px;margin-top:18px;border:0;background:#FFD900;color:#0B0B0B;font-family:Anton,Impact,sans-serif;text-transform:uppercase;font-size:20px;cursor:pointer}',
 '.mgsw .go:disabled{opacity:.45;cursor:default}',
 '.mgsw .lnk{display:block;margin:12px auto 0;background:none;border:0;font:600 14px Inter,system-ui,sans-serif;color:#0B0B0B;text-decoration:underline;cursor:pointer;min-height:40px}',
 '.mgsw .err{color:#C8571B;font-size:13px;min-height:1em;margin-top:6px}'].join('');document.head.appendChild(s)}
function kitTxt(x){return x.eq==='b'?'Bands or bodyweight':x.eq==='h'?'Dumbbells or home kit':'Gym kit'}
function open(e,k,done){css();var sug=suggest(e),pick=null,scope=null,one=typeof CLIENT!=='undefined'&&CLIENT.key!=='build-my-plan'; /* 1-to-1 plans: the coach sees swaps on the dashboard */
  var w=document.createElement('div');w.className='mgsw';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');w.setAttribute('aria-labelledby','mgsw-t');
  var orig=e.swappedFrom||e.name;
  w.innerHTML='<div class="mgsw-box"><div class="k" style="margin-top:0">Swap this exercise</div><h3 id="mgsw-t">'+esc(e.name)+'</h3>'+
   '<p>No kit for it, or the machine is taken? Pick something that trains the same thing. Sets, reps and effort stay the same.</p>'+
   (e.swappedFrom?'<button type="button" class="opt" data-back="1">Back to '+esc(orig)+'<small>Undo the swap</small></button>':'')+
   (sug.length?'<div class="k">Suggestions</div>'+sug.map(function(x,i){return '<button type="button" class="opt" data-s="'+i+'" aria-pressed="false"><span>'+esc(x.n)+'<small>'+kitTxt(x)+'</small></span></button>'}).join(''):'')+
   '<div class="k"><label for="mgsw-own">'+(sug.length?'Or type your own':'Type the exercise you’ll do instead')+'</label></div><input type="text" id="mgsw-own" maxlength="60" autocomplete="off" placeholder="e.g. Dumbbell Row">'+
   '<div class="k">How long for?</div><div class="scope"><button type="button" class="opt" data-scope="day" aria-pressed="false">Just today<small>Back to normal next time</small></button><button type="button" class="opt" data-scope="plan" aria-pressed="false">Rest of the plan<small>From this session on</small></button></div>'+
   '<p class="err" id="mgsw-err" role="alert"></p><button type="button" class="go" id="mgsw-go" disabled>Swap it</button>'+
   (one?'<p style="margin-top:10px;font-size:12.5px;color:#6f6b62">Your coach will see that you swapped this.</p>':'')+
   '<button type="button" class="lnk" id="mgsw-x">Cancel</button></div>';
  document.body.appendChild(w);var prevOv=document.body.style.overflow;document.body.style.overflow='hidden';
  var q=function(s){return w.querySelector(s)},own=q('#mgsw-own'),go=q('#mgsw-go'),last=document.activeElement;
  function close(){w.remove();document.body.style.overflow=prevOv;try{last&&last.focus()}catch(x){}}
  function name(){return pick!=null?sug[pick].n:own.value.trim()}
  function upd(){[].forEach.call(w.querySelectorAll('[data-s]'),function(b){b.setAttribute('aria-pressed',String(+b.dataset.s===pick))});
    [].forEach.call(w.querySelectorAll('[data-scope]'),function(b){b.setAttribute('aria-pressed',String(b.dataset.scope===scope))});go.disabled=!(name()&&scope)}
  w.addEventListener('click',function(ev){var t=ev.target.closest('button');if(ev.target===w){close();return}if(!t)return;
    if(t.dataset.back){undo(k,e);window.save();close();done&&done();return}
    if(t.dataset.s!=null){pick=+t.dataset.s===pick?null:+t.dataset.s;if(pick!=null)own.value='';upd();return}
    if(t.dataset.scope){scope=t.dataset.scope;upd();return}
    if(t.id==='mgsw-x'){close();return}
    if(t.id==='mgsw-go'){var n=name();if(!n||!scope)return;if(n.toLowerCase()===String(orig).toLowerCase()){q('#mgsw-err').textContent='That is the exercise you already have.';return}
      set(k,e,n,scope);window.save();close();done&&done()}});
  own.addEventListener('input',function(){if(own.value.trim())pick=null;upd()});
  w.addEventListener('keydown',function(ev){if(ev.key==='Escape')close()});
  setTimeout(function(){var f=w.querySelector('.opt');(f||own).focus()},30)}
/* the button: the engine prints <button class="swapbtn" data-swap="<id>">; find that exercise in today's session and open */
document.addEventListener('click',function(ev){var b=ev.target.closest&&ev.target.closest('[data-swap]');if(!b||typeof activeList!=='function')return;
  var k=curKey(),hit=null;activeList(S.day,k).forEach(function(a){if(a.e.id===b.dataset.swap)hit=a.e});if(!hit)return;
  open(hit,k,function(){if(typeof renderDay==='function')renderDay();setTimeout(function(){var nb=document.querySelector('[data-swap="'+(hit.baseId||hit.id)+'"],[data-swap^="'+(hit.baseId||hit.id)+'~"]');if(nb)nb.focus()},50)})});
css();
/* this file loads after the plan has drawn: draw it again so the Swap buttons appear */
setTimeout(function(){try{if(typeof renderDay==='function'&&typeof SESSIONS!=='undefined')renderDay()}catch(e){}},0);
return {apply:apply,suggest:suggest,group:group,open:open,LIB:LIB}})();
