// @code 576900  @name Colin Howard
var CLIENT={
  name:'Colin Howard',first:'Colin',key:'colin-howard',weeks:6,
  kicker:'Performance Plan',subtitle:'Phase 2 · six week plan',planName:'Performance Plan',
  features:{mobility:true,checkin:true},
  strip:[['Gym','2 / week'],['Mobility','Daily'],['Gratitude','Daily']],
  streak:{id:'gratitude',label:'Gratitude streak',name:'Gratitude'},
  habits:[
    {id:'gratitude',name:'Gratitude journal',desc:'Answer these in your journal each morning, before you start your day. Keep it to a few lines. 1. What are three things you are grateful for today? Be specific: a person, a moment or something your body did well. 2. Who or what made your life easier yesterday, and did you acknowledge it? 3. What is one thing in your golf or training you appreciate right now?'}
  ],
  mobilityDesc:'Do this daily, or before every session. Eight movements, about 10 minutes: Cat Cow, 90 90, Hip Rotation Complex, Hip Flexor Smash Roller, Open Books, Half Kneeling Spine Rotations, Seated Spinal Rotation with Tilt and Standing Helicopters. Move to end range without forcing it and keep your breathing relaxed. Tick it off and note which video you did.',
  weekly:{gym:2},
  weekNote:'Complete Workout 1 and Workout 2 once each week.',
  objective:'Workout 1 is lower body and shoulder press. Workout 2 is hinge, pull and side lunge. Each workout starts with a short warm up block.',
  restNote:'Rest 30 seconds after warm up and rotation blocks, and 45 seconds after the strength blocks, unless a block says otherwise.',
  guideSub:'Weights, RPE and how the load is suggested',
  guide:[
    ['RPE','Stop each set with the target reps in reserve. RPE 7 is about three reps left, RPE 6 about four. Warm up work stays easy at RPE 3 to 4.'],
    ['Progress','Choose a weight that matches the RPE, and progress the load when it feels easier.'],
    ['Load','After each set, enter the kg, reps and RPE. Each set is suggested from the same set last time: one step lighter if it felt a full point harder than the target, one step heavier if it felt a full point easier.']
  ]
};
function wu(id,name,reps,rpe,inc,o){o=o||{};return x(id,name,{sets:2,reps:reps,rpe:rpe,kind:'Warm up',inc:inc,side:o.side,note:o.note})}
function st(id,name,reps,rpe,inc,o){o=o||{};return x(id,name,{sets:o.sets||3,reps:reps,rpe:rpe,kind:'Strength',inc:inc,side:o.side,note:o.note})}
function blk(tag,label,rest,ex){return {tag:tag,label:label,rest:rest,ex:ex}}
var SESSIONS=[
  {name:'Workout 1',tab:'W1',title:'Lower Body + Shoulder Press',short:'Lower body + shoulder press',blocks:[
    blk('A','Warm up · 2 sets','30s',[wu('bandbs','Deep Banded Backswing',6,3,BW),wu('glbridge','Glute Bridge',10,4,BW)]),
    blk('B','Superset B','45s',[st('revlunge','Dumbbell Reverse Lunge',6,7,DB,{side:true}),st('slrdl','Dumbbell Single Leg RDL',8,7,DB,{side:true})]),
    blk('C','Block C','45s',[st('seatsp','Seated Dumbbell Shoulder Press',8,6,DB)])]},
  {name:'Workout 2',tab:'W2',title:'Hinge + Pull + Side Lunge',short:'Hinge + pull + side lunge',blocks:[
    blk('A','Warm up · 2 sets','30s',[wu('bandbs','Deep Banded Backswing',6,3,BW)]),
    blk('B','Superset B','45s',[st('widedl','Wide Stance Dumbbell Deadlift',8,7,DB),st('fsrow','Freestanding Dumbbell Row',8,6,DB,{side:true})]),
    blk('C','Block C','30s',[st('sidelunge','Dumbbell Side Lunge',8,7,DB,{side:true})]),
    blk('D','Block D · 2 sets','30s',[st('dbrot','Dumbbell Rotations',8,7,DB,{side:true,sets:2})])]}
];
