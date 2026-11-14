// Eight-bar instrumental: warm electric keys, bass and brushed percussion.
// Schedule on the audio clock so note timing is independent of frame rate.
const soundscape=(()=>{
 let ctx,master,music,fx,noise,step=0,nextBeat=0,timer=null,walkingAt=0,running=false;
 const chords=[[50,57,60,65],[43,55,59,64],[48,55,59,64],[45,55,60,64]];
 const tune=[[69,67,64],[71,69,67],[67,64,62],[64,60,62],[69,72,76],[74,71,69],[67,71,69],[67,64,62]];
 function init(){
  if(!ctx){
   ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();music=ctx.createGain();fx=ctx.createGain();
   master.gain.value=.65;music.gain.value=.56;fx.gain.value=.50;music.connect(master);fx.connect(master);master.connect(ctx.destination);
   noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.45),ctx.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  }
  ctx.resume().catch(()=>{})
 }
 function note(bus,at,freq,dur,amp,type='sine',end=freq,attack=.014){
  const osc=ctx.createOscillator(),env=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,at);osc.frequency.exponentialRampToValueAtTime(end,at+dur);
  env.gain.setValueAtTime(.00001,at);env.gain.exponentialRampToValueAtTime(amp,at+attack);env.gain.exponentialRampToValueAtTime(.00001,at+dur);
  osc.connect(env).connect(bus);osc.start(at);osc.stop(at+dur+.02);
 }
 function brush(bus,at,dur,amp,cut,hp=false){
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),env=ctx.createGain();src.buffer=noise;src.loop=true;
  filter.type=hp?'highpass':'lowpass';filter.frequency.value=cut;
  env.gain.setValueAtTime(.00001,at);env.gain.linearRampToValueAtTime(amp,at+.012);env.gain.exponentialRampToValueAtTime(.00001,at+dur);
  src.connect(filter).connect(env).connect(bus);src.start(at);src.stop(at+dur+.01)
 }
 const hz=n=>440*2**((n-69)/12);
 function schedule(){
  if(!running||ctx.state!=='running')return;const beat=60/84;
  if(nextBeat<ctx.currentTime)nextBeat=ctx.currentTime+.02;
  while(nextBeat<ctx.currentTime+.16){
   const i=step%8,bar=Math.floor(step/8)%8,ch=chords[bar%4],t=nextBeat;
   if(i===0||i===5)note(music,t,hz(ch[0]-(i===0?12:0)),.76,.27);
   if(i===0||i===4)ch.slice(1).forEach((n,j)=>note(music,t+j*.023,hz(n),1.45,.085,'sine',hz(n),.064));
   const k=[1,4,7].indexOf(i);if(k>=0){const f=hz(tune[bar][k]);note(music,t,f,.89,.11);note(music,t+.17,2*f,.46,.018)}
   if(i%4===0)note(music,t,97,.16,.10,'sine',43);
   if(i===2||i===6)brush(music,t,.11,.048,1700);if(i%2)brush(music,t+.024,.054,.020,4600,true);
   step=(step+1)%64;nextBeat+=beat/2;
  }
 }
 function sync(playing,muted){
  if(!ctx)return;master.gain.setTargetAtTime(muted?0:.65,ctx.currentTime,.016);
  const on=playing&&!muted;if(on===running)return;running=on;
  music.gain.setTargetAtTime(on?.56:0,ctx.currentTime,.04);
  if(on){nextBeat=ctx.currentTime+.025;walkingAt=ctx.currentTime+.25;schedule();timer=setInterval(schedule,60)}
  else {clearInterval(timer);timer=null}
 }
 function effect(name){
  if(!ctx||mute||ctx.state!=='running')return;const t=ctx.currentTime;
  switch(name){
   case 'step':if(t<walkingAt)return;walkingAt=t+.31;brush(fx,t,.066,.042,670);break;
   case 'jump':note(fx,t,180,.18,.12,'sine',390);break;
   case 'slide':brush(fx,t,.28,.11,1400,true);break;
   case 'coin':note(fx,t,680,.13,.10);note(fx,t+.055,1020,.16,.058);break;
   case 'letter':note(fx,t,523,.17,.09,'triangle');note(fx,t+.08,659,.17,.07);break;
   case 'word':case 'win':[0,4,7,12].forEach((n,i)=>note(fx,t+.085*i,hz(60+n),.36,.14));if(name==='win')brush(fx,t+.34,.55,.065,1500);break;
   case 'hit':note(fx,t,130,.22,.23,'triangle',48);brush(fx,t,.12,.11,860);break;
  }
 }
 return {init,sync,effect};
})();
