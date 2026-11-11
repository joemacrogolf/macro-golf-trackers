// @code 741365  @name Rob Seeley
var CLIENT={
  name:'Rob Seeley',first:'Rob',key:'rob-seeley',weeks:0,
  kicker:'Training Plan',subtitle:'Upper and lower body',planName:'Training Plan',
  features:{checkin:true},
  strip:[['Gym','2 / week'],['Habits','3 / day']],
  streak:{id:'meditate',label:'Meditation streak',name:'Meditation'},
  habits:[
    {id:'meditate',name:'Meditation',desc:'Tick it off once you have done today\'s meditation.'},
    {id:'journal',name:'Journalling',desc:'Tick it off once you have written today\'s entry.'},
    {id:'breath',name:'Breath work',desc:'Tick it off once you have done today\'s breath work.'}
  ],
  weekly:{gym:2},
  weekNote:'One upper body and one lower body session each week.',
  objective:'Where you see a dropdown, pick the exercise you are doing today. Each exercise keeps its own history and bests. 3 sets of 10 throughout.',
  restNote:'Rest 60 seconds between sets.',
  guideSub:'Weights, RPE and how the load is suggested',
  guide:[
    ['Choices','Pick one exercise from each dropdown. The page remembers what you picked last time, and your weights and bests are tracked separately for each exercise.'],
    ['Weight','Log the weight you used for every set. Aim for a weight you can lift for all 10 reps with good form.'],
    ['RPE','Optional. 10 is maximum effort, 8 is about two reps left. Adding it helps the suggestions.'],
    ['Load','Your first set is suggested from last time. Go one step lighter if reps were short or it was a maximum effort, one step heavier if it felt easy (RPE 6 or below).']
  ]
};
function one(id,name,inc,slot){return x(id,name,{sets:3,reps:10,rpe:null,inc:inc,slot:slot})}
function blk(tag,label,ex){return {tag:tag,label:label,rest:'60s',ex:ex}}
var SESSIONS=[
  {name:'Upper Body',tab:'Upper',title:'Upper Body',short:'Press · row · shoulders · arms',blocks:[
    blk('A','Chest press · pick one',[one('dbbench','Dumbbell Bench Press',DB,'press'),one('bbbench','Barbell Bench Press',BAR,'press'),one('chestmach','Chest Press Machine',CABLE,'press')]),
    blk('B','Row · pick one',[one('dbrow','Dumbbell Single Arm Row',DB,'row'),one('seatrow','Seated Row Machine',CABLE,'row'),one('cablerow','Cable Row',CABLE,'row')]),
    blk('C','Shoulders · pick one',[one('dbsp','Dumbbell Shoulder Press',DB,'shoulder'),one('latraise','Dumbbell Lateral Raise',DB,'shoulder'),one('spmach','Shoulder Press Machine',CABLE,'shoulder')]),
    blk('D','Biceps',[one('curl','Bicep Curls',DB)]),
    blk('E','Triceps',[one('triext','Tricep Extensions',CABLE)])]},
  {name:'Lower Body',tab:'Lower',title:'Lower Body',short:'Squat · hinge · machines',blocks:[
    blk('A','Squat · pick one',[one('goblet','DB Goblet Squat',DB,'squat'),one('splitsq','Split Squat',DB,'squat'),one('slpress','Single Leg Leg Press Machine',CABLE,'squat')]),
    blk('B','Hamstrings · pick one',[one('slrdl','DB Single Leg RDL',DB,'ham'),one('legcurl','Leg Curl Machine',CABLE,'ham')]),
    blk('C','Quads',[one('legext','Leg Extension Machine',CABLE)]),
    blk('D','Adductors',[one('adduct','Adductor Machine',CABLE)]),
    blk('E','Abductors',[one('abduct','Abductor Machine',CABLE)])]}
];
