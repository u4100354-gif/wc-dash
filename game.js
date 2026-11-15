'use strict';
const $=id=>document.getElementById(id), canvas=$('screen');
let level=0,length=360;
const routes=[{name:'Солнечный переход',meters:360},{name:'Большой коллектор',meters:1800},{name:'Марафон',meters:Infinity}];
const ease=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t)};
const words=['ЛИФТ','МАРС','УСПЕЛ'], clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
let bootsTime=0,settled=false,paidCoins=0,revived=false,cleanStart=0,missionDone=false;
let wordKm=0,kmWordDone=false;
const revivePrice=40,cleanGoal=250,cleanReward=25;
let best=0,mute=false;
try{best=Number(localStorage.wcDashBest)||0;mute=localStorage.wcDashMuted==='yes'}catch{}
let state='menu',distance=0,lane=0,x=0,height=0,velocity=0,slide=0,coins=0,completed=0,letters=[],items=[],stamp=0,noticeUntil=0,clock=0,elapsed=0,toiletTime=0;
let poseSlide=0,poseBank=0,landing=0,flecks=[];
const sections=['Вестибюль','Стеклянная галерея','Зимний сад'];
function scatter(a,b,z,color){
 flecks=flecks.filter(e=>elapsed-e.at<.43);
 for(let i=0;i<8;i++){const angle=i*Math.PI/4+.4;flecks.push({at:elapsed,x:a,y:b,z,vx:Math.cos(angle)*1.6,vy:1+i%3*.58,vz:Math.sin(angle)*1.6+6,color})}
}
const render3D=createWorld(canvas);
const rearMargin=16; // Behind the furthest chase camera, including in flight.
let trains=[],flows=[],warning='',firstNearby=0;
const marathon=()=>level===2;
function chooseRoute(index){
 level=index;length=routes[index].meters;
 document.querySelectorAll('[data-route]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
 $('best').textContent=index===2?profile.meters+' м':best;
 $('summary').textContent=index===2?'Парк, рынок и вокзал. Каждые 1 000 м появляется слово. Рекорд марафона — '+profile.meters+' м.':index?'1 800 м по открытым путям. Видишь предупреждение о потоке — меняй полосу.':'360 м от лифта до WC. Собирай буквы и монетки кота Марса.';
}
function prepareRoute(){
 const starts=level?Array.from({length:15},(_,i)=>36+116*i):[56,130,201,273];
 trains=starts.flatMap((z,i)=>trainGroup(z,[1,-1,0,1,0,-1][i%6],i%2?-1:1));
 // Meet each wave in a road gap; its whole visible path uses a clear lane.
 const targets=level?starts.flatMap(z=>[z+64,z+90]):[30,121,193,264,341];
 flows=targets.map((target,i)=>planFlow(target,trains,i)).filter(Boolean);
 warning='';firstNearby=0;
}
function planFlow(target,cars,index){
 const pace=level===2?13+Math.min(10,target/100):13+8*target/length;
 const incoming=level?11:8;
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
 return {trigger,a:lanes[index%lanes.length],frontOffset,size:6,front:null,passed:false}
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
  f.front-=dt*(level?11:8);
  const lead=f.front-distance;
  if(lead+f.size < -rearMargin){f.passed=true;continue}
  if(!flight&&!f.hit&&height<1.48&&Math.abs(f.a-x)<1.13&&lead<=.48&&lead+f.size>=-.55){
   f.hit=true;
   if(!absorbHit('Накрыл встречный поток'))return false;
  }
  if(!flight&&!warning&&!f.hit&&lead<62&&lead+f.size>0)warning=(f.required?'Прыгай на поток · ':'Поток ')+(f.a<0?'слева':f.a>0?'справа':'по центру')+'!';
 }
 return true
}
let ground=0,cameraLift=0,magnet=0,shield=false,grace=0,finishFrom=0;
let shieldAt=-10,shieldBreakAt=-10,flight=null;
const grounded=()=>height<=ground+.015;
const speed=()=>marathon()?13+Math.min(10,distance/100):13+8*distance/length;
const isBarrier=type=>type==='crate'||type==='bar'||type==='hurdle'||type==='wall';
// Physics and both renderers share the actual clearance of each obstacle.
const hurdleBottom=1.08,hurdleTop=1.32,slideHeight=1.04;
function hitsBarrier(item){
 const bottom=height-item.y;
 switch(item.type){
  case 'wall':return bottom<5;
  case 'crate':return bottom<.85;
  case 'bar':return bottom<2.03&&bottom+(slide>0?slideHeight:1.93)>1.39;
  case 'hurdle':return bottom<hurdleTop&&bottom+(slide>0?slideHeight:1.93)>hurdleBottom;
 }
 return false
}
const flightHeight=6.1;
function beginFlight(){
 const reach=Math.min(140,length-distance-12);
 if(reach<50)return;
 flight={start:distance,end:distance+reach,from:height};
 slide=velocity=0;
 const airLanes=lane===0?[0,1,0,-1]:[lane,0,-lane,0];
 const airTrail=[];
 for(let dz=16;dz<reach-21;dz+=2.5){
  const band=Math.floor((dz-16)/20)%4;
  const airLane=airLanes[band];
  airTrail.push({type:'poo',air:true,z:distance+dz,a:airLane*2.2,y:flightHeight+.68})
 }
 items.push(...airTrail);items.sort((a,b)=>a.z-b.z);
 notice('Слабительное! Свайпай за монетами');soundscape.effect('launch')
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
 const challenges=level?Array.from({length:15},(_,i)=>[[14+i*116,(i%3)-1,i%2?'hurdle':'crate'],[27+i*116,((i+1)%3)-1,i%2?'bar':'hurdle']]).flat():[[22,0,'crate'],[43,-1,'hurdle'],[118,1,'bar'],[192,-1,'crate'],[263,0,'hurdle'],[341,0,'bar']];
 for(const [z,lane,type] of challenges)add(type,z,lane*2.2);
 // Walls on the outer routes guide the player towards the incoming stream.
 const requiredTargets=level?[100]:[193];
 for(const meeting of requiredTargets){
  const wave=flows.filter(f=>f.trigger<meeting&&meeting-f.trigger<30).at(-1);
  if(!wave)continue;
  wave.required=true;
  for(const side of [-2.2,0,2.2])if(side!==wave.a)add('wall',meeting,side)
 }

 for(let z=5;z<length-9;z+=2){
  const near=challenges.find(([at])=>Math.abs(at-z)<=8);
  const trail=railTrail(trains,z);
  if(trail){add('poo',z,trail.a,trail.y);continue}
  if(near){const [at,l,type]=near,u=(z-at)/6;
   const y=type==='crate'?.64+1.35*Math.max(0,1-u*u):Math.abs(z-at)<4?.34:.64;
   add('poo',z,l*2.2,y);continue}
  add('poo',z,[0,0,-2.2,0,2.2,2.2][Math.floor(z/9)%6],.65)
 }
 for(let i=0,z=10;z<length-10;z+=15,i++){
  const train=trains.find(v=>z>=v.z&&z<=trainEnd(v));
  add('letter',z,train?train.a:[0,-2.2,2.2,0][i%4],train?roofAt(train,z):0)
 }
 function gear(type,z,a){add(type,z,a,railFloor(trains,z,a))}
 for(const [type,z,a] of [['magnet',7,0],['shield',39,-2.2],['magnet',100,2.2],['shield',164,0],['magnet',238,-2.2],['shield',273,2.2]])gear(type,z,a);
 for(let z=54;z<length;z+=182)gear('boots',z,0);
 for(let z=level?106:119;z<length-155;z+=348)gear('laxative',z,0);
 if(level)for(let i=1;i<14;i++)gear(i%2?'magnet':'shield',i*116+4,2.2*([0,1,-1][i%3]));
 return list.sort((a,b)=>a.z-b.z)
}
function absorbHit(cause){
 if(grace>0)return true;
 cleanStart=distance;
 if(!shield){end(false,cause);return false}
 shield=false;shieldBreakAt=elapsed;grace=1.2+.6*profile.shield;scatter(x,height+1,distance,'64dfed');notice('Щит спас!');soundscape.effect('shield');return true
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
 $('powers').textContent=[flight?'Полёт · '+Math.ceil(flight.end-distance)+' м':'',bootsTime>0?'Ботинки '+Math.ceil(bootsTime)+' с':'',shield?'◇ Щит':'',magnet>0?'∩ Магнит '+Math.ceil(magnet)+' с':''].filter(Boolean).join('  ·  ');
 const section=marathon()?biomeAt(distance):Math.min(2,Math.floor(distance/(length/3)));
 $('flowWarning').textContent=state==='run'?warning:'';
 $('section').textContent=marathon()?['Парк','Рынок','Вокзал'][section]:level?['Депо','Набережная','Коллектор'][section]:sections[section];$('routeFill').style.transform='scaleX('+(marathon()?(distance%1000)/1000:Math.min(1,distance/length))+')';
 $('distance').textContent=(marathon()?Math.floor(distance):Math.max(0,Math.ceil(length-distance)))+' м';$('count').textContent=coins;
 $('mission').textContent=missionDone?'✓ Чистые 250 м · +25':'Без удара '+Math.min(cleanGoal,Math.floor(distance-cleanStart))+'/'+cleanGoal+' м';
 const word=activeWord();$('wordLabel').textContent=marathon()&&!word?'СЛЕДУЮЩЕЕ СЛОВО':'СОБЕРИ СЛОВО';$('word').innerHTML=word?'<b>'+word.slice(0,collected())+'</b><i>'+word.slice(collected())+'</i>':marathon()?((wordKm+1)+' км'):'✓ '+words.length+'/'+words.length;
 $('best').textContent=marathon()?profile.meters+' м':best;$('mute').textContent=mute?'🔇':'🔊';$('mute').setAttribute('aria-label',mute?'Включить звук':'Выключить звук');$('mute').setAttribute('aria-pressed',String(!mute));$('mute').title=mute?'Звук выключен — включить':'Звук включён — выключить'
}
function notice(s){$('toast').textContent=s;noticeUntil=elapsed+1.45}
function ui(){
 refreshSummary();
 soundscape.sync(state==='run'||state==='finish',mute);
 $('cover').hidden=state!=='menu';$('hud').hidden=state==='menu';$('pause').hidden=state!=='run';$('overlay').hidden=!['win','lost','pause'].includes(state);status()
}
function start(){bootsTime=paidCoins=cleanStart=wordKm=0;revived=missionDone=kmWordDone=false;settled=false;prepareRoute();state='run';lane=x=height=velocity=slide=distance=coins=completed=elapsed=toiletTime=0;ground=cameraLift=magnet=grace=0;shield=false;shieldAt=shieldBreakAt=-10;flight=null;poseSlide=poseBank=landing=0;flecks=[];letters=[];if(marathon())resetDistricts();else items=course();$('toast').textContent='';try{soundscape.init()}catch{}ui()}
function modal(label,title,details,button){$('label').textContent=label;$('heading').textContent=title;$('result').textContent=details;$('action').textContent=button;$('toast').textContent='';ui()}
function end(won,cause){
 if(settled)return;settled=true;profile.wallet+=coins-paidCoins;paidCoins=coins;
 if(marathon())profile.meters=Math.max(profile.meters,Math.floor(distance));
 if(won&&level===0)profile.first=true;if(won&&level===1)profile.second=true;saveProfile();
 state=won?'win':'lost';best=Math.max(best,score());try{localStorage.wcDashBest=String(best)}catch{}

 soundscape.effect(won?'win':'hit');modal(won?'ФИНИШ · WC':'ЗАБЕГ ОКОНЧЕН',won?'Успел!':cause||'Не добежал!',Math.floor(distance)+' м · Заработано '+coins+' 💩',won&&level===0?'На второй уровень →':'Ещё раз →')}
function refreshSummary(){
 const results=state==='win'||state==='lost';
 $('resultExtras').hidden=!results;$('revive').hidden=state!=='lost'||revived;
 $('revive').disabled=profile.wallet<revivePrice;
 if(results)$('nextUpgrade').textContent='Кошелёк '+profile.wallet+' 💩 · '+nextUpgrade();
}
function revive(){
 if(state!=='lost'||revived||profile.wallet<revivePrice)return;
 try{soundscape.init()}catch{}
 profile.wallet-=revivePrice;saveProfile();revived=true;settled=false;cleanStart=distance;
 grace=2.4;warning='';state='run';ui();notice('Продолжение · защита на 2 с')
}

function pause(){if(state!=='run')return;state='pause';modal('ПЕРЕРЫВ','Пауза',(marathon()?'Пройдено '+Math.floor(distance):'До унитаза ещё '+Math.ceil(length-distance))+' м.','Продолжить →')}
function move(action){
 if(state!=='run')return;
 if(action==='left'||action==='right'){lane=clamp(lane+(action==='left'?-1:1),-1,1);return}
 if(flight)return;
 if(action==='up'&&grounded()){slide=0;velocity=bootsTime>0?11.8:9.4;soundscape.effect('jump')}
 if(action==='down'){soundscape.effect('slide');slide=.80;if(!grounded())velocity=-12}
}
function tick(dt){
 elapsed+=dt;
 if(state==='finish'){toiletTime+=dt;x=finishFrom*(1-ease(toiletTime/1.08));if(toiletTime>=5.34)end(true);return}
 if(marathon())extendDistricts();
 distance=Math.min(length,distance+dt*speed());x+=(lane*2.2-x)*(1-Math.exp(-15*dt));slide=Math.max(0,slide-dt);
 bootsTime=Math.max(0,bootsTime-dt);magnet=Math.max(0,magnet-dt);grace=Math.max(0,grace-dt);
 const wasGrounded=grounded()&&velocity<=0;
 let support=railFloor(trains,distance,x);
 for(const f of flows){
  if(f.front===null||f.passed||Math.abs(f.a-x)>1.0)continue;
  const along=distance-f.front;
  if(along>=0&&along<=f.size&&height>=1.42&&velocity<=0)support=Math.max(support,1.48);
 }
 if(!flight&&support>height+.14&&!absorbHit())return;
 if(!flight&&wasGrounded&&Math.abs(ground-support)<.22)height=support;
 ground=support;
 poseBank+=(clamp((lane*2.2-x)*1.6,-1,1)-poseBank)*(1-Math.exp(-12*dt));
 poseSlide+=((slide>0&&grounded()?1:0)-poseSlide)*(1-Math.exp(-18*dt));
 landing*=Math.exp(-11*dt);
 if(flight)advanceFlight(support);
 else{
  const wasAirborne=!wasGrounded;
  velocity-=17*dt;height=Math.max(ground,height+velocity*dt);if(grounded()&&velocity<0)velocity=0;
  if(wasAirborne&&grounded()){landing=1;scatter(x,ground+.12,distance,'dcd9b3')}
  if(grounded()&&!slide)soundscape.effect('step')
 }
 const cameraTarget=flight?height:Math.max(ground,height-.95);
 cameraLift+=(cameraTarget-cameraLift)*(1-Math.exp(-6*dt));
 if(marathon()&&Math.floor(distance/1000)>wordKm){
  wordKm=Math.floor(distance/1000);kmWordDone=false;letters=[];notice('Слово километра · '+activeWord())
 }
 if(!updateFlows(dt))return;
 if(elapsed>noticeUntil)$('toast').textContent='';
 while(firstNearby<items.length&&items[firstNearby].z<distance-rearMargin)firstNearby++;
 for(let i=firstNearby;i<items.length&&items[i].z<=distance+2.3;i++){
  const it=items[i];if(it.done)continue;
  const dz=it.z-distance,dx=Math.abs(it.a-x),pull=it.type==='poo'&&magnet>0&&Math.abs(height+.70-it.y)<2.9;
  if(Math.abs(dz)>(pull?2.2:.57)||dx>(pull?4.7:.86))continue;
  if(isBarrier(it.type)){
   if(!flight&&hitsBarrier(it)){
    it.done=true;
    if(!absorbHit())return
   }
   continue
  }
  if(it.type==='poo'){
   if(!pull&&Math.abs(height+(slide>0?.38:.70)-it.y)>.76)continue;
   coins++;scatter(it.a,it.y,it.z,'ffcb55');soundscape.effect('coin')
  }else if(it.type==='magnet'||it.type==='shield'||it.type==='boots'||it.type==='laxative'){
   if(Math.abs(height-it.y)>1.5)continue;
   if(it.type==='laxative'){if(flight)continue;beginFlight()}
   else{
    if(it.type==='boots'){bootsTime=7+2*profile.boots;notice('Высокий прыжок · '+bootsTime+' с')}
    else if(it.type==='magnet'){magnet=6+2*profile.magnet;notice('Магнит · '+magnet+' с')}
    else{shield=true;shieldAt=elapsed;notice('Щит · защита от удара')}
    soundscape.effect('power')
   }
   scatter(it.a,it.y+1,it.z,'70e1e5')
  }else if(it.type==='letter'){
   if(!activeWord()||Math.abs(height-it.y)>1.5)continue;
   letters.push(activeWord()[collected()]);scatter(it.a,it.y+1.16,it.z,'bcf5a8');soundscape.effect('letter');
   if(collected()===activeWord().length){
    soundscape.effect('word');notice(activeWord()+'! +100');completed++;letters=[];if(marathon())kmWordDone=true;
    if(!marathon()&&!activeWord())for(const tile of items)if(tile.type==='letter')tile.done=true
   }
  }
  it.done=true
 }
 if(!missionDone&&distance-cleanStart>=cleanGoal){missionDone=true;coins+=cleanReward;notice('250 м без удара · +25 💩')}
 if(distance===length){height=slide=ground=cameraLift=0;finishFrom=x;poseSlide=poseBank=landing=0;state='finish';$('toast').textContent='';ui()}
}
let prev=0;
function frame(ms){const dt=Math.min(.07,(ms-(prev||ms))/1000);prev=ms;clock+=dt;
 if(state==='run'||state==='finish'){let rest=dt;while(rest>0&&(state==='run'||state==='finish')){const step=Math.min(rest,1/120);tick(step);rest-=step}status()}
 render3D();requestAnimationFrame(frame)}
$('start').onclick=start;$('action').onclick=()=>{if(state==='pause'){try{soundscape.init()}catch{}state='run';ui()}else {if(state==='win'&&level===0)chooseRoute(1);start()}};$('pause').onclick=pause;$('home').onclick=()=>{state='menu';height=slide=0;ui()};
$('mute').onclick=()=>{mute=!mute;try{soundscape.init()}catch{}
 soundscape.sync(state==='run'||state==='finish',mute);try{localStorage.wcDashMuted=mute?'yes':'no'}catch{}status()};
const keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',Space:'up',ArrowDown:'down',KeyA:'left',KeyD:'right',KeyW:'up',KeyS:'down'};
addEventListener('keydown',e=>{if(e.repeat)return;try{soundscape.wake()}catch{}if(e.code==='Escape'){if(state==='pause')$('action').click();else pause();return}
 if(state==='run'&&keys[e.code]){e.preventDefault();move(keys[e.code])}});
let pointer=null;
canvas.addEventListener('pointerdown',e=>{try{soundscape.wake()}catch{}if(state!=='run'||pointer)return;canvas.setPointerCapture(e.pointerId);pointer={id:e.pointerId,x:e.clientX,y:e.clientY}});
function swipe(e){if(!pointer||e.pointerId!==pointer.id)return;
 const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.max(Math.abs(dx),Math.abs(dy))<17)return;
 move(Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down');pointer=null}
canvas.addEventListener('pointermove',swipe);canvas.addEventListener('pointerup',e=>{swipe(e);pointer=null});canvas.addEventListener('lostpointercapture',()=>pointer=null);
addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
$('hint').textContent=navigator.maxTouchPoints?'Свайпай по экрану':'Стрелки или WASD';
if(navigator.maxTouchPoints)document.querySelector('footer').prepend(document.createTextNode('Свайпы'));
$('revive').onclick=revive;$('resultShop').onclick=showShop;$('shopBtn').onclick=showShop;
document.querySelectorAll('[data-route]').forEach((b,i)=>b.onclick=()=>chooseRoute(i));chooseRoute(0);
ui();requestAnimationFrame(frame);
