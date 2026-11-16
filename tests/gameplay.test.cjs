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
 for(const file of ['showcase','trains','endless','shop','game'])vm.runInContext(fs.readFileSync(file+'.js','utf8'),ctx,{filename:file+'.js'});
 return {run:code=>vm.runInContext(code,ctx),storage};
}
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
 const steering=[[0,1],[55,0],[132,-1],[148,0],[173,-1],[280,0],[294,1],[319,0],[343,1],[474,0],[630,1],[650,-1]];
 let next=0,steps=0;
 while((state==='run'||state==='finish')&&steps++<8000){
  if(next<steering.length&&distance>=steering[next][0]){lane=steering[next][1];next++}
  tick(1/120);
 }
 ({state,distance,elapsed,revived,stumbleCooldown,profileFirst:profile.first});`);
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
