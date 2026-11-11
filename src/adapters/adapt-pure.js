(function(){
  S.mgsWins=S.mgsWins||[];S.mgsDone=S.mgsDone||{};
  MGS.init({name:'',label:'MACRO GOLF · '+document.title.toUpperCase(),save:save,list:function(){return S.mgsWins}});
  var s1=document.createElement('div');s1.className='mgs-slot';$('status').parentNode.insertBefore(s1,$('status').nextSibling);
  function who(){var p=String(S.player||'').trim();return (p?p.toUpperCase()+' · ':'')+'WEEK '+S.week}
  function ord(k){var m=k.match(/^p(\d+)-w(\d+)-d(\d+)$/);return m?(+m[1])*10000+(+m[2])*100+(+m[3]):-1}
  function done(e,s){return typeof isDone==='function'?isDone(e,s):setDone(s)}
  function sets(k,e){return ((S.logs[k]||{})[e.id]||[]).filter(function(s){return done(e,s)}).map(function(s){return {w:num(s.w),r:num(s.r),date:S.finished[k]}})}
  function minR(e){if(e.plan)return Math.min.apply(null,e.plan.map(function(p){return p.reps}));var r=parseFloat(e.reps);return isNaN(r)?1:r}
  function weekDone(w){var ph=phase(),n=ph.days?ph.days.length:0;if(!n)return false;for(var i=0;i<n;i++)if(!S.finished[sessKey(ph.id,w,i)])return false;return true}
  function onFinish(){var k=curKey();if(!S.finished[k]||S.mgsDone[k])return;S.mgsDone[k]=1;save();
    var ph=phase(),d=ph.days&&ph.days[S.day];if(!d)return;var found=[],best=null,o=ord(k);
    var prevKeys=Object.keys(S.finished).filter(function(x){return ord(x)>=0&&ord(x)<o}).sort(function(a,b){return ord(a)-ord(b)});
    d.blocks.forEach(function(b){b.ex.forEach(function(e){if(!e.inc||e.max||e.band||e.secs)return;var prev=[];prevKeys.forEach(function(pk){prev=prev.concat(sets(pk,e))});
      var p=MGS.pb(e,sets(k,e),prev,minR(e));if(p&&(!best||p.score>best.score)){p.id=e.id;best=p}})});
    if(best){best.who=who();found.push(['pb-'+best.id+'-'+k,best])}
    if(weekDone(S.week)){var n=ph.days.length,info={who:who(),line:n+' of '+n+' sessions this week',text:'Every session this week done.'};
      if(S.week===ph.weeks[1])found.push(['phase-'+ph.id,{tag:'Milestone',kick:'PHASE COMPLETE',big:ph.name.toUpperCase(),title:'COMPLETE',line:(ph.weeks[1]-ph.weeks[0]+1)+' weeks of training done',mBig:'<span>'+MGS.esc(ph.name)+'</span> complete',mText:'Every week of '+ph.name+' done. Huge effort.',who:who()}]);
      else{var s=0,w=S.week;while(w>=ph.weeks[0]&&weekDone(w)){s++;w--}
        found.push([2,4,8].indexOf(s)>=0?['st-'+s+'-'+ph.id+'-'+S.week,MGS.streakWin(s,info)]:['wk-'+ph.id+'-'+S.week,MGS.weekWin(S.week,info)])}}
    var tot=Object.keys(S.finished).length;if([5,10,25,50,75,100].indexOf(tot)>=0)found.push(['ms-'+tot,MGS.msWin(tot,'sessions',who(),'Logged in your Macro Golf plan')]);
    var fresh=found.filter(function(f){return MGS.add(f[0],f[1])});MGS.banners();
    if(fresh.length){s1.scrollIntoView({block:'center'});setTimeout(function(){MGS.celebrate(fresh[0][1])},250)}}
  $('finish').addEventListener('click',onFinish);
  MGS.banners();
})();
