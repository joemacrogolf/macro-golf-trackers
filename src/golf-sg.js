/* golf-sg.js: strokes gained for Macro Golf practice games (golf pages only; Joe's trackers don't load it).
   Baseline: Mark Broadie's PGA Tour strokes-to-hole-out (fairway by yards, short game by lie, putts by feet),
   with a per-handicap gap from Shot Scope averages (the same model as the Long Game Test).
   Strokes gained for a shot = expected strokes before it - 1 - expected strokes after it (+1 for a penalty),
   for a golfer of the player's target handicap. Plus = better than that handicap, minus = worse.

   A page passes its own shot list:
   GSG.init({target:()=>S.target, shots:()=>[{n:'label', sg:number}], note:'how this game is scored', flash:true})
   GSG adds: a running total on the board, the strokes gained of each shot in the result flash, a
   "Strokes gained" card with every shot on the results, and a line in the coach report. */
var GSG=(function(){
var FW=[[50,2.66],[60,2.70],[70,2.72],[80,2.75],[90,2.78],[100,2.80],[120,2.85],[140,2.91],[160,2.98],[180,3.05],[200,3.19],[220,3.32],[240,3.45],[260,3.55],[280,3.65],[300,3.71],[350,3.87],[400,4.00]];
var SHORT={fw:[[0,1.0],[5,2.05],[10,2.18],[20,2.40],[30,2.52],[40,2.60],[50,2.66]],rough:[[0,1.0],[5,2.2],[10,2.34],[20,2.59],[30,2.70],[40,2.78],[50,2.87]],sand:[[0,1.0],[5,2.37],[10,2.43],[20,2.53],[30,2.66],[40,2.82],[50,2.92]]};
var PUTT=[[0,1.0],[2,1.01],[3,1.04],[4,1.13],[5,1.23],[6,1.34],[7,1.42],[8,1.50],[10,1.61],[15,1.78],[20,1.87],[30,1.98],[40,2.06],[50,2.14],[60,2.21],[90,2.35]];
/* [name, number, approach gap at 150 yds, putting gap at 20 ft, drive total, fairway %, penalty %] */
var LV=[["Tour",-5,0,0,300,.60,.03],["0",0,.15,.06,270,.55,.05],["5",5,.32,.09,255,.52,.06],["10",10,.48,.12,240,.48,.08],["15",15,.63,.15,228,.45,.10],["20",20,.78,.18,215,.42,.12],["25",25,.93,.21,200,.40,.14],["30",30,1.08,.24,185,.38,.16]];
function interp(t,x){if(x<=t[0][0])return t[0][1];for(var i=1;i<t.length;i++){if(x<=t[i][0]){var a=t[i-1],b=t[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}}var a2=t[t.length-2],b2=t[t.length-1];return b2[1]+(b2[1]-a2[1])/(b2[0]-a2[0])*(x-b2[0])}
function lerpL(a,b,t){function L(i){return a[i]+(b[i]-a[i])*t}return {g:Math.max(-0.2,L(2)),gp:Math.max(-0.05,L(3)),D:L(4),fw:L(5),pen:L(6)}}
function P(n){if(n<=-5)return lerpL(LV[0],LV[1],(n-LV[0][1])/(LV[1][1]-LV[0][1]));
  for(var i=1;i<LV.length;i++)if(n<=LV[i][1])return lerpL(LV[i-1],LV[i],(n-LV[i-1][1])/(LV[i][1]-LV[i-1][1]));
  var a=LV[LV.length-2],b=LV[LV.length-1];return lerpL(a,b,(n-a[1])/(b[1]-a[1]))}
function num(h){return h==="Tour"?-5:(h===""||h==null||isNaN(+h))?10:+h}
function hname(h){h=h==null||h===""?"10":String(h);return h==="Tour"?"Tour":h==="0"?"Scratch":h+" hc"}
function lieOf(x){x=String(x||"").toLowerCase();return /sand|bunk/.test(x)?"sand":/fair|fw|fringe|apron|tight/.test(x)?"fw":/green/.test(x)?"green":"rough"}
/* expected strokes to hole out for handicap number n, from a lie, at a distance in yards */
function E(n,lie,yds){var p=P(n);
  if(lie==="green"){var ft=yds*3;return interp(PUTT,ft)+p.gp*Math.min(1.3,0.4+ft/20)}
  if(yds<=50){var tab=lie==="fw"?SHORT.fw:lie==="sand"?SHORT.sand:SHORT.rough;return interp(tab,yds)+p.g*0.75*(lie==="fw"?1:lie==="sand"?1.3:1.15)}
  var base=interp(FW,yds)+(lie==="fw"?0:lie==="rough"?0.15+0.1*Math.min(1,(yds-100)/100):0.45);
  return base+p.g*(0.6+0.4*Math.min(yds,300)/150)*(lie==="fw"?1:lie==="rough"?1.15:1.3)}
function putt(n,ft){return ft<=0?0:E(n,"green",ft/3)}
/* one putt from ft, finishing leaveFt away (0 = holed). Distance only: slope and break are not used (same number for every putt of that length) */
function puttSG(n,ft,leaveFt){return putt(n,ft)-1-putt(n,leaveFt)}
/* a chip, pitch or bunker shot from yds and a lie, finishing leaveFt from the hole */
function shortSG(n,lie,yds,leaveFt){return E(n,lieOf(lie),yds)-1-putt(n,leaveFt)}
/* an approach from the fairway to a flag d yds away; carry/off in yds; penalty = in the hazard */
function approachSG(n,d,carry,off,penalty){var dc=carry-d,p=Math.sqrt(dc*dc+off*off),r=8+0.03*d,aft;
  if(penalty)aft=1+E(n,"rough",Math.max(15,p));else if(p<=r)aft=putt(n,p*3);else aft=E(n,Math.abs(off)>30?"trouble":p<=r+10?"fw":"rough",p);
  return E(n,"fw",d)-1-aft}
/* value of driving distance per drive on a 400 yd hole: your total distance against the handicap's */
function driveSG(n,carry){var mine=carry*1.06;return E(n,"fw",Math.max(30,400-P(n).D))-E(n,"fw",Math.max(30,400-mine))}
function driveTotal(n){return P(n).D}

/* ---------- on the page ---------- */
var C=null,last=-1;
function fmt(x){return (x>=0?"+":"−")+Math.abs(x).toFixed(2)}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function list(){try{return (C.shots()||[]).filter(function(s){return s&&isFinite(s.sg)})}catch(e){return []}}
function tgt(){try{return C.target()}catch(e){return (window.S&&window.S.target)||"10"}}
function sum(L){return L.reduce(function(a,s){return a+s.sg},0)}
function head(L){if(C.summary)return C.summary(L,tgt());var t=sum(L);
  return {big:L.length?fmt(t):"–",line:L.length?fmt(t/L.length)+" per "+(C.unit||"shot")+" over "+L.length+" "+(C.unit||"shot")+(L.length===1?"":"s"):"Each "+(C.unit||"shot")+" is scored as you go."}}
function css(){if(document.getElementById("gsg-css"))return;var s=document.createElement("style");s.id="gsg-css";s.textContent=
 ".gsg-line{grid-column:1/-1;display:flex;justify-content:space-between;align-items:baseline;gap:10px;border-top:1px solid rgba(244,241,234,.18);padding-top:10px;margin-top:6px;font-family:var(--text),Inter,sans-serif;font-size:13px;color:#F4F1EA}"+
 ".gsg-line b{font-family:var(--display),Anton,Impact,sans-serif;font-weight:400;font-size:24px;color:#FFD900;letter-spacing:0}.gsg-line span{opacity:.85}"+
 ".gsg-f{font-weight:700}"+
 ".gsg-pick select{font:inherit;color:#0B0B0B;background:#F4F1EA;border:0;border-radius:4px;padding:2px 4px;margin-left:4px}"+
 ".gsg-card{display:flex;flex-direction:column;gap:10px;border-top:2px solid #0B0B0B;padding-top:16px;margin-top:6px}"+
 ".gsg-top{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap}"+
 ".gsg-top .eyebrow{display:block}.gsg-big{font-family:var(--display),Anton,Impact,sans-serif;font-size:54px;line-height:.9;color:#0B0B0B}"+
 ".gsg-sub{font-family:var(--text),Inter,sans-serif;font-size:13px;color:#77715F;text-align:right}"+
 ".gsg-card table td.up{color:#1FA855;font-weight:700}.gsg-card table td.down{color:#E0352B;font-weight:700}"+
 ".gsg-card .gsg-note{margin:0;font-family:var(--text),Inter,sans-serif;font-size:12.5px;color:#77715F;line-height:1.5}";
 document.head.appendChild(s)}
function paintBoard(L){var b=document.querySelector(".board");if(!b)return;var el=b.querySelector(".gsg-line");
  if(!el){el=document.createElement("div");el.className="gsg-line";var st=b.querySelector(".status");(st&&st.parentNode===b)?b.insertBefore(el,st.nextSibling):(st?st.parentNode.insertBefore(el,st.nextSibling):b.appendChild(el))}
  var h=head(L),lab=C.boardLabel||("Strokes gained vs "+hname(tgt()));
  if(C.setTarget){var o=["Tour","0","5","10","15","20","25","30"].map(function(v){return '<option value="'+v+'"'+(String(tgt())===v?" selected":"")+'>'+(v==="Tour"?"Tour":v==="0"?"Scratch":v+" hc")+'</option>'}).join("");
    lab='<label class="gsg-pick">Strokes gained vs <select aria-label="Target handicap">'+o+'</select></label>'}else lab=esc(lab);
  el.innerHTML='<span>'+lab+'</span><b class="tnum">'+esc(h.big)+'</b>';
  var sel=el.querySelector("select");if(sel)sel.onchange=function(){C.setTarget(sel.value);paint()}}
function paintFlash(L){if(L.length===last)return;var grew=L.length>last;last=L.length;if(C.flash===false||!grew||!L.length)return;
  var f=document.querySelector("#flash .flash span");if(!f||f.querySelector(".gsg-f"))return;
  f.insertAdjacentHTML("beforeend",'<br><span class="gsg-f">Strokes gained '+esc(fmt(L[L.length-1].sg))+' vs '+esc(hname(tgt()))+'</span>')}
function paintCard(L){if(C.card===false)return;var fin=document.getElementById("finished");if(!fin)return;var el=fin.querySelector(".gsg-card");
  if(!el){el=document.createElement("div");el.className="gsg-card";var d=fin.querySelector(".mgcta")||fin.querySelector(".mgs-slot")||fin.querySelector(".done");
    d?d.parentNode.insertBefore(el,d.nextSibling):fin.insertBefore(el,fin.firstChild)}
  if(fin.hidden&&!C.alwaysCard)return;var h=head(L);
  var rows=L.map(function(s,i){return '<tr><td>'+(i+1)+'</td><td class="l">'+esc(s.n)+'</td><td class="'+(s.sg>=0?"up":"down")+'">'+esc(fmt(s.sg))+'</td></tr>'}).join("");
  el.innerHTML='<div class="gsg-top"><div><span class="eyebrow">Strokes gained vs '+esc(hname(tgt()))+'</span><div class="gsg-big tnum">'+esc(h.big)+'</div></div><div class="gsg-sub">'+esc(h.line)+'</div></div>'+
    (rows?'<div class="grid"><table><thead><tr><th>#</th><th class="l">'+esc(C.colLabel||"Shot")+'</th><th>SG</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'')+
    '<p class="gsg-note">'+esc(C.note||"")+' Plus means better than a '+esc(hname(tgt()))+' golfer from the same spot, minus means worse. Baseline: Mark Broadie’s strokes gained data, adjusted by handicap.</p>'}
/* live strokes gained: every round of a game is kept on the player's record as S.sgLog (newest first, last 60 rounds),
   so My Numbers and the Practice Plan can move the test numbers with day-to-day practice. Tests are not logged here. */
var AREA={'golf-insanity':'Putting','golf-money-stealers':'Putting','golf-hole-out':'Putting','golf-par-18':'Short game','golf-fifty-ft-bank':'Short game',
  'golf-left-is-lava':'Approach','golf-wedge-darts':'Approach','golf-three-strikes':'Driving','golf-driver-corridor':'Driving'};
function pageName(){var s=document.querySelector('script[data-page]');return s?s.getAttribute('data-page'):''}
function today(){var d=new Date(),m=d.getMonth()+1,dd=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(dd<10?'0':'')+dd}
function logRound(L,area,hc){try{var S=window.S;area=area||AREA[pageName()];if(!S||!area||!L||!L.length)return;
  var n=L.length,t=L.reduce(function(a,x){return a+(+x.sg||0)},0),cur=S._sgRound;
  /* a new round starts when the shot list goes back to one shot after a longer round (an undo only ever drops one shot) */
  if(!cur||!cur.id||(n===1&&cur.n>=3)||n<cur.n-1)cur=S._sgRound={id:today()+'|'+Date.now().toString(36),n:n};cur.n=n;var id=cur.id;
  S.sgLog=Array.isArray(S.sgLog)?S.sgLog:[];var e=S.sgLog.filter(function(x){return x&&x.id===id})[0];
  if(e&&e.n===n&&Math.abs(e.sum-t)<1e-6)return;
  if(!e){e={id:id};S.sgLog.unshift(e)}e.d=id.slice(0,10);e.a=area;e.n=n;e.sum=Math.round(t*1000)/1000;e.hc=String(hc!=null&&hc!==''?hc:tgt());
  S.sgLog=S.sgLog.slice(0,60);if(typeof window.save==='function')window.save()}catch(e){}}
function paint(){if(!C)return;var L=list();paintBoard(L);paintFlash(L);paintCard(L);if(C.log!==false)logRound(L)}
function reportLines(){var L=list();if(!L.length)return [];var h=head(L);return ["","Strokes gained vs "+hname(tgt())+": "+h.big+" ("+h.line+")"]}
function init(o){C=o;css();last=list().length;
  if(typeof window.renderAll==="function"){var r=window.renderAll;window.renderAll=function(){var x=r.apply(this,arguments);try{paint()}catch(e){}return x}}
  if(typeof window.buildReport==="function"){var b=window.buildReport;window.buildReport=function(){var t=b.apply(this,arguments);try{var add=reportLines();if(add.length&&typeof t==="string")t=t.replace(/\s+$/,"")+"\n"+add.join("\n")}catch(e){}return t}}
  paint()}
return {init:init,paint:paint,logRound:logRound,E:E,num:num,name:hname,lieOf:lieOf,putt:putt,puttSG:puttSG,shortSG:shortSG,approachSG:approachSG,driveSG:driveSG,driveTotal:driveTotal,fmt:fmt,P:P};
})();
