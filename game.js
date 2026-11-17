'use strict';
const $=id=>document.getElementById(id), canvas=$('screen');
let level=0,length=720;
const routes=[{name:'Солнечное депо',meters:720},{name:'Большой коллектор',meters:1800},{name:'Марафон',meters:Infinity}];
const ease=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t)};
const words=['ЛИФТ','МАРС','УСПЕЛ'], clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
let bootsTime=0,settled=false,paidCoins=0,revived=false,cleanStart=0,missionDone=false;
let wordKm=0,kmWordDone=false,runKeys=0,stumbleTime=0,stumbleCooldown=0;
const revivePrice=40,cleanGoal=250,cleanReward=25;
let best=0,mute=false;
try{best=Number(localStorage.wcDashBest)||0;mute=localStorage.wcDashMuted==='yes'}catch{}
let state='menu',distance=0,lane=0,x=0,height=0,velocity=0,slide=0,coins=0,completed=0,letters=[],items=[],stamp=0,noticeUntil=0,clock=0,elapsed=0,toiletTime=0;
let poseSlide=0,poseBank=0,landing=0,flecks=[],runCycle=0,diving=false;
let flowHits=0,rollAge=-1,rollLateral=0,jumpTakeoffPhase=0;
const sections=['Солнечное депо','Экспресс-платформа','Грузовая станция'];
function scatter(a,b,z,color){
 flecks=flecks.filter(e=>elapsed-e.at<.43);
 for(let i=0;i<8;i++){const angle=i*Math.PI/4+.4;flecks.push({at:elapsed,x:a,y:b,z,vx:Math.cos(angle)*1.6,vy:1+i%3*.58,vz:Math.sin(angle)*1.6+6,color})}
}
const render3D=createWorld(canvas);
const devClock=createDevClock();
function toggleInspection(){
 const frozen=devClock.toggle();render3D.stage?.inspection?.setActive(frozen);
 pointer=null;$('inspect').setAttribute('aria-pressed',String(frozen));
 $('devPanel').hidden=!frozen;soundscape.sync(!frozen&&(state==='run'||state==='finish'),mute);
}
const rearMargin=16; // Behind the furthest chase camera, including in flight.
let trains=[],flows=[],warning='',firstNearby=0;
const marathon=()=>level===2;
function chooseRoute(index){
 level=index;length=routes[index].meters;
 document.querySelectorAll('[data-route]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
 $('best').textContent=index===2?profile.meters+' м':best;
 $('summary').textContent=index===2?'Парк, рынок и вокзал. Каждые 1 000 м появляется слово. Рекорд марафона — '+profile.meters+' м.':index?'1 800 м по открытым путям. Вагоны, крыши и потоки. Следи за подсказками на трассе.':'720 м · около 43 секунд. Электрички, экспрессы и грузовые вагоны. До туалета через всё депо!';
}
function prepareRoute(){
 if(level===0){
  const route=buildShowcaseRoute();trains=route.trains;
  for(const car of trains)if(car.incomingSpeed)car.roofTokens=Array.from({length:Math.max(3,Math.floor(car.deck/3))},(_,i)=>({offset:1+i*3,done:false}));
  flows=route.flowEncounters.map(encounter=>{
   const planned=planFlow(encounter.target,[],0,encounter.incomingSpeed);
   return {...planned,...encounter,tokens:Array.from({length:5},(_,i)=>({offset:1+i*(encounter.size-2)/4,done:false}))};
  });
  warning='';firstNearby=0;return;
 }
 const starts=level?Array.from({length:15},(_,i)=>36+116*i):[56,130,201,273];
 trains=starts.flatMap((z,i)=>trainGroup(z,[1,-1,0,1,0,-1][i%6],i%2?-1:1));
 // Meet each wave in a road gap; its whole visible path uses a clear lane.
 const targets=level?starts.flatMap(z=>[z+64,z+90]):[30,121,193,264,341];
 flows=targets.map((target,i)=>planFlow(target,trains,i)).filter(Boolean);
 warning='';firstNearby=0;
}
function planFlow(target,cars,index,incomingOverride){
 const pace=level===2?13+Math.min(10,target/100):13+8*target/length;
 const incoming=incomingOverride??(level?11:8);
 const trigger=Math.max(0,target-40*pace/(pace+incoming));
 let travelTime=0;
 for(let z=trigger;z<target;z+=.25){
  const step=Math.min(.25,target-z);
  const speedAt=level===2?13+Math.min(10,z/100):13+8*z/length;
  travelTime+=step/speedAt
 }
 const frontOffset=target-trigger+incoming*travelTime;
 const spawn=trigger+frontOffset;
 const lanes=[-2.2,0,2.2].filter(a=>!cars.some(c=>c.a===a&&c.z<spawn+8&&trainEnd(c)>target-20));
 if(!lanes.length)return null;
 return {trigger,a:lanes[index%lanes.length],frontOffset,size:6,front:null,passed:false,incomingSpeed:incoming,top:1.48,kind:['sludge','foam','surge'][index%3]}
}
function hitFlow(f){
 if(grace>0)return true;
 flowHits++;cleanStart=distance;
 if(flowHits===1){stumbleTime=3;grace=.7;notice('Испачкался! Следующий поток опасен');scatter(x,height+.8,distance,'69452c');soundscape.effect('stumble');return true;}
 return absorbHit('Второй удар потоком');
}
function updateFlows(dt){
 warning='';
 for(const f of flows){
  if(f.passed||distance<f.trigger-18)continue;
  if(!f.warned){f.warned=true;soundscape.effect('alarm')}
  if(distance<f.trigger){
   if(!flight&&!warning)warning=(f.required?'Прыгай на поток · ':'Поток ')+(f.a<0?'слева':f.a>0?'справа':'по центру')+'!';
   continue
  }
  if(f.front===null)f.front=distance+(f.frontOffset??63);
  f.front-=dt*(f.incomingSpeed??(level?11:8));
  const lead=f.front-distance;
  if(lead+f.size < -rearMargin){f.passed=true;continue}
  for(const token of f.tokens||[]){
   if(!token.done&&(bootsAttract(f.a,f.front+token.offset,f.top??1.48)||(Math.abs(f.front+token.offset-distance)<.65&&Math.abs(f.a-x)<.86&&Math.abs(height-(f.top??1.48))<.65))){
    token.done=true;coins++;scatter(f.a,(f.top??1.48)+.65,distance,'efc55a');soundscape.effect('coin');
   }
  }
  const top=f.top??1.48;
  if(!flight&&!f.hit&&height<top-.075&&Math.abs(f.a-x)<1.03&&lead<=.48&&lead+f.size>=-.55){
   f.hit=true;
   const edge=Math.abs(f.a-x)>.85;
   if(!hitFlow(f))return false;
   if(edge){const away=Math.sign(x-f.a)||1;lane=clamp(Math.round(f.a/2.2)+away,-1,1);x=f.a+away*1.20}
  }
  if(!flight&&!warning&&!f.hit&&lead<62&&lead+f.size>0)warning=(f.required?'Прыгай на поток · ':'Поток ')+(f.a<0?'слева':f.a>0?'справа':'по центру')+'!';
 }
 return true
}
let ground=0,cameraLift=0,magnet=0,grace=0,finishFrom=0;
let flight=null,catTime=0,catCooldown=0;
const grounded=()=>height<=ground+.015;
const speedAt=z=>marathon()?13+Math.min(10,z/100):13+8*z/length;
const speed=()=>speedAt(distance)*(stumbleTime>0&&!flight?.72:1);
const isBarrier=type=>type==='crate'||type==='bar'||type==='hurdle'||type==='wall';
// Physics and both renderers share the actual clearance of each obstacle.
const hurdleBottom=1.46,hurdleTop=1.70,slideHeight=1.38,barBottom=1.39,barTop=2.45;
function bootsAttract(a,z,y){
 return bootsTime>0&&profile.boots>0&&!flight&&!grounded()&&Math.abs(a-x)<.95&&z-distance<=1.2&&z-distance>=-3&&y<=height+.7;
}
function hitsBarrier(item){
 const bottom=height-item.y;
 const bodyHeight=slide>0?(rollLateral?1.04:slideHeight):1.93;
 switch(item.type){
  case 'wall':return bottom<5;
  case 'crate':return bottom<.85;
  case 'bar':return bottom<barTop&&bottom+bodyHeight>barBottom;
  case 'hurdle':return bottom<hurdleTop&&bottom+bodyHeight>hurdleBottom;
 }
 return false
}
const jumpVelocity=8.25,gravity=17; // ~2 m apex; boots retain 1.5× height.
const jumpApex=jumpVelocity*jumpVelocity/(2*gravity),jumpHalfTime=jumpVelocity/gravity;
const flightHeight=6.1;
function beginFlight(){
 const reach=Math.min(140,length-distance-12);
 if(reach<50)return;
 flight={start:distance,end:distance+reach,from:height};
 slide=velocity=0;diving=false;
 const airLanes=lane===0?[0,1,0,-1]:[lane,0,-lane,0];
 const airTrail=[];
 for(let dz=16;dz<reach-21;dz+=2.5){
  const band=Math.floor((dz-16)/20)%4;
  const airLane=airLanes[band];
  airTrail.push({type:'poo',air:true,z:distance+dz,a:airLane*2.2,y:flightHeight+.68})
 }
 items.push(...airTrail);items.sort((a,b)=>a.z-b.z);
 notice('Острые крылышки KFC! Свайпай за монетами');soundscape.effect('launch')
}
function advanceFlight(support){
 const rise=ease((distance-flight.start)/16),descent=ease((distance-flight.end+20)/20);
 const top=flight.from+(flightHeight-flight.from)*rise;
 height=top+(support-top)*descent;velocity=0;
 if(distance>=flight.end){
  flight=null;height=support;landing=1;grace=Math.max(grace,.95);
  scatter(x,height+.10,distance,'e4d5aa');soundscape.effect('land')
 }
}
function course(){
 const list=[],add=(type,z,a,y=0)=>list.push({type,z,a,y});
 // Each pattern has an optional challenge lane and two passing lanes.
 const challenges=level?Array.from({length:15},(_,i)=>[[14+i*116,(i%3)-1,i%2?'hurdle':'crate'],[27+i*116,((i+1)%3)-1,i%2?'bar':'hurdle']]).flat():buildShowcaseRoute().obstacles.map(it=>[it.z,it.a/2.2,it.type]);
 for(const [z,lane,type] of challenges)add(type,z,lane*2.2);
 // Walls on the outer routes guide the player towards the incoming stream.
 const requiredTargets=level?[100]:[];
 for(const meeting of requiredTargets){
  const wave=flows.filter(f=>f.trigger<meeting&&meeting-f.trigger<30).at(-1);
  if(!wave)continue;
  wave.required=true;
  for(const side of [-2.2,0,2.2])if(side!==wave.a)add('wall',meeting,side)
 }

 for(let z=5;z<length-9;z+=2){
  const near=challenges.find(([at])=>Math.abs(at-z)<=speedAt(at)*jumpHalfTime);
  const trail=railTrail(trains.filter(c=>!c.incomingSpeed),z);
  if(trail){add('poo',z,trail.a,trail.y);continue}
  if(near&&challenges.indexOf(near)%4!==3){const [at,l,type]=near,u=(z-at)/(speedAt(at)*jumpHalfTime);
   const y=type==='crate'?.64+jumpApex*Math.max(0,1-u*u):Math.abs(z-at)<4?.34:.64;
   add('poo',z,l*2.2,y);continue}
  add('poo',z,[0,0,-2.2,0,2.2,2.2][Math.floor(z/9)%6],.65)
 }
 for(let i=0,z=10;z<length-10;z+=26,i++){
  const train=trains.find(v=>!v.incomingSpeed&&z>=v.z&&z<=trainEnd(v));
  add('letter',z,train?train.a:[0,-2.2,2.2,0][i%4],train?roofAt(train,z):0)
 }
 function gear(type,z,a){if(level===0){const free=[a,0,-2.2,2.2].find(l=>!trains.some(c=>c.a===l&&z>=c.z-5&&z<=trainEnd(c)+5));if(free===undefined)return;a=free}add(type,z,a,railFloor(trains,z,a))}
 for(const [type,z,a] of [['magnet',7,0],['magnet',238,-2.2]])gear(type,z,a);
 for(let z=54;z<length;z+=546)gear('boots',z,0);
 for(let z=level?106:520;z<length-155;z+=1044)gear('wings',z,0);
 if(level)for(let i=3;i<14;i+=6)gear('magnet',i*116+4,2.2*([0,1,-1][i%3]));
 for(let z=75;z<length-10;z+=120){
  const trail=railTrail(trains.filter(c=>!c.incomingSpeed),z);add('key',z,trail?.a??0,railFloor(trains,z,trail?.a??0))
 }
 return list.sort((a,b)=>a.z-b.z)
}
function absorbHit(cause,light=false){
 if(grace>0)return true;
 cleanStart=distance;
 if(light&&stumbleCooldown<=0){
  stumbleTime=3;stumbleCooldown=10;grace=.35;
  notice('Споткнулся · хромота на 3 с');soundscape.effect('stumble');return true
 }
 if(!catTime){end(false,cause);return false}
 catTime=0;catCooldown=5;grace=1.5;scatter(x,height+1,distance,'f1d4a6');notice('Кот спас!');soundscape.effect('shield');return true
}
const collected=()=>letters.length;
const wordAt=i=>marathon()?(wordKm>0&&!kmWordDone?words[(wordKm-1)%words.length]:''):(words[i]||'');
const activeWord=()=>wordAt(completed);
function letterFor(it){
 // Preview upcoming letters in route order. Missing a tile shifts the next opportunity.

 if(it.type!=='letter')return;
 if(!activeWord())return '';
 let index=collected(),wordIndex=completed;
 for(const tile of items){
  if(tile===it)break;
  if(tile.type==='letter'&&!tile.done&&tile.z>=distance-.46){
   index++;if(index>=wordAt(wordIndex).length){if(marathon())return '';wordIndex++;index=0;if(!wordAt(wordIndex))return ''}
  }
 }
 return wordAt(wordIndex)[index]
}
function score(){return Math.floor(distance)+coins*10+completed*100}
function status(){
 $('catButton').hidden=state!=='run';$('catStock').textContent=catTime>0?Math.ceil(catTime)+'с':profile.cats;
 $('catButton').disabled=catTime>0||catCooldown>0||!!flight;$('catButton').dataset.active=String(catTime>0);
 $('catButtonTitle').textContent=flight?'Кот на паузе':catTime>0?'Кот на трассе':catCooldown>0?'Отдых '+Math.ceil(catCooldown)+' с':profile.cats?'Позвать кота':'Нет котов';
 $('catButtonHint').textContent=flight?'Бонусы ждут посадки':catTime>0?'Спасёт от одного удара':catCooldown>0?'Скоро можно снова':'C / двойной тап';
 $('menuCats').textContent=profile.cats;
 $('skinBalance').textContent=profile.keys;$('keyBadge').hidden=state!=='run';$('keyTotal').textContent=profile.keys;
 $('powers').textContent=[flight?'🍗 Крылышки · '+Math.ceil(flight.end-distance)+' м · бонусы на паузе':'',flowHits>0?'Испачкан · второй поток опасен':'',stumbleTime>0?'Замедление '+Math.ceil(stumbleTime)+' с':stumbleCooldown>0?'Лёгкий удар через '+Math.ceil(stumbleCooldown)+' с':'',bootsTime>0?'Ботинки '+Math.ceil(bootsTime)+' с':'',catTime>0?'🐈 Кот '+Math.ceil(catTime)+' с':'',magnet>0?'∩ Магнит '+Math.ceil(magnet)+' с':''].filter(Boolean).join('  ·  ');
 const section=marathon()?biomeAt(distance):Math.min(2,Math.floor(distance/(length/3)));
 $('flowWarning').textContent=state==='run'?warning:'';
 $('section').textContent=marathon()?['Парк','Рынок','Вокзал'][section]:level?['Депо','Набережная','Коллектор'][section]:sewerAt(distance)?'Канализация · береги одежду':sections[section];$('routeFill').style.transform='scaleX('+(marathon()?(distance%1000)/1000:Math.min(1,distance/length))+')';
 $('distance').textContent=(marathon()?Math.floor(distance):Math.max(0,Math.ceil(length-distance)))+' м';$('count').textContent=coins;
 $('mission').textContent=missionDone?'✓ Чистые 250 м · +25':'Без удара '+Math.min(cleanGoal,Math.floor(distance-cleanStart))+'/'+cleanGoal+' м';
 const word=activeWord();$('wordLabel').textContent=marathon()&&!word?'СЛЕДУЮЩЕЕ СЛОВО':'СОБЕРИ СЛОВО';$('word').innerHTML=word?'<b>'+word.slice(0,collected())+'</b><i>'+word.slice(collected())+'</i>':marathon()?((wordKm+1)+' км'):'✓ '+words.length+'/'+words.length;
 $('best').textContent=marathon()?profile.meters+' м':best;$('mute').textContent=mute?'🔇':'🔊';$('mute').setAttribute('aria-label',mute?'Включить звук':'Выключить звук');$('mute').setAttribute('aria-pressed',String(!mute));$('mute').title=mute?'Звук выключен — включить':'Звук включён — выключить'
}
function notice(s){$('toast').textContent=s;noticeUntil=elapsed+1.45}
function ui(){
 refreshSummary();
 soundscape.sync(!devClock.frozen&&(state==='run'||state==='finish'),mute);
 $('cover').hidden=state!=='menu';$('hud').hidden=state==='menu';$('pause').hidden=state!=='run';$('overlay').hidden=!['win','lost','pause'].includes(state);status()
}
function start(){flowHits=0;rollAge=-1;rollLateral=0;if(devClock.frozen)toggleInspection();runKeys=stumbleTime=stumbleCooldown=0;bootsTime=paidCoins=cleanStart=wordKm=0;revived=missionDone=kmWordDone=false;settled=false;prepareRoute();state='run';lane=x=height=velocity=slide=distance=coins=completed=elapsed=toiletTime=0;ground=cameraLift=magnet=grace=0;flight=null;catTime=catCooldown=0;poseSlide=poseBank=landing=runCycle=0;diving=false;flecks=[];letters=[];if(marathon())resetDistricts();else items=course();$('toast').textContent='';try{soundscape.init()}catch{}ui()}
function modal(label,title,details,button){$('label').textContent=label;$('heading').textContent=title;$('result').textContent=details;$('action').textContent=button;$('toast').textContent='';ui()}
function end(won,cause){
 if(settled)return;settled=true;profile.wallet+=coins-paidCoins;paidCoins=coins;
 if(marathon())profile.meters=Math.max(profile.meters,Math.floor(distance));
 if(won&&level===0)profile.first=true;if(won&&level===1)profile.second=true;saveProfile();
 state=won?'win':'lost';best=Math.max(best,score());try{localStorage.wcDashBest=String(best)}catch{}

 soundscape.effect(won?'win':'hit');modal(won?'ФИНИШ · WC':'ЗАБЕГ ОКОНЧЕН',won?'Успел!':cause||'Не добежал!',Math.floor(distance)+' м · Заработано '+coins+' 💩'+(runKeys?' · '+runKeys+' 🔑':''),won&&level===0?'На второй уровень →':'Ещё раз →')}
function refreshSummary(){
 const results=state==='win'||state==='lost',paused=state==='pause';
 $('overlay').dataset.state=state;$('pauseStats').hidden=$('restart').hidden=$('pauseHint').hidden=!paused;
 $('pauseDistance').textContent=Math.floor(distance)+' м';$('pauseCoins').textContent=coins;$('pauseCats').textContent=profile.cats;
 document.querySelector('.overlayMark').textContent=paused?'Ⅱ':state==='win'?'✓':'↻';
 $('pauseSettings').hidden=state!=='pause';$('resultExtras').hidden=!results;$('revive').hidden=state!=='lost'||revived;
 $('revive').disabled=profile.wallet<revivePrice;
 if(results)$('nextUpgrade').textContent='Кошелёк '+profile.wallet+' 💩 · '+nextUpgrade();
}
function revive(){
 if(state!=='lost'||revived||profile.wallet<revivePrice)return;
 try{soundscape.init()}catch{}
 profile.wallet-=revivePrice;saveProfile();revived=true;settled=false;cleanStart=distance;
 grace=2.4;warning='';state='run';ui();notice('Продолжение · защита на 2 с')
}

function pause(){if(state!=='run')return;state='pause';modal('МОЖНО ВЫДОХНУТЬ','Пауза',(marathon()?'Марафон подождёт.': 'До WC ещё '+Math.ceil(length-distance)+' м.')+' Продолжим, когда будешь готов.','Продолжить забег →');$('action').focus()}
function activateCat(){
 if(state!=='run'||flight||catTime>0||catCooldown>0)return;
 if(profile.cats<1){notice('Купи кота в улучшениях');return}
 profile.cats--;saveProfile();catTime=30+5*profile.cat;notice('Кот Дениса · '+catTime+' с');soundscape.effect('power')
}
function move(action){
 if(state!=='run')return;
 if(action==='left'||action==='right'){
  const next=clamp(lane+(action==='left'?-1:1),-1,1);
  if(next!==lane&&slide>0&&grounded()&&!flight){rollLateral=Math.sign(next-lane);rollAge=0;slide=.8;}
  lane=next;return;
 }
 if(flight)return;
 if(action==='up'&&grounded()){jumpTakeoffPhase=runCycle;slide=0;rollAge=-1;rollLateral=0;diving=false;velocity=jumpVelocity*(bootsTime>0?Math.sqrt(1.5):1);soundscape.effect('jump')}
 if(action==='down'){
  soundscape.effect('slide');slide=.80;rollLateral=0;
  if(!grounded()){diving=true;velocity=Math.min(velocity,-12)}
  else{diving=false;velocity=0;rollAge=0}
 }
}
function tick(dt){
 elapsed+=dt;
 if(rollAge>=0){rollAge+=dt;if(rollAge>.8)rollAge=-1;}
 const effort=clamp((speed()-13)/8,0,1);runCycle+=dt*(effort<.33?14.5:effort<.70?17.5:21);
 if(state==='finish'){toiletTime+=dt;x=finishFrom*(1-ease(toiletTime/1.08));if(toiletTime>=5.34)end(true);return}
 if(marathon())extendDistricts();
 if(level===0)advanceShowcaseTraffic(trains,dt,distance);
 const previousX=x;
 distance=Math.min(length,distance+dt*speed());x+=(lane*2.2-x)*(1-Math.exp(-15*dt));slide=Math.max(0,slide-(diving?0:dt));
 stumbleTime=Math.max(0,stumbleTime-dt);stumbleCooldown=Math.max(0,stumbleCooldown-dt);
 if(!flight){
 catCooldown=Math.max(0,catCooldown-dt);
 if(catTime>0){catTime=Math.max(0,catTime-dt);if(catTime===0)catCooldown=5}
 bootsTime=Math.max(0,bootsTime-dt);magnet=Math.max(0,magnet-dt);
 }
 grace=Math.max(0,grace-dt);
 const wasGrounded=grounded()&&velocity<=0;
 let support=railFloor(trains,distance,x);
 for(const f of flows){
  if(f.front===null||f.passed||Math.abs(f.a-x)>1.0)continue;
  const along=distance-f.front;
  const top=f.top??1.48;
  if(along>=-.48&&along<=f.size+.55&&height>=top-.075&&velocity<=0)support=Math.max(support,top);
 }
 if(!flight&&support>height+.14){
  const car=trains.find(c=>Math.abs(c.a-x)<1&&roofAt(c,distance)>height+.14);
  const side=!!car&&distance>car.z+car.entry+.8&&Math.abs(previousX-car.a)>=1;
  if(!absorbHit(side?'Задел борт поезда':'Врезался в поезд',side))return;
  if(side){
   const away=Math.sign(previousX-car.a)||1;
   lane=clamp(Math.round(car.a/2.2)+away,-1,1);x=car.a+away*1.08;
   support=railFloor(trains,distance,x)
  }
 }
 if(!flight&&wasGrounded&&Math.abs(ground-support)<.22)height=support;
 ground=support;
 poseBank+=(clamp((lane*2.2-x)*1.6,-1,1)-poseBank)*(1-Math.exp(-12*dt));
 poseSlide+=((slide>0&&(grounded()||diving)?1:0)-poseSlide)*(1-Math.exp(-18*dt));
 landing*=Math.exp(-11*dt);
 if(flight)advanceFlight(support);
 else{
  const wasAirborne=!wasGrounded;
  velocity-=gravity*dt;height=Math.max(ground,height+velocity*dt);if(grounded()&&velocity<0)velocity=0;
  if(wasAirborne&&grounded()){if(diving){diving=false;slide=.80;rollAge=0}landing=1;scatter(x,ground+.12,distance,'dcd9b3')}
  if(grounded()&&!slide)soundscape.effect('step')
 }
 const cameraTarget=flight?height:Math.max(ground,height-.95);
 cameraLift+=(cameraTarget-cameraLift)*(1-Math.exp(-6*dt));
 if(marathon()&&Math.floor(distance/1000)>wordKm){
  wordKm=Math.floor(distance/1000);kmWordDone=false;letters=[];notice('Слово километра · '+activeWord())
 }
 if(!updateFlows(dt))return;
 for(const car of trains)for(const token of car.roofTokens||[]){
  const z=car.z+car.entry+token.offset;
  if(!token.done&&(bootsAttract(car.a,z,roofHeight)||(Math.abs(z-distance)<.65&&Math.abs(car.a-x)<.86&&Math.abs(height-roofHeight)<.65))){token.done=true;coins++;scatter(x,height+.6,distance,'efc55a');soundscape.effect('coin');}
 }
 if(level===0&&!flight){const approaching=trains.find(c=>c.incomingSpeed&&c.z-distance>0&&c.z-distance<70);if(approaching){warning='Встречный поезд '+(approaching.a<0?'слева':approaching.a>0?'справа':'по центру')+'!';if(!approaching.warned){approaching.warned=true;soundscape.effect('alarm')}}}
 if(elapsed>noticeUntil)$('toast').textContent='';
 while(firstNearby<items.length&&items[firstNearby].z<distance-rearMargin)firstNearby++;
 for(let i=firstNearby;i<items.length&&items[i].z<=distance+2.3;i++){
  const it=items[i];if(it.done)continue;
  const dz=it.z-distance,dx=Math.abs(it.a-x),pull=it.type==='poo'&&!flight&&magnet>0&&Math.abs(height+.70-it.y)<2.9;
  const bootPull=!isBarrier(it.type)&&bootsAttract(it.a,it.z,it.y);
  if(!bootPull&&(Math.abs(dz)>(pull?2.2:.57)||dx>(pull?4.7:.86)))continue;
  if(isBarrier(it.type)){
   if(!flight&&hitsBarrier(it)){
    it.done=true;
    const light=it.type==='crate'||dx>.68;
    if(!absorbHit('Врезался в препятствие',light))return;
    if(dx>.68){const away=Math.sign(x-it.a)||1;lane=clamp(Math.round(it.a/2.2)+away,-1,1);x=it.a+away*1.08}
   }
   continue
  }
  if(it.type==='poo'){
   if(!pull&&!bootPull&&Math.abs(height+(slide>0?.38:.70)-it.y)>.76)continue;
   coins++;scatter(it.a,it.y,it.z,'ffcb55');soundscape.effect('coin')
  }else if(it.type==='key'){
   if(!bootPull&&Math.abs(height+.7-(it.y+1.0))>1.15)continue;
   profile.keys++;runKeys++;saveProfile();notice('Ключ от WC · '+profile.keys+' в запасе');soundscape.effect('key');
   scatter(it.a,it.y+1,it.z,'59bcff')
  }else if(it.type==='magnet'||it.type==='boots'||it.type==='wings'){
   if(!bootPull&&Math.abs(height-it.y)>1.5)continue;
   if(it.type==='wings'){if(flight)continue;beginFlight()}
   else{
    if(it.type==='boots'){bootsTime=7+2*profile.boots;notice('Высокий прыжок · '+bootsTime+' с')}
    else if(it.type==='magnet'){magnet=6+2*profile.magnet;notice('Магнит · '+magnet+' с')}

    soundscape.effect('power')
   }
   scatter(it.a,it.y+1,it.z,'70e1e5')
  }else if(it.type==='letter'){
   if(!activeWord()||(!bootPull&&Math.abs(height-it.y)>1.5))continue;
   letters.push(activeWord()[collected()]);scatter(it.a,it.y+1.16,it.z,'bcf5a8');soundscape.effect('letter');
   if(collected()===activeWord().length){
    soundscape.effect('word');notice(activeWord()+'! +100');completed++;letters=[];if(marathon())kmWordDone=true;
    if(!marathon()&&!activeWord())for(const tile of items)if(tile.type==='letter')tile.done=true
   }
  }
  if(bootPull)scatter(x,height+.65,distance,'a9eaff');
  it.done=true
 }
 if(!missionDone&&distance-cleanStart>=cleanGoal){missionDone=true;coins+=cleanReward;notice('250 м без удара · +25 💩')}
 if(distance===length){height=slide=ground=cameraLift=0;stumbleTime=0;finishFrom=x;poseSlide=poseBank=landing=0;diving=false;state='finish';$('toast').textContent='';ui()}
}
let prev=0;
function frame(ms){const wallDt=Math.min(.07,(ms-(prev||ms))/1000),dt=devClock.advance(wallDt);prev=ms;clock+=dt;
 if(state==='run'||state==='finish'){let rest=dt;while(rest>0&&(state==='run'||state==='finish')){const step=Math.min(rest,1/120);tick(step);rest-=step}status()}
 render3D(wallDt);requestAnimationFrame(frame)}
$('restart').onclick=start;$('catButton').onclick=()=>{activateCat();status()};
$('start').onclick=start;$('action').onclick=()=>{if(state==='pause'){try{soundscape.init()}catch{}state='run';ui()}else {if(state==='win'&&level===0)chooseRoute(1);start()}};$('pause').onclick=pause;$('home').onclick=()=>{state='menu';height=slide=0;ui()};
$('mute').onclick=()=>{mute=!mute;try{soundscape.init()}catch{}
 soundscape.sync(state==='run'||state==='finish',mute);try{localStorage.wcDashMuted=mute?'yes':'no'}catch{}status()};
const keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',Space:'up',ArrowDown:'down',KeyA:'left',KeyD:'right',KeyW:'up',KeyS:'down'};
addEventListener('keydown',e=>{
 if($('settings').open||$('store').open)return;
 if(e.code==='KeyL'&&!e.repeat){e.preventDefault();toggleInspection();return}
 if(devClock.frozen){
  if(e.code==='Period'||e.code==='NumpadDecimal'){e.preventDefault();devClock.requestStep()}
  else if(e.code==='KeyH'&&!e.repeat)$('devPanel').hidden=!$('devPanel').hidden;
  else if(e.code==='KeyR')render3D.stage?.inspection?.setActive(true);
  else if(render3D.stage?.inspection?.move(e.code))e.preventDefault();
  return;
 }
 if(e.repeat)return;if(e.code==='KeyC'){activateCat();return}try{soundscape.wake()}catch{}if(e.code==='Escape'){if(state==='pause')$('action').click();else pause();return}
 if(state==='run'&&keys[e.code]){e.preventDefault();move(keys[e.code])}});
let pointer=null,lastTap=0;
canvas.addEventListener('pointerdown',e=>{if(devClock.frozen)return;try{soundscape.wake()}catch{}if(state!=='run'||pointer)return;canvas.setPointerCapture(e.pointerId);pointer={id:e.pointerId,x:e.clientX,y:e.clientY}});
function swipe(e){if(devClock.frozen||!pointer||e.pointerId!==pointer.id)return;
 const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.max(Math.abs(dx),Math.abs(dy))<17)return;
 move(Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down');pointer=null}
canvas.addEventListener('pointermove',swipe);canvas.addEventListener('pointerup',e=>{
 if(devClock.frozen){pointer=null;return}
 if(pointer&&pointer.id===e.pointerId){
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
  if(Math.max(Math.abs(dx),Math.abs(dy))<17){
   const now=performance.now();if(lastTap&&now-lastTap<350){activateCat();lastTap=0}else lastTap=now
  }else swipe(e)
 }
 pointer=null
});canvas.addEventListener('lostpointercapture',()=>pointer=null);
addEventListener('keyup',e=>render3D.stage?.inspection?.release(e.code));
addEventListener('blur',()=>{render3D.stage?.inspection?.clear();if(!devClock.frozen)pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden){render3D.stage?.inspection?.clear();if(!devClock.frozen)pause()}});
$('devStep').onclick=()=>devClock.requestStep();$('devResume').onclick=toggleInspection;
$('inspect').onclick=toggleInspection;
$('hint').textContent=navigator.maxTouchPoints?'Свайпай по экрану':'Стрелки или WASD';
if(navigator.maxTouchPoints)document.querySelector('footer').prepend(document.createTextNode('Свайпы'));
$('skinsBtn').onclick=()=>showShop('skins');$('settingsBtn').onclick=showSettings;$('pauseSettings').onclick=showSettings;
$('musicVolume').oninput=e=>{soundscape.setVolumes(+e.target.value/100,+$('fxVolume').value/100);volumeLabels()};
$('fxVolume').oninput=e=>{soundscape.setVolumes(+$('musicVolume').value/100,+e.target.value/100);volumeLabels()};
function volumeLabels(){$('musicValue').textContent=$('musicVolume').value+'%';$('fxValue').textContent=$('fxVolume').value+'%'}
function showSettings(){const v=soundscape.getVolumes();$('musicVolume').value=Math.round(v.music*100);$('fxVolume').value=Math.round(v.fx*100);volumeLabels();$('settings').showModal()}
document.querySelectorAll('[data-store-tab]').forEach(b=>b.onclick=()=>showShop(b.dataset.storeTab));
$('revive').onclick=revive;$('resultShop').onclick=()=>showShop('gear');$('shopBtn').onclick=()=>showShop('gear');
document.querySelectorAll('[data-route]').forEach((b,i)=>b.onclick=()=>chooseRoute(i));chooseRoute(0);
ui();requestAnimationFrame(frame);
