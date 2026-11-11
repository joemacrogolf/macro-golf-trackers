// @code 527903  @name Sam McDowell
var CLIENT={
  name:'Sam McDowell',first:'Sam',key:'sam-mcdowell',weeks:8,
  kicker:'Strength & Power',subtitle:'October – December 2026 · eight weeks',planName:'Strength & Power Plan',
  features:{checkin:true,alcohol:true,cardio:true,weight:true},
  strip:[['Gym','2 / week'],['Cardio','1 / week']],
  streak:{id:'meditate',label:'Meditation streak',name:'Meditation'},
  habits:[
    {id:'meditate',name:'Meditation',desc:'Tick it off once you have done today\'s meditation.'},
    {id:'journal',name:'Journalling',desc:'Tick it off once you have written today\'s entry.'}
  ],
  weekly:{gym:2,cardio:1},
  weekNote:'Cycle between Workout 1 and Workout 2, with a cardio day in between.',
  objective:'Four supersets. Move straight from the first exercise to the second, then rest 45 seconds before the next set. Warm up before every workout.',
  restNote:'Little to no rest between the two exercises in a superset. Rest 45 seconds before repeating.',
  guide:[
    ['RPE 7','Hard. About three reps left in the tank.'],
    ['RPE 8','About two reps left.'],
    ['RPE 10','On jumps, maximal explosive effort. Mark each set Fast, or Slowed if the speed dropped.'],
    ['Progress','As you get stronger, increase the weight while keeping the same RPE. If the RPE is consistently lower than the target, add weight. If it is higher, go lighter.'],
    ['Load','After each set, enter the kg, reps and RPE. The next set shows a suggested load: one step lighter if it felt a full point harder than the target, one step heavier if it felt a full point easier.']
  ]
};
function ss(tag,a,b){return {tag:tag,label:'Superset '+tag,rest:'45s',ex:[a,b]}}
var SESSIONS=[
  {name:'Workout 1',tab:'W1',title:'Strength and Power',short:'Squat · chest press · RDL',blocks:[
    ss('A',x('goblet','Goblet Squat',{sets:4,reps:5,rpe:8,inc:DB,kind:'Strength'}),x('boxjump','Box Jumps',{sets:4,reps:8,rpe:MAX,inc:BW,kind:'Power'})),
    ss('B',x('sachest','Cable Single Arm Chest Press',{sets:4,reps:10,rpe:8,inc:CABLE,kind:'Strength'}),x('gsrback','Golf Swing Row (Backswing)',{sets:4,reps:8,rpe:8,inc:CABLE,kind:'Strength'})),
    ss('C',x('steprot','Step Rotation Sequence',{sets:3,reps:10,side:true,rpe:7,inc:BW,kind:'Control'}),x('slpallof','Single Leg Pallof Press',{sets:3,reps:10,side:true,rpe:7,inc:CABLE,kind:'Control'})),
    ss('D',x('dbrdl','Dumbbell RDLs',{sets:3,reps:8,rpe:8,inc:DB,kind:'Strength'}),x('lmanti','Landmine Anti Rotation',{sets:3,reps:8,rpe:8,inc:PLATE,kind:'Strength'}))]},
  {name:'Workout 2',tab:'W2',title:'Strength and Power',short:'Swing · row · aeroplanes',blocks:[
    ss('A',x('kbswing','GRF Kettlebell Swing',{sets:3,reps:10,rpe:8,inc:KB,kind:'Power'}),x('heiden','Heiden to Vertical Jump',{sets:3,reps:3,side:true,rpe:MAX,inc:BW,kind:'Power'})),
    ss('B',x('sarow','Cable Single Arm Row',{sets:4,reps:10,side:true,rpe:8,inc:CABLE,kind:'Strength'}),x('gsrdown','Golf Swing Row (Downswing)',{sets:4,reps:10,side:true,rpe:8,inc:CABLE,kind:'Strength'})),
    ss('C',x('resstep','Resistance Step with Rotation',{sets:3,reps:10,side:true,rpe:7,inc:CABLE,kind:'Control'}),x('slbridge','Single Leg Glute Bridge',{sets:3,reps:10,side:true,rpe:8,inc:BW,kind:'Strength'})),
    ss('D',x('aeroplane','Hip Aeroplanes',{sets:3,reps:8,side:true,rpe:7,inc:BW,kind:'Control'}),x('pullup','Pull Ups',{sets:3,reps:6,rpe:8,inc:BW,kind:'Strength'}))]}
];
