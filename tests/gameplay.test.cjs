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
 for(const file of ['inspector','showcase','trains','endless','shop','game'])if(fs.existsSync(file+'.js'))vm.runInContext(fs.readFileSync(file+'.js','utf8'),ctx,{filename:file+'.js'});
 return {run:code=>vm.runInContext(code,ctx),storage};
}
test('sewer sections restore three rideable flow types in the playable route',()=>{
 const {run}=game();run('start()');
 assert.ok(run('flows.length')>=6,'sewer encounters must exist');
 assert.ok(run('new Set(flows.map(f=>f.kind)).size')>=3);
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
test('coins riding a flow are collected from its roof once',()=>{
 const {run}=game();run('start();trains=[];items=[];flows=[{a:0,front:0,size:12,top:1.8,trigger:0,tokens:[{offset:.25,done:false}]}];height=1.8;velocity=0;tick(1/120);tick(1/120)');
 assert.equal(run('coins'),1);assert.equal(run('flowHits'),0);
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
test('showcase can be completed on the ground without invulnerability or revives',()=>{
 const {run}=game();
 const result=run(`start();
 const steering=[[0,1],[55,0],[132,-1],[148,0],[173,-1],[280,0],[294,1],[319,0],[355,1],[474,0],[650,-1]];
 let next=0,steps=0;
 while((state==='run'||state==='finish')&&steps++<8000){
  if(next<steering.length&&distance>=steering[next][0]){lane=steering[next][1];next++}
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
