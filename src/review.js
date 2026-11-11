/* My week / month in review: an on-screen report plus a PDF download.
   Load after the tracker script and ux.js:  <script src="{{BASE}}src/review.js"></script>
   Adds a "My review" tab beside "My PBs" and a button inside the bests screen. */
var MGReview=(function(){
var PLANS={'pure-muscle-strength-gym':'Pure Muscle & Strength · Gym','pure-muscle-strength-home':'Pure Muscle & Strength · Home',
  'pure-power-gym':'Pure Power · Gym','pure-power-home':'Pure Power · Home','pure-sequencing-gym':'Pure Sequencing · Gym','pure-sequencing-home':'Pure Sequencing · Home'};
var LIBS=['https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js','https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'];
var view={type:'week',off:0};

/* ---------- helpers ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function num(v){var x=parseFloat(v);return isNaN(x)?null:x}
function f1(x){return (Math.round(x*10)/10).toString()}
function big(x){return Math.round(x).toLocaleString('en-GB')}
function pd(s){var p=String(s).slice(0,10).split('-');return new Date(+p[0],+p[1]-1,+p[2],12)}
function iso(d){var m=d.getMonth()+1,dd=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(dd<10?'0':'')+dd}
function addD(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x}
function fmt(d,o){return d.toLocaleDateString('en-GB',o||{day:'numeric',month:'short'})}
function family(){if(typeof PLAN!=='undefined')return 'pure';if(typeof SESSIONS!=='undefined')return 'dan';
  if(typeof WORKOUTS!=='undefined'&&window.S&&Array.isArray(S.history))return (S.history.some(function(h){return h&&h.rounds})||typeof CLIENT!=='undefined'&&CLIENT.defaultRounds)?'kevin':'harry';return ''}
function pageId(){var s=document.querySelector('script[data-page]');return s?s.getAttribute('data-page'):''}
function who(){var n='';try{n=(window.S&&(S.player||S.name))||localStorage.getItem('mgsync-pname:'+(typeof KEY!=='undefined'?KEY:''))||(typeof CLIENT!=='undefined'&&CLIENT.name)||''}catch(e){}
  if(n&&n.charAt(0)==='"')try{n=JSON.parse(n)}catch(e){}return n}
function planName(){var p=pageId();return PLANS[p]||(typeof CLIENT!=='undefined'?'1-to-1 Training Plan':'Training Plan')}
function unit(e){try{return typeof wtInfo==='function'?wtInfo(e).u:'kg'}catch(x){return 'kg'}}
function setOk(e,s){try{if(typeof isDone==='function')return isDone(e,s);if(typeof setDone==='function')return setDone(s)}catch(x){}return !!s&&num(s.r)!=null}

/* ---------- every finished session as one row ---------- */
function sessions(){var out=[],fam=family();
  function base(date,title){return {date:String(date).slice(0,10),title:title,sets:0,vol:0,rpe:[],u:'kg',lifts:[]}}
  function log(row,e,s,weighted){row.sets++;var w=num(s.w),r=num(s.r),rp=num(s.rpe);if(rp!=null)row.rpe.push(rp);
    if(weighted&&w!=null&&r!=null&&w>0){row.vol+=w*r;row.u=unit(e);row.lifts.push({id:e.id,name:e.name,w:w,r:r,u:unit(e),date:row.date})}}
  try{
    if(fam==='dan'||fam==='pure')Object.keys(S.finished||{}).forEach(function(k){var d,label='',date=S.finished[k];if(typeof date!=='string')return;
      if(fam==='dan'){var m=k.match(/^w(\d+)-s(\d+)$/);if(!m)return;d=SESSIONS[+m[2]];label='Week '+m[1]}
      else{var m2=k.match(/^p(\d+)-w(\d+)-d(\d+)$/);if(!m2)return;var ph=PLAN.phases.find(function(p){return p.id===+m2[1]});d=ph&&ph.days&&ph.days[+m2[3]];label='Week '+m2[2]+' · '+(d&&d.name||'')}
      if(!d)return;var row=base(date,d.title||d.name);row.sub=label;
      d.blocks.forEach(function(b){b.ex.forEach(function(e){((S.logs[k]||{})[e.id]||[]).forEach(function(s){if(setOk(e,s))log(row,e,s,!!e.inc&&!e.max&&!e.band&&!e.secs)})})});out.push(row)});
    else if(fam==='harry')(S.history||[]).forEach(function(h){var W=WORKOUTS[h.workout];if(!W||!h.date)return;var row=base(h.date,W.title||W.name);row.sub=W.name;
      W.ex.forEach(function(x0){var e=typeof ex==='function'?ex(x0,h):x0;((h.logs||{})[e.id]||[]).forEach(function(s){if(s&&num(s.r)!=null&&num(s.rpe)!=null)log(row,e,s,!!e.inc)})});out.push(row)});
    else if(fam==='kevin')(S.history||[]).forEach(function(h){var W=WORKOUTS[h.workout];if(!W||!h.date)return;var row=base(h.date,W.title||W.name);row.sub=W.name;row.rounds=0;
      (h.rounds||[]).forEach(function(r){if(!r||r.done===false)return;row.rounds++;W.ex.forEach(function(e){var x=(r.ex||{})[e.id]||{};var s={w:x.w,r:x.r||e.reps};if(x.w||x.r||e.load!=='kg')log(row,e,s,e.load==='kg')})});
      if(num(h.energy)!=null)row.energy=num(h.energy);out.push(row)});
  }catch(err){}
  return out.sort(function(a,b){return a.date<b.date?-1:1})}

/* ---------- periods ---------- */
function period(type,off){var t=new Date();t.setHours(12,0,0,0);var s,e,label;
  if(type==='week'){s=addD(t,-((t.getDay()+6)%7)+off*7);e=addD(s,7);var l=addD(e,-1);
    label=s.getMonth()===l.getMonth()?s.getDate()+'–'+fmt(l,{day:'numeric',month:'long',year:'numeric'}):fmt(s,{day:'numeric',month:'short'})+' – '+fmt(l,{day:'numeric',month:'short',year:'numeric'})}
  else{s=new Date(t.getFullYear(),t.getMonth()+off,1,12);e=new Date(s.getFullYear(),s.getMonth()+1,1,12);label=fmt(s,{month:'long',year:'numeric'})}
  return {type:type,s:iso(s),e:iso(e),start:s,label:label}}
function inP(d,p){return d>=p.s&&d<p.e}
function totals(rows){var t={n:rows.length,sets:0,vol:0,rpe:[],rounds:0,days:{}};rows.forEach(function(r){t.sets+=r.sets;t.vol+=r.vol;t.rpe=t.rpe.concat(r.rpe);t.rounds+=r.rounds||0;t.days[r.date]=1});
  t.avg=t.rpe.length?t.rpe.reduce(function(a,b){return a+b},0)/t.rpe.length:null;return t}
function weekStreak(all,p){var wk={};all.forEach(function(r){var d=pd(r.date);wk[iso(addD(d,-((d.getDay()+6)%7)))]=1});
  var end=addD(pd(p.e),-1),now=new Date();now.setHours(12,0,0,0);if(end>now)end=now;var c=addD(end,-((end.getDay()+6)%7)),n=0;while(wk[iso(c)]){n++;c=addD(c,-7)}return n}

/* ---------- build the report ---------- */
function data(type,off){var all=sessions(),p=period(type,off),prev=period(type,off-1);
  var rows=all.filter(function(r){return inP(r.date,p)}),before=all.filter(function(r){return r.date<p.s});
  var T=totals(rows),P=totals(all.filter(function(r){return inP(r.date,prev)}));
  var lifts={};rows.forEach(function(r){r.lifts.forEach(function(l){var g=lifts[l.id]=lifts[l.id]||{name:l.name,u:l.u,best:null};if(!g.best||l.w>g.best.w||(l.w===g.best.w&&l.r>g.best.r))g.best=l})});
  var prior={};before.forEach(function(r){r.lifts.forEach(function(l){var b=prior[l.id];if(!b||l.w>b.w||(l.w===b.w&&l.r>b.r))prior[l.id]=l})});
  var line={};all.forEach(function(r){if(r.date>=p.e)return;r.lifts.forEach(function(l){var d=(line[l.id]=line[l.id]||{});if(!d[r.date]||l.w>d[r.date].w)d[r.date]=l})});
  var list=Object.keys(lifts).map(function(id){var g=lifts[id],pr=prior[id],pts=Object.keys(line[id]||{}).sort().map(function(d){return line[id][d]}).slice(-12);
    var pb=pr&&(g.best.w>pr.w||(g.best.w===pr.w&&g.best.r>pr.r));return {name:g.name,u:g.u,best:g.best,prior:pr,pb:pb,gain:pr?g.best.w-pr.w:0,first:!pr,line:pts}})
    .sort(function(a,b){return (b.pb-a.pb)||(b.gain-a.gain)||a.name.localeCompare(b.name)});
  return {p:p,prev:prev,rows:rows,T:T,P:P,lifts:list,streak:weekStreak(all,p),fam:family()}}

function spark(list){if(list.length<2)return '';var W=120,H=34,ws=list.map(function(p){return p.w}),mn=Math.min.apply(null,ws),mx=Math.max.apply(null,ws);if(mx===mn){mn-=1;mx+=1}
  var pts=list.map(function(p,i){return [(i/(list.length-1))*(W-8)+4,H-4-(p.w-mn)/(mx-mn)*(H-8)]}),L=pts[pts.length-1];
  return '<svg class="rv-spark" viewBox="0 0 '+W+' '+H+'" aria-hidden="true"><polyline fill="none" stroke="#0B0B0B" stroke-width="2.5" points="'+pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1)}).join(' ')+'"/><circle cx="'+L[0].toFixed(1)+'" cy="'+L[1].toFixed(1)+'" r="4.5" fill="#FFD900" stroke="#0B0B0B" stroke-width="2"/></svg>'}
function delta(a,b,word){if(b==null||a==null)return '';var d=a-b;if(Math.abs(d)<0.05)return '<i class="rv-d">Same as last '+word+'</i>';
  return '<i class="rv-d '+(d>0?'up':'dn')+'">'+(d>0?'▲ +':'▼ ')+(Math.abs(d)>=100?big(d):f1(d))+' vs last '+word+'</i>'}
function cal(D){var p=D.p,days=D.T.days,h='';
  if(p.type==='week'){h='<div class="rv-week">';for(var i=0;i<7;i++){var d=addD(p.start,i),k=iso(d);h+='<div class="'+(days[k]?'on':'')+'"><span>'+'MTWTFSS'.charAt(i)+'</span><b>'+d.getDate()+'</b></div>'}return h+'</div>'}
  h='<div class="rv-month">'+'MTWTFSS'.split('').map(function(c){return '<span>'+c+'</span>'}).join('');var lead=(p.start.getDay()+6)%7;for(var j=0;j<lead;j++)h+='<i></i>';
  for(var d2=new Date(p.start);iso(d2)<p.e;d2=addD(d2,1))h+='<b class="'+(days[iso(d2)]?'on':'')+'">'+d2.getDate()+'</b>';return h+'</div>'}
function headline(D){var n=D.T.n,w=D.p.type,pn=D.P.n;
  if(!n)return 'No sessions logged this '+w+' yet. One session gets the ball rolling.';
  var s=n+' session'+(n>1?'s':'')+' this '+w;if(n>pn)s+=', up from '+pn+'.';else if(n===pn)s+=', matching last '+w+'.';else s+='.';
  var pbs=D.lifts.filter(function(l){return l.pb}).length;if(pbs)s+=' '+pbs+' new personal best'+(pbs>1?'s':'')+'.';
  if(D.streak>1)s+=' '+D.streak+' weeks in a row with training logged.';return s}

function sheet(D){var T=D.T,P=D.P,w=D.p.type,name=who(),kevin=D.fam==='kevin';
  var tiles=[['Sessions',T.n,delta(T.n,P.n,w)],[kevin?'Rounds':'Sets done',kevin?T.rounds:T.sets,delta(kevin?T.rounds:T.sets,kevin?P.rounds:P.sets,w)],
    ['Kg lifted',T.vol?big(T.vol):'0',delta(T.vol,P.vol,w)],
    T.avg!=null?['Avg RPE',f1(T.avg),P.avg!=null?delta(T.avg,P.avg,w):'']:['Week streak',D.streak,'']];
  var pbs=D.lifts.filter(function(l){return l.pb}),more=pbs.length>8?pbs.length-8:0,top=D.lifts.filter(function(l){return !l.pb}).slice(0,8);pbs=pbs.slice(0,8);
  return '<div class="rv-sheet">'+
   '<div class="rv-hd"><div class="rv-brand">MACRO GOLF</div><div class="rv-kick">My '+w+' in review</div><div class="rv-title">'+esc(D.p.label)+'</div>'+
   '<div class="rv-who">'+(name?esc(name)+' · ':'')+esc(planName())+'</div></div><div class="rv-bar"></div>'+
   '<p class="rv-lead">'+esc(headline(D))+'</p>'+
   '<div class="rv-tiles">'+tiles.map(function(t){return '<div><span>'+t[0]+'</span><b>'+t[1]+'</b>'+t[2]+'</div>'}).join('')+'</div>'+
   '<h3>Training days</h3>'+cal(D)+
   (pbs.length?'<h3>New personal bests</h3><div class="rv-pbs">'+pbs.map(function(l){return '<div><b>'+esc(l.name)+'</b><span>'+f1(l.best.w)+esc(l.u)+' × '+l.best.r+(l.gain>0?' <em>+'+f1(l.gain)+esc(l.u)+'</em>':' <em>more reps</em>')+'</span></div>'}).join('')+(more?'<p class="rv-more">+ '+more+' more personal best'+(more>1?'s':'')+' this '+w+'</p>':'')+'</div>':'')+
   (top.length?'<h3>'+(pbs.length?'Other lifts':'Lifts')+' this '+w+'</h3><div class="rv-lifts">'+top.map(function(l){return '<div class="rv-lift"><div><b>'+esc(l.name)+'</b><span>Top set '+f1(l.best.w)+esc(l.u)+' × '+l.best.r+
     (l.first?' · first time logged':l.pb?' · <em>PB</em>':' · best '+f1(l.prior.w)+esc(l.u))+'</span></div>'+spark(l.line)+'</div>'}).join('')+'</div>':'')+
   '<h3>Sessions</h3>'+(D.rows.length?'<table class="rv-tab"><thead><tr><th>Date</th><th>Session</th><th>'+(kevin?'Rounds':'Sets')+'</th><th>Kg</th></tr></thead><tbody>'+
     D.rows.map(function(r){return '<tr><td>'+fmt(pd(r.date),{weekday:'short',day:'numeric',month:'short'})+'</td><td><b>'+esc(r.title)+'</b>'+(r.sub?'<span>'+esc(r.sub)+'</span>':'')+'</td><td>'+(kevin?r.rounds:r.sets)+'</td><td>'+(r.vol?big(r.vol):'–')+'</td></tr>'}).join('')+'</tbody></table>'
     :'<p class="rv-empty">Nothing logged in this '+w+'. Finish a session and it shows up here.</p>')+
   '<div class="rv-ft"><span>Made '+fmt(new Date(),{day:'numeric',month:'short',year:'numeric'})+'</span><span>macro.golf</span></div></div>'}

/* ---------- overlay ---------- */
function open(type){if(type)view={type:type,off:0};close();var o=document.createElement('div');o.className='rv-wrap';o.setAttribute('role','dialog');o.setAttribute('aria-label','My review');
  o.innerHTML='<div class="rv-in"><div class="rv-bar2"><div class="rv-seg" role="tablist"><button type="button" role="tab" data-t="week">Week</button><button type="button" role="tab" data-t="month">Month</button></div>'+
   '<button type="button" class="rv-x" data-x="close">Close</button></div><div class="rv-nav"><button type="button" data-n="-1" aria-label="Previous">‹</button><b></b><button type="button" data-n="1" aria-label="Next">›</button></div>'+
   '<div class="rv-body"></div><button type="button" class="rv-pdf" data-x="pdf"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 19h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>Download PDF</button>'+
   '<p class="rv-msg" aria-live="polite"></p></div>';
  document.body.appendChild(o);document.documentElement.classList.add('rv-lock');
  o.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.x==='close')close();else if(b.dataset.x==='pdf')pdf(b);
    else if(b.dataset.t){view={type:b.dataset.t,off:0};paint()}else if(b.dataset.n){view.off=Math.min(0,view.off+(+b.dataset.n));paint()}});
  o.addEventListener('keydown',function(e){if(e.key==='Escape')close()});paint();o.querySelector('[data-x=close]').focus()}
function paint(){var o=document.querySelector('.rv-wrap');if(!o)return;var D=data(view.type,view.off);
  o.querySelectorAll('[data-t]').forEach(function(b){b.setAttribute('aria-selected',b.dataset.t===view.type)});
  o.querySelector('.rv-nav b').textContent=view.off===0?(view.type==='week'?'This week':'This month'):D.p.label;o.querySelector('[data-n="1"]').disabled=view.off===0;
  o.querySelector('.rv-body').innerHTML=sheet(D);o.querySelector('.rv-msg').textContent='';o._D=D}
function close(){var o=document.querySelector('.rv-wrap');if(o)o.remove();document.documentElement.classList.remove('rv-lock')}

/* ---------- PDF ---------- */
function load(u){return new Promise(function(ok,no){var s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
function libs(){if(window.html2canvas&&window.jspdf)return Promise.resolve();return LIBS.reduce(function(p,u){return p.then(function(){return load(u)})},Promise.resolve())}
function pdf(btn){var o=document.querySelector('.rv-wrap'),msg=o.querySelector('.rv-msg'),D=o._D;btn.disabled=true;var lab=btn.lastChild.textContent;btn.lastChild.textContent='Making your PDF…';msg.textContent='';
  var box=document.createElement('div');box.className='rv-print';box.innerHTML=sheet(D);document.body.appendChild(box);
  var fname='Macro-Golf-'+(D.p.type==='week'?'week-':'month-')+D.p.s+'.pdf';
  libs().then(function(){return (document.fonts&&document.fonts.ready||Promise.resolve())}).then(function(){return html2canvas(box.firstChild,{scale:2,backgroundColor:'#F4F1EA',useCORS:true,logging:false})}).then(function(cv){
    var cuts=breaks(box.firstChild,cv.height/box.firstChild.offsetHeight);var J=window.jspdf.jsPDF,doc=new J({unit:'mm',format:'a4',orientation:'portrait'}),pw=210,ph=297,pxPerMm=cv.width/pw,pagePx=Math.floor(ph*pxPerMm),y=0,first=true;
    while(y<cv.height){var pad=first?0:10,room=pagePx-Math.round(pad*pxPerMm),h=Math.min(room,cv.height-y);if(y+h<cv.height){var ok=cuts.filter(function(c){return c>y+room*0.5&&c<=y+room});if(ok.length)h=ok[ok.length-1]-y}var c=document.createElement('canvas');c.width=cv.width;c.height=h;var g=c.getContext('2d');g.fillStyle='#F4F1EA';g.fillRect(0,0,c.width,h);g.drawImage(cv,0,y,cv.width,h,0,0,cv.width,h);
      if(!first)doc.addPage();doc.setFillColor(244,241,234);doc.rect(0,0,pw,ph,'F');doc.addImage(c.toDataURL('image/jpeg',0.92),'JPEG',0,pad,pw,h/pxPerMm);first=false;y+=h}
    doc.setProperties({title:'Macro Golf · My '+D.p.type+' in review · '+D.p.label});return deliver(doc.output('blob'),fname,msg)})
  .catch(function(){msg.textContent='Could not make the PDF here. Take a screenshot of the review instead, or try again on Wi-Fi.'})
  .then(function(){box.remove();btn.disabled=false;btn.lastChild.textContent=lab})}
function breaks(root,k){var top=root.getBoundingClientRect().top,out=[];root.querySelectorAll('.rv-sheet > *, .rv-pbs > div, .rv-lift, .rv-tab tr, .rv-month b, .rv-tiles > div').forEach(function(e){var r=e.getBoundingClientRect(),hd=e.tagName==='H3'||!!e.closest('thead');out.push(Math.round((r.top-top)*k));if(!hd)out.push(Math.round((r.bottom-top)*k))});var no=[];root.querySelectorAll('h3').forEach(function(h){var n=h.nextElementSibling,a=h.getBoundingClientRect().top-top,z=n?n.getBoundingClientRect().top-top+70:a;no.push([Math.round(a*k)+1,Math.round(z*k)])});
  return out.filter(function(c){return !no.some(function(r){return c>=r[0]&&c<=r[1]})}).sort(function(a,b){return a-b})}
function deliver(blob,fname,msg){var file;try{file=new File([blob],fname,{type:'application/pdf'})}catch(e){}
  var touch=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
  if(touch&&file&&navigator.canShare&&navigator.canShare({files:[file]}))return navigator.share({files:[file],title:fname}).then(function(){msg.textContent='Saved. Look for '+fname+'.'},function(e){if(e&&e.name==='AbortError')return;return save(blob,fname,msg)});
  return save(blob,fname,msg)}
function save(blob,fname,msg){var u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=fname;document.body.appendChild(a);a.click();a.remove();
  msg.innerHTML='Downloading '+esc(fname)+'. Nothing happened? <a href="'+u+'" target="_blank" rel="noopener">Open the PDF</a>.';setTimeout(function(){URL.revokeObjectURL(u)},120000)}

/* ---------- entry points ---------- */
function tab(){if(document.querySelector('.rv-tab-btn'))return;var b=document.createElement('button');b.type='button';b.className='rv-tab-btn';b.setAttribute('aria-label','My week or month in review');
  b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="16" height="15" stroke="currentColor" stroke-width="2.2"/><path d="M4 10h16M9 3v4M15 3v4" stroke="currentColor" stroke-width="2.2"/></svg>My review';
  b.addEventListener('click',function(){open()});document.body.appendChild(b);place()}
function place(){var b=document.querySelector('.rv-tab-btn'),pb=document.querySelector('.ux-pbtab');if(!b)return;if(pb){b.style.minWidth=pb.style.minWidth='';var w=Math.max(pb.offsetWidth,b.offsetWidth)+'px';b.style.minWidth=pb.style.minWidth=w;b.style.justifyContent=pb.style.justifyContent='center'}else b.style.bottom='calc(10px + env(safe-area-inset-bottom,0px))'}
function hookBests(){new MutationObserver(function(){var d=[].slice.call(document.querySelectorAll('.ux-done')).filter(function(x){return /My bests/.test(x.getAttribute('aria-label')||'')&&!x.querySelector('.rv-from')})[0];if(!d)return;
  var last=d.querySelector('.ux-done-in > .ux-btn:last-child');if(!last)return;var b=document.createElement('button');b.type='button';b.className='ux-btn y rv-from';b.textContent='My week & month review';
  b.addEventListener('click',function(e){e.stopPropagation();d.remove();open('week')});last.parentNode.insertBefore(b,last)}).observe(document.body,{childList:true})}
function css(){if(document.getElementById('rv-css'))return;var s=document.createElement('style');s.id='rv-css';s.textContent=CSS;document.head.appendChild(s)}
var CSS=[
'.rv-tab-btn{position:fixed;right:max(10px,env(safe-area-inset-right,0px));bottom:calc(64px + env(safe-area-inset-bottom,0px));z-index:37;display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:0 14px;border:0;border-top:3px solid #FFD900;background:#0B0B0B;color:#F4F1EA;font-family:Anton,Impact,sans-serif;font-size:17px;text-transform:uppercase;letter-spacing:.3px;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.35)}',
'.rv-tab-btn svg{color:#FFD900}.rv-tab-btn:focus-visible,.rv-wrap button:focus-visible{outline:3px solid #FFD900;outline-offset:2px}',
'html.rv-lock,html.rv-lock body{overflow:hidden}',
'.rv-wrap{position:fixed;inset:0;z-index:46;background:rgba(11,11,11,.97);overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(16px + env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) calc(28px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));font-family:Inter,system-ui,sans-serif}',
'.rv-in{max-width:620px;margin:0 auto;display:flex;flex-direction:column;gap:12px}',
'.rv-bar2{display:flex;justify-content:space-between;align-items:center;gap:10px}',
'.rv-seg{display:flex;border:1px solid rgba(244,241,234,.3)}.rv-seg button{min-height:44px;min-width:86px;border:0;background:transparent;color:#F4F1EA;font-family:Anton,Impact,sans-serif;font-size:18px;text-transform:uppercase;cursor:pointer}',
'.rv-seg button[aria-selected=true]{background:#FFD900;color:#0B0B0B}',
'.rv-x{min-height:44px;padding:0 16px;background:transparent;border:1px solid rgba(244,241,234,.3);color:#F4F1EA;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}',
'.rv-nav{display:flex;align-items:center;justify-content:space-between;color:#F4F1EA}.rv-nav b{font-family:Anton,Impact,sans-serif;font-weight:400;font-size:20px;text-transform:uppercase}',
'.rv-nav button{width:48px;height:44px;border:1px solid rgba(244,241,234,.3);background:transparent;color:#FFD900;font-size:26px;line-height:1;cursor:pointer}.rv-nav button:disabled{opacity:.25;cursor:default}',
'.rv-pdf{display:flex;align-items:center;justify-content:center;gap:10px;min-height:56px;border:0;background:#FFD900;color:#0B0B0B;font-family:Anton,Impact,sans-serif;font-size:21px;text-transform:uppercase;cursor:pointer}.rv-pdf:disabled{opacity:.7}',
'.rv-msg{color:#cfcabd;font-size:14px;margin:0;text-align:center}.rv-msg a{color:#FFD900}',
'.rv-print{position:fixed;left:-10000px;top:0;width:760px}.rv-print .rv-sheet{font-size:15px}',
'.rv-sheet{background:#F4F1EA;color:#0B0B0B;font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.4;padding:0 0 18px}',
'.rv-hd{background:#0B0B0B;color:#F4F1EA;padding:22px 22px 20px}.rv-brand{font-family:Anton,Impact,sans-serif;font-size:15px;letter-spacing:3px;color:#F4F1EA;opacity:.85}',
'.rv-kick{margin-top:14px;font-weight:700;font-size:12px;letter-spacing:2.4px;text-transform:uppercase;color:#FFD900}',
'.rv-title{font-family:Anton,Impact,sans-serif;text-transform:uppercase;font-size:36px;line-height:1.02;margin-top:6px}',
'.rv-who{margin-top:8px;color:#bdb8ab;font-size:14px}.rv-bar{height:8px;background:#FFD900}',
'.rv-lead{margin:18px 22px 0;font-size:16px;font-weight:600;line-height:1.45}',
'.rv-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:rgba(11,11,11,.15);border:1px solid rgba(11,11,11,.15);margin:16px 22px 0}',
'.rv-tiles>div{background:#fff;padding:14px}.rv-tiles span{display:block;font-weight:700;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#6b675d}',
'.rv-tiles b{display:block;font-family:Anton,Impact,sans-serif;font-weight:400;font-size:36px;line-height:1;margin-top:8px}',
'.rv-d{display:block;font-style:normal;font-size:12px;font-weight:600;color:#6b675d;margin-top:6px}.rv-d.up{color:#1d7a3a}.rv-d.dn{color:#a3402b}',
'.rv-sheet h3{margin:22px 22px 10px;font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;font-size:20px;letter-spacing:.3px;border-left:6px solid #FFD900;padding-left:10px;line-height:1.1}',
'.rv-week{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:0 22px}.rv-week div{background:#fff;border:1px solid rgba(11,11,11,.15);text-align:center;padding:8px 0}',
'.rv-week span{display:block;font-size:11px;font-weight:700;color:#6b675d}.rv-week b{display:block;font-family:Anton,Impact,sans-serif;font-weight:400;font-size:20px;margin-top:2px}',
'.rv-week .on{background:#0B0B0B;border-color:#0B0B0B;color:#FFD900}.rv-week .on span{color:#F4F1EA}',
'.rv-month{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:0 22px}.rv-month span{text-align:center;font-size:11px;font-weight:700;color:#6b675d}',
'.rv-month b{display:flex;align-items:center;justify-content:center;height:34px;background:#fff;border:1px solid rgba(11,11,11,.12);font-weight:600;font-size:13px}.rv-month b.on{background:#0B0B0B;color:#FFD900;border-color:#0B0B0B}',
'.rv-pbs{margin:0 22px;display:grid;gap:6px}.rv-pbs div{background:#0B0B0B;color:#F4F1EA;padding:12px 14px;display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap}',
'.rv-pbs b{font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;font-size:18px}.rv-pbs span{font-weight:600}.rv-pbs em{font-style:normal;color:#FFD900;margin-left:6px}',
'.rv-lifts{margin:0 22px;background:#fff;border:1px solid rgba(11,11,11,.15)}.rv-lift{display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid rgba(11,11,11,.1)}.rv-lift:last-child{border-bottom:0}',
'.rv-lift>div{flex:1;min-width:0}.rv-lift b{display:block;font-weight:700;font-size:15px}.rv-lift span{display:block;font-size:13px;color:#6b675d;margin-top:2px}.rv-lift em{font-style:normal;font-weight:700;color:#0B0B0B;background:#FFD900;padding:0 5px}',
'.rv-more{margin:4px 0 0;font-weight:700;font-size:13px;color:#0B0B0B}',
'.rv-spark{width:110px;height:32px;flex-shrink:0}',
'.rv-tab{width:calc(100% - 44px);margin:0 22px;border-collapse:collapse;background:#fff;border:1px solid rgba(11,11,11,.15)}',
'.rv-tab th{text-align:left;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#6b675d;padding:9px 10px;border-bottom:2px solid #0B0B0B}',
'.rv-tab td{padding:9px 10px;border-bottom:1px solid rgba(11,11,11,.1);vertical-align:top;font-size:13.5px}.rv-tab td b{display:block}.rv-tab td span{display:block;font-size:12px;color:#6b675d}',
'.rv-tab th:nth-child(n+3),.rv-tab td:nth-child(n+3){text-align:right;white-space:nowrap}',
'.rv-empty{margin:0 22px;color:#6b675d}',
'.rv-ft{display:flex;justify-content:space-between;margin:22px 22px 0;padding-top:10px;border-top:1px solid rgba(11,11,11,.2);font-size:12px;color:#6b675d;font-weight:600}',
'@media (min-width:560px){.rv-tiles{grid-template-columns:repeat(4,minmax(0,1fr))}.rv-print .rv-tiles{grid-template-columns:repeat(4,minmax(0,1fr))}}',
'.rv-print .rv-tiles{grid-template-columns:repeat(4,minmax(0,1fr))}',
'@media (max-width:380px){.rv-title{font-size:30px}}'
].join('');

/* In-app browsers (VidApp etc.) lay their own toolbar over the bottom of the page: lift our floating buttons above it. */
function inApp(){var u=navigator.userAgent||'';return (/iPhone|iPad|iPod/.test(u)&&!/Safari\//.test(u))||/; wv\)/.test(u)||/VidApp/i.test(u)||!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches)}
function lift(){if(!inApp())return;document.documentElement.classList.add('mg-inapp');var s=document.createElement('style');s.textContent=
 'html.mg-inapp .mgs-pill{bottom:calc(78px + env(safe-area-inset-bottom,0px))!important}'+
 'html.mg-inapp .ux-pbtab{bottom:calc(78px + env(safe-area-inset-bottom,0px))!important}'+
 'html.mg-inapp .rv-tab-btn{bottom:calc(132px + env(safe-area-inset-bottom,0px))!important}'+
 'html.mg-inapp body{padding-bottom:150px}'+
 'html.mg-inapp .rv-wrap,html.mg-inapp .mgv-wrap,html.mg-inapp .ux-done{padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))!important}';document.head.appendChild(s)}
function init(){if(!family())return;css();lift();tab();hookBests();setTimeout(place,300);window.addEventListener('resize',place)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else setTimeout(init,0);
return {open:open,data:data,sessions:sessions};
})();
