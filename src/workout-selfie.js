/* Macro Golf \u00b7 Post-workout selfie
   After a training session is finished (the "Session done" screen from ux.js / templates/parts/60-ux.html), adds a
   "Post a selfie" button. It makes a 1080 x 1350 picture: the player's selfie (or a plain dark card), total kg lifted
   and a fun "that's the same as \u2026" line (animals, vehicles). Sessions with no weights use reps, time held, metres or
   minutes instead. Share (phone share sheet) or save the picture.
   Works on every training page that has #finish + the ux "Session done" screen (template plans, Dan, Harry, Kevin,
   Pure plans): it reads the numbers typed in the session's set boxes (data-k="\u2026|w" / "\u2026|r") as Finish is pressed.
   Load after the tracker:  <script src="{{BASE}}src/workout-selfie.js"></script>   Nothing is saved or sent anywhere. */
var MGSelfie=(function(){
if(window.MGSelfie)return window.MGSelfie;
var KG=[[0.046,'golf ball','golf balls'],[4.5,'house cat','house cats'],[13,'full golf bag','full golf bags'],[30,'golden retriever','golden retrievers'],
 [100,'giant panda','giant pandas'],[300,'grand piano','grand pianos'],[450,'polar bear','polar bears'],[700,'dairy cow','dairy cows'],
 [1500,'London black cab','London black cabs'],[1800,'hippo','hippos'],[2300,'white rhino','white rhinos'],[6000,'African elephant','African elephants'],
 [8000,'T. rex','T. rexes'],[12000,'double-decker bus','double-decker buses'],[41000,'Boeing 737','Boeing 737s'],[150000,'blue whale','blue whales']];
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function num(v){var x=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(x)?x:null}
function fmt(n){return Math.round(n).toLocaleString('en-GB')}
function one(n){return n>=10?fmt(n):String(Math.round(n*10)/10)}
/* the fun line: the biggest thing lifted at least once, plus golf balls for scale */
function kgLine(kg){var pick=KG[0];KG.forEach(function(k){if(kg>=k[0])pick=k});var n=kg/pick[0],c=n<1.05?'1':one(n);
  var big=(c==='1'?'a '+pick[1]:c+' '+pick[2]).replace(/^a ([aeiou])/i,'an $1');
  return {head:fmt(kg)+' kg',sub:'lifted today',fun:'That\u2019s the same as lifting '+big+(pick[0]>13?'. Or '+fmt(kg/0.046)+' golf balls.':'.')}}
function otherLine(s){
  if(s.reps>0){var r=s.reps/72;return {head:fmt(s.reps)+' reps',sub:'done today',fun:r>=1?'That\u2019s '+one(r)+' round'+(r>=1.95?'s':'')+' of level-par golf, one rep for every shot.':'That\u2019s '+Math.round(r*18)+' holes of level-par golf, one rep for every shot.'}}
  if(s.secs>0){var d=s.secs/6;return {head:(s.secs>=120?one(s.secs/60)+' min':fmt(s.secs)+' s'),sub:'held today',fun:'That\u2019s as long as '+fmt(d)+' drives in the air, back to back.'}}
  if(s.metres>0){var p=s.metres/137;return {head:fmt(s.metres)+' m',sub:'covered today',fun:'That\u2019s '+one(p)+' par 3'+(p>=1.95?'s':'')+' end to end.'}}
  if(s.mins>0){var h=s.mins/15;return {head:fmt(s.mins)+' min',sub:'trained today',fun:'That\u2019s '+one(h)+' hole'+(h>=1.95?'s':'')+' of golf at a good pace.'}}
  return {head:fmt(s.sets||0)+' sets',sub:'done today',fun:'Every set counts. See you next session.'}}
function line(s){return s.kg>0?kgLine(s.kg):otherLine(s)}

/* ---------- read the session as Finish is pressed ---------- */
var startK='mgself-start:'+location.pathname,snap=null;
document.addEventListener('input',function(e){var t=e.target;if(t&&t.dataset&&t.dataset.k){try{if(!sessionStorage.getItem(startK))sessionStorage.setItem(startK,String(Date.now()))}catch(x){}}},true);
function colKind(inp){var tb=inp.closest('table'),th=tb?tb.querySelectorAll('thead th'):[],txt='';for(var i=0;i<th.length;i++)txt+=' '+th[i].textContent;txt=txt.toLowerCase();return /metre/.test(txt)?'m':/sec/.test(txt)?'s':'r'}
function read(){var rows={},s={kg:0,reps:0,secs:0,metres:0,sets:0,mins:0};
  [].forEach.call(document.querySelectorAll('[data-k]'),function(el){var k=String(el.dataset.k),i=k.lastIndexOf('|');if(i<0)return;var f=k.slice(i+1),id=k.slice(0,i);
    if(f!=='w'&&f!=='r')return;var r=rows[id]||(rows[id]={kind:'r'});r[f]=num(el.value);if(f==='r')r.kind=colKind(el)});
  Object.keys(rows).forEach(function(id){var r=rows[id];if(!(r.r>0))return;s.sets++;
    if(r.kind==='s')s.secs+=r.r;else if(r.kind==='m')s.metres+=r.r;else if(r.w>0)s.kg+=r.w*r.r;else s.reps+=r.r});
  var st=null;try{st=Number(sessionStorage.getItem(startK))||null}catch(x){}if(st)s.mins=Math.max(1,Math.round((Date.now()-st)/60000));
  var t=document.querySelector('#dayTitle')||document.querySelector('#wTitle');s.title=t?t.textContent.trim():'';
  var nm='';try{nm=(window.CLIENT&&(CLIENT.first||CLIENT.name))||(window.S&&(S.player||S.name))||''}catch(x){}s.name=nm&&nm!=='Golfer'?String(nm):'';
  return s}
document.addEventListener('click',function(e){if(!e.target.closest||!e.target.closest('#finish'))return;snap=read();
  setTimeout(function(){var st=document.querySelector('#status');if(st&&/saved/i.test(st.textContent)){try{sessionStorage.removeItem(startK)}catch(x){}}else snap=null},80)},true);
/* add the button to the Session done screen when it appears */
new MutationObserver(function(){if(!snap)return;var d=document.querySelector('.ux-done .ux-done-in');if(!d||d.querySelector('.mgself-btn'))return;
  var s=snap,b=document.createElement('button');b.type='button';b.className='ux-btn y mgself-btn';b.innerHTML='\ud83d\udcf8 Post a selfie';
  b.addEventListener('click',function(ev){ev.stopPropagation();var o=document.querySelector('.ux-done');if(o)o.remove();open(s)});
  var first=d.querySelector('.ux-btn');d.insertBefore(b,first||null);if(first&&first.classList.contains('y'))first.classList.remove('y')}).observe(document.documentElement,{childList:true,subtree:true});

/* ---------- the picture ---------- */
var W=1080,H=1350;
function wrap(x,t,maxW){var w=String(t).split(' '),out=[],cur='';w.forEach(function(p){var n=cur?cur+' '+p:p;if(x.measureText(n).width>maxW&&cur){out.push(cur);cur=p}else cur=n});if(cur)out.push(cur);return out}
function draw(cv,s,img){var x=cv.getContext('2d'),L=line(s);cv.width=W;cv.height=H;
  x.fillStyle='#0B0B0B';x.fillRect(0,0,W,H);
  if(img){var r=Math.max(W/img.width,H/img.height),iw=img.width*r,ih=img.height*r;x.drawImage(img,(W-iw)/2,(H-ih)/2,iw,ih);
    var g=x.createLinearGradient(0,H*0.35,0,H);g.addColorStop(0,'rgba(11,11,11,0)');g.addColorStop(0.55,'rgba(11,11,11,.78)');g.addColorStop(1,'rgba(11,11,11,.96)');x.fillStyle=g;x.fillRect(0,0,W,H);
    var g2=x.createLinearGradient(0,0,0,220);g2.addColorStop(0,'rgba(11,11,11,.7)');g2.addColorStop(1,'rgba(11,11,11,0)');x.fillStyle=g2;x.fillRect(0,0,W,220)}
  else{x.strokeStyle='rgba(255,217,0,.10)';x.lineWidth=2;for(var i=-H;i<W;i+=70){x.beginPath();x.moveTo(i,H);x.lineTo(i+H,0);x.stroke()}}
  x.textBaseline='alphabetic';
  x.fillStyle='#FFD900';x.font='700 34px Inter, system-ui, sans-serif';x.fillText('MACRO GOLF',64,96);
  x.fillStyle='#F4F1EA';x.font='600 30px Inter, system-ui, sans-serif';var dt=new Date().toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
  x.textAlign='right';x.fillText(dt,W-64,96);x.textAlign='left';
  var y=H-120,fun=(x.font='600 40px Inter, system-ui, sans-serif',wrap(x,L.fun,W-128));
  for(var j=fun.length-1;j>=0;j--){x.fillStyle='#F4F1EA';x.fillText(fun[j],64,y);y-=54}
  y-=26;x.fillStyle='#FFD900';x.fillRect(64,y,150,12);y-=40;
  x.fillStyle='#F4F1EA';x.font='700 36px Inter, system-ui, sans-serif';x.fillText(L.sub.toUpperCase(),64,y);y-=62;
  var size=200;x.font='400 '+size+'px Anton, Impact, sans-serif';while(x.measureText(L.head.toUpperCase()).width>W-128&&size>90){size-=10;x.font='400 '+size+'px Anton, Impact, sans-serif'}
  x.fillStyle='#FFD900';x.fillText(L.head.toUpperCase(),64,y);y-=size*0.95;
  var who=(s.title||'Session done').toUpperCase();x.font='400 52px Anton, Impact, sans-serif';var tl=wrap(x,who,W-128).slice(0,2);
  for(var k=tl.length-1;k>=0;k--){x.fillStyle='#F4F1EA';x.fillText(tl[k],64,y);y-=60}
  if(s.name){x.fillStyle='rgba(244,241,234,.75)';x.font='600 30px Inter, system-ui, sans-serif';x.fillText(s.name+'\u2019s session',64,y)}
  var bits=[];if(s.sets)bits.push(s.sets+' sets');if(s.mins)bits.push(s.mins+' min');if(s.kg>0&&s.reps>0)bits.push(fmt(s.reps)+' bodyweight reps');
  x.fillStyle='rgba(244,241,234,.7)';x.font='600 28px Inter, system-ui, sans-serif';x.fillText(bits.join('  \u00b7  '),64,H-56)}
function css(){if(document.getElementById('mgself-css'))return;var st=document.createElement('style');st.id='mgself-css';st.textContent=[
 '.mgself{position:fixed;inset:0;z-index:100000;background:#0B0B0B;color:#F4F1EA;display:flex;flex-direction:column;align-items:center;overflow:auto;padding:16px 16px 28px;font-family:Inter,system-ui,sans-serif}',
 '.mgself .k{font-weight:700;font-size:12px;letter-spacing:2.4px;text-transform:uppercase;color:#FFD900;align-self:stretch;max-width:520px;margin:6px auto 10px;width:100%}',
 '.mgself canvas,.mgself img.out{width:100%;max-width:420px;height:auto;aspect-ratio:4/5;display:block;border:1px solid rgba(244,241,234,.18)}',
 '.mgself .row{display:flex;flex-direction:column;gap:10px;width:100%;max-width:420px;margin-top:14px}',
 '.mgself button,.mgself label.b,.mgself a.b{min-height:54px;border:0;background:#FFD900;color:#0B0B0B;font-family:Anton,Impact,sans-serif;text-transform:uppercase;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none}',
 '.mgself .g{background:transparent;color:#F4F1EA;border:1.5px solid rgba(244,241,234,.5);font-family:Inter,system-ui,sans-serif;font-weight:700;font-size:15px;text-transform:none}',
 '.mgself input[type=file]{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}',
 '.mgself .tip{font-size:13px;color:#c9c4b8;text-align:center;margin:6px 0 0}',
 '.mgself :focus-visible{outline:3px solid #FFD900;outline-offset:2px}'].join('');document.head.appendChild(st)}
function open(s){css();var o=document.createElement('div');o.className='mgself';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Post a selfie');
  o.innerHTML='<div class="k">Post a selfie</div><canvas aria-label="Your workout picture"></canvas>'+
   '<div class="row"><label class="b" for="mgself-cam">\ud83d\udcf8 Take a selfie</label><input type="file" id="mgself-cam" accept="image/*" capture="user">'+
   '<button type="button" class="share" disabled>Share</button><button type="button" class="g save">Save picture</button><button type="button" class="g x">Close</button></div><p class="tip" role="status"></p>';
  document.body.appendChild(o);var prev=document.body.style.overflow;document.body.style.overflow='hidden';
  var cv=o.querySelector('canvas'),tip=o.querySelector('.tip'),img=null;
  function redraw(){draw(cv,s,img);o.querySelector('.share').disabled=false}
  var ready=document.fonts&&document.fonts.load?Promise.all([document.fonts.load('400 120px Anton'),document.fonts.load('700 30px Inter')]).catch(function(){}):Promise.resolve();
  ready.then(redraw);redraw();
  o.querySelector('#mgself-cam').addEventListener('change',function(){var f=this.files&&this.files[0];if(!f)return;var u=URL.createObjectURL(f),im=new Image();
    im.onload=function(){img=im;redraw();tip.textContent='Looking good. Share it or save it.'};im.onerror=function(){tip.textContent='That picture would not open. Try another.'};im.src=u});
  function blob(){return new Promise(function(res){cv.toBlob(function(b){res(b)},'image/jpeg',0.9)})}
  function showImage(){var u=cv.toDataURL('image/jpeg',0.9),im=document.createElement('img');im.className='out';im.alt='Your workout picture';im.src=u;cv.replaceWith(im);cv=document.createElement('canvas');draw(cv,s,img);
    tip.textContent='Press and hold the picture to save or share it.';var a=document.createElement('a');a.className='b';a.href=u;a.download='macro-golf-workout.jpg';a.textContent='Download';o.querySelector('.row').insertBefore(a,o.querySelector('.save'))}
  o.querySelector('.share').addEventListener('click',function(){blob().then(function(b){var file=b&&typeof File==='function'?new File([b],'macro-golf-workout.jpg',{type:'image/jpeg'}):null;
    if(file&&navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],text:line(s).fun+' #MacroGolf'}).catch(function(){})}else showImage()})});
  o.querySelector('.save').addEventListener('click',function(){var im=o.querySelector('img.out');if(im){tip.textContent='Press and hold the picture to save it.';return}
    try{var a=document.createElement('a');a.href=cv.toDataURL('image/jpeg',0.9);a.download='macro-golf-workout.jpg';document.body.appendChild(a);a.click();a.remove()}catch(e){}showImage()});
  function close(){o.remove();document.body.style.overflow=prev}
  o.querySelector('.x').addEventListener('click',close);o.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  setTimeout(function(){o.querySelector('label.b').focus&&o.querySelector('label.b').setAttribute('tabindex','0');o.querySelector('label.b').focus()},30);
  o.querySelector('label.b').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();o.querySelector('#mgself-cam').click()}})}
return {open:open,line:line,read:read}})();
