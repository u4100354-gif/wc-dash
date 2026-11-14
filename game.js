'use strict';
const $=id=>document.getElementById(id), canvas=$('screen');
const length=360, words=['ЛИФТ','МАРС','УСПЕЛ'], clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
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
const trains=[{z:64,a:2.2},{z:131,a:-2.2},{z:205,a:0},{z:279,a:2.2}];
let ground=0,cameraLift=0,magnet=0,shield=false,grace=0,finishFrom=0;
const grounded=()=>height<=ground+.015;
const speed=()=>13+8*distance/length;
function roofAt(train,z){
 const along=z-train.z;
 return roofHeight*clamp(Math.min(along,2*rampLength+roofLength-along)/rampLength,0,1)
}
function course(){
 const list=[],add=(type,z,a,y=0)=>list.push({type,z,a,y});
 // Each pattern has an optional challenge lane and two passing lanes.
 const challenges=[[22,0,'crate'],[45,-1,'bar'],[105,1,'crate'],[121,0,'bar'],[173,-1,'crate'],[191,1,'bar'],[246,0,'crate'],[264,-1,'bar'],[322,1,'crate'],[341,0,'bar']];
 for(const [z,lane,type] of challenges)add(type,z,lane*2.2);
 for(let z=5;z<351;z+=2){
  const near=challenges.find(([at])=>Math.abs(at-z)<=8);
  const train=trains.find(v=>z>=v.z-4&&z<=v.z+2*rampLength+roofLength+2);
  if(train){add('poo',z,train.a,roofAt(train,z)+.64);continue}
  if(near){const [at,l,type]=near,u=(z-at)/6;
   const y=type==='crate'?.64+1.35*Math.max(0,1-u*u):Math.abs(z-at)<4?.34:.64;
   add('poo',z,l*2.2,y);continue}
  add('poo',z,[0,0,-2.2,0,2.2,2.2][Math.floor(z/9)%6],.65)
 }
 for(let i=0,z=10;z<350;z+=15,i++){
  const train=trains.find(v=>z>=v.z&&z<=v.z+2*rampLength+roofLength);
  add('letter',z,train?train.a:[0,-2.2,2.2,0][i%4],train?roofAt(train,z):0)
 }
 for(const [type,z,a] of [['magnet',7,0],['shield',39,-2.2],['magnet',100,2.2],['shield',164,0],['magnet',238,-2.2],['shield',273,2.2]])add(type,z,a);
 return list.sort((a,b)=>a.z-b.z)
}
function absorbHit(){
 if(grace>0)return true;
 if(!shield){end(false);return false}
 shield=false;grace=1.2;scatter(x,height+1,distance,'64dfed');notice('Щит спас!');soundscape.effect('shield');return true
}
const collected=()=>letters.length;
const activeWord=()=>words[completed]||'';
function letterFor(it){
 // Preview upcoming letters in route order. Missing a tile shifts the next opportunity.

 if(it.type!=='letter')return;
 if(completed>=words.length)return '';
 let index=collected(),wordIndex=completed;
 for(const tile of items){
  if(tile===it)break;
  if(tile.type==='letter'&&!tile.done&&tile.z>=distance-.46){
   index++;if(index>=words[wordIndex].length){wordIndex++;index=0;if(wordIndex>=words.length)return ''}
  }
 }
 return words[wordIndex][index]
}
function score(){return Math.floor(distance)+coins*10+completed*100}
function status(){
 $('powers').textContent=[shield?'◇ Щит':'',magnet>0?'∩ Магнит '+Math.ceil(magnet)+' с':''].filter(Boolean).join('  ·  ');
 const section=Math.min(2,Math.floor(distance/120));
 $('section').textContent=sections[section];$('routeFill').style.transform='scaleX('+Math.min(1,distance/length)+')';
 $('distance').textContent=Math.max(0,Math.ceil(length-distance))+' м';$('count').textContent=coins;
 const word=activeWord();$('word').innerHTML=word?'<b>'+word.slice(0,collected())+'</b><i>'+word.slice(collected())+'</i>':'✓ '+words.length+'/'+words.length;
 $('best').textContent=best;$('mute').textContent=mute?'♩':'♫';$('mute').setAttribute('aria-label',mute?'Включить звук':'Выключить звук')
}
function notice(s){$('toast').textContent=s;noticeUntil=elapsed+1.45}
function ui(){
 soundscape.sync(state==='run'||state==='finish',mute);
 $('cover').hidden=state!=='menu';$('hud').hidden=state==='menu';$('pause').hidden=state!=='run';$('overlay').hidden=!['win','lost','pause'].includes(state);status()
}
function start(){state='run';lane=x=height=velocity=slide=distance=coins=completed=elapsed=toiletTime=0;ground=cameraLift=magnet=grace=0;shield=false;poseSlide=poseBank=landing=0;flecks=[];letters=[];items=course();$('toast').textContent='';try{soundscape.init()}catch{}ui()}
function modal(label,title,details,button){$('label').textContent=label;$('heading').textContent=title;$('result').textContent=details;$('action').textContent=button;$('toast').textContent='';ui()}
function end(won){state=won?'win':'lost';best=Math.max(best,score());try{localStorage.wcDashBest=String(best)}catch{}
 soundscape.effect(won?'win':'hit');modal(won?'ФИНИШ · WC':'ЗАБЕГ ОКОНЧЕН',won?'Успел!':'Не добежал!',Math.floor(distance)+' м · 💩 '+coins+' · Слов '+completed+'/3 · '+score()+' очк.','Ещё раз →')}
function pause(){if(state!=='run')return;state='pause';modal('ПЕРЕРЫВ','Пауза','До унитаза ещё '+Math.ceil(length-distance)+' м.','Продолжить →')}
function move(action){
 if(state!=='run')return;
 if(action==='left'||action==='right'){lane=clamp(lane+(action==='left'?-1:1),-1,1);return}
 if(action==='up'&&grounded()){slide=0;velocity=6.9;soundscape.effect('jump')}
 if(action==='down'){soundscape.effect('slide');slide=.80;if(!grounded())velocity=-12}
}
function tick(dt){
 elapsed+=dt;
 if(state==='finish'){toiletTime+=dt;x=finishFrom*(1-clamp(toiletTime/.85,0,1))**2;if(toiletTime>=3.25)end(true);return}
 distance=Math.min(length,distance+dt*speed());x+=(lane*2.2-x)*(1-Math.exp(-15*dt));slide=Math.max(0,slide-dt);
 magnet=Math.max(0,magnet-dt);grace=Math.max(0,grace-dt);
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
 if(elapsed>noticeUntil)$('toast').textContent='';
 for(const it of items){
  if(it.done)continue;
  const dz=it.z-distance,dx=Math.abs(it.a-x),pull=it.type==='poo'&&magnet>0;
  if(Math.abs(dz)>(pull?2.2:.57)||dx>(pull?4.7:.86))continue;
  if(it.type==='poo'){
   if(!pull&&Math.abs(height+(slide>0?.38:.70)-it.y)>.76)continue;
   coins++;scatter(it.a,it.y,it.z,'ffcb55');soundscape.effect('coin')
  }else if(it.type==='magnet'||it.type==='shield'){
   if(Math.abs(height-it.y)>1.5)continue;
   if(it.type==='magnet'){magnet=6;notice('Магнит · 6 секунд')}else{shield=true;notice('Щит · защита от удара')}
   soundscape.effect('power');scatter(it.a,it.y+1,it.z,'70e1e5')
  }else if(it.type==='letter'){
   if(completed>=words.length||Math.abs(height-it.y)>1.5)continue;
   letters.push(activeWord()[collected()]);scatter(it.a,it.y+1.16,it.z,'bcf5a8');soundscape.effect('letter');
   if(collected()===activeWord().length){
    soundscape.effect('word');notice(activeWord()+'! +100');completed++;letters=[];
    if(completed===words.length)for(const tile of items)if(tile.type==='letter')tile.done=true
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
$('start').onclick=start;$('action').onclick=()=>{if(state==='pause'){state='run';ui()}else start()};$('pause').onclick=pause;$('home').onclick=()=>{state='menu';height=slide=0;ui()};
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
ui();requestAnimationFrame(frame);
