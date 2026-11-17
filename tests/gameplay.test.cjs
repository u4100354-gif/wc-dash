const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {webcrypto}=require('node:crypto');
function game(saved={}){
 const nodes=new Map();
 function node(){return {hidden:false,disabled:false,dataset:{},style:{setProperty(){}},textContent:'',innerHTML:'',addEventListener(){},setAttribute(){},append(){},prepend(){},replaceChildren(){},focus(){},showModal(){this.open=true},setPointerCapture(){}};}
 const storage=new Map(Object.entries(saved));
 const ctx=vm.createContext({console,crypto:webcrypto,Math,navigator:{maxTouchPoints:0},performance:{now:()=>0},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  document:{hidden:false,getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},querySelector:()=>node(),querySelectorAll:s=>s==='[data-route]'?[node(),node(),node()]:[],addEventListener(){},createElement:()=>node()},
  soundscape:{sync(){},effect(){},init(){},wake(){},getVolumes:()=>({music:.7,fx:.8})},
  createWorld:()=>()=>{},requestAnimationFrame(){},addEventListener(){}});
 for(const file of ['inspector','showcase','routes','presentation','ride-motion','trains','endless','shop','game'])if(fs.existsSync(file+'.js'))vm.runInContext(fs.readFileSync(file+'.js','utf8'),ctx,{filename:file+'.js'});
 return {run:code=>vm.runInContext(code,ctx),storage};
}
test('sewer sections restore three rideable flow types in the playable route',()=>{
 const {run}=game();run('start()');
 assert.ok(run('flows.length')>=6,'sewer encounters must exist');
 assert.ok(run('new Set(flows.map(f=>f.kind)).size')>=3);
});

test('cat mounts smoothly, ducks under a crossbar without consuming its shield, and jump interrupts the duck',()=>{
 const {run}=game();run('start();items=[];trains=[];flows=[];profile.cats=1;activateCat();tick(1/120)');
 assert.ok(run('catMount')>0&&run('catMount')<.2);
 run('for(let i=0;i<60;i++)tick(1/120);items=[{type:"hurdle",a:0,z:distance+3,y:0}];move("down");for(let i=0;i<45;i++)tick(1/120)');
 assert.equal(run('state'),'run');assert.ok(run('catTime')>20,'crossbar must not consume the cat');assert.ok(run('catMount')>.99);
 run('move("up");tick(1/120)');assert.ok(run('velocity')>0);assert.equal(run('rollAge'),-1);
});

test('cat expiry blends out and development freeze preserves mounting and recoil clocks',()=>{
 const {run}=game();run('start();items=[];trains=[];flows=[];catTime=10;tick(1/120);catReaction=.6;toggleInspection()');
 const before=run('[catMount,catReaction,runCycle].join(",")');run('frame(1000);frame(2000)');assert.equal(run('[catMount,catReaction,runCycle].join(",")'),before);
 run('toggleInspection();for(let i=0;i<80;i++)tick(1/120);catTime=0;tick(1/120)');assert.ok(run('catMount')>0&&run('catMount')<1);
 run('for(let i=0;i<80;i++)tick(1/120)');assert.equal(run('catMount'),0);
});

test('finish actually jumps onto the toilet before settling into the seat',()=>{
 const {run}=game();run('start();state="finish";toiletTime=.85;tick(1/120)');
 assert.ok(run('height')>.35,'feet must leave the ground during the finish jump');
 run('toiletTime=1.8;tick(1/120)');assert.ok(run('height')<.01,'finish jump lands');
});

test('five finite levels and the separate marathon remain selectable',()=>{
 const {run}=game();assert.equal(run('routes.filter(r=>Number.isFinite(r.meters)).length'),5);
 for(let i=0;i<5;i++){
  run(`chooseRoute(${i});start()`);assert.equal(run('marathon()'),false);
  assert.ok(run('items.length')>100);assert.ok(run('trains.some(c=>c.incomingSpeed>0)'));
 }
 run('chooseRoute(5);start()');assert.equal(run('marathon()'),true);assert.equal(run('length'),Infinity);
});

test('wings reach above the old tunnel crown and return to ground',()=>{
 const {run}=game();run('start();trains=[];flows=[];items=[];beginFlight();distance=flight.start+35;advanceFlight(0)');
 assert.ok(run('height')>=10,'KFC should fly higher than the 9.1 m tunnel');
 run('distance=flight.end;advanceFlight(0)');assert.equal(run('flight'),null);assert.equal(run('height'),0);
});

test('each new destination can finish through its escape lanes without protection or revives',()=>{
 for(let index=1;index<5;index++){
  const {run}=game();run(`chooseRoute(${index});start()`);
  run(`for(let frame=0;frame<18000&&(state==='run'||state==='finish');frame++){
   if(state==='run'){
    const safe=[0,1,-1][(Math.floor(distance/180)+level)%3];
    if(lane!==safe)move(lane<safe?'right':'left');
   }
   tick(1/120);
  }`);
  assert.equal(run('state'),'win',`destination ${index+1} at ${run('distance')}m`);
  assert.equal(run('flowHits'),0);assert.equal(run('revived'),false);
  assert.ok(run(`profile.completedLevels.includes(${index})`));
 }
});

test('legacy progress migrates and wins advance to the next finite destination',()=>{
 const {run}=game({wcDashProgress5:JSON.stringify({first:true,second:true,wallet:91})});
 assert.equal(run('profile.completedLevels.join(",")'),'0,1');
 run('chooseRoute(3);start();distance=length;end(true);$("action").onclick()');assert.equal(run('level'),4);assert.equal(run('state'),'run');
 run('distance=length;end(true);$("action").onclick()');assert.equal(run('level'),4,'last destination replays instead of entering marathon');
});
test('first flow hit dirties and slows the runner; a second distinct hit ends the run',()=>{
 const {run}=game();run('start();trains=[];items=[];flows=[{a:0,front:-.1,size:8,trigger:0,passed:false,kind:"sludge",top:1.48}];tick(1/120)');
 assert.equal(run('state'),'run');assert.equal(run('flowHits'),1);assert.ok(run('speed()<speedAt(distance)'));
 run('grace=0;flows.push({a:0,front:distance-.1,size:8,trigger:0,passed:false,kind:"surge",top:1.8});tick(1/120)');
 assert.equal(run('state'),'lost');
});
test('each approaching flow spawns entirely within its own sewer section',()=>{
 const {run}=game();run('start()');
 assert.ok(run(`flows.every(f=>{const section=buildShowcaseRoute().sewers.find(s=>f.target>=s.start&&f.target<=s.end);const front=f.trigger+f.frontOffset;return section&&front>=section.start&&front+f.size<=section.end})`));
});
test('landing on a flow supports the feet without counting as a frontal hit',()=>{
 const {run}=game();run('start();trains=[];items=[];flows=[{a:0,front:0,size:12,trigger:0,passed:false,kind:"surge",top:1.8}];height=1.9;velocity=-2;for(let i=0;i<8;i++)tick(1/120)');
 assert.equal(run('state'),'run');assert.equal(run('flowHits'),0);assert.ok(Math.abs(run('height')-1.8)<.02);
});
test('development freeze preserves HUD/game state and steps exactly one 60 Hz frame',()=>{
 const {run}=game();run('start()');
 assert.equal(run('typeof toggleInspection'),'function');
 run('toggleInspection();frame(1000);frame(2000)');
 assert.equal(run('state'),'run');assert.equal(run('distance'),0);assert.equal(run('elapsed'),0);
 run('devClock.requestStep();frame(3000)');assert.ok(Math.abs(run('elapsed')-1/60)<1e-9);
 const d=run('distance');run('frame(4000)');assert.equal(run('distance'),d);
 run('toggleInspection();frame(4016)');assert.ok(run('distance')>d);
});
test('jump interrupts a roll immediately, without an animation lock',()=>{
 const {run}=game();run('start();move("down");for(let i=0;i<20;i++)tick(1/120);move("up");tick(1/120)');
 assert.ok(run('height')>0);assert.ok(run('velocity')>0);assert.equal(run('rollAge'),-1);
});
test('striped low crossbar allows forward rolling underneath',()=>{
 const {run}=game();run('start();trains=[];flows=[];items=[{type:"hurdle",a:0,z:3,y:0}];move("down");for(let i=0;i<45&&state==="run";i++)tick(1/120)');
 assert.equal(run('state'),'run');assert.ok(run('distance')>3.6);
 assert.ok(run('hurdleBottom-slideHeight')>=.06,'rendered opening must clear the full roll');
});
test('striped crossbar still collides when standing and can be jumped over',()=>{
 const standing=game();standing.run('start();trains=[];flows=[];items=[{type:"hurdle",a:0,z:3,y:0}];for(let i=0;i<45&&state==="run";i++)tick(1/120)');assert.equal(standing.run('state'),'lost');
 const jumping=game();jumping.run('start();trains=[];flows=[];items=[{type:"hurdle",a:0,z:6.5,y:0}];move("up");for(let i=0;i<75&&state==="run";i++)tick(1/120)');assert.equal(jumping.run('state'),'run');assert.ok(jumping.run('distance')>7);
});
test('ordinary down rolls forward; changing lanes during a slide selects a side roll',()=>{
 const {run}=game();run('start();move("down")');assert.equal(run('rollLateral'),0);
 run('move("right")');assert.equal(run('rollLateral'),1);
 run('move("left")');assert.equal(run('rollLateral'),-1);
 run('move("down")');assert.equal(run('rollLateral'),0);
});
test('coins riding a flow are collected from its roof once',()=>{
 const {run}=game();run('start();trains=[];items=[];flows=[{a:0,front:0,size:12,top:1.8,trigger:0,tokens:[{offset:.25,done:false}]}];height=1.8;velocity=0;tick(1/120);tick(1/120)');
 assert.equal(run('coins'),1);assert.equal(run('flowHits'),0);
});
test('upgraded active boots collect coins and keys passed underneath a jump',()=>{
 const {run}=game();run('start();trains=[];flows=[];profile.boots=1;bootsTime=5;height=3.2;velocity=1;items=[{type:"poo",a:0,z:.5,y:.65},{type:"key",a:0,z:.6,y:0}];tick(1/120)');
 assert.equal(run('coins'),1);assert.equal(run('runKeys'),1);
});
test('active boots collect under a high jump even without a purchased duration upgrade',()=>{
 const {run}=game();run('start();trains=[];flows=[];profile.boots=0;bootsTime=5;height=4.2;velocity=1;items=[{type:"poo",a:0,z:.5,y:2.55}];tick(1/120)');assert.equal(run('coins'),1);
});
test('boot jump attraction lasts until landing when the timer expires in midair',()=>{
 const {run}=game();run('start();trains=[];flows=[];items=[];bootsTime=.02;move("up");for(let i=0;i<40;i++)tick(1/120);items=[{type:"poo",a:0,z:distance+.1,y:.65}];tick(1/120)');
 assert.equal(run('bootsTime'),0);assert.equal(run('coins'),1);assert.equal(run('bootJumpActive'),true);
 run('for(let i=0;i<180;i++)tick(1/120)');assert.equal(run('bootJumpActive'),false);
});
test('boots do not vacuum other lanes or work without an active bonus',()=>{
 const {run}=game();run('start();trains=[];flows=[];profile.boots=0;bootsTime=0;height=3;velocity=1;items=[{type:"poo",a:0,z:.5,y:.65}];tick(1/120)');assert.equal(run('coins'),0);
 run('profile.boots=2;items=[{type:"poo",a:2.2,z:distance+.5,y:.65}];tick(1/120)');assert.equal(run('coins'),0);
});
test('player can jump from one moving train roof to the next across a six metre gap',()=>{
 const {run}=game();run('start();items=[];flows=[];trains=[{a:0,z:0,entry:0,exit:0,deck:18,kind:"metro",trigger:0,incomingSpeed:8},{a:0,z:24,entry:0,exit:0,deck:18,kind:"metro",trigger:0,incomingSpeed:8}];distance=4;height=ground=1.9;let leaped=false;for(let i=0;i<180&&state==="run";i++){if(!leaped&&trainEnd(trains[0])-distance<8){move("up");leaped=true}tick(1/120)}');
 assert.equal(run('state'),'run');assert.ok(run('distance>trainEnd(trains[0])'));assert.ok(Math.abs(run('height')-1.9)<.02);
});
test('new route is wired into the playable first level',()=>{
 const {run}=game();run('start()');
 assert.equal(run('length'),720);assert.equal(run('new Set(trains.map(t=>t.kind)).size'),3);
 assert.equal(run('items.filter(it=>isBarrier(it.type)).length'),15);
});
test('real physics supports jump and airborne down-to-slide transition',()=>{
 const {run}=game();run('start();move("up");for(let i=0;i<32;i++)tick(1/120)');
 assert.ok(run('height')>1);
 run('move("down");for(let i=0;i<30;i++)tick(1/120)');
 assert.ok(run('grounded()'));assert.ok(run('slide')>0);assert.equal(run('state'),'run');
});
test('a frontal encounter with an incoming train causes a real collision',()=>{
 const {run}=game();run('start();items=[];trains=[{a:0,z:3,entry:0,exit:0,deck:20,kind:"express",incomingSpeed:8,trigger:0}];for(let i=0;i<80&&state==="run";i++)tick(1/120)');
 assert.equal(run('state'),'lost');
});
test('showcase can be completed with jumps and without invulnerability or revives',()=>{
 const {run}=game();
 const result=run(`start();
 const steering=[[0,1],[55,0],[132,-1],[311,1],[325,0],[355,1],[485,0],[650,-1]];
 let next=0,steps=0,jumped=false,jump2=false,jump3=false;
 while((state==='run'||state==='finish')&&steps++<8000){
  if(next<steering.length&&distance>=steering[next][0]){lane=steering[next][1];next++}
  if(!jumped&&distance>=155){move('up');jumped=true;} if(!jump2&&distance>=296){move('up');jump2=true;} if(!jump3&&distance>=310&&grounded()){move('up');jump3=true;}
  tick(1/120);
 }
 ({state,distance,elapsed,revived,lane,x,flowHits,cause:$('heading').textContent,stumbleCooldown,profileFirst:profile.first});`);
 assert.equal(result.state,'win',JSON.stringify(result));assert.equal(result.distance,720);
 assert.equal(result.revived,false);assert.equal(result.profileFirst,true);
 assert.ok(result.elapsed>=43&&result.elapsed<50);
});
test('existing wallet, skin selection and purchased cats survive starting a new run',()=>{
 const saved={wallet:345,cats:3,keys:7,skins:[0,4],skin:4,boots:2,magnet:1};
 const {run,storage}=game({wcDashProgress5:JSON.stringify(saved)});run('start();activateCat()');
 assert.equal(run('profile.wallet'),345);assert.equal(run('profile.skin'),4);
 assert.equal(run('profile.cats'),2);assert.ok(run('catTime')>0);
 assert.equal(JSON.parse(storage.get('wcDashProgress5')).skin,4);
});
