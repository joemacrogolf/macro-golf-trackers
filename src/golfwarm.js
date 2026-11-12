/* Express 5-minute golf warm-up card for golf practice games and tests.
   Load before videos.js:  <script src="{{BASE}}src/golfwarm.js"></script><script src="{{BASE}}src/videos.js"></script>
   Sits under "How to play". "Done" is remembered for the day across every golf page on this device. */
window.MGV_NOAUTO=true;
/* golf leaderboards live in their own file next to this one */
(function(){var me=document.currentScript;if(!me||!me.src||window.MGBoard)return;var s=document.createElement('script');s.src=me.src.replace(/golfwarm\.js(\?.*)?$/,'leaderboard.js');document.head.appendChild(s)})();
var MGWarm=(function(){
var VID='rxkqwwoq0t',TITLE='Express 5 Minute Golf Warm Up';
/* "How to play" videos from the Practice Games library, by page */
var GAME={'golf-hole-out':['Hole Out','v79x5jmgq4'],'golf-money-stealers':['Money Stealers','03wsak6uxo'],'golf-insanity':['Insanity','583iekejmx'],'golf-fifty-ft-bank':['50ft Bank','fb5shey97s'],'golf-par-18':['Par 18','jiak1zvshi']};
function game(){var s=document.querySelector('script[data-page]');return s&&GAME[s.getAttribute('data-page')]}
function howBtn(){var g=game();return g?'<button type="button" class="mgw-ghost" data-w="game">'+PLAY+'How to play</button>':''}
function today(){var d=new Date(),m=d.getMonth()+1,dd=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(dd<10?'0':'')+dd}
function isDone(){try{return localStorage.getItem('mg-golfwarm')===today()}catch(e){return false}}
function setDone(v){try{if(v)localStorage.setItem('mg-golfwarm',today());else localStorage.removeItem('mg-golfwarm')}catch(e){}}
function watch(){if(window.MGVideo)MGVideo.open(TITLE,VID);else window.open('https://fast.wistia.net/embed/iframe/'+VID,'_blank','noopener')}
var PLAY='<svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>';
/* Putting and short-game pages: no warm-up card, just "How to play" where the game has a video */
var NOWARM={'golf-hole-out':1,'golf-money-stealers':1,'golf-insanity':1,'golf-putting-test':1,'golf-fifty-ft-bank':1,'golf-par-18':1,'golf-wedge-darts':1,'golf-short-game-test':1};
function page(){var s=document.querySelector('script[data-page]');return s?s.getAttribute('data-page'):''}
function paint(card){if(NOWARM[page()]){var g=game();card.querySelector('.mgw-body').innerHTML='<div class="mgw-row"><div class="mgw-t"><b>How to play</b><small>Watch the game explained</small></div><button type="button" class="mgw-y" data-w="game">'+PLAY+'Watch</button></div>';card.classList.add('done');return}
  var d=isDone();card.classList.toggle('done',d);
  card.querySelector('.mgw-body').innerHTML=d?
   '<div class="mgw-row"><span class="mgw-tick" aria-hidden="true">✓</span><div class="mgw-t"><b>Warmed up today</b><small>Express 5-minute golf warm-up</small></div><button type="button" class="mgw-ghost" data-w="watch">Watch again</button>'+howBtn()+'<button type="button" class="mgw-link" data-w="undo">Undo</button></div>':
   '<div class="mgw-k">Before you start</div><div class="mgw-h">Express 5-minute golf warm-up</div><p>Do this before your first ball. It gets your body ready to swing at full speed and helps protect your back.</p>'+
   '<div class="mgw-btns"><button type="button" class="mgw-y" data-w="watch">'+PLAY+'Watch the warm-up</button><button type="button" class="mgw-ghost" data-w="done">Done, I’m warm</button>'+howBtn()+'</div>'}
function css(){if(document.getElementById('mgw-css'))return;var s=document.createElement('style');s.id='mgw-css';s.textContent=[
 '.mgw{background:#0B0B0B;color:#F4F1EA;text-align:left;border-left:6px solid #FFD900;font-family:Inter,system-ui,sans-serif}',
 '.mgw .mgw-body{padding:18px}.mgw.done .mgw-body{padding:12px 14px}',
 '.mgw-k{font-weight:700;font-size:11px;letter-spacing:2.2px;text-transform:uppercase;color:#FFD900}',
 '.mgw-h{font-family:Anton,Impact,sans-serif;text-transform:uppercase;font-size:26px;line-height:1.05;margin-top:6px}',
 '.mgw p{margin:8px 0 0;font-size:14.5px;line-height:1.45;color:#d9d5cb}',
 '.mgw-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}',
 '.mgw button{min-height:46px;padding:0 16px;cursor:pointer;font-family:Anton,Impact,sans-serif;font-size:17px;text-transform:uppercase;display:inline-flex;align-items:center;gap:8px}',
 '.mgw-y{border:0;background:#FFD900;color:#0B0B0B}',
 '.mgw-ghost{border:1px solid rgba(244,241,234,.4);background:transparent;color:#F4F1EA}',
 '.mgw .mgw-link{border:0;background:transparent;color:#9C988C;font:600 13px Inter,system-ui,sans-serif;text-transform:none;padding:0 6px;min-height:44px}',
 '.mgw-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.mgw-tick{width:30px;height:30px;background:#FFD900;color:#0B0B0B;display:flex;align-items:center;justify-content:center;font-weight:800}',
 '.mgw-t{flex:1;min-width:140px}.mgw-t b{display:block;font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;font-size:18px}.mgw-t small{display:block;color:#9C988C;font-size:12.5px;margin-top:2px}',
 '.mgw.done button{min-height:40px;font-size:15px}',
 '.mgw button:focus-visible{outline:3px solid #FFD900;outline-offset:2px}'].join('');document.head.appendChild(s)}
/* In-app browsers (VidApp) and phones: keep floating buttons clear of the browser's bottom toolbar (same rule as review.js) */
function lift(){if(document.getElementById('mgw-lift'))return;var u=navigator.userAgent||'',app=(/iPhone|iPad|iPod/.test(u)&&!/Safari\//.test(u))||/; wv\)/.test(u)||/VidApp/i.test(u)||!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches);if(!app)return;
  document.documentElement.classList.add('mg-inapp');var s=document.createElement('style');s.id='mgw-lift';s.textContent='html.mg-inapp .mgs-pill,html.mg-inapp .ux-pbtab{bottom:calc(78px + env(safe-area-inset-bottom,0px))!important}html.mg-inapp body{padding-bottom:96px}html.mg-inapp .mgv-wrap{padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))!important}';document.head.appendChild(s)}
function init(){lift();var how=document.getElementById('howto');if(!how||document.querySelector('.mgw'))return;if(NOWARM[page()]&&!game())return;css();
  var card=document.createElement('section');card.setAttribute('aria-label','Golf warm-up');var pad=how.classList.contains('pad');
  card.className='mgw'+(pad?' pad':'');card.innerHTML=pad?'<div class="inner"><div class="mgw-body"></div></div>':'<div class="mgw-body"></div>';
  how.parentNode.insertBefore(card,how.nextSibling);paint(card);
  card.addEventListener('click',function(e){var b=e.target.closest('[data-w]');if(!b)return;var w=b.dataset.w;if(w==='watch')watch();else if(w==='game'){var g=game();if(g&&window.MGVideo)MGVideo.open(g[0]+': how to play',g[1])}else if(w==='done'){setDone(true);paint(card)}else if(w==='undo'){setDone(false);paint(card)}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else setTimeout(init,0);
return {watch:watch};
})();
