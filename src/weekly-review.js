/* Macro Golf \u00b7 Weekly review (1-to-1 plans built from templates/; not Build My Plan).
   Turns the Report tab into "Weekly": a short review the client sends to the coach in the app.
   Questions come from the Google Form "Macro Golf Weekly Check-In", minus anything the app already records
   (sessions done, habits, daily energy / motivation, swaps, weight, games and tests, plan week).
   Saves S.reviews['w<week>'] = {at:'YYYY-MM-DD', a:{key:answer}, q:{key:question}} (synced with the plan),
   and also writes the answers into S.notes so "Email a copy" still includes them.
   The coach dashboard shows the answers under the client's training. Loaded by templates/parts/70-tail.html. */
var MGWeekly=(function(){
if(window.MGWeekly)return window.MGWeekly;
var Q=[
 {sec:'How the week went'},
 {k:'missed',q:'If you missed anything you had planned, what got in the way?',t:'text',ph:'Work, travel, injury, motivation\u2026 or "nothing missed".'},
 {k:'changed',q:'Did you change anything from the plan that the app wouldn\u2019t show?',t:'text',ph:'Swapped a session, did extra, skipped part of something\u2026'},
 {k:'win',q:'What was your biggest win this week?',t:'text',ph:'On the course, in practice, in the gym or in your head.'},
 {sec:'Your golf'},
 {k:'strike',q:'Describe the strike and shape of your good and bad shots this week.',t:'text',ph:'e.g. Good: centred, small draw. Bad: thin, blocked right.'},
 {k:'short',q:'How did your short game and putting perform?',t:'text',ph:'Strike, distance control, holed / missed putts, Strokes Gained if you track it.'},
 {k:'rounds',q:'How many rounds did you play this week?',t:'pick',o:['0','1','2','3','4+']},
 {k:'transfer',q:'How well did your practice transfer to the golf course?',t:'pick',o:['Very well','Well','In patches','Not well'],when:played},
 {k:'held',q:'What transferred well, and what tended to break down?',t:'text',when:played},
 {k:'best',q:'Were you able to access your best golf when it mattered?',t:'scale',lo:'Not at all',hi:'Every time',when:played},
 {k:'course',q:'Scores, stats or any other notes on your on-course performance',t:'text',opt:1,ph:'Optional. Paste scores or stats here if you don\u2019t log them in the app.',when:played},
 {sec:'You'},
 {k:'energy',q:'How were your energy levels and recovery this week?',t:'scale',lo:'Running on empty',hi:'Fully charged'},
 {k:'energyNote',q:'Anything behind that? Sleep, stress, soreness, niggles.',t:'text',opt:1},
 {sec:'Next week'},
 {k:'avail',q:'Is anything happening next week that will affect your availability?',t:'text',ph:'Holiday, work trip, tournament\u2026 or "no".'},
 {k:'focus',q:'What is the one thing you\u2019d most like your coaching team to focus on or explain next week?',t:'text'}
];
function played(a){return a.rounds&&a.rounds!=='0'}
function on(){try{return typeof CLIENT==='object'&&!window.MGBuild&&CLIENT.key!=='build-my-plan'&&!(CLIENT.features&&CLIENT.features.review===false)&&document.getElementById('p-report')}catch(e){return false}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function key(){return 'w'+S.week}
function store(){S.reviews=S.reviews||{};return S.reviews}
function draft(){S.reviewDraft=S.reviewDraft||{};var k=key();return S.reviewDraft[k]=S.reviewDraft[k]||{}}
function done(){var r=store()[key()];return r&&r.at?r:null}
function qs(a){return Q.filter(function(x){return x.k&&(!x.when||x.when(a))})}
function missing(a){return qs(a).filter(function(x){return !x.opt&&!String(a[x.k]||'').trim()})}

/* what the app already tells the coach, so the client doesn't repeat it */
function summary(){var w=S.week,days=weekDays(w),c=weekCounts(w),out=[];
  out.push([CLIENT.gymTab||'Gym sessions',c.gym+' of '+CLIENT.weekly.gym]);
  if(F.cardio)out.push(['Cardio',c.cardio+' of '+(CLIENT.weekly.cardio||1)]);
  habitList().forEach(function(h){out.push([h.name,days.filter(function(d){return habitOn(d,h.id)}).length+' of 7 days'])});
  if(F.checkin)CHECKIN.forEach(function(ci){var a=weekAvg(w,ci.id);out.push([ci.name+' (daily avg)',a==null?'\u2013':fmt(a)+' / 10'])});
  var sw=((S.swaps&&S.swaps.log)||[]).filter(function(z){return z&&z.d>=days[0]&&z.d<=days[6]&&z.scope!=='back'}).length;if(sw)out.push(['Exercise swaps',String(sw)]);
  if(F.weight){var ws=sortedW().filter(function(z){return z.date>=days[0]&&z.date<=days[6]});if(ws.length)out.push(['Weight',fmt(ws[ws.length-1].kg)+' kg'])}
  return out}

function field(x,a){var v=a[x.k]==null?'':String(a[x.k]),id='wr-'+x.k,h='<div class="wr-q" data-q="'+x.k+'"><label class="wr-l" for="'+id+'">'+esc(x.q)+(x.opt?' <span>Optional</span>':'')+'</label>';
  if(x.t==='text')h+='<textarea id="'+id+'" data-k="'+x.k+'" rows="3" placeholder="'+esc(x.ph||'')+'">'+esc(v)+'</textarea>';
  else if(x.t==='pick')h+='<div class="wr-pick" role="radiogroup" aria-label="'+esc(x.q)+'">'+x.o.map(function(o){return '<button type="button" role="radio" data-k="'+x.k+'" data-v="'+esc(o)+'" aria-checked="'+(v===o)+'">'+esc(o)+'</button>'}).join('')+'</div>';
  else if(x.t==='scale')h+='<div class="wr-pick wr-scale" role="radiogroup" aria-label="'+esc(x.q)+'">'+[1,2,3,4,5].map(function(n){return '<button type="button" role="radio" data-k="'+x.k+'" data-v="'+n+'" aria-checked="'+(v===String(n))+'">'+n+'</button>'}).join('')+'</div><div class="wr-ends"><span>1 \u00b7 '+esc(x.lo)+'</span><span>'+esc(x.hi)+' \u00b7 5</span></div>';
  return h+'</div>'}

function view(){var host=document.getElementById('wrBox'),r=done(),a=r?r.a:draft(),w=S.week;
  var sum=summary().map(function(s){return '<div><span>'+esc(s[0])+'</span><b>'+esc(s[1])+'</b></div>'}).join('');
  var h='<div class="sec"><div class="kick">'+esc(wkLabel(w))+'</div><h2>Your weekly review</h2><div class="bar" aria-hidden="true"></div></div>';
  if(r){h+='<div class="wr-done"><b>Sent to your coach '+esc(niceDate(r.at,true))+'</b><span>Thanks. Your coach will read it before your next check-in.</span><button type="button" class="btn ghost" id="wrEdit">Edit and send again</button></div>';
    h+='<div class="wr-read">'+qs(a).filter(function(x){return String(a[x.k]||'').trim()}).map(function(x){return '<div><span>'+esc(x.q)+'</span><p>'+esc(a[x.k])+'</p></div>'}).join('')+'</div>'}
  else{h+='<div class="wr-auto"><div class="wr-k">Your coach can already see</div><div class="wr-grid">'+sum+'</div><p>Your coach sees your sessions, habits, check-ins'+(F.weight?', weight':'')+', swaps and golf scores automatically, so you don\u2019t need to repeat them. Just tell them what the numbers can\u2019t.</p></div>';
    var cur=null;Q.forEach(function(x){if(x.sec){if(cur!==null)h+='</div>';h+='<div class="wr-sec"><div class="wr-k">'+esc(x.sec)+'</div>';cur=x.sec;return}if(x.when&&!x.when(a))return;h+=field(x,a)});if(cur!==null)h+='</div>';
    var m=missing(a).length;h+='<div class="wr-send"><button type="button" class="btn primary" id="wrSend">Send to my coach</button><p class="small" id="wrLeft">'+(m?m+' question'+(m>1?'s':'')+' left. Short answers are fine.':'All done. Ready to send.')+'</p><div class="status" id="wrStatus" role="status"></div></div>'}
  host.innerHTML=h;wire(host)}
function wire(host){if(host._wr)return;host._wr=1;
  host.addEventListener('input',function(e){var t=e.target;if(!t.dataset||!t.dataset.k||t.tagName!=='TEXTAREA')return;draft()[t.dataset.k]=t.value;save();left()});
  host.addEventListener('click',function(e){var b=e.target.closest('[data-v]');if(b){var a=draft(),k=b.dataset.k,before=JSON.stringify(qs(a).map(function(x){return x.k}));a[k]=b.dataset.v;save();
      if(JSON.stringify(qs(a).map(function(x){return x.k}))!==before){view();var n=host.querySelector('[data-q="'+k+'"]');if(n)n.scrollIntoView({block:'nearest'})}
      else{[].forEach.call(b.parentNode.children,function(x){x.setAttribute('aria-checked',String(x===b))});left()}return}
    if(e.target.closest('#wrSend'))send();
    if(e.target.closest('#wrEdit')){var r=done();S.reviewDraft=S.reviewDraft||{};S.reviewDraft[key()]=Object.assign({},r.a);delete store()[key()];save();view()}})}
function left(){var el=document.getElementById('wrLeft');if(!el)return;var m=missing(draft()).length;el.textContent=m?m+' question'+(m>1?'s':'')+' left. Short answers are fine.':'All done. Ready to send.'}
function send(){var a=draft(),m=missing(a);if(m.length){var n=document.querySelector('#wrBox [data-q="'+m[0].k+'"]');if(n){n.classList.remove('wr-need');void n.offsetWidth;n.classList.add('wr-need');n.scrollIntoView({behavior:'smooth',block:'center'});var f=n.querySelector('textarea,button');if(f)f.focus({preventScroll:true})}
    var st=document.getElementById('wrStatus');if(st)st.textContent='Please answer: '+m[0].q;return}
  var q={},keep={};qs(a).forEach(function(x){if(String(a[x.k]||'').trim()){q[x.k]=x.q;keep[x.k]=String(a[x.k]).trim()}});
  store()[key()]={at:todayIso(),a:keep,q:q};delete S.reviewDraft[key()];
  S.notes=S.notes||{};S.notes[key()]=qs(keep).filter(function(x){return keep[x.k]}).map(function(x){return x.q+'\n'+keep[x.k]}).join('\n\n');
  S.sent=S.sent||{};S.sent[key()]=todayIso();save();view();badge();window.scrollTo({top:document.getElementById('tabs').offsetTop-4,behavior:'smooth'})}
/* yellow dot on the tab from Friday until this week's review is sent */
function badge(){var b=document.querySelector('#tabs [data-tab="report"]');if(!b)return;var d=new Date().getDay(),due=(d===5||d===6||d===0)&&!done();b.classList.toggle('wr-due',due)}

function css(){if(document.getElementById('wr-css'))return;var s=document.createElement('style');s.id='wr-css';s.textContent=[
 '#wrBox{display:flex;flex-direction:column;gap:16px}',
 '.wr-k{font:700 11px var(--sans,Inter,sans-serif);letter-spacing:1.6px;text-transform:uppercase;color:var(--olive,#8a7f00);margin-bottom:10px}',
 '.wr-auto{background:var(--cream,#F4F1EA);padding:16px;border-left:4px solid var(--yellow,#FFD900)}',
 '.wr-auto p{font-size:13px;color:var(--body,#3B3830);margin:12px 0 0;line-height:1.5}',
 '.wr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px 14px}',
 '.wr-grid span{display:block;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted,#77715F)}',
 '.wr-grid b{display:block;font-family:var(--display,Anton,Impact,sans-serif);font-weight:400;font-size:22px;margin-top:2px;color:var(--ink,#0B0B0B)}',
 '.wr-sec{display:flex;flex-direction:column;gap:18px;padding-top:6px;border-top:2px solid var(--ink,#0B0B0B)}',
 '.wr-sec .wr-k{margin:12px 0 -6px}',
 '.wr-q{display:flex;flex-direction:column;gap:8px}',
 '.wr-l{font-weight:700;font-size:15px;line-height:1.35;color:var(--ink,#0B0B0B)}',
 '.wr-l span{font-weight:400;font-size:12px;color:var(--muted,#77715F);margin-left:4px}',
 '.wr-q textarea{width:100%;box-sizing:border-box;font:16px/1.45 var(--sans,Inter,sans-serif);padding:12px;border:1px solid var(--border,#D9D4C7);background:#fff;resize:vertical;min-height:84px}',
 '.wr-q textarea:focus{outline:2px solid var(--ink,#0B0B0B);outline-offset:0}',
 '.wr-pick{display:flex;flex-wrap:wrap;gap:8px}',
 '.wr-pick button{flex:1 1 auto;min-width:64px;min-height:48px;padding:10px 12px;border:2px solid var(--ink,#0B0B0B);background:var(--paper,#fff);font:700 15px var(--sans,Inter,sans-serif);color:var(--ink,#0B0B0B);cursor:pointer}',
 '.wr-scale button{flex:1 1 0;font-family:var(--display,Anton,Impact,sans-serif);font-weight:400;font-size:20px}',
 '.wr-pick button[aria-checked="true"]{background:var(--ink,#0B0B0B);color:var(--yellow,#FFD900)}',
 '.wr-ends{display:flex;justify-content:space-between;font-size:12px;color:var(--muted,#77715F)}',
 '.wr-need{animation:wrN .9s}@keyframes wrN{0%,100%{background:transparent}30%{background:rgba(255,217,0,.45)}}',
 '.wr-send{display:flex;flex-direction:column;gap:8px;padding-top:8px}.wr-send .btn{width:100%;min-height:54px;font-size:18px}',
 '.wr-done{display:flex;flex-direction:column;gap:6px;background:#0B0B0B;color:#F4F1EA;padding:18px;border-left:6px solid #FFD900}',
 '.wr-done b{font-family:Anton,Impact,sans-serif;font-weight:400;font-size:22px;text-transform:uppercase}',
 '.wr-done span{font-size:14px;opacity:.85}.wr-done .btn{margin-top:8px;align-self:flex-start;color:#F4F1EA;border-color:#F4F1EA}',
 '.wr-read{display:flex;flex-direction:column}.wr-read div{padding:12px 0;border-top:1px solid var(--hair,#ece8de)}',
 '.wr-read span{display:block;font-size:12px;font-weight:700;color:var(--muted,#77715F)}.wr-read p{margin:4px 0 0;white-space:pre-wrap}',
 '#p-report .wr-old>summary{cursor:pointer;font-weight:700;font-size:14px;padding:10px 0;color:var(--muted,#77715F)}',
 '#tabs button.wr-due{position:relative}#tabs button.wr-due::after{content:"";position:absolute;top:10px;right:calc(50% - 30px);width:9px;height:9px;border-radius:50%;background:#FFD900;box-shadow:0 0 0 2px var(--paper,#fff)}'].join('');document.head.appendChild(s)}

function setup(){if(!on()||document.getElementById('wrBox'))return !!document.getElementById('wrBox');css();
  var p=document.getElementById('p-report'),old=p.querySelector('.report'),sec=p.querySelector('.sec');
  var box=document.createElement('div');box.id='wrBox';p.insertBefore(box,sec);
  /* keep the old email / copy report as a fallback, folded away; the answers fill its notes */
  var det=document.createElement('details');det.className='wr-old';det.innerHTML='<summary>Email or copy this week instead</summary>';p.appendChild(det);if(sec)det.appendChild(sec);if(old)det.appendChild(old);
  var nf=document.getElementById('repNotes');if(nf&&nf.closest('.field'))nf.closest('.field').hidden=true;
  var b=document.querySelector('#tabs [data-tab="report"]');if(b)b.textContent='Weekly';
  var o=window.renderReport;if(typeof o==='function'){window.renderReport=function(){var r=o.apply(this,arguments);try{view();badge()}catch(e){}return r}}
  if(S.tab==='report')view();badge();return true}
var tries=0;(function go(){if(setup()||++tries>25)return;setTimeout(go,200)})();
return {Q:Q,view:view}})();
