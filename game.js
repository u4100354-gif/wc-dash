'use strict';
const $=id=>document.getElementById(id), canvas=$('screen'), g=canvas.getContext('2d');
const length=360, words=['ЛИФТ','МАРС','УСПЕЛ'], clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
let best=0,mute=false;
try{best=Number(localStorage.wcDashBest)||0;mute=localStorage.wcDashMuted==='yes'}catch{}
let state='menu',distance=0,lane=0,x=0,height=0,velocity=0,slide=0,coins=0,completed=0,letters=[],items=[],stamp=0,noticeUntil=0,clock=0,elapsed=0,toiletTime=0;
let w,h,center,horizon,unit,ac;
function size(){w=canvas.clientWidth;h=canvas.clientHeight;let ratio=Math.min(1.8,devicePixelRatio||1);canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);g.setTransform(canvas.width/w,0,0,canvas.height/h,0,0)}
new ResizeObserver(size).observe(canvas);size();
function rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h)}
function poly(points,c){g.fillStyle=c;g.beginPath();points.forEach(([a,b],i)=>i?g.lineTo(a,b):g.moveTo(a,b));g.closePath();g.fill()}
function oval(x,y,rx,ry,c){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill()}
function text(s,x,y,size,c){g.fillStyle=c;g.font='900 '+size+'px ui-monospace,monospace';g.textAlign='center';g.fillText(s,x,y)}
// Perspective floor and wall planes share a vanishing point at the corridor exit.
function project(a,b,z){const k=unit/(z+6);return [center+a*k,horizon+(2.65-b)*k,k]}
function plane(points,c){poly(points.map(p=>project(...p)),c)}
function wall(side,z,z2,low,high,c){plane([[side*4.1,low,z],[side*4.1,low,z2],[side*4.1,high,z2],[side*4.1,high,z]],c)}
function floor(z,z2,left,right,c){plane([[left,0,z],[right,0,z],[right,0,z2],[left,0,z2]],c)}
function scenery(d){
 const menu=state==='menu';center=w*(menu&&w>680?.70:.5);horizon=h*(menu&&w<680?.55:.37);
 unit=Math.min((h*(menu&&w<680?.29:.49))*6/2.65,w*(w<680?.94:.78));
 rect(0,0,w,h,'#b4d3c2');rect(0,horizon,w,h,'#adc6af');
 const base=Math.floor(d/3);
 for(let i=base+32;i>=base-1;i--){
  const z=i*3-d,z2=z+3;if(z2< -2)continue;const near=Math.max(-2.7,z);
  floor(near,z2,-4.1,4.1,i%2?'#acc3ab':'#bed0b7');
  floor(near,near+.035,-4.1,4.1,'#758f84');
  for(let a of [-1.1,1.1])floor(near,z2,a-.027,a+.027,'#759388');
  for(const side of [-1,1]){
   wall(side,near,z2,0,7,'#e0ddc2');wall(side,near,z2,0,1.4,i%2?'#629b8e':'#6da596');
   wall(side,near,z2,1.32,1.42,'#34695f');wall(side,near,z2,0,.14,'#46776e');
   wall(side,near,z2,2.8,2.86,'#c7c7ad');wall(side,near,near+.035,0,7,'#9bad9d');
   if((i+(side<0?1:0))%4===0){wall(side,near+.2,z2-.2,.15,2.75,'#315c5a');wall(side,near+.36,z2-.34,.20,2.58,'#809d91');wall(side,near+.49,near+.58,.97,1.16,'#f4cc74')}
  }
  if(i%3===0){plane([[-1,5.2,near],[1,5.2,near],[1,5.2,z2],[-1,5.2,z2]],'#faffde')}
 }
}
function toilet(){
 const porcelain='#faf3d7',shade='#abc8b9',ink='#285457';
 rect(-.76,-2.32,1.52,.91,ink);rect(-.68,-2.22,1.36,.74,porcelain);rect(-.63,-2.35,1.26,.13,'#fffce9');
 rect(.29,-2.10,.24,.08,'#799d91');poly([[-.34,-.83],[.35,-.83],[.25,-.28],[.45,-.14],[.45,-.04],[-.46,-.04],[-.46,-.15],[-.25,-.32]],shade);
 poly([[-.9,-1.27],[.91,-1.27],[.72,-.83],[.42,-.62],[-.42,-.62],[-.72,-.87]],porcelain);
 oval(0,-1.27,.93,.34,ink);oval(0,-1.32,.90,.31,porcelain);oval(0,-1.33,.66,.18,'#78b6ad');oval(0,-1.30,.48,.10,'#b9e5d3');
 rect(-.50,-3.08,1,.40,'#216955');text('WC',0,-2.78,.31,'#edffcf')
}
function poo(t){g.save();g.translate(0,Math.sin(t*4)*.055);oval(0,-.54,.44,.34,'#eab759');oval(0,-.53,.37,.29,'#a75531');oval(0,-.44,.34,.16,'#78432c');oval(.01,-.60,.26,.15,'#975230');oval(.025,-.73,.15,.11,'#b76a38');poly([[-.10,-.75],[.10,-.77],[.065,-.92]],'#b76a38');for(let i of [-1,1])oval(i*.12,-.54,.037,.048,'#fff5d2');g.restore()}
function runner(t){
 const duck=slide>0&&height===0,k=duck?.53:1;
 g.save();g.scale(1,k);const stride=Math.sin(t*12)*(height?.22:1);
 for(const s of [-1,1]){let foot=s*stride;rect(s*.22-.105,-.74,.22,.52+foot*.12,'#284653');rect(s*.22-.14,-.27+foot*.12,.29,.21,'#352f2a')}
 rect(-.39,-1.42,.78,.81,'#bc5131');rect(-.32,-1.43,.64,.68,'#ed8050');rect(-.34,-.85,.68,.11,'#e9a06a');
 for(const s of [-1,1]){rect(s*.44-.095,-1.36+stride*s*.1,.19,.47,'#c95e38');rect(s*.44-.08,-.93+stride*s*.1,.16,.16,'#efd09c')}
 rect(-.21,-1.64,.42,.23,'#774c38');rect(-.28,-1.94,.56,.42,'#915b41');rect(-.34,-2.02,.68,.21,'#23564b');rect(-.28,-2.17,.56,.22,'#478b69');rect(-.13,-2.26,.26,.12,'#81b783');g.restore()
}
function obstacle(type){if(type==='crate'){
 rect(-.72,-.86,1.44,.85,'#83502f');rect(-.66,-.80,1.32,.72,'#be8b52');rect(-.12,-.8,.24,.74,'#e6bd80');rect(-.59,-.23,.28,.10,'#774b37');
 }else{for(let s of [-1,1])rect(s*.93-.07,-1.95,.14,1.94,'#4c5d56');rect(-1.02,-2.05,2.04,.67,'#d99741');for(let j=-.9;j<.9;j+=.48)poly([[j,-2],[j+.22,-2],[j+.49,-1.44],[j+.27,-1.44]],'#534d36')}}
function sprite(type,a,z,t,ch){
 const [px,py,k]=project(a,0,z);if(k<=0)return;
 g.save();g.translate(px,py);g.scale(k,k);oval(0,0,type==='toilet'?1:.47,type==='toilet'?.18:.12,'#254e482a');
 if(type==='toilet')toilet();else if(type==='runner'){g.translate(0,-height);runner(t)}
 else if(type==='poo')poo(t);else if(type==='letter'){const bob=Math.sin(t*3)*.055;g.translate(0,bob);poly([[0,-1.55],[.46,-1.03],[0,-.52],[-.46,-1.03]],'#2d6c5c');poly([[0,-1.47],[.39,-1.03],[0,-.59],[-.39,-1.03]],'#ceef97');text(ch,0,-.89,.46,'#234c3e')}
 else obstacle(type);g.restore()
}
function draw(){
 const menu=state==='menu',d=menu?0:distance;scenery(d);
 const scene=menu?[{type:'toilet',z:w<680?3:3.8,a:1.0},{type:'poo',z:1,a:-1.0},{type:'poo',z:5,a:-1.1}]:items.filter(it=>!it.done&&(it.type!=='letter'||completed<words.length)&&it.z-d> -1.9&&it.z-d<85);
 const objects=scene.map(o=>({type:o.type,a:o.a,z:o.z-d,ch:letterFor(o)}));
 if(!menu&&length-d<86)objects.push({type:'toilet',a:0,z:length-d});
 objects.push({type:'runner',a:menu?-.65:x,z:menu?-.75:(state==='finish'?Math.min(.45,toiletTime*.7):0)});
 objects.sort((a,b)=>b.z-a.z);for(const o of objects)if(o.type!=='letter'||o.ch)sprite(o.type,o.a,o.z,menu?clock:elapsed,o.ch)
}
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
function beep(freq,dur=.1){
 if(!ac||mute)return;const osc=ac.createOscillator(),gain=ac.createGain(),now=ac.currentTime;osc.type='sine';osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(freq*.8,now+dur);gain.gain.setValueAtTime(.037,now);gain.gain.exponentialRampToValueAtTime(.0001,now+dur);osc.connect(gain).connect(ac.destination);osc.start(now);osc.stop(now+dur)
}
function audioOn(){try{ac??=new AudioContext();ac.resume().catch(()=>{})}catch{}}
function ui(){
 $('cover').hidden=state!=='menu';$('hud').hidden=state==='menu';$('pause').hidden=state!=='run';$('overlay').hidden=!['win','lost','pause'].includes(state);status()
}
function start(){state='run';lane=x=height=velocity=slide=distance=coins=completed=elapsed=toiletTime=0;letters=[];items=course();$('toast').textContent='';audioOn();ui()}
function modal(label,title,details,button){$('label').textContent=label;$('heading').textContent=title;$('result').textContent=details;$('action').textContent=button;$('toast').textContent='';ui()}
function end(won){state=won?'win':'lost';best=Math.max(best,score());try{localStorage.wcDashBest=String(best)}catch{}
 beep(won?820:140,.22);modal(won?'ФИНИШ · WC':'ЗАБЕГ ОКОНЧЕН',won?'Успел!':'Не добежал!',Math.floor(distance)+' м · 💩 '+coins+' · Слов '+completed+'/3 · '+score()+' очк.','Ещё раз →')}
function pause(){if(state!=='run')return;state='pause';modal('ПЕРЕРЫВ','Пауза','До унитаза ещё '+Math.ceil(length-distance)+' м.','Продолжить →')}
function move(action){
 if(state!=='run')return;
 if(action==='left'||action==='right'){lane=clamp(lane+(action==='left'?-1:1),-1,1);return}
 if(action==='up'&&height===0){slide=0;velocity=6.9;beep(240,.08)}
 if(action==='down'){slide=.80;if(height>0)velocity=-10}
}
function tick(dt){
 elapsed+=dt;
 if(state==='finish'){toiletTime+=dt;x*=Math.exp(-8*dt);if(toiletTime>=.7)end(true);return}
 distance=Math.min(length,distance+dt*(9+4*distance/length));x+=(lane*2.2-x)*(1-Math.exp(-15*dt));slide=Math.max(0,slide-dt);
 velocity-=17*dt;height=Math.max(0,height+velocity*dt);if(!height&&velocity<0)velocity=0;
 if(elapsed>noticeUntil)$('toast').textContent='';
 for(const it of items){
  if(it.done||Math.abs(it.z-distance)>.46||Math.abs(it.a-x)>.81)continue;
  if(it.type==='poo'){if(height>1.25)continue;coins++;beep(490)}
  else if(it.type==='letter'){if(completed>=words.length||height>1.5)continue;letters.push(activeWord()[collected()]);beep(650);
   if(collected()===activeWord().length){notice(activeWord()+'! +100');completed++;letters=[]}}
  else if(it.type==='crate'?height<.78:slide<=0||height>.08){end(false);return}
  it.done=true
 }
 if(distance===length){height=slide=0;state='finish';$('toast').textContent='';ui()}
}
let prev=0;
function frame(ms){const dt=Math.min(.07,(ms-(prev||ms))/1000);prev=ms;clock+=dt;
 if(state==='run'||state==='finish'){let rest=dt;while(rest>0&&(state==='run'||state==='finish')){const step=Math.min(rest,1/120);tick(step);rest-=step}status()}
 draw();requestAnimationFrame(frame)}
$('start').onclick=start;$('action').onclick=()=>{if(state==='pause'){state='run';ui()}else start()};$('pause').onclick=pause;$('home').onclick=()=>{state='menu';height=slide=0;ui()};
$('mute').onclick=()=>{mute=!mute;audioOn();try{localStorage.wcDashMuted=mute?'yes':'no'}catch{}status()};
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
