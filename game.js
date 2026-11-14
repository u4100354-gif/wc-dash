'use strict';
const $=id=>document.getElementById(id), canvas=$('screen');
let level=0,length=360;
const routes=[{name:'Солнечный переход',meters:360},{name:'Большой коллектор',meters:1800},{name:'Марафон',meters:Infinity}];
const ease=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t)};
const words=['ЛИФТ','МАРС','УСПЕЛ'], clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
let doubleTime=0,settled=false;
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
const roofHeight=1.90,rampLength=7,roofLength=15;
const firstTrains=[{z:64,a:2.2},{z:131,a:-2.2},{z:205,a:0},{z:279,a:2.2}];
let trains=firstTrains,flows=[],warning='',firstNearby=0;
const marathon=()=>level===2;
function chooseRoute(index){
 level=index;length=routes[index].meters;
 document.querySelectorAll('[data-route]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
 $('summary').textContent=index===2?'Бесконечная трасса. Обходи потоки, собирай монеты и устанавливай рекорд дистанции.':index?'1 800 м по открытым путям. Видишь предупреждение о потоке — меняй полосу.':'360 м от лифта до WC. Собирай буквы и монетки кота Марса.';
}
function prepareRoute(){
 trains=level?Array.from({length:15},(_,i)=>({z:36+116*i,a:2.2*[1,-1,0,1,0,-1][i%6]})):firstTrains;
 // Moving fronts cross in dedicated clear stretches between the stationary cars.
 flows=level?Array.from({length:15},(_,i)=>({trigger:71+116*i,a:[0,-2.2,2.2,-2.2,0,2.2,0][i%7],size:12+3*(i%3),front:null,passed:false})):
 [{trigger:221,a:-2.2,size:12,front:null,passed:false}];
 warning='';firstNearby=0;
}
function updateFlows(dt){
 warning='';
 for(const f of flows){
  if(f.passed||distance<f.trigger)continue;
  if(f.front===null){f.front=distance+63;soundscape.effect('alarm')}
  f.front-=dt*(level?11:8);
  const lead=f.front-distance;
  if(lead+f.size<-.7){f.passed=true;continue}
  if(Math.abs(f.a-x)<1.13&&lead<=.48&&lead+f.size>=-.55){
   if(!shield&&grace<=0){end(false,'Накрыл встречный поток');return false}
   if(shield)absorbHit();f.passed=true;continue
  }
  if(lead<62)warning='Поток '+(f.a<0?'слева':f.a>0?'справа':'по центру')+'!';
 }
 return true
}
let ground=0,cameraLift=0,magnet=0,shield=false,grace=0,finishFrom=0;
const grounded=()=>height<=ground+.015;
const speed=()=>marathon()?13+Math.min(10,distance/100):13+8*distance/length;
function roofAt(train,z){
 const along=z-train.z;
 return roofHeight*clamp(Math.min(along,2*rampLength+roofLength-along)/rampLength,0,1)
}
function course(){
 const list=[],add=(type,z,a,y=0)=>list.push({type,z,a,y});
 // Each pattern has an optional challenge lane and two passing lanes.
 const challenges=level?Array.from({length:15},(_,i)=>[[14+i*116,(i%3)-1,i%2?'bar':'crate'],[27+i*116,((i+1)%3)-1,i%2?'crate':'bar']]).flat():[[22,0,'crate'],[45,-1,'bar'],[105,1,'crate'],[121,0,'bar'],[173,-1,'crate'],[191,1,'bar'],[246,0,'crate'],[264,-1,'bar'],[322,1,'crate'],[341,0,'bar']];
 for(const [z,lane,type] of challenges)add(type,z,lane*2.2);
 for(let z=5;z<length-9;z+=2){
  const near=challenges.find(([at])=>Math.abs(at-z)<=8);
  const train=trains.find(v=>z>=v.z-4&&z<=v.z+2*rampLength+roofLength+2);
  if(train){add('poo',z,train.a,roofAt(train,z)+.64);continue}
  if(near){const [at,l,type]=near,u=(z-at)/6;
   const y=type==='crate'?.64+1.35*Math.max(0,1-u*u):Math.abs(z-at)<4?.34:.64;
   add('poo',z,l*2.2,y);continue}
  add('poo',z,[0,0,-2.2,0,2.2,2.2][Math.floor(z/9)%6],.65)
 }
 for(let i=0,z=10;z<length-10;z+=15,i++){
  const train=trains.find(v=>z>=v.z&&z<=v.z+2*rampLength+roofLength);
  add('letter',z,train?train.a:[0,-2.2,2.2,0][i%4],train?roofAt(train,z):0)
 }
 for(const [type,z,a] of [['magnet',7,0],['shield',39,-2.2],['magnet',100,2.2],['shield',164,0],['magnet',238,-2.2],['shield',273,2.2]])add(type,z,a);
 for(let z=54;z<length;z+=182)add('double',z,0);
 if(level)for(let i=1;i<14;i++)add(i%2?'magnet':'shield',i*116+4,2.2*([0,1,-1][i%3]));
 return list.sort((a,b)=>a.z-b.z)
}
function absorbHit(){
 if(grace>0)return true;
 if(!shield){end(false);return false}
 shield=false;grace=1.2+.6*profile.shield;scatter(x,height+1,distance,'64dfed');notice('Щит спас!');soundscape.effect('shield');return true
}
const collected=()=>letters.length;
const wordAt=i=>marathon()?words[i%words.length]:(words[i]||'');
const activeWord=()=>wordAt(completed);
function letterFor(it){
 // Preview upcoming letters in route order. Missing a tile shifts the next opportunity.

 if(it.type!=='letter')return;
 if(!activeWord())return '';
 let index=collected(),wordIndex=completed;
 for(const tile of items){
  if(tile===it)break;
  if(tile.type==='letter'&&!tile.done&&tile.z>=distance-.46){
   index++;if(index>=wordAt(wordIndex).length){wordIndex++;index=0;if(!wordAt(wordIndex))return ''}
  }
 }
 return wordAt(wordIndex)[index]
}
function score(){return Math.floor(distance)+coins*10+completed*100}
function status(){
 $('powers').textContent=[doubleTime>0?'×2 '+Math.ceil(doubleTime)+' с':'',shield?'◇ Щит':'',magnet>0?'∩ Магнит '+Math.ceil(magnet)+' с':''].filter(Boolean).join('  ·  ');
 const section=marathon()?Math.floor(distance/160)%3:Math.min(2,Math.floor(distance/(length/3)));
 $('flowWarning').textContent=state==='run'?warning:'';
 $('section').textContent=marathon()?['Марафон','Рынок','Депо'][section]:level?['Депо','Набережная','Коллектор'][section]:sections[section];$('routeFill').style.transform='scaleX('+(marathon()?(distance%1000)/1000:Math.min(1,distance/length))+')';
 $('distance').textContent=(marathon()?Math.floor(distance):Math.max(0,Math.ceil(length-distance)))+' м';$('count').textContent=coins;
 const word=activeWord();$('word').innerHTML=word?'<b>'+word.slice(0,collected())+'</b><i>'+word.slice(collected())+'</i>':'✓ '+words.length+'/'+words.length;
 $('best').textContent=marathon()?profile.meters+' м':best;$('mute').textContent=mute?'♩':'♫';$('mute').setAttribute('aria-label',mute?'Включить звук':'Выключить звук')
}
function notice(s){$('toast').textContent=s;noticeUntil=elapsed+1.45}
function ui(){
 soundscape.sync(state==='run'||state==='finish',mute);
 $('cover').hidden=state!=='menu';$('hud').hidden=state==='menu';$('pause').hidden=state!=='run';$('overlay').hidden=!['win','lost','pause'].includes(state);status()
}
function start(){doubleTime=0;settled=false;prepareRoute();state='run';lane=x=height=velocity=slide=distance=coins=completed=elapsed=toiletTime=0;ground=cameraLift=magnet=grace=0;shield=false;poseSlide=poseBank=landing=0;flecks=[];letters=[];if(marathon())resetDistricts();else items=course();$('toast').textContent='';try{soundscape.init()}catch{}ui()}
function modal(label,title,details,button){$('label').textContent=label;$('heading').textContent=title;$('result').textContent=details;$('action').textContent=button;$('toast').textContent='';ui()}
function end(won,cause){
 if(settled)return;settled=true;profile.wallet+=coins;
 if(marathon())profile.meters=Math.max(profile.meters,Math.floor(distance));
 if(won&&level===0)profile.first=true;if(won&&level===1)profile.second=true;saveProfile();
 state=won?'win':'lost';best=Math.max(best,score());try{localStorage.wcDashBest=String(best)}catch{}

 soundscape.effect(won?'win':'hit');modal(won?'ФИНИШ · WC':'ЗАБЕГ ОКОНЧЕН',won?'Успел!':cause||'Не добежал!',Math.floor(distance)+' м · 💩 '+coins+' · Слов '+completed+(marathon()?'':'/3')+' · '+score()+' очк. · Кошелёк '+profile.wallet+' 💩',won&&level===0?'На второй уровень →':'Ещё раз →')}
function pause(){if(state!=='run')return;state='pause';modal('ПЕРЕРЫВ','Пауза',(marathon()?'Пройдено '+Math.floor(distance):'До унитаза ещё '+Math.ceil(length-distance))+' м.','Продолжить →')}
function move(action){
 if(state!=='run')return;
 if(action==='left'||action==='right'){lane=clamp(lane+(action==='left'?-1:1),-1,1);return}
 if(action==='up'&&grounded()){slide=0;velocity=6.9;soundscape.effect('jump')}
 if(action==='down'){soundscape.effect('slide');slide=.80;if(!grounded())velocity=-12}
}
function tick(dt){
 elapsed+=dt;
 if(state==='finish'){toiletTime+=dt;x=finishFrom*(1-ease(toiletTime/1.08));if(toiletTime>=4.05)end(true);return}
 if(marathon())extendDistricts();
 distance=Math.min(length,distance+dt*speed());x+=(lane*2.2-x)*(1-Math.exp(-15*dt));slide=Math.max(0,slide-dt);
 doubleTime=Math.max(0,doubleTime-dt);magnet=Math.max(0,magnet-dt);grace=Math.max(0,grace-dt);
 const wasGrounded=grounded()&&velocity<=0;let support=0;
 for(const train of trains){const top=roofAt(train,distance);
  if(top<=0||Math.abs(x-train.a)>1.0)continue;
  if(top>height+.20&&!absorbHit())return;
  support=Math.max(support,top)
 }
 if(wasGrounded&&Math.abs(ground-support)<.22)height=support;
 ground=support;cameraLift+=(ground-cameraLift)*(1-Math.exp(-5*dt));
 poseBank+=(clamp((lane*2.2-x)*1.6,-1,1)-poseBank)*(1-Math.exp(-12*dt));
 poseSlide+=((slide>0&&grounded()?1:0)-poseSlide)*(1-Math.exp(-18*dt));
 landing*=Math.exp(-11*dt);
 const wasAirborne=!grounded();
 velocity-=17*dt;height=Math.max(ground,height+velocity*dt);if(grounded()&&velocity<0)velocity=0;
 if(wasAirborne&&grounded()){landing=1;scatter(x,ground+.12,distance,'dcd9b3')}
 if(grounded()&&!slide)soundscape.effect('step');
 if(!updateFlows(dt))return;
 if(elapsed>noticeUntil)$('toast').textContent='';
 while(firstNearby<items.length&&items[firstNearby].z<distance-2.3)firstNearby++;
 for(let i=firstNearby;i<items.length&&items[i].z<=distance+2.3;i++){
  const it=items[i];if(it.done)continue;
  const dz=it.z-distance,dx=Math.abs(it.a-x),pull=it.type==='poo'&&magnet>0;
  if(Math.abs(dz)>(pull?2.2:.57)||dx>(pull?4.7:.86))continue;
  if(it.type==='poo'){
   if(!pull&&Math.abs(height+(slide>0?.38:.70)-it.y)>.76)continue;
   coins+=doubleTime>0?2:1;scatter(it.a,it.y,it.z,'ffcb55');soundscape.effect('coin')
  }else if(it.type==='magnet'||it.type==='shield'||it.type==='double'){
   if(Math.abs(height-it.y)>1.5)continue;
   if(it.type==='double'){doubleTime=5+profile.double*2;notice('Монеты ×2')}else if(it.type==='magnet'){magnet=6+2*profile.magnet;notice('Магнит · '+magnet+' с')}else{shield=true;notice('Щит · защита от удара')}
   soundscape.effect('power');scatter(it.a,it.y+1,it.z,'70e1e5')
  }else if(it.type==='letter'){
   if(!activeWord()||Math.abs(height-it.y)>1.5)continue;
   letters.push(activeWord()[collected()]);scatter(it.a,it.y+1.16,it.z,'bcf5a8');soundscape.effect('letter');
   if(collected()===activeWord().length){
    soundscape.effect('word');notice(activeWord()+'! +100');completed++;letters=[];
    if(!activeWord())for(const tile of items)if(tile.type==='letter')tile.done=true
   }
  }else if(it.type==='crate'?height<.83:slide<=0||height>.12){if(!absorbHit())return}
  it.done=true
 }
 if(distance===length){height=slide=ground=cameraLift=0;finishFrom=x;poseSlide=poseBank=landing=0;state='finish';$('toast').textContent='';ui()}
}
let prev=0;
function frame(ms){const dt=Math.min(.07,(ms-(prev||ms))/1000);prev=ms;clock+=dt;
 if(state==='run'||state==='finish'){let rest=dt;while(rest>0&&(state==='run'||state==='finish')){const step=Math.min(rest,1/120);tick(step);rest-=step}status()}
 render3D();requestAnimationFrame(frame)}
$('start').onclick=start;$('action').onclick=()=>{if(state==='pause'){state='run';ui()}else {if(state==='win'&&level===0)chooseRoute(1);start()}};$('pause').onclick=pause;$('home').onclick=()=>{state='menu';height=slide=0;ui()};
$('mute').onclick=()=>{mute=!mute;try{soundscape.init()}catch{}soundscape.sync(state==='run'||state==='finish',mute);try{localStorage.wcDashMuted=mute?'yes':'no'}catch{}status()};
const keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',Space:'up',ArrowDown:'down',KeyA:'left',KeyD:'right',KeyW:'up',KeyS:'down'};
addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='Escape'){if(state==='pause')$('action').click();else pause();return}
 if(state==='run'&&keys[e.code]){e.preventDefault();move(keys[e.code])}});
let pointer=null;
canvas.addEventListener('pointerdown',e=>{if(state!=='run'||pointer)return;canvas.setPointerCapture(e.pointerId);pointer={id:e.pointerId,x:e.clientX,y:e.clientY}});
function swipe(e){if(!pointer||e.pointerId!==pointer.id)return;
 const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.max(Math.abs(dx),Math.abs(dy))<17)return;
 move(Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down');pointer=null}
canvas.addEventListener('pointermove',swipe);canvas.addEventListener('pointerup',e=>{swipe(e);pointer=null});canvas.addEventListener('lostpointercapture',()=>pointer=null);
addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
$('hint').textContent=navigator.maxTouchPoints?'Свайпай по экрану':'Стрелки или WASD';
if(navigator.maxTouchPoints)document.querySelector('footer').prepend(document.createTextNode('Свайпы'));
$('shopBtn').onclick=showShop;
document.querySelectorAll('[data-route]').forEach((b,i)=>b.onclick=()=>chooseRoute(i));chooseRoute(0);
ui();requestAnimationFrame(frame);
