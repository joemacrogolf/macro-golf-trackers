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
  /* callouts are by AREA (the same totals as the bars), with the biggest single shot type inside that area underneath */
  var ord=have.slice().sort(function(a,b){return A.rows[a]-A.rows[b]}),wa=ord[0],ba=ord[ord.length-1];
  var pick=function(g,lo){var k=A.keys[g].slice().sort(function(a,b){return a.pr-b.pr});return lo?k[0]:k[k.length-1]};
  var worst=wa&&A.rows[wa]<-0.05?{name:wa,pr:A.rows[wa],part:pick(wa,true)}:null,best=ba&&A.rows[ba]>0.05&&ba!==(worst&&worst.name)?{name:ba,pr:A.rows[ba],part:pick(ba,false)}:null;
  var part=function(x,lo){return x.part&&A.keys[x.name].length>1&&(lo?x.part.pr<-0.05:x.part.pr>0.05)?'<span class="mgn-part">Mostly '+esc(x.part.name.toLowerCase())+' ('+sg(x.part.pr)+')</span>':''};
  var dates=Object.keys(tests).map(function(k){return tests[k].t}).filter(Boolean).sort();
  return '<div class="mgn-card"><div class="mgn-top"><div><div class="mgn-k">Strokes gained a round</div><div class="mgn-sub">vs a '+esc(hcName(T))+' player'+(dates.length?' \u00b7 tests '+day(dates[0])+(dates.length>1&&day(dates[dates.length-1])!==day(dates[0])?'\u2013'+day(dates[dates.length-1]):''):'')+'</div></div>'+
   '<div class="mgn-tot '+(tot>=0?'up':'down')+'"><b>'+sg(tot)+'</b><small>total a round</small></div></div>'+
   '<div class="mgn-bars">'+GROUPS.map(function(g){var v=A.rows[g];if(v==null)return '<div class="mgn-row off"><span>'+g+'</span><div class="mgn-track"><i class="mid"></i></div><em>not tested</em></div>';
     var w=Math.min(50,Math.abs(v)/mx*50);return '<div class="mgn-row"><span>'+g+'</span><div class="mgn-track"><i class="mid"></i><i class="bar '+(v>=0?'up':'down')+'" style="'+(v>=0?'left:50%':'right:50%')+';width:'+w.toFixed(1)+'%"></i></div><em class="'+(v>=0?'up':'down')+'">'+sg(v)+'</em></div>'}).join('')+'</div>'+
   (worst?'<div class="mgn-call down"><small>Biggest leak</small><b>'+esc(worst.name)+'</b><em>'+sg(worst.pr)+' a round</em>'+part(worst,true)+'</div>':'')+
   (best?'<div class="mgn-call up"><small>Biggest strength</small><b>'+esc(best.name)+'</b><em>'+sg(best.pr)+' a round</em>'+part(best,false)+'</div>':'')+
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


/* ---------- trends over a chosen period ---------- */
var PERIODS=[['1m','1 month',30,'1M'],['3m','3 months',91,'3M'],['6m','6 months',182,'6M'],['1y','1 year',365,'1Y'],['all','All time',0,'All']];
var TCOL={long:'#FFD900',short:'#3ad37a',putting:'#7cc4ff'},TSHORT={long:'Long game',short:'Short game',putting:'Putting'};
function ds(t){var d=new Date(String(t).length<=10?t+'T12:00:00':t);return isNaN(d)?null:d.getTime()}
function avg(a){return a.length?a.reduce(function(x,y){return x+y},0)/a.length:null}
function trendsCard(d,per){per=per||'3m';var P=PERIODS.filter(function(p){return p[0]===per})[0]||PERIODS[1],now=Date.now(),H=d.history||{};
  var all=[];Object.keys(TESTS).forEach(function(k){(H[k]||[]).forEach(function(h){var t=ds(h.date);if(t)all.push(t)})});
  Object.keys(d.games||{}).forEach(function(g){(d.games[g].rounds||[]).forEach(function(r){var t=ds(r.d);if(t)all.push(t)})});
  var from=P[2]?now-P[2]*864e5:(all.length?Math.min.apply(null,all):now-30*864e5);if(now-from<7*864e5)from=now-7*864e5;
  var chips='<div class="mgn-chips" role="tablist">'+PERIODS.map(function(p){return '<button type="button" class="mgn-chip'+(p[0]===P[0]?' on':'')+'" data-per="'+p[0]+'" aria-label="'+p[1]+'">'+p[3]+'</button>'}).join('')+'</div>';
  /* tests: plays-like handicap points inside the period (lower is better) */
  var series={},ys=[];Object.keys(TESTS).forEach(function(k){var pts=(H[k]||[]).map(function(h){return {t:ds(h.date),v:Number(h.hc)}}).filter(function(x){return x.t&&x.t>=from&&isFinite(x.v)});
    if(pts.length){series[k]=pts;pts.forEach(function(x){ys.push(x.v)})}});
  var ks=Object.keys(series),chart='',legend='',head='';
  if(ks.length){var W=320,Ht=150,L=30,R=8,T=10,B=22,mn=Math.min.apply(null,ys),mx=Math.max.apply(null,ys);if(mx-mn<2){var c=(mx+mn)/2;mn=c-1;mx=c+1}var pad=(mx-mn)*.12;mn-=pad;mx+=pad;
    var X=function(t){return L+(t-from)/Math.max(1,now-from)*(W-L-R)},Y=function(v){return T+(v-mn)/(mx-mn)*(Ht-T-B)};
    var grid='',step=(mx-mn)>12?4:(mx-mn)>6?2:1;for(var g=Math.ceil(mn/step)*step;g<=mx;g+=step){grid+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(g).toFixed(1)+'" y2="'+Y(g).toFixed(1)+'" class="gl"/><text x="'+(L-5)+'" y="'+(Y(g)+3.5).toFixed(1)+'" text-anchor="end">'+hcTxt(g)+'</text>'}
    var xl='<text x="'+L+'" y="'+(Ht-6)+'">'+day(from)+'</text><text x="'+(W-R)+'" y="'+(Ht-6)+'" text-anchor="end">Today</text>';
    var lines=ks.map(function(k){var p=series[k],col=TCOL[k];return (p.length>1?'<polyline fill="none" stroke="'+col+'" stroke-width="2.4" stroke-linejoin="round" points="'+p.map(function(x){return X(x.t).toFixed(1)+','+Y(x.v).toFixed(1)}).join(' ')+'"/>':'')+
      p.map(function(x,i){return '<circle cx="'+X(x.t).toFixed(1)+'" cy="'+Y(x.v).toFixed(1)+'" r="'+(i===p.length-1?4.2:3)+'" fill="'+(i===p.length-1?col:'#0B0B0B')+'" stroke="'+col+'" stroke-width="2"/>'}).join('')}).join('');
    chart='<svg class="mgn-chart" viewBox="0 0 '+W+' '+Ht+'" role="img" aria-label="Plays-like handicap from each test over '+P[1]+'">'+grid+xl+lines+'</svg><div class="mgn-axis">Higher on the chart is better (lower handicap)</div>';
    var ch=[];legend='<div class="mgn-leg">'+ks.map(function(k){var p=series[k],a=p[0].v,b=p[p.length-1].v,dd=a-b;if(p.length>1)ch.push(dd);
      return '<div><i style="background:'+TCOL[k]+'"></i><span>'+TSHORT[k]+'</span><b>'+hcTxt(b)+'</b><em class="'+(p.length<2?'':dd>0.05?'up':dd<-0.05?'down':'')+'">'+(p.length<2?'1 test':dd>0.05?'\u25b2 '+dd.toFixed(1)+' better':dd<-0.05?'\u25bc '+Math.abs(dd).toFixed(1)+' worse':'level')+'</em></div>'}).join('')+'</div>';
    if(ch.length){var m=avg(ch);head='<div class="mgn-tot '+(m>0.05?'up':m<-0.05?'down':'gold')+'"><b>'+(m>0.05?'\u25b2':m<-0.05?'\u25bc':'')+Math.abs(m).toFixed(1)+'</b><small>'+(m>0.05?'hc better':m<-0.05?'hc worse':'hc, holding level')+' on average</small></div>'}}
  else chart='<p class="mgn-p">No tests in the last '+P[1].toLowerCase()+'. Take a test (or pick a longer period) to see your trend.</p>';
  /* games: average score in the period vs the same length of time before it */
  var rows=Object.keys(GAMES).map(function(g){var s=(d.games||{})[g];if(!s)return null;var R=(s.rounds||[]).map(function(r){return {t:ds(r.d),s:Number(r.s)}}).filter(function(r){return r.t&&isFinite(r.s)});
    var inP=R.filter(function(r){return r.t>=from}).sort(function(x,y){return x.t-y.t});if(!inP.length)return null;
    /* trend inside the period: the later half of the rounds against the earlier half */
    var h=Math.floor(inP.length/2),a=avg(inP.map(function(r){return r.s})),low=s.better==='low',dd=null;
    if(inP.length>=2){var e=avg(inP.slice(0,h).map(function(r){return r.s})),l=avg(inP.slice(inP.length-h).map(function(r){return r.s}));dd=low?e-l:l-e;var sc=Math.max(1,Math.abs(e))*0.03;if(Math.abs(dd)<sc)dd=0}
    return '<div class="mgn-gt"><div><b>'+GAMES[g][0]+'</b><small>'+inP.length+' round'+(inP.length>1?'s':'')+' \u00b7 avg '+fmtScore(a,s.unit)+'</small></div>'+spark(inP.map(function(r){return r.s}),low)+
      '<em class="'+(dd==null?'':dd>0.05?'up':dd<-0.05?'down':'')+'">'+(dd==null?'1 round':dd>0.05?'\u25b2 better':dd<-0.05?'\u25bc worse':'level')+'</em></div>'}).filter(Boolean);
  var games=rows.length?'<div class="mgn-k2">Games in this period</div><div class="mgn-sub">Your recent rounds against your earlier ones in this period</div><div class="mgn-gts">'+rows.join('')+'</div>':'';
  return '<div class="mgn-card" id="mgn-trends"><div class="mgn-top"><div><div class="mgn-k">Your trend</div><div class="mgn-sub">'+P[1]+' \u00b7 '+day(from)+' to today</div></div>'+head+'</div>'+chips+chart+legend+games+'</div>'}

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
 '.mgn-part{grid-column:1/-1;font-size:12px;color:#9C988C}.mgn-note{margin:0;font-size:12px;color:#9C988C}.mgn-links{display:flex;flex-wrap:wrap;gap:8px}.mgn-links a{color:#FFD900;font-weight:700;font-size:14px;text-decoration:none;border:1px solid rgba(255,217,0,.4);padding:8px 10px}',
 '.mgn-prog{height:8px;background:rgba(244,241,234,.12)}.mgn-prog i{display:block;height:100%;background:#FFD900}',
 '.mgn-goals{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}.mgn-goals li{display:grid;grid-template-columns:1fr auto;gap:4px 10px;font-size:13px}.mgn-goals em{font-style:normal;font-weight:700;color:#FFD900}',
 '.mgn-gbar{grid-column:1/-1;height:4px;background:rgba(244,241,234,.12)}.mgn-gbar i{display:block;height:100%;background:#FFD900}',
 '.mgn-btn{display:block;text-align:center;background:#FFD900;color:#0B0B0B;font-family:Anton,Impact,sans-serif;font-size:20px;text-transform:uppercase;padding:13px;text-decoration:none}',
 '.mgn-tests{display:flex;flex-direction:column;gap:10px}.mgn-test{display:grid;grid-template-columns:1fr 120px 64px;gap:10px;align-items:center}.mgn-test b{font-size:14px}.mgn-test small{display:block;font-size:11px;color:#9C988C}',
 '.mgn-spark{width:100%;height:40px;color:#F4F1EA}.mgn-hc{text-align:right}.mgn-hc b{display:block;font-family:Anton,Impact,sans-serif;font-weight:400;font-size:26px;line-height:1}.mgn-hc em{font-style:normal;font-size:11px;font-weight:700}.mgn-hc em.up{color:#3ad37a}.mgn-hc em.down{color:#ff6b5e}',
 '.mgn-games{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mgn-game{display:flex;flex-direction:column;gap:2px;background:rgba(244,241,234,.06);padding:12px;color:#F4F1EA;text-decoration:none}',
 '.mgn-chips{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.mgn-chip{background:transparent;color:#d9d5cb;border:1px solid rgba(244,241,234,.25);padding:7px 11px;font:600 13px Inter,system-ui,sans-serif;cursor:pointer}.mgn-chip.on{background:#FFD900;border-color:#FFD900;color:#0B0B0B}',
 '.mgn-chart{width:100%;height:auto;display:block}.mgn-chart text{fill:#9C988C;font:10px Inter,system-ui,sans-serif}.mgn-chart .gl{stroke:rgba(244,241,234,.1)}.mgn-axis{font-size:11px;color:#9C988C;margin-top:-6px}',
 '.mgn-leg{display:flex;flex-direction:column;gap:6px}.mgn-leg div{display:grid;grid-template-columns:10px 1fr auto auto;gap:8px;align-items:center;font-size:13px}.mgn-leg i{width:10px;height:10px;border-radius:50%}.mgn-leg b{font-family:Anton,Impact,sans-serif;font-weight:400;font-size:18px}.mgn-leg em{font-style:normal;font-size:11px;font-weight:700;min-width:74px;text-align:right;color:#9C988C}.mgn-leg em.up{color:#3ad37a}.mgn-leg em.down{color:#ff6b5e}',
 '.mgn-k2{font-weight:700;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#F4F1EA;margin-top:4px;padding-top:12px;border-top:1px solid rgba(244,241,234,.12)}.mgn-gts{display:flex;flex-direction:column;gap:8px}.mgn-gt{display:grid;grid-template-columns:1fr 100px 62px;gap:10px;align-items:center}.mgn-gt b{font-size:14px}.mgn-gt small{display:block;font-size:11px;color:#9C988C}.mgn-gt em{font-style:normal;font-size:11px;font-weight:700;text-align:right;color:#9C988C}.mgn-gt em.up{color:#3ad37a}.mgn-gt em.down{color:#ff6b5e}.mgn-gt .mgn-spark{height:30px}',
 '.mgn-game small{font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:#9C988C;font-weight:700}.mgn-game b{font-size:14px}.mgn-best{font-family:Anton,Impact,sans-serif;font-size:30px;line-height:1.1;color:#FFD900}.mgn-game em{font-style:normal;font-size:11px;color:#9C988C}.mgn-game .mgn-spark{height:30px}'
 ].join('');document.head.appendChild(s)}

window.MGNumbers={load:load,shape:shape,byArea:byArea,sgCard:sgCard,planCard:planCard,testsCard:testsCard,trendsCard:trendsCard,PERIODS:PERIODS,gamesCard:gamesCard,planStats:planStats,css:css,TESTS:TESTS,GAMES:GAMES,esc:esc};
})();
