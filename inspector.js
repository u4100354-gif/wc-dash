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
 let active=false;const held=new Set();
 const forward=new THREE.Vector3(),right=new THREE.Vector3(),shift=new THREE.Vector3();
 return {
  get active(){return active},
  setActive(value){
   active=value;held.clear();
   if(controls){controls.enabled=value;if(value){const direction=new THREE.Vector3();camera.getWorldDirection(direction);controls.target.copy(camera.position).addScaledVector(direction,6);controls.update();}}
  },
  move(code){
   if(!active||!controls)return false;
   if(!['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE'].includes(code))return false;
   held.add(code);return true;
  },
  release(code){held.delete(code)},
  clear(){held.clear()},
  update(wallDt=1/60){
   if(!active||!controls)return;
   camera.getWorldDirection(forward);right.crossVectors(forward,camera.up).normalize();shift.set(0,0,0);
   if(held.has('KeyW'))shift.add(forward);if(held.has('KeyS'))shift.sub(forward);
   if(held.has('KeyD'))shift.add(right);if(held.has('KeyA'))shift.sub(right);
   if(held.has('KeyE'))shift.add(camera.up);if(held.has('KeyQ'))shift.sub(camera.up);
   if(shift.lengthSq()){shift.normalize().multiplyScalar(3.6*wallDt);camera.position.add(shift);controls.target.add(shift);}
   controls.update();
  }
 };
}
