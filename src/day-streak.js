/* Day streak: how many days in a row this player has opened Macro Golf (any page that loads this script counts).
   Shows a slim bar at the top of the page: flame, "5-day streak", this week's days, best streak.
   Milestones (3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365 days) get a short celebration once.
   Days live in localStorage 'mg-days' (shared by every www.macro.golf page in the app), and are copied to
   window.S.appDays when the page has a cloud record, so a new phone picks them up after sign-in.
   Loaded by golfwarm.js (games and tests) and directly by My Numbers, the Practice Plan, On-Course Games and coach golf plans.
   Any other page can add it with one tag: <script src="{{BASE}}src/day-streak.js"></script>  (no sign-in needed). */
(function(){
if(window.MGDays)return;
/* nudges.js (personal nudge card under this bar) comes from the same place as this script */
try{var me=document.currentScript&&document.currentScript.src;if(me&&!window.MGNudges&&!document.querySelector('script[src*="src/nudges.js"]')){var ns=document.createElement('script');ns.src=me.replace(/day-streak\.js(\?.*)?$/,'nudges.js');ns.defer=true;document.head.appendChild(ns)}}catch(e){}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function today(){return iso(new Date())}
function shift(s,n){var p=s.split('-'),d=new Date(+p[0],+p[1]-1,+p[2],12);d.setDate(d.getDate()+n);return iso(d)}
function days(){var a=[];try{a=JSON.parse(ls('mg-days')||'[]')}catch(e){}return Array.isArray(a)?a.filter(function(x){return /^\d{4}-\d{2}-\d{2}$/.test(x)}):[]}
function put(a){a=a.filter(function(x,i){return a.indexOf(x)===i}).sort().slice(-400);ls('mg-days',JSON.stringify(a));return a}
/* merge in days saved on the player's cloud record, and copy ours back */
function sync(){try{var S=window.S;if(!S||typeof S!=='object')return;var mine=days(),cloud=Array.isArray(S.appDays)?S.appDays:[],all=put(mine.concat(cloud));
  if(all.length!==cloud.length){S.appDays=all.slice(-120);if(typeof window.save==='function')window.save()}}catch(e){}}
function mark(){var a=days(),t=today();if(a.indexOf(t)<0){a.push(t);a=put(a)}return a}
function streak(a){var set={};a.forEach(function(x){set[x]=1});var t=today(),n=0,d=t;while(set[d]){n++;d=shift(d,-1)}return n}
function best(a){var s=a.slice().sort(),b=0,run=0,prev=null;s.forEach(function(x){run=prev&&shift(prev,1)===x?run+1:1;b=Math.max(b,run);prev=x});return b}
var MS=[3,7,14,21,30,50,75,100,150,200,365];
var FLAME='<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 2c1 3.5 5 6 5 11a5 5 0 0 1-10 0c0-2.2 1-3.8 2.4-5 .1 1.6.8 2.8 2 3.4C11 8.6 11.2 5 12 2z" fill="#FFD900"/><path d="M12 13c.6 1.4 2 2.2 2 4a2 2 0 0 1-4 0c0-1.3.9-2.2 2-4z" fill="#0B0B0B"/></svg>';
function css(){if(document.getElementById('mgd-css'))return;var s=document.createElement('style');s.id='mgd-css';s.textContent=[
 '.mgd{display:flex;align-items:center;gap:10px;padding:10px max(14px,env(safe-area-inset-right,0px)) 10px max(14px,env(safe-area-inset-left,0px));background:#0B0B0B;color:#F4F1EA;border-bottom:3px solid #FFD900;font-family:Inter,system-ui,sans-serif;box-sizing:border-box;width:100%}',
 '.mgd svg{flex:0 0 auto}.mgd.on svg{animation:mgdFlick 1.8s ease-in-out infinite}',
 '.mgd-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}',
 '.mgd-t b{font:400 20px/1.05 Anton,Impact,sans-serif;text-transform:uppercase;color:#FFD900;letter-spacing:.2px}',
 '.mgd-t span{font-size:12px;line-height:1.3;color:#9C988C}',
 '.mgd-w{display:flex;gap:3px;flex:0 0 auto}',
 '.mgd-w i{width:16px;height:26px;display:flex;align-items:flex-end;justify-content:center;font:700 9px Inter,system-ui,sans-serif;font-style:normal;color:#77715F;border-bottom:4px solid #2a2925;padding-bottom:2px;box-sizing:border-box}',
 '.mgd-w i.y{color:#F4F1EA;border-bottom-color:#FFD900}.mgd-w i.t{color:#FFD900}',
 '.mgd-pop{position:fixed;left:50%;top:calc(18px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:96;width:min(420px,calc(100vw - 24px));display:flex;align-items:center;gap:14px;padding:16px;background:linear-gradient(135deg,#fff1a0,#FFD900 45%,#c9a400);color:#0B0B0B;box-shadow:0 14px 40px rgba(0,0,0,.45);font-family:Inter,system-ui,sans-serif;animation:mgdPop .6s cubic-bezier(.2,1.6,.4,1) both;cursor:pointer}',
 '.mgd-pop .n{flex:0 0 auto;width:64px;height:64px;border-radius:50%;background:#0B0B0B;color:#FFD900;display:flex;align-items:center;justify-content:center;font:400 30px Anton,Impact,sans-serif}',
 '.mgd-pop b{display:block;font:400 24px/1.05 Anton,Impact,sans-serif;text-transform:uppercase}.mgd-pop span{font-size:13.5px;font-weight:600}',
 '@keyframes mgdFlick{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.08) rotate(-3deg)}}',
 '@keyframes mgdPop{0%{transform:translate(-50%,-30px) scale(.7);opacity:0}100%{transform:translate(-50%,0) scale(1);opacity:1}}',
 '@media (prefers-reduced-motion:reduce){.mgd svg,.mgd-pop{animation:none!important}}'].join('');document.head.appendChild(s)}
function week(a){var set={};a.forEach(function(x){set[x]=1});var t=today(),p=t.split('-'),d=new Date(+p[0],+p[1]-1,+p[2],12),k=(d.getDay()+6)%7,mon=shift(t,-k),L='MTWTFSS',h='';
  for(var i=0;i<7;i++){var x=shift(mon,i);h+='<i class="'+(set[x]?'y':'')+(x===t?' t':'')+'">'+L[i]+'</i>'}return h}
function line(n,b){if(n<=1)return b>1?'Back again. Best: '+b+' days':'Come back tomorrow';
  return n>=b?'Your best ever. See you tomorrow':'Best: '+b+' days'}
function paint(){var a=days(),n=streak(a),b=best(a),bar=document.querySelector('.mgd');if(!bar)return;
  bar.classList.toggle('on',n>1);bar.innerHTML=FLAME+'<div class="mgd-t"><b>'+n+'-day streak</b><span>'+line(n,b)+'</span></div><div class="mgd-w" aria-label="Days opened this week">'+week(a)+'</div>'}
function bar(tries){var root=document.getElementById('mg-root');
  if(!root||!root.firstElementChild){if(tries<30)setTimeout(function(){bar(tries+1)},200);return}
  if(document.querySelector('.mgd')||document.documentElement.hasAttribute('data-mgd-off'))return;css();
  var b=document.createElement('div');b.className='mgd';b.setAttribute('role','status');root.insertBefore(b,root.firstChild);paint();cele();watch(root)}
/* front doors (My Plan, My Training, My Practice) replace the page with the plan they open: put the bar back on top */
var obs=null;function watch(root){if(obs||!window.MutationObserver)return;obs=new MutationObserver(function(){if(document.querySelector('.mgd'))return;var r=document.getElementById('mg-root');
  if(r&&r.firstElementChild){var b=document.createElement('div');b.className='mgd';b.setAttribute('role','status');r.insertBefore(b,r.firstChild);paint()}});
  obs.observe(root,{childList:true})}
function cele(){var a=days(),n=streak(a);if(MS.indexOf(n)<0||ls('mg-days-cele')===today()+':'+n)return;ls('mg-days-cele',today()+':'+n);
  setTimeout(function(){if(document.getElementById('mgsi'))return;css();var d=document.createElement('div');d.className='mgd-pop';d.setAttribute('role','status');
    d.innerHTML='<div class="n">'+n+'</div><div><b>'+n+'-day streak!</b><span>'+(n>=30?'That is serious commitment. Keep it alive.':'You have opened Macro Golf '+n+' days in a row. Keep it going.')+'</span></div>';
    d.addEventListener('click',function(){d.remove()});document.body.appendChild(d);try{if(navigator.vibrate)navigator.vibrate([40,40,120])}catch(e){}
    setTimeout(function(){if(d.parentNode)d.remove()},6000)},900)}
mark();
function start(){bar(0);/* the cloud record arrives a little after the page */var k=0,iv=setInterval(function(){sync();paint();if(++k>8)clearInterval(iv)},1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.MGDays={days:days,streak:function(){return streak(days())},best:function(){return best(days())}};
})();
