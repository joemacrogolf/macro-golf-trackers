/* Macro Golf · Build My Plan
   A rules-based plan generator (no AI). The same answers always give the same plan.
   Learned from the Macro Golf coaching plans:
   - Weeks are split by the five golf power sources: Arm Chop, Vertical, Wrist Release, Rotation, Lateral.
   - Sessions are A1/A2 pairs. Strength work uses a 12/10/8 pyramid at RPE 7/8/9; power work is 3 × 5 at max intent.
   - Goals decide how each pair is built (strength + power, strength + strength, strength + sequencing, sequencing + core).
   - Session length decides how many pairs (30 min = 2, 45 = 3, 60 = 4).
   - Level changes sets, reps, RPE and rest, and swaps in easier or harder versions.
   - Equipment picks the version of each exercise that the client can actually do.
   Load before the tracker engine; the page config calls MGBuild.generate(answers, tools). */
var MGBuild=(function(){

/* ---------------- EXERCISE LIBRARY ----------------
   k: S strength · P power · Q sequencing · C core/stability
   eq: minimum kit — b bands/bodyweight · h dumbbells + bands · g full gym
   inc: load step (DB 2, CABLE 2.5, MB 1, KB 4, PLATE 2.5, null = no load logged)
   side: per side · jump: high-impact · low: low-impact swap · easy / hard: beginner / advanced swap
   secs: timed hold */
var DB=2,CABLE=2.5,MB=1,KB=4,PLATE=2.5,BW=null;
var EX={
  /* strength · pulling */
  pullup:{n:'Pull Up',k:'S',eq:'g',inc:BW,easy:'latpd'},
  latpd:{n:'Cable Lat Pull Down',k:'S',eq:'g',inc:CABLE},
  hklatpd:{n:'Cable Single Arm Lat Pull Down',k:'S',eq:'g',inc:CABLE,side:1},
  bandlatpd:{n:'Banded Lat Pull Down',k:'S',eq:'b',inc:BW},
  cablerow:{n:'Cable Row',k:'S',eq:'g',inc:CABLE},
  dbrow:{n:'Dumbbell Single Arm Row',k:'S',eq:'h',inc:DB,side:1},
  bandrow:{n:'Banded Row',k:'S',eq:'b',inc:BW},
  sapd:{n:'Cable Straight Arm Pull Downs',k:'S',eq:'g',inc:CABLE},
  dbpullover:{n:'Dumbbell Pull Over',k:'S',eq:'h',inc:DB},
  bandsapd:{n:'Banded Straight Arm Pull Down',k:'S',eq:'b',inc:BW},
  facepull:{n:'Face Pull',k:'S',eq:'g',inc:CABLE},
  bandfacepull:{n:'Face Pull with Band',k:'S',eq:'b',inc:BW},
  /* strength · pushing */
  dbincline:{n:'Dumbbell Incline Bench Press',k:'S',eq:'g',inc:DB},
  dbflat:{n:'Dumbbell Flat Bench Press',k:'S',eq:'g',inc:DB},
  dbfloor:{n:'Dumbbell Floor Press',k:'S',eq:'h',inc:DB},
  pressup:{n:'Press Up',k:'S',eq:'b',inc:BW,easy:'incpressup'},
  incpressup:{n:'Elevated Press Up',k:'S',eq:'b',inc:BW},
  lmpress:{n:'Kneeling Landmine Single Shoulder Press',k:'S',eq:'g',inc:PLATE,side:1},
  hkdbpress:{n:'Single Arm Kneeling Shoulder Press',k:'S',eq:'h',inc:DB,side:1},
  bandohpress:{n:'Banded Shoulder Press',k:'S',eq:'b',inc:BW},
  /* strength · lower body */
  goblet:{n:'Dumbbell Goblet Squat',k:'S',eq:'h',inc:DB},
  bandsquat:{n:'Banded Squat',k:'S',eq:'b',inc:BW},
  dbrdl:{n:'Dumbbell RDL',k:'S',eq:'h',inc:DB},
  bandrdl:{n:'Banded RDL',k:'S',eq:'b',inc:BW},
  dbsplit:{n:'Dumbbell Split Squat',k:'S',eq:'h',inc:DB,side:1},
  splitbw:{n:'Split Squat',k:'S',eq:'b',inc:BW,side:1},
  dbrevlunge:{n:'Dumbbell Reverse Lunge',k:'S',eq:'h',inc:DB,side:1},
  revlungebw:{n:'Reverse Lunge',k:'S',eq:'b',inc:BW,side:1},
  dbsidelunge:{n:'Dumbbell Side Lunge',k:'S',eq:'h',inc:DB,side:1},
  sidelungebw:{n:'Lateral Lunge',k:'S',eq:'b',inc:BW,side:1},
  legcurl:{n:'Laying Leg Curl',k:'S',eq:'g',inc:CABLE},
  slbridge:{n:'Single Leg Glute Bridge',k:'S',eq:'b',inc:BW,side:1},
  legext:{n:'Leg Extension Machine',k:'S',eq:'g',inc:CABLE},
  dbstepup:{n:'Dumbbell Step Ups',k:'S',eq:'h',inc:DB,side:1},
  calf:{n:'Standing Calf Raise',k:'S',eq:'b',inc:DB},
  /* strength · rotation and arms */
  cablechop:{n:'Cable Woodchop',k:'S',eq:'g',inc:CABLE,side:1},
  bandchop:{n:'Banded Half Kneeling Chop',k:'S',eq:'b',inc:BW,side:1},
  cablerot:{n:'Cable Full Rotation',k:'S',eq:'g',inc:CABLE,side:1},
  bandrot:{n:'Banded Full Rotation',k:'S',eq:'b',inc:BW,side:1},
  pallof:{n:'Pallof Press',k:'S',eq:'g',inc:CABLE,side:1},
  bandpallof:{n:'Pallof Press',k:'S',eq:'b',inc:BW,side:1},
  dbcurl:{n:'Dumbbell Bicep Curl',k:'S',eq:'h',inc:DB},
  bandcurl:{n:'Banded Bicep Curl',k:'S',eq:'b',inc:BW},
  pushdown:{n:'Tricep Push Down',k:'S',eq:'g',inc:CABLE},
  dbtriext:{n:'Overhead Dumbbell Tricep Extension',k:'S',eq:'h',inc:DB},
  bandpushdown:{n:'Resistance Band Tricep Extensions',k:'S',eq:'b',inc:BW},
  /* power · arm chop */
  hhslam:{n:'High Hands Slam',k:'P',eq:'g',inc:MB},
  mbslam:{n:'Med Ball Slam',k:'P',eq:'g',inc:MB},
  jbslam:{n:'Jump Back Overhead Slam',k:'P',eq:'g',inc:MB,low:['mbslam','hhslam']},
  ohthrow:{n:'Overhead Throw',k:'P',eq:'g',inc:MB},
  dbsnatch:{n:'Dumbbell Snatch',k:'P',eq:'h',inc:DB,side:1},
  bandfastpd:{n:'Fast Banded Pull Down',k:'P',eq:'b',inc:BW},
  bandohchop:{n:'Banded Overhead Chop',k:'P',eq:'b',inc:BW},
  cablecross:{n:'Low to High Cable Cross Chop',k:'P',eq:'g',inc:CABLE,side:1},
  bandcross:{n:'Low to High Cross Chop with Band',k:'P',eq:'b',inc:BW,side:1},
  cablepowrow:{n:'Cable Power Row',k:'P',eq:'g',inc:CABLE},
  bandpowrow:{n:'Banded Power Row',k:'P',eq:'b',inc:BW},
  /* power · vertical */
  cmj:{n:'Counter Movement Jump',k:'P',eq:'b',inc:BW,jump:1,low:['expstepup','grfkbswing','dbswing'],hard:'boxjump'},
  boxjump:{n:'Box Jumps',k:'P',eq:'g',inc:BW,jump:1,low:['expstepup','grfkbswing','dbswing'],easy:'cmj'},
  powjump:{n:'Power Jumps',k:'P',eq:'b',inc:BW,jump:1,low:['expstepdown','grfkbswing','dbswing','expstepup']},
  fwdlunge:{n:'Forward Power Lunge',k:'P',eq:'b',inc:BW,side:1,low:['grfkbswing','dbswing','expstepup','expstepdown']},
  slhop:{n:'Single Leg Hop',k:'P',eq:'b',inc:BW,side:1,jump:1,low:['expstepdown','expstepup','dbswing'],easy:'expstepup',hard:'sldefhop'},
  sldefhop:{n:'Single Leg Deficit Hop',k:'P',eq:'b',inc:BW,side:1,jump:1,low:['expstepdown','expstepup','dbswing'],easy:'slhop'},
  expstepup:{n:'Explosive Step Ups',k:'P',eq:'b',inc:BW,side:1},
  expstepdown:{n:'Explosive Step Downs',k:'P',eq:'b',inc:BW,side:1},
  grfkbswing:{n:'GRF Kettlebell Swing',k:'P',eq:'g',inc:KB},
  dbswing:{n:'Dumbbell Swing',k:'P',eq:'h',inc:DB},
  /* power · wrist release */
  chestthrow:{n:'Supine Chest Throws',k:'P',eq:'g',inc:MB},
  powpressup:{n:'Power Press Up',k:'P',eq:'b',inc:BW,easy:'incpowpressup'},
  incpowpressup:{n:'Elevated Power Press Up',k:'P',eq:'b',inc:BW},
  cablepush:{n:'GRF Cable Push',k:'P',eq:'g',inc:CABLE,side:1},
  dbpushpress:{n:'Dumbbell Push Press',k:'P',eq:'h',inc:DB},
  bandpowpress:{n:'Banded Single Arm Push Press',k:'P',eq:'b',inc:BW,side:1},
  grflmpress:{n:'GRF Landmine Press',k:'P',eq:'g',inc:PLATE,side:1},
  /* power · rotation and lateral */
  discus:{n:'Med Ball Discus Throw',k:'P',eq:'g',inc:MB,side:1},
  latthrow:{n:'Lateral Medicine Ball Throw',k:'P',eq:'g',inc:MB,side:1},
  kpswing:{n:'Kneeling Power Swing',k:'P',eq:'g',inc:CABLE,side:1},
  bandrotfast:{n:'Banded Rotations',k:'P',eq:'b',inc:BW,side:1},
  bandpressrot:{n:'Banded Press with Rotation',k:'P',eq:'b',inc:BW,side:1},
  skater:{n:'Skater Jumps',k:'P',eq:'b',inc:BW,side:1,jump:1,low:['sidepowlunge','latthrow','bandrotfast']},
  heiden:{n:'Heiden to Vertical Jump',k:'P',eq:'b',inc:BW,side:1,jump:1,low:['sidepowlunge','discus','bandpressrot'],easy:'skater'},
  sidepowlunge:{n:'Side Power Lunge',k:'P',eq:'b',inc:BW,side:1},
  /* sequencing */
  grfseq:{n:'Resistance GRF Sequence',k:'Q',eq:'b',side:1},
  gsrback:{n:'Golf Swing Row (Backswing)',k:'Q',eq:'g',inc:CABLE,side:1},
  bandgsrback:{n:'Golf Swing Row (Backswing) - Band Version',k:'Q',eq:'b',side:1},
  gsrdown:{n:'Golf Swing Row (Downswing)',k:'Q',eq:'g',inc:CABLE,side:1},
  bandgsrdown:{n:'Golf Swing Row (Downswing) - Band Version',k:'Q',eq:'b',side:1},
  steprot:{n:'Step Rotation Sequence',k:'Q',eq:'b',side:1},
  steptrig:{n:'Step Trigger Wall Touch',k:'Q',eq:'b',side:1},
  resstep:{n:'Resistance Step with Rotation',k:'Q',eq:'g',inc:CABLE,side:1},
  bandresstep:{n:'Resistance Step with Rotation',k:'Q',eq:'b',side:1},
  splitrot:{n:'Split Press with Rotation',k:'Q',eq:'g',inc:CABLE,side:1},
  bandsplitrot:{n:'Split Press with Rotation',k:'Q',eq:'b',side:1},
  hipaero:{n:'Hip Aeroplanes',k:'Q',eq:'b',side:1},
  hipdrops:{n:'Hip Drops',k:'Q',eq:'b',side:1},
  kneesup:{n:'Knees Up Disassociation',k:'Q',eq:'b',side:1},
  deepbs:{n:'Deep Banded Backswing',k:'Q',eq:'b',side:1},
  slpallof:{n:'Single Leg Pallof Press',k:'Q',eq:'g',inc:CABLE,side:1},
  bandslpallof:{n:'Single Leg Pallof Press',k:'Q',eq:'b',side:1},
  /* core and stability */
  deadbug:{n:'Deadbug',k:'C',eq:'b',side:1},
  sideplank:{n:'Side Plank',k:'C',eq:'b',side:1,secs:1},
  birddog:{n:'Diagonal Bird Dogs',k:'C',eq:'b',side:1},
  corechop:{n:'Core Stability Chop',k:'C',eq:'g',inc:CABLE,side:1},
  bandcorechop:{n:'Core Stability Chop',k:'C',eq:'b',side:1},
  dorsal:{n:'Dorsal Raise',k:'C',eq:'b'},
  sbclams:{n:'Side Bridge Clams',k:'C',eq:'b',side:1},
  dbhalo:{n:'Dumbbell Halos',k:'C',eq:'h',inc:DB}
};
/* exercises that are new to the Macro Golf library (check a demo video exists) */
var NEW_IDS=['bandlatpd','bandsapd','bandfacepull','dbfloor','incpressup','hkdbpress','bandohpress','bandsquat','bandrdl','splitbw','revlungebw','sidelungebw','dbstepup','bandrot','bandcurl','bandpushdown','dbtriext','bandfastpd','bandohchop','bandpowrow','dbswing','incpowpressup','bandpowpress','bandgsrback','bandgsrdown','bandresstep','bandsplitrot','bandslpallof','bandcorechop','dbhalo','cablepush','latthrow','kpswing'];

/* ---------------- SLOTS: best option first ---------------- */
var SLOT={
  vpull:['pullup','latpd','bandlatpd'], vpull2:['hklatpd','latpd','bandlatpd'],
  hpull:['dbrow','bandrow'], hpull2:['cablerow','dbrow','bandrow'],
  pullover:['sapd','dbpullover','bandsapd'], facepull:['facepull','bandfacepull'],
  hpush:['dbincline','dbfloor','pressup'], hpush2:['dbflat','dbfloor','pressup'], vpush:['lmpress','hkdbpress','bandohpress'],
  squat:['goblet','bandsquat'], hinge:['dbrdl','bandrdl'], split:['dbsplit','splitbw'], revlunge:['dbrevlunge','revlungebw'],
  sidelunge:['dbsidelunge','sidelungebw'], hamcurl:['legcurl','slbridge'], bridge:['slbridge'], quad:['legext','dbstepup','splitbw'], calf:['calf'],
  woodchop:['cablechop','bandchop'], fullrot:['cablerot','bandrot'], antirot:['pallof','bandpallof'],
  curl:['dbcurl','bandcurl'], tricep:['pushdown','dbtriext','bandpushdown'],
  chop:['hhslam','dbsnatch','bandfastpd'], chop2:['jbslam','dbsnatch','bandohchop'], slam:['mbslam','bandohchop'],
  crosschop:['cablecross','bandcross'], powrow:['cablepowrow','bandpowrow'], ohthrow:['ohthrow','dbsnatch','bandfastpd'],
  vjump:['cmj'], vjump2:['powjump'], fwdlunge:['fwdlunge'], slhop:['slhop'], stepdown:['expstepdown'], swing:['grfkbswing','dbswing','fwdlunge'],
  wthrow:['chestthrow','powpressup'], powpress:['powpressup'], pushpress:['cablepush','dbpushpress','bandpowpress'], lmpush:['grflmpress','dbpushpress','bandpowpress'],
  rthrow:['discus','bandrotfast'], rthrow2:['latthrow','bandpressrot'], kpswing:['kpswing','bandpressrot'],
  skater:['skater'], heiden:['heiden'], sidepow:['sidepowlunge'],
  grfseq:['grfseq'], gsrback:['gsrback','bandgsrback'], gsrdown:['gsrdown','bandgsrdown'], steprot:['steprot'], steptrig:['steptrig'],
  resstep:['resstep','bandresstep'], splitrot:['splitrot','bandsplitrot'], hipaero:['hipaero'], hipdrops:['hipdrops'], kneesup:['kneesup'], deepbs:['deepbs'], slpallof:['slpallof','bandslpallof'],
  deadbug:['deadbug'], sideplank:['sideplank'], birddog:['birddog'], corechop:['corechop','bandcorechop'], dorsal:['dorsal'], sbclams:['sbclams'], halo:['dbhalo','birddog']
};
/* if a slot runs out (equipment, or already used in the session), fall back to these */
var FALLBACK={
  S:['dbrow','goblet','dbrdl','dbsplit','dbsidelunge','cablechop','pallof','bandrow','bandsquat','bandrdl','splitbw','revlungebw','sidelungebw','bandchop','bandrot','bandpallof','pressup','slbridge'],
  P:['powpressup','fwdlunge','sidepowlunge','expstepup','bandrotfast','bandpressrot','bandfastpd','bandcross','bandpowrow','expstepdown'],
  Q:['grfseq','steprot','steptrig','hipaero','hipdrops','kneesup','deepbs','bandgsrdown','bandresstep','bandsplitrot','bandslpallof'],
  C:['deadbug','birddog','sideplank','dorsal','sbclams','bandcorechop']
};

/* ---------------- DAY TEMPLATES (by golf power source) ----------------
   Each pair: s = main strength, a = second strength, p = power, p2 = second power, q = sequencing, c = core.
   arms: an arms pair stays strength + strength. Pairs are listed in priority order; session length keeps the first N. */
var PAIRS={
  CHOP:[
    {s:'vpull',a:'pullover',p:'chop',p2:'slam',q:'gsrback',c:'deadbug'},
    {s:'hpush',a:'hpull',p:'chop2',p2:'crosschop',q:'grfseq',c:'antirot'},
    {s:'hpull2',a:'facepull',p:'powrow',p2:'ohthrow',q:'steprot',c:'sideplank'},
    {s:'woodchop',a:'antirot',p:'crosschop',p2:'powrow',q:'splitrot',c:'corechop'}],
  VERT:[
    {s:'squat',a:'hamcurl',p:'vjump',p2:'vjump2',q:'steptrig',c:'deadbug'},
    {s:'hinge',a:'calf',p:'fwdlunge',p2:'swing',q:'hipaero',c:'birddog'},
    {s:'split',a:'quad',p:'slhop',p2:'stepdown',q:'hipdrops',c:'sideplank'},
    {s:'hamcurl',a:'bridge',p:'stepdown',p2:'vjump2',q:'kneesup',c:'dorsal'}],
  WRIST:[
    {s:'hpush2',a:'pullover',p:'wthrow',p2:'powpress',q:'gsrdown',c:'deadbug'},
    {s:'hpull',a:'facepull',p:'powpress',p2:'pushpress',q:'splitrot',c:'birddog'},
    {s:'vpush',a:'hpull2',p:'pushpress',p2:'lmpush',q:'grfseq',c:'sideplank'},
    {s:'curl',a:'tricep',p:'lmpush',p2:'wthrow',q:'deepbs',c:'halo',arms:1}],
  ROTLAT:[
    {s:'sidelunge',a:'fullrot',p:'skater',p2:'rthrow',q:'resstep',c:'sideplank'},
    {s:'fullrot',a:'antirot',p:'rthrow',p2:'kpswing',q:'steprot',c:'corechop'},
    {s:'revlunge',a:'hinge',p:'heiden',p2:'sidepow',q:'hipaero',c:'birddog'},
    {s:'pullover',a:'antirot',p:'rthrow2',p2:'skater',q:'kneesup',c:'sbclams'}],
  MOVE:[
    {q:'steprot',q2:'slpallof',c:'deadbug'},
    {q:'resstep',q2:'hipaero',c:'birddog'},
    {q:'grfseq',q2:'facepull',c:'sideplank'},
    {q:'kneesup',q2:'sbclams',c:'dorsal'}]
};
var DAYS={
  CHOP:{title:'Arm Chop + Upper Body',short:'Arm chop + upper',pairs:PAIRS.CHOP},
  VERT:{title:'Vertical + Lower Body',short:'Vertical + lower',pairs:PAIRS.VERT},
  WRIST:{title:'Wrist Release + Upper Body',short:'Wrist release + upper',pairs:PAIRS.WRIST},
  ROTLAT:{title:'Rotation + Lateral',short:'Rotation + lateral',pairs:PAIRS.ROTLAT},
  FULLA:{title:'Full Body · Arm Chop + Vertical',short:'Arm chop + vertical',pairs:[PAIRS.VERT[0],PAIRS.CHOP[0],PAIRS.VERT[1],PAIRS.CHOP[3]]},
  FULLB:{title:'Full Body · Wrist Release + Rotation + Lateral',short:'Wrist release + rotation',pairs:[PAIRS.WRIST[0],PAIRS.ROTLAT[0],PAIRS.ROTLAT[1],PAIRS.WRIST[1]]},
  WRL:{title:'Wrist Release + Rotation + Lateral',short:'Wrist release + rotation',pairs:[PAIRS.WRIST[0],PAIRS.ROTLAT[0],PAIRS.ROTLAT[1],PAIRS.WRIST[3]]},
  MOVE:{title:'Movement, Sequencing + Core',short:'Movement + core',pairs:PAIRS.MOVE,move:1}
};
var SPLIT={2:['FULLA','FULLB'],3:['CHOP','VERT','WRL'],4:['CHOP','VERT','WRIST','ROTLAT'],5:['CHOP','VERT','WRIST','ROTLAT','MOVE']};
var PAIRS_FOR_MIN={30:2,45:3,60:4};

/* ---------------- LEVELS ---------------- */
var LEVELS={
  beginner:{label:'Beginner',def:'Less than 6 months of regular strength training, or new to these exercises.',sets:-1,reps:2,rpe:-1,rest:15,swap:'easy'},
  intermediate:{label:'Intermediate',def:'6 months to 2 years of regular training. Comfortable with the main lifts and jumps.',sets:0,reps:0,rpe:0,rest:0,swap:null},
  advanced:{label:'Advanced',def:'2+ years of consistent training. Confident with heavy loads and explosive work.',sets:1,reps:0,rpe:0,rest:0,swap:'hard'}
};
var GOALS=[
  {id:'strength',label:'Strength & muscle',desc:'Build strength and muscle to support your swing.'},
  {id:'speed',label:'Speed & power',desc:'Hit it further. Explosive work across the golf power sources.'},
  {id:'seq',label:'Movement & sequencing',desc:'Better coordination, timing and control through the swing.'},
  {id:'life',label:'General fitness & longevity',desc:'Stay fit, robust and playing for years. Low-impact options.'}
];
var EQUIP=[
  {id:'gym',rank:2,label:'Full gym',desc:'Cables, machines, dumbbells, kettlebells, med balls, bench.'},
  {id:'home',rank:1,label:'Home · dumbbells + bands',desc:'A set of dumbbells and resistance bands.'},
  {id:'bands',rank:0,label:'Bands only',desc:'Resistance bands and your bodyweight.'}
];
var RANK={b:0,h:1,g:2};

/* ---------------- TRACKERS + MOBILITY ---------------- */
var TRACKERS=[
  {id:'checkin',label:'Energy & motivation',desc:'A quick 1–10 rating each day. Unlocks your day.',feature:'checkin'},
  {id:'meditate',label:'Meditation',desc:'Tick it off once you have done today\'s meditation.'},
  {id:'journal',label:'Journalling',desc:'Tick it off once you have written today\'s entry.'},
  {id:'breath',label:'Breath work',desc:'Tick it off once you have done today\'s breath work.'},
  {id:'gratitude',label:'Gratitude',desc:'Meaningful reflection rather than just a list.'},
  {id:'seqroutine',label:'Sequencing routine',desc:'Resistance GRF Sequence, Wall Step Trigger and Deep Banded Backswing. 2 × 10 controlled reps each.'},
  {id:'sleep',label:'Sleep 7+ hours',desc:'Tick it off if you slept at least 7 hours.'},
  {id:'steps',label:'8,000+ steps',desc:'Tick it off once you have hit 8,000 steps.'},
  {id:'water',label:'2 litres of water',desc:'Tick it off once you have drunk 2 litres.'},
  {id:'alcohol',label:'Alcohol (yes / no)',desc:'Log whether you had any alcohol today.',feature:'alcohol'},
  {id:'weight',label:'Body weight',desc:'Weigh-ins in kg with your trend.',feature:'weight'}
];
var PARTS=[
  {id:'hips',label:'Hips + Lower Back'},{id:'torso',label:'Torso'},{id:'upper',label:'Shoulders, Neck + Arms'},{id:'legs',label:'Legs'}
];
/* VidApp · Train › Mobility › Advanced Mobility › 10 Minute Mobility Routines (intro video left out) */
var MOBILITY=[
 ['Memento','Glutes & Lower Back','17:49','hips torso'],['Fantastic Four','Hamstrings, Hips, Lower Back and Upper Back','24:14','hips legs torso'],
 ['Logan','Traps','19:07','upper'],['Tommy\'s Honour','Glutes & Lower Back','17:53','hips'],['Rushmore','Hips','15:30','hips'],
 ['Joker','Hamstrings','12:48','legs'],['Argo','Lower Back, Obliques, Abs','12:21','hips torso'],['Aladdin','Hips','10:56','hips'],
 ['Deep Blue Sea','Hip Flexors','12:20','hips'],['Fight Club','Hips, Rotation, Shoulders','07:30','hips torso upper'],['Parasite','Shoulders','10:24','upper'],
 ['Congo','Hips','13:37','hips'],['The Invasion','Hips and Quads','11:19','hips legs'],['Grease','Hamstrings','07:15','legs'],
 ['Paul','Torso Rotation, Lats','08:45','torso'],['Deep Impact','Hips','21:40','hips'],['Leon','Hips & Disassociation','09:08','hips'],
 ['Taxi Driver','Hip Flexors','12:45','hips'],['Double Jeopardy','Hips','12:38','hips'],['Interstellar','Hips','08:02','hips'],
 ['The Secret Window','Hips','13:05','hips'],['Point Break','Hips','06:06','hips'],['The Negotiator','Hips','12:34','hips'],
 ['The Shining','Disassociation','09:27','hips torso'],['Return of the Jedi','Rotation','05:57','torso'],['Ferris Bueller\'s Day Off','Hips','12:50','hips'],
 ['Sunset Boulevard','Hips & Quads','16:39','hips legs'],['Dirty Dancing','Pelvic Tilt','10:38','hips'],['Inside Man','Squat','07:41','hips legs'],
 ['Jurassic Park','Lats','11:59','torso'],['Blade','T-Spine','09:15','torso'],['Godfather','Hips','09:40','hips'],['Casablanca','Shoulders','12:09','upper'],
 ['Fast Furious','Hips','04:12','hips'],['Mean Machine','T-Spine','09:39','torso'],['Mash','Glutes & Lower Back','15:07','hips torso'],
 ['Psycho','Lats','15:34','torso'],['Con Air','T-Spine','11:31','torso'],['Shawshank Redemption','Torso','09:30','torso'],
 ['Lost in Translation','Shoulders','08:52','upper torso'],['Shutter Island','Lower Back','11:40','hips torso'],['Kill Bill','Upper Back','11:57','torso'],
 ['Space Odyssey','T-Spine','06:37','torso'],['Monsters Inc','Chest','07:48','torso'],['Lost in New York','Forearms','04:22','upper'],
 ['The Hand That Rocks the Cradle','Wrists','09:06','upper'],['Sleeping Beauty','Neck','10:51','upper'],['Banded Wrist Mobilisation','Wrists','01:50','upper'],
 ['Tricep Smash','Triceps','03:45','upper'],['Snakes on a Plane','Forearms','05:51','upper'],['Top Gun','Shoulders','11:04','upper'],
 ['North By Northwest','Hamstrings','11:40','legs'],['Fargo','Lower Leg','09:43','legs'],['Pickpocket','Calves','12:14','legs'],
 ['Armageddon','Forearms','11:09','upper'],['Happy Feet','Feet and Calves','14:14','legs'],['Chicken Run','Lower Leg','06:07','legs'],
 ['Inception','Upper Back','14:16','torso'],['Silence of the Lambs','Calves','19:12','legs'],['The Breakfast Club','Hamstrings','03:10','legs'],
 ['X-Men','Adductors','14:04','legs'],['Twister','IT Band','15:36','legs'],['School of Rock','Hips','10:16','hips'],['Birdman','Hips','06:16','hips']
].map(function(v){return {name:v[0],area:v[1],mins:v[2],parts:v[3].split(' ')}});
var MOBILITY_WHERE='Train › Mobility › Advanced Mobility › 10 Minute Mobility Routines';

var DEFAULTS={first:'',goals:['strength','speed'],equip:'gym',level:'intermediate',days:3,minutes:45,trackers:['checkin'],custom:[],mobility:false,parts:[]};

/* ---------------- GENERATOR ---------------- */
function has(a,v){return a.indexOf(v)>=0}
function modesFor(goals,n,move){
  if(move){var m=[];for(var i=0;i<n;i++)m.push('QC');return m}
  var st=has(goals,'strength'),sp=has(goals,'speed'),sq=has(goals,'seq'),lf=has(goals,'life'),modes=[];
  for(var j=0;j<n;j++){
    if(st&&sp)modes.push('SP');
    else if(st)modes.push('SS');
    else if(sp)modes.push(j===0?'SP':'PP');
    else if(lf)modes.push(j===n-1&&n>2?'SC':'SS');
    else modes.push(j===0?'SC':'QC'); /* sequencing only */
  }
  var base=modes[0];
  if(sq&&(st||sp||lf)&&n>=2)modes[n-1]='SQ';
  if(lf&&(st||sp)&&n>=3){var k=sq?n-2:n-1;modes[k]='SC'}
  return modes;
}
function generate(ans,T){
  ans=ans||DEFAULTS;var x=T.x,MAX=T.MAX;
  var goals=(ans.goals&&ans.goals.length?ans.goals:DEFAULTS.goals).slice(),days=+ans.days||3,mins=+ans.minutes||45,lvl=LEVELS[ans.level]||LEVELS.intermediate;
  var eqo=EQUIP.filter(function(e){return e.id===ans.equip})[0]||EQUIP[0],urank=eqo.rank,low=has(goals,'life'),lifeOnly=!has(goals,'strength')&&!has(goals,'speed');
  var nPairs=PAIRS_FOR_MIN[mins]||3,split=SPLIT[Math.min(5,Math.max(2,days))];
  function ok(id){var e=EX[id];return e&&RANK[e.eq]<=urank}
  function cands(id){ /* the exercise after level + low-impact swaps, best first */
    var e=EX[id];if(!e)return [id];var out=[];
    if(low&&e.jump){(Array.isArray(e.low)?e.low:[e.low]).forEach(function(l){if(l&&ok(l))out.push(l)})}
    else{var sw=lvl.swap&&e[lvl.swap];if(sw&&ok(sw)&&!(low&&EX[sw].jump))out.push(sw);out.push(id)}
    if(low&&!e.jump&&e.low){(Array.isArray(e.low)?e.low:[e.low]).forEach(function(l){if(ok(l)&&out.indexOf(l)<0)out.push(l)})}
    return out}
  function pick(slot,kind,used){
    var list=(SLOT[slot]||[]).concat(FALLBACK[kind]||[]);
    for(var i=0;i<list.length;i++){var id=list[i];if(!ok(id))continue;var c=cands(id);for(var j=0;j<c.length;j++){var r=c[j];if(!ok(r)||used[r]||used['n:'+EX[r].n]||(low&&EX[r].jump))continue;used[r]=1;used['n:'+EX[r].n]=1;return r}}
    return null}
  function rest(base){if(!lvl.rest)return base;return base.replace(/\d+/g,function(n){return String(+n+lvl.rest)})}
  function build(id,role){
    var e=EX[id],sets=3,reps,rpe,kind;
    if(role==='S'){
      if(lifeOnly){reps=10+lvl.reps;rpe=7+lvl.rpe}else{reps=[12+lvl.reps,10+lvl.reps,8+lvl.reps];rpe=[7+lvl.rpe,8+lvl.rpe,9+lvl.rpe]}
      sets=3+lvl.sets;kind='Strength'}
    else if(role==='P'){reps=e.jump||!e.side?5:5;rpe=MAX;sets=Math.max(2,3+Math.min(0,lvl.sets));kind='Power'}
    else if(role==='Q'){reps=8;rpe=null;sets=Math.max(2,3+Math.min(0,lvl.sets));kind='Sequencing'}
    else{reps=e.secs?'30–40':10;rpe=null;sets=Math.max(2,3+Math.min(0,lvl.sets));kind=e.k==='S'?'Strength':'Core'}
    if(role==='S'&&Array.isArray(reps)&&sets>3){reps=reps.concat([reps[2]]);rpe=rpe.concat([rpe[2]])}
    if(role==='S'&&Array.isArray(reps)&&sets<3){reps=reps.slice(0,sets);rpe=rpe.slice(0,sets)}
    var note=role==='Q'?'Controlled reps. Quality and coordination over speed.':(e.secs?'Hold for the time on each side.':'');
    if(role==='S'&&e.inc==null&&e.k==='S'&&!lifeOnly)note='Bodyweight or band: pick a version that lets you hit the target RPE.';
    return x(id,e.n,{sets:sets,reps:reps,rpe:rpe,side:!!e.side,kind:kind,inc:e.inc==null?null:e.inc,unit:e.secs?'s':'',note:note});
  }
  var tags='ABCDEFG',sessions=split.map(function(code,di){
    var D=DAYS[code],pairs=D.pairs.slice(0,nPairs),modes=modesFor(goals,pairs.length,D.move),used={},blocks=[];
    pairs.forEach(function(pr,pi){
      var m=modes[pi];if(pr.arms&&(m==='SP'||m==='PP'))m=m==='SP'?'SS':'PP';
      var a,b,ra,rb;
      if(m==='SP'){a=pick(pr.s,'S',used);ra='S';b=pick(pr.p,'P',used);rb='P'}
      else if(m==='SS'){a=pick(pr.s,'S',used);ra='S';b=pick(pr.a,'S',used);rb='S'}
      else if(m==='PP'){a=pick(pr.p,'P',used);ra='P';b=pick(pr.p2,'P',used);rb='P'}
      else if(m==='SQ'){a=pick(pr.s,'S',used);ra='S';b=pick(pr.q,'Q',used);rb='Q'}
      else if(m==='SC'){a=pick(pr.s,'S',used);ra='S';b=pick(pr.c,'C',used);rb='C'}
      else{a=pick(pr.q,'Q',used);ra='Q';b=pick(pr.q2||pr.c,EX[(SLOT[pr.q2]||[])[0]]?EX[SLOT[pr.q2][0]].k:'C',used);rb=b&&EX[b].k==='Q'?'Q':'C'}
      var ex=[];if(a)ex.push(build(a,ra));if(b)ex.push(build(b,rb==='C'&&EX[b].k==='S'?'C':rb));
      var tag=tags[pi],r=m==='QC'?rest('30–45s'):lifeOnly?rest('60–90s'):rest('45–60s');
      blocks.push({tag:tag,label:{SP:'Strength + power',SS:'Strength',PP:'Power',SQ:'Strength + sequencing',SC:'Strength + core',QC:'Movement + core'}[m]||'Superset',rest:r,ex:ex});
    });
    return {name:'Day '+(di+1),tab:'D'+(di+1),title:D.title,short:D.short,blocks:blocks};
  });
  var gl=GOALS.filter(function(g){return has(goals,g.id)}).map(function(g){return g.label.replace(' & ',' + ')});
  var title=goals.length>=3?'Complete Golf Performance':gl.join(' · ');
  var feats={},habits=[];
  (ans.trackers||[]).forEach(function(t){var tr=TRACKERS.filter(function(z){return z.id===t})[0];if(!tr)return;if(tr.feature)feats[tr.feature]=true;else habits.push({id:tr.id,name:tr.label,desc:tr.desc})});
  (ans.custom||[]).forEach(function(c,i){if(c&&String(c).trim())habits.push({id:'c'+i+'-'+String(c).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,20),name:String(c).trim(),desc:'Your own daily habit.'})});
  if(ans.mobility)feats.mobility=true;
  var guide=[
    ['Pyramid','Strength exercises: '+(lifeOnly?(10+lvl.reps)+' reps at RPE '+(7+lvl.rpe)+' on every set.':'set 1 '+(12+lvl.reps)+' reps at RPE '+(7+lvl.rpe)+', set 2 '+(10+lvl.reps)+' at RPE '+(8+lvl.rpe)+', set 3 '+(8+lvl.reps)+' at RPE '+(9+lvl.rpe)+'. Increase the load as the reps come down.')],
    ['Max intent','Power exercises: every rep as fast and explosive as you can. RPE 10 means maximal intent, not failure. Mark each set Fast, or Slowed if the speed dropped.'],
    ['Pairs','No planned rest between the two exercises in a pair. Rest between rounds as shown on each block.'],
    ['Progress','Keep the exercises, sets and reps the same. Progress through load at the target RPE. Power work progresses through speed and quality, not fatigue.'],
    ['Your level',lvl.label+'. '+(lvl.sets<0?'One fewer set, a little lower effort and slightly more rest while you build up.':lvl.sets>0?'An extra set on strength exercises.':'The plan as written.')]
  ];
  if(low)guide.push(['Low impact','Jumps and hops are swapped for low-impact explosive versions.']);
  return {
    client:{
      name:(ans.first||'').trim()||'Golfer',first:(ans.first||'').trim()||'Golfer',key:'build-my-plan',weeks:0,
      kicker:'Build My Plan',subtitle:title,planName:'Build My Plan',
      features:feats,habits:habits,
      strip:[['Gym',days+' / week'],['Session',mins+' min']],
      streak:habits.length?{id:habits[0].id,label:habits[0].name+' streak',name:habits[0].name}:(feats.mobility?{id:'mobility',label:'Mobility streak',name:'Mobility'}:null),
      weekly:{gym:days},
      weekNote:'Spread your '+days+' sessions across the week, with a rest day between the hardest ones where you can. Warm up before every session.',
      objective:'Work through each pair in order. Move straight from the first exercise to the second, then rest before the next round.',
      restNote:'No planned rest within a pair. Rest between rounds as shown on each block. Take longer if your explosive work starts to slow down.',
      guide:guide,
      mobilityVideos:ans.mobility?MOBILITY:null,mobilityParts:ans.parts||[],mobilityPartLabels:PARTS,mobilityWhere:MOBILITY_WHERE,
      summary:{goals:gl,equip:eqo.label,level:lvl.label,days:days,minutes:mins}
    },
    sessions:sessions
  };
}

/* ---------------- QUESTIONNAIRE ---------------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var CSS='.mgb{position:fixed;inset:0;z-index:65;background:#0B0B0B;color:#F4F1EA;overflow-y:auto;font-family:Inter,system-ui,sans-serif;-webkit-overflow-scrolling:touch}'+
'.mgb-in{max-width:560px;margin:0 auto;padding:calc(22px + env(safe-area-inset-top,0px)) 18px calc(28px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:16px;min-height:100%}'+
'.mgb-top{display:flex;justify-content:space-between;align-items:center;gap:12px}.mgb-wm{font-family:Anton,Impact,sans-serif;color:#FFD900;font-size:20px;line-height:.9;text-transform:uppercase}'+
'.mgb-step{font-weight:700;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9C988C}.mgb-prog{height:5px;background:#2a2926;position:relative}.mgb-prog i{position:absolute;inset:0 auto 0 0;background:#FFD900;transition:width .25s}'+
'.mgb-k{font-weight:700;font-size:12px;letter-spacing:2.4px;text-transform:uppercase;color:#FFD900}.mgb-h{font-family:Anton,Impact,sans-serif;text-transform:uppercase;font-size:38px;line-height:1;margin:0}'+
'.mgb-bar{width:74px;height:6px;background:#FFD900}.mgb-p{margin:0;color:#d9d5cb;font-size:15px;line-height:1.45}'+
'.mgb-opts{display:flex;flex-direction:column;gap:8px}.mgb-opt{display:flex;gap:14px;align-items:flex-start;text-align:left;width:100%;background:#1a1916;border:1px solid rgba(244,241,234,.18);border-left:6px solid #3a3833;color:#F4F1EA;padding:14px 16px;cursor:pointer;font:inherit;min-height:64px}'+
'.mgb-opt[aria-pressed=true]{border-color:#FFD900;border-left-color:#FFD900;background:#24221d}.mgb-opt b{display:block;font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;font-size:20px;line-height:1.05}'+
'.mgb-opt span{display:block;font-size:13.5px;color:#b7b2a6;margin-top:4px}.mgb-tick{width:24px;height:24px;border:2px solid #77715F;flex-shrink:0;margin-top:2px;display:grid;place-items:center;font-size:15px;color:#0B0B0B}'+
'.mgb-opt[aria-pressed=true] .mgb-tick{background:#FFD900;border-color:#FFD900}.mgb-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}'+
'.mgb-grid .mgb-opt{flex-direction:column;align-items:center;justify-content:center;text-align:center;border-left-width:1px;min-height:84px}.mgb-grid .mgb-opt b{font-size:30px}'+
'.mgb-nav{display:flex;gap:8px;margin-top:auto;padding-top:8px}.mgb-go{flex:1;min-height:56px;border:0;background:#FFD900;color:#0B0B0B;font-family:Anton,Impact,sans-serif;text-transform:uppercase;font-size:21px;cursor:pointer}'+
'.mgb-go:disabled{opacity:.35;cursor:default}.mgb-back{min-height:56px;padding:0 18px;border:1px solid rgba(244,241,234,.3);background:transparent;color:#F4F1EA;font:600 15px Inter,system-ui,sans-serif;cursor:pointer}'+
'.mgb-field{display:flex;flex-direction:column;gap:6px;font-weight:700;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#FFD900}'+
'.mgb-field input{font:400 20px Inter,system-ui,sans-serif;letter-spacing:normal;text-transform:none;min-height:54px;padding:0 14px;border:1px solid rgba(244,241,234,.35);background:#1a1916;color:#F4F1EA;border-radius:0}'+
'.mgb-add{display:flex;gap:8px}.mgb-add input{flex:1;font:400 17px Inter,system-ui,sans-serif;min-height:50px;padding:0 12px;border:1px solid rgba(244,241,234,.35);background:#1a1916;color:#F4F1EA;border-radius:0}'+
'.mgb-add button{min-height:50px;padding:0 16px;border:0;background:#F4F1EA;color:#0B0B0B;font-family:Anton,Impact,sans-serif;text-transform:uppercase;font-size:17px;cursor:pointer}'+
'.mgb-chip{display:inline-flex;align-items:center;gap:8px;background:#24221d;border:1px solid #FFD900;padding:8px 10px;font-size:14px;margin:0 6px 6px 0}.mgb-chip button{background:transparent;border:0;color:#9C988C;font-size:18px;cursor:pointer;min-width:28px;min-height:28px}'+
'.mgb-coach{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 16px;border:1px solid rgba(244,241,234,.35);color:#F4F1EA;text-decoration:none;font:600 14px Inter,system-ui,sans-serif}'+
'.mgb-day{background:#1a1916;border-left:6px solid #FFD900;padding:12px 14px}.mgb-day b{display:block;font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;font-size:19px}'+
'.mgb-day ol{margin:8px 0 0;padding-left:18px;color:#d9d5cb;font-size:13.5px;line-height:1.5}.mgb-sum{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:rgba(244,241,234,.18)}'+
'.mgb-sum div{background:#0B0B0B;padding:10px 12px}.mgb-sum span{display:block;font-weight:700;font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;color:#FFD900}.mgb-sum b{display:block;font-size:15px;margin-top:4px}'+
'.mgb-err{color:#ffb27a;font-size:14px;margin:0;min-height:1.2em}.mgb :focus-visible{outline:3px solid #FFD900;outline-offset:2px}'+
'@media (max-width:420px){.mgb-h{font-size:32px}.mgb-grid .mgb-opt b{font-size:24px}}';
function open(opts){
  opts=opts||{};var a=JSON.parse(JSON.stringify(opts.answers||DEFAULTS));a.custom=a.custom||[];a.trackers=a.trackers||[];a.parts=a.parts||[];
  if(!opts.answers){a.goals=[];a.trackers=['checkin']}
  if(!document.getElementById('mgb-css')){var s=document.createElement('style');s.id='mgb-css';s.textContent=CSS;document.head.appendChild(s)}
  var root=document.createElement('div');root.className='mgb';root.setAttribute('role','dialog');root.setAttribute('aria-label','Build my plan');document.body.appendChild(root);document.body.style.overflow='hidden';
  var STEPS=['name','goals','equip','level','days','minutes','pain','trackers','mobility','review'],i=0,painStop=false;
  function opt(val,on,label,desc,multi){return '<button type="button" class="mgb-opt" data-v="'+esc(val)+'" aria-pressed="'+on+'">'+(multi?'<span class="mgb-tick" aria-hidden="true">'+(on?'✓':'')+'</span>':'')+'<div><b>'+esc(label)+'</b>'+(desc?'<span>'+esc(desc)+'</span>':'')+'</div></button>'}
  function coach(){return opts.coachUrl?'<a class="mgb-coach" href="'+esc(opts.coachUrl)+'" target="_blank" rel="noopener">Speak to a coach</a>':''}
  function valid(){var st=STEPS[i];if(st==='goals')return a.goals.length>0;if(st==='mobility')return !a.mobility||a.parts.length>0;if(st==='pain')return a.pain==='no';return true}
  function head(k,h,p){return '<div><div class="mgb-k">'+k+'</div><h2 class="mgb-h">'+h+'</h2></div><div class="mgb-bar"></div>'+(p?'<p class="mgb-p">'+p+'</p>':'')}
  function render(){
    var st=STEPS[i],b='';
    if(st==='name')b=head('Build my plan','Let\'s build your plan','Answer a few quick questions and we\'ll build a training plan around your goals, your kit and your week. It takes about two minutes.')+'<label class="mgb-field">Your first name<input id="mgbName" autocomplete="given-name" maxlength="40" value="'+esc(a.first)+'" placeholder="First name"></label>';
    else if(st==='goals')b=head('Question 1','What is your goal?','Pick as many as you like. We\'ll combine them.')+'<div class="mgb-opts" data-k="goals" data-multi="1">'+GOALS.map(function(g){return opt(g.id,has(a.goals,g.id),g.label,g.desc,1)}).join('')+'</div>';
    else if(st==='equip')b=head('Question 2','What equipment do you have?')+'<div class="mgb-opts" data-k="equip">'+EQUIP.map(function(e){return opt(e.id,a.equip===e.id,e.label,e.desc)}).join('')+'</div>';
    else if(st==='level')b=head('Question 3','What is your training level?','Be honest. You can change it later.')+'<div class="mgb-opts" data-k="level">'+Object.keys(LEVELS).map(function(k){return opt(k,a.level===k,LEVELS[k].label,LEVELS[k].def)}).join('')+'</div>';
    else if(st==='days')b=head('Question 4','How many days a week can you train?')+'<div class="mgb-grid mgb-opts" data-k="days">'+[2,3,4,5].map(function(d){return opt(d,+a.days===d,String(d),'days')}).join('')+'</div>';
    else if(st==='minutes')b=head('Question 5','How long can each session be?','Not counting your warm-up.')+'<div class="mgb-grid mgb-opts" data-k="minutes" style="grid-template-columns:repeat(3,minmax(0,1fr))">'+[30,45,60].map(function(m){return opt(m,+a.minutes===m,String(m),'minutes')}).join('')+'</div>';
    else if(st==='pain'){
      if(painStop)b=head('Before you start','Speak to a coach first','Training around pain or an injury needs a plan built for you, so this is one for a coach rather than an automatic plan. Get in touch and we\'ll make sure your training helps rather than makes it worse.')+'<div style="display:flex;flex-direction:column;gap:8px">'+coach()+'<button type="button" class="mgb-back" data-x="painback">Go back</button></div>';
      else b=head('Question 6','Any pain or injuries right now?','Anything that hurts when you train or play, or an injury you are recovering from.')+'<div class="mgb-opts" data-k="pain">'+opt('no',a.pain==='no','No','I\'m good to go.')+opt('yes',a.pain==='yes','Yes','I have pain or an injury at the moment.')+'</div>';
    }
    else if(st==='trackers')b=head('Question 7','Daily trackers','Tick the ones you want on your plan each day. Add your own too.')+'<div class="mgb-opts" data-k="trackers" data-multi="1">'+TRACKERS.map(function(t){return opt(t.id,has(a.trackers,t.id),t.label,t.desc,1)}).join('')+'</div>'+
      '<div>'+a.custom.map(function(c,ci){return '<span class="mgb-chip">'+esc(c)+'<button type="button" data-delc="'+ci+'" aria-label="Remove '+esc(c)+'">×</button></span>'}).join('')+'</div>'+
      '<div class="mgb-add"><input id="mgbCustom" maxlength="40" placeholder="Add my own, e.g. Stretch before bed"><button type="button" data-x="addc">Add</button></div>';
    else if(st==='mobility')b=head('Question 8','Daily mobility','Each day you get a video from the 10 Minute Mobility series, picked for the areas you choose.')+'<div class="mgb-opts" data-k="mobility">'+opt('yes',a.mobility===true,'Yes, include mobility','A new video every day.')+opt('no',a.mobility===false,'No thanks','')+'</div>'+
      (a.mobility?'<div class="mgb-k" style="margin-top:6px">Which areas?</div><div class="mgb-opts" data-k="parts" data-multi="1">'+PARTS.map(function(p){return opt(p.id,has(a.parts,p.id),p.label,MOBILITY.filter(function(v){return has(v.parts,p.id)}).length+' videos',1)}).join('')+'</div>':'');
    else if(st==='review'){
      var g=generate(a,TOOLS);
      b=head('Your plan',esc(g.client.subtitle),'Here\'s what we\'ve built. Every session is logged on the next screen.')+
        '<div class="mgb-sum"><div><span>Days</span><b>'+a.days+' a week</b></div><div><span>Sessions</span><b>'+a.minutes+' min</b></div><div><span>Equipment</span><b>'+esc(g.client.summary.equip)+'</b></div><div><span>Level</span><b>'+esc(g.client.summary.level)+'</b></div></div>'+
        g.sessions.map(function(s){return '<div class="mgb-day"><b>'+esc(s.name)+' · '+esc(s.title)+'</b><ol>'+s.blocks.map(function(bk){return '<li>'+bk.ex.map(function(e){return esc(e.name)}).join(' + ')+'</li>'}).join('')+'</ol></div>'}).join('')+
        (opts.answers?'<p class="mgb-p" style="font-size:13.5px">Starting a new plan begins again at week 1. Your old sessions stay saved, and your habits, check-ins and weigh-ins carry on.</p>':'');
    }
    var last=st==='review';
    root.innerHTML='<div class="mgb-in"><div class="mgb-top"><div class="mgb-wm">Macro<br>Golf</div><div style="display:flex;gap:8px;align-items:center"><span class="mgb-step">'+(i+1)+' / '+STEPS.length+'</span>'+(opts.onCancel?'<button type="button" class="mgb-back" style="min-height:40px" data-x="cancel">Close</button>':'')+'</div></div>'+
      '<div class="mgb-prog"><i style="width:'+((i+1)/STEPS.length*100)+'%"></i></div>'+b+'<p class="mgb-err" id="mgbErr" role="alert"></p>'+
      (st==='pain'&&painStop?'':'<div class="mgb-nav">'+(i?'<button type="button" class="mgb-back" data-x="back">Back</button>':'')+'<button type="button" class="mgb-go" data-x="next"'+(valid()?'':' disabled')+'>'+(last?'Start my plan':'Next')+'</button></div>')+
      (st!=='pain'||!painStop?'<div style="text-align:center">'+coach()+'</div>':'')+'</div>';
    root.scrollTop=0;
  }
  root.addEventListener('input',function(e){if(e.target.id==='mgbName')a.first=e.target.value});
  root.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.id==='mgbCustom'){e.preventDefault();addCustom()}else if(e.key==='Enter'&&e.target.id==='mgbName'){e.preventDefault();next()}});
  function addCustom(){var n=document.getElementById('mgbCustom'),v=n&&n.value.trim();if(!v)return;if(a.custom.length>=8){document.getElementById('mgbErr').textContent='You can add up to 8 of your own.';return}a.custom.push(v);render();var m=document.getElementById('mgbCustom');if(m)m.focus()}
  function next(){if(!valid())return;if(STEPS[i]==='review'){finish();return}i++;render()}
  function finish(){var out=JSON.parse(JSON.stringify(a));delete out.pain;out.first=(out.first||'').trim();root.querySelector('.mgb-go').disabled=true;root.querySelector('.mgb-go').textContent='Building your plan…';
    setTimeout(function(){opts.onDone&&opts.onDone(out)},900)}
  root.addEventListener('click',function(e){
    var x=e.target.closest('[data-x]');
    if(x){var v=x.dataset.x;if(v==='next')next();else if(v==='back'){i=Math.max(0,i-1);painStop=false;render()}else if(v==='addc')addCustom();else if(v==='painback'){painStop=false;a.pain='';render()}
      else if(v==='cancel'){root.remove();document.body.style.overflow='';opts.onCancel()}return}
    var dc=e.target.closest('[data-delc]');if(dc){a.custom.splice(+dc.dataset.delc,1);render();return}
    var o=e.target.closest('.mgb-opt');if(!o)return;var box=o.closest('[data-k]'),k=box.dataset.k,v2=o.dataset.v;
    if(box.dataset.multi){var arr=a[k];var ix=arr.indexOf(v2);if(ix>=0)arr.splice(ix,1);else arr.push(v2)}
    else if(k==='days'||k==='minutes')a[k]=+v2;
    else if(k==='mobility'){a.mobility=v2==='yes';if(!a.mobility)a.parts=[]}
    else if(k==='pain'){a.pain=v2;if(v2==='yes'){painStop=true}}
    else a[k]=v2;
    render();
  });
  render();
  return {close:function(){root.remove();document.body.style.overflow=''}};
}
var TOOLS=null;
return {EX:EX,SLOT:SLOT,DAYS:DAYS,SPLIT:SPLIT,LEVELS:LEVELS,GOALS:GOALS,EQUIP:EQUIP,TRACKERS:TRACKERS,PARTS:PARTS,MOBILITY:MOBILITY,MOBILITY_WHERE:MOBILITY_WHERE,NEW_IDS:NEW_IDS,DEFAULTS:DEFAULTS,
  generate:generate,open:open,tools:function(t){TOOLS=t}};
})();
