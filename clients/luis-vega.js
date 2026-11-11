// @code 694218  @name Luis Vega
var CLIENT={
  name:'Luis Vega',first:'Luis',key:'luis-vega',weeks:0,
  kicker:'Speed & Power',subtitle:'Home strength & conditioning',planName:'Speed & Power Plan',
  features:{mobility:true,checkin:true},gymTab:'Workouts',gymHeading:'Home workouts',
  strip:[['Workouts','3 / week'],['Mobility','Daily']],
  streak:{id:'mobility',label:'Mobility streak',name:'Mobility'},
  habits:[],
  mobilityDesc:'One of your mobility videos. Tick it off and note which one you did.',
  weekly:{gym:3},
  weekNote:'Complete each of the three workouts once a week.',
  objective:'Four supersets built around speed and power. Power exercises are 3 × 5 at maximal intent. Strength exercises follow a 12 / 10 / 8 pyramid at RPE 7 / 8 / 9. Warm up before every workout.',
  restNote:'No planned rest between the two exercises in a superset. Rest about 45–60 seconds between rounds.',
  guide:[
    ['Max intent','RPE 10 on power exercises means maximal explosive intent and output, not muscular failure. Mark each set Fast, or Slowed if the speed dropped.'],
    ['RPE 7 / 8 / 9','Strength pyramid: about three, two, then one rep left in the tank.'],
    ['Strength','Progress strength exercises through load where the prescribed RPE allows.'],
    ['Power','Progress power exercises through better speed, intent, coordination and output, not by adding fatigue.'],
    ['Barbell','Changing the load on the bar mid-workout is a pain. Choose one working load and keep the bar at that weight for the session.'],
    ['Load','After each set, enter the kg, reps and RPE. Pyramid sets are suggested from the same set last time.']
  ]
};
function pyr(id,name,inc,o){o=o||{};return x(id,name,{sets:3,reps:[12,10,8],rpe:[7,8,9],kind:'Strength',inc:inc,side:o.side,note:o.note})}
function pow(id,name,inc,o){o=o||{};return x(id,name,{sets:3,reps:5,rpe:MAX,kind:'Power',inc:inc,side:o.side,note:o.note})}
function ss(tag,a,b){return {tag:tag,label:'Superset '+tag,rest:'45–60s',ex:[a,b]}}
var SESSIONS=[
  {name:'Workout 1',tab:'W1',title:'Vertical + Arm Chop',short:'Vertical + arm chop',blocks:[
    ss('A',pow('fwdlunge','Forward Power Lunge',BW,{side:true}),pow('cmj','Counter Movement Jump',BW)),
    ss('B',pyr('bbrdl','Barbell RDL',BAR,{note:'Pick one working load and keep it for every set.'}),pow('hhslam','High Hands Slam',MB)),
    ss('C',pyr('splitsq','Dumbbell Split Squat',DB),pow('mbslam','Med Ball Slam',MB)),
    ss('D',pyr('bandrow','Banded Row',BW,{note:'Use a band that lets you hit the target RPE.'}),pow('bandchop','Low to High Cross Chop with Band',BW,{side:true}))]},
  {name:'Workout 2',tab:'W2',title:'Rotation + Lateral',short:'Rotation + lateral',blocks:[
    ss('A',pow('skater','Skater Jumps',BW,{side:true}),pow('discus','Med Ball Discus Throw',MB,{side:true})),
    ss('B',pyr('sidelunge','Dumbbell Side Lunge',DB),pow('heiden','Heiden to Vertical Jump',BW,{side:true})),
    ss('C',pow('bandrot','Banded Rotations',BW,{side:true}),pow('jbslam','Jump Back Overhead Slam',MB)),
    ss('D',pyr('sarow','Dumbbell Single Arm Row',DB),pow('bandpress','Banded Press with Rotation',BW,{side:true}))]},
  {name:'Workout 3',tab:'W3',title:'Wrist Release + Full-Body Power',short:'Wrist release + full body',blocks:[
    ss('A',pyr('dbpress','Dumbbell Press',DB),pow('splitpress','Split Press with Rotation',DB,{side:true})),
    ss('B',pow('powpress','Power Press Up',BW),pow('chestthrow','Supine Chest Throws',MB)),
    ss('C',pyr('dbrdl','Dumbbell RDL',DB),pow('fwdlunge','Forward Power Lunge',BW,{side:true})),
    ss('D',pyr('sarow','Dumbbell Single Arm Row',DB),pow('jbslam','Jump Back Overhead Slam',MB))]}
];
