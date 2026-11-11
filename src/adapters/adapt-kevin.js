mgsWeekly({label:'MACRO GOLF WORKOUT TRACKER',per:2,noun:'workouts',weekText:'Both workouts done this week.',
  exercises:function(rec){return WORKOUTS[rec.workout].ex.filter(function(e){return e.load==='kg'})},
  sets:function(h,e){return (h.rounds||[]).map(function(r){var x=r.ex[e.id]||{};return {w:num(x.w),r:x.r?num(x.r):e.reps,date:h.date}})},
  minReps:function(e){return e.reps},
  todayLine:function(rec){var n=rec.rounds.length;return n+' circuit'+(n===1?'':'s')+' today'}});
