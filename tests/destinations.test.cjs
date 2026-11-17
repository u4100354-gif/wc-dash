const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({});for(const file of ['showcase.js','routes.js','presentation.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
test('all destination traffic and obstacle rhythms leave a ground escape lane',()=>{
 for(let index=1;index<5;index++){
  const route=ctx.buildDestinationRoute(index),timeAt=z=>route.length/8*Math.log((13+8*z/route.length)/13);
  for(let z=0;z<route.length;z+=.5){
   const blocked=new Set();
   for(const c of route.trains){const shift=c.incomingSpeed?Math.max(0,timeAt(z)-timeAt(c.trigger))*c.incomingSpeed:0;
    if(z>=c.z-shift-2&&z<=c.z-shift+c.entry+c.deck+c.exit+2)blocked.add(c.a);
   }
   for(const o of route.obstacles)if(Math.abs(o.z-z)<2)blocked.add(o.a);
   assert.ok(blocked.size<3,`destination ${index+1}, ${z} m`);
  }
  assert.equal(new Set(route.trains.map(c=>c.kind)).size,3);assert.ok(route.flowEncounters.length>0);
 }
});
test('tunnel cutaway preserves distant arches but removes the crown between flying player and camera',()=>{
 assert.equal(ctx.tunnelRoofVisible(0,false),true);
 for(const z of [-15,-8,0,12,25])assert.equal(ctx.tunnelRoofVisible(z,true),false);
 assert.equal(ctx.tunnelRoofVisible(35,true),true);
});
