// A separate clock prevents both physics and cosmetic animation from drifting
// while a developer is positioning the camera for a screenshot.
function createDevClock(){
 let frozen=false,steps=0;
 return {
  get frozen(){return frozen},
  toggle(){frozen=!frozen;steps=0;return frozen},
  requestStep(){if(frozen)steps++},
  advance(dt){if(!frozen)return dt;if(steps){steps--;return 1/60}return 0}
 };
}
function createCameraInspector(camera,canvas){
 const controls=typeof OrbitControls==='function'?new OrbitControls(camera,canvas):null;
 if(controls){controls.enabled=false;controls.enableDamping=false;controls.minDistance=.35;controls.maxDistance=90;controls.maxPolarAngle=Math.PI*.98;}
 let active=false;
 return {
  get active(){return active},
  setActive(value){
   active=value;
   if(controls){controls.enabled=value;if(value){const direction=new THREE.Vector3();camera.getWorldDirection(direction);controls.target.copy(camera.position).addScaledVector(direction,6);controls.update();}}
  },
  move(code){
   if(!active||!controls)return false;
   const forward=new THREE.Vector3();camera.getWorldDirection(forward);
   const right=new THREE.Vector3().crossVectors(forward,camera.up).normalize(),shift=new THREE.Vector3();
   if(code==='KeyW')shift.copy(forward);else if(code==='KeyS')shift.copy(forward).negate();
   else if(code==='KeyD')shift.copy(right);else if(code==='KeyA')shift.copy(right).negate();
   else if(code==='KeyE')shift.copy(camera.up);else if(code==='KeyQ')shift.copy(camera.up).negate();else return false;
   shift.multiplyScalar(.28);camera.position.add(shift);controls.target.add(shift);controls.update();return true;
  },
  update(){if(active)controls?.update()}
 };
}
