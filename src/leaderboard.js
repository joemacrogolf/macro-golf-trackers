/* Golf leaderboards: Monthly and All time, one board per game.
   Loaded by golfwarm.js on golf pages that expose window.MG_SCORE (see CLAUDE.md).
   Reads the public, read-only mg_leaderboard database function (supabase/004-leaderboard.sql):
   it only ever returns "First L." names, scores and dates. Clients can hide themselves (S._lbHide,
   sent as _mgSummary.lbHide by sync.js). */
(function(){
if(window.MGBoard)return;
var URL='https://zhcgwtlyqriwlhbzkxcl.supabase.co/rest/v1/rpc/mg_leaderboard',APIKEY='sb_publishable__IBhmrVHOXsLHruU7XJB-g_OSN9Ljne';
var view='month',cache={};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function score(){try{return typeof window.MG_SCORE==='function'?window.MG_SCORE():null}catch(e){return null}}
function game(){var s=score();if(s&&s.game)return s.game;var t=document.querySelector('script[data-page]');return t?t.getAttribute('data-page'):''}
var NAMES={'golf-hole-out':'Hole Out','golf-wedge-darts':'Wedge Darts','golf-money-stealers':'Money Stealers','golf-left-is-lava':'Lava','golf-par-18':'Par 18','golf-insanity':'Insanity','golf-three-strikes':'3 Strikes','golf-fifty-ft-bank':'50ft Bank','golf-driver-corridor':'Driver Corridor','golf-putting-test':'Putting Test','golf-short-game-test':'Short Game Test','golf-long-game-test':'Long Game Test'};
function gameName(){var g=game();return NAMES[g]||g.replace(/^golf-/,'').replace(/-/g,' ')}
function myCode(){try{var c=JSON.parse(localStorage.getItem('mgsync:'+(typeof KEY!=='undefined'?KEY:''))||'null');return c&&c.code||null}catch(e){return null}}
function hidden(){return !!(window.S&&S._lbHide)}
function fmt(v,unit){var n=Number(v);if(!isFinite(n))return '–';
  if(unit==='hc')return n<0?'+'+Math.abs(n):String(n);
  if(unit==='SG')return (n>0?'+':'')+n.toFixed(2)+' SG';
  var r=Math.round(n*10)/10;return r+(unit?' '+unit:'')}
function nice(d){var p=String(d||'').split('-');if(p.length<3)return '';return new Date(+p[0],+p[1]-1,+p[2],12).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
function load(period){var k=game()+'|'+period;if(cache[k]&&Date.now()-cache[k].t<30000)return Promise.resolve(cache[k].v);
  return fetch(URL,{method:'POST',headers:{apikey:APIKEY,'Content-Type':'application/json'},body:JSON.stringify({p_game:game(),p_period:period,p_me:myCode()})})
    .then(function(r){return r.json()}).then(function(j){if(!j||j.error||j.message)throw new Error((j&&(j.error||j.message))||'error');cache[k]={t:Date.now(),v:j};return j})}

function open(){close();var o=document.createElement('div');o.className='lb-wrap';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Leaderboard');
  o.innerHTML='<div class="lb-in"><div class="lb-top"><div><div class="lb-k">Leaderboard</div><div class="lb-h">'+esc(gameName())+'</div></div><button type="button" class="lb-x" data-x>Close</button></div>'+
   '<div class="lb-seg" role="tablist"><button type="button" role="tab" data-p="month">This month</button><button type="button" role="tab" data-p="all">All time</button></div>'+
   '<div class="lb-list" aria-live="polite"></div><div class="lb-foot"></div></div>';
  document.body.appendChild(o);document.documentElement.classList.add('lb-lock');
  o.addEventListener('click',function(e){var b=e.target.closest('button');if(e.target===o||(b&&b.hasAttribute('data-x')))return close();if(!b)return;
    if(b.dataset.p){view=b.dataset.p;paint()}else if(b.dataset.h){setHide(b.dataset.h==='1');paint(true)}});
  o.addEventListener('keydown',function(e){if(e.key==='Escape')close()});o.querySelector('[data-x]').focus();paint()}
function close(){var o=document.querySelector('.lb-wrap');if(o)o.remove();document.documentElement.classList.remove('lb-lock')}
function setHide(v){if(!window.S)return;S._lbHide=v;try{if(typeof save==='function')save()}catch(e){}cache={}}
function paint(soft){var o=document.querySelector('.lb-wrap');if(!o)return;var list=o.querySelector('.lb-list'),foot=o.querySelector('.lb-foot');
  [].forEach.call(o.querySelectorAll('[data-p]'),function(b){b.setAttribute('aria-selected',String(b.dataset.p===view))});
  if(!soft)list.innerHTML='<p class="lb-msg">Loading…</p>';
  var signed=!!myCode(),mine=score();
  foot.innerHTML=(!signed?'<p>Sign in with your PIN (the Cloud save button) to appear on the board.</p>':
    hidden()?'<p>You are hidden from leaderboards.</p><button type="button" class="lb-ghost" data-h="0">Show me</button>':
    '<p>Your name shows as first name and initial.</p><button type="button" class="lb-ghost" data-h="1">Hide me from leaderboards</button>')+
    (signed?'<p class="lb-small">Changes show on the board after your next save.</p>':'');
  load(view).then(function(j){var rows=j.rows||[];
    if(!rows.length){list.innerHTML='<p class="lb-msg">No scores yet '+(view==='month'?'this month':'')+'. Finish a round to be first on the board.</p>';return}
    list.innerHTML='<ol class="lb-rows">'+rows.map(function(r,i){return '<li class="'+(r.me?'me':'')+(i<3?' top':'')+'"><span class="lb-rank">'+(i+1)+'</span><span class="lb-name">'+esc(r.n)+(r.me?' <em>you</em>':'')+'</span><span class="lb-date">'+esc(nice(r.d))+'</span><b class="lb-score">'+esc(fmt(r.s,j.unit))+'</b></li>'}).join('')+'</ol>'+
      '<p class="lb-small">'+(j.unit==='hc'?'Scores are handicaps (+ is a plus handicap). ':j.unit==='SG'?'Scores are strokes gained off the tee. ':'')+(j.better==='low'?'Lowest':'Highest')+' score wins · best finished round per player</p>'})
  .catch(function(){list.innerHTML='<p class="lb-msg">Could not load the leaderboard. Check your connection and try again.</p>'})}

function tab(){if(document.querySelector('.lb-tab'))return;var b=document.createElement('button');b.type='button';b.className='lb-tab';b.setAttribute('aria-label','Leaderboard');
  b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20V11h4v9M10 20V5h4v15M16 20v-6h4v6" stroke="currentColor" stroke-width="2.2"/></svg>Leaders';
  b.addEventListener('click',open);document.body.appendChild(b);place();var n=0,iv=setInterval(function(){place();if(++n>12)clearInterval(iv)},800);window.addEventListener('resize',place)}
function place(){var b=document.querySelector('.lb-tab'),pb=document.querySelector('.ux-pbtab');if(!b)return;var w=pb?Math.round(pb.getBoundingClientRect().width):0;b.style.minWidth=w?w+'px':'';b.style.justifyContent='center'}
function css(){var s=document.createElement('style');s.textContent=[
 '.lb-tab{position:fixed;right:max(10px,env(safe-area-inset-right,0px));bottom:calc(62px + env(safe-area-inset-bottom,0px));z-index:37;display:inline-flex;align-items:center;gap:6px;min-height:42px;padding:0 12px;border:0;border-top:3px solid #FFD900;background:#0B0B0B;color:#F4F1EA;font-family:Anton,Impact,sans-serif;font-size:15px;text-transform:uppercase;letter-spacing:.3px;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.35)}',
 '.lb-tab svg{color:#FFD900}.lb-tab:focus-visible,.lb-wrap button:focus-visible{outline:3px solid #FFD900;outline-offset:2px}',
 'html.mg-inapp .lb-tab{bottom:calc(130px + env(safe-area-inset-bottom,0px))!important}',
 'html.lb-lock,html.lb-lock body{overflow:hidden}',
 '.lb-wrap{position:fixed;inset:0;z-index:62;background:rgba(11,11,11,.97);overflow-y:auto;padding:calc(16px + env(safe-area-inset-top,0px)) max(14px,env(safe-area-inset-right,0px)) calc(90px + env(safe-area-inset-bottom,0px)) max(14px,env(safe-area-inset-left,0px));font-family:Inter,system-ui,sans-serif;color:#F4F1EA}',
 '.lb-in{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:14px}',
 '.lb-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.lb-k{font-weight:700;font-size:11px;letter-spacing:2.2px;text-transform:uppercase;color:#FFD900}',
 '.lb-h{font-family:Anton,Impact,sans-serif;text-transform:uppercase;font-size:30px;line-height:1.02;margin-top:4px}',
 '.lb-x{flex-shrink:0;min-height:44px;padding:0 16px;background:transparent;border:1px solid rgba(244,241,234,.35);color:#F4F1EA;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}',
 '.lb-seg{display:flex;border:1px solid rgba(244,241,234,.3)}.lb-seg button{flex:1;min-height:46px;border:0;background:transparent;color:#F4F1EA;font-family:Anton,Impact,sans-serif;font-size:18px;text-transform:uppercase;cursor:pointer}.lb-seg button[aria-selected=true]{background:#FFD900;color:#0B0B0B}',
 '.lb-rows{list-style:none;margin:0;padding:0;border-top:1px solid rgba(244,241,234,.15)}',
 '.lb-rows li{display:grid;grid-template-columns:40px 1fr auto auto;align-items:center;gap:10px;padding:12px 4px;border-bottom:1px solid rgba(244,241,234,.12)}',
 '.lb-rank{font-family:Anton,Impact,sans-serif;font-size:20px;color:#9C988C;text-align:center}.lb-rows li.top .lb-rank{color:#FFD900}',
 '.lb-name{font-weight:600;font-size:16px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lb-name em{font-style:normal;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;background:#FFD900;color:#0B0B0B;padding:2px 6px;margin-left:6px}',
 '.lb-date{font-size:12.5px;color:#9C988C}.lb-score{font-family:Anton,Impact,sans-serif;font-weight:400;font-size:20px;color:#F4F1EA;text-align:right;min-width:64px}',
 '.lb-rows li.me{background:rgba(255,217,0,.1)}',
 '.lb-msg{color:#cfcabd;margin:6px 0}.lb-small{color:#9C988C;font-size:12.5px;margin:8px 0 0}',
 '.lb-foot{border-top:1px solid rgba(244,241,234,.15);padding-top:12px;display:flex;flex-direction:column;gap:8px;align-items:flex-start}.lb-foot p{margin:0;color:#cfcabd;font-size:14px}',
 '.lb-ghost{min-height:44px;padding:0 14px;border:1px solid rgba(244,241,234,.4);background:transparent;color:#F4F1EA;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}'].join('');document.head.appendChild(s)}
function init(){var g=game();if(!/^golf-/.test(g)||g==='golf-paul-goddard'||typeof window.MG_SCORE!=='function')return;css();tab()}
window.MGBoard={open:open};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else setTimeout(init,0);
})();
