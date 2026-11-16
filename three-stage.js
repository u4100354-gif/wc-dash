// Three.js owns the camera, lighting, materials and GPU resources.
// Gameplay keeps its original coordinates (+Z ahead); a reflected content root
// makes those coordinates agree with Three.js's right-handed camera.
function createThreeStage(canvas) {
 const T=THREE;
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
 const scene=new T.Scene();scene.background=new T.Color('#81cbe3');scene.fog=new T.Fog('#b9dfdf',48,135);
 const content=new T.Group();content.scale.z=-1;scene.add(content);
 const camera=new T.PerspectiveCamera(55,1,.08,240);
 scene.add(new T.HemisphereLight('#d9f3ff','#b89573',2.1));
 const sun=new T.DirectionalLight('#fff1ce',3.1);sun.position.set(-9,17,5);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-16;sun.shadow.camera.right=16;
 sun.shadow.camera.top=24;sun.shadow.camera.bottom=-12;sun.shadow.camera.near=.5;sun.shadow.camera.far=75;
 sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;sun.target.position.set(0,0,-12);scene.add(sun,sun.target);
 const fill=new T.DirectionalLight('#a1dcff',.7);fill.position.set(8,5,-9);scene.add(fill);
 const skyGeometry=new T.SphereGeometry(180,32,16);
 const sky=new T.Mesh(skyGeometry,new T.ShaderMaterial({side:T.BackSide,depthWrite:false,
  vertexShader:'varying vec3 p; void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 p;void main(){float h=clamp(normalize(p).y*.9+.1,0.,1.);gl_FragColor=vec4(mix(vec3(.76,.89,.88),vec3(.18,.58,.83),h),1.);}'
 }));scene.add(sky);
 const orb=new T.Mesh(new T.SphereGeometry(5,24,16),new T.MeshBasicMaterial({color:'#fff1bd',fog:false}));orb.position.set(-55,65,-120);scene.add(orb);
 const cloudMat=new T.MeshStandardMaterial({color:'#ffffff',roughness:1});
 for(let i=0;i<12;i++){
  const cloud=new T.Group();cloud.position.set(Math.sin(i*13)*55,23+(i%4)*5,-35-i*10);
  for(let j=0;j<4;j++){
   const puff=new T.Mesh(new T.SphereGeometry(1,12,8),cloudMat);
   puff.position.set(j*3,Math.sin(j*3+i),0);puff.scale.set(4,1.4+j%2,2.3);cloud.add(puff);
  }scene.add(cloud);
 }
 const shapes=[],dummy=new T.Object3D(),color=new T.Color();
 function shape(geometry){
  const mesh=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({color:0xffffff,roughness:.65,metalness:.06}),16384);
  mesh.count=0;mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);content.add(mesh);
  const result={mesh,used:0};shapes.push(result);return result;
 }
 const cube=shape(typeof RoundedBoxGeometry==='function'?new RoundedBoxGeometry(1,1,1,2,.055):new T.BoxGeometry(1,1,1));
 const puck=shape(new T.CylinderGeometry(.5,.5,1,24));
 const sphere=shape(new T.SphereGeometry(.5,24,16));
 const profile=[[0,0],[.25,.035],[.34,.2],[.49,.75],[.50,.88],[.46,1],[.38,.98],[.34,.72],[.15,.40],[0,.39]];
 const bowl=shape(new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),32));
 function put(sh,a,b,z,sx,sy,sz,col,ry=0,rx=0,roll=0){
  if(sh.used>=sh.mesh.instanceMatrix.count)throw new Error('Scene instance capacity exceeded');
  dummy.position.set(a,b,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(rx,ry,roll,'YXZ');dummy.updateMatrix();
  sh.mesh.setMatrixAt(sh.used,dummy.matrix);sh.mesh.setColorAt(sh.used,color.set('#'+col));sh.used++;
 }
 const box=(...args)=>put(cube,...args),round=(...args)=>put(puck,...args);
 let lastW=0,lastH=0,lastRatio=0;
 function draw({w,h,f,eye,yaw,pitch,offsetX,offsetY}){
  const ratio=Math.min(typeof devicePixelRatio==='number'?devicePixelRatio:1,2.5);
  if(w!==lastW||h!==lastH||ratio!==lastRatio){renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);lastW=w;lastH=h;lastRatio=ratio;}
  camera.aspect=w/h;camera.fov=T.MathUtils.radToDeg(2*Math.atan(h/(2*f)));camera.updateProjectionMatrix();
  camera.projectionMatrix.elements[8]=-offsetX;camera.projectionMatrix.elements[9]=-offsetY;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  camera.position.set(eye[0],eye[1],-eye[2]);
  camera.lookAt(eye[0]+Math.sin(yaw)*Math.cos(pitch),eye[1]-Math.sin(pitch),-eye[2]-Math.cos(yaw)*Math.cos(pitch));
  for(const sh of shapes){sh.mesh.count=sh.used;sh.mesh.instanceMatrix.needsUpdate=true;if(sh.mesh.instanceColor)sh.mesh.instanceColor.needsUpdate=true;}
  renderer.render(scene,camera);
 }
 return {scene,content,camera,renderer,shapes,cube,puck,sphere,bowl,put,box,round,draw};
}
