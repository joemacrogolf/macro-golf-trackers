// @code 538206  @name Ross King
var CLIENT={
  name:'Ross King',first:'Ross',key:'ross-king',weeks:6,
  kicker:'Strength & Conditioning Plan',subtitle:'Mobility first · six week plan',planName:'Strength & Conditioning Plan',
  features:{mobility:true,checkin:true},
  strip:[['Gym','3 / week'],['Mobility','Daily'],['Warm up','Before you play']],
  streak:{id:'mobility',label:'Mobility streak',name:'Mobility'},
  habits:[
    {id:'golfwarmup',name:'Golf warm up',desc:'Tick this on any day you hit balls or play. Do the Express 5 Minute Golf Warm Up in the Macro Golf App before the range and again before the first tee.'}
  ],
  mobilityRoutine:[{name:'90 90'},{name:'Hip Capsule Mobilisation'},{name:'Banded Ankle Mobilisation'},{name:'Supported Pelvic Rotation'},{name:'Pelvic Tilt with Assistance'},{name:'Seated Spinal Rotation with Tilt'},{name:'Thoracic Spine Mobilisation Roller'},{name:'Praying Lat Stretch'}],
  mobilityWhere:'Find each video in the Macro Golf App.',
  mobilityDesc:'Do this every day, first thing in the morning before you sit down. Eight movements, 10 to 12 minutes. Tick each one off as you finish it. Move slowly through a pain free range and never push into pain, especially through the lower back and left hip. Rate your left hip and lower back stiffness out of 10 before and after. Over time this shows what loosens you up.',
  weekly:{gym:3},
  weekNote:'Alternate Session 1 and Session 2 across three days, with a rest day between where you can. Week A is Session 1, 2, 1. Week B is Session 2, 1, 2. The pattern carries over from one week to the next.',
  gymNote:'Every rep pain free. If your lower back, left hip or left knee pain rises, shorten the range, lighten the load or skip that exercise, and tell Sam. Low energy day: do the first exercise of each pair only.',
  objective:'Mobility first, then strength, with a light power exposure. Built around your TPI screen from 29 October 2026. Session 1 starts with the Lower Body Warm Up in the Macro Golf App. Session 2 starts with the Upper Body Warm Up. No jumping yet, to protect your knee and Achilles.',
  restNote:'Rest 45 to 60 seconds between rounds of each superset.',
  guideSub:'Weeks 1 to 6, RPE and how the load is suggested',
  guide:[
    ['Weeks 1 to 6','Keep the exercises, sets and reps the same for all six weeks. In week 6 drop to 2 sets of each. We then retest the same screen and power tests.'],
    ['Pyramid','Strength exercises are 3 sets of 12, 10 and 8 reps at RPE 6, 7 and 7. Stability work is 3 sets at RPE 4 to 6.'],
    ['RPE','RPE 6 is about four reps left, RPE 7 about three reps left. Stability work stays easy at RPE 4 or 5.'],
    ['Progress','Add load only when the prescribed RPE feels easier.'],
    ['Load','After each set, enter the kg, reps and RPE. Each set is suggested from the same set last time: one step lighter if it felt a full point harder than the target, one step heavier if it felt a full point easier.']
  ]
};
function pyr(id,name,inc,o){o=o||{};return x(id,name,{sets:3,reps:[12,10,8],rpe:[6,7,7],kind:'Strength',inc:inc,side:o.side,note:o.note})}
function stb(id,name,reps,rpe,inc,o){o=o||{};return x(id,name,{sets:3,reps:reps,rpe:rpe,kind:'Stability',inc:inc,side:o.side,unit:o.unit,note:o.note})}
function ss(tag,a,b){return {tag:tag,label:'Superset '+tag,rest:'45 to 60s',ex:[a,b]}}
var SESSIONS=[
  {name:'Session 1',tab:'S1',title:'Lower Body + Hip Control',short:'Lower body + hip control',blocks:[
    ss('A',pyr('goblet','Dumbbell Goblet Squat',DB,{note:'Pain free depth only.'}),stb('hipdrops','Hip Drops',8,4,BW,{side:true})),
    ss('B',pyr('hsrdl','Hand Supported Dumbbell RDL',DB),stb('clams','Clam Shells',10,4,BW,{side:true})),
    ss('C',pyr('slbridge','Single Leg Elevated Glute Bridge',BW,{side:true}),stb('pallof','Pallof Press',8,6,CABLE,{side:true})),
    ss('D',pyr('stepups','Dumbbell Step Ups',DB,{side:true}),stb('curlups','Curl Ups',10,5,BW,{note:'Small, pain free range.'}))]},
  {name:'Session 2',tab:'S2',title:'Upper Body + Trunk + Light Power',short:'Upper body + trunk + light power',blocks:[
    ss('A',pyr('dbflat','Dumbbell Flat Bench Press',DB),stb('facepull','Face Pull with Band',12,4,BW)),
    ss('B',pyr('sarow','Dumbbell Single Arm Row',DB,{side:true}),stb('shstab','Shoulder Stability Raise with Band',10,5,BW)),
    ss('C',pyr('latpd','Cable Lat Pull Down',CABLE),stb('corechop','Core Stability Chop',8,6,CABLE,{side:true,note:'Pain free range.'})),
    ss('D',pyr('seatsp','Seated Dumbbell Shoulder Press',DB),stb('sideplank','Side Plank',20,5,BW,{side:true,unit:'s'})),
    {tag:'E',label:'Light power',rest:'45 to 60s',ex:[x('chestthrow','Supine Chest Throws',{sets:3,reps:5,rpe:7,kind:'Power',inc:MB,note:'Fast, controlled intent. Stop well before failure.'})]}]}
];
