/* Macro Golf \u00b7 Predicted 1RM + progress on the home (Today) page, for training plans built from templates/.
   - Predicted 1RM (estimated one-rep max) for the main loaded lifts: Epley with reps in reserve from RPE,
     e1RM = kg x (1 + (reps + (10 - RPE)) / 30), only for sets of 1-12 reps. Shown under each lift in the Gym tab;
     a toast when today's sets beat the best from earlier sessions ("Predicted 1RM up").
   - "Your progress" card at the top of the Today page: sessions, kg lifted, sessions per week, kg per session,
     and predicted 1RM trends for the main lifts.
   Reads S.logs / S.finished and the plan's SESSIONS (exById). Stores nothing. Loaded by templates/parts/70-tail.html. */
var MGStats=(function(){
if(window.MGStats)return window.MGStats;
var MAIN=/squat|deadlift|\brdl\b|bench|press(?! up)|\brow\b|pull ?up|chin ?up|lunge|split squat|hip thrust|step up|lat pull|pull down|landmine/i,
    SKIP=/curl|raise|extension|fly|flye|band|banded|resistance|plank|carry|slam|throw|jump|hop|chop|rotation|pallof|push down|pushdown/i;
function n(v){var x=parseFloat(v);return isFinite(x)?x:null}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function r1(x){return Math.round(x*2)/2}
function f1(x){return (Math.round(x*10)/10).toString()}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function ex(id){try{return typeof exById==='function'?exById(id):null}catch(e){return null}}
function nameOf(id,e){var S=window.S;return (S&&S.swaps&&S.swaps.names&&S.swaps.names[id])||(e&&e.name)||''}
function eligible(e,id){if(!e||typeof e.inc!=='number'||e.max||e.unit==='s'||e.unit==='m')return false;var nm=nameOf(id,e);return MAIN.test(nm)&&!SKIP.test(nm)}
function e1(s){var w=n(s&&s.w),r=n(s&&s.r);if(!(w>0)||!(r>=1)||r>12)return null;var p=n(s.rpe),rir=p!=null&&p>=5&&p<=10?10-p:0;return w*(1+(r+rir)/30)}
/* every finished/logged session: {k, date, id -> best e1RM, kg (total load)} */
function sessions(){var S=window.S||{},out=[];Object.keys(S.logs||{}).forEach(function(k){var L=S.logs[k]||{},d=(S.finished||{})[k];var row={k:k,date:typeof d==='string'?d.slice(0,10):null,best:{},kg:0,sets:0};
  Object.keys(L).forEach(function(id){var e=ex(id);(L[id]||[]).forEach(function(s){if(!s)return;var w=n(s.w),r=n(s.r);if(w>0&&r>0&&e&&typeof e.inc==='number'&&e.unit!=='s'&&e.unit!=='m'){row.kg+=w*r}if(r>0)row.sets++;
    if(eligible(e,id)){var v=e1(s);if(v&&(!row.best[id]||v>row.best[id]))row.best[id]=v}})});
  if(row.sets)out.push(row)});
  out.sort(function(a,b){return (a.date||'9')<(b.date||'9')?-1:(a.date||'9')>(b.date||'9')?1:0});return out}

/* ---------- Gym tab: predicted 1RM under each main lift + "up" toast ---------- */
var told={};
function curKeySafe(){try{return curKey()}catch(e){return null}}
function bestBefore(id,k){var b=null;sessions().forEach(function(s){if(s.k!==k&&s.best[id]&&(!b||s.best[id]>b))b=s.best[id]});return b}
function nowBest(id,k){var L=((window.S||{}).logs||{})[k]||{},b=null;(L[id]||[]).forEach(function(s){var v=e1(s);if(v&&(!b||v>b))b=v});return b}
function decorate(){var k=curKeySafe();if(!k)return;var seen={};
  [].forEach.call(document.querySelectorAll('#blocks .ex'),function(card){var inp=card.querySelector('[data-k$="|w"]');if(!inp)return;var id=String(inp.dataset.k).split('|')[0];if(seen[id])return;seen[id]=1;
    var e=ex(id),box=card.querySelector('.p1rm');if(!eligible(e,id)){if(box)box.remove();return}
    var prev=bestBefore(id,k),cur=nowBest(id,k),html;
    if(cur){var up=prev&&cur>prev+0.25;html='<span>Predicted 1RM</span><b>'+f1(r1(cur))+' kg</b>'+(prev?(up?'<em class="up">\u25b2 '+f1(r1(cur-prev))+' kg on your best</em>':'<em>Best '+f1(r1(prev))+' kg</em>'):'<em>First estimate</em>')}
    else if(prev)html='<span>Predicted 1RM</span><b>'+f1(r1(prev))+' kg</b><em>Your best so far. Beat it today.</em>';
    else html='<span>Predicted 1RM</span><em>Log a set with kg, reps and RPE to see it.</em>';
    if(!box){box=document.createElement('div');box.className='p1rm';var t=card.querySelector('table.sets');(t&&t.parentNode===card?t:card.lastChild).insertAdjacentElement('afterend',box)}
    if(box.innerHTML!==html)box.innerHTML=html})}
function check(id){var k=curKeySafe();if(!k)return;var e=ex(id);if(!eligible(e,id))return;var prev=bestBefore(id,k),cur=nowBest(id,k);
  if(prev&&cur&&cur>prev+0.25){var key=k+'|'+id,last=told[key]||prev;if(cur>last+0.25){told[key]=cur;toast(nameOf(id,e),prev,cur)}}}
var q=[],busy=false;
function toast(nm,a,b){q.push([nm,a,b]);if(!busy)nextT()}
function nextT(){var x=q.shift();if(!x){busy=false;return}busy=true;showT(x[0],x[1],x[2])}
function showT(nm,a,b){css();var t=document.createElement('div');t.className='p1t';t.setAttribute('role','status');
  t.innerHTML='<small>Predicted 1RM up</small><b>'+esc(nm)+'</b><span>'+f1(r1(a))+' \u2192 '+f1(r1(b))+' kg <em>+'+f1(r1(b-a))+'</em></span>';
  document.body.appendChild(t);setTimeout(function(){t.classList.add('on')},20);setTimeout(function(){t.classList.remove('on');setTimeout(function(){t.remove();nextT()},400)},3600)}
document.addEventListener('change',function(ev){var t=ev.target;if(!t||!t.dataset||!t.dataset.k)return;var id=String(t.dataset.k).split('|')[0];setTimeout(function(){check(id);decorate()},60)},true);
document.addEventListener('input',function(ev){var t=ev.target;if(t&&t.dataset&&t.dataset.k)setTimeout(decorate,80)},true);

/* ---------- Today page: Your progress ---------- */
function monday(d){var x=new Date(d+'T12:00:00');x.setDate(x.getDate()-((x.getDay()+6)%7));return x.toISOString().slice(0,10)}
function bars(vals,labels,unit){var W=320,H=110,T=16,mx=Math.max.apply(null,vals.concat([1])),bw=W/vals.length;
  return '<svg viewBox="0 -'+T+' '+W+' '+(H+18+T)+'" class="pg-svg" role="img" aria-label="'+esc(unit)+': '+vals.join(', ')+'">'+vals.map(function(v,i){var h=v?Math.max(4,v/mx*H):2;return '<rect x="'+(i*bw+4)+'" y="'+(H-h)+'" width="'+(bw-8)+'" height="'+h+'" fill="'+(i===vals.length-1?'#FFD900':v?'#0B0B0B':'#D9D4C7')+'"/>'+(v?'<text x="'+(i*bw+bw/2)+'" y="'+(H-h-4)+'" text-anchor="middle" font-size="11" font-weight="700" fill="#0B0B0B">'+v+'</text>':'')}).join('')+
   labels.map(function(l,i){return '<text x="'+(i*bw+bw/2)+'" y="'+(H+14)+'" text-anchor="middle" font-size="10" fill="#77715F">'+esc(l)+'</text>'}).join('')+'</svg>'}
function line(vals,labels,label){if(vals.length<2)return '';var W=320,H=100,mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals),rg=mx-mn||1;
  var pts=vals.map(function(v,i){return [(i/(vals.length-1)*(W-16)+8),(H-8-(v-mn)/rg*(H-24))]});
  return '<svg viewBox="0 0 '+W+' '+(H+16)+'" class="pg-svg" role="img" aria-label="'+esc(label)+'"><path d="M'+pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1)}).join(' L')+' L'+pts[pts.length-1][0].toFixed(1)+','+H+' L'+pts[0][0].toFixed(1)+','+H+' Z" fill="rgba(255,217,0,.25)"/>'+
   '<polyline fill="none" stroke="#0B0B0B" stroke-width="2.5" stroke-linejoin="round" points="'+pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1)}).join(' ')+'"/>'+
   '<circle cx="'+pts[pts.length-1][0].toFixed(1)+'" cy="'+pts[pts.length-1][1].toFixed(1)+'" r="5" fill="#FFD900" stroke="#0B0B0B" stroke-width="2"/>'+
   '<text x="8" y="'+(H+13)+'" font-size="10" fill="#77715F">'+esc(labels[0])+'</text><text x="'+(W-8)+'" y="'+(H+13)+'" text-anchor="end" font-size="10" fill="#77715F">'+esc(labels[labels.length-1])+'</text></svg>'}
function spark(vals){if(vals.length<2)return '';var W=110,H=30,mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals),rg=mx-mn||1;
  return '<svg viewBox="0 0 '+W+' '+H+'" class="pg-spark" aria-hidden="true"><polyline fill="none" stroke="#0B0B0B" stroke-width="2" points="'+vals.map(function(v,i){return (i/(vals.length-1)*(W-6)+3).toFixed(1)+','+(H-3-(v-mn)/rg*(H-6)).toFixed(1)}).join(' ')+'"/></svg>'}
function short(d){var x=new Date(d+'T12:00:00');return x.getDate()+' '+x.toLocaleString('en-GB',{month:'short'})}
function draw(){var host=document.getElementById('todayRest');if(!host)return;css();var box=document.getElementById('pgCard');
  var all=sessions(),done=all.filter(function(s){return s.date});
  if(!done.length){if(box)box.remove();return}
  var t=today(),mon=monday(t),wk=[],lab=[];for(var i=7;i>=0;i--){var m=new Date(mon+'T12:00:00');m.setDate(m.getDate()-7*i);var mk=m.toISOString().slice(0,10);wk.push(done.filter(function(s){return monday(s.date)===mk}).length);lab.push(i===0?'This wk':short(mk))}
  var kgTot=done.reduce(function(a,s){return a+s.kg},0),kgSeries=done.filter(function(s){return s.kg>0}).slice(-10);
  /* predicted 1RM per lift over time */
  var lifts={};done.forEach(function(s){Object.keys(s.best).forEach(function(id){(lifts[id]=lifts[id]||[]).push({d:s.date,v:s.best[id]})})});
  var rows=Object.keys(lifts).map(function(id){var a=lifts[id],first=a[0].v,best=Math.max.apply(null,a.map(function(x){return x.v}));return {id:id,nm:nameOf(id,ex(id)),a:a,first:first,best:best,gain:best-first}})
    .sort(function(a,b){return b.gain-a.gain||b.best-a.best}).slice(0,4);
  var gainPct=rows.length?Math.round(rows.reduce(function(a,r){return a+(r.best/r.first-1)},0)/rows.length*100):null;
  var html='<div class="sec"><div class="kick">Your progress</div><h2>How you\u2019re getting on</h2><div class="bar" aria-hidden="true"></div></div>'+
   '<div class="pg-tiles"><div><span>Sessions done</span><b>'+done.length+'</b></div><div><span>This week</span><b>'+wk[wk.length-1]+'</b></div><div><span>Kg lifted</span><b>'+(kgTot>=10000?f1(kgTot/1000)+'t':Math.round(kgTot).toLocaleString('en-GB'))+'</b></div>'+
   (gainPct!=null?'<div><span>Predicted 1RM</span><b>'+(gainPct>=0?'+':'')+gainPct+'%</b><small>average on your main lifts</small></div>':'')+'</div>'+
   '<div class="pg-grid"><div class="pg-box"><div class="pg-k">Sessions a week</div>'+bars(wk,lab,'Sessions a week, last 8 weeks')+'</div>'+
   (kgSeries.length>1?'<div class="pg-box"><div class="pg-k">Kg lifted a session</div>'+line(kgSeries.map(function(s){return Math.round(s.kg)}),kgSeries.map(function(s){return short(s.date)}),'Kg lifted in each of your last sessions')+'</div>':'')+'</div>'+
   (rows.length?'<div class="pg-box"><div class="pg-k">Predicted 1RM \u00b7 your main lifts</div><div class="pg-lifts">'+rows.map(function(r){return '<div class="pg-lift"><div><b>'+esc(r.nm)+'</b><small>'+(r.a.length>1?'from '+f1(r1(r.first))+' kg':'first estimate')+'</small></div>'+spark(r.a.map(function(x){return x.v}))+'<div class="pg-v"><b>'+f1(r1(r.best))+'</b><small>kg'+(r.gain>0.25?' <em>+'+f1(r1(r.gain))+'</em>':'')+'</small></div></div>'}).join('')+'</div><p class="pg-note">Estimated from your kg, reps and RPE. Not a test: never max out to check it.</p></div>':'');
  if(!box){box=document.createElement('div');box.id='pgCard';host.parentNode.insertBefore(box,host)}
  box.innerHTML=html}
function css(){if(document.getElementById('pg-css'))return;var s=document.createElement('style');s.id='pg-css';s.textContent=[
 '#pgCard{display:flex;flex-direction:column;gap:12px;margin:6px 0 4px}',
 '.pg-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}',
 '.pg-tiles div{border-top:3px solid var(--ink,#0B0B0B);padding:10px 2px 4px}',
 '.pg-tiles span{display:block;font:700 11px var(--sans,Inter,sans-serif);letter-spacing:1.6px;text-transform:uppercase;color:var(--muted,#77715F)}',
 '.pg-tiles b{display:block;font-family:var(--display,Anton,Impact,sans-serif);font-weight:400;font-size:34px;line-height:1.05;margin-top:6px;color:var(--ink,#0B0B0B)}',
 '.pg-tiles small{display:block;font-size:12px;color:var(--muted,#77715F)}',
 '.pg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}',
 '.pg-box{border:1px solid var(--border,#D9D4C7);padding:14px;background:#fff}',
 '.pg-k{font:700 11px var(--sans,Inter,sans-serif);letter-spacing:1.6px;text-transform:uppercase;color:var(--olive,#8a7f00);margin-bottom:8px}',
 '.pg-svg{width:100%;height:auto;display:block;font-family:var(--sans,Inter,sans-serif)}',
 '.pg-lifts{display:flex;flex-direction:column}',
 '.pg-lift{display:grid;grid-template-columns:minmax(0,1fr) 110px 70px;gap:10px;align-items:center;padding:10px 0;border-top:1px solid var(--hair,#ece8de)}',
 '.pg-lift:first-child{border-top:0}',
 '.pg-lift b{font-weight:700;font-size:15px;color:var(--ink,#0B0B0B)}',
 '.pg-lift small{display:block;font-size:12px;color:var(--muted,#77715F)}',
 '.pg-v{text-align:right}.pg-v b{font-family:var(--display,Anton,Impact,sans-serif);font-weight:400;font-size:24px}',
 '.pg-v em,.p1rm em.up{font-style:normal;font-weight:700;color:#1f8a4c}',
 '.pg-spark{width:110px;height:30px}',
 '.pg-note{font-size:12px;color:var(--muted,#77715F);margin:10px 0 0}',
 '.p1rm{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;margin-top:10px;padding:10px 12px;background:var(--cream,#F4F1EA);font-size:13px}',
 '.p1rm span{font-weight:700;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted,#77715F)}',
 '.p1rm b{font-family:var(--display,Anton,Impact,sans-serif);font-weight:400;font-size:20px;color:var(--ink,#0B0B0B)}',
 '.p1rm em{font-style:normal;color:var(--body,#3B3830)}',
 '.p1t{position:fixed;left:50%;bottom:90px;transform:translate(-50%,30px);opacity:0;transition:all .35s;z-index:99998;background:#0B0B0B;color:#F4F1EA;border-left:6px solid #FFD900;padding:12px 18px;min-width:260px;max-width:92vw;font-family:Inter,system-ui,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.35)}',
 '.p1t.on{transform:translate(-50%,0);opacity:1}',
 '.p1t small{display:block;font-weight:700;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#FFD900}',
 '.p1t b{display:block;font-family:Anton,Impact,sans-serif;font-weight:400;font-size:20px;text-transform:uppercase;margin:4px 0 2px}',
 '.p1t em{font-style:normal;font-weight:700;color:#2ECC71}',
 '@media (max-width:480px){.pg-lift{grid-template-columns:minmax(0,1fr) 80px 64px}.pg-spark{width:80px}.pg-tiles b{font-size:28px}}'].join('');document.head.appendChild(s)}
/* hook the engine: redraw the progress card with Today, and the 1RM lines with the Gym tab */
function hook(name,fn){var o=window[name];if(typeof o!=='function'||o.__mgs)return;var w=function(){var r=o.apply(this,arguments);try{fn()}catch(e){}return r};w.__mgs=1;window[name]=w}
function init(){hook('renderToday',draw);hook('renderDay',decorate);try{draw();decorate()}catch(e){}}
[0,400,1200,2500,5000].forEach(function(t){setTimeout(init,t)});document.addEventListener('click',function(ev){if(ev.target.closest&&ev.target.closest('#finish'))setTimeout(function(){try{draw()}catch(e){}},200)},true);
return {e1:e1,sessions:sessions,draw:draw,decorate:decorate}})();
