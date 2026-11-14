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
  /* coach preview (Plan Builder > Review & create > Preview the app plan): the builder leaves the plan in localStorage 'cp-preview'.
     Runs on this device only: no sign-in, no cloud save, starts fresh each time, never touches the player's record. */
  if(/[?&]preview=1/.test(location.search)){var pv=js('cp-preview');
    if(!pv||!pv.plan){msg('Coach preview','Open the preview from the Plan Builder (Review & create).',false);return}
    window.MGCP_PREVIEW=true;window.MGCP_CODE='preview';window.MGCP_DATA=pv.plan;
    if(!/[?&]keep=1/.test(location.search)&&!sessionStorage.getItem('cp-pv-'+pv.t)){try{localStorage.removeItem('mg-plan-coach-preview-v1');sessionStorage.setItem('cp-pv-'+pv.t,'1')}catch(e){}}
    var bar=document.createElement('div');bar.id='cp-pvbar';bar.setAttribute('style','position:sticky;top:0;z-index:9998;background:#FFD900;color:#0B0B0B;font:700 13px Inter,sans-serif;padding:9px 14px;text-align:center');
    bar.textContent='Coach preview of '+(pv.plan.playerName||'the player')+'\u2019s plan \u00b7 nothing you do here is saved to their record';root().insertBefore(bar,root().firstChild);
    var ran=0,go=function(){if(ran++)return;runDeferred()};if(window.MGLib&&MGLib.loadGames){setTimeout(go,2500);MGLib.loadGames().then(go,go)}else go();return}
  var c=creds();
  if(!c){msg('Your plan','Open your plan from My Plan in the Macro Golf app, so it knows who you are.',true);return}
  msg('','Loading your plan…');
  fetch(API+'mg_plan_content',{method:'POST',headers:{apikey:APIKEY,'Content-Type':'application/json'},body:JSON.stringify({p_code:c.code,p_pin:c.pin})})
  .then(function(r){return r.json()}).then(function(j){
    if(!j||j.error||!j.plan){var e=(j&&(j.error||j.message))||'Could not load your plan.';msg('Your plan',/PIN/i.test(e)?'That PIN did not match. Open My Plan and sign in again.':e,/PIN|code/i.test(e));return}
    CRED=c;loadBoard();window.MGCP_CODE=c.code;window.MGCP_DATA=j.plan;var ran=0,go=function(){if(ran++)return;clearMsg();runDeferred()};
    if(window.MGLib&&MGLib.loadGames){setTimeout(go,2500);MGLib.loadGames().then(go,go)}else go();
  }).catch(function(){msg('No connection','Your plan could not load. Check your connection and try again.',true)});
}
function runDeferred(){
  var list=[].slice.call(document.querySelectorAll('script[type="text/mg-defer"]'));
  (function next(i){if(i>=list.length){after();return}var old=list[i],s=document.createElement('script'),src=old.getAttribute('data-src');old.removeAttribute('type');old.type='text/mg-done';
    if(src){s.src=src;s.charset='utf-8';s.onload=s.onerror=function(){next(i+1)};document.body.appendChild(s)}
    else{s.text=old.textContent;document.body.appendChild(s);next(i+1)}})(0);
}
/* ---------- from your coach: shared 1-to-1 notes + accountability tasks (supabase/016, written in the Player dashboard) ---------- */
var CRED=null,BOARD=null;
function loadBoard(){if(!CRED)return;fetch(API+'mg_player_board',{method:'POST',headers:{apikey:APIKEY,'Content-Type':'application/json'},body:JSON.stringify({p_code:CRED.code,p_pin:CRED.pin})})
  .then(function(r){return r.json()}).then(function(j){if(j&&!j.error){BOARD=j;if(window.__cpPut)window.__cpPut(true)}}).catch(function(){})}
function niceD(s){if(!s)return '';var d=new Date(String(s).slice(0,10)+'T12:00:00');return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
function boardHTML(){var b=BOARD;if(window.MGCP_PREVIEW&&!b)return '<div class="cp-coach" id="cp-coach"><span class="k">From your coach</span><h3>Notes and actions</h3><p class="cp-cn">Shared 1-to-1 notes and the actions you agree with your coach show here. (Coach preview: nothing to show.)</p></div>';
  if(!b||(!(b.notes||[]).length&&!(b.tasks||[]).length))return '';
  var tasks=(b.tasks||[]),open=tasks.filter(function(t){return t.status!=='done'}),done=tasks.length-open.length,t0=new Date().toISOString().slice(0,10),n=(b.notes||[])[0];
  var h='<div class="cp-coach" id="cp-coach"><span class="k">From your coach</span><h3>Your actions'+(tasks.length?' <small>'+done+' of '+tasks.length+' done</small>':'')+'</h3>';
  if(tasks.length)h+='<div class="cp-bar"><i style="width:'+Math.round(done/tasks.length*100)+'%"></i></div>'+tasks.map(function(t){var mine=t.owner!=='coach',over=t.status!=='done'&&t.due&&t.due<t0;
    return '<label class="cp-task'+(t.status==='done'?' done':'')+'"><input type="checkbox" data-cptask="'+esc(t.id)+'"'+(t.status==='done'?' checked':'')+(mine?'':' disabled')+'><span><b>'+esc(t.title)+'</b>'+(t.detail?'<em>'+esc(t.detail)+'</em>':'')+
      '<i>'+(mine?'':'Your coach is doing this'+(t.due?' \u00b7 ':''))+(t.due?(over?'<span class="ov">Overdue \u00b7 was due '+esc(niceD(t.due))+'</span>':'Due '+esc(niceD(t.due))):'')+'</i></span></label>'}).join('');
  if(n)h+='<details class="cp-notes"'+(tasks.length?'':' open')+'><summary>1-to-1 notes \u00b7 '+esc(niceD(n.meet_date))+(b.notes.length>1?' (and '+(b.notes.length-1)+' earlier)':'')+'</summary>'+b.notes.map(function(x){return '<div class="cp-note"><b>'+esc(x.title||'1-to-1')+'</b><span>'+esc(niceD(x.meet_date))+(x.coach?' \u00b7 '+esc(x.coach):'')+'</span><p>'+esc(x.body||'')+'</p></div>'}).join('')+'</details>';
  return h+'</div>'}
document.addEventListener('change',function(e){var t=e.target;if(!t.dataset||!t.dataset.cptask||!CRED||!BOARD)return;var id=t.dataset.cptask,on=t.checked,tk=(BOARD.tasks||[]).filter(function(x){return x.id===id})[0];if(tk){tk.status=on?'done':'open'}
  fetch(API+'mg_player_task_done',{method:'POST',headers:{apikey:APIKEY,'Content-Type':'application/json'},body:JSON.stringify({p_code:CRED.code,p_pin:CRED.pin,p_id:id,p_done:on})}).then(function(r){return r.json()})
    .then(function(j){if(j&&j.error){if(tk)tk.status=on?'open':'done';alert(j.error)}if(window.__cpPut)window.__cpPut(true)}).catch(function(){if(tk)tk.status=on?'open':'done';if(window.__cpPut)window.__cpPut(true)})});
function after(){returned();try{weeklyReminder()}catch(e){}try{dashSetup()}catch(e){}}

/* ---------- colour + 'Your week' dashboard (Joe, 13 Nov: less white, more graphs) ---------- */
function dashCss(){if(document.getElementById('cp-dash-css'))return;var s=document.createElement('style');s.id='cp-dash-css';s.textContent=[
 'body{background:#ECE8DC!important}.tabs,body::before{background:#ECE8DC!important}',
 '.cp-dash{background:#0B0B0B;color:#F4F1EA;padding:16px;border-left:6px solid #FFD900;display:flex;flex-direction:column;gap:12px}',
 '.cp-dash h3{margin:0;font:400 22px/1 Anton,Impact,sans-serif;text-transform:uppercase;color:#F4F1EA}',
 '.cp-dash .k{font:700 11px Inter,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:#FFD900}',
 '.cp-rings{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.cp-rings div{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center}',
 '.cp-rings svg{width:100%;max-width:92px;height:auto}.cp-rings span{font:700 11px Inter,sans-serif;letter-spacing:.6px;text-transform:uppercase;color:#c9c4b4}',
 '.cp-spark{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cp-spark>div{background:#1a1916;padding:10px}.cp-spark svg{display:block;width:100%;height:auto}',
 '.cp-spark b{font:400 20px Anton,Impact,sans-serif;color:#FFD900;margin-left:6px}',
 '.cp-attc{background:#F7F5EF;border:1px solid rgba(11,11,11,.1);padding:10px 10px 6px;margin:4px 0 2px}.cp-attc svg{display:block;width:100%;height:auto;max-height:190px}.cp-attc .k{display:flex;gap:14px;font:700 10px Inter,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:#77715F;padding:6px 2px 2px}.cp-attc .k i{display:inline-block;width:10px;height:10px;border-radius:50%;border:1.5px solid #0B0B0B;margin-right:5px;vertical-align:-1px}',
 '.cp-coach{background:#fff;border:1px solid rgba(11,11,11,.13);border-left:6px solid #0B0B0B;padding:16px;display:flex;flex-direction:column;gap:8px}',
 '.cp-coach .k{font:700 11px Inter,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:#8a7f00}.cp-coach h3{margin:0;font:400 22px/1 Anton,Impact,sans-serif;text-transform:uppercase;color:#0B0B0B}',
 '.cp-coach h3 small{font:600 13px Inter,sans-serif;color:#77715F;text-transform:none;margin-left:6px}.cp-cn{margin:0;color:#3B3830;font-size:14px}',
 '.cp-bar{height:8px;background:#E6E1D3}.cp-bar i{display:block;height:100%;background:#FFD900}',
 '.cp-task{display:grid;grid-template-columns:28px 1fr;gap:10px;padding:10px 0;border-top:1px solid rgba(11,11,11,.1);cursor:pointer}.cp-task input{width:22px;height:22px;accent-color:#0B0B0B;margin:2px 0 0}',
 '.cp-task b{display:block;font-size:15px;color:#0B0B0B}.cp-task em{display:block;font-style:normal;font-size:13px;color:#3B3830}.cp-task i{display:block;font-style:normal;font-size:12px;color:#77715F;margin-top:2px}',
 '.cp-task.done b{text-decoration:line-through;color:#77715F}.cp-task .ov{color:#b3261e;font-weight:700}',
 '.cp-notes summary{cursor:pointer;font-weight:700;font-size:14px;padding:8px 0;border-top:1px solid rgba(11,11,11,.1)}.cp-note{padding:10px 0;border-top:1px solid rgba(11,11,11,.08)}',
 '.cp-note b{font:400 17px Anton,Impact,sans-serif;text-transform:uppercase}.cp-note span{display:block;font-size:12px;color:#77715F}.cp-note p{margin:6px 0 0;white-space:pre-wrap;font-size:14px;color:#3B3830}',
 '@media(max-width:420px){.cp-rings{grid-template-columns:repeat(2,1fr)}}'].join('');document.head.appendChild(s)}
function ring(v,max,label,col,pct){var p=pct?Math.min(1,v/100):max?Math.min(1,v/max):0,R=34,C=2*Math.PI*R;
  return '<div><svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="'+R+'" fill="none" stroke="#2a2925" stroke-width="9"/>'+(p>0?'<circle cx="42" cy="42" r="'+R+'" fill="none" stroke="'+col+'" stroke-width="9" stroke-linecap="round" stroke-dasharray="'+(C*p)+' '+C+'" transform="rotate(-90 42 42)"/>':'')+
    '<text x="42" y="47" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="20" fill="#F4F1EA">'+v+(pct?'<tspan font-size="12" fill="#8f8a7c">%</tspan>':max?'<tspan font-size="12" fill="#8f8a7c">/'+max+'</tspan>':'')+'</text></svg><span>'+esc(label)+'</span></div>'}
function spark(vals,col){var W=160,H=44,n=vals.length,pts=[];vals.forEach(function(v,i){if(v!=null)pts.push([6+i*(W-12)/(n-1),H-6-(v-1)/9*(H-12)])});
  var g='<line x1="0" y1="'+(H-6)+'" x2="'+W+'" y2="'+(H-6)+'" stroke="#2a2925"/>';if(pts.length>1)g+='<polyline points="'+pts.map(function(p){return p.join(',')}).join(' ')+'" fill="none" stroke="'+col+'" stroke-width="2.5"/>';
  pts.forEach(function(p){g+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="'+col+'"/>'});return '<svg viewBox="0 0 '+W+' '+H+'">'+g+'</svg>'}
function practiceDone(){var p=window.MGCP_DATA||{},sessions=((p.practice||{}).sessions||[]),d=wk(),n=0;sessions.forEach(function(s){var dr=s.drills||[];if(dr.length&&dr.every(function(x){return d[x.id]}))n++});return n}
function dashHTML(){var S=window.S,p=window.MGCP_DATA||{},w=S.week||1,c=typeof weekCounts==='function'?weekCounts(w):{gym:0,habits:0},gT=(window.CLIENT&&CLIENT.weekly&&CLIENT.weekly.gym)||0,
    pT=+((p.weekly||{}).practice)||0,hl=typeof habitList==='function'?habitList().length:0,days=typeof weekDays==='function'?weekDays(w):[],t=todayIso(),dn=days.filter(function(d){return d<=t}).length||1;
  var h='<div class="cp-dash" id="cp-dash"><div><span class="k">Week '+w+' of '+((window.CLIENT&&CLIENT.weeks)||6)+'</span><h3>Your week so far</h3></div><div class="cp-rings">'+
    ring(c.gym||0,gT,'Gym','#e2574c')+(pT?ring(practiceDone(),pT,'Practice','#FFD900'):'')+(hl?ring(Math.min(100,Math.round((c.habits||0)/(hl*dn)*100)),0,'Habits','#7fb2e5',true):'')+
    ring(days.filter(function(d){return S.checkin&&S.checkin[d]}).length,7,'Check-ins','#5fbf7a')+'</div>';
  var last=[];for(var i=6;i>=0;i--)last.push(addDays(t,-i));var en=last.map(function(d){var x=S.checkin&&S.checkin[d];return x&&x.energy?+x.energy:null}),mo=last.map(function(d){var x=S.checkin&&S.checkin[d];return x&&x.motivation?+x.motivation:null});
  var avg=function(a){var v=a.filter(function(x){return x!=null});return v.length?(v.reduce(function(s,x){return s+x},0)/v.length).toFixed(1):'\u2013'};
  if(en.some(function(x){return x!=null}))h+='<div class="cp-spark"><div><span class="k">Energy \u00b7 7 days</span><b>'+avg(en)+'</b>'+spark(en,'#FFD900')+'</div><div><span class="k">Motivation \u00b7 7 days</span><b>'+avg(mo)+'</b>'+spark(mo,'#5fbf7a')+'</div></div>';
  return h+'</div>'}
function dashSetup(){dashCss();var lastH='',put=function(force){var el=document.getElementById('p-today');if(!el||el.hidden)return;var old=document.getElementById('cp-dash'),oc=document.getElementById('cp-coach'),html=dashHTML()+boardHTML();
    if(!force&&old&&old.parentNode===el&&html===lastH)return;lastH=html;if(old)old.remove();if(oc)oc.remove();var d=document.createElement('div');d.innerHTML=html;while(d.lastChild)el.insertBefore(d.lastChild,el.firstChild)};window.__cpPut=put;
  put();var tm=null;new MutationObserver(function(){clearTimeout(tm);tm=setTimeout(put,60)}).observe(document.getElementById('p-today')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','aria-pressed']});
  var o=window.save;if(typeof o==='function'&&!o._cp){window.save=function(){var r=o.apply(this,arguments);clearTimeout(tm);tm=setTimeout(put,60);return r};window.save._cp=1}}
/* attention through a session, small chart for the Practice tab */
function attSvg(dr){var n=dr.length;if(n<2)return '';var W=640,H=180,L=124,R=30,T=24,B=24,X=function(i){return L+i*(W-L-R)/(n-1)},Y=function(v){return T+(1-att(v)/100)*(H-T-B)};
  var tx=function(x,y,t,c,sz,a){return '<text x="'+x+'" y="'+y+'" text-anchor="'+(a||'start')+'" font-family="Inter,sans-serif" font-size="'+(sz||11)+'" font-weight="800" fill="'+c+'">'+t+'</text>'};
  var g='<rect x="'+L+'" y="'+T+'" width="'+(W-L-R)+'" height="'+(H-T-B)/2+'" fill="#ECE8DC"/><rect x="'+L+'" y="'+(T+(H-T-B)/2)+'" width="'+(W-L-R)+'" height="'+(H-T-B)/2+'" fill="#FFFFFF"/>'+
    tx(L-12,T+18,'EXTERNAL','#0B0B0B',20,'end')+tx(L-12,H-B-2,'INTERNAL','#0B0B0B',20,'end');
  var pts=dr.map(function(d,i){return [X(i),Y(d.attention)]});g+='<polyline points="'+pts.map(function(p){return p.join(',')}).join(' ')+'" fill="none" stroke="#0B0B0B" stroke-width="2.5" stroke-dasharray="6 5"/>';
  dr.forEach(function(d,i){var t=d.env==='Technical';g+='<circle cx="'+pts[i][0]+'" cy="'+pts[i][1]+'" r="17" fill="'+(t?'#E6E1D3':'#FFD900')+'" stroke="#0B0B0B" stroke-width="2"/>'+tx(pts[i][0],pts[i][1]+6,i+1,'#0B0B0B',18,'middle')});
  return '<div class="cp-attc"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Attention through the session: each number is a drill below">'+g+'</svg><div class="k" aria-hidden="true"><span><i style="background:#E6E1D3"></i>Technical</span><span><i style="background:#FFD900"></i>Game</span></div></div>'}

/* ---------- weekly report reminders (Joe, 13 Nov) ----------
   Sunday: "complete your weekly report" for this plan week. Monday to Wednesday: if the week that ended on Sunday still has no
   report, a second reminder. Shown in the app when the player opens their plan, once per day, after the daily check-in.
   Reads S.reviews['w<week>'] (src/weekly-review.js). */
function weeklyReminder(){
  if(!window.S||typeof window.todayIso!=='function'||typeof window.planWeekOf!=='function'||!document.getElementById('p-report'))return;
  var t=todayIso(),dow=new Date().getDay(),wk=null,late=false;
  if(dow===0)wk=planWeekOf(t);
  else if(dow>=1&&dow<=3){wk=planWeekOf(addDays(t,-dow));late=true}
  var max=(window.CLIENT&&+CLIENT.weeks)||6;if(!wk||wk<1||wk>max)return;
  var rv=(S.reviews||{})['w'+wk];if(rv&&rv.at)return;
  var seen='cp-wr-'+(window.MGCP_CODE||'')+'-'+t;if(ls(seen))return;
  var tries=0;(function wait(){var c=S.checkin&&S.checkin[t];if(!c&&++tries<180){setTimeout(wait,2000);return}
    if((S.reviews||{})['w'+wk]&&S.reviews['w'+wk].at)return;show()})();
  function show(){if(document.getElementById('cp-wr'))return;ls(seen,'1');css();
    var d=document.createElement('div');d.id='cp-wr';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
    d.innerHTML='<div class="cp-wr-in"><div class="cp-wr-k">'+(late?'Reminder · week '+wk:'Sunday · week '+wk)+'</div><h3>'+(late?'Your weekly report is still to do':'Time for your weekly report')+'</h3>'+
      '<p>'+(late?'Your report for week '+wk+' hasn’t been sent yet. It only takes a few minutes, and your coach uses it to plan your next week.':'Take a few minutes to tell your coach how the week went. They use it to plan your next week.')+'</p>'+
      '<button type="button" class="cp-wr-go">Do my weekly report <span aria-hidden="true">›</span></button><button type="button" class="cp-wr-later">Later</button></div>';
    document.body.appendChild(d);
    d.querySelector('.cp-wr-later').onclick=function(){d.remove()};
    d.querySelector('.cp-wr-go').onclick=function(){d.remove();if(S.week!==wk){S.week=wk;if(typeof save==='function')save()}if(typeof render==='function')render();showTab('report');window.scrollTo({top:0})}}
}


/* ---------- plan JSON -> CLIENT + SESSIONS (runs inside the engine, where x(), MAX, DB… exist) ---------- */
function incFor(name){var n=String(name).toLowerCase(),G=window;
  if(/med ball|slam|throw|discus|scoop/.test(n))return G.MB;if(/landmine/.test(n))return G.PLATE;if(/kettle|\bkb\b/.test(n))return G.KB;
  if(/cable|pull down|pulldown|push down|pushdown|woodchop|chop|pallof|leg curl|lat pull/.test(n))return G.CABLE;
  if(/barbell|trap bar|\bbar\b/.test(n))return G.BAR;if(/dumbbell|\bdb\b|goblet|farmer|carry/.test(n))return G.DB;return G.BW}
/* session structure from the Plan Builder: superset (A1/A2 pairs), circuit (one block, every exercise in turn) or straight (one exercise per block) */
function physBlocks(d,di,ph){var mode=ph.mode||'superset',all=[],out=[];
  (d.pairs||[]).forEach(function(pr,pi){var L=String.fromCharCode(65+pi),ex=[];['a','b'].forEach(function(s,j){var e=pr[s];if(e&&String(e.name||'').trim()){var o=window.x(slug(e.name)+'-'+(di+1)+L+(j+1),e.name,rx(e,ph));ex.push(o);all.push(o)}});
    if(mode==='superset'&&ex.length)out.push({tag:L,label:ex.length>1?'Superset '+L:'Exercise '+L,rest:ph.rest||'45–60s',ex:ex})});
  if(mode==='circuit'&&all.length){var r=Math.max.apply(null,all.map(function(e){return +e.sets||3}));return [{tag:'C',label:'Circuit · '+r+' rounds',rest:ph.rest||'60–90s between rounds',ex:all}]}
  if(mode==='straight')return all.map(function(e,i){var L=String.fromCharCode(65+i);return {tag:L,label:'Exercise '+L,rest:ph.rest||'60–90s between sets',ex:[e]}});
  return out}
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
  /* mobility: 'random' / 'time' = a new set of follow-along videos each day (same all day: seeded with plan code + date); 'manual' = the coach's list */
  var auto=(mob.mode==='random'||mob.mode==='time')&&window.MGLib&&MGLib.mobDay,dt=new Date(),today=dt.getFullYear()+'-'+(dt.getMonth()+1)+'-'+dt.getDate();
  var items=inc.mobility===false?[]:auto?MGLib.mobDay(mob,code+':'+today).map(function(v){return {kind:'video',name:v[0],wistia:v[1],mins:v[2]}}):(mob.items||[]).filter(function(m){return m&&m.name});
  var days=inc.physical===false?[]:(ph.dayList||[]);
  var SESSIONS=days.map(function(d,di){return {name:'Day '+(di+1),tab:'D'+(di+1),title:d.title||('Day '+(di+1)),short:d.title||('Day '+(di+1)),
    blocks:physBlocks(d,di,ph)}});
  var hasPractice=(inc.practice!==false&&((p.practice||{}).sessions||[]).length)||(inc.oncourse!==false&&((p.oncourse||{}).games||[]).length)||(inc.stats!==false&&(p.stats||[]).some(function(s){return s.baseline||s.target}));
  var CLIENT={name:p.playerName||'Player',first:first,key:'coach-'+code,weeks:+p.weeks||6,
    kicker:'Performance Plan',subtitle:'Phase '+(p.phase||1)+' · six-week plan',planName:'Performance Plan',
    features:{checkin:true,weight:inc.weight!==false,mobility:items.length>0},
    strip:[['Gym',(+wk.physical||SESSIONS.length)+' / week']].concat(hasPractice?[['Practice',(+wk.practice||0)+' / week']]:[]).concat(habits.length?[['Habits',habits.length+' / day']]:[]),
    habits:habits,weekly:{gym:+wk.physical||SESSIONS.length},
    weekNote:wk.connected||'',gymNote:ph.note||'',
    objective:[ph.structure,ph.strength?'Strength: '+ph.strength:'',ph.power?'Power: '+ph.power:''].filter(Boolean).join('. ')+'.',
    restNote:ph.rest||'',
    warmup:ph.warmup?(ph.warmup.video==='none'&&!(ph.warmup.items||[]).some(function(w){return String(w.name||'').trim()})?false:{video:ph.warmup.video||'auto',items:(ph.warmup.items||[]).filter(function(w){return String(w.name||'').trim()}),note:ph.warmup.note||''}):undefined,
    guide:[['RPE 7','About three reps left in the tank.'],['RPE 8','About two reps left.'],['RPE 9','About one rep left.'],
      ['Max intent','RPE 10 on power exercises means maximal explosive intent, not muscular failure.'],
      ['Progress',ph.progression||'Keep the exercises, sets and reps the same through the block and progress through load.'],
      ['Load','After each set, enter the kg, reps and RPE. The next set is suggested from the same set last time.']]};
  if(habits.length)CLIENT.streak={id:habits[0].id,label:habits[0].name+' streak',name:habits[0].name};
  if(items.length){CLIENT.mobilityRoutine=items.map(function(m){return {name:m.kind==='video'?m.name:(m.name+(m.dose?' · '+m.dose:'')),mins:m.mins||'',wistia:m.wistia||null}});
    CLIENT.mobilityDesc=[mob.frequency,mob.when].filter(Boolean).join(' · ')+'. '+(auto?'A new routine every day. ':'')+'Tap Watch now to follow along, then tick it off.'}
  if(inc.checkin!==false&&((p.checkin||{}).questions||[]).length)CLIENT.weeklyQuestions=qmap(p.checkin.questions);
  if(hasPractice)CLIENT.extraTabs=[{id:'practice',label:'Practice',render:renderPractice}];
  return {CLIENT:CLIENT,SESSIONS:SESSIONS};
}

/* ---------- Practice tab ---------- */
/* a game from the app (static list + mg_app_games); a scored drill (drill-…) has no page, so no Start button.
   A game path saved in the plan but not in the list still gets its Start button, with the name the coach saw. */
function gameFor(d){if(!d.game||/^drill-/.test(d.game))return null;var g=(window.MGLib&&MGLib.GAMES||[]).filter(function(x){return x[1]===d.game})[0];
  return g||(/^[a-z0-9-]{3,60}$/.test(d.game)?[d.name||'the game',d.game]:null)}
function css(){if(document.getElementById('cp-css'))return;var s=document.createElement('style');s.id='cp-css';s.textContent=[
 '#cp-wr{position:fixed;inset:0;z-index:99999;background:rgba(11,11,11,.6);display:flex;align-items:flex-end;justify-content:center;padding:16px}',
 '#cp-wr .cp-wr-in{background:#0B0B0B;color:#F4F1EA;border-top:6px solid #FFD900;max-width:460px;width:100%;padding:22px 20px;display:flex;flex-direction:column;gap:10px}',
 '#cp-wr .cp-wr-k{font:700 11px Inter,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:#FFD900}',
 '#cp-wr h3{margin:0;font:400 28px/1.05 Anton,Impact,sans-serif;text-transform:uppercase;color:#F4F1EA}',
 '#cp-wr p{margin:0;font:15px/1.5 Inter,sans-serif;color:rgba(244,241,234,.85)}',
 '#cp-wr .cp-wr-go{margin-top:6px;min-height:54px;border:0;background:#FFD900;color:#0B0B0B;font:400 20px Anton,Impact,sans-serif;text-transform:uppercase;cursor:pointer}',
 '#cp-wr .cp-wr-later{min-height:44px;border:1px solid rgba(244,241,234,.4);background:transparent;color:#F4F1EA;font:600 15px Inter,sans-serif;cursor:pointer}',
 '.cp-card{background:var(--paper,#fff);border:1px solid var(--hair,rgba(11,11,11,.13));border-left:6px solid var(--yellow,#FFD900);padding:16px;display:flex;flex-direction:column;gap:10px}',
 '.cp-card h3{margin:0;font:400 22px/1.05 var(--display,Anton,Impact,sans-serif);text-transform:uppercase;color:var(--ink,#0B0B0B)}',
 '.cp-note{margin:0;color:var(--body,#3B3830);font-size:14px;line-height:1.5}',
 '.cp-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.cp-hd label{flex:1;display:grid;grid-template-columns:28px 1fr;column-gap:4px;align-items:start}.cp-hd label .cp-num{grid-row:span 2;margin:1px 0 0}.cp-hd label .cp-tag{justify-self:start;margin:0 0 4px}.cp-hd label b{grid-column:2;line-height:1.3}',
 '.cp-vol{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:72px;padding:6px 10px;background:#FFD900;color:#0B0B0B;font:700 11px Inter,sans-serif;letter-spacing:1px;text-transform:uppercase;line-height:1.1}',
 '.cp-vol b{font:400 30px/1 Anton,Impact,sans-serif!important;letter-spacing:0!important;display:block}',
 '.cp-num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#0B0B0B;color:#FFD900;font:800 12px Inter,sans-serif;margin-right:6px;vertical-align:middle}',
 '.cp-attc text{letter-spacing:0!important;text-transform:none!important}',
 '.cp-row{display:grid;grid-template-columns:28px 1fr;gap:10px;align-items:start;padding:10px 0;border-top:1px solid var(--hair,rgba(11,11,11,.13))}',
 '.cp-row input{width:22px;height:22px;accent-color:#0B0B0B;margin:2px 0 0}',
 '.cp-row b{font:600 15px var(--sans,Inter,sans-serif);color:var(--ink,#0B0B0B)}',
 '.cp-tag{display:inline-block;font:700 10px var(--sans,Inter,sans-serif);letter-spacing:1.6px;text-transform:uppercase;padding:2px 6px;margin-right:6px;background:var(--track,#E6E1D3);color:var(--ink,#0B0B0B);vertical-align:2px}',
 '.cp-tag.g{background:var(--yellow,#FFD900)}',
 '.cp-meta{font-size:13px;color:var(--muted,#77715F);margin-top:2px}',
 '.cp-att{display:block;margin-top:10px;background:none;padding:0}',
 '.cp-att .h{display:flex;justify-content:space-between;align-items:baseline;font:700 10px var(--sans,Inter,sans-serif);letter-spacing:1.4px;text-transform:uppercase;color:var(--muted,#77715F)}.cp-att .h b{font:700 12px var(--sans,Inter,sans-serif);letter-spacing:.4px;text-transform:none;color:var(--ink,#0B0B0B)}',
 '.cp-att .t{position:relative;display:block;height:8px;border-radius:4px;margin:7px 0 5px;background:linear-gradient(90deg,var(--track,#E6E1D3),var(--ink,#0B0B0B))}',
 '.cp-att .t i{position:absolute;top:-5px;width:8px;height:18px;border-radius:2px;background:var(--yellow,#FFD900);border:2px solid #0B0B0B;transform:translateX(-50%);box-sizing:border-box}',
 '.cp-att .e{display:flex;justify-content:space-between;font:700 9px var(--sans,Inter,sans-serif);letter-spacing:1.4px;text-transform:uppercase;color:var(--muted,#77715F)}',
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
  return '<div class="cp-att" aria-label="Attention: '+l+'"><div class="h"><span>Attention</span><b>'+l+'</b></div><span class="t"><i style="left:'+Math.max(2,Math.min(98,v))+'%"></i></span><div class="e" aria-hidden="true"><span>Internal · body</span><span>External · target</span></div></div>'}
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
    h+=sessions.map(function(s,si){var dr=s.drills||[];return '<div class="cp-card" style="margin-top:10px"><h3>'+esc(s.name||('Session '+(si+1)))+'</h3>'+(s.warmup?'<p class="cp-note">'+esc(s.warmup)+'</p>':'')+attSvg(dr)+
      dr.map(function(d,di){var isG=d.env!=='Technical',g=gameFor(d),on=!!done[d.id],id='cp-'+esc(d.id);
        return '<div class="cp-row"><input type="checkbox" id="'+id+'" data-cpd="'+esc(d.id)+'"'+(on?' checked':'')+'><div><div class="cp-hd"><label for="'+id+'"><span class="cp-num">'+(di+1)+'</span><span class="cp-tag'+(isG?' g':'')+'">'+(isG?'Game':'Technical')+'</span><b>'+esc(d.name||'Drill')+'</b></label>'+
          (d.volume?'<span class="cp-vol"><b>'+esc(d.volume)+'</b>'+esc(String(d.volume).trim()==='1'?String(d.unit||'').replace(/s$/,''):(d.unit||''))+'</span>':'')+'</div>'+(d.detail?'<p class="cp-note" style="margin-top:4px">'+esc(d.detail)+'</p>':'')+attHtml(d.attention)+
          (g?'<button type="button" class="cp-go'+(on?' done':'')+'" data-cpg="'+esc(d.game)+'" data-cpid="'+esc(d.id)+'">'+(on?'Play '+esc(g[0])+' again':'Start '+esc(g[0]))+' <span aria-hidden="true">›</span></button>':'')+
          (window.MGDrills&&MGDrills.has(d.game)?drillBtn(d,on):'')+'</div></div>'}).join('')+
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
/* Jack's scored drills (src/plan-drills.js): played in the app, results in S.practice['w<n>'].drills[<drill id>] */
function drillRec(id){var w=wk();w.drills=w.drills||{};return w.drills[id]=w.drills[id]||{res:[]}}
function drillBtn(d,on){var r=(wk().drills||{})[d.id],sm=r&&MGDrills.summary(d.game,r),mid=r&&r.res&&r.res.length&&!r.done;
  return (sm?'<div class="cp-meta" style="margin-top:6px">'+(r.done?'\u2713 ':'')+esc(sm)+(r.newPB?' \u00b7 new personal best':'')+'</div>':'')+
    '<button type="button" class="cp-go'+(on?' done':'')+'" data-cpdr="'+esc(d.game)+'" data-cpid="'+esc(d.id)+'">'+(on?'Play again':mid?'Carry on':'Start '+esc(d.name||'drill'))+' <span aria-hidden="true">›</span></button>'}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-cpdr]');if(!b||!window.MGDrills)return;
  var id=b.dataset.cpid,kind=b.dataset.cpdr,rec=drillRec(id);if(rec.done){rec.res=[];rec.done=false;rec.pb=false;rec.newPB=false}
  MGDrills.open(kind,rec,function(r,closed){var w=wk();if(r.done)w[id]=true;window.save&&save();if(closed)rerender()})});
function rerender(){var el=document.getElementById('p-practice');if(el&&!el.hidden)renderPractice(el)}
/* back from a game: src/plan-return.js left 'mgplan-done' = {g, done} */
function returned(){var pd=js('cp-pending'),dn=js('mgplan-done');if(!pd||!dn)return;
  if(Date.now()-(+pd.t||0)>12*3600e3){ls('cp-pending',null);return}
  if(dn.g===pd.g&&(+dn.t||0)>=(+pd.t||0)){if(dn.done&&window.S){S.practice=S.practice||{};var k='w'+(pd.w||1);S.practice[k]=S.practice[k]||{};S.practice[k][pd.id]=true;window.save&&save()}
    ls('cp-pending',null);ls('mgplan-done',null);if(window.showTab)showTab('practice')}}

return {boot:boot,build:build};
})();
