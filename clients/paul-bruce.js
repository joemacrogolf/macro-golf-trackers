// @code 318462  @name Paul Bruce
var CLIENT={
  name:'Paul Bruce',first:'Paul',key:'paul-bruce',weeks:6,
  kicker:'Performance Plan',subtitle:'Phase 2 · six-week plan',planName:'Performance Plan',
  features:{checkin:true,weight:true},
  strip:[['Gym','4 / week'],['Habits','3 / day']],
  streak:{id:'meditate',label:'Meditation streak',name:'Meditation'},
  habits:[
    {id:'meditate',name:'Meditation',desc:'Keep up your established practice. 10 minutes minimum.'},
    {id:'gratitude',name:'Gratitude',desc:'Keep the focus on meaningful reflection rather than simply producing a list.'},
    {id:'breath',name:'Breath work',desc:'Notice your breathing and tension through the day. Use it to stay aware and regulate, not only during meditation.'}
  ],
  weekly:{gym:4},
  weekNote:'Fit your four physical sessions around your practice and on-course play.',
  gymNote:'This plan should help your golf. If your training ever limits your ability to practise or play, tell your coach straight away.',
  objective:'Four supersets. Strength exercises follow a 12 / 10 / 8 pyramid at RPE 7 / 8 / 9. Power exercises are 3 × 5 at maximal intent.',
  restNote:'No planned rest between the two exercises in a superset. Rest 45–60 seconds between rounds.',
  guide:[
    ['RPE 7','About three reps left in the tank. Set 1.'],
    ['RPE 8','About two reps left. Set 2.'],
    ['RPE 9','About one rep left. Set 3.'],
    ['Max intent','RPE 10 on power exercises means maximal explosive intent, not muscular failure. Mark each set Fast, or Slowed if the speed dropped.'],
    ['Progress','Keep the exercises, sets and reps the same through the block. Progress through load: the weight you need to hit RPE 7–9 should naturally go up. Don\'t add fatigue just to progress.'],
    ['Load','After each set, enter the kg, reps and RPE. Each set is suggested from the same set last time: one step lighter if it felt a full point harder than the target, one step heavier if it felt a full point easier.']
  ]
};
function pyr(id,name,inc,o){o=o||{};return x(id,name,{sets:3,reps:[12,10,8],rpe:[7,8,9],kind:'Strength',inc:inc,side:o.side,note:o.note})}
function pow(id,name,inc,o){o=o||{};return x(id,name,{sets:3,reps:5,rpe:MAX,kind:'Power',inc:inc,side:o.side,note:o.note})}
function ss(tag,a,b){return {tag:tag,label:'Superset '+tag,rest:'45–60s',ex:[a,b]}}
var SESSIONS=[
  {name:'Day 1',tab:'D1',title:'Arm Chop + Upper Body',short:'Arm chop + upper',blocks:[
    ss('A',pyr('pullup','Pull Up',BW),pow('hhslam','High Hands Slam',MB)),
    ss('B',pyr('latpd','Cable Lat Pull Down',CABLE),pow('mbslam','Med Ball Slam',MB)),
    ss('C',pyr('dbincline','Dumbbell Incline Bench Press',DB),pow('cpowrow','Cable Power Row',CABLE)),
    ss('D',pyr('woodchop','Cable Woodchop',CABLE),pow('crosschop','Low to High Cable Cross Chop',CABLE,{side:true}))]},
  {name:'Day 2',tab:'D2',title:'Vertical + Lower Body',short:'Vertical + lower',blocks:[
    ss('A',pyr('goblet','Dumbbell Goblet Squat',DB),pow('cmj','Counter Movement Jump',BW)),
    ss('B',pyr('dbrdl','Dumbbell RDL',DB),pow('powjump','Power Jumps',BW)),
    ss('C',pyr('splitsq','Dumbbell Split Squat',DB),pow('sldefhop','Single Leg Deficit Hop',BW,{side:true})),
    ss('D',pyr('legcurl','Laying Leg Curl',CABLE),pow('expstep','Explosive Step Downs',BW,{side:true}))]},
  {name:'Day 3',tab:'D3',title:'Wrist Release + Upper Body',short:'Wrist release + upper',blocks:[
    ss('A',pyr('dbflat','Dumbbell Flat Bench Press',DB),pow('chestthrow','Supine Chest Throws',MB)),
    ss('B',pyr('sarow','Dumbbell Single Arm Row',DB),pow('powpress','Power Press Up',BW)),
    ss('C',pyr('lmpress','Kneeling Landmine Single Shoulder Press',PLATE),pow('jbslam','Jump Back Overhead Slams',MB,{side:true})),
    ss('D',pyr('curl','Dumbbell Bicep Curl',DB),pyr('pushdown','Tricep Push Down',CABLE))]},
  {name:'Day 4',tab:'D4',title:'Rotation + Lateral + Second Power Exposure',short:'Rotation + lateral',blocks:[
    ss('A',pyr('sidelunge','Dumbbell Side Lunge',DB),pow('skater','Skater Jumps',BW,{side:true})),
    ss('B',pyr('fullrot','Cable Full Rotation',CABLE),pow('discus','Med Ball Discus Throw',MB,{side:true})),
    ss('C',pyr('revlunge','Dumbbell Reverse Lunge',DB),pow('heiden','Heiden to Vertical Jump',BW,{side:true})),
    ss('D',pyr('sapd','Cable Straight Arm Pull Downs',CABLE),pow('ohthrow','Overhead Throw',MB))]}
];
