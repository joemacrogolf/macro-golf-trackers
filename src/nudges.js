/* Nudges (Jack, 13 Nov): one personal nudge card under the day-streak bar, to give the player a reason to play today.
   Everything comes from what's already on this phone (every www.macro.golf page shares localStorage) plus the public
   read-only leaderboard function, so there's no sign-in and nothing new on the server.
   In priority order:
     1. Leaderboard: someone has pushed you down a place on a game you've played (all time or this month).
     2. Practice Plan: sessions still to do this week (with the next one named).
     3. Retest: 6 weeks since a test (or since the plan started).
     4. First test: no tests yet, so start with one (it unlocks My Numbers).
   Tap the card to go there, × hides that nudge for today, "1 of 3 ›" shows the next one.
   Loaded by day-streak.js on golf pages and My Practice. MGNudges.list() returns the nudges (for testing). */
(function(){
if(window.MGNudges)return;
var page=(document.querySelector('script[data-page]')||{getAttribute:function(){return ''}}).getAttribute('data-page')||'';
if(!/^golf-/.test(page)&&page!=='my-practice')return;
var URL='https://zhcgwtlyqriwlhbzkxcl.supabase.co/rest/v1/rpc/mg_leaderboard',APIKEY='sb_publishable__IBhmrVHOXsLHruU7XJB-g_OSN9Ljne';
/* game page -> [name, Kajabi path, localStorage key of its record] */
var G={'golf-hole-out':['Hole Out','p-151044','macroHO'],'golf-insanity':['Insanity','p-208731','insanity'],'golf-money-stealers':['Money Stealers','p-529063','moneyStealers'],
 'golf-fifty-ft-bank':['50ft Bank','p-472096','bank50'],'golf-par-18':['Par 18','p-615974','par18'],'golf-wedge-darts':['Wedge Darts','p-386417','wedgeDarts'],
 'golf-left-is-lava':['Lava','p-740258','leftIsLava'],'golf-driver-corridor':['Driver Corridor','p-937452','driverCorridor'],'golf-three-strikes':['3 Strikes','p-863140','threeStrikes'],
 'golf-putting-test':['Putting Test','p-350829','macroPT'],'golf-short-game-test':['Short Game Test','p-791364','macroSGT'],'golf-long-game-test':['Long Game Test','p-524617','macroLGT']};
var TESTS={putting:['Putting Test','p-350829'],short:['Short Game Test','p-791364'],long:['Long Game Test','p-524617']};
var PLAN='p-274816';
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function js(k,d){try{var v=JSON.parse(ls(k)||'null');return v==null?d:v}catch(e){return d}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function today(){return iso(new Date())}
function weekKey(){var x=new Date();x=new Date(x.getFullYear(),x.getMonth(),x.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return iso(x)}
function ord(n){var s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0])}
var AN={app:'Approach',drive:'Driving',short:'Short game',putt:'Putting'},AO=['drive','app','short','putt'];

/* ---------- leaderboard: rank checks, at most every 3 hours, only games with a cloud save on this phone ---------- */
var LBK='mg-nudge-lb';
function myCode(key){var c=js('mgsync:'+key,null);return c&&c.code||null}
function played(){return Object.keys(G).filter(function(g){var k=G[g][2],r=js(k,null);return myCode(k)&&r&&r._mgSummary&&r._mgSummary.golf&&r._mgSummary.golf.best!=null})}
function rankOf(g,period){return fetch(URL,{method:'POST',headers:{apikey:APIKEY,'Content-Type':'application/json'},body:JSON.stringify({p_game:g,p_period:period,p_me:myCode(G[g][2])})})
  .then(function(r){return r.json()}).then(function(j){var rows=j&&j.rows||[];for(var i=0;i<rows.length;i++)if(rows[i].me)return i+1;return null}).catch(function(){return null})}
function checkBoards(){var st=js(LBK,{t:0,now:{},seen:{}});if(Date.now()-(st.t||0)<3*3600e3)return Promise.resolve(st);
  var gs=played().slice(0,9),mon=today().slice(0,7),jobs=[];
  gs.forEach(function(g){['all','month'].forEach(function(p){jobs.push(rankOf(g,p).then(function(r){if(r)st.now[g+'|'+p+(p==='month'?'|'+mon:'')]=r}))})});
  return Promise.all(jobs).then(function(){st.t=Date.now();
    /* first sighting of a rank is just remembered: no nudge for where you already were */
    Object.keys(st.now).forEach(function(k){if(st.seen[k]==null||st.now[k]<st.seen[k])st.seen[k]=st.now[k]});
    ls(LBK,JSON.stringify(st));return st})}
function boardNudges(st){var out=[];Object.keys(st.now||{}).forEach(function(k){var r=st.now[k],s=st.seen[k],p=k.split('|');if(!(s&&r>s)||r>20)return;var g=G[p[0]];if(!g)return;
  out.push({id:'lb:'+k+':'+r,icon:'board',pri:1,k:p[1]==='all'?'Leaderboard · all time':'Leaderboard · this month',
    t:'Someone just beat you on '+g[0],s:'You were '+ord(s)+', now you\'re '+ord(r)+'. Win your place back.',go:g[1],seen:k})});
  return out.sort(function(a,b){return a.id<b.id?-1:1}).slice(0,2)}

/* ---------- Practice Plan: sessions left this week ---------- */
function planNudges(){var rec=js('mgPracticePlan',null),P=rec&&rec.practice;if(!P||!P.plan||!Array.isArray(P.plan.week)||!P.plan.week.length)return [];
  var n=P.plan.week.length,done=((P.weeks||{})[weekKey()]||[]),left=[];for(var i=0;i<n;i++)if(done.indexOf(i)<0)left.push(i);
  if(!left.length)return [];var dow=(new Date().getDay()+6)%7,daysLeft=7-dow;
  var s=P.plan.week[left[0]],items=s.items||[],areas=AO.filter(function(a){return items.some(function(x){return x.area===a})}).map(function(a){return AN[a]});
  var urgent=left.length>=daysLeft;
  return [{id:'plan:'+weekKey()+':'+left.length,icon:'plan',pri:urgent?1.5:2,k:'Your Practice Plan',
    t:left.length+' session'+(left.length>1?'s':'')+' left this week',
    s:'Next up: '+(areas.join(' & ')||'session '+(left[0]+1))+(P.plan.mins?', '+P.plan.mins+' min':'')+'.'+(urgent?' '+(daysLeft===1?'Today\'s':'Only '+daysLeft+' days')+' left to fit '+(left.length>1?'them':'it')+' in.':''),go:PLAN}]}

/* ---------- retest after 6 weeks, or a first test ---------- */
function testNudges(){var R=js('macroResults',{})||{},out=[],now=Date.now(),any=false;
  Object.keys(TESTS).forEach(function(k){var e=R[k];if(!e||!e.t)return;any=true;var wk=Math.floor((now-e.t)/(7*864e5));
    if(wk>=6)out.push({id:'retest:'+k+':'+e.t,icon:'test',pri:3,k:'Retest time',t:wk+' weeks since your '+TESTS[k][0],s:'Retest to see how far you\'ve come. Your new numbers build your next plan.',go:TESTS[k][1]})});
  if(!any){var rec=js('mgPracticePlan',null),P=rec&&rec.practice,T=P&&P.tests||{};any=Object.keys(T).some(function(k){return T[k]&&T[k].raw})}
  if(!any)out.push({id:'first-test',icon:'test',pri:4,k:'Start here',t:'Take your first test',s:'The Putting Test takes about 15 minutes. It unlocks My Numbers and builds your plan.',go:TESTS.putting[1]});
  return out.slice(0,1)}

function hiddenToday(){var h=js('mg-nudge-hide',{});return h&&h.d===today()?h.ids||[]:[]}
function hide(id){var h={d:today(),ids:hiddenToday().concat([id])};ls('mg-nudge-hide',JSON.stringify(h))}
function list(st){var hid=hiddenToday(),here=location.pathname.replace(/^\//,'');
  return boardNudges(st||js(LBK,{now:{},seen:{}})).concat(planNudges(),testNudges())
    .filter(function(n){return hid.indexOf(n.id)<0&&!(n.go===here&&n.icon!=='board')}).sort(function(a,b){return a.pri-b.pri})}
/* a leaderboard nudge is "seen" once it's been tapped or closed, so the same drop doesn't come back */
function markSeen(n){if(!n.seen)return;var st=js(LBK,null);if(!st)return;st.seen[n.seen]=st.now[n.seen];ls(LBK,JSON.stringify(st))}

var ICON={board:'<path d="M4 20V11h4v9M10 20V5h4v15M16 20v-6h4v6" stroke="#FFD900" stroke-width="2.2" fill="none"/>',
 plan:'<rect x="4" y="5" width="16" height="15" stroke="#FFD900" stroke-width="2.2" fill="none"/><path d="M4 10h16M9 3v4M15 3v4" stroke="#FFD900" stroke-width="2.2"/>',
 test:'<circle cx="12" cy="12" r="8" stroke="#FFD900" stroke-width="2.2" fill="none"/><circle cx="12" cy="12" r="3" fill="#FFD900"/>'};
function css(){if(document.getElementById('mgn2-css'))return;var s=document.createElement('style');s.id='mgn2-css';s.textContent=[
 '.mgnu{display:flex;align-items:stretch;background:#171613;color:#F4F1EA;border-bottom:1px solid rgba(244,241,234,.12);font-family:Inter,system-ui,sans-serif;animation:mgnuIn .35s ease both}',
 '.mgnu a.go{flex:1;min-width:0;display:flex;align-items:center;gap:12px;padding:12px 4px 12px max(14px,env(safe-area-inset-left,0px));color:inherit;text-decoration:none}',
 '.mgnu .ic{flex:0 0 auto;width:40px;height:40px;display:grid;place-items:center;background:#0B0B0B;border:1px solid rgba(255,217,0,.4)}',
 '.mgnu .tx{min-width:0;display:flex;flex-direction:column;gap:2px}',
 '.mgnu .k{font-size:10.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#FFD900}',
 '.mgnu b{font:400 18px/1.1 Anton,Impact,sans-serif;text-transform:uppercase;letter-spacing:.2px}',
 '.mgnu span.s{font-size:13px;line-height:1.35;color:#C9C6BE}',
 '.mgnu .ar{flex:0 0 auto;color:#FFD900;font-size:22px;font-weight:700;padding-left:4px}',
 '.mgnu .side{flex:0 0 auto;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;padding:6px max(8px,env(safe-area-inset-right,0px)) 6px 4px}',
 '.mgnu button{border:0;background:none;color:#9C988C;font:600 12px Inter,system-ui,sans-serif;min-width:36px;min-height:30px;cursor:pointer}',
 '.mgnu button.x{font-size:20px;line-height:1;color:#C9C6BE}',
 '.mgnu button:focus-visible,.mgnu a.go:focus-visible{outline:3px solid #FFD900;outline-offset:-3px}',
 '@keyframes mgnuIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}',
 '@media (prefers-reduced-motion:reduce){.mgnu{animation:none}}'].join('');document.head.appendChild(s)}
var idx=0,current=[];
function paint(){var root=document.getElementById('mg-root');if(!root)return;var el=document.querySelector('.mgnu');
  if(!current.length){if(el)el.remove();return}
  if(idx>=current.length)idx=0;var n=current[idx];css();
  if(!el){el=document.createElement('div');el.className='mgnu';el.setAttribute('role','region');el.setAttribute('aria-label','Nudge');
    var bar=root.querySelector('.mgd'),after=bar;if(after&&after.parentNode)after.parentNode.insertBefore(el,after.nextSibling);else root.insertBefore(el,root.firstChild)}
  el.innerHTML='<a class="go" href="/'+esc(n.go)+'"><span class="ic"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">'+(ICON[n.icon]||'')+'</svg></span>'+
    '<span class="tx"><span class="k">'+esc(n.k)+'</span><b>'+esc(n.t)+'</b><span class="s">'+esc(n.s)+'</span></span><span class="ar" aria-hidden="true">›</span></a>'+
    '<span class="side"><button type="button" class="x" aria-label="Hide this for today">×</button>'+(current.length>1?'<button type="button" class="nx" aria-label="Next nudge">'+(idx+1)+' of '+current.length+' ›</button>':'')+'</span>';
  el.querySelector('a.go').addEventListener('click',function(e){markSeen(n);if(n.go===location.pathname.replace(/^\//,'')){e.preventDefault();hide(n.id);current.splice(idx,1);paint()}});
  el.querySelector('.x').addEventListener('click',function(){hide(n.id);markSeen(n);current.splice(idx,1);paint()});
  var nx=el.querySelector('.nx');if(nx)nx.addEventListener('click',function(){idx++;paint()})}
function refresh(st){current=list(st);paint()}
function start(){var k=0;(function wait(){var root=document.getElementById('mg-root');if(!root||!root.firstElementChild){if(++k<30)setTimeout(wait,200);return}
  refresh();checkBoards().then(refresh,function(){});
  /* front doors swap their content for the plan they open: put the card back */
  if(window.MutationObserver)new MutationObserver(function(){if(!document.querySelector('.mgnu')&&current.length)paint()}).observe(root,{childList:true})})()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.MGNudges={list:list,refresh:function(){ls(LBK,JSON.stringify(Object.assign(js(LBK,{}),{t:0})));return checkBoards().then(refresh)}};
})();
