/* Strokes gained explainer: a 40-second video every player watches once, the first time they open a golf page
   (My Numbers, the Practice Plan, any golf game or test, coach-built golf plans). It can't be skipped the first time:
   "Got it" appears when the video ends. Afterwards MGSGIntro.open() plays it again from the "What is strokes gained?"
   link at the bottom of My Numbers, with a close button.
   Seen = localStorage 'mg-sgintro', or window.S.sgIntro on the player's record (so a new phone doesn't ask again once synced).
   Loaded by golfwarm.js on every golf page, and directly by My Numbers. The video sits next to this file: assets/video/sg-explainer.mp4 */
(function(){
if(window.MGSGIntro)return;
var me=document.currentScript,base=me&&me.src?me.src.replace(/src\/sg-intro\.js(\?.*)?$/,''):'https://cdn.jsdelivr.net/gh/joemacrogolf/macro-golf-trackers@main/';
var VID=base+'assets/video/sg-explainer.mp4',POSTER=base+'assets/video/sg-explainer.jpg';
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function seen(){if(ls('mg-sgintro'))return true;try{return !!(window.S&&window.S.sgIntro)}catch(e){return false}}
function mark(){var d=new Date().toISOString().slice(0,10);ls('mg-sgintro',d);try{if(window.S&&!window.S.sgIntro){window.S.sgIntro=d;if(typeof window.save==='function')window.save()}}catch(e){}}
function css(){if(document.getElementById('mgsi-css'))return;var s=document.createElement('style');s.id='mgsi-css';s.textContent=[
 '#mgsi{position:fixed;inset:0;z-index:90;background:#0B0B0B;color:#F4F1EA;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:calc(14px + env(safe-area-inset-top,0px)) 16px calc(16px + env(safe-area-inset-bottom,0px));font-family:Inter,system-ui,sans-serif}',
 '#mgsi .k{font-weight:700;font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:#FFD900}',
 '#mgsi .v{position:relative;width:min(100%,calc((100vh - 170px) * 0.5625));aspect-ratio:9/16;background:#000;border-left:6px solid #FFD900}',
 '#mgsi video{width:100%;height:100%;display:block;object-fit:cover;background:#000}',
 '#mgsi .play{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(11,11,11,.55);border:0;color:#F4F1EA;cursor:pointer;font:400 26px Anton,Impact,sans-serif;text-transform:uppercase}',
 '#mgsi .play i{width:84px;height:84px;border-radius:50%;background:#FFD900;display:flex;align-items:center;justify-content:center}',
 '#mgsi .play i:after{content:"";margin-left:8px;border-left:30px solid #0B0B0B;border-top:18px solid transparent;border-bottom:18px solid transparent}',
 '#mgsi .bar{width:min(100%,calc((100vh - 170px) * 0.5625));height:4px;background:rgba(244,241,234,.15)}#mgsi .bar b{display:block;height:100%;width:0;background:#FFD900}',
 '#mgsi .btns{display:flex;gap:10px;width:min(100%,calc((100vh - 170px) * 0.5625))}',
 '#mgsi .btns button{flex:1;min-height:52px;border:0;cursor:pointer;font:400 20px Anton,Impact,sans-serif;text-transform:uppercase}',
 '#mgsi .go{background:#FFD900;color:#0B0B0B}#mgsi .again{background:transparent;color:#F4F1EA;border:1px solid rgba(244,241,234,.35)!important;flex:0 0 auto!important;padding:0 16px}',
 '#mgsi .x{position:absolute;top:calc(10px + env(safe-area-inset-top,0px));right:12px;width:44px;height:44px;border:0;background:transparent;color:#F4F1EA;font-size:30px;cursor:pointer}',
 '#mgsi .note{font-size:12.5px;color:#9C988C;min-height:18px;text-align:center}',
 '#mgsi .snd{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);min-height:44px;padding:0 18px;border:0;background:#FFD900;color:#0B0B0B;font:400 18px Anton,Impact,sans-serif;text-transform:uppercase;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.4)}',
 'body.mgsi-on{overflow:hidden}'].join('');document.head.appendChild(s)}
function open(again){if(document.getElementById('mgsi'))return;css();
  var w=document.createElement('div');w.id='mgsi';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');w.setAttribute('aria-label','What is strokes gained?');
  w.innerHTML=(again?'<button type="button" class="x" aria-label="Close">\u00d7</button>':'')+
   '<div class="k">'+(again?'Strokes gained in 40 seconds':'Before you start \u00b7 40 seconds')+'</div>'+
   '<div class="v"><video playsinline webkit-playsinline preload="auto" poster="'+POSTER+'" src="'+VID+'"></video><button type="button" class="play"><i></i>Watch: what is strokes gained?</button><button type="button" class="snd" hidden>Tap for sound</button></div>'+
   '<div class="bar"><b></b></div><div class="btns"><button type="button" class="go" hidden>Got it</button><button type="button" class="again" hidden>Watch again</button></div><div class="note"></div>';
  document.body.appendChild(w);document.body.classList.add('mgsi-on');
  var v=w.querySelector('video'),pl=w.querySelector('.play'),go=w.querySelector('.go'),ag=w.querySelector('.again'),bar=w.querySelector('.bar b'),note=w.querySelector('.note'),far=0;
  function close(){try{v.pause()}catch(e){}w.remove();document.body.classList.remove('mgsi-on')}
  function finish(){mark();go.hidden=false;ag.hidden=false;note.textContent='You can watch it again any time at the bottom of My Numbers.'}
  function start(){pl.hidden=true;v.muted=false;snd.hidden=true;var p=v.play();if(p&&p.catch)p.catch(function(){v.muted=true;snd.hidden=false;v.play().catch(function(){snd.hidden=true;pl.hidden=false})})}
  var snd=w.querySelector('.snd');snd.addEventListener('click',function(){v.muted=false;snd.hidden=true;v.play().catch(function(){})});
  pl.addEventListener('click',start);
  /* first time: it starts on its own straight away (with sound where the phone allows it, otherwise muted with a 'Tap for sound' button) */
  if(!again)setTimeout(start,250);
  v.addEventListener('timeupdate',function(){if(v.duration)bar.style.width=(v.currentTime/v.duration*100)+'%';
    /* no skipping ahead the first time: jumping forward goes back to the furthest point watched */
    if(!again&&v.currentTime>far+1.5)v.currentTime=far;else far=Math.max(far,v.currentTime)});
  v.addEventListener('ended',finish);
  /* if the video can't load (no signal), don't lock the player out */
  v.addEventListener('error',function(){note.textContent='The video could not load. You can watch it later at the bottom of My Numbers.';go.hidden=false});
  go.addEventListener('click',close);ag.addEventListener('click',function(){v.currentTime=0;far=0;go.hidden=!seen();start()});
  var x=w.querySelector('.x');if(x)x.addEventListener('click',close)}
function auto(tries){if(seen())return;/* wait briefly for the cloud record, which may say it was watched on another phone */
  if(tries<8&&window.MGSync&&!(window.S&&typeof window.S==='object')){setTimeout(function(){auto(tries+1)},400);return}setTimeout(function(){if(!seen())open(false)},window.MGSync?1200:300)}
window.MGSGIntro={open:function(){open(true)},seen:seen,url:VID};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){auto(0)});else auto(0);
})();
