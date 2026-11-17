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
 for(const file of ['inspector.js','presentation.js','three-stage.js','characters.js','world.js'])if(fs.existsSync(file))vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 return {ctx,three};
}
test('existing game world uses the Three.js backend',async()=>{
 const {ctx}=await setup();
 const world=ctx.createWorld({clientWidth:390,clientHeight:844,getContext:()=>null});
 assert.equal(world.engine,'three.js');
});

test('portrait chase camera centres the corridor and keeps Denis visible in every lane and in flight',async()=>{
 const {ctx,three}=await setup();const stage=ctx.createThreeStage({clientWidth:390,clientHeight:844});
 for(const width of [320,390,430,600])for(const x of [-2.2,-1.1,0,1.1,2.2])for(const lift of [0,3,10.6]){
  const view=ctx.chaseCamera({mobile:true,x,lift});
  stage.draw({w:width,h:844,f:width*1.10,...view});
  const centre=new three.Vector3(0,lift+1,0).project(stage.camera);
  const player=new three.Vector3(x,lift+1,0).project(stage.camera);
  assert.ok(Math.abs(centre.x)<.001,`portrait ${width}px lane ${x}: ${centre.x}`);
  assert.ok(Math.abs(player.x)<.86,'Denis must stay inside the portrait viewport');
 }
});

test('finish seats the pelvis on the smaller toilet with feet in front and above the floor',async()=>{
 const {ctx,three}=await setup(),parent=new three.Group(),hero=ctx.createRunner(parent);
 const pose=ctx.finishMotion(1.8);hero.update({finish:pose.seat,z:pose.z,angle:pose.angle});parent.updateMatrixWorld(true);
 const hips=parent.getObjectByName('hips'),seat=ctx.finishMotion(2);
 assert.ok(Math.abs(hips.getWorldPosition(new three.Vector3()).y-.59)<.01);
 assert.equal(seat.z,vm.runInContext('toiletCenterZ',ctx));
 for(const name of ['leftShoe','rightShoe']){
  const foot=new three.Box3().setFromObject(parent.getObjectByName(name));
  assert.ok(foot.min.y>-.03&&foot.min.y<.12,`seated foot floor clearance ${foot.min.y}`);
  assert.ok(foot.max.z<seat.z,'feet face away from the tank');
 }
});

test('complete scenes render all six routes, flight and finish at desktop and mobile sizes',async()=>{
 const {ctx}=await setup();const nodes=new Map();
 const node=()=>({clientWidth:390,clientHeight:844,width:390,height:844,dataset:{},style:{setProperty(){}},getContext:()=>({fillRect(){},strokeRect(){},fillText(){}}),
  setAttribute(){},addEventListener(){},append(){},replaceChildren(){},focus(){},showModal(){},setPointerCapture(){}});
 Object.assign(ctx,{crypto:require('node:crypto').webcrypto,performance:{now:()=>0},navigator:{maxTouchPoints:0},requestAnimationFrame(){},addEventListener(){},localStorage:{getItem:()=>null,setItem(){}},
  soundscape:{sync(){},effect(){},init(){},getVolumes:()=>({music:.7,fx:.8})},
  document:{getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelector:()=>node(),querySelectorAll:()=>[],createElement:node,addEventListener(){}}});
 for(const file of ['showcase','routes','sewer','environment','trains','endless','shop','game'])vm.runInContext(fs.readFileSync(file+'.js','utf8'),ctx,{filename:file+'.js'});
 for(const width of [390,1366])for(let index=0;index<6;index++){
  nodes.get('screen').clientWidth=width;
  vm.runInContext(`chooseRoute(${index});start();render3D();distance=150;beginFlight();height=10.6;cameraLift=10.6;render3D();flight=null;state='finish';toiletTime=1.8;height=0;render3D()`,ctx);
  const stage=vm.runInContext('render3D.stage',ctx);
  assert.ok(stage.camera.matrixWorld.elements.every(Number.isFinite));
  for(const shape of stage.shapes)assert.ok(shape.used>0?shape.used<16384:true);
 }
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
  const normals=limb.geometry.getAttribute('normal');for(let i=0;i<normals.count;i++)assert.ok(Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i))>.99);
 }
 hero.update({t:1,phase:2});root.updateMatrixWorld(true);
 for(const limb of limbs){limb.skeleton.update();const pos=new three.Vector3();for(let i=0;i<limb.geometry.attributes.position.count;i+=19){limb.getVertexPosition(i,pos);assert.ok(pos.toArray().every(Number.isFinite));}}
});
test('down action performs a full shoulder roll instead of just leaning the torso',async()=>{
 const {ctx,three}=await setup();const root=new three.Group(),hero=ctx.createRunner(root);
 hero.update({slide:1,roll:.5,t:.4,phase:0});
 const pivot=root.getObjectByName('somersault');assert.ok(pivot,'body needs a roll pivot');
 assert.ok(Math.abs(pivot.rotation.x)>2,'ordinary roll must turn forward');
 hero.update({slide:0,roll:0,t:.9,phase:0});assert.ok(Math.abs(pivot.rotation.x)<1e-6);
});
test('side roll is chosen explicitly by lane-change direction',async()=>{
 const {ctx,three}=await setup(),root=new three.Group(),hero=ctx.createRunner(root);
 hero.update({slide:1,roll:.5,rollDirection:1});const p=root.getObjectByName('somersault');
 assert.ok(p.rotation.y < -2);
 hero.update({slide:1,roll:.5,rollDirection:-1});assert.ok(p.rotation.y>0);
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
  assert.ok(max<1.38,`forward-roll clearance at ${frame}: ${max}`);
 }
});
test('inspection camera moves smoothly while a key is held and stops on release',async()=>{
 const {ctx,three}=await setup();
 ctx.OrbitControls=class{constructor(){this.target=new three.Vector3()}update(){}};
 const camera=new three.PerspectiveCamera();camera.position.set(0,2,6);camera.lookAt(0,1,0);
 const inspect=ctx.createCameraInspector(camera,{});inspect.setActive(true);
 const initial=camera.position.clone();inspect.move('KeyW');inspect.update(.25);inspect.update(.25);
 assert.ok(camera.position.distanceTo(initial)>1,'holding must move on each frame');
 assert.equal(typeof inspect.release,'function');inspect.release('KeyW');
 const stopped=camera.position.clone();inspect.update(.25);assert.ok(camera.position.distanceTo(stopped)<1e-8);
});
test('Denis restores his original head proportions and has closed shoulder transitions',async()=>{
 const {ctx,three}=await setup(),root=new three.Group(),hero=ctx.createRunner(root);
 hero.update({idle:true});
 assert.equal(root.getObjectByName('head').scale.x,1);
 assert.ok(root.getObjectByName('hoodieBody').scale.x<=.26);
 assert.ok(root.getObjectByName('hoodieBody').scale.z<=.17);
 for(const name of ['clavicleYoke','leftDeltoid','rightDeltoid'])assert.ok(root.getObjectByName(name),name);
});
test('shoulder roll keeps body scale and anatomical knee flexion instead of shrinking into a ball',async()=>{
 const {ctx,three}=await setup(),root=new three.Group(),hero=ctx.createRunner(root);
 for(let i=1;i<20;i++){
  hero.update({slide:1,roll:i/20,phase:0});
  assert.equal(root.getObjectByName('hips').scale.x,1,'body must not shrink');
  assert.ok(root.getObjectByName('leftKnee').rotation.x<=2.35,'knee flexion stays plausible');
 }
});
test('jump unfolds the legs before landing instead of keeping the apex tuck',async()=>{
 const {ctx,three}=await setup(),root=new three.Group(),hero=ctx.createRunner(root);
 hero.update({jump:true,velocity:0,supportGap:2,takeoffPhase:1});const apex=root.getObjectByName('leftKnee').rotation.x;
 hero.update({jump:true,velocity:-7,supportGap:.15,takeoffPhase:1});
 assert.ok(root.getObjectByName('leftKnee').rotation.x<apex*.6);
});
test('menu cat position leaves clear space beside Denis',async()=>{
 const {ctx,three}=await setup(),parent=new three.Group(),hero=ctx.createRunner(parent),cat=ctx.createMarsCat(parent);
 hero.update({idle:true,angle:-2.32});cat.update({x:1.55,z:.25,preview:true,angle:-2.12});parent.updateMatrixWorld(true);
 const a=new three.Box3().setFromObject(hero.root),b=new three.Box3().setFromObject(cat.root);
 assert.ok(b.min.x>a.max.x+.05,`separation: ${b.min.x-a.max.x}`);
});
test('jump has a solid trouser pelvis and closed caps above both thighs',async()=>{
 const {ctx,three}=await setup(),root=new three.Group(),hero=ctx.createRunner(root);
 hero.update({jump:true,velocity:0,supportGap:3});root.updateMatrixWorld(true);
 const pelvis=root.getObjectByName('pantsPelvis');assert.ok(pelvis?.isMesh,'solid waist and seat must exist');
 for(const name of ['leftLegSurface','rightLegSurface']){
  const mesh=root.getObjectByName(name),pos=mesh.geometry.getAttribute('position');
  assert.ok(pos.getY(0)>0,'upper leg must have a closed cap reaching into the pelvis');
  assert.ok(Math.abs(pos.getX(0))<1e-6&&Math.abs(pos.getZ(0))<1e-6);
 }
});
