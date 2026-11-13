/* Coach-built plan in the app (pages/coach-plan.html, www.macro.golf/coach-plan). 13 Nov 2026.
   One page for every plan made in the Plan Builder. My Plan signs the player in and leaves {code,pin} in
   localStorage 'mgsync-handoff'; boot() loads that code's latest published plan with mg_plan_content
   (supabase/014-coach-plan-app.sql), turns it into CLIENT + SESSIONS for the 1-to-1 plan engine
   (templates/parts), then runs the engine scripts, which tools/build-coach-plan.js leaves inert
   (type="text/mg-defer") until the plan is here.
   Practice tab: the coach's practice sessions. Games have a Start button that opens the game in the app with
   ?from=plan; src/plan-return.js brings the player back here and the game is ticked off. */
var MGCoachPlan=(function(){
if(window.MGCoachPlan)return window.MGCoachPlan;
var API='https://zhcgwtlyqriwlhbzkxcl.supabase.co/rest/v1/rpc/',APIKEY='sb_publishable__IBhmrVHOXsLHruU7XJB-g_OSN9Ljne',SITE='https://www.macro.golf/';
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}}
function js(k){try{return JSON.parse(ls(k)||'null')}catch(e){return null}}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function slug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24)||'x'}

/* ---------- who is this? ---------- */
function creds(){
  var h=js('mgsync-handoff');
  if(h&&h.code&&h.pin&&Date.now()-(+h.t||0)<6e5)return {code:String(h.code),pin:String(h.pin)};
  var me=js('mgplan:me');if(!me||!/^\d{6}$/.test(me.code||''))return null;
  var c=js('mgsync:mg-plan-coach-'+me.code+'-v1');
  return c&&c.pin?{code:me.code,pin:String(c.pin)}:null;
}
function root(){return document.getElementById('mg-root')||document.body}
function wrap(){return root().querySelector('.wrap')}
function msg(title,text,link){var w=wrap();if(w)w.style.display='none';var m=document.getElementById('cp-msg');if(!m){m=document.createElement('div');m.id='cp-msg';root().insertBefore(m,root().firstChild)}
  m.setAttribute('style','min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#F4F1EA;color:#0B0B0B;font:500 15px Inter,system-ui,sans-serif;text-align:center;padding:24px');
  m.innerHTML=(title?'<div style="font:400 30px/1 Anton,Impact,sans-serif;text-transform:uppercase">'+esc(title)+'</div>':'<i style="width:42px;height:42px;border:5px solid #0B0B0B;border-top-color:#FFD900;border-radius:50%;animation:cpspin .8s linear infinite;display:block"></i><style>@keyframes cpspin{to{transform:rotate(360deg)}}</style>')+
    '<p style="margin:0;max-width:34ch;line-height:1.5">'+esc(text)+'</p>'+(link?'<a href="'+SITE+'my-plan" style="min-height:48px;padding:12px 20px;background:#FFD900;color:#0B0B0B;font:400 18px Anton,Impact,sans-serif;text-transform:uppercase;text-decoration:none">Open My Plan</a>':'')}
function clearMsg(){var m=document.getElementById('cp-msg');if(m)m.remove();var w=wrap();if(w)w.style.display=''}

/* ---------- boot: fetch the plan, then run the engine ---------- */
function boot(){
  var c=creds();
  if(!c){msg('Your plan','Open your plan from My Plan in the Macro Golf app, so it knows who you are.',true);return}
  msg('','Loading your plan…');
  fetch(API+'mg_plan_content',{method:'POST',headers:{apikey:APIKEY,'Content-Type':'application/json'},body:JSON.stringify({p_code:c.code,p_pin:c.pin})})
  .then(function(r){return r.json()}).then(function(j){
    if(!j||j.error||!j.plan){var e=(j&&(j.error||j.message))||'Could not load your plan.';msg('Your plan',/PIN/i.test(e)?'That PIN did not match. Open My Plan and sign in again.':e,/PIN|code/i.test(e));return}
    window.MGCP_CODE=c.code;window.MGCP_DATA=j.plan;clearMsg();runDeferred();
  }).catch(function(){msg('No connection','Your plan could not load. Check your connection and try again.',true)});
}
function runDeferred(){
  var list=[].slice.call(document.querySelectorAll('script[type="text/mg-defer"]'));
  (function next(i){if(i>=list.length){after();return}var old=list[i],s=document.createElement('script'),src=old.getAttribute('data-src');old.removeAttribute('type');old.type='text/mg-done';
    if(src){s.src=src;s.charset='utf-8';s.onload=s.onerror=function(){next(i+1)};document.body.appendChild(s)}
    else{s.text=old.textContent;document.body.appendChild(s);next(i+1)}})(0);
}
function after(){returned()}

/* ---------- plan JSON -> CLIENT + SESSIONS (runs inside the engine, where x(), MAX, DB… exist) ---------- */
function incFor(name){var n=String(name).toLowerCase(),G=window;
  if(/med ball|slam|throw|discus|scoop/.test(n))return G.MB;if(/landmine/.test(n))return G.PLATE;if(/kettle|\bkb\b/.test(n))return G.KB;
  if(/cable|pull down|pulldown|push down|pushdown|woodchop|chop|pallof|leg curl|lat pull/.test(n))return G.CABLE;
  if(/barbell|trap bar|\bbar\b/.test(n))return G.BAR;if(/dumbbell|\bdb\b|goblet|farmer|carry/.test(n))return G.DB;return G.BW}
function rx(e,ph){
  var t=String(e.reps||'').trim(),type=e.type||'Strength',o;
  if(type==='Power')o={sets:3,reps:5,rpe:window.MAX,kind:'Power'};
  else if(type==='Strength')o={sets:3,reps:[12,10,8],rpe:[7,8,9],kind:'Strength'};
  else o={sets:3,reps:10,rpe:null,kind:type};
  if(t){var m=t.match(/(\d+)\s*[x×]\s*(\d+(?:\s*[-–]\s*\d+)?)/i),r=t.match(/@\s*(?:rpe\s*)?([\d\/\s.]+)/i);
    if(m){o.sets=+m[1];o.reps=m[2].replace(/\s/g,'')}
    else if(/^\d+(\s*\/\s*\d+)+/.test(t)){var a=t.match(/^[\d\s\/]+/)[0].split('/').map(function(z){return +z});o.sets=a.length;o.reps=a}
    else if(/^\d+/.test(t))o.reps=+t.match(/^\d+/)[0];
    if(r){var q=r[1].trim().split('/').map(function(z){return +z}).filter(function(z){return z>0});if(q.length)o.rpe=q.length>1?q:(q[0]>=10&&type==='Power'?window.MAX:q[0])}}
  if(e.each)o.side=true;o.inc=incFor(e.name);return o}
function qmap(list){var out=[],prevYN=null;(list||[]).forEach(function(q,i){if(!q||!String(q.q||'').trim())return;var k='q'+(i+1)+slug(q.q).slice(0,10),x={k:k,q:q.q};
  if(q.type==='Yes / No'){x.t='pick';x.o=['Yes','No'];prevYN=k}
  else if(q.type==='1–10'){x.t='pick';x.o=['1','2','3','4','5','6','7','8','9','10']}
  else{x.t='text';if(/^if yes/i.test(q.q)&&prevYN){var pk=prevYN;x.when=function(a){return a[pk]==='Yes'};x.opt=1}}
  out.push(x)});return out}
function build(){
  var p=window.MGCP_DATA||{},code=window.MGCP_CODE||'0',inc=p.include||{},ph=p.physical||{},wk=p.weekly||{},mob=p.mobility||{};
  var first=String(p.playerName||'').trim().split(/\s+/)[0]||'there';
  var habits=inc.habits===false?[]:(p.habits||[]).filter(function(h){return h&&h.name}).map(function(h){return {id:'h-'+slug(h.name),name:h.name,desc:[h.detail,h.dose].filter(Boolean).join(' ')}});
  var items=(inc.mobility===false?[]:(mob.items||[])).filter(function(m){return m&&m.name});
  var days=inc.physical===false?[]:(ph.dayList||[]);
  var SESSIONS=days.map(function(d,di){return {name:'Day '+(di+1),tab:'D'+(di+1),title:d.title||('Day '+(di+1)),short:d.title||('Day '+(di+1)),
    blocks:(d.pairs||[]).map(function(pr,pi){var L=String.fromCharCode(65+pi),ex=[];['a','b'].forEach(function(s,j){var e=pr[s];if(e&&String(e.name||'').trim())ex.push(window.x(slug(e.name)+'-'+(di+1)+L+(j+1),e.name,rx(e,ph)))});
      return {tag:L,label:'Superset '+L,rest:ph.rest||'45–60s',ex:ex}}).filter(function(b){return b.ex.length})}});
  var hasPractice=(inc.practice!==false&&((p.practice||{}).sessions||[]).length)||(inc.oncourse!==false&&((p.oncourse||{}).games||[]).length)||(inc.stats!==false&&(p.stats||[]).some(function(s){return s.baseline||s.target}));
  var CLIENT={name:p.playerName||'Player',first:first,key:'coach-'+code,weeks:+p.weeks||6,
    kicker:'Performance Plan',subtitle:'Phase '+(p.phase||1)+' · six-week plan',planName:'Performance Plan',
    features:{checkin:true,weight:inc.weight!==false,mobility:items.length>0},
    strip:[['Gym',(+wk.physical||SESSIONS.length)+' / week']].concat(hasPractice?[['Practice',(+wk.practice||0)+' / week']]:[]).concat(habits.length?[['Habits',habits.length+' / day']]:[]),
    habits:habits,weekly:{gym:+wk.physical||SESSIONS.length},
    weekNote:wk.connected||'',gymNote:ph.note||'',
    objective:[ph.structure,ph.strength?'Strength: '+ph.strength:'',ph.power?'Power: '+ph.power:''].filter(Boolean).join('. ')+'.',
    restNote:ph.rest||'',
    guide:[['RPE 7','About three reps left in the tank.'],['RPE 8','About two reps left.'],['RPE 9','About one rep left.'],
      ['Max intent','RPE 10 on power exercises means maximal explosive intent, not muscular failure.'],
      ['Progress',ph.progression||'Keep the exercises, sets and reps the same through the block and progress through load.'],
      ['Load','After each set, enter the kg, reps and RPE. The next set is suggested from the same set last time.']]};
  if(habits.length)CLIENT.streak={id:habits[0].id,label:habits[0].name+' streak',name:habits[0].name};
  if(items.length){CLIENT.mobilityRoutine=items.map(function(m){return {name:m.kind==='video'?m.name:(m.name+(m.dose?' · '+m.dose:'')),mins:m.mins||'',wistia:m.wistia||null}});
    CLIENT.mobilityDesc=[mob.frequency,mob.when].filter(Boolean).join(' · ')+'. Tap Watch now to follow along, then tick it off.'}
  if(inc.checkin!==false&&((p.checkin||{}).questions||[]).length)CLIENT.weeklyQuestions=qmap(p.checkin.questions);
  if(hasPractice)CLIENT.extraTabs=[{id:'practice',label:'Practice',render:renderPractice}];
  return {CLIENT:CLIENT,SESSIONS:SESSIONS};
}

/* ---------- Practice tab ---------- */
var GAME={};(window.MGLib&&MGLib.GAMES||[]).forEach(function(g){GAME[g[1]]=g});
function css(){if(document.getElementById('cp-css'))return;var s=document.createElement('style');s.id='cp-css';s.textContent=[
 '.cp-card{background:var(--paper,#fff);border:1px solid var(--hair,rgba(11,11,11,.13));border-left:6px solid var(--yellow,#FFD900);padding:16px;display:flex;flex-direction:column;gap:10px}',
 '.cp-card h3{margin:0;font:400 22px/1.05 var(--display,Anton,Impact,sans-serif);text-transform:uppercase;color:var(--ink,#0B0B0B)}',
 '.cp-note{margin:0;color:var(--body,#3B3830);font-size:14px;line-height:1.5}',
 '.cp-row{display:grid;grid-template-columns:28px 1fr;gap:10px;align-items:start;padding:10px 0;border-top:1px solid var(--hair,rgba(11,11,11,.13))}',
 '.cp-row input{width:22px;height:22px;accent-color:#0B0B0B;margin:2px 0 0}',
 '.cp-row b{font:600 15px var(--sans,Inter,sans-serif);color:var(--ink,#0B0B0B)}',
 '.cp-tag{display:inline-block;font:700 10px var(--sans,Inter,sans-serif);letter-spacing:1.6px;text-transform:uppercase;padding:2px 6px;margin-right:6px;background:var(--track,#E6E1D3);color:var(--ink,#0B0B0B);vertical-align:2px}',
 '.cp-tag.g{background:var(--yellow,#FFD900)}',
 '.cp-meta{font-size:13px;color:var(--muted,#77715F);margin-top:2px}',
 '.cp-att{display:flex;align-items:center;gap:8px;font:700 10px var(--sans,Inter,sans-serif);letter-spacing:1.4px;text-transform:uppercase;color:var(--muted,#77715F);margin-top:6px}',
 '.cp-att span.t{position:relative;flex:0 1 160px;height:8px;border-radius:4px;background:linear-gradient(90deg,var(--track,#E6E1D3),var(--ink,#0B0B0B))}',
 '.cp-att span.t i{position:absolute;top:-4px;width:6px;height:16px;background:var(--yellow,#FFD900);border:1px solid #0B0B0B;transform:translateX(-50%)}',
 '.cp-go{margin-top:8px;min-height:46px;width:100%;border:0;background:var(--ink,#0B0B0B);color:var(--yellow,#FFD900);font:400 18px var(--display,Anton,Impact,sans-serif);text-transform:uppercase;letter-spacing:.3px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}',
 '.cp-go.done{background:var(--track,#E6E1D3);color:var(--ink,#0B0B0B)}',
 '.cp-go:focus-visible,.cp-row input:focus-visible{outline:3px solid var(--yellow,#FFD900);outline-offset:2px}',
 '.cp-prog{font:600 13px var(--sans,Inter,sans-serif);color:var(--muted,#77715F)}',
 '.cp-kpi{width:100%;border-collapse:collapse;font-size:14px}.cp-kpi th{text-align:left;font:700 10px var(--sans,Inter,sans-serif);letter-spacing:1.4px;text-transform:uppercase;color:var(--muted,#77715F);padding:6px 4px;border-bottom:2px solid var(--ink,#0B0B0B)}',
 '.cp-kpi td{padding:8px 4px;border-bottom:1px solid var(--hair,rgba(11,11,11,.13))}.cp-kpi td.n{font-variant-numeric:tabular-nums;font-weight:600}',
 '.cp-link{color:var(--ink,#0B0B0B);font-weight:600}',
 'details.cp-focus summary{cursor:pointer;font:400 20px var(--display,Anton,Impact,sans-serif);text-transform:uppercase;list-style:none}',
 'details.cp-focus summary::after{content:" +";color:var(--muted,#77715F)}details[open].cp-focus summary::after{content:" –"}'
].join('');document.head.appendChild(s)}
function att(v){v=+v;return isNaN(v)?50:Math.max(0,Math.min(100,v))}
function attHtml(v){v=att(v);var l=v<=15?'Fully internal':v<40?'Mostly internal':v<=60?'Balanced':v<85?'Mostly external':'Fully external';
  return '<div class="cp-att" aria-label="Attention: '+l+'">Internal <span class="t"><i style="left:'+v+'%"></i></span> External · '+l+'</div>'}
function wk(){var S=window.S;S.practice=S.practice||{};var k='w'+(S.week||1);S.practice[k]=S.practice[k]||{};return S.practice[k]}
function sec(kick,title){return '<div class="sec"><div class="kick">'+esc(kick)+'</div><h2>'+esc(title)+'</h2><div class="bar" aria-hidden="true"></div></div>'}
function renderPractice(el){
  css();var p=window.MGCP_DATA||{},inc=p.include||{},done=wk(),sessions=inc.practice===false?[]:((p.practice||{}).sessions||[]),target=+((p.weekly||{}).practice)||0;
  var full=sessions.filter(function(s){return (s.drills||[]).length&&(s.drills||[]).every(function(d){return done[d.id]})}).length;
  var h='';
  var f=p.focus||{},pr=(p.priorities||[]).filter(function(x){return x.title});
  if(f.outcome||pr.length)h+='<div class="cp-card" style="margin-top:14px"><details class="cp-focus"><summary>Your six-week focus</summary>'+(f.outcome?'<p class="cp-note" style="margin-top:8px"><b>'+esc(f.outcome)+'</b></p>':'')+(f.outcomeDetail?'<p class="cp-note">'+esc(f.outcomeDetail)+'</p>':'')+
    (pr.length?'<ol class="cp-note" style="padding-left:20px;margin:8px 0 0">'+pr.map(function(x){return '<li><b>'+esc(x.title)+'</b>'+(x.change?' · '+esc(x.change):'')+'</li>'}).join('')+'</ol>':'')+'</details></div>';
  if(sessions.length){
    h+=sec('This week','Practice sessions')+'<p class="cp-prog">'+full+' of '+(target||sessions.length)+' sessions done this week'+(p.practice.intro?' · '+esc(p.practice.intro):'')+'</p>';
    h+=sessions.map(function(s,si){var dr=s.drills||[];return '<div class="cp-card" style="margin-top:10px"><h3>'+esc(s.name||('Session '+(si+1)))+'</h3>'+(s.warmup?'<p class="cp-note">'+esc(s.warmup)+'</p>':'')+
      dr.map(function(d){var isG=d.env!=='Technical',g=d.game&&GAME[d.game],on=!!done[d.id],id='cp-'+esc(d.id);
        return '<div class="cp-row"><input type="checkbox" id="'+id+'" data-cpd="'+esc(d.id)+'"'+(on?' checked':'')+'><div><label for="'+id+'"><span class="cp-tag'+(isG?' g':'')+'">'+(isG?'Game':'Technical')+'</span><b>'+esc(d.name||'Drill')+'</b></label>'+
          (d.volume?'<div class="cp-meta">'+esc(d.volume)+' '+esc(String(d.volume).trim()==='1'?String(d.unit||'').replace(/s$/,''):(d.unit||''))+'</div>':'')+(d.detail?'<p class="cp-note" style="margin-top:4px">'+esc(d.detail)+'</p>':'')+attHtml(d.attention)+
          (g?'<button type="button" class="cp-go'+(on?' done':'')+'" data-cpg="'+esc(d.game)+'" data-cpid="'+esc(d.id)+'">'+(on?'Play '+esc(g[0])+' again':'Start '+esc(g[0]))+' <span aria-hidden="true">›</span></button>':'')+'</div></div>'}).join('')+
      (s.close?'<p class="cp-note" style="margin-top:6px">'+esc(s.close)+'</p>':'')+'</div>'}).join('');
  }
  var oc=p.oncourse||{},games=inc.oncourse===false?[]:(oc.games||[]).filter(function(g){return g.name});
  if(games.length||oc.intention||oc.strategy){
    h+=sec('On the course','On-course plan');
    h+=games.map(function(g){var id='cp-oc-'+esc(g.id),on=!!done['oc-'+g.id];return '<div class="cp-card" style="margin-top:10px"><div class="cp-row" style="border-top:0;padding-top:0"><input type="checkbox" id="'+id+'" data-cpd="oc-'+esc(g.id)+'"'+(on?' checked':'')+'><div><label for="'+id+'"><span class="cp-tag g">Game</span><b>'+esc(g.name)+'</b></label>'+
      '<div class="cp-meta">'+esc([g.holes?g.holes+' holes':'',g.target].filter(Boolean).join(' · '))+'</div>'+(g.detail?'<p class="cp-note" style="margin-top:4px">'+esc(g.detail)+'</p>':'')+attHtml(g.attention)+'</div></div></div>'}).join('');
    var tips=[['Intention',oc.intention],['Strategy',oc.strategy],['Before the round',oc.preround],['After the round',oc.postround]].filter(function(t){return t[1]});
    if(tips.length)h+='<div class="cp-card" style="margin-top:10px">'+tips.map(function(t){return '<p class="cp-note"><b>'+esc(t[0])+'.</b> '+esc(t[1])+'</p>'}).join('')+'</div>';
  }
  var st=inc.stats===false?[]:(p.stats||[]).filter(function(s){return s.name&&(s.baseline||s.target)});
  if(st.length)h+=sec('Your numbers','Targets for the review')+'<div class="cp-card" style="margin-top:10px"><table class="cp-kpi"><tr><th>Measure</th><th>Start</th><th>Target</th></tr>'+st.map(function(s){return '<tr><td>'+esc(s.name)+'</td><td class="n">'+esc(s.baseline||'–')+'</td><td class="n">'+esc(s.target||'–')+'</td></tr>'}).join('')+'</table><a class="cp-link" href="'+SITE+'my-numbers">Open My Numbers ›</a></div>';
  el.innerHTML=h||sec('Practice','Nothing set yet')+'<p class="cp-note">Your coach will add your practice here.</p>';
}
document.addEventListener('change',function(e){var t=e.target;if(!t.dataset||!t.dataset.cpd||!window.S)return;var d=wk();if(t.checked)d[t.dataset.cpd]=true;else delete d[t.dataset.cpd];window.save&&save();rerender()});
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-cpg]');if(!b)return;
  ls('mgplan-return',JSON.stringify({url:location.href,g:b.dataset.cpg,t:Date.now()}));
  ls('cp-pending',JSON.stringify({id:b.dataset.cpid,g:b.dataset.cpg,w:(window.S&&S.week)||1,t:Date.now()}));
  location.href=SITE+b.dataset.cpg+'?from=plan'});
function rerender(){var el=document.getElementById('p-practice');if(el&&!el.hidden)renderPractice(el)}
/* back from a game: src/plan-return.js left 'mgplan-done' = {g, done} */
function returned(){var pd=js('cp-pending'),dn=js('mgplan-done');if(!pd||!dn)return;
  if(Date.now()-(+pd.t||0)>12*3600e3){ls('cp-pending',null);return}
  if(dn.g===pd.g&&(+dn.t||0)>=(+pd.t||0)){if(dn.done&&window.S){S.practice=S.practice||{};var k='w'+(pd.w||1);S.practice[k]=S.practice[k]||{};S.practice[k][pd.id]=true;window.save&&save()}
    ls('cp-pending',null);ls('mgplan-done',null);if(window.showTab)showTab('practice')}}

return {boot:boot,build:build};
})();
