/* Macro Golf tracker cloud sync.
   Usage (after the tracker script):  MGSync.init({code:'836790'})            // personal page
                                      MGSync.init({plan:'pure-power-gym', planName:'Pure Power (gym)'})  // Pure plan: client signs in with email + PIN
                                      MGSync.init({plan:'golf-hole-out', planName:'Hole Out', group:'golf'})  // group: one sign-in covers every page in the group
                                      MGSync.init({plan:'golf-paul-goddard', planName:'…', fixedName:'Paul Goddard'})  // one-person plan: no name box at sign-in
   My Plan (pages/my-plan.html) signs 1-to-1 pages in by leaving {code,pin,t} in localStorage 'mgsync-handoff' (used once, 10 minutes).
   Needs the tracker's globals: S (state), KEY (localStorage key), save().
   group (optional): pages sharing a group remember the email + PIN once per device, so the next page in the
   group signs in by itself. Each page still keeps its own data (its own code). Pages without group are unchanged. */
var MGSync=(function(){
var URL='https://zhcgwtlyqriwlhbzkxcl.supabase.co/rest/v1/rpc/',APIKEY='sb_publishable__IBhmrVHOXsLHruU7XJB-g_OSN9Ljne';
var CFG={},CK,cred=null,timer=null,busy=false,pill=null,state='off',origSave=null,started=false;
function $q(s,r){return (r||document).querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}}
function getCred(){try{return JSON.parse(ls(CK)||'null')}catch(e){return null}}
function setCred(c){cred=c;ls(CK,c?JSON.stringify(c):null)}
function rpc(name,body){return fetch(URL+name,{method:'POST',headers:{apikey:APIKEY,'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){
  return r.text().then(function(t){var j=null;try{j=JSON.parse(t)}catch(e){}if(!r.ok||(j&&j.error)){var err=new Error((j&&(j.error||j.message))||('HTTP '+r.status));err.server=true;throw err}return j})})}
/* ---------- My Plan hand-off: pages/my-plan.html has already checked email + PIN and leaves the code + PIN here ---------- */
function handoff(){if(!CFG.code)return null;var h=null;try{h=JSON.parse(ls('mgsync-handoff')||'null')}catch(e){}ls('mgsync-handoff',null);
  return h&&String(h.code)===String(CFG.code)&&h.pin&&Date.now()-(+h.t||0)<6e5?h:null}
function signInWith(h){setPill('saving');rpc('mg_load',{p_code:String(CFG.code),p_pin:h.pin,p_name:CFG.name||null,p_plan:CFG.planName||CFG.plan||null}).then(function(r){
  setCred({code:String(CFG.code),pin:h.pin,name:CFG.name||null,base:0});ls('mgsync-skip:'+KEY,null);if(!reconcile(r&&r.data))setPill('ok')}).catch(function(e){if(e&&e.server)gate(e.message);else setPill('offline')})}
/* ---------- group sign-in (opt-in via CFG.group) ---------- */
function setGroup(g){if(!CFG.group||!CFG.plan||CFG.code)return;ls('mgsync-group:'+CFG.group,g?JSON.stringify(g):null)}
function getGroup(){if(!CFG.group||!CFG.plan||CFG.code)return null;try{return JSON.parse(ls('mgsync-group:'+CFG.group)||'null')}catch(e){return null}}
function autoSignIn(g){var code='pure:'+CFG.plan+':'+g.em;setPill('saving');
  rpc('mg_load',{p_code:code,p_pin:g.pin,p_name:g.name||null,p_plan:CFG.planName||CFG.plan||null}).then(function(r){setCred({code:code,pin:g.pin,name:g.name||null,base:0});
    if(g.name)ls('mgsync-pname:'+KEY,g.name);if(!reconcile(r&&r.data)){setPill('ok');applyName()}})
  .catch(function(err){if(err&&err.server){setPill('pin');gate(/Wrong PIN/i.test(err.message)?'This game has a different PIN. Enter it to sign in.':err.message)}else setPill('offline')})}
function stamp(){return (window.S&&window.S._mgT)||0}

/* ---------- merge: keep everything from both sides, newer side wins on plain values ---------- */
function isObj(x){return x&&typeof x==='object'&&!Array.isArray(x)}
function merge(a,b,aNewer){ // a = local, b = remote
  if(isObj(a)&&isObj(b)){var o={};Object.keys(b).forEach(function(k){o[k]=b[k]});Object.keys(a).forEach(function(k){o[k]=(k in b)?merge(a[k],b[k],aNewer):a[k]});return o}
  if(Array.isArray(a)&&Array.isArray(b)){if(!a.some(isObj)&&!b.some(isObj))return aNewer?a:b;
    var seen={},out=[];function key(x){return isObj(x)&&(x.id||x.date&&x.workout!=null&&(x.date+'|'+x.workout+'|'+(x.t||x.start||'')))||JSON.stringify(x)}
    b.concat(a).forEach(function(x){var k=key(x);if(seen[k]==null){seen[k]=out.length;out.push(x)}else if(aNewer&&a.indexOf(x)>-1)out[seen[k]]=x});return out}
  return aNewer?a:b}

/* ---------- summary for the coach dashboard ---------- */
function summary(){var S=window.S||{},dates=[];
  if(S.finished&&typeof S.finished==='object')Object.keys(S.finished).forEach(function(k){var d=S.finished[k];if(typeof d==='string')dates.push(d.slice(0,10))});
  if(Array.isArray(S.history))S.history.forEach(function(h){if(h&&h.date)dates.push(String(h.date).slice(0,10))});
  dates.sort();var bests=[];
  try{if(window.UX&&UX.points){var P=UX.points(),top={},first={};
    P.forEach(function(p){var b=top[p.id];if(!b||p.w>b.w||(p.w===b.w&&p.r>b.r))top[p.id]=p;if(!first[p.id]||p.date<first[p.id].date||(p.date===first[p.id].date&&p.w>first[p.id].w))first[p.id]=p});
    bests=Object.keys(top).map(function(id){var b=top[id];return {n:b.name,w:b.w,r:b.r,u:b.u,d:b.date,gain:+(b.w-first[id].w).toFixed(1)}}).sort(function(a,b){return b.gain-a.gain||a.n.localeCompare(b.n)}).slice(0,12)}}catch(e){}
  return {sessions:dates.length,last:dates[dates.length-1]||null,dates:dates.slice(-60),bests:bests,player:CFG.fixedName||S.player||S.name||'',lbHide:!!S._lbHide,page:CFG.planName||document.title,golf:(typeof window.MG_SCORE==='function' ? (function(){try{return window.MG_SCORE()}catch(e){return null}})() : null)}}

/* ---------- push / pull ---------- */
function payload(){var d=JSON.parse(JSON.stringify(window.S||{}));d._mgSummary=summary();return d}
function push(){if(!cred||busy)return;clearTimeout(timer);busy=true;var t=stamp();setPill('saving');
  rpc('mg_save',{p_code:cred.code,p_pin:cred.pin,p_data:payload()}).then(function(){cred.base=t;setCred(cred);busy=false;setPill(stamp()>t?'saving':'ok');if(stamp()>t)schedule(400)})
  .catch(function(e){busy=false;fail(e)})}
function schedule(ms){if(!cred)return;clearTimeout(timer);timer=setTimeout(push,ms==null?1500:ms)}
function fail(e){if(e&&e.server&&/PIN|Unknown|tries/i.test(e.message)){setPill('pin');if(/Wrong PIN/i.test(e.message)){setCred(null);gate('Your PIN changed on another device. Enter it again.')}else if(/tries/i.test(e.message))gate(e.message);return}
  setPill('offline')}
function adopt(remote){try{ls(KEY,JSON.stringify(remote));ls('mgsync-reload',String(Date.now()))}catch(e){}location.reload()}
function reconcile(remote){ // returns true if page is reloading
  var local=window.S||{},lt=local._mgT||0,rt=(remote&&remote._mgT)||0,base=cred.base||0,dirty=lt>base;
  if(!remote||!Object.keys(remote).length){schedule(0);return false}
  delete remote._mgSummary;
  if(rt===lt){cred.base=lt;setCred(cred);setPill('ok');return false}
  if(!dirty&&rt>lt){if(recentlyReloaded())return false;adopt(remote);return true}
  if(dirty&&rt<=base){schedule(0);return false}
  // both changed: merge, keep newest plain values
  var m=merge(local,remote,lt>=rt);m._mgT=Math.max(lt,rt)+1;cred.base=0;setCred(cred);if(recentlyReloaded()){Object.assign(window.S,m);origSave&&origSave();schedule(0);return false}
  ls(KEY,JSON.stringify(m));ls('mgsync-reload',String(Date.now()));location.reload();return true}
function recentlyReloaded(){var t=+ls('mgsync-reload')||0;return Date.now()-t<8000}
function pull(){if(!cred||busy)return Promise.resolve();setPill('saving');
  return rpc('mg_load',{p_code:cred.code,p_pin:cred.pin,p_name:cred.name||null,p_plan:CFG.planName||CFG.plan||null}).then(function(r){
    var a=document.activeElement;if(a&&/INPUT|SELECT|TEXTAREA/.test(a.tagName)&&(window.S._mgT||0)>(cred.base||0)){schedule(0);return}
    reconcile(r&&r.data)}).catch(fail)}

/* ---------- PIN screen ---------- */
function gate(msg){if($q('.mgs-gate'))return;var pure=!!CFG.plan&&!CFG.code,g=document.createElement('div');g.className='mgs-gate';g.setAttribute('role','dialog');g.setAttribute('aria-label','Save your progress');
  g.innerHTML='<form class="mgs-gin"><div class="mgs-gk">Save your progress</div><div class="mgs-gh">'+(pure?'Sign in to keep your training safe':'Set your PIN')+'</div><div class="mgs-gbar"></div>'+
   '<p class="mgs-gp">'+(pure?'Use the same email and PIN on any phone or computer and your logs follow you.':'Pick a 4-digit PIN. Use it on any phone or computer and your training follows you. If you have already set one, enter it.')+'</p>'+
   (pure?(CFG.fixedName?'<input type="hidden" name="pname">':'<label class="mgs-gl">Your name<input name="pname" autocomplete="name" maxlength="60" placeholder="First and last name"></label>')+'<label class="mgs-gl">Email<input name="email" type="email" autocomplete="email" required></label>':'')+
   '<label class="mgs-gl">PIN<input name="pin" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" autocomplete="off" required placeholder="4 digits"></label>'+
   '<p class="mgs-gerr" role="alert">'+esc(msg||'')+'</p><button class="mgs-gy" type="submit">Save to cloud</button><button class="mgs-gn" type="button">Not now</button></form>';
  document.body.appendChild(g);var f=$q('form',g),pin=f.pin;var nm=f.elements['pname'];if(nm){var cur=document.getElementById('player');if(CFG.fixedName)nm.value=CFG.fixedName;else if(cur&&cur.value)nm.value=cur.value}setTimeout(function(){(nm&&!nm.value&&nm.type!=='hidden'?nm:(pure?f.elements['email']:pin)).focus()},50);
  $q('.mgs-gn',g).addEventListener('click',function(){ls('mgsync-skip:'+KEY,String(Date.now()));g.remove();setPill('off')});
  f.addEventListener('submit',function(e){e.preventDefault();var p=String(pin.value).replace(/\D/g,'');if(p.length<4){$q('.mgs-gerr',g).textContent='PIN must be at least 4 digits.';return}
    var code=CFG.code,name=CFG.name||null,em=null;if(pure){em=String(f.email.value).trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){$q('.mgs-gerr',g).textContent='Check your email address.';return}code='pure:'+CFG.plan+':'+em;name=String(f.elements['pname'].value).trim()||null}
    var btn=$q('.mgs-gy',g);btn.disabled=true;btn.textContent='Checking\u2026';
    rpc('mg_load',{p_code:code,p_pin:p,p_name:name,p_plan:CFG.planName||CFG.plan||null}).then(function(r){setCred({code:code,pin:p,name:name,base:0});if(pure)setGroup({em:em,pin:p,name:name});ls('mgsync-skip:'+KEY,null);g.remove();if(name)ls('mgsync-pname:'+KEY,name);if(!reconcile(r&&r.data)){setPill('ok');applyName()}})
    .catch(function(err){btn.disabled=false;btn.textContent='Save to cloud';$q('.mgs-gerr',g).textContent=err.server?(/Wrong PIN/.test(err.message)?'That PIN does not match. Try again.':err.message):'No connection. Try again when you are online.'})})}

/* fill the tracker's own name box from the sign-in, so clients only type it once */
function applyName(){var n=ls('mgsync-pname:'+KEY);if(!n)return;var el=document.getElementById('player');
  if(el&&!el.value){el.value=n;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('blur'))}
  else if(!el&&window.S&&'player' in window.S&&!window.S.player){window.S.player=n;window.save()}
  ls('mgsync-pname:'+KEY,null)}

/* ---------- status pill ---------- */
var LBL={ok:'Saved to cloud',saving:'Saving\u2026',offline:'Offline \u00b7 will sync',pin:'PIN needed',off:'Cloud save off'};
function setPill(s){state=s;if(!pill){pill=document.createElement('button');pill.type='button';pill.className='mgs-pill';document.body.appendChild(pill);pill.addEventListener('click',menu)}
  pill.dataset.s=s;pill.innerHTML='<i></i>'+LBL[s];pill.setAttribute('aria-label','Cloud save: '+LBL[s])}
function menu(){if(!cred){ls('mgsync-skip:'+KEY,null);gate();return}if(state==='offline'){push();return}
  var who=cred.code.indexOf('pure:')===0?cred.code.split(':').slice(2).join(':'):'page '+cred.code;
  if(confirmBox('Saved to cloud as '+who+'. Sign out on this device? Your logs stay saved in the cloud.'))return}
function confirmBox(text){if($q('.mgs-gate'))return;var g=document.createElement('div');g.className='mgs-gate';g.innerHTML='<div class="mgs-gin"><div class="mgs-gk">Cloud save</div><p class="mgs-gp">'+esc(text)+'</p><button class="mgs-gy" type="button" data-x="sync">Sync now</button><button class="mgs-gn" type="button" data-x="out">Sign out on this device</button><button class="mgs-gn" type="button" data-x="close">Close</button></div>';
  document.body.appendChild(g);g.addEventListener('click',function(e){var b=e.target.closest('[data-x]');if(!b)return;g.remove();if(b.dataset.x==='sync')pull();if(b.dataset.x==='out'){setCred(null);setGroup(null);setPill('off')}});return true}

function css(){if($q('#mgs-sync-css'))return;var s=document.createElement('style');s.id='mgs-sync-css';s.textContent=
 '.mgs-pill{position:fixed;left:max(10px,env(safe-area-inset-left,0px));bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:38;display:inline-flex;align-items:center;gap:7px;min-height:32px;padding:0 11px;border:0;background:#0B0B0B;color:#F4F1EA;font:600 11.5px/1 Inter,system-ui,sans-serif;letter-spacing:.4px;cursor:pointer;opacity:.92}'+
 '.mgs-pill i{width:8px;height:8px;border-radius:50%;background:#7CC77C}.mgs-pill[data-s=saving] i{background:#FFD900}.mgs-pill[data-s=offline] i,.mgs-pill[data-s=pin] i{background:#E8833A}.mgs-pill[data-s=off] i{background:#7a766c}'+
 '.mgs-gate{position:fixed;inset:0;z-index:70;background:#0B0B0B;display:flex;justify-content:center;align-items:flex-start;overflow-y:auto;padding:calc(28px + env(safe-area-inset-top,0px)) 16px 24px}'+
 '.mgs-gin{width:100%;max-width:420px;display:flex;flex-direction:column;gap:12px;color:#F4F1EA;font-family:Inter,system-ui,sans-serif}'+
 '.mgs-gk{font-weight:700;font-size:12px;letter-spacing:2.4px;text-transform:uppercase;color:#FFD900}.mgs-gh{font-family:Anton,Impact,sans-serif;text-transform:uppercase;font-size:38px;line-height:1}.mgs-gbar{width:74px;height:6px;background:#FFD900}'+
 '.mgs-gp{margin:0;font-size:15px;color:#d9d5cb;line-height:1.45}.mgs-gl{display:flex;flex-direction:column;gap:6px;font-weight:700;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#FFD900}'+
 '.mgs-gl input{font:400 22px Inter,system-ui,sans-serif;letter-spacing:normal;text-transform:none;min-height:54px;padding:0 14px;border:1px solid rgba(244,241,234,.35);background:#1a1916;color:#F4F1EA}.mgs-gl input:focus{outline:3px solid #FFD900;outline-offset:1px}'+
 '.mgs-gerr{margin:0;min-height:1.2em;color:#ffb27a;font-size:14px}.mgs-gy{min-height:56px;border:0;background:#FFD900;color:#0B0B0B;font-family:Anton,Impact,sans-serif;text-transform:uppercase;font-size:21px;cursor:pointer}.mgs-gy:disabled{opacity:.6}'+
 '.mgs-gn{min-height:46px;border:1px solid rgba(244,241,234,.3);background:transparent;color:#F4F1EA;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}';document.head.appendChild(s)}

function init(o){if(started)return;started=true;for(var k in o)CFG[k]=o[k];
  if(typeof window.save!=='function'||!window.S||typeof KEY==='undefined'||!window.fetch)return;
  CK='mgsync:'+KEY;css();cred=getCred();
  origSave=window.save;window.save=function(){try{window.S._mgT=Date.now()}catch(e){}var r=origSave.apply(this,arguments);schedule();return r};
  window.addEventListener('online',function(){if(cred&&stamp()>(cred.base||0))push()});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&cred){if(stamp()>(cred.base||0))push();else pull()}else if(document.visibilityState==='hidden'&&cred&&stamp()>(cred.base||0))push()});
  setInterval(function(){if(cred&&state==='offline')push()},30000);
  var ho=handoff();if(ho&&!cred){signInWith(ho);return}
  if(cred){applyName();pull()}else if(getGroup()){autoSignIn(getGroup())}else{var sk=+ls('mgsync-skip:'+KEY)||0;if(Date.now()-sk>3*864e5)setTimeout(function(){gate()},600);else setPill('off')}}
return {init:init,_merge:merge,_summary:summary,push:push,pull:pull};
})();
