var UX=(function(){
var CFG={family:'',home:false,rpeTaps:false,steps:false};
function $q(s,r){return (r||document).querySelector(s)}
function $a(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function n(v){var x=parseFloat(v);return isNaN(x)?null:x}
function f1(x){return (Math.round(x*10)/10).toString()}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fire(e,t){e.dispatchEvent(new Event(t,{bubbles:true}))}
function noBlur(b){['mousedown','pointerdown'].forEach(function(t){b.addEventListener(t,function(ev){ev.preventDefault()})})}
/* ---------- exercise lookup (for weight steps) ---------- */
function allEx(){var out=[];try{if(typeof SESSIONS!=='undefined')SESSIONS.forEach(function(d){d.blocks.forEach(function(b){out=out.concat(b.ex)})})}catch(e){}
  try{if(typeof PLAN!=='undefined')PLAN.phases.forEach(function(p){(p.days||[]).forEach(function(d){d.blocks.forEach(function(b){out=out.concat(b.ex)})})})}catch(e){}
  try{if(typeof WORKOUTS!=='undefined')WORKOUTS.forEach(function(w){out=out.concat(w.ex)})}catch(e){}return out}
function exById(id){var a=allEx();for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null}
function stepOf(id){var e=exById(id);return e&&typeof e.inc==='number'?e.inc:2.5}
/* ---------- 1. faster logging: RPE taps, same as last, -/+ ---------- */
var box=null,obs=null;
function rowParts(tr){var r={};$a('[data-k]',tr).forEach(function(x){var p=x.dataset.k.split('|');r.id=p[0];r.i=+p[1];r[p[2]]=x});return r}
function decorate(){
  if(!box)return;
  $a(CFG.rpeTaps?'select[data-k$="|rpe"]':'.ux-none',box).forEach(function(sel){if(sel.dataset.ux)return;sel.dataset.ux=1;sel.classList.add('ux-hid');
    var o=sel.options[sel.selectedIndex],b=el('button','ux-rpe'+(sel.value?' on':''),esc(sel.value?o.text:(sel.options[0]?sel.options[0].text:'RPE')));b.type='button';noBlur(b);
    b.setAttribute('aria-label',sel.getAttribute('aria-label')||'Effort');sel.parentNode.appendChild(b);b.addEventListener('click',function(){chips(sel)})});
  $a('table.sets',box).forEach(function(tb){
    var rows=$a('tbody tr',tb).filter(function(tr){return tr.querySelector('[data-k]')});if(!rows.length)return;
    var cur=null,prev=null;for(var i=0;i<rows.length;i++){var p=rowParts(rows[i]);var done=p.r&&p.r.value&&p.rpe&&p.rpe.value;if(!done){cur=rows[i];prev=i?rows[i-1]:null;break}}
    if(!cur||cur.nextElementSibling&&cur.nextElementSibling.classList.contains('ux-help'))return;
    var c=rowParts(cur),pv=prev?rowParts(prev):null,hasW=c.w&&!c.w.disabled,same=pv&&pv.r&&pv.r.value;
    if(!(hasW&&CFG.steps)&&!same)return;
    var tr=el('tr','ux-help'),td=el('td');td.colSpan=4;tr.appendChild(el('td'));tr.firstChild.className='ux-gap';td.colSpan=3;tr.appendChild(td);var box=el('div','ux-hbox');td.appendChild(box);
    if(hasW&&CFG.steps){var st=stepOf(c.id);[-st,st].forEach(function(d){var b=el('button','ux-step',(d<0?'−':'+')+f1(Math.abs(d)));b.type='button';noBlur(b);b.setAttribute('aria-label',(d<0?'Less':'More')+' weight');
      b.addEventListener('click',function(){var base=n(c.w.value);if(base==null)base=n(c.w.placeholder);if(base==null&&pv&&pv.w)base=n(pv.w.value);if(base==null)base=0;c.w.value=f1(Math.max(0,base+d));fire(c.w,'input');fire(c.w,'change')});box.appendChild(b)})}
    if(same){var lab=(pv.w&&pv.w.value?f1(n(pv.w.value))+'kg × ':'')+pv.r.value;var b=el('button','ux-same','Same as last · '+esc(lab));b.type='button';noBlur(b);
      b.addEventListener('click',function(){if(c.w&&!c.w.disabled&&pv.w&&pv.w.value){c.w.value=pv.w.value;fire(c.w,'input');fire(c.w,'change')}if(c.r){c.r.value=pv.r.value;fire(c.r,'input');fire(c.r,'change')}if(c.rpe){if(CFG.rpeTaps)chips(c.rpe);else c.rpe.focus()}});box.appendChild(b)}
    cur.parentNode.insertBefore(tr,cur.nextSibling)});
  if(obs)obs.takeRecords();
}
function chips(sel){var tr=sel.closest('tr');$a('.ux-chiprow',box).forEach(function(x){x.remove()});
  var row=el('tr','ux-chiprow'),td=el('td');td.colSpan=4;row.appendChild(td);var wrap=el('div','ux-chips');td.appendChild(wrap);
  Array.prototype.forEach.call(sel.options,function(o){if(!o.value)return;var b=el('button','ux-chip'+(o.value===sel.value?' on':''),esc(o.text));b.type='button';noBlur(b);
    b.addEventListener('click',function(){sel.value=o.value;row.remove();fire(sel,'change');setTimeout(decorate,30)});wrap.appendChild(b)});
  var after=tr.nextElementSibling&&tr.nextElementSibling.classList.contains('ux-help')?tr.nextElementSibling:tr;after.parentNode.insertBefore(row,after.nextSibling);if(obs)obs.takeRecords()}
function watch(){box=$q('#blocks')||$q('#exlist');if(!box)return;obs=new MutationObserver(function(){requestAnimationFrame(decorate)});obs.observe(box,{childList:true,subtree:true});decorate()}
/* ---------- 2. session done screen ---------- */
var snap=null;
function title(){var t=$q('#dayTitle')||$q('#wTitle');return t?t.textContent:''}
function startKey(){return 'ux-start-'+location.pathname+'|'+title()}
document.addEventListener('input',function(e){if(e.target&&e.target.dataset&&e.target.dataset.k){try{if(!sessionStorage.getItem(startKey()))sessionStorage.setItem(startKey(),String(Date.now()))}catch(x){}}},true);
function nextUp(){var tabs=$a('#dayTabs [data-day]');if(tabs.length){var i=tabs.findIndex(function(b){return b.getAttribute('aria-selected')==='true'});
    for(var k=1;k<=tabs.length;k++){var b=tabs[(i+k)%tabs.length];if(!/done/i.test(b.textContent))return Array.prototype.map.call(b.children,function(c){return c.textContent.trim()}).filter(Boolean).join(' \u00b7 ')||b.textContent.trim()}return 'Every session this week is done'}
  var w=$a('#tabs [data-tab^="w"]');if(w.length>1){var s=w.find(function(b){return b.getAttribute('aria-selected')!=='true'});return s?s.textContent:''}return ''}
document.addEventListener('click',function(e){if(!e.target.closest||!e.target.closest('#finish'))return;
  var t=function(id){var x=$q('#'+id);return x?x.textContent:''};var st=null;try{st=Number(sessionStorage.getItem(startKey()))}catch(x){}
  snap={title:title(),sets:t('liveSets'),on:t('liveOn'),rpe:t('liveRpe'),circ:$a('#rounds .round.done').length,start:st,next:nextUp()};
  setTimeout(function(){var s=$q('#status');if(s&&/saved/i.test(s.textContent)){try{sessionStorage.removeItem(startKey())}catch(x){}done(snap)}},60)},true);
function done(sp){var mins=sp.start?Math.max(1,Math.round((Date.now()-sp.start)/60000)):null,cells=[];
  if(sp.sets)cells.push(['Sets',sp.sets]);if(sp.circ)cells.push(['Circuits',sp.circ]);if(sp.on&&sp.on!=='–')cells.push(['On target',sp.on]);if(sp.rpe&&sp.rpe!=='–')cells.push(['Avg RPE',sp.rpe]);if(mins)cells.push(['Time',mins+' min']);
  var o=el('div','ux-done');o.setAttribute('role','dialog');o.setAttribute('aria-label','Session done');
  o.innerHTML='<div class="ux-done-in"><div class="ux-kick">Session done</div><div class="ux-h">'+esc(sp.title||'Nice work')+'</div><div class="ux-bar"></div>'+
   '<div class="ux-cells">'+cells.slice(0,4).map(function(c){return '<div><span>'+c[0]+'</span><b>'+esc(c[1])+'</b></div>'}).join('')+'</div>'+
   (sp.next?'<div class="ux-next"><span>Next up</span><b>'+esc(sp.next)+'</b></div>':'')+
   '<button type="button" class="ux-btn y" data-x="bests">See my bests</button><button type="button" class="ux-btn" data-x="close">Done</button></div>';
  document.body.appendChild(o);o.addEventListener('click',function(e){var b=e.target.closest('[data-x]');if(!b&&e.target!==o)return;o.remove();if(b&&b.dataset.x==='bests')bests()});window.scrollTo(0,0)}
/* ---------- 3. my bests ---------- */
function points(){var P=[];function push(e,date,w,r){if(w==null||r==null||!date)return;P.push({id:e.id,name:e.name,u:(typeof wtInfo==='function'?wtInfo(e).u:'kg'),date:date,w:w,r:r})}
  try{if(CFG.family==='dan'){Object.keys(S.finished).forEach(function(k){var m=k.match(/^w(\d+)-s(\d+)$/);if(!m)return;var d=SESSIONS[+m[2]];if(!d)return;d.blocks.forEach(function(b){b.ex.forEach(function(e){if(!e.inc||e.max)return;((S.logs[k]||{})[e.id]||[]).forEach(function(s){if(isDone(e,s))push(e,S.finished[k],n(s.w),n(s.r))})})})})}
  else if(CFG.family==='pure'){Object.keys(S.finished).forEach(function(k){var m=k.match(/^p(\d+)-w(\d+)-d(\d+)$/);if(!m)return;var ph=PLAN.phases.find(function(p){return p.id===+m[1]});var d=ph&&ph.days&&ph.days[+m[3]];if(!d)return;
      d.blocks.forEach(function(b){b.ex.forEach(function(e){if(!e.inc||e.max||e.band||e.secs)return;((S.logs[k]||{})[e.id]||[]).forEach(function(s){var ok=typeof isDone==='function'?isDone(e,s):setDone(s);if(ok)push(e,S.finished[k],n(s.w),n(s.r))})})})})}
  else if(CFG.family==='harry'){S.history.forEach(function(h){WORKOUTS[h.workout].ex.forEach(function(x0){var e=ex(x0,h);if(!e.inc)return;((h.logs||{})[e.id]||[]).forEach(function(s){if(s&&n(s.r)!=null&&n(s.rpe)!=null)push(e,h.date,n(s.w),n(s.r))})})})}
  else if(CFG.family==='kevin'){S.history.forEach(function(h){WORKOUTS[h.workout].ex.forEach(function(e){if(e.load!=='kg')return;(h.rounds||[]).forEach(function(r){var x=r.ex[e.id]||{};push(e,h.date,n(x.w),x.r?n(x.r):e.reps)})})})}}catch(err){}
  return P}
function spark(list){if(list.length<2)return '';var W=140,H=40,ws=list.map(function(p){return p.w}),mn=Math.min.apply(null,ws),mx=Math.max.apply(null,ws);if(mx===mn){mn-=1;mx+=1}
  var pts=list.map(function(p,i){return [(i/(list.length-1))*(W-8)+4,H-4-(p.w-mn)/(mx-mn)*(H-8)]});
  return '<svg class="ux-spark" viewBox="0 0 '+W+' '+H+'" aria-hidden="true"><polyline fill="none" stroke="#FFD900" stroke-width="3" points="'+pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1)}).join(' ')+'"/><circle cx="'+pts[pts.length-1][0].toFixed(1)+'" cy="'+pts[pts.length-1][1].toFixed(1)+'" r="4.5" fill="#FFD900"/></svg>'}
function nice(iso){var p=String(iso).split('-');return new Date(+p[0],+p[1]-1,+p[2],12).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
function bests(){var P=points(),by={};P.forEach(function(p){(by[p.id]=by[p.id]||{name:p.name,u:p.u,rows:[]}).rows.push(p)});
  var items=Object.keys(by).map(function(id){var g=by[id],best=g.rows.reduce(function(a,p){return (p.w>a.w||(p.w===a.w&&p.r>a.r))?p:a});
    var perDay={};g.rows.forEach(function(p){if(!perDay[p.date]||p.w>perDay[p.date].w)perDay[p.date]=p});var line=Object.keys(perDay).sort().map(function(d){return perDay[d]});
    var gain=line.length>1?best.w-line[0].w:0;return {name:g.name,u:g.u,best:best,line:line,gain:gain,first:line[0]}}).sort(function(a,b){return b.gain-a.gain||a.name.localeCompare(b.name)});
  var o=el('div','ux-done');o.setAttribute('role','dialog');o.setAttribute('aria-label','My bests');
  o.innerHTML='<div class="ux-done-in"><div class="ux-top"><div><div class="ux-kick">Progress</div><div class="ux-h">My bests</div></div><button type="button" class="ux-close" data-x="close">Close</button></div><div class="ux-bar"></div>'+
   (items.length?items.map(function(it){return '<div class="ux-best"><div class="ux-bn"><b>'+esc(it.name)+'</b><span>Best '+f1(it.best.w)+esc(it.u)+' × '+it.best.r+' · '+nice(it.best.date)+(it.gain>0?' · <em>+'+f1(it.gain)+'kg since '+nice(it.first.date)+'</em>':'')+'</span></div>'+spark(it.line)+'</div>'}).join(''):
    '<p class="ux-empty">Finish a session with weights logged and your bests appear here. The line for each lift grows every time you train.</p>')+
   '<button type="button" class="ux-btn" data-x="close">Close</button></div>';
  document.body.appendChild(o);o.addEventListener('click',function(e){if(e.target.closest('[data-x]')||e.target===o)o.remove()})}
function bestsButton(){var anchor=$q('#blocks')||$q('#exlist')||$q('#rounds');if(!anchor||$q('.ux-bests-btn'))return;var b=el('button','ux-bests-btn','<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 20h18M5 16l5-5 4 4 6-7" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>My bests &amp; progress');b.type='button';b.addEventListener('click',bests);anchor.parentNode.insertBefore(b,anchor)}
/* ---------- 4. add to home screen (personal pages only) ---------- */
var ICON='data:image/png;base64,__ICON__';
function homeSetup(){try{$a('link[rel="apple-touch-icon"],link[rel="apple-touch-icon-precomposed"]').forEach(function(l){l.remove()});var h=document.head;
  var l=document.createElement('link');l.rel='apple-touch-icon';l.href=ICON;h.appendChild(l);
  [['apple-mobile-web-app-capable','yes'],['mobile-web-app-capable','yes'],['apple-mobile-web-app-title','Macro Golf'],['apple-mobile-web-app-status-bar-style','black']].forEach(function(m){var x=document.createElement('meta');x.name=m[0];x.content=m[1];h.appendChild(x)})}catch(e){}
  var standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone;if(standalone)return;
  var ua=navigator.userAgent,ios=/iPhone|iPad|iPod/.test(ua),android=/Android/.test(ua);if(!ios&&!android)return;
  try{if(localStorage.getItem('ux-a2hs-off'))return}catch(e){}
  var deferred=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e});
  setTimeout(function(){var c=el('div','ux-a2hs');c.setAttribute('role','dialog');c.setAttribute('aria-label','Add to home screen');
    c.innerHTML='<img src="'+ICON+'" alt=""><div class="ux-a2hs-t"><b>Add your plan to your home screen</b><span>'+(ios?'Tap the Share button <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg> at the bottom of Safari, then <b>Add to Home Screen</b>.':'Tap the <b>⋮</b> menu at the top of Chrome, then <b>Add to Home screen</b>.')+' It opens full screen like an app.</span></div>'+
     '<div class="ux-a2hs-b">'+(android?'<button type="button" data-x="install" class="ux-btn y">Add</button>':'')+'<button type="button" data-x="off" class="ux-close">Not now</button></div>';
    document.body.appendChild(c);c.addEventListener('click',function(e){var b=e.target.closest('[data-x]');if(!b)return;
      if(b.dataset.x==='install'&&deferred){deferred.prompt();deferred=null}try{localStorage.setItem('ux-a2hs-off','1')}catch(x){}c.remove()})},2500)}
function pbTab(){if(document.querySelector('.ux-pbtab'))return;var b=el('button','ux-pbtab','<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0V4zM5 5H3v2a4 4 0 0 0 4 4M19 5h2v2a4 4 0 0 1-4 4M9 15h6l1 5H8l1-5z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>My PBs');b.type='button';b.setAttribute('aria-label','See my personal bests');b.addEventListener('click',bests);document.body.appendChild(b)}
return {init:function(o){for(var k in o)CFG[k]=o[k];watch();bestsButton();pbTab();if(CFG.home)homeSetup()},bests:bests,decorate:decorate,points:points};
})();
