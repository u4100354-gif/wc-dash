'use strict';
const $=id=>document.getElementById(id), canvas=$('screen');
const length=360, words=['ЛИФТ','МАРС','УСПЕЛ'], clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
let best=0,mute=false;
try{best=Number(localStorage.wcDashBest)||0;mute=localStorage.wcDashMuted==='yes'}catch{}
let state='menu',distance=0,lane=0,x=0,height=0,velocity=0,slide=0,coins=0,completed=0,letters=[],items=[],stamp=0,noticeUntil=0,clock=0,elapsed=0,toiletTime=0;
const render3D=createWorld(canvas);
function course(){
 const list=[],route=[0,-1,-1,0,1,1,0,-1,0,1,0,0],lanes=[-1,0,1];
 for(let i=0,z=11;z<length-10;i++,z+=10){
  const safe=route[i%route.length],other=lanes.filter(n=>n!==safe);
  list.push({z:z-3,a:safe*2.2,type:'poo'});
  if(i%3!==1)list.push({z,a:other[i%2]*2.2,type:i%4<2?'crate':'bar'});
  if(i%3!==2)list.push({z:z+2,a:safe*2.2,type:'letter'});
 }
 return list
}
const collected=()=>letters.length;
const activeWord=()=>words[completed]||'';
function letterFor(it){
 // Preview upcoming letters in route order. Missing a tile shifts the next opportunity.

 if(it.type!=='letter')return;
 if(completed>=words.length)return '•';
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
 $('distance').textContent=Math.max(0,Math.ceil(length-distance))+' м';$('count').textContent=coins;
 const word=activeWord();$('word').innerHTML=word?'<b>'+word.slice(0,collected())+'</b><i>'+word.slice(collected())+'</i>':'✓ '+words.length+'/'+words.length;
 $('best').textContent=best;$('mute').textContent=mute?'♩':'♫';$('mute').setAttribute('aria-label',mute?'Включить звук':'Выключить звук')
}
function notice(s){$('toast').textContent=s;noticeUntil=elapsed+1.45}
function ui(){
 soundscape.sync(state==='run'||state==='finish',mute);
 $('cover').hidden=state!=='menu';$('hud').hidden=state==='menu';$('pause').hidden=state!=='run';$('overlay').hidden=!['win','lost','pause'].includes(state);status()
}
function start(){state='run';lane=x=height=velocity=slide=distance=coins=completed=elapsed=toiletTime=0;letters=[];items=course();$('toast').textContent='';try{soundscape.init()}catch{}ui()}
function modal(label,title,details,button){$('label').textContent=label;$('heading').textContent=title;$('result').textContent=details;$('action').textContent=button;$('toast').textContent='';ui()}
function end(won){state=won?'win':'lost';best=Math.max(best,score());try{localStorage.wcDashBest=String(best)}catch{}
 soundscape.effect(won?'win':'hit');modal(won?'ФИНИШ · WC':'ЗАБЕГ ОКОНЧЕН',won?'Успел!':'Не добежал!',Math.floor(distance)+' м · 💩 '+coins+' · Слов '+completed+'/3 · '+score()+' очк.','Ещё раз →')}
function pause(){if(state!=='run')return;state='pause';modal('ПЕРЕРЫВ','Пауза','До унитаза ещё '+Math.ceil(length-distance)+' м.','Продолжить →')}
function move(action){
 if(state!=='run')return;
 if(action==='left'||action==='right'){lane=clamp(lane+(action==='left'?-1:1),-1,1);return}
 if(action==='up'&&height===0){slide=0;velocity=6.9;soundscape.effect('jump')}
 if(action==='down'){soundscape.effect('slide');slide=.80;if(height>0)velocity=-10}
}
function tick(dt){
 elapsed+=dt;
 if(state==='finish'){toiletTime+=dt;x*=Math.exp(-8*dt);if(toiletTime>=.7)end(true);return}
 distance=Math.min(length,distance+dt*(9+4*distance/length));x+=(lane*2.2-x)*(1-Math.exp(-15*dt));slide=Math.max(0,slide-dt);
 velocity-=17*dt;height=Math.max(0,height+velocity*dt);if(!height&&velocity<0)velocity=0;
 if(!height&&!slide)soundscape.effect('step');
 if(elapsed>noticeUntil)$('toast').textContent='';
 for(const it of items){
  if(it.done||Math.abs(it.z-distance)>.46||Math.abs(it.a-x)>.81)continue;
  if(it.type==='poo'){if(height>1.25)continue;coins++;soundscape.effect('coin')}
  else if(it.type==='letter'){if(completed>=words.length||height>1.5)continue;letters.push(activeWord()[collected()]);soundscape.effect('letter');
   if(collected()===activeWord().length){soundscape.effect('word');notice(activeWord()+'! +100');completed++;letters=[]}}
  else if(it.type==='crate'?height<.78:slide<=0||height>.08){end(false);return}
  it.done=true
 }
 if(distance===length){height=slide=0;state='finish';$('toast').textContent='';ui()}
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
