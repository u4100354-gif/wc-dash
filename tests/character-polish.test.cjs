const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

async function runner(){
 const three=await import('../vendor/three/three.module.js');
 const context=vm.createContext({THREE:three,Math});
 for(const file of ['ride-motion.js','costumes.js','characters.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
 return context.createRunner(new three.Group());
}

test('without a mount, the torso holds its takeoff twist instead of cycling through running steps in midair',async()=>{
 const hero=await runner(),torso=hero.root.getObjectByName('torso');
 const twist=(phase,takeoffPhase)=>{hero.update({jump:true,supportGap:1,velocity:0,phase,takeoffPhase});return torso.rotation.y;};
 assert.ok(Math.abs(twist(0,0)-twist(Math.PI,0))<1e-8);
 assert.ok(twist(0,0)*twist(0,Math.PI)<0);
});

test('landing bends the body after contact and releases it into the next stride',async()=>{
 const hero=await runner(),hips=hero.root.getObjectByName('hips'),torso=hero.root.getObjectByName('torso');
 const pose=landing=>{hero.update({speed:17,landing,phase:0,takeoffPhase:0});return [hips.position.y,torso.rotation.x];};
 const contact=pose(1),absorbed=pose(.5),released=pose(0);
 assert.ok(absorbed[0]<Math.min(contact[0],released[0])-.07);
 assert.ok(absorbed[1]>Math.max(contact[1],released[1])+.08);
});
