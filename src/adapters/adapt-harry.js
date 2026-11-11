mgsWeekly({label:'MACRO GOLF STRENGTH PROGRAMME',per:2,noun:'sessions',weekText:'Both sessions done this week.',
  exercises:function(rec){return WORKOUTS[rec.workout].ex.map(function(x0){return ex(x0,rec)}).filter(function(x){return x.inc})},
  sets:function(h,x){return ((h.logs||{})[x.id]||[]).filter(function(z){return z&&num(z.r)!=null&&num(z.rpe)!=null}).map(function(z){return {w:num(z.w),r:num(z.r),date:h.date}})},
  minReps:function(x){return x.repsLo},
  todayLine:function(rec){var s=stats(rec,rec.workout);return s.on+' of '+s.total+' sets on target today'},
  extra:function(rec,who){var s=stats(rec,rec.workout),perfect=function(h){var t=stats(h,h.workout);return t.done===t.total&&t.on===t.total};
    if(!perfect(rec)||S.history.slice(0,-1).some(perfect))return null;
    return ['aot',{tag:'Milestone',kick:'EVERY SET ON TARGET',big:s.total+'/'+s.total,title:'SETS ON TARGET',line:'First perfect session',mBig:'<span>Every set</span> on target',mText:'All '+s.total+' sets at the right reps and effort. A first.',who:who}]}});
