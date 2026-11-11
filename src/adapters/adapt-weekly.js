/* shared by Harry + Kevin: wins checked after Finish */
function mgsWeekly(cfg){
  S.mgsWins=S.mgsWins||[];
  MGS.init({name:CLIENT.name,label:cfg.label,save:save,list:function(){return S.mgsWins}});
  var pw=$('p-work'),slot=document.createElement('div');slot.className='mgs-slot';pw.insertBefore(slot,pw.children[1]);
  var H=S.history,n0=H.length;
  function weekNo(d){return MGS.weeksBetween(MGS.monday(H.length?H[0].date:d),MGS.monday(d))+1}
  function cnt(m){return H.filter(function(h){return MGS.monday(h.date)===m}).length}
  function check(){
    var rec=H[H.length-1],d=rec.date,wn=weekNo(d),who=CLIENT.name.toUpperCase()+' · WEEK '+wn,found=[],best=null;
    cfg.exercises(rec).forEach(function(x){var prev=[];H.slice(0,-1).forEach(function(h){prev=prev.concat(cfg.sets(h,x))});
      var p=MGS.pb(x,cfg.sets(rec,x),prev,cfg.minReps(x));if(p&&(!best||p.score>best.score)){p.id=x.id;best=p}});
    if(best){best.who=who;found.push(['pb-'+best.id+'-'+d,best])}
    var mon=MGS.monday(d);
    if(cnt(mon)===cfg.per){var k=0,m=mon;while(cnt(m)>=cfg.per){k++;m=MGS.shift(m,-7)}
      var info={who:who,line:cfg.per+' of '+cfg.per+' '+cfg.noun+' this week',text:cfg.weekText};
      found.push([[2,4,8,12,16,26].indexOf(k)>=0?'st-'+k+'-'+mon:'wk-'+mon,[2,4,8,12,16,26].indexOf(k)>=0?MGS.streakWin(k,info):MGS.weekWin(wn,info)])}
    if([5,10,25,50,75,100].indexOf(H.length)>=0)found.push(['ms-'+H.length,MGS.msWin(H.length,cfg.noun,who,cfg.todayLine(rec))]);
    var extra=cfg.extra&&cfg.extra(rec,who);if(extra)found.push(extra);
    var fresh=found.filter(function(f){return MGS.add(f[0],f[1])});MGS.banners();
    if(fresh.length){slot.scrollIntoView({block:'center'});setTimeout(function(){MGS.celebrate(fresh[0][1])},250)}}
  $('finish').addEventListener('click',function(){if(H.length>n0){n0=H.length;check()}});
  MGS.banners();
}
