// The wardrobe uses the same meshes, materials and poses as the live runner.
// Trying an outfit here never changes ownership, keys or the equipped skin.
function createWardrobePreview(canvas){
 const T=THREE,renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.05,40),group=new T.Group();scene.add(group);
 scene.add(new T.HemisphereLight('#e8f4ff','#bca180',2.1));
 const sun=new T.DirectionalLight('#fff1d0',3);sun.position.set(-3,7,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
 const fill=new T.DirectionalLight('#b7e2ef',1);fill.position.set(4,3,-2);scene.add(fill);
 const floor=new T.Mesh(new T.CylinderGeometry(1.05,1.10,.10,64),new T.MeshStandardMaterial({color:'#d4dfd0',roughness:.9}));
 floor.position.y=-.055;floor.receiveShadow=true;scene.add(floor);
 const hero=createRunner(group),cat=createMarsCat(group),thumbnails=new Map();
 let skin={},mode='idle',boots=false,active=false,age=0,last=0,angle=.25,drag=null,framePending=false,sizeKey='';
 function draw(outfit=skin,poseMode=mode,time=age,thumbnail=false){
  const w=thumbnail?256:Math.max(1,canvas.clientWidth),h=thumbnail?256:Math.max(1,canvas.clientHeight);
  const ratio=thumbnail?1:Math.min(typeof devicePixelRatio==='number'?devicePixelRatio:1,2),nextSize=[w,h,ratio].join(':');
  if(nextSize!==sizeKey){renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);sizeKey=nextSize;}
  camera.aspect=w/h;
  const viewHeight=poseMode==='jump'?4.45:poseMode==='cat'?2.65:2.45,focus=poseMode==='jump'?1.8:.93;
  const distance=viewHeight/(2*Math.tan(T.MathUtils.degToRad(35)/2));
  camera.position.set(Math.sin(thumbnail?.25:angle)*distance,focus+.35,Math.cos(thumbnail?.25:angle)*distance);camera.lookAt(0,focus,0);camera.updateProjectionMatrix();
  const p={t:time,phase:time*17.5,speed:17,distance:time*17,skin:outfit,boots:thumbnail?false:boots,idle:poseMode==='idle'};
  if(poseMode==='jump'){
   const t=Math.max(0,Math.min(2*8.25/17,time%1.65-.25));p.y=Math.max(0,8.25*t-8.5*t*t);p.jump=p.y>.001;p.velocity=8.25-17*t;p.supportGap=p.y;
  }
  if(poseMode==='roll'){const u=(time%1.7-.25)/.8;p.roll=Math.max(0,Math.min(1,u));p.slide=u>0&&u<1?1:0;}
  if(poseMode==='cat'){
   p.riding=true;p.mount=1;p.motion=sampleRideMotion(p);cat.update({...p,z:-.2});
  }else cat.root.visible=false;
  hero.update(p);renderer.render(scene,camera);
 }
 function schedule(){if(active&&!framePending&&typeof requestAnimationFrame==='function'){framePending=true;requestAnimationFrame(frame);}}
 function frame(ms){framePending=false;if(!active)return;const dt=last?Math.min(.05,(ms-last)/1000):0;last=ms;age+=dt;draw();schedule();}
 canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX};canvas.setPointerCapture?.(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;angle+=(e.clientX-drag.x)*.012;drag.x=e.clientX;draw()});
 canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 return {
  setSkin(value){skin=value;draw();},setMode(value){if(!['idle','run','jump','roll','cat'].includes(value))return;mode=value;age=0;draw();},
  setBoots(value){boots=!!value;draw();},setActive(value){active=!!value;last=0;if(active){draw();schedule();}},
  thumbnail(value){if(!thumbnails.has(value.id)){draw(value,'idle',0,true);thumbnails.set(value.id,canvas.toDataURL('image/webp',.88));}return thumbnails.get(value.id);},
  refresh(){draw();},scene,camera
 };
}
