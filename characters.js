// Original, articulated meshes. No purchased models or remote asset dependencies.
function characterKit(){
 const T=THREE,materials=new Map();
 const sphere=new T.SphereGeometry(1,24,18),capsule=new T.CapsuleGeometry(.5,1,6,12);
 function material(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.72}));return materials.get(color);}
 function ellipsoid(parent,color,x,y,z,sx,sy,sz){const mesh=new T.Mesh(sphere,material(color));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function segment(parent,color,x,y,z,radius,length){const mesh=new T.Mesh(capsule,material(color));mesh.position.set(x,y,z);mesh.scale.set(radius*2,length/2,radius*2);mesh.castShadow=true;parent.add(mesh);return mesh;}
 function joint(parent,name,x,y,z){const node=new T.Group();node.name=name;node.position.set(x,y,z);parent.add(node);return node;}
 return {T,material,ellipsoid,segment,joint};
}
// One closed surface spans each joint. Skin weights blend across the elbow/knee
// instead of leaving gaps between separately rotated capsules.
function createSkinLimb(parent,name,upper,lower,radii,material,shoulderCap=0){
 const T=THREE,total=upper+lower,rings=44,sides=20;
 const positions=[],normals=[],indices=[],skinIndices=[],skinWeights=[],uv=[];
 const profile=t=>{
  const stops=radii;
  for(let i=1;i<stops.length;i++)if(t<=stops[i][0]){const a=stops[i-1],b=stops[i],v=(t-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*(v*v*(3-2*v));}
  return stops.at(-1)[1];
 };
 const smooth=v=>{v=Math.min(1,Math.max(0,v));return v*v*(3-2*v)};
 for(let ring=0;ring<=rings;ring++){
  const t=ring/rings,d=t*(total+shoulderCap)-shoulderCap;
  const r=d<0?radii[0][1]*Math.sqrt(Math.max(0,1-(d/shoulderCap)**2)):profile(d/total);
  const mid=smooth((d-upper+.085)/.17),end=smooth((d-total+.06)/.06);
  for(let side=0;side<=sides;side++){
   const angle=side/sides*Math.PI*2;
   positions.push(Math.cos(angle)*r,-d,Math.sin(angle)*r);normals.push(Math.cos(angle),0,Math.sin(angle));uv.push(side/sides,t);
   skinIndices.push(0,1,2,0);skinWeights.push(1-mid,mid*(1-end),mid*end,0);
   if(ring<rings&&side<sides){const a=ring*(sides+1)+side,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
  }
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(skinWeights,4));geometry.setIndex(indices);geometry.computeVertexNormals();
 // The pole is shared by a full ring of coincident cap vertices. Give every
 // duplicate the same valid normal instead of leaving degenerate zero normals.
 if(shoulderCap){const n=geometry.getAttribute('normal');for(let i=0;i<=sides;i++)n.setXYZ(i,0,1,0);}
 const top=new T.Bone(),middle=new T.Bone(),end=new T.Bone();top.name=name+'Root';middle.name=name+'Joint';end.name=name+'End';
 middle.position.y=-upper;end.position.y=-lower;top.add(middle);middle.add(end);parent.add(top);
 const mesh=new T.SkinnedMesh(geometry,material);mesh.name=name+'Surface';mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;parent.add(mesh);
 parent.updateWorldMatrix(true,true);mesh.bind(new T.Skeleton([top,middle,end]));
 return {mesh,top,middle,end};
}
function createRunner(parent){
 const {T,material,ellipsoid:E,segment:S,joint:J}=characterKit();
 const root=J(parent,'Denis',0,0,0),somersault=J(root,'somersault',0,0,0),hips=J(somersault,'hips',0,.80,0),torso=J(hips,'torso',0,.03,0);
 const coat=E(torso,'#ed7541',0,.27,0,.25,.35,.165);
 coat.name='hoodieBody';
 E(torso,'#ff9e60',0,.04,.015,.24,.075,.16);E(torso,'#da5935',0,.47,-.09,.22,.15,.145);
 // Hoodie seam, zipper and pocket; front points in the direction of travel.
 S(torso,'#ffcf8a',0,.27,.165,.014,.38);
 for(const side of [-1,1])S(torso,'#f6c47c',side*.065,.43,.16,.012,.16);
 E(torso,'#ca563b',0,.14,.153,.16,.06,.025);
 const neck=E(torso,'#f3bd93',0,.66,0,.12,.15,.12);
 const head=J(torso,'head',0,.82,0);
 head.scale.setScalar(1);
 E(head,'#f5c39a',0,0,.015,.235,.27,.22);
 for(const side of [-1,1]){
  E(head,'#edaf8a',side*.23,-.015,0,.055,.085,.05);
  E(head,'#fff7e9',side*.087,.025,.199,.057,.065,.026);
  E(head,'#33433e',side*.087,.02,.224,.025,.038,.013);
  E(head,'#fffefa',side*.080,.035,.235,.010,.012,.006);
  const brow=E(head,'#5b3a31',side*.09,.115,.193,.065,.019,.018);brow.rotation.z=-side*.12;
 }
 E(head,'#e6aa81',0,-.045,.228,.051,.062,.052);E(head,'#a56b56',0,-.141,.192,.063,.014,.009);
 // Visible short chestnut hair and a swept fringe, rather than a cube hat.
 E(head,'#52372e',0,.15,-.04,.245,.16,.22);
 for(let i=0;i<7;i++){const hair=E(head,i%2?'#674235':'#55352c',(i-3)*.061,.206+Math.sin(i)*.025,.087,.083,.064,.16);hair.rotation.z=-.22;}
 E(torso,'#246e72',0,.26,-.20,.195,.24,.075);E(torso,'#389799',0,.25,-.262,.14,.17,.02);
 for(const side of [-1,1]){const strap=S(torso,'#254c53',side*.205,.30,-.08,.027,.51);strap.rotation.x=-.35;}
 const arms=[],legs=[];
 const pelvis=E(hips,'#294d65',0,-.015,-.015,.225,.135,.165);pelvis.name='pantsPelvis';
 for(const side of [-1,1])E(hips,'#294d65',side*.105,-.06,-.055,.125,.115,.13);
 // A closed shoulder yoke joins the collar to both sleeves beneath the hoodie.
 const yokeProfile=[[.35,.23,.14],[.43,.26,.15],[.50,.25,.14],[.56,.20,.12],[.62,.105,.095]];
 const yp=[],yi=[];
 for(let row=0;row<yokeProfile.length;row++)for(let n=0;n<=32;n++){
  const [y,w,d]=yokeProfile[row],a=n/32*Math.PI*2;yp.push(Math.cos(a)*w,y,Math.sin(a)*d);
  if(row<yokeProfile.length-1&&n<32){const i=row*33+n;yi.push(i,i+33,i+1,i+1,i+33,i+34);}
 }
 const yg=new T.BufferGeometry();yg.setAttribute('position',new T.Float32BufferAttribute(yp,3));yg.setIndex(yi);yg.computeVertexNormals();
 const yoke=new T.Mesh(yg,material('#ed7541'));yoke.name='clavicleYoke';yoke.castShadow=yoke.receiveShadow=true;torso.add(yoke);
 for(const side of [-1,1]){
  const label=side<0?'left':'right';
  const shoulder=J(torso,label+'Shoulder',side*.225,.465,0);
  const deltoid=J(shoulder,label+'Deltoid',0,0,0);
  const armRig=createSkinLimb(deltoid,label+'Arm',.32,.30,[[0,.10],[.18,.095],[.5,.078],[.65,.079],[.88,.062],[1,.058]],material('#ed7541'),.095);
  const arm=armRig.top,elbow=armRig.middle,wrist=armRig.end;
  const hand=J(wrist,label+'Hand',0,-.045,.01);
  E(hand,'#f4bf94',0,-.027,0,.057,.085,.042);
  E(hand,'#efb48e',-side*.052,-.012,.025,.027,.046,.029);
  E(wrist,'#f7ba7a',0,.012,0,.065,.028,.064);
  arms.push({arm,elbow,wrist,hand,side});
  const hip=J(hips,label+'HipSocket',side*.14,0,0);
  const legRig=createSkinLimb(hip,label+'Leg',.36,.34,[[0,.122],[.20,.115],[.49,.082],[.58,.085],[.72,.091],[.90,.062],[1,.054]],material('#294d65'),.095);
  const leg=legRig.top,knee=legRig.middle,ankle=legRig.end,shin=legRig.mesh;
  knee.name=label+'Knee';
  const shoe=J(ankle,label+'Shoe',0,0,0);
  E(shoe,'#fff5db',0,-.038,.045,.125,.065,.22);E(shoe,'#edb84e',0,.019,.04,.117,.073,.20);
  for(let i=0;i<3;i++)E(shoe,'#fff8e5',0,.076,.045+i*.037,.077,.012,.012);
  legs.push({leg,knee,shoe,shin,side,anchor:null,wasStance:false,previousU:0});
 }
 const clothing=[];
 const roleColors={ed7541:'jacket',ff9e60:'trim',f6864c:'trim','294d65':'pants','365b72':'pants',edb84e:'accent'};
 root.traverse(node=>{if(node.isMesh){const role=roleColors[node.material.color.getHexString()];if(role)clothing.push({node,role});}});
 const outfits=new Map();
 for(const kind of ['courier','space','ninja','fire','polar','punk','chef','cyber','pirate','royal']){
  const accessory=J(head,'outfit-'+kind,0,0,0);outfits.set(kind,accessory);accessory.visible=false;
  if(kind==='courier'||kind==='fire'){
   E(accessory,kind==='fire'?'#e65f3f':'#f3c552',0,.18,-.02,.27,.16,.245);
   E(accessory,kind==='fire'?'#bd4434':'#dca338',0,.18,.18,.30,.035,.21);
  }else if(kind==='space'){
   E(accessory,'#eef1dd',0,.04,-.025,.31,.32,.29);E(accessory,'#31576a',0,.02,.24,.245,.19,.075);
   E(accessory,'#96ced0',-.07,.09,.29,.13,.06,.025);
  }else if(kind==='ninja'){
   E(accessory,'#303745',0,.065,-.05,.26,.28,.22);E(accessory,'#303745',0,-.105,.20,.22,.10,.055);
  }else if(kind==='polar'){
   const rim=new T.Mesh(new T.TorusGeometry(.25,.065,10,28),material('#f6e7b7'));rim.position.z=.12;accessory.add(rim);
  }else if(kind==='punk'){
   for(let i=0;i<5;i++)E(accessory,'#e791b5',0,.33,-.19+i*.09,.045,.15,.057);
  }else if(kind==='chef'){
   for(const side of [-1,0,1])E(accessory,'#fff8e1',side*.13,.32,0,.16,.18,.21);
  }else if(kind==='cyber'){
   E(accessory,'#294956',0,.035,.23,.235,.072,.025);E(accessory,'#6ce4c7',0,.038,.252,.21,.022,.008);
  }else if(kind==='pirate'){
   E(accessory,'#353b46',0,.25,-.01,.39,.07,.27);E(accessory,'#494853',0,.31,-.02,.25,.12,.20);
   E(accessory,'#30333b',-.09,.035,.23,.063,.063,.02);
  }else{
   for(let i=0;i<7;i++){const a=i/7*Math.PI*2;E(accessory,'#f2ce6d',Math.sin(a)*.235,.30+(.075*(i%2)),Math.cos(a)*.20,.048,.115,.046);}
  }
 }
 let palette='';
 const smooth=v=>{v=Math.min(1,Math.max(0,v));return v*v*(3-2*v)};
 const mix=(a,b,t)=>a+(b-a)*t;
 const stains=J(torso,'flowStains',0,0,0);
 for(let i=0;i<11;i++){const z=i%2?.18:-.20;E(stains,i%3?'#65432e':'#80623e',Math.sin(i*4)*.21,.12+(i%4)*.105,z,.035+(i%3)*.012,.025+(i%2)*.035,.018);}
 stains.visible=false;
 const inverseRoot=new T.Matrix4(),localMatrix=new T.Matrix4(),point=new T.Vector3();
 function groundRoll(){
  root.updateWorldMatrix(true,true);root.updateMatrixWorld(true);
  inverseRoot.copy(root.matrixWorld).invert();let bottom=Infinity;
  root.traverseVisible(node=>{
   if(!node.isMesh)return;localMatrix.multiplyMatrices(inverseRoot,node.matrixWorld);
   if(node.isSkinnedMesh){
    node.skeleton.update();for(let i=0;i<node.geometry.attributes.position.count;i+=11){node.getVertexPosition(i,point);point.applyMatrix4(localMatrix);bottom=Math.min(bottom,point.y);}
   }else if(node.geometry.type==='SphereGeometry'){
    const m=localMatrix.elements;bottom=Math.min(bottom,m[13]-Math.hypot(m[1],m[5],m[9]));
   }
  });
  if(Number.isFinite(bottom))somersault.position.y+=.008-bottom;
 }
 function solveLeg(limb,footY,footZ,footX=0){
  const upper=.36,lower=.34,d=Math.min(upper+lower-.002,Math.max(.08,Math.hypot(footY,footZ)));
  const bend=Math.PI-Math.acos(Math.min(1,Math.max(-1,(upper*upper+lower*lower-d*d)/(2*upper*lower))));
  limb.leg.rotation.x=Math.atan2(-footZ,-footY)-Math.atan2(lower*Math.sin(bend),upper+lower*Math.cos(bend));
  limb.knee.rotation.x=bend;limb.leg.rotation.z=Math.atan2(footX,-footY);
  limb.shoe.rotation.x=-limb.leg.rotation.x-bend;
 }
 function update(p){
  const {x=0,y=0,z=0,t=0,phase=t*17,idle=false,jump=false,velocity=0,slide=0,bank=0,landing=0,riding=false,finish=0,skin,boots=false,dirty=false,distance=0,speed=16}=p;
  const effort=Math.min(1,Math.max(0,(speed-13)/8)),stage=effort<.33?0:effort<.70?1:2;
  const cadence=[14.5,17.5,21][stage],stride=[.29,.33,.36][stage];
  const crouch=Math.max(slide,finish*.65),rolling=slide>0&&p.roll!==undefined&&p.roll>0&&p.roll<1;
  const progress=rolling?p.roll:0,tuck=rolling?Math.min(smooth(progress/.13),smooth((1-progress)/.16)):0;
  const jumpMax=8.25*(boots?Math.sqrt(1.5):1),ascent=Math.max(0,Math.min(1,velocity/jumpMax));
  const flightTuck=jump?smooth(1-Math.min(1,Math.abs(velocity)/jumpMax)):0;
  const readyToLand=jump&&velocity<0?smooth(1-Math.min(1,(p.supportGap??1)/.8)):0;
  const lead=Math.sin(p.takeoffPhase??phase)>=0?-1:1;
  const sideways=rolling&&!!p.rollDirection,turn=rolling?Math.PI*2*smooth((progress-.13)/.68):0;
  root.position.set(x,y+(riding?.36:0),z);root.rotation.y=p.angle||0;root.rotation.z=-bank*.10;
  somersault.position.set(tuck*.055,tuck*.50,0);
  // Forward rotation follows travel. Axial side rotation is reserved for a lane change.
  somersault.rotation.set(sideways?tuck*Math.PI/2:turn,sideways?-Math.sign(p.rollDirection)*turn:0,sideways?Math.sin(progress*Math.PI)*.12:0,'XYZ');
  const bob=idle?Math.sin(t*2)*.009:jump?0:Math.sin(phase*2)*.017;
  const normalHip=idle?.80:.72-stage*.025+bob-landing*.065;
  hips.position.set(0,mix(normalHip-crouch*.30,0,tuck),sideways?0:-.46*tuck);
  hips.rotation.y=idle?0:Math.sin(phase)*.045*(1-crouch);hips.rotation.z=idle?0:Math.sin(phase)*.016*(1-crouch);
  torso.rotation.x=mix(crouch*1.30+(idle?0:jump?.10+flightTuck*.08:.18+stage*.035),sideways?.12:1.38,tuck);
  torso.rotation.y=idle?0:-Math.sin(phase)*.075*(1-crouch);torso.rotation.z=-bank*.055*(1-crouch);
  head.rotation.y=idle?Math.sin(t*.65)*.18:-bank*.11;
  head.rotation.x=rolling?.18:jump?-.12:-(torso.rotation.x*.22);
  hips.scale.setScalar(1);
  for(const limb of legs){
   const {leg,knee,shoe,shin,side}=limb;
   if(rolling){
    leg.rotation.set(mix(-1.3,sideways?(side<0?-.20:-.55):(side<0?-1.5:-1.65),tuck),0,side*.08);knee.rotation.x=mix(2.2,sideways?(side<0?.65:1.15):(side<0?2.1:2.25),tuck);shoe.rotation.x=-leg.rotation.x-knee.rotation.x;
   }else if(crouch>.05){
    leg.rotation.set(-1.3*crouch,0,side*.025);knee.rotation.x=2.2*crouch;shoe.rotation.x=-leg.rotation.x-knee.rotation.x;
   }else if(riding){leg.rotation.set(-1.2,0,side*.25);knee.rotation.x=1.8;shoe.rotation.x=-.6;
   }else if(jump){
    const leading=side===lead,launch=Math.sin((p.takeoffPhase??phase)+(side<0?0:Math.PI))*.35-.30;
    const collect=1-ascent*.75;
    leg.rotation.set(mix(launch,-.70-flightTuck*.35+(leading?-.12:.12),collect)*(1-readyToLand*.65),0,side*.035);
    knee.rotation.x=mix(.55+(leading?.25:0),1.15+flightTuck*.65,collect)*(1-readyToLand*.70);
    shoe.rotation.x=-leg.rotation.x-knee.rotation.x;
   }else if(idle){solveLeg(limb,-.695,side*.025);limb.wasStance=false;
   }else{
    const u=((phase/(Math.PI*2)+(side<0?0:.5))%1+1)%1;
    // Ground contact has a fixed world anchor. The stance duration decreases
    // with speed, so the leg never needs an impossible multi-metre extension.
    const stance=Math.min(.32,2*stride/Math.max(1,speed)*cadence/(Math.PI*2));
    const planted=u<stance;
    let footZ,footY;
    if(planted){
     if(!limb.wasStance||u<limb.previousU)limb.anchor=distance+stride-speed*u/(cadence/(Math.PI*2));
     footZ=p.distance===undefined?stride*(1-2*u/stance):Math.max(-stride-.05,Math.min(stride+.05,limb.anchor-distance));
     footY=.105;
    }else{
     const swing=(u-stance)/(1-stance),arc=Math.sin(swing*Math.PI);
     footZ=mix(-stride,stride,smooth(swing));footY=.105+Math.pow(Math.max(0,arc),1.2)*(.30+stage*.055);
    }
    const cross=side===-Math.sign(bank)?.38:.16;
    const lateral=bank*cross*(planted?.12:Math.sin((u-stance)/(1-stance)*Math.PI));
    solveLeg(limb,footY-hips.position.y,footZ,lateral);
    // Heel lift at toe-off; the sole is horizontal during the planted phase.
    shoe.rotation.x+=planted?-.12*smooth((u/stance-.7)/.3):-.18*Math.sin((u-stance)/(1-stance)*Math.PI);
    limb.wasStance=planted;limb.previousU=u;
   }
   shin.material=material(boots?'#419ed8':'#'+(skin?.pants||'294d65'));
  }
  for(const {arm,elbow,wrist,hand,side} of arms){
   const wave=Math.sin(phase+(side<0?0:Math.PI));
   arm.rotation.set(idle?.04:-wave*(.64+stage*.10)-(jump?.5:0)-(riding?.65:0),0,side*.085-bank*.04);
   elbow.rotation.x=idle?-.15:-1.05-.24*Math.cos(phase+(side<0?0:Math.PI));
   if(jump){arm.rotation.x=-.30-ascent*.65-flightTuck*.25;elbow.rotation.x=-.85-flightTuck*.3;}
   wrist.rotation.set(.07,side*.08,side*.10);hand.rotation.x=.12;
   if(crouch>.05){arm.rotation.x=mix(arm.rotation.x,sideways?-2.1:-.70,crouch);elbow.rotation.x=mix(elbow.rotation.x,sideways?-1.0:-1.8,crouch);}
  }
  if(skin&&skin.jacket!==palette){for(const {node,role} of clothing)node.material=material('#'+skin[role]);palette=skin.jacket;}
  for(const [kind,accessory] of outfits)accessory.visible=skin?.kind===kind;
  stains.visible=dirty;
  if(rolling)groundRoll();
  // Exposed for animation authoring and regression checks, never a gameplay lock.
  root.userData.motionStage=stage;root.userData.rolling=rolling;
 }

 return {root,update};
}
function createMarsCat(parent){
 const {T,material,ellipsoid:E,segment:S,joint:J}=characterKit();
 const root=J(parent,'Mars',0,0,0),body=J(root,'catBody',0,0,0);
 E(body,'#e4c9a3',0,.27,-.12,.43,.24,.80);E(body,'#f3dfbc',0,.31,.28,.45,.30,.46);
 // Overlapping tapered locks form a cream mane with a clean silhouette.
 for(let i=0;i<17;i++){
  const angle=i/17*Math.PI*2;
  const tuft=E(body,i%3?'#f4e4c9':'#dfc6a4',Math.cos(angle)*.29,.40+Math.sin(angle)*.19,.48,.13,.25,.24);
  tuft.rotation.z=-angle;
 }
 const head=J(body,'catHead',0,.59,.58);
 E(head,'#e7cfad',0,0,0,.29,.25,.25);E(head,'#f1dfc0',0,-.065,.18,.22,.15,.16);
 for(const side of [-1,1]){
  const ear=J(head,side<0?'earLeft':'earRight',side*.21,.20,-.015);ear.rotation.z=-side*.18;
  const earMesh=new T.Mesh(new T.ConeGeometry(.115,.35,4),material('#e4cda9'));earMesh.rotation.y=Math.PI/4;earMesh.position.y=.10;earMesh.castShadow=true;ear.add(earMesh);
  const inside=new T.Mesh(new T.ConeGeometry(.071,.24,3),material('#d3a994'));inside.position.set(0,.09,.04);ear.add(inside);
  const tuft=S(ear,'#f6e6c9',side*.012,.32,0,.014,.17);tuft.name=side<0?'earTuftLeft':'earTuftRight';tuft.rotation.z=-side*.15;
  E(head,'#717955',side*.125,.025,.219,.072,.056,.026);E(head,'#1f3029',side*.126,.024,.243,.017,.047,.009);
  E(head,'#fff8df',side*.112,.041,.251,.012,.012,.005);
  E(head,'#f8eacf',side*.085,-.075,.28,.10,.073,.068);
  for(let n=0;n<3;n++){
   const whisker=S(head,'#fdf4dc',side*.25,-.075-n*.025,.29,.004,.33);whisker.rotation.z=side*(Math.PI/2+.15*(n-1));
  }
  E(body,'#f5e4c6',side*.31,.115,.51,.13,.11,.23);E(body,'#e7ceaa',side*.31,.115,-.60,.14,.11,.24);
  for(let n=0;n<4;n++){const stripe=E(body,'#ccb08b',side*.36,.33,-.58+n*.23,.07,.12,.055);stripe.rotation.z=-side*.35;}
 }
 E(head,'#bf8a7c',0,-.064,.348,.044,.028,.025);E(head,'#a17d67',0,-.126,.322,.012,.033,.01);
 const tail=[];let anchor=J(body,'tailBase',0,.29,-.75);
 for(let i=0;i<6;i++){
  const link=J(anchor,'tailJoint'+i,0,i?0:.03,i?-.17:0);
  E(link,i>3?'#f3e3c7':'#dcc19b',0,0,-.09,.13+(i<4?.035:0),.13,.20);
  tail.push(link);anchor=link;
 }
 function update({x=0,y=0,z=0,t=0,preview=false,angle=0,bank=0,visible=true}){
  root.visible=visible;root.position.set(x,y+Math.sin(t*(preview?2:8))*.012,z);root.rotation.y=angle;root.rotation.z=-bank*.14;
  head.rotation.y=Math.sin(t*1.4)*.08;head.rotation.x=Math.sin(t*2.3)*.025;
  tail.forEach((node,i)=>{node.rotation.y=Math.sin(t*2.4-i*.35)*.15;node.rotation.x=.10+Math.sin(t*1.5-i*.2)*.06;});
 }
 return {root,update};
}
