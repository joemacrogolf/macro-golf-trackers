/* Head-to-head on the golf games: one round each, on one phone.
   Loaded by leaderboard.js on the golf game pages listed in GAMES below.
   The signed-in player's round saves and counts on the leaderboard as normal.
   A guest's round is for fun only: while it's the guest's turn nothing is written to this phone's storage
   and no save or load reaches the database, then the page reloads to drop the guest's round.
   State for the match lives in sessionStorage ('mgh2h'), so it survives that reload. */
(function(){
if(window.MGH2H)return;
var GAMES={'golf-hole-out':1,'golf-insanity':1,'golf-money-stealers':1,'golf-fifty-ft-bank':1,'golf-par-18':1,'golf-wedge-darts':1,'golf-left-is-lava':1,'golf-driver-corridor':1,'golf-three-strikes':1};
var tag=document.querySelector('script[data-page]'),PAGE=tag?tag.getAttribute('data-page'):'';
if(!GAMES[PAGE]||typeof window.MG_SCORE!=='function')return;
/* no head-to-head when the game was opened from a practice plan: plans have no competitive extras */
try{if(/[?&]from=plan\b/.test(location.search)&&!sessionStorage.getItem('mgh2h'))return}catch(e){}
var SK='mgh2h',M=null,base=null,timer=null,done=false;
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function load(){try{var m=JSON.parse(sessionStorage.getItem(SK)||'null');return m&&m.page===PAGE?m:null}catch(e){return null}}
function store(){try{if(M)sessionStorage.setItem(SK,JSON.stringify(M));else sessionStorage.removeItem(SK)}catch(e){}}
function me(){try{var g=JSON.parse(localStorage.getItem('mgsync-group:golf')||'null');if(g&&g.name)return String(g.name).split(/\s+/)[0]}catch(e){}return 'You'}
function signedIn(){try{return !!JSON.parse(localStorage.getItem('mgsync:'+(typeof KEY!=='undefined'?KEY:''))||'null')}catch(e){return false}}
function info(){try{return window.MG_SCORE()||{}}catch(e){return {}}}

/* ---- the guest guard: nothing written, nothing sent ---- */
var guard=false;
(function(){try{var P=Storage.prototype,si=P.setItem,ri=P.removeItem;
  P.setItem=function(k,v){if(guard&&this===window.localStorage&&!/^mgh2h/.test(k))return;return si.apply(this,arguments)};
  P.removeItem=function(k){if(guard&&this===window.localStorage&&!/^mgh2h/.test(k))return;return ri.apply(this,arguments)};
  var f=window.fetch;if(f)window.fetch=function(u){if(guard&&/\/rpc\/mg_(save|load)/.test(String(u&&u.url||u)))return Promise.reject(new Error('head-to-head guest turn'));return f.apply(this,arguments)}}catch(e){}})();
function setGuard(on){guard=!!on;window.MG_H2H_GUEST=!!on}

/* ---- rounds: the page's own list of finished rounds ---- */
function field(){var S=window.S;return S&&Array.isArray(S.mgRounds)?'mgRounds':'history'}
function list(){var S=window.S,a=S&&S[field()];return Array.isArray(a)?a:[]}
function key(r){return r&&r.id!=null?'id:'+r.id:JSON.stringify(r)}
function keys(){return list().map(key)}
function scoreOf(r){var S=window.S,f=field(),keep=S[f],v=null;try{S[f]=[r];var x=info();v=x&&x.best}catch(e){}S[f]=keep;return v}
function fmt(v){var n=Number(v),u=info().unit;if(v==null||!isFinite(n))return '–';
  if(u==='hc')return n<0?'+'+Math.abs(n):String(n);if(u==='SG')return (n>0?'+':'')+n.toFixed(2);return String(Math.round(n*10)/10)}
function unitWord(){var u=info().unit;return u==='hc'?'handicap':u==='SG'?'strokes gained':u||'points'}
function better(){return info().better==='low'?'low':'high'}

/* ---- the match ---- */
function cur(){return M?M.players[M.order[M.turn]]:null}
function startTurn(){var p=cur();if(!p)return;setGuard(!p.me);paintBar();
  /* let the page and its cloud save settle before taking the list of rounds already played */
  base=null;clearInterval(timer);setTimeout(function(){base=keys();timer=setInterval(poll,1000)},p.me?1500:2500)}
function poll(){if(!M||!base||done)return;var a=list(),fresh=a.filter(function(r){return base.indexOf(key(r))<0});if(!fresh.length)return;
  var s=scoreOf(fresh[fresh.length-1]);if(s==null)return;
  clearInterval(timer);M.scores[M.order[M.turn]]=s;M.turn++;store();
  /* give the page a moment to show its own end-of-round screen */
  setTimeout(function(){overlay(M.turn>=M.players.length?'result':'next')},1800)}
function stop(){var g=guard;M=null;store();clearInterval(timer);setGuard(false);var b=document.querySelector('.h2h-bar');if(b)b.remove();document.documentElement.classList.remove('h2h-on');closeO();if(g)location.reload()}

/* ---- screens ---- */
function closeO(){var o=document.querySelector('.h2h-wrap');if(o)o.remove();document.documentElement.classList.remove('h2h-lock')}
function shell(inner){closeO();var o=document.createElement('div');o.className='h2h-wrap';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Head-to-head');
  o.innerHTML='<div class="h2h-in">'+inner+'</div>';document.body.appendChild(o);document.documentElement.classList.add('h2h-lock');var f=o.querySelector('input,button.h2h-y');if(f)f.focus();return o}
function setup(){var mine=me(),o=shell('<div class="h2h-top"><div><div class="h2h-k">Head-to-head</div><div class="h2h-h">One round each</div></div><button type="button" class="h2h-x" data-x>Back</button></div>'+
  '<p>Play one round each on this phone, then see who won.</p>'+
  '<div class="h2h-warn"><b>Only '+esc(mine==='You'?'your':mine+'’s')+' round is saved</b>'+(signedIn()?esc(mine==='You'?'Your':mine+'’s')+' round saves and counts on the leaderboard as normal.':'Your round saves on this phone as normal. Sign in with your PIN to put it on the leaderboard.')+' Your opponent’s round is just for fun: it isn’t saved anywhere and doesn’t count on any leaderboard.</div>'+
  '<label class="h2h-l">Your opponent’s name<input id="h2hName" maxlength="20" autocomplete="off" placeholder="First name"></label>'+
  '<div class="h2h-l">Who goes first?<div class="h2h-seg"><button type="button" data-f="0" aria-pressed="true">'+esc(mine)+'</button><button type="button" data-f="1" aria-pressed="false" id="h2hOpp">Opponent</button></div></div>'+
  '<button type="button" class="h2h-y" data-go disabled>Start head-to-head</button>');
  var first=0,inp=o.querySelector('#h2hName'),go=o.querySelector('[data-go]');
  inp.addEventListener('input',function(){var v=inp.value.trim();go.disabled=!v;o.querySelector('#h2hOpp').textContent=v||'Opponent'});
  o.addEventListener('click',function(e){var b=e.target.closest('button');if(e.target===o||(b&&b.hasAttribute('data-x'))){closeO();if(!M){choose('');chooser()}return}if(!b)return;
    if(b.dataset.f){first=+b.dataset.f;[].forEach.call(o.querySelectorAll('[data-f]'),function(x){x.setAttribute('aria-pressed',String(x===b))})}
    else if(b.hasAttribute('data-go')){var n=inp.value.trim();if(!n)return;
      M={page:PAGE,players:[{n:mine,me:true},{n:n,me:false}],order:first?[1,0]:[0,1],turn:0,scores:[null,null],t:Date.now()};store();closeO();startTurn();window.scrollTo(0,0)}})}
function overlay(kind){var P=M.players,last=P[M.order[M.turn-1]],sc=M.scores;
  if(kind==='next'){var nx=cur();shell('<div class="h2h-k">Head-to-head</div><div class="h2h-h">'+esc(last.n)+': '+esc(fmt(sc[M.order[M.turn-1]]))+'</div>'+
    '<p>'+esc(last.n)+' has finished. Pass the phone to <b>'+esc(nx.n)+'</b>.</p>'+(nx.me?'':'<div class="h2h-warn"><b>'+esc(nx.n)+'’s round won’t be saved</b>It’s just for fun and doesn’t count on any leaderboard.</div>')+
    '<button type="button" class="h2h-y" data-n>Start '+esc(nx.n)+'’s turn</button><button type="button" class="h2h-ghost" data-s>Stop head-to-head</button>');
    document.querySelector('.h2h-wrap').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
      if(b.hasAttribute('data-s'))return stop();
      /* after a guest turn, reload so the guest's round is dropped and the page shows the saved state again */
      if(last.me){closeO();startTurn();window.scrollTo(0,0)}else{closeO();setGuard(false);location.reload()}});return}
  var lo=better()==='low',a=sc[0],b=sc[1],w=a===b?-1:((lo?a<b:a>b)?0:1);
  shell('<div class="h2h-k">Head-to-head result</div><div class="h2h-h">'+(w<0?'It’s a tie':esc(P[w].n)+' wins')+'</div>'+
   '<div class="h2h-res">'+[0,1].map(function(i){return '<div class="'+(i===w?'win':'')+'"><span>'+esc(P[i].n)+(P[i].me?'':' <small>not saved</small>')+'</span><b>'+esc(fmt(sc[i]))+'</b></div>'}).join('')+'</div>'+
   '<p class="h2h-small">'+(lo?'Lowest':'Highest')+' '+esc(unitWord())+' wins. Only '+esc(P[0].n==='You'?'your':P[0].n+'’s')+' round was saved.</p>'+
   '<button type="button" class="h2h-y" data-a>Rematch</button><button type="button" class="h2h-ghost" data-d>Done</button>');
  document.querySelector('.h2h-wrap').addEventListener('click',function(e){var bt=e.target.closest('button');if(!bt)return;
    var wasGuest=!P[M.order[1]].me;
    if(bt.hasAttribute('data-a')){M.turn=0;M.scores=[null,null];M.order=[M.order[1],M.order[0]];store();closeO();if(wasGuest){setGuard(false);location.reload()}else{startTurn();window.scrollTo(0,0)}}
    else{var g=wasGuest;M=null;store();closeO();setGuard(false);var bar=document.querySelector('.h2h-bar');if(bar)bar.remove();document.documentElement.classList.remove('h2h-on');if(g)location.reload()}})}
function paintBar(){var p=cur(),b=document.querySelector('.h2h-bar');if(!p){if(b)b.remove();return}
  if(!b){b=document.createElement('div');b.className='h2h-bar';b.setAttribute('role','status');document.body.appendChild(b);
    b.addEventListener('click',function(e){if(e.target.closest('[data-s]'))stop()})}
  document.documentElement.classList.add('h2h-on');
  b.innerHTML='<span class="h2h-dot'+(p.me?'':' g')+'"></span><div><b>'+esc(p.n)+'’s turn</b><small>Head-to-head · '+(p.me?'this round saves':'just for fun, not saved')+' · finish a round to swap</small></div><button type="button" data-s>Stop</button>'}

/* ---- the first choice on every game: single player or head-to-head (once per visit) ---- */
var MK='mgh2h-mode:'+PAGE;
function chosen(){try{return sessionStorage.getItem(MK)}catch(e){return null}}
function choose(v){try{sessionStorage.setItem(MK,v)}catch(e){}}
function chooser(){var o=shell('<div class="h2h-k">'+esc(gameName())+'</div><div class="h2h-h">How are you playing?</div>'+
  '<div class="h2h-pick"><button type="button" data-m="solo"><b>Single player</b><span>Just you. Your round saves and counts on the leaderboard.</span></button>'+
  '<button type="button" data-m="h2h"><b>Head to head</b><span>You against a friend on this phone. Only your round is saved.</span></button></div>');
  o.addEventListener('click',function(e){var b=e.target.closest('button');if(!b||!b.dataset.m)return;choose(b.dataset.m);closeO();if(b.dataset.m==='h2h')setup()})}
var NAMES={'golf-hole-out':'Hole Out','golf-insanity':'Insanity','golf-money-stealers':'Money Stealers','golf-fifty-ft-bank':'50ft Bank','golf-par-18':'Par 18','golf-wedge-darts':'Wedge Darts','golf-left-is-lava':'Lava','golf-driver-corridor':'Driver Corridor','golf-three-strikes':'3 Strikes'};
function gameName(){return NAMES[PAGE]||'Practice game'}

/* ---- the button ---- */
function tab(){if(document.querySelector('.h2h-tab'))return;var b=document.createElement('button');b.type='button';b.className='h2h-tab';b.setAttribute('aria-label','Head-to-head');
  b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="7" cy="8" r="3" stroke="currentColor" stroke-width="2.2"/><circle cx="17" cy="8" r="3" stroke="currentColor" stroke-width="2.2"/><path d="M2 20c0-3 2.2-5 5-5s5 2 5 5M12 20c0-3 2.2-5 5-5s5 2 5 5" stroke="currentColor" stroke-width="2.2"/></svg>H2H';
  b.addEventListener('click',function(){if(M)return;setup()});document.body.appendChild(b);
  function place(){var lb=document.querySelector('.lb-tab');if(lb){var w=Math.round(lb.getBoundingClientRect().width);b.style.minWidth=w?w+'px':''}}
  place();var n=0,iv=setInterval(function(){place();if(++n>12)clearInterval(iv)},800)}
function css(){var s=document.createElement('style');s.textContent=[
 '.h2h-tab{position:fixed;right:max(10px,env(safe-area-inset-right,0px));bottom:calc(114px + env(safe-area-inset-bottom,0px));z-index:37;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:0 12px;border:0;border-top:3px solid #FFD900;background:#0B0B0B;color:#F4F1EA;font-family:Anton,Impact,sans-serif;font-size:15px;text-transform:uppercase;letter-spacing:.3px;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.35)}',
 '.h2h-tab svg{color:#FFD900}html.h2h-on .h2h-tab{display:none}html.mg-inapp .h2h-tab{bottom:calc(182px + env(safe-area-inset-bottom,0px))!important}',
 '.h2h-bar{position:fixed;left:0;right:0;top:0;z-index:58;display:flex;align-items:center;gap:10px;padding:calc(8px + env(safe-area-inset-top,0px)) 12px 8px;background:#0B0B0B;color:#F4F1EA;border-bottom:3px solid #FFD900;font-family:Inter,system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.3)}',
 '.h2h-bar div{flex:1;min-width:0;display:flex;flex-direction:column}.h2h-bar b{font-family:Anton,Impact,sans-serif;font-weight:400;font-size:18px;text-transform:uppercase;letter-spacing:.3px;line-height:1.1}.h2h-bar small{font-size:12px;color:#c9c4b6;line-height:1.3}',
 '.h2h-bar button{min-height:38px;padding:0 12px;border:1px solid rgba(244,241,234,.35);background:transparent;color:#F4F1EA;font:600 13px Inter,system-ui,sans-serif;cursor:pointer}',
 '.h2h-dot{width:12px;height:12px;border-radius:50%;background:#FFD900;flex:0 0 auto}.h2h-dot.g{background:#6fd3ff}html.h2h-on body{padding-top:62px}',
 'html.h2h-lock,html.h2h-lock body{overflow:hidden}',
 '.h2h-wrap{position:fixed;inset:0;z-index:63;background:rgba(11,11,11,.97);overflow-y:auto;padding:calc(18px + env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) calc(40px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));font-family:Inter,system-ui,sans-serif;color:#F4F1EA}',
 '.h2h-in{max-width:520px;margin:0 auto;display:flex;flex-direction:column;gap:16px}.h2h-in p{margin:0;font-size:16px;line-height:1.5;color:#e4e0d6}',
 '.h2h-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.h2h-x{min-height:40px;padding:0 14px;border:1px solid rgba(244,241,234,.35);background:transparent;color:#F4F1EA;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}',
 '.h2h-k{font-weight:700;font-size:11px;letter-spacing:2.2px;text-transform:uppercase;color:#FFD900}.h2h-h{font-family:Anton,Impact,sans-serif;font-size:38px;line-height:1.05;text-transform:uppercase;margin-top:4px}',
 '.h2h-warn{border-left:5px solid #FFD900;background:#1c1b17;padding:12px 14px;font-size:14px;line-height:1.5;color:#e4e0d6}.h2h-warn b{display:block;color:#FFD900;font-size:15px;margin-bottom:2px}',
 '.h2h-l{display:flex;flex-direction:column;gap:8px;font-weight:700;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#FFD900}',
 '.h2h-l input{font:400 20px Inter,system-ui,sans-serif;letter-spacing:normal;text-transform:none;min-height:52px;padding:0 14px;border:1px solid rgba(244,241,234,.35);background:#1a1916;color:#F4F1EA}',
 '.h2h-seg{display:grid;grid-template-columns:1fr 1fr;gap:8px}.h2h-seg button{min-height:48px;border:1px solid rgba(244,241,234,.35);background:transparent;color:#F4F1EA;font:600 16px Inter,system-ui,sans-serif;letter-spacing:normal;text-transform:none;cursor:pointer;overflow:hidden;text-overflow:ellipsis}',
 '.h2h-seg button[aria-pressed=true]{background:#FFD900;color:#0B0B0B;border-color:#FFD900}',
 '.h2h-y{min-height:56px;border:0;background:#FFD900;color:#0B0B0B;font-family:Anton,Impact,sans-serif;text-transform:uppercase;font-size:21px;cursor:pointer}.h2h-y:disabled{opacity:.45}',
 '.h2h-ghost{min-height:48px;border:1px solid rgba(244,241,234,.3);background:transparent;color:#F4F1EA;font:600 15px Inter,system-ui,sans-serif;cursor:pointer}',
 '.h2h-res{display:grid;grid-template-columns:1fr 1fr;gap:10px}.h2h-res div{background:#1c1b17;padding:14px;display:flex;flex-direction:column;gap:6px;border-top:4px solid #3a3830}',
 '.h2h-res div.win{border-top-color:#FFD900}.h2h-res span{font-weight:700;font-size:15px}.h2h-res small{display:block;font-weight:500;font-size:12px;color:#9d988a}.h2h-res b{font-family:Anton,Impact,sans-serif;font-weight:400;font-size:44px;line-height:1}.h2h-res .win b{color:#FFD900}',
 '.h2h-small{font-size:13px!important;color:#9d988a!important}',
 '.h2h-pick{display:flex;flex-direction:column;gap:12px}.h2h-pick button{display:flex;flex-direction:column;gap:6px;text-align:left;padding:20px 18px;border:2px solid rgba(244,241,234,.25);background:#1a1916;color:#F4F1EA;cursor:pointer;font-family:Inter,system-ui,sans-serif}',
 '.h2h-pick button b{font-family:Anton,Impact,sans-serif;font-weight:400;font-size:30px;text-transform:uppercase;line-height:1;color:#F4F1EA}.h2h-pick button span{font-size:15px;line-height:1.45;color:#c9c4b6}',
 '.h2h-pick button:first-child{border-color:#FFD900}.h2h-pick button:first-child b{color:#FFD900}.h2h-pick button:active{transform:scale(.99)}',
 '.h2h-wrap button:focus-visible,.h2h-tab:focus-visible,.h2h-bar button:focus-visible{outline:3px solid #FFD900;outline-offset:2px}'].join('');document.head.appendChild(s)}

function init(){css();tab();M=load();
  if(M){if(M.turn>=M.players.length)overlay('result');else startTurn()}
  else if(!chosen())setTimeout(chooser,300)}
window.MGH2H={stop:stop,_state:function(){return M}};
/* a guest turn must block storage before anything else runs after a reload */
(function(){var m=load();if(m&&m.turn<m.players.length&&!m.players[m.order[m.turn]].me)setGuard(true)})();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
