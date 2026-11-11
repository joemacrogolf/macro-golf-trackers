var MGS=(function(){
var LOGO=new Path2D('__LOGO__');
var ICON='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>';
var C={name:'',label:'MACRO GOLF',save:function(){},list:function(){return []}};
var cur=null,img=null,size='story',hide=false,thumbs={};
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function escH(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function today(){var d=new Date(),m=d.getMonth()+1,dd=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(dd<10?'0':'')+dd}
function thumb(x){if(thumbs[x.key])return thumbs[x.key];try{var c=document.createElement('canvas');c.width=216;c.height=384;paint(c,x.w,{scale:.2});thumbs[x.key]=c.toDataURL('image/jpeg',.85)}catch(e){thumbs[x.key]=''}return thumbs[x.key]}
function banners(){
  var list=C.list().filter(function(x){return x.date===today()&&!x.off});
  Array.prototype.forEach.call(document.querySelectorAll('.mgs-slot'),function(slot){
    slot.innerHTML='';
    list.forEach(function(x){var w=x.w,b=el('div','mgs-win'),t=thumb(x);
      b.innerHTML=(t?'<button type="button" class="mgs-thumb" aria-label="Open your share picture"><img src="'+t+'" alt=""></button>':'')+'<div class="mgs-body"><div class="mgs-top"><span class="mgs-tag">'+escH(w.tag)+'</span><button type="button" class="mgs-x">Not now</button></div><div class="mgs-big">'+w.mBig+'</div><p>'+escH(w.mText)+'</p><button type="button" class="mgs-go">'+ICON+'<span>Share to your story</span></button></div>';
      Array.prototype.forEach.call(b.querySelectorAll('.mgs-go,.mgs-thumb'),function(k){k.addEventListener('click',function(){open(w)})});
      b.querySelector('.mgs-x').addEventListener('click',function(){x.off=true;C.save();banners()});
      slot.appendChild(b)});
  })}
function add(key,w){var list=C.list();for(var i=0;i<list.length;i++)if(list[i].key===key)return false;list.push({key:key,date:today(),w:w});while(list.length>40)list.shift();C.save();return true}
var sheet,cv,st;
function build(){
  sheet=el('div','mgs-sheet');sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label','Share your win');
  sheet.innerHTML='<div class="mgs-in"><div class="mgs-head"><div class="mgs-hero"><span class="mgs-tag" id="mgsTag"></span><b>Show it off</b><p>Add a photo from today, then share it to your story.</p></div><button type="button" class="mgs-close">Close</button></div>'+
   '<div class="mgs-prev"><canvas width="1080" height="1920"></canvas><img class="mgs-out" alt="Your share picture" hidden></div>'+
   '<div class="mgs-ctl"><label class="mgs-photo"><input type="file" accept="image/*">+ Add your photo</label>'+
   '<div class="mgs-seg" role="group" aria-label="Size"><button type="button" data-s="story" aria-pressed="true">Story</button><button type="button" data-s="post" aria-pressed="false">Post</button></div>'+
   '<label class="mgs-hide"><input type="checkbox"> Hide weights</label></div>'+
   '<button type="button" class="mgs-share">'+ICON+'<span>Share to your story</span></button><p class="mgs-apps">Opens Instagram, WhatsApp, Facebook and more</p><button type="button" class="mgs-save">Save image</button><p class="mgs-st" role="status"></p></div>';
  document.body.appendChild(sheet);cv=sheet.querySelector('canvas');st=sheet.querySelector('.mgs-st');
  sheet.querySelector('.mgs-close').addEventListener('click',close);
  sheet.addEventListener('click',function(e){if(e.target===sheet)close()});
  sheet.querySelector('.mgs-photo input').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){img=im;draw()};im.src=r.result};r.readAsDataURL(f)});
  sheet.querySelector('.mgs-seg').addEventListener('click',function(e){var b=e.target.closest('[data-s]');if(!b)return;size=b.dataset.s;Array.prototype.forEach.call(this.children,function(x){x.setAttribute('aria-pressed',String(x===b))});draw()});
  sheet.querySelector('.mgs-hide input').addEventListener('change',function(e){hide=e.target.checked;draw()});
  sheet.querySelector('.mgs-share').addEventListener('click',share);
  sheet.querySelector('.mgs-save').addEventListener('click',function(){saveImg(true)});
}
function open(w){if(!sheet)build();cur=w;img=null;st.textContent='';sheet.querySelector('.mgs-photo input').value='';sheet.querySelector('#mgsTag').textContent=w.tag;
  var h=sheet.querySelector('.mgs-hide');h.hidden=!w.bigHide;sheet.hidden=false;document.body.style.overflow='hidden';
  var f=document.fonts&&document.fonts.load?Promise.all([document.fonts.load('400 100px Anton'),document.fonts.load('700 30px Inter'),document.fonts.load('800 30px Inter')]):Promise.resolve();
  draw();f.then(draw,draw)}
function celebrate(w){open(w);confetti()}
function confetti(){try{if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return}catch(e){}
  var c=el('canvas','mgs-confetti'),x=c.getContext('2d'),W=c.width=innerWidth,H=c.height=innerHeight,P=[],cols=['#FFD900','#F4F1EA','#FFFFFF','#FFD900'],t0=Date.now();
  for(var i=0;i<140;i++)P.push({x:W/2+(Math.random()-.5)*W*.3,y:H*.35,vx:(Math.random()-.5)*14,vy:-Math.random()*16-4,s:6+Math.random()*7,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:cols[i%4]});
  document.body.appendChild(c);
  (function f(){var t=Date.now()-t0;x.clearRect(0,0,W,H);P.forEach(function(p){p.vy+=.45;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.globalAlpha=Math.max(0,1-t/2600);x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()});
    if(t<2600)requestAnimationFrame(f);else c.remove()})()}
function close(){sheet.hidden=true;document.body.style.overflow=''}
function blob(cb){try{cv.toBlob(function(b){cb(b)},'image/png')}catch(e){cb(null)}}
function share(){blob(function(b){if(!b){st.textContent='Could not make the picture. Take a screenshot instead.';return}
  var file;try{file=new File([b],'macro-golf-win.png',{type:'image/png'})}catch(e){file=null}
  if(file&&navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file]}).then(function(){st.textContent='Shared. Nice work.'},function(e){if(!e||e.name!=='AbortError')saveImg(true)})}
  else saveImg(true)})}
function saveImg(show){blob(function(b){if(!b)return;var u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='macro-golf-win.png';document.body.appendChild(a);a.click();a.remove();
  if(show){var o=sheet.querySelector('.mgs-out');o.src=u;o.hidden=false;cv.hidden=true;st.textContent='Saved. If it did not download, press and hold the picture to save it, then post it from your photos.'}})}
function draw(){if(!cur)return;var o=sheet.querySelector('.mgs-out');o.hidden=true;cv.hidden=false;paint(cv,cur,{size:size,hide:hide,img:img})}
function paint(cv,w,op){
  var ctx=cv.getContext('2d'),sc=op.scale||1,W=1080,H=op.size==='post'?1350:1920,M=72,A='400 Spx Anton, Impact, sans-serif',I='700 Spx Inter, sans-serif';
  cv.width=W*sc;cv.height=H*sc;ctx.setTransform(sc,0,0,sc,0,0);
  function fit(t,f,s,mw){ctx.font=f.replace('S',s);while(ctx.measureText(t).width>mw&&s>20){s-=4;ctx.font=f.replace('S',s)}return s}
  if(op.img){var im=op.img,r=Math.max(W/im.width,H/im.height),iw=im.width*r,ih=im.height*r;ctx.drawImage(im,(W-iw)/2,(H-ih)/2,iw,ih)}
  else{var g0=ctx.createLinearGradient(0,0,W,H);g0.addColorStop(0,'#3a3832');g0.addColorStop(1,'#0e0e0d');ctx.fillStyle=g0;ctx.fillRect(0,0,W,H);
    var rg=ctx.createRadialGradient(W*.7,H*.25,10,W*.7,H*.25,W*.9);rg.addColorStop(0,'rgba(255,217,0,.2)');rg.addColorStop(1,'rgba(255,217,0,0)');ctx.fillStyle=rg;ctx.fillRect(0,0,W,H)}
  var big=(op.hide&&w.bigHide)?w.bigHide:w.big,line=(op.hide&&w.lineHide)?w.lineHide:w.line;
  var g=ctx.createLinearGradient(0,H*.45,0,H);g.addColorStop(0,'rgba(11,11,11,0)');g.addColorStop(.45,'rgba(11,11,11,.85)');g.addColorStop(1,'rgba(11,11,11,.96)');ctx.fillStyle=g;ctx.fillRect(0,H*.45,W,H*.55);
  var tg=ctx.createLinearGradient(0,0,0,300);tg.addColorStop(0,'rgba(11,11,11,.7)');tg.addColorStop(1,'rgba(11,11,11,0)');ctx.fillStyle=tg;ctx.fillRect(0,0,W,300);
  ctx.save();ctx.translate(M,56);ctx.scale(152/542,152/542);ctx.fillStyle='#FFD900';ctx.fill(LOGO,'evenodd');ctx.restore();
  ctx.fillStyle='#F4F1EA';ctx.font=I.replace('S',30);ctx.textAlign='right';ctx.fillText(w.who||'',W-M,100);ctx.textAlign='left';
  var y=H-(op.size==='post'?150:250);
  ctx.fillStyle='#F4F1EA';ctx.font=I.replace('S',32);ctx.fillText(line,M,y);
  var s=fit(big,A,/^\d+$/.test(big)?300:190,W-2*M);ctx.fillStyle='#FFD900';ctx.font=A.replace('S',s);ctx.fillText(big,M,y-56);
  var ts=fit(w.title,A,84,W-2*M);ctx.fillStyle='#F4F1EA';ctx.font=A.replace('S',ts);ctx.fillText(w.title,M,y-76-s*.92);
  ctx.fillStyle='#FFD900';ctx.fillRect(M,y-106-s*.92-ts,150,12);
  ctx.font='800 30px Inter, sans-serif';var kw=ctx.measureText(w.kick).width+36,ky=y-156-s*.92-ts-48;ctx.fillStyle='#FFD900';ctx.fillRect(M,ky,kw,56);ctx.fillStyle='#0B0B0B';ctx.fillText(w.kick,M+18,ky+38);
  ctx.fillStyle='rgba(244,241,234,.6)';ctx.font=I.replace('S',26);ctx.fillText(C.label,M,H-80);ctx.textAlign='right';ctx.fillText('MACRO.GOLF',W-M,H-80);ctx.textAlign='left';
}
function monday(iso){var p=String(iso).split('-'),d=new Date(+p[0],+p[1]-1,+p[2],12),k=(d.getDay()+6)%7;d.setDate(d.getDate()-k);var m=d.getMonth()+1,dd=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(dd<10?'0':'')+dd}
function weeksBetween(a,b){var pa=a.split('-'),pb=b.split('-');return Math.round((new Date(+pb[0],+pb[1]-1,+pb[2],12)-new Date(+pa[0],+pa[1]-1,+pa[2],12))/604800000)}
function shift(iso,n){var p=String(iso).split('-'),d=new Date(+p[0],+p[1]-1,+p[2]+n,12),m=d.getMonth()+1,dd=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(dd<10?'0':'')+dd}
function nice(iso){var p=String(iso).split('-');return new Date(+p[0],+p[1]-1,+p[2],12).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
function f1(n){return (Math.round(n*10)/10).toString()}
function unit(e){return (typeof wtInfo==='function'?wtInfo(e).u:'kg').toUpperCase()}
function pb(e,now,prev,minR){
  var ok=function(s){return s.w!=null&&s.r!=null&&s.r>=minR};now=now.filter(ok);prev=prev.filter(ok);if(!now.length||!prev.length)return null;
  var b=now.reduce(function(a,s){return (s.w>a.w||(s.w===a.w&&s.r>a.r))?s:a});
  var pm=prev.reduce(function(a,s){return Math.max(a,s.w)},0),first=prev[0];
  var nm=e.name,u=unit(e),bw=f1(b.w)+u+' × '+b.r;
  if(b.w>pm){var gain=b.w-first.w;return {score:(b.w-pm)/Math.max(pm,1),tag:'New PB',kick:'NEW PB',big:bw,bigHide:'PERSONAL BEST',title:nm.toUpperCase(),
    line:gain>0?('+'+f1(gain)+'kg since '+nice(first.date)):'Heaviest set yet',lineHide:'Heaviest set yet',
    mBig:escH(nm)+' <span>'+escH(f1(b.w)+' '+u.toLowerCase()+' × '+b.r)+'</span>',mText:gain>0?('Your heaviest set yet, '+f1(gain)+'kg up since '+nice(first.date)+'.'):'Your heaviest set yet.'}}
  var pr=prev.filter(function(s){return s.w===b.w}).reduce(function(a,s){return Math.max(a,s.r)},0);
  if(b.w===pm&&pr&&b.r>pr)return {score:(b.r-pr)/pr/3,tag:'Rep PB',kick:'REP PB',big:bw,bigHide:b.r+' REPS',title:nm.toUpperCase(),
    line:'Most reps yet at '+f1(b.w)+'kg',lineHide:'Most reps yet',mBig:escH(nm)+' <span>'+b.r+' reps</span>',mText:'Most reps you have done at '+f1(b.w)+'kg.'};
  return null}
function weekWin(n,who){return {tag:'Week complete',kick:'WEEK COMPLETE',big:'WEEK '+n,title:'EVERY SESSION DONE',line:who.line,mBig:'<span>Week '+n+'</span> complete',mText:who.text,who:who.who}}
function streakWin(k,who){return {tag:'Streak',kick:'STREAK',big:k+' WEEKS',title:'NOT ONE SESSION MISSED',line:who.line,mBig:'<span>'+k+' weeks</span> unbroken',mText:'Every planned session done for '+k+' weeks running.',who:who.who}}
function msWin(n,noun,who,line){return {tag:'Milestone',kick:'MILESTONE',big:String(n),title:noun.toUpperCase()+' DONE',line:line,mBig:'<span>'+n+'</span> '+noun+' done',mText:n+' '+noun+' into your plan. '+line+'.',who:who}}
return {init:function(o){for(var k in o)C[k]=o[k]},add:add,banners:banners,open:open,celebrate:celebrate,monday:monday,shift:shift,weeksBetween:weeksBetween,pb:pb,weekWin:weekWin,streakWin:streakWin,msWin:msWin,today:today,esc:escH,f1:f1};
})();
