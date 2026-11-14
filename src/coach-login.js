/* Macro Golf · coach logins (Joe, 14 Nov; supabase/019-coach-logins.sql).
   Loaded by Coach home, the Plan Builder and the Player dashboard. Turns each page's old "Coach password" form into
   "who are you + your password": it adds a name picker and a "First time here?" set-up, logs in with mg_coach_login
   (or mg_coach_claim the first time), then puts the session token into the page's password box and lets the page's own
   login carry on. The page sends that token as p_pass to every mg_coach_* function, so nothing else changes.
   The token lives in sessionStorage 'mg-coach-s' (this tab only, 12 hours) and who is logged in in 'mg-coach-who'.
   Usage: <script src="{{BASE}}src/coach-login.js"></script> then MGCoachLogin.attach({form, input, button}).
   window.MGCoach.me() -> {id, name, role} ('admin' | 'coach' | 'limited') or null. */
var MGCoachLogin=(function(){
if(window.MGCoachLogin)return window.MGCoachLogin;
var API='https://zhcgwtlyqriwlhbzkxcl.supabase.co/rest/v1/rpc/',KEY='sb_publishable__IBhmrVHOXsLHruU7XJB-g_OSN9Ljne';
function rpc(fn,body){return fetch(API+fn,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(body||{})}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j&&(j.message||j.error))||('Error '+r.status));return j})})}
function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){return null}}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function isToken(v){return /^t\.[0-9a-f]{40,}$/.test(String(v||''))}
function me(){try{return JSON.parse(ss('mg-coach-who')||'null')}catch(e){return null}}
window.MGCoach={me:me,isToken:isToken,logout:function(){var t=ss('mg-coach-s');ss('mg-coach-s',null);ss('mg-coach-who',null);if(isToken(t))rpc('mg_coach_logout',{p_pass:t}).catch(function(){})},
  canEditAccess:function(){var m=me();return !!m&&m.role==='admin'},canAssign:function(){var m=me();return !!m&&m.role!=='limited'},limited:function(){var m=me();return !!m&&m.role==='limited'}};
/* an old shared password left in this tab from before 019: drop it so the page shows the login */
(function(){var t=ss('mg-coach-s');if(t&&!isToken(t)){ss('mg-coach-s',null);ss('mg-coach-who',null)}})();
function css(){if(document.getElementById('mgcl-css'))return;var s=document.createElement('style');s.id='mgcl-css';s.textContent=[
 '.mgcl-names{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 12px}',
 '.mgcl-names button{flex:1 1 calc(50% - 8px);min-height:46px;border-radius:8px;border:1px solid rgba(244,241,234,.22);background:transparent;color:inherit;font:600 15px Inter,system-ui,sans-serif;cursor:pointer}',
 '.mgcl-names button[aria-pressed="true"]{background:#FFD900;color:#0b0b0b;border-color:#FFD900}',
 '.mgcl-k{display:block;font:11px ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#FFD900;margin:2px 0 6px}',
 '.mgcl-link{background:none;border:0;color:#FFD900;text-decoration:underline;cursor:pointer;padding:6px 0;font:13px Inter,system-ui,sans-serif}',
 '.mgcl-first{display:flex;flex-direction:column;gap:8px;margin:8px 0}',
 '.mgcl-first input{width:100%;box-sizing:border-box;min-height:44px;border-radius:8px;border:1px solid rgba(244,241,234,.22);background:#0b0b0b;color:#f4f1ea;padding:0 12px;font:15px Inter,system-ui,sans-serif}',
 '.mgcl-first p{margin:0;font-size:13px;opacity:.8;line-height:1.4}',
 '.mgcl-err{color:#ff6b5e;font-size:14px;min-height:18px;margin-top:6px}'].join('');document.head.appendChild(s)}
function attach(o){var form=o.form,input=o.input,btn=o.button;if(!form||!input||form.__mgcl)return;form.__mgcl=1;css();
  var names=[],who=ls('mg-coach-id')||'',first=false,busy=false;
  var lab=form.querySelector('label[for="'+input.id+'"]')||input.closest('label');
  var top=document.createElement('div');top.innerHTML='<span class="mgcl-k">Who are you?</span><div class="mgcl-names" role="group" aria-label="Coach"><span style="opacity:.6;font-size:13px">Loading coaches…</span></div>';
  (lab||input).parentNode.insertBefore(top,lab||input);
  var firstBox=document.createElement('div');firstBox.className='mgcl-first';firstBox.hidden=true;
  firstBox.innerHTML='<p>First time here? Choose your own password. To prove it’s you, type the old team coach password too.</p><input type="password" data-f="team" placeholder="Old team coach password" autocomplete="off"><input type="password" data-f="new" placeholder="Your new password (8+ characters)" autocomplete="new-password"><input type="password" data-f="new2" placeholder="Type your new password again" autocomplete="new-password">';
  var link=document.createElement('button');link.type='button';link.className='mgcl-link';link.textContent='First time here? Set your password';
  var err=document.createElement('div');err.className='mgcl-err';err.setAttribute('role','alert');
  var after=btn||input;after.parentNode.insertBefore(firstBox,after);after.parentNode.insertBefore(err,after.nextSibling);err.parentNode.insertBefore(link,err.nextSibling);
  if(lab){var tn=lab.querySelector('span')||lab;[].some.call(tn.childNodes,function(n){if(n.nodeType===3&&/password/i.test(n.nodeValue)){n.nodeValue='Your password';return true}})}
  function mode(f){first=f;firstBox.hidden=!f;if(lab)lab.hidden=f;input.hidden=f;input.required=!f;
    link.textContent=f?'I already have a password':'First time here? Set your password';if(btn)btn.textContent=f?'Set my password':btn.dataset.mgclT;err.textContent=''}
  if(btn)btn.dataset.mgclT=btn.textContent;
  link.addEventListener('click',function(){mode(!first)});
  function drawNames(){var box=top.querySelector('.mgcl-names');if(!names.length){box.innerHTML='<span style="font-size:13px;color:#ff6b5e">Couldn’t load the coach list. Refresh to try again.</span>';return}
    box.innerHTML=names.map(function(n){return '<button type="button" data-c="'+esc(n.id)+'" aria-pressed="'+(n.id===who)+'">'+esc(n.name)+'</button>'}).join('');
    var cur=names.filter(function(n){return n.id===who})[0];if(cur&&!cur.ready)mode(true)}
  top.addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(!b)return;who=b.dataset.c;ls('mg-coach-id',who);drawNames();var cur=names.filter(function(n){return n.id===who})[0];mode(!!(cur&&!cur.ready));(first?firstBox.querySelector('input'):input).focus()});
  rpc('mg_coach_names').then(function(r){names=Array.isArray(r)?r:[];drawNames()}).catch(function(){names=[];drawNames()});
  function done(r){ss('mg-coach-s',r.token);ss('mg-coach-who',JSON.stringify(r.coach));input.value=r.token;form.__mgclGo=1;busy=false;
    if(form.requestSubmit)form.requestSubmit(btn||undefined);else if(btn)btn.click();else form.dispatchEvent(new Event('submit',{cancelable:true}))}
  form.addEventListener('submit',function(e){
    if(form.__mgclGo||isToken(input.value)){form.__mgclGo=0;return}  /* the token is in: let the page log in */
    e.preventDefault();e.stopImmediatePropagation();if(busy)return;err.textContent='';
    if(!who){err.textContent='Tap your name first.';return}
    var go=function(p){busy=true;if(btn){btn.disabled=true}p.then(function(r){if(btn)btn.disabled=false;if(!r||r.error||!r.token){busy=false;err.textContent=(r&&r.error)||'Couldn’t log in';if(r&&r.first)mode(true);return}input.value='';done(r)}).catch(function(x){busy=false;if(btn)btn.disabled=false;err.textContent='Couldn’t reach the server. '+x.message})};
    if(first){var f=function(k){return firstBox.querySelector('[data-f="'+k+'"]').value};
      if(f('new').length<8){err.textContent='Choose a password of at least 8 characters.';return}
      if(f('new')!==f('new2')){err.textContent='The two new passwords don’t match.';return}
      go(rpc('mg_coach_claim',{p_coach:who,p_team:f('team'),p_new:f('new')}).then(function(r){if(r&&r.token)[].forEach.call(firstBox.querySelectorAll('input'),function(i){i.value=''});return r}))}
    else{if(!input.value){err.textContent='Type your password.';return}go(rpc('mg_coach_login',{p_coach:who,p_pass:input.value}))}
  },true)}
return {attach:attach,rpc:rpc}})();
