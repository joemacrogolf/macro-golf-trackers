/* My Numbers: a player's strokes gained picture from their own records.
   Used by pages/golf-my-numbers.html (the full dashboard) and the Practice Plan (the strokes gained card on its opening page).
   MGNumbers.load(em, pin) reads the player's golf records through the PIN-checked database functions:
   mg_whoami to see which records exist, then mg_load for each one (only records that already exist, so nothing new is created).
   Everything else here only turns that data into HTML. */
(function(){
if(window.MGNumbers)return;
var URL='https://zhcgwtlyqriwlhbzkxcl.supabase.co/rest/v1/rpc/',KEY='sb_publishable__IBhmrVHOXsLHruU7XJB-g_OSN9Ljne';
function rpc(fn,body){return fetch(URL+fn,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json()})}
/* the same area table the tests and the Practice Plan use (strokes gained per shot x how often it comes up in a round) */
var AREAS={"putt.s":["Putting","Putts from 3\u20136 ft",5],"putt.m":["Putting","Putts from 6\u201310 ft",4],"putt.mid":["Putting","Putts from 10\u201320 ft",5],"putt.l":["Putting","Putts from 20\u201335 ft",4],"putt.lag":["Putting","Putts from 35\u201350 ft",2],
 "sg.chip":["Short game","Chipping",3],"sg.pitch":["Short game","Pitching",2],"sg.rough":["Short game","Short game from the rough",1.5],"sg.bunker":["Short game","Bunker play",1],"sg.slope":["Short game","Awkward lies",1],"sg.lob":["Short game","Lob and flop shots",.5],
 "lg.wedge":["Approach","Wedges and short irons",5],"lg.mid":["Approach","Mid irons",4],"lg.long":["Approach","Long irons and hybrids",3],"lg.fwg":["Approach","Fairway clubs into the green",1],
 "lg.fwt":["Driving","Fairway clubs off the tee",2],"lg.drv":["Driving","Driver accuracy",11],"lg.speed":["Driving","Driver distance",11]};
var GROUPS=["Driving","Approach","Short game","Putting"],GTEST={"Driving":"long","Approach":"long","Short game":"short","Putting":"putting"};
var TESTS={long:["golf-long-game-test","Long Game Test","p-524617"],short:["golf-short-game-test","Short Game Test","p-791364"],putting:["golf-putting-test","Putting Test","p-350829"]};
var GAMES={'golf-hole-out':['Hole Out','Putting','p-151044'],'golf-insanity':['Insanity','Putting','p-208731'],'golf-money-stealers':['Money Stealers','Putting','p-529063'],
 'golf-fifty-ft-bank':['50ft Bank','Short game','p-472096'],'golf-par-18':['Par 18','Short game','p-615974'],'golf-wedge-darts':['Wedge Darts','Approach','p-386417'],
 'golf-left-is-lava':['Lava','Approach','p-740258'],'golf-driver-corridor':['Driver Corridor','Driving','p-937452'],'golf-three-strikes':['3 Strikes','Driving','p-863140']};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var hcName=function(h){return h==="Tour"?"Tour":h==="0"||h===0?"Scratch":h+" hc"};
function hcTxt(v){if(v==null||!isFinite(v))return '\u2013';var r=Math.round(v*10)/10;return r<0?'+'+Math.abs(r):String(r)}
function sg(v){var r=Math.round(v*10)/10;return (r>0?'+':r<0?'\u2212':'')+Math.abs(r).toFixed(1)}
function day(t){var d=new Date(t);return isNaN(d)?'':d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}

/* ---------- loading ---------- */
function load(em,pin){em=String(em||'').trim().toLowerCase();
  return rpc('mg_whoami',{p_email:em,p_pin:String(pin||'')}).then(function(w){
    if(!w||w.error||w.new)return {error:w&&w.error||(w&&w.new?'We could not find that email. Use the email you play the games with.':'Could not sign in.'),who:w};
    var have=(w.plans||[]).map(function(p){return p.plan}).filter(function(p){return /^golf-/.test(p)});
    return Promise.all(have.map(function(plan){return rpc('mg_load',{p_code:'pure:'+plan+':'+em,p_pin:String(pin),p_name:null,p_plan:null}).then(function(r){return [plan,r&&r.data||null]}).catch(function(){return [plan,null]})}))
      .then(function(rows){var d={name:w.name||'',records:{}};rows.forEach(function(r){if(r[1])d.records[r[0]]=r[1]});return shape(d)})})}
/* turn raw records into what the cards need */
function shape(d){var R=d.records,out={name:d.name,tests:{},history:{},games:{},practice:null};
  Object.keys(TESTS).forEach(function(k){var r=R[TESTS[k][0]];if(!r)return;if(r.planEntry&&r.planEntry.raw)out.tests[k]=r.planEntry;
    if(Array.isArray(r.history))out.history[k]=r.history.filter(function(h){return h&&h.hc!=null}).slice().reverse()});
  var pp=R['golf-practice-plan'];if(pp&&pp.practice){out.practice=pp.practice;var T=pp.practice.tests||{};Object.keys(T).forEach(function(k){if(T[k]&&T[k].raw&&(!out.tests[k]||(T[k].t||0)>(out.tests[k].t||0)))out.tests[k]=T[k]})}
  Object.keys(GAMES).forEach(function(g){var r=R[g],s=r&&r._mgSummary&&r._mgSummary.golf;if(s&&s.best!=null)out.games[g]=s});
  return out}

/* ---------- strokes gained by area ---------- */
function byArea(tests){var rows={},keys={};GROUPS.forEach(function(g){rows[g]=null});
  Object.keys(tests||{}).forEach(function(k){var e=tests[k];(e.raw||[]).forEach(function(x){var a=AREAS[x.key];if(!a||!(x.n>0))return;var pr=x.per*a[2];
    rows[a[0]]=(rows[a[0]]||0)+pr;(keys[a[0]]=keys[a[0]]||[]).push({key:x.key,name:a[1],pr:pr})})});
  return {rows:rows,keys:keys}}
function target(tests){var t=null;Object.keys(tests||{}).forEach(function(k){if(tests[k].target)t=tests[k].target});return t||'10'}
function sgCard(tests,opts){opts=opts||{};var A=byArea(tests),T=target(tests),have=GROUPS.filter(function(g){return A.rows[g]!=null});
  if(!have.length)return opts.empty===false?'':'<div class="mgn-card"><div class="mgn-k">Strokes gained</div><p class="mgn-p">Take your tests and this fills in: where you gain and lose shots against your target, area by area.</p>'+testLinks()+'</div>';
  var mx=Math.max(0.5,Math.max.apply(null,have.map(function(g){return Math.abs(A.rows[g])}))),tot=have.reduce(function(a,g){return a+A.rows[g]},0);
  var all=[];have.forEach(function(g){all=all.concat(A.keys[g])});all.sort(function(a,b){return a.pr-b.pr});var worst=all[0],best=all[all.length-1];
  var dates=Object.keys(tests).map(function(k){return tests[k].t}).filter(Boolean).sort();
  return '<div class="mgn-card"><div class="mgn-top"><div><div class="mgn-k">Strokes gained a round</div><div class="mgn-sub">vs a '+esc(hcName(T))+' player'+(dates.length?' \u00b7 tests '+day(dates[0])+(dates.length>1&&day(dates[dates.length-1])!==day(dates[0])?'\u2013'+day(dates[dates.length-1]):''):'')+'</div></div>'+
   '<div class="mgn-tot '+(tot>=0?'up':'down')+'"><b>'+sg(tot)+'</b><small>total a round</small></div></div>'+
   '<div class="mgn-bars">'+GROUPS.map(function(g){var v=A.rows[g];if(v==null)return '<div class="mgn-row off"><span>'+g+'</span><div class="mgn-track"><i class="mid"></i></div><em>not tested</em></div>';
     var w=Math.min(50,Math.abs(v)/mx*50);return '<div class="mgn-row"><span>'+g+'</span><div class="mgn-track"><i class="mid"></i><i class="bar '+(v>=0?'up':'down')+'" style="'+(v>=0?'left:50%':'right:50%')+';width:'+w.toFixed(1)+'%"></i></div><em class="'+(v>=0?'up':'down')+'">'+sg(v)+'</em></div>'}).join('')+'</div>'+
   (worst&&worst.pr<-0.05?'<div class="mgn-call down"><small>Biggest leak</small><b>'+esc(worst.name)+'</b><em>'+sg(worst.pr)+' a round</em></div>':'')+
   (best&&best.pr>0.05?'<div class="mgn-call up"><small>Biggest strength</small><b>'+esc(best.name)+'</b><em>'+sg(best.pr)+' a round</em></div>':'')+
   (opts.note!==false?'<p class="mgn-note">Plus means you gain shots on a '+esc(hcName(T))+' player, minus means you lose them. Retest to update.</p>':'')+'</div>'}
function testLinks(){return '<div class="mgn-links">'+Object.keys(TESTS).map(function(k){return '<a href="https://www.macro.golf/'+TESTS[k][2]+'">'+TESTS[k][1]+' \u2192</a>'}).join('')+'</div>'}

/* ---------- the 6 week plan ---------- */
function weekKey(d){d=d?new Date(d):new Date();var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
function itemsOf(s){return s.items||(s.games||[]).map(function(g){return {key:g,mins:0,full:true,game:g}})}
function planStats(P){var p=P&&P.plan;if(!p||!p.week)return null;var W=p.retestWeeks||6,wk=Math.max(1,Math.round((new Date(weekKey())-new Date(p.start))/(7*864e5))+1);
  var weeks=P.weeks||{},done=0;Object.keys(weeks).forEach(function(k){if(k>=p.start)done+=(weeks[k]||[]).length});
  var mins=function(key){var m=0;Object.keys(weeks).forEach(function(k){if(k<p.start)return;(weeks[k]||[]).forEach(function(i){var s=p.week[i];if(s)itemsOf(s).forEach(function(x){if(x.key===key)m+=x.mins||0})})});return m};
  var G=(p.goals||[]).map(function(g){return Object.assign({},g,{odds:Math.min(95,Math.round(30+65*Math.min(1,mins(g.key)/Math.max(1,(g.mins||0)*W))))})});
  return {week:wk,W:W,done:done,total:p.week.length*W,thisWeek:(weeks[weekKey()]||[]).length,perWeek:p.week.length,goals:G,odds:G.length?Math.round(G.reduce(function(a,g){return a+g.odds},0)/G.length):null}}
function planCard(P,href){var s=planStats(P);
  if(!s)return '<div class="mgn-card"><div class="mgn-k">Your 6 week plan</div><p class="mgn-p">Build a plan from your tests: a few sessions a week that go where you lose the most shots.</p><a class="mgn-btn" href="'+(href||'https://www.macro.golf/my-practice')+'">Build my plan</a></div>';
  var pct=Math.min(100,Math.round(s.done/Math.max(1,s.total)*100));
  return '<div class="mgn-card"><div class="mgn-top"><div><div class="mgn-k">Your 6 week plan</div><div class="mgn-sub">'+(s.week>s.W?'Your '+s.W+' weeks are up: time to retest':'Week '+s.week+' of '+s.W+' \u00b7 '+s.thisWeek+' of '+s.perWeek+' sessions this week')+'</div></div>'+
   (s.odds!=null?'<div class="mgn-tot gold"><b>'+s.odds+'%</b><small>chance of hitting your goals</small></div>':'')+'</div>'+
   '<div class="mgn-prog"><i style="width:'+pct+'%"></i></div><div class="mgn-sub">'+s.done+' of '+s.total+' sessions done</div>'+
   (s.goals.length?'<ul class="mgn-goals">'+s.goals.map(function(g){return '<li><span>'+esc(g.name)+'</span><em>'+sg(g.now)+' \u2192 '+sg(g.goal)+'</em><div class="mgn-gbar"><i style="width:'+g.odds+'%"></i></div></li>'}).join('')+'</ul>':'')+
   '<a class="mgn-btn" href="'+(href||'https://www.macro.golf/my-practice')+'">Open my plan</a></div>'}

/* ---------- tests over time ---------- */
function spark(vals,lowGood){if(vals.length<2)return '';var w=120,h=34,mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals),rg=mx-mn||1;
  var pts=vals.map(function(v,i){return [(i/(vals.length-1)*w).toFixed(1),(lowGood?(v-mn)/rg*h:(1-(v-mn)/rg)*h).toFixed(1)]});
  return '<svg class="mgn-spark" viewBox="-3 -3 '+(w+6)+' '+(h+6)+'" aria-hidden="true"><polyline fill="none" stroke="currentColor" stroke-width="2.4" points="'+pts.map(function(p){return p.join(',')}).join(' ')+'"/><circle cx="'+pts[pts.length-1][0]+'" cy="'+pts[pts.length-1][1]+'" r="3.6" fill="#FFD900"/></svg>'}
function testsCard(hist){var ks=Object.keys(TESTS).filter(function(k){return hist[k]&&hist[k].length});if(!ks.length)return '';
  return '<div class="mgn-card"><div class="mgn-k">Your tests over time</div><div class="mgn-sub">Plays-like handicap from each test. Lower is better.</div><div class="mgn-tests">'+ks.map(function(k){var H=hist[k],a=H[0].hc,b=H[H.length-1].hc,d=a-b;
    return '<div class="mgn-test"><div><b>'+TESTS[k][1]+'</b><small>'+H.length+' test'+(H.length>1?'s':'')+' \u00b7 last '+day(H[H.length-1].date)+'</small></div>'+spark(H.map(function(h){return h.hc}),true)+
     '<div class="mgn-hc"><b>'+hcTxt(b)+'</b>'+(H.length>1?'<em class="'+(d>0.05?'up':d<-0.05?'down':'')+'">'+(d>0.05?'\u25b2 '+d.toFixed(1):d<-0.05?'\u25bc '+Math.abs(d).toFixed(1):'level')+'</em>':'')+'</div></div>'}).join('')+'</div></div>'}

/* ---------- game bests ---------- */
function fmtScore(v,u){var n=Number(v);if(!isFinite(n))return '\u2013';if(u==='hc')return hcTxt(n)+' hc';if(u==='SG')return sg(n);return String(Math.round(n*10)/10)+(u?' '+u:'')}
function gamesCard(games){var ks=Object.keys(GAMES).filter(function(g){return games[g]});
  if(!ks.length)return '<div class="mgn-card"><div class="mgn-k">Game bests</div><p class="mgn-p">Play any practice game and your best scores show here.</p></div>';
  return '<div class="mgn-card"><div class="mgn-k">Game bests</div><div class="mgn-games">'+ks.map(function(g){var s=games[g],R=(s.rounds||[]).map(function(r){return r.s}).slice(-8);
    return '<a class="mgn-game" href="https://www.macro.golf/'+GAMES[g][2]+'"><small>'+GAMES[g][1]+'</small><b>'+GAMES[g][0]+'</b><span class="mgn-best">'+fmtScore(s.best,s.unit)+'</span><em>best \u00b7 '+(s.rounds||[]).length+' round'+((s.rounds||[]).length===1?'':'s')+'</em>'+spark(R,s.better==='low')+'</a>'}).join('')+'</div></div>'}

/* ---------- styles (dark cards, Macro Golf house style) ---------- */
function css(){if(document.getElementById('mgn-css'))return;var s=document.createElement('style');s.id='mgn-css';s.textContent=[
 '.mgn-card{background:#0B0B0B;color:#F4F1EA;border-left:6px solid #FFD900;padding:18px;display:flex;flex-direction:column;gap:12px;font-family:Inter,system-ui,sans-serif}',
 '.mgn-k{font-weight:700;font-size:11px;letter-spacing:2.2px;text-transform:uppercase;color:#FFD900}.mgn-sub{font-size:13px;color:#9C988C;margin-top:3px}.mgn-p{margin:0;font-size:15px;line-height:1.5;color:#d9d5cb}',
 '.mgn-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.mgn-tot{text-align:right;flex:0 0 auto}.mgn-tot b{display:block;font-family:Anton,Impact,sans-serif;font-weight:400;font-size:40px;line-height:1}.mgn-tot small{font-size:11px;color:#9C988C}',
 '.mgn-tot.up b{color:#3ad37a}.mgn-tot.down b{color:#ff6b5e}.mgn-tot.gold b{color:#FFD900}',
 '.mgn-bars{display:flex;flex-direction:column;gap:10px}.mgn-row{display:grid;grid-template-columns:86px 1fr 46px;gap:10px;align-items:center;font-size:13px}.mgn-row span{font-weight:600}.mgn-row em{font-style:normal;font-weight:700;text-align:right;font-variant-numeric:tabular-nums}',
 '.mgn-row.off{opacity:.45}.mgn-row.off em{font-weight:400;font-size:11px}.mgn-track{position:relative;height:14px;background:rgba(244,241,234,.08)}.mgn-track .mid{position:absolute;left:50%;top:-3px;bottom:-3px;width:1px;background:rgba(244,241,234,.45)}',
 '.mgn-track .bar{position:absolute;top:0;bottom:0}.mgn-track .bar.up{background:#3ad37a}.mgn-track .bar.down{background:#ff6b5e}em.up{color:#3ad37a}em.down{color:#ff6b5e}',
 '.mgn-call{display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:10px 12px;background:rgba(244,241,234,.06);border-left:3px solid #ff6b5e}.mgn-call.up{border-left-color:#3ad37a}',
 '.mgn-call small{grid-column:1/-1;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#9C988C;font-weight:700}.mgn-call b{font-size:15px}.mgn-call em{font-style:normal;font-weight:700;font-size:13px}.mgn-call.up em{color:#3ad37a}.mgn-call.down em{color:#ff6b5e}',
 '.mgn-note{margin:0;font-size:12px;color:#9C988C}.mgn-links{display:flex;flex-wrap:wrap;gap:8px}.mgn-links a{color:#FFD900;font-weight:700;font-size:14px;text-decoration:none;border:1px solid rgba(255,217,0,.4);padding:8px 10px}',
 '.mgn-prog{height:8px;background:rgba(244,241,234,.12)}.mgn-prog i{display:block;height:100%;background:#FFD900}',
 '.mgn-goals{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}.mgn-goals li{display:grid;grid-template-columns:1fr auto;gap:4px 10px;font-size:13px}.mgn-goals em{font-style:normal;font-weight:700;color:#FFD900}',
 '.mgn-gbar{grid-column:1/-1;height:4px;background:rgba(244,241,234,.12)}.mgn-gbar i{display:block;height:100%;background:#FFD900}',
 '.mgn-btn{display:block;text-align:center;background:#FFD900;color:#0B0B0B;font-family:Anton,Impact,sans-serif;font-size:20px;text-transform:uppercase;padding:13px;text-decoration:none}',
 '.mgn-tests{display:flex;flex-direction:column;gap:10px}.mgn-test{display:grid;grid-template-columns:1fr 120px 64px;gap:10px;align-items:center}.mgn-test b{font-size:14px}.mgn-test small{display:block;font-size:11px;color:#9C988C}',
 '.mgn-spark{width:100%;height:40px;color:#F4F1EA}.mgn-hc{text-align:right}.mgn-hc b{display:block;font-family:Anton,Impact,sans-serif;font-weight:400;font-size:26px;line-height:1}.mgn-hc em{font-style:normal;font-size:11px;font-weight:700}.mgn-hc em.up{color:#3ad37a}.mgn-hc em.down{color:#ff6b5e}',
 '.mgn-games{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mgn-game{display:flex;flex-direction:column;gap:2px;background:rgba(244,241,234,.06);padding:12px;color:#F4F1EA;text-decoration:none}',
 '.mgn-game small{font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:#9C988C;font-weight:700}.mgn-game b{font-size:14px}.mgn-best{font-family:Anton,Impact,sans-serif;font-size:30px;line-height:1.1;color:#FFD900}.mgn-game em{font-style:normal;font-size:11px;color:#9C988C}.mgn-game .mgn-spark{height:30px}'
 ].join('');document.head.appendChild(s)}

window.MGNumbers={load:load,shape:shape,byArea:byArea,sgCard:sgCard,planCard:planCard,testsCard:testsCard,gamesCard:gamesCard,planStats:planStats,css:css,TESTS:TESTS,GAMES:GAMES,esc:esc};
})();
