/* Back to the Practice Plan after a game.
   Loaded by golfwarm.js on every golf game page. Does nothing unless the page was opened from the Practice Plan (?from=plan).
   - Shows a "Back to plan" button the whole time.
   - When a round finishes (a new round appears in window.MG_SCORE()), waits for the cloud save, says so, and goes straight back.
   - Leaves localStorage 'mgplan-done' = {g:<page path>, t, done:true|false} so the plan ticks the game off and opens the next block.
   The plan stores where to come back to in localStorage 'mgplan-return' = {url, g, t} when Play is tapped. */
(function(){
if(window.MGPlanReturn)return;window.MGPlanReturn=true;
if(!/[?&]from=plan\b/.test(location.search))return;
var ls=function(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}};
var ret=null;try{ret=JSON.parse(ls('mgplan-return')||'null')}catch(e){}
var url=ret&&ret.url&&Date.now()-(+ret.t||0)<12*3600e3?ret.url:'/my-practice';
var here=location.pathname.replace(/^\/+|\/+$/g,'');
function mark(done){ls('mgplan-done',JSON.stringify({g:here,t:Date.now(),done:!!done}))}
function go(done){mark(done);location.href=url}

function css(){if(document.getElementById('mgpr-css'))return;var s=document.createElement('style');s.id='mgpr-css';s.textContent=[
 '.mgpr-back{position:fixed;top:calc(10px + env(safe-area-inset-top,0px));right:max(10px,env(safe-area-inset-right,0px));z-index:62;display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border:2px solid #FFD900;background:#0B0B0B;color:#FFD900;font:400 16px Anton,Impact,sans-serif;text-transform:uppercase;letter-spacing:.3px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.35)}',
 '.mgpr-wrap{position:fixed;inset:0;z-index:80;background:rgba(11,11,11,.96);display:flex;align-items:center;justify-content:center;padding:24px}',
 '.mgpr-card{max-width:420px;width:100%;color:#F4F1EA;font-family:Inter,system-ui,sans-serif;border-left:6px solid #FFD900;background:#141414;padding:24px 22px;display:flex;flex-direction:column;gap:12px}',
 '.mgpr-card small{font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#FFD900}',
 '.mgpr-card h2{margin:0;font:400 40px/1 Anton,Impact,sans-serif;text-transform:uppercase}',
 '.mgpr-card p{margin:0;color:#c9c4b8;font-size:15px;line-height:1.5}',
 '.mgpr-card button{min-height:52px;border:0;font:400 20px Anton,Impact,sans-serif;text-transform:uppercase;cursor:pointer}',
 '.mgpr-card .mgpr-go{background:#FFD900;color:#0B0B0B;min-height:68px;font-size:clamp(20px,6.4vw,28px);white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:10px;animation:mgprPulse 1.6s ease-out infinite}',
 '@keyframes mgprPulse{0%{box-shadow:0 0 0 0 rgba(255,217,0,.7)}70%{box-shadow:0 0 0 14px rgba(255,217,0,0)}100%{box-shadow:0 0 0 0 rgba(255,217,0,0)}}',
 '.mgpr-cont{position:fixed;left:0;right:0;bottom:0;z-index:62;display:flex;align-items:center;justify-content:center;gap:10px;min-height:68px;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));border:0;background:#FFD900;color:#0B0B0B;font:400 26px Anton,Impact,sans-serif;text-transform:uppercase;cursor:pointer;box-shadow:0 -8px 24px rgba(0,0,0,.35);animation:mgprPulse 1.6s ease-out infinite}',
 'html.mg-inapp .mgpr-cont{bottom:calc(68px + env(safe-area-inset-bottom,0px))}',
 '@media (prefers-reduced-motion:reduce){.mgpr-card .mgpr-go,.mgpr-cont{animation:none}}',
 '.mgpr-share{background:transparent;color:#FFD900;border:2px solid #FFD900!important}.mgpr-x{}.mgpr-stay{background:transparent;color:#F4F1EA;border:1px solid rgba(244,241,234,.35)!important;font-size:16px!important;min-height:44px!important}'
 ].join('');document.head.appendChild(s)}

function backBtn(){if(document.querySelector('.mgpr-back'))return;css();var b=document.createElement('button');b.type='button';b.className='mgpr-back';
  b.innerHTML='<span aria-hidden="true">&larr;</span> Back to plan';b.addEventListener('click',function(){go(finished)});document.body.appendChild(b)}

/* a round is finished when the game's own score list gains a round (lists are capped, so compare the whole list, never a shrink) */
function rounds(){try{var r=typeof window.MG_SCORE==='function'&&window.MG_SCORE();return r&&Array.isArray(r.rounds)?JSON.stringify(r.rounds):null}catch(e){return null}}
function count(x){try{return JSON.parse(x).length}catch(e){return 0}}
var base=null,finished=false,timer=null;
function watch(){if(finished)return;var r=rounds();
  if(base===null){base=r}else if(r!==null&&r!==base&&count(r)>=count(base)){done();return}
  setTimeout(watch,1000)}
function saving(){var p=document.querySelector('.mgs-pill');return p&&p.getAttribute('data-s')==='saving'}
/* a new PB gets its celebration (and the share card / photo) first; the plan waits until the player closes it */
function busy(){try{return !!(window.MGPB&&MGPB.busy())}catch(e){return false}}
function done(){if(busy()){finished=true;setTimeout(function(){finished=false;done()},700);return}finished=true;mark(true);css();contBar();var w=document.createElement('div');w.className='mgpr-wrap';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');
  w.innerHTML='<div class="mgpr-card"><small>Game done</small><h2>Nice one</h2><p id="mgprMsg">Saving your score\u2026</p><button type="button" class="mgpr-go">Continue with plan <span aria-hidden="true">&rarr;</span></button><button type="button" class="mgpr-share" hidden>Share my score</button><button type="button" class="mgpr-stay">Stay and look at my results</button></div>';
  document.body.appendChild(w);var msg=w.querySelector('#mgprMsg'),left=4,t0=Date.now();
  w.querySelector('.mgpr-go').addEventListener('click',function(){clearTimeout(timer);go(true)});
  /* the game's own share button (game-done screen): share first, the plan waits */
  var gs=document.querySelector('.ux-done .ux-share'),sb=w.querySelector('.mgpr-share');if(gs){sb.hidden=false;sb.textContent=gs.textContent}
  sb.addEventListener('click',function(){clearTimeout(timer);w.remove();contBar();var g=document.querySelector('.ux-done .ux-share');if(g)g.click()});
  w.querySelector('.mgpr-stay').addEventListener('click',function(){clearTimeout(timer);w.remove();contBar()});
  (function tick(){if(saving()&&Date.now()-t0<8000){msg.textContent='Saving your score\u2026';timer=setTimeout(tick,400);return}
    msg.textContent='Score saved. Continuing with your plan in '+left+'\u2026';if(left<=0){go(true);return}left--;timer=setTimeout(tick,1000)})()}

/* once the game is done the small corner button becomes one big, obvious button */
function contBar(){var o=document.querySelector('.mgpr-back');if(o)o.remove();if(document.querySelector('.mgpr-cont'))return;var b=document.createElement('button');b.type='button';b.className='mgpr-cont';
  b.innerHTML='Continue with plan <span aria-hidden="true">&rarr;</span>';b.addEventListener('click',function(){go(true)});document.body.appendChild(b)}
/* the plan already knows the player: fill the game's start screen with their name and target handicap and hide those boxes.
   Games that ask nothing else (no level, lava side, tees, carry, band or entry mode to pick) skip the start screen. */
function fillGate(tries){var nm=document.getElementById('gName'),g=document.getElementById('gate');
  if(!nm||!g){if(tries<25)setTimeout(function(){fillGate(tries+1)},200);return}
  if(!ret||(!ret.name&&!ret.hc)||g.hidden)return;
  if(ret.name){nm.value=ret.name;nm.dispatchEvent(new Event('input',{bubbles:true}));var f=nm.closest('.fld,label');if(f)f.style.display='none'}
  var hc=document.getElementById('gHc');
  if(hc&&ret.hc&&[].some.call(hc.options,function(o){return o.value===ret.hc})){hc.value=ret.hc;hc.dispatchEvent(new Event('change',{bubbles:true}));var h=hc.closest('.fld,label');if(h)h.style.display='none'}
  var more=['gLvl','gLava','gBand','gCarry','gTees','gMode'].some(function(id){var e=document.getElementById(id);return e&&e.offsetParent!==null});
  var go=document.getElementById('gGo');if(!more&&go&&!go.disabled&&nm.value.trim()&&(!hc||hc.value))setTimeout(function(){go.click()},50)}
function start(){fillGate(0);backBtn();setTimeout(watch,2500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
