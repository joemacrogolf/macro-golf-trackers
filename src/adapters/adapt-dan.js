(function(){
  S.mgsWins=S.mgsWins||[];S.mgsDone=S.mgsDone||{};
  MGS.init({name:CLIENT.name,label:'MACRO GOLF PERFORMANCE PLAN',save:save,list:function(){return S.mgsWins}});
  var s1=document.createElement('div');s1.className='mgs-slot';$('status').parentNode.insertBefore(s1,$('status').nextSibling);
  var tr=$('todayRest'),s2=document.createElement('div');s2.className='mgs-slot';tr.insertBefore(s2,tr.firstChild);
  function who(){return CLIENT.first.toUpperCase()+' · WEEK '+S.week}
  function ord(k){var m=k.match(/^w(\d+)-s(\d+)$/);return m?(+m[1])*10+(+m[2]):-1}
  function sets(k,e){return ((S.logs[k]||{})[e.id]||[]).filter(function(z){return isDone(e,z)}).map(function(z){return {w:num(z.w),r:num(z.r),date:S.finished[k]}})}
  function onFinish(){var k=curKey();if(!S.finished[k]||S.mgsDone[k])return;S.mgsDone[k]=1;save();var found=[],best=null,o=ord(k);
    var prevKeys=Object.keys(S.finished).filter(function(x){return ord(x)>=0&&ord(x)<o}).sort(function(a,b){return ord(a)-ord(b)});
    SESSIONS[S.day].blocks.forEach(function(b){b.ex.forEach(function(e){if(!e.inc||e.max)return;var prev=[];prevKeys.forEach(function(pk){prev=prev.concat(sets(pk,e))});
      var p=MGS.pb(e,sets(k,e),prev,e.repsLo);if(p&&(!best||p.score>best.score)){p.id=e.id;best=p}})});
    if(best){best.who=who();found.push(['pb-'+best.id+'-'+k,best])}
    var n=Object.keys(S.finished).length,st=sessionStats(k,S.day),line=st.on+' of '+st.total+' sets on target today';
    if(n===SESSIONS.length*CLIENT.weeks)found.push(['plan',{tag:'Milestone',kick:'PLAN COMPLETE',big:CLIENT.weeks+' WEEKS',title:'PLAN COMPLETE',line:n+' gym sessions done',mBig:'<span>Plan</span> complete',mText:'All '+n+' gym sessions of your '+CLIENT.weeks+'-week plan done.',who:who()}]);
    else if([5,10,15].indexOf(n)>=0)found.push(['ms-'+n,MGS.msWin(n,'gym sessions',who(),line)]);
    var fresh=found.filter(function(f){return MGS.add(f[0],f[1])});checkWeek(fresh.length);MGS.banners();if(fresh.length)setTimeout(function(){MGS.celebrate(fresh[0][1])},250)}
  function checkWeek(quiet){if(S.week!==Math.min(CLIENT.weeks,Math.max(1,planWeekOf(todayIso()))))return;var c=weekCounts(S.week),W=CLIENT.weekly;
    if(c.gym>=W.gym&&c.practice>=W.practice&&c.mobility>=W.mobility&&MGS.add('wk-'+S.week,MGS.weekWin(S.week,{who:who(),line:'Gym '+c.gym+' · Practice '+c.practice+' · Mobility '+c.mobility,text:'Every gym, practice and mobility session done this week.'}))){MGS.banners();if(!quiet)MGS.celebrate(S.mgsWins[S.mgsWins.length-1].w)}}
  function checkJournal(){if(!habitOn(todayIso(),'journal'))return;var n=streak('journal');
    if([7,14,21,30,42].indexOf(n)>=0&&MGS.add('j-'+n+'-'+todayIso(),{tag:'Streak',kick:'JOURNAL STREAK',big:n+' DAYS',title:'JOURNALLED EVERY DAY',line:'Gratitude and brain dump, '+n+' days running',mBig:'<span>'+n+' days</span> of journalling',mText:'You have journalled every day for '+n+' days.',who:who()})){MGS.banners();MGS.celebrate(S.mgsWins[S.mgsWins.length-1].w)}}
  $('finish').addEventListener('click',onFinish);
  document.addEventListener('change',function(){setTimeout(function(){checkWeek();checkJournal()},0)});
  document.addEventListener('click',function(e){if(e.target.closest&&(e.target.closest('[data-mv]')||e.target.closest('[data-cell]')||e.target.closest('[data-mobday]')))setTimeout(function(){checkWeek();checkJournal()},0)});
  MGS.banners();
})();
