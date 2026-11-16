const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
async function setup(){
 const three=await import(pathToFileURL(require('node:path').resolve('vendor/three/three.module.js')).href);
 class Renderer {
  constructor(){this.shadowMap={};this.domElement={};}
  setPixelRatio(){} setSize(){} render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}
 }
 const ctx=vm.createContext({THREE:{...three,WebGLRenderer:Renderer},devicePixelRatio:1,console,Math});
 for(const file of ['three-stage.js','characters.js','world.js'])if(fs.existsSync(file))vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 return {ctx,three};
}
test('existing game world uses the Three.js backend',async()=>{
 const {ctx}=await setup();
 const world=ctx.createWorld({clientWidth:390,clientHeight:844,getContext:()=>null});
 assert.equal(world.engine,'three.js');
});
test('Three.js scene renders colored instances with lights and shadows',async()=>{
 const {ctx}=await setup();assert.equal(typeof ctx.createThreeStage,'function','Three.js stage is available');
 const stage=ctx.createThreeStage({clientWidth:390,clientHeight:844});
 stage.box(0,0,0,1,1,1,'ff8844');stage.draw({w:390,h:844,f:460,eye:[0,3,-6],yaw:0,pitch:.2,offsetX:0,offsetY:0});
 assert.ok(stage.scene.isScene);assert.ok(stage.renderer.shadowMap.enabled);
 assert.ok(stage.scene.children.some(o=>o.isDirectionalLight));
 assert.equal(stage.cube.mesh.count,1);
});
test('articulated runner supports running, jumping, sliding, riding and finish poses without invalid transforms',async()=>{
 const {ctx,three}=await setup();assert.equal(typeof ctx.createRunner,'function','Animated runner is available');
 const root=new three.Group();const hero=ctx.createRunner(root);
 for(const pose of [{},{jump:true,velocity:8},{slide:1},{riding:true},{finish:1},{landing:1,bank:-1}]){
  hero.update({x:0,y:0,z:0,t:1,phase:2,...pose});root.updateMatrixWorld(true);
  root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
 }
 assert.ok(root.getObjectByName('Denis'));assert.ok(root.getObjectByName('leftKnee'));
});
test('cream cat has an articulated plume, long tufted ears and reference-colored fur',async()=>{
 const {ctx,three}=await setup();assert.equal(typeof ctx.createMarsCat,'function','Reference cat is available');
 const root=new three.Group(),cat=ctx.createMarsCat(root);
 cat.update({x:0,y:0,z:0,t:2,preview:true});
 assert.ok(root.getObjectByName('Mars'));assert.ok(root.getObjectByName('earTuftLeft'));
 assert.ok(root.getObjectByName('tailJoint5'));
 root.updateMatrixWorld(true);root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
});
test('slide model fits beneath the same low clearance used by the collision system',async()=>{
 const {ctx,three}=await setup();const root=new three.Group(),hero=ctx.createRunner(root);
 hero.update({slide:1,t:0,phase:0});root.updateMatrixWorld(true);
 const box=new three.Box3().setFromObject(root);
 assert.ok(box.max.y<=1.04,`head must clear the bar: ${box.max.y}`);
 assert.ok(box.min.y>=-.08,`feet must stay above the ground: ${box.min.y}`);
});
test('runner limbs are continuous weighted meshes driven by real bones',async()=>{
 const {ctx,three}=await setup();const root=new three.Group(),hero=ctx.createRunner(root),limbs=[];
 root.traverse(node=>{if(node.isSkinnedMesh)limbs.push(node)});
 assert.equal(limbs.length,4,'two arms and two legs must deform continuously');
 for(const limb of limbs){assert.ok(limb.skeleton.bones.length>=3);const weights=limb.geometry.getAttribute('skinWeight');
  for(let i=0;i<weights.count;i++)assert.ok(Math.abs(weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i)-1)<1e-5);
 }
 hero.update({t:1,phase:2});root.updateMatrixWorld(true);
 for(const limb of limbs){limb.skeleton.update();const pos=new three.Vector3();for(let i=0;i<limb.geometry.attributes.position.count;i+=19){limb.getVertexPosition(i,pos);assert.ok(pos.toArray().every(Number.isFinite));}}
});
test('down action performs a full shoulder roll instead of just leaning the torso',async()=>{
 const {ctx,three}=await setup();const root=new three.Group(),hero=ctx.createRunner(root);
 hero.update({slide:1,roll:.5,t:.4,phase:0});
 const pivot=root.getObjectByName('somersault');assert.ok(pivot,'body needs a roll pivot');
 assert.ok(Math.abs(pivot.rotation.x)>2,'body must actually turn over');
 hero.update({slide:0,roll:0,t:.9,phase:0});assert.ok(Math.abs(pivot.rotation.x)<1e-6);
});
test('planted foot stays at the same world position while the body advances',async()=>{
 const {ctx,three}=await setup();const root=new three.Group(),hero=ctx.createRunner(root),points=[];
 for(let i=0;i<10;i++){
  const t=i/240;hero.update({t,phase:t*17.5,speed:17,distance:t*17});root.updateMatrixWorld(true);
  const foot=root.getObjectByName('leftShoe').getWorldPosition(new three.Vector3());points.push([foot.z+t*17,foot.y]);
 }
 assert.ok(Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0]))<.035);
 assert.ok(points.every(p=>p[1]>.08&&p[1]<.13),'ankle stays above its supporting sole');
});
test('three speed ranges choose different sprint stages',async()=>{
 const {ctx,three}=await setup(),hero=ctx.createRunner(new three.Group());
 for(const [speed,stage] of [[13,0],[17,1],[21,2]]){hero.update({speed,phase:1});assert.equal(hero.root.userData.motionStage,stage);}
});
test('complete rolling motion stays close to the supporting ground and below the clearance',async()=>{
 const {ctx,three}=await setup(),root=new three.Group(),hero=ctx.createRunner(root),point=new three.Vector3();
 for(let frame=3;frame<=17;frame++){
  hero.update({slide:1,roll:frame/20,phase:0});root.updateMatrixWorld(true);let min=Infinity,max=-Infinity;
  root.traverseVisible(node=>{
   if(!node.isMesh)return;if(node.isSkinnedMesh)node.skeleton.update();
   for(let i=0;i<node.geometry.attributes.position.count;i+=3){node.getVertexPosition(i,point);point.applyMatrix4(node.matrixWorld);min=Math.min(min,point.y);max=Math.max(max,point.y);}
  });
  assert.ok(min>=-.065&&min<.06,`ground contact at ${frame}: ${min}`);
  assert.ok(max<1.08,`clearance at ${frame}: ${max}`);
 }
});
