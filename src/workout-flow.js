/* Macro Golf \u00b7 Workout flow, for every workout built from templates/ (1-to-1 plans, /coach-plan and Build a Plan (training)).
   1. Tidy session: each block (a superset or single exercise) shows in full only while it's the one being done.
      A block folds up once every set has weight/reps and RPE; the blocks after it stay folded until the ones before
      are done. Folded blocks still show the exercise names; tap the arrow to open or close any block.
   2. "Copy my workout": on the Session done screen and under a finished session, copies the workout as plain text
      (exercise, sets, kg, reps, RPE), ready to paste into WHOOP's AI or anywhere else.
   Stores nothing; reads S.logs / S.finished. Loaded by templates/parts/70-tail.html. */
var MGFlow=(function(){
if(window.MGFlow)return window.MGFlow;
var manual={},wasDone={};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ok(){return typeof SESSIONS==='object'&&typeof curKey==='function'&&typeof groups==='function'&&document.getElementById('blocks')}
function exList(b,k){return groups(b).map(function(g){return activeEx(g,k)})}
function blockDone(b,k){var L=(S.logs[k]||{});return exList(b,k).every(function(e){var a=L[e.id]||[];for(var i=0;i<e.sets;i++)if(!isDone(e,a[i]))return false;return true})}
function apply(auto){if(!ok())return;css();var k=curKey(),d=SESSIONS[S.day];if(!d)return;var els=document.querySelectorAll('#blocks > .block');if(els.length!==d.blocks.length)return;
  var done=d.blocks.map(function(b){return blockDone(b,k)}),cur=done.indexOf(false);
  d.blocks.forEach(function(b,bi){var el=els[bi],id=k+'|'+bi,fold;
    if(auto&&done[bi]&&!wasDone[id])delete manual[id];
    fold=id in manual?!manual[id]:(done[bi]||(cur>=0&&bi>cur));
    el.classList.toggle('wf-c',fold);el.classList.toggle('wf-done',done[bi]);
    var h=el.querySelector('.block-head'),t=h&&h.querySelector('.wf-t');
    if(h&&!t){t=document.createElement('button');t.type='button';t.className='wf-t';h.insertBefore(t,h.firstChild)}
    if(t){t.setAttribute('aria-expanded',String(!fold));t.setAttribute('aria-label',(fold?'Open ':'Close ')+(b.label||b.tag));t.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l8 7-8 7" fill="none" stroke="currentColor" stroke-width="3"/></svg>'}
    var st=h&&h.querySelector('.wf-s');if(done[bi]){if(!st){st=document.createElement('span');st.className='wf-s';h.insertBefore(st,h.querySelector('.restbtn'))}st.textContent='\u2713 Done'}else if(st)st.remove();
    wasDone[id]=done[bi]});
  copyBtn()}
function toggle(el){var bi=[].indexOf.call(document.querySelectorAll('#blocks > .block'),el);if(bi<0)return;var id=curKey()+'|'+bi;manual[id]=el.classList.contains('wf-c');apply(false)}
/* after a set changes: fold the block that just finished and open the next one */
function onSet(){if(!ok())return;var k=curKey(),d=SESSIONS[S.day],before=d.blocks.map(function(b,bi){return !!wasDone[k+'|'+bi]});apply(true);
  var after=d.blocks.map(function(b){return blockDone(b,k)}),j=-1;after.forEach(function(x,i){if(x&&!before[i])j=i});
  if(j>=0){var nx=after.indexOf(false),els=document.querySelectorAll('#blocks > .block');if(nx>=0){delete manual[k+'|'+nx];apply(false);var n=els[nx];if(n)setTimeout(function(){n.scrollIntoView({behavior:'smooth',block:'start'})},120)}}}

/* ---------- copy my workout ---------- */
function text(k,day){var d=SESSIONS[day],L=S.logs[k]||{},out=[],tot=0,sets=0,wk=(String(k).match(/^w(\d+)/)||[])[1];
  var f=S.finished&&S.finished[k],dt=f?new Date(String(f).length<=10?f+'T12:00:00':f):new Date();
  out.push('Macro Golf workout: '+d.name+(d.title?' \u00b7 '+d.title:'')+(wk?' (week '+wk+')':''));
  out.push(dt.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}));out.push('');
  d.blocks.forEach(function(b){var gs=groups(b);gs.forEach(function(g,gi){var e=activeEx(g,k),a=(L[e.id]||[]).filter(function(s){return isDone(e,s)});if(!a.length)return;
    var tag=gs.length===1?b.tag:b.tag+(gi+1),u=(typeof wtInfo==='function'?wtInfo(e).u:'kg')||'kg';
    var parts=a.map(function(s){var w=num(s.w);if(w!=null&&num(s.r)!=null&&e.inc&&e.unit!=='s'&&e.unit!=='m'){tot+=w*num(s.r)}sets++;
      return (w!=null?fmt(w)+' '+u.trim()+' x ':'')+s.r+(e.unit==='s'?' sec':e.unit==='m'?' m':' reps')+(e.side?' each side':'')+(e.max?(s.rpe==='fast'?' (fast)':' (slowed)'):(s.rpe?' @ RPE '+s.rpe:''))});
    out.push(tag+' '+e.name+(gs.length>1?' (superset)':''));parts.forEach(function(p,i){out.push('  Set '+(i+1)+': '+p)})})});
  out.push('');out.push('Total: '+sets+' sets'+(tot?', '+Math.round(tot).toLocaleString('en-GB')+' kg lifted':''));
  return out.join('\n')}
function copy(k,day,btn){var t=text(k,day),done=function(){btn.textContent='\u2713 Copied. Paste it into WHOOP';setTimeout(function(){btn.textContent='Copy my workout'},4000)};
  function fb(){var ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,t.length);var r=false;try{r=document.execCommand('copy')}catch(e){}ta.remove();if(r)done();else show(t)}
  try{if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(done,fb);else fb()}catch(e){fb()}}
function show(t){var o=document.createElement('div');o.className='wf-ov';o.innerHTML='<div class="wf-box"><b>Copy your workout</b><p>Press and hold the text, Select All, then Copy.</p><textarea readonly></textarea><button type="button" class="btn primary">Done</button></div>';o.querySelector('textarea').value=t;document.body.appendChild(o);o.querySelector('button').onclick=function(){o.remove()};var ta=o.querySelector('textarea');ta.focus();ta.select()}
function copyBtn(){var host=document.getElementById('blocks');if(!host)return;var k=curKey(),fin=S.finished&&S.finished[k],b=document.getElementById('wfCopy');
  if(!fin){if(b)b.remove();return}
  if(!b){b=document.createElement('button');b.type='button';b.id='wfCopy';b.className='btn ghost wf-copy';b.textContent='Copy my workout';host.parentNode.insertBefore(b,host.nextSibling);b.onclick=function(){copy(curKey(),S.day,b)}}}
var snap=null;
document.addEventListener('click',function(ev){if(ev.target.closest&&ev.target.closest('#finish')&&ok())snap={k:curKey(),day:S.day};var t=ev.target.closest&&ev.target.closest('.wf-t');if(t){ev.preventDefault();toggle(t.closest('.block'))}},true);
new MutationObserver(function(){if(!snap)return;var d=document.querySelector('.ux-done .ux-done-in');if(!d||d.querySelector('.wf-copy'))return;css();
  var b=document.createElement('button');b.type='button';b.className='ux-btn wf-copy';b.textContent='Copy my workout';var s=snap;
  b.addEventListener('click',function(ev){ev.stopPropagation();copy(s.k,s.day,b)});
  var p=d.querySelector('.ux-btn');if(p&&p.parentNode)p.parentNode.insertBefore(b,p);else d.appendChild(b)}).observe(document.body,{childList:true,subtree:true});
/* supersets: after a set of A1 is logged, scroll to the same set of A2; after A2, back up to A1's next set */
function nextInSuperset(id,i){if(!ok())return;var k=curKey(),d=SESSIONS[S.day],L=S.logs[k]||{};
  for(var bi=0;bi<d.blocks.length;bi++){var ex=exList(d.blocks[bi],k),j=-1;ex.forEach(function(e,x){if(e.id===id)j=x});if(j<0)continue;
    if(ex.length<2||!isDone(ex[j],(L[id]||[])[i])||blockDone(d.blocks[bi],k))return;
    var sets=Math.max.apply(null,ex.map(function(e){return e.sets})),tgt=null;
    for(var n=1;n<=ex.length*sets&&!tgt;n++){var pos=j+n,ei=pos%ex.length,si=i+Math.floor(pos/ex.length),e=ex[ei];if(si>=e.sets)continue;if(!isDone(e,(L[e.id]||[])[si]))tgt=[e.id,si]}
    if(!tgt)return;var inp=document.querySelector('#blocks [data-k="'+tgt[0]+'|'+tgt[1]+'|r"]'),row=inp&&inp.closest('tr');if(!row)return;
    pend={k:tgt[0]+'|'+tgt[1],t:Date.now()};mark(true);return}}
var pend=null;
function mark(scroll){if(!pend||Date.now()-pend.t>1500)return;var inp=document.querySelector('#blocks [data-k="'+pend.k+'|r"]'),row=inp&&inp.closest('tr');if(!row)return;[].forEach.call(document.querySelectorAll('#blocks tr.wf-next'),function(x){if(x!==row)x.classList.remove('wf-next')});if(!row.classList.contains('wf-next')){row.classList.add('wf-next')}if(scroll)row.scrollIntoView({behavior:'smooth',block:'center'})}
var lastDone={};
function pre(t){if(!(t&&t.dataset&&t.dataset.k))return;var p=t.dataset.k.split('|');try{var e=exById(p[0]),s=((S.logs[curKey()]||{})[p[0]]||[])[+p[1]];lastDone[curKey()+'|'+p[0]+'|'+p[1]]=!!(e&&isDone(e,s))}catch(x){}}
var preRec={};function rk(t){var p=t.dataset.k.split('|');return p[0]+'|'+p[1]}
document.addEventListener('input',function(ev){var t=ev.target;if(!(t&&t.dataset&&t.dataset.k))return;var r=rk(t);if(!preRec[r]){pre(t);preRec[r]=1}},true);
document.addEventListener('change',function(ev){var t=ev.target;if(!(t&&t.dataset&&t.dataset.k&&t.closest&&t.closest('#blocks')))return;
  var p=t.dataset.k.split('|'),r0=rk(t);if(!preRec[r0])pre(t);setTimeout(function(){delete preRec[r0];onSet();try{var e=exById(p[0]),s=((S.logs[curKey()]||{})[p[0]]||[])[+p[1]],key=curKey()+'|'+p[0]+'|'+p[1],dn=!!(e&&isDone(e,s));if(dn&&!lastDone[key])nextInSuperset(p[0],+p[1]);lastDone[key]=dn}catch(x){}},60)},true);
function css(){if(document.getElementById('wf-css'))return;var s=document.createElement('style');s.id='wf-css';s.textContent=[
 '.block .wf-t{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;margin:-6px 6px -6px -8px;border:0;background:transparent;color:var(--ink,#0B0B0B);cursor:pointer;flex:none}',
 '.block .wf-t svg{transition:transform .2s}.block .wf-t[aria-expanded="true"] svg{transform:rotate(90deg)}',
 '.block .block-head{gap:6px;cursor:default}.block .block-head .kick{flex:1}',
 '.block .wf-s{font:700 11px var(--sans,Inter,sans-serif);letter-spacing:1.2px;text-transform:uppercase;color:#1f8a4c;margin-right:8px;white-space:nowrap}',
 '.block.wf-done{border-left-color:#1f8a4c}',
 '.block.wf-c .ex{padding:10px 16px;gap:0}',
 '.block.wf-c .ex>*:not(.ex-top),.block.wf-c .targets,.block.wf-c .swapbtn,.block.wf-c .mgv-btn,.block.wf-c .p1rm{display:none!important}',
 '.block.wf-c .ex-top{align-items:center}.block.wf-c .ex-name .disp{font-size:18px}',
 '.block.wf-c .restbtn{display:none}',
 '.wf-copy{margin-top:12px;width:100%}',
 '#blocks tr.wf-next td{animation:wfN 1.4s}@keyframes wfN{0%,100%{background:transparent}25%{background:rgba(255,217,0,.45)}}',
 '.ux-btn.wf-copy{width:100%;margin:0 0 10px}',
 '.wf-ov{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px}',
 '.wf-box{background:#fff;max-width:520px;width:100%;padding:18px;display:flex;flex-direction:column;gap:10px}',
 '.wf-box textarea{width:100%;min-height:260px;font:14px/1.4 ui-monospace,Menlo,monospace;padding:10px;box-sizing:border-box}'].join('');document.head.appendChild(s)}
function hook(){var o=window.renderDay;if(typeof o!=='function'||o.__wf)return false;var w=function(){var r=o.apply(this,arguments);try{apply(false);mark(false)}catch(e){}return r};w.__wf=1;window.renderDay=w;try{apply(false)}catch(e){}return true}
var n=0;(function go(){if(hook()||++n>25)return;setTimeout(go,200)})();
return {apply:apply,text:text}})();
