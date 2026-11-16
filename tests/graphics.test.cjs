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
