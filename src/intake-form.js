/* Intake forms (Pre Match-Up Questionnaire, Client Onboarding). One question set per page, step by step.
   Page: <div id="mgf"></div> then MGForm.mount({form, kicker, title, intro, minutes, sections:[{title, intro, q:[...]}], done})
   Question: {k, label, type:'text'|'email'|'long'|'num'|'choice'|'multi'|'confirm', req, opts:[...], other:true, hint, ph}
   Sends to Supabase mg_intake_submit (supabase/012-intake-plans.sql). Answers are kept on the phone until sent.
   ?email=…&name=… in the page link fills those in (coaches can send a personal link). */
(function(){
var API='https://zhcgwtlyqriwlhbzkxcl.supabase.co/rest/v1/rpc/',KEY='sb_publishable__IBhmrVHOXsLHruU7XJB-g_OSN9Ljne';
var CSS=''+
'.mgf{min-height:100vh;background:#0B0B0B;color:#F4F1EA;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;justify-content:center;box-sizing:border-box;'+
  'padding:calc(28px + env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) calc(90px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}'+
'.mgf *{box-sizing:border-box}'+
'.mgf-in{width:100%;max-width:620px;display:flex;flex-direction:column;gap:16px}'+
'.mgf-top{display:flex;justify-content:space-between;align-items:center;gap:12px}'+
'.mgf-wm{font:400 22px Anton,Impact,sans-serif;letter-spacing:.5px;color:#F4F1EA}.mgf-wm i{font-style:normal;color:#FFD900}'+
'.mgf-step{font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#a9a497}'+
'.mgf-prog{height:6px;background:#26251f}.mgf-prog b{display:block;height:100%;background:#FFD900;transition:width .25s}'+
'.mgf-k{font-weight:700;font-size:12px;letter-spacing:2.4px;text-transform:uppercase;color:#FFD900;margin-top:10px}'+
'.mgf .mgf-h{font-family:Anton,Impact,"Arial Narrow Bold",sans-serif!important;font-weight:400!important;text-transform:uppercase;font-size:clamp(38px,9vw,56px)!important;line-height:.98!important;margin:0!important;color:#F4F1EA!important}'+
'.mgf .mgf-h2{font-family:Anton,Impact,sans-serif!important;font-weight:400!important;text-transform:uppercase;font-size:clamp(30px,7vw,40px)!important;line-height:1!important;margin:0!important;color:#F4F1EA!important}'+
'.mgf-bar{width:74px;height:6px;background:#FFD900}'+
'.mgf .mgf-p{margin:0!important;color:#cfcabd;font-size:15.5px;line-height:1.55;max-width:60ch}'+
'.mgf-q{display:flex;flex-direction:column;gap:8px;padding:16px;background:#141414;border-left:4px solid #2b2a25}'+
'.mgf-q.bad{border-left-color:#ff6b5e}'+
'.mgf-q label.mgf-l,.mgf-q .mgf-l{font:600 15.5px Inter,system-ui,sans-serif;color:#F4F1EA;line-height:1.4}'+
'.mgf-l em{font-style:normal;color:#FFD900;margin-left:4px}'+
'.mgf-hint{font-size:13px;color:#a9a497;line-height:1.45;margin:-2px 0 0}'+
'.mgf input[type=text],.mgf input[type=email],.mgf input[type=number],.mgf textarea{width:100%;min-height:50px;padding:12px 14px;background:#0B0B0B;border:1px solid rgba(244,241,234,.28);border-radius:0;color:#F4F1EA;font:400 16px Inter,system-ui,sans-serif}'+
'.mgf textarea{min-height:110px;resize:vertical;line-height:1.5}'+
'.mgf input:focus,.mgf textarea:focus{outline:none;border-color:#FFD900}'+
'.mgf ::placeholder{color:#6d6a60}'+
'.mgf-opts{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}'+
'.mgf-opts button{min-height:50px;padding:10px 12px;text-align:left;background:#0B0B0B;border:2px solid rgba(244,241,234,.22);color:#F4F1EA;font:600 14.5px Inter,system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;gap:10px}'+
'.mgf-opts button::before{content:"";flex:none;width:16px;height:16px;border:2px solid rgba(244,241,234,.5)}'+
'.mgf-opts.radio button::before{border-radius:50%}'+
'.mgf-opts button[aria-pressed=true]{border-color:#FFD900;background:#1f1d14;color:#FFD900}'+
'.mgf-opts button[aria-pressed=true]::before{background:#FFD900;border-color:#FFD900;box-shadow:inset 0 0 0 3px #1f1d14}'+
'.mgf-err{color:#ff8f85;font-size:13px;font-weight:600}'+
'.mgf-nav{display:flex;gap:10px;margin-top:6px}'+
'.mgf-go{flex:1;min-height:58px;border:0;background:#FFD900;color:#0B0B0B;font:400 22px Anton,Impact,sans-serif;text-transform:uppercase;cursor:pointer;letter-spacing:.3px}'+
'.mgf-back{min-height:58px;padding:0 20px;background:none;border:2px solid rgba(244,241,234,.3);color:#F4F1EA;font:400 20px Anton,Impact,sans-serif;text-transform:uppercase;cursor:pointer}'+
'.mgf-go[disabled]{opacity:.5;cursor:default}'+
'.mgf button:focus-visible,.mgf a:focus-visible{outline:3px solid #FFD900;outline-offset:2px}'+
'.mgf-note{background:#1a1916;border-left:6px solid #FFD900;padding:12px 14px;color:#cfcabd;font-size:14px;line-height:1.5}'+
'.mgf-note.warn{border-left-color:#ff6b5e}'+
'.mgf-meta{display:flex;gap:18px;flex-wrap:wrap;color:#a9a497;font-size:13px;font-weight:600;letter-spacing:.5px}'+
'.mgf-meta b{color:#F4F1EA}'+
'.mgf-saved{font-size:12px;color:#6d6a60;text-align:right}'+
'.mgf-done{display:flex;flex-direction:column;gap:14px;margin-top:30px}'+
'@media (prefers-reduced-motion:reduce){.mgf-prog b{transition:none}}';

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}}

function mount(cfg){
  var host=document.getElementById(cfg.root||'mgf');if(!host)return;
  if(!document.getElementById('mgf-css')){var st=document.createElement('style');st.id='mgf-css';st.textContent=CSS;document.head.appendChild(st)}
  host.className='mgf';host.innerHTML='<div class="mgf-in" id="mgf-in"></div>';
  var box=document.getElementById('mgf-in'),DKEY='mgform:'+cfg.form;
  var A={},step=-1,restored=false,sending=false,errors={};
  try{var d=JSON.parse(ls(DKEY)||'null');if(d&&d.a){A=d.a;restored=Object.keys(A).length>2;if(typeof d.step==='number')step=-1}}catch(e){}
  var qs=new URLSearchParams(location.search);
  if(qs.get('email')&&!A.email)A.email=qs.get('email');
  if(qs.get('name')&&!A.name)A.name=qs.get('name');
  var secs=cfg.sections,total=secs.length;

  function save(){ls(DKEY,JSON.stringify({a:A,step:step,t:Date.now()}));var s=document.getElementById('mgf-saved');if(s)s.textContent='Answers saved on this device'}
  function top(){var pct=step<0?0:step>=total?100:Math.round(step/total*100);
    return '<div class="mgf-top"><div class="mgf-wm">MACRO <i>GOLF</i></div>'+(step>=0&&step<total?'<div class="mgf-step">Step '+(step+1)+' of '+total+'</div>':'')+'</div><div class="mgf-prog" aria-hidden="true"><b style="width:'+pct+'%"></b></div>'}
  function qHTML(q){
    var v=A[q.k],id='mgf-'+q.k,req=q.req?'<em aria-hidden="true">*</em>':'',bad=errors[q.k];
    var h='<div class="mgf-q'+(bad?' bad':'')+'" data-q="'+q.k+'">';
    if(q.type==='choice'||q.type==='multi'){
      var arr=q.type==='multi'?(Array.isArray(v)?v:[]):[v];
      h+='<div class="mgf-l" id="'+id+'-l">'+esc(q.label)+req+'</div>'+(q.hint?'<p class="mgf-hint">'+esc(q.hint)+'</p>':'')+
        '<div class="mgf-opts'+(q.type==='choice'?' radio':'')+'" role="group" aria-labelledby="'+id+'-l">'+q.opts.map(function(o){var on=arr.indexOf(o)>=0;
          return '<button type="button" data-k="'+q.k+'" data-v="'+esc(o)+'" aria-pressed="'+on+'">'+esc(o)+'</button>'}).join('')+'</div>';
      if(q.other)h+='<input type="text" id="'+id+'-o" data-k="'+q.k+'_other" value="'+esc(A[q.k+'_other'])+'" placeholder="Other (type here)" aria-label="'+esc(q.label)+': other">';
    }else if(q.type==='confirm'){
      h+='<div class="mgf-opts radio" role="group" aria-label="'+esc(q.label)+'"><button type="button" data-k="'+q.k+'" data-v="I confirm" aria-pressed="'+(v==='I confirm')+'" style="grid-column:1/-1">'+esc(q.label)+'</button></div>';
    }else{
      h+='<label class="mgf-l" for="'+id+'">'+esc(q.label)+req+'</label>'+(q.hint?'<p class="mgf-hint">'+esc(q.hint)+'</p>':'');
      var ph=q.ph?' placeholder="'+esc(q.ph)+'"':'';
      if(q.type==='long')h+='<textarea id="'+id+'" data-k="'+q.k+'"'+ph+'>'+esc(v)+'</textarea>';
      else h+='<input id="'+id+'" data-k="'+q.k+'" type="'+(q.type==='email'?'email':q.type==='num'?'number':'text')+'"'+(q.type==='num'?' inputmode="decimal" step="any"':'')+(q.type==='email'?' autocomplete="email"':q.k==='name'?' autocomplete="name"':'')+' value="'+esc(v)+'"'+ph+'>';
    }
    if(bad)h+='<div class="mgf-err" role="alert">'+esc(bad)+'</div>';
    return h+'</div>';
  }
  function render(focus){
    var h=top();
    if(step<0){
      h+='<div class="mgf-k">'+esc(cfg.kicker)+'</div><h1 class="mgf-h">'+esc(cfg.title)+'</h1><div class="mgf-bar"></div><p class="mgf-p">'+esc(cfg.intro)+'</p>'+
        '<div class="mgf-meta"><span><b>'+total+'</b> short sections</span><span>About <b>'+cfg.minutes+' minutes</b></span><span>Saves as you go</span></div>'+
        (restored?'<div class="mgf-note">Welcome back. Your earlier answers are still here, so you can pick up where you left off.</div>':'')+
        '<div class="mgf-nav"><button class="mgf-go" type="button" data-go="next">'+(restored?'Carry on':'Start')+'</button></div>';
    }else if(step<total){
      var s=secs[step];
      h+='<div class="mgf-k">'+esc(cfg.kicker)+'</div><h2 class="mgf-h2" tabindex="-1" id="mgf-sh">'+esc(s.title)+'</h2><div class="mgf-bar"></div>'+(s.intro?'<p class="mgf-p">'+esc(s.intro)+'</p>':'')+
        s.q.map(qHTML).join('')+
        (step===total-1&&cfg.sendErr?'<div class="mgf-note warn" role="alert">'+esc(cfg.sendErr)+'</div>':'')+
        '<div class="mgf-nav"><button class="mgf-back" type="button" data-go="back">Back</button><button class="mgf-go" type="button" data-go="next"'+(sending?' disabled':'')+'>'+(step===total-1?(sending?'Sending':'Send to my coach'):'Next')+'</button></div><div class="mgf-saved" id="mgf-saved"></div>';
    }else{
      h+='<div class="mgf-done"><div class="mgf-k">Sent</div><h1 class="mgf-h">'+esc(cfg.done.title)+'</h1><div class="mgf-bar"></div><p class="mgf-p">'+esc(cfg.done.text)+'</p></div>';
    }
    box.innerHTML=h;
    if(focus){var sh=document.getElementById('mgf-sh');if(sh)sh.focus({preventScroll:true});window.scrollTo({top:0})}
  }
  function check(s){errors={};s.q.forEach(function(q){if(!q.req)return;var v=A[q.k];
      var empty=Array.isArray(v)?!v.length:!String(v==null?'':v).trim();
      if(empty)errors[q.k]=q.type==='confirm'?'Please confirm to send.':'Please answer this one.';
      else if(q.type==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v).trim()))errors[q.k]='Please check your email address.'});
    return !Object.keys(errors).length}
  function send(){
    sending=true;cfg.sendErr='';render();
    var ans={};Object.keys(A).forEach(function(k){if(k!=='email'&&k!=='name')ans[k]=A[k]});
    fetch(API+'mg_intake_submit',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},
      body:JSON.stringify({p_form:cfg.form,p_email:String(A.email||'').trim(),p_name:String(A.name||'').trim(),p_answers:ans})})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j&&j.message)||('Error '+r.status));return j})})
    .then(function(j){if(j&&j.error)throw new Error(j.error);ls(DKEY,null);sending=false;step=total;render(true)})
    .catch(function(e){sending=false;cfg.sendErr='Your answers did not send: '+(e.message||'check your connection')+'. They are saved on this device, so tap Send again.';render()});
  }
  box.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    if(b.dataset.k){var q=null;secs.forEach(function(s){s.q.forEach(function(x){if(x.k===b.dataset.k)q=x})});if(!q)return;
      if(q.type==='multi'){var a=Array.isArray(A[q.k])?A[q.k].slice():[],i=a.indexOf(b.dataset.v);i>=0?a.splice(i,1):a.push(b.dataset.v);A[q.k]=a;b.setAttribute('aria-pressed',i<0)}
      else{var on=A[q.k]===b.dataset.v;A[q.k]=on?'':b.dataset.v;
        [].forEach.call(b.parentNode.querySelectorAll('button'),function(x){x.setAttribute('aria-pressed',x===b&&!on)})}
      if(errors[q.k]){delete errors[q.k];var w=b.closest('.mgf-q');w.classList.remove('bad');var er=w.querySelector('.mgf-err');if(er)er.remove()}
      save();return}
    if(b.dataset.go==='back'){step=Math.max(-1,step-1);errors={};render(true);save();return}
    if(b.dataset.go==='next'){
      if(step>=0&&step<total&&!check(secs[step])){render();var f=box.querySelector('.mgf-q.bad');if(f){f.scrollIntoView({block:'center'});var inp=f.querySelector('input,textarea,button');if(inp)inp.focus({preventScroll:true})}return}
      if(step===total-1){send();return}
      step++;render(true);save()}
  });
  box.addEventListener('input',function(e){var k=e.target.dataset&&e.target.dataset.k;if(!k)return;A[k]=e.target.value;
    if(errors[k]){delete errors[k];var w=e.target.closest('.mgf-q');w.classList.remove('bad');var er=w.querySelector('.mgf-err');if(er)er.remove()}
    clearTimeout(box._t);box._t=setTimeout(save,400)});
  render();
}
window.MGForm={mount:mount};
})();
