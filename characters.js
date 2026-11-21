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
 const dress=(node,role,shade=1)=>{node.userData.clothingRole=role;node.userData.clothingShade=shade;return node};
 const coat=dress(E(torso,'#ed7541',0,.27,0,.25,.35,.165),'jacket');
 coat.name='hoodieBody';
 dress(E(torso,'#ff9e60',0,.04,.015,.24,.075,.16),'trim');const hood=dress(E(torso,'#da5935',0,.47,-.09,.22,.15,.145),'jacket',.84);hood.name='hoodieHood';
 // Hoodie seam, zipper and pocket; front points in the direction of travel.
 const strings=[dress(S(torso,'#ffcf8a',0,.27,.165,.014,.38),'accent')];
 for(const side of [-1,1])strings.push(dress(S(torso,'#f6c47c',side*.065,.43,.16,.012,.16),'accent'));
 const pocket=dress(E(torso,'#ca563b',0,.14,.153,.16,.06,.025),'trim',.82);
 const neck=E(torso,'#f3bd93',0,.66,0,.12,.15,.12);
 const head=J(torso,'head',0,.82,0);
 head.scale.setScalar(1);const eyes=[];
 E(head,'#f5c39a',0,0,.015,.235,.27,.22);
 const headEars=[];
 for(const side of [-1,1]){
  headEars.push(E(head,'#edaf8a',side*.23,-.015,0,.055,.085,.05));
  eyes.push(E(head,'#fff7e9',side*.087,.025,.199,.057,.065,.026));
  eyes.push(E(head,'#33433e',side*.087,.02,.224,.025,.038,.013));
  eyes.push(E(head,'#fffefa',side*.080,.035,.235,.010,.012,.006));
  for(const [i,eye] of eyes.slice(-3).entries()){eye.name=(side<0?'left':'right')+['EyeWhite','Pupil','EyeGlint'][i];eye.userData.animated=true;}
  const brow=E(head,'#5b3a31',side*.09,.115,.193,.065,.019,.018);brow.rotation.z=-side*.12;
 }
 E(head,'#e6aa81',0,-.045,.228,.051,.062,.052);E(head,'#a56b56',0,-.141,.192,.063,.014,.009);
 // Visible short chestnut hair and a swept fringe, rather than a cube hat.
 const hair=J(head,'hair',0,0,0);
 E(hair,'#52372e',0,.15,-.04,.245,.16,.22);
 for(let i=0;i<7;i++){const tuft=E(hair,i%2?'#674235':'#55352c',(i-3)*.061,.206+Math.sin(i)*.025,.087,.083,.064,.16);tuft.rotation.z=-.22;}
 const backpack=[dress(E(torso,'#246e72',0,.26,-.20,.195,.24,.075),'hat'),dress(E(torso,'#389799',0,.25,-.262,.14,.17,.02),'hatTop')];
 for(const side of [-1,1]){const strap=S(torso,'#254c53',side*.205,.30,-.08,.027,.51);strap.rotation.x=-.35;dress(strap,'pants');backpack.push(strap);}
 const arms=[],legs=[];
 const pelvis=E(hips,'#294d65',0,-.015,-.015,.225,.135,.165);pelvis.name='pantsPelvis';
 for(const side of [-1,1]){const seat=E(hips,'#294d65',side*.105,-.06,-.055,.125,.115,.13);seat.name=side<0?'pantsSeatLeft':'pantsSeatRight';}
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
  dress(E(wrist,'#f7ba7a',0,.012,0,.065,.028,.064),'accent');
  arms.push({arm,elbow,wrist,hand,side});
  const hip=J(hips,label+'HipSocket',side*.14,0,0);
  const legRig=createSkinLimb(hip,label+'Leg',.36,.34,[[0,.122],[.20,.115],[.49,.082],[.58,.085],[.72,.091],[.90,.062],[1,.054]],material('#294d65'),.095);
  const leg=legRig.top,knee=legRig.middle,ankle=legRig.end,shin=legRig.mesh;
  knee.name=label+'Knee';
  const shoe=J(ankle,label+'Shoe',0,0,0);
  const sole=E(shoe,'#fff5db',0,-.038,.045,.125,.065,.22),upper=E(shoe,'#edb84e',0,.019,.04,.117,.073,.20);
  upper.name=label+'ShoeUpper';upper.userData.footwear=true;
  const cuff=E(shoe,'#419ed8',0,.105,-.015,.083,.115,.091);cuff.name=label+'BootCuff';cuff.visible=false;
  for(let i=0;i<3;i++)E(shoe,'#fff8e5',0,.076,.045+i*.037,.077,.012,.012);
  legs.push({leg,knee,shoe,shin,side,sole,upper,cuff,anchor:null,wasStance:false,previousU:0});
 }
 const wardrobe=createRunnerWardrobe({T,material,E,S,J,head,torso,arms,hair,headEars,hood,backpack,strings,pocket});
 const clothing=[],roleColors={ed7541:'jacket',ff9e60:'trim','294d65':'pants',edb84e:'accent'};
 root.traverse(node=>{if(node.isMesh&&!node.userData.footwear){const role=node.userData.clothingRole||roleColors[node.material.color.getHexString()];if(role)clothing.push({node,role});}});
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
    const m=localMatrix.elements;bottom=Math.min(bottom,m[13]-Math.hypot(m[1],m[5],m[9])*(node.geometry.parameters.radius??1));
   }else{
    const positions=node.geometry.attributes.position;
    for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(localMatrix);bottom=Math.min(bottom,point.y);}
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
  const ride=p.motion||sampleRideMotion(p),mounted=riding?ride.mount:0;
  const crouch=slide,rolling=mounted<.05&&slide>0&&p.roll!==undefined&&p.roll>0&&p.roll<1;
  const progress=rolling?p.roll:0,tuck=rolling?Math.min(smooth(progress/.13),smooth((1-progress)/.16)):0;
  const jumpMax=8.25*(boots?Math.sqrt(1.5):1),ascent=Math.max(0,Math.min(1,velocity/jumpMax));
  const flightTuck=jump?smooth(1-Math.min(1,Math.abs(velocity)/jumpMax)):0;
  const readyToLand=jump&&velocity<0?smooth(1-Math.min(1,(p.supportGap??1)/.8)):0;
  const lead=Math.sin(p.takeoffPhase??phase)>=0?-1:1;
  const onFoot=(1-mounted)*(1-crouch)*(1-finish),drive=smooth(effort);
  const contact=!jump&&!idle?Math.max(0,Math.min(1,landing)):0;
  const compression=4*contact*(1-contact)*onFoot;
  const airBlend=(jump?1:smooth(contact))*onFoot;
  const takeoffSwing=Math.cos((p.takeoffPhase??phase)+.48);
  const swing=mix(Math.cos(phase+.48),takeoffSwing,airBlend);
  const sideways=rolling&&!!p.rollDirection,turn=rolling?Math.PI*2*smooth((progress-.13)/.68):0;
  root.position.set(x,y,z-.20*mounted);root.rotation.y=p.angle||0;root.rotation.z=mix(-bank*.10,ride.roll,mounted);
  somersault.position.set(tuck*.055,tuck*.50,0);
  // Forward rotation follows travel. Axial side rotation is reserved for a lane change.
  somersault.rotation.set(sideways?tuck*Math.PI/2:turn,sideways?-Math.sign(p.rollDirection)*turn:0,sideways?Math.sin(progress*Math.PI)*.12:0,'XYZ');
  const bob=idle?Math.sin(t*2)*.009:jump?0:Math.sin(phase*2)*.017;
  const normalHip=idle?.80:.72-drive*.05+bob*(1-airBlend)-compression*.095;
  hips.position.set(0,mix(normalHip-crouch*.30,0,tuck),sideways?0:-.46*tuck);
  hips.rotation.y=idle?0:swing*(.035+drive*.028)*(1-crouch);hips.rotation.z=idle?0:Math.sin(phase)*.016*(1-crouch)*(1-airBlend);
  torso.rotation.x=mix(crouch*1.30+(idle?0:mix(.11+drive*.14,.11+flightTuck*.09+readyToLand*.05,airBlend))+compression*.17,sideways?.12:1.38,tuck);
  torso.rotation.y=idle?0:-swing*(.065+drive*.075)*(1-crouch);torso.rotation.z=-bank*.055*(1-crouch);
  head.rotation.y=idle?Math.sin(t*.65)*.18:-bank*.11;
  head.rotation.x=rolling?.18:jump?-.12:-(torso.rotation.x*.22);
  hips.scale.setScalar(1);
  if(mounted>0){
   hips.position.y=mix(hips.position.y,ride.seatY+ride.transitionHop,mounted);hips.position.z=mix(hips.position.z,ride.seatZ,mounted);
   hips.rotation.y*=1-mounted;hips.rotation.z=mix(hips.rotation.z,bank*.045,mounted);
   torso.rotation.x=mix(torso.rotation.x,ride.torso,mounted);torso.rotation.y=mix(torso.rotation.y,bank*.12,mounted);
   torso.rotation.z=mix(torso.rotation.z,bank*.08,mounted);head.rotation.x=mix(head.rotation.x,-ride.torso*.30-ride.launch*.08,mounted);
  }
  if(finish>0){
   hips.position.y=mix(hips.position.y,.59,finish);hips.rotation.y*=1-finish;hips.rotation.z*=1-finish;
   torso.rotation.x=mix(torso.rotation.x,.10,finish);torso.rotation.y*=1-finish;head.rotation.x=mix(head.rotation.x,-.035,finish);
  }else if(p.anticipation){hips.position.y-=p.anticipation*.09;torso.rotation.x+=p.anticipation*.20;}
  for(const limb of legs){
   const {leg,knee,shoe,shin,side}=limb;
   if(rolling){
    leg.rotation.set(mix(-1.3,sideways?(side<0?-.20:-.55):(side<0?-1.5:-1.65),tuck),0,side*.08);knee.rotation.x=mix(2.2,sideways?(side<0?.65:1.15):(side<0?2.1:2.25),tuck);shoe.rotation.x=-leg.rotation.x-knee.rotation.x;
   }else if(crouch>.05){
    leg.rotation.set(-1.3*crouch,0,side*.025);knee.rotation.x=2.2*crouch;shoe.rotation.x=-leg.rotation.x-knee.rotation.x;
   }else if(jump){
    const leading=side===lead,launch=Math.sin((p.takeoffPhase??phase)+(side<0?0:Math.PI))*.35-.30;
    const collect=1-ascent*.75;
    leg.rotation.set(mix(launch,-.70-flightTuck*.35+(leading?-.12:.12),collect)*(1-readyToLand*.65),0,side*.035);
    knee.rotation.x=mix(.55+(leading?.25:0),1.15+flightTuck*.65,collect)*(1-readyToLand*.70);
    shoe.rotation.x=-leg.rotation.x-knee.rotation.x;
    limb.wasStance=false;
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
     footZ=mix(-stride,stride,smooth(swing));footY=.105+Math.pow(Math.max(0,arc),1.2)*(.16+drive*.25);
    }
    const cross=side===-Math.sign(bank)?.38:.16;
    const lateral=bank*cross*(planted?.12:Math.sin((u-stance)/(1-stance)*Math.PI));
    solveLeg(limb,footY-hips.position.y,footZ,lateral);
    // Heel lift at toe-off; the sole is horizontal during the planted phase.
    shoe.rotation.x+=planted?-.12*smooth((u/stance-.7)/.3):-.18*Math.sin((u-stance)/(1-stance)*Math.PI);
    limb.wasStance=planted;limb.previousU=u;
   }
   if(finish>0){leg.rotation.x=mix(leg.rotation.x,-1.25,finish);leg.rotation.z=mix(leg.rotation.z,side*.06,finish);knee.rotation.x=mix(knee.rotation.x,1.25,finish);shoe.rotation.x=-leg.rotation.x-knee.rotation.x;}
   if(mounted>0){
    leg.rotation.x=mix(leg.rotation.x,ride.hipAngle,mounted);leg.rotation.z=mix(leg.rotation.z,side*ride.hipSpread,mounted);
    knee.rotation.x=mix(knee.rotation.x,ride.knee,mounted);shoe.rotation.x=mix(shoe.rotation.x,-.25+ride.duck*.15,mounted);
   }
   shin.material=material('#'+(skin?.pants||'294d65'));
   limb.upper.material=material(boots?'#419ed8':'#'+(skin?.accent||'edb84e'));
   limb.sole.material=material(boots?'#b8ebf5':'#fff5db');limb.cuff.visible=boots;
  }
  for(const {arm,elbow,wrist,hand,side} of arms){
   const counterSwing=side<0?swing:-swing,leading=side===lead;
   arm.rotation.set(idle?.04:counterSwing*(.38+drive*.50),0,side*.085-bank*.04);
   elbow.rotation.x=idle?-.15:-.42-drive*.64+counterSwing*(.12+drive*.18);
   if(airBlend>0){
    const brace=jump?readyToLand:1;
    arm.rotation.x=mix(arm.rotation.x,-.46-ascent*.38+(leading?.35:-.35)*(1-brace*.6)+brace*.22,airBlend);
    arm.rotation.z+=side*(.10+flightTuck*.18+brace*.16)*airBlend;
    elbow.rotation.x=mix(elbow.rotation.x,-.86-flightTuck*.26+brace*.27,airBlend);
   }
   wrist.rotation.set(.07,side*.08,side*.10);hand.rotation.x=.12;
   if(crouch>.05){arm.rotation.x=mix(arm.rotation.x,sideways?-2.1:-.70,crouch);elbow.rotation.x=mix(elbow.rotation.x,sideways?-1.0:-1.8,crouch);}
   if(mounted>0){
    arm.rotation.x=mix(arm.rotation.x,ride.arm+side*bank*.10,mounted);arm.rotation.z=mix(arm.rotation.z,side*.12-bank*.07,mounted);
    elbow.rotation.x=mix(elbow.rotation.x,ride.elbow,mounted);wrist.rotation.x=mix(wrist.rotation.x,-.15,mounted);
   }
   if(finish>0){arm.rotation.x=mix(arm.rotation.x,-.35,finish);elbow.rotation.x=mix(elbow.rotation.x,-1.15,finish);}
  }
  const paletteKey=skin?[skin.jacket,skin.trim,skin.pants,skin.accent,skin.hat,skin.hatTop].join('|'):'';
  if(skin&&paletteKey!==palette){for(const {node,role} of clothing){const c=new T.Color('#'+(skin[role]||skin.accent||'edb84e'));c.multiplyScalar(node.userData.clothingShade??1);const next=material('#'+c.getHexString());node.material.side===T.DoubleSide?(node.material.color.copy(next.color)):node.material=next;}palette=paletteKey;}
  wardrobe.update(skin,p);
  const blinkAt=((t%4.6)+4.6)%4.6,blink=blinkAt>3.5&&blinkAt<3.66?Math.sin((blinkAt-3.5)/.16*Math.PI):0;
  for(const eye of eyes){eye.userData.openHeight??=eye.scale.y;eye.scale.y=eye.userData.openHeight*(1-blink*.94);}
  stains.visible=dirty;
  if(rolling)groundRoll();
  // Exposed for animation authoring and regression checks, never a gameplay lock.
  root.userData.motionStage=stage;root.userData.rolling=rolling;root.userData.rideAction=mounted>0?ride.action:null;
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
 const ears=[],paws=[];
 for(const side of [-1,1]){
  const ear=J(head,side<0?'earLeft':'earRight',side*.21,.20,-.015);ear.rotation.z=-side*.18;
  ears.push({ear,side});
  const earMesh=new T.Mesh(new T.ConeGeometry(.115,.35,4),material('#e4cda9'));earMesh.rotation.y=Math.PI/4;earMesh.position.y=.10;earMesh.castShadow=true;ear.add(earMesh);
  const inside=new T.Mesh(new T.ConeGeometry(.071,.24,3),material('#d3a994'));inside.position.set(0,.09,.04);ear.add(inside);
  const tuft=S(ear,'#f6e6c9',side*.012,.32,0,.014,.17);tuft.name=side<0?'earTuftLeft':'earTuftRight';tuft.rotation.z=-side*.15;
  E(head,'#717955',side*.125,.025,.219,.072,.056,.026);E(head,'#1f3029',side*.126,.024,.243,.017,.047,.009);
  E(head,'#fff8df',side*.112,.041,.251,.012,.012,.005);
  E(head,'#f8eacf',side*.085,-.075,.28,.10,.073,.068);
  for(let n=0;n<3;n++){
   const whisker=S(head,'#fdf4dc',side*.25,-.075-n*.025,.29,.004,.33);whisker.rotation.z=side*(Math.PI/2+.15*(n-1));
  }
  for(const front of [true,false]){
   const name=(front?'front':'hind')+(side<0?'Left':'Right'),upper=front?.27:.26,lower=.25;
   const socket=J(body,name+'Socket',side*.31,front?.39:.36,front?.38:-.48);
   const leg=J(socket,name+'Leg',0,0,0),knee=J(leg,name+'Knee',0,-upper,0),paw=J(knee,name+'Paw',0,-lower,0);
   E(leg,front?'#f3dfbc':'#e7ceaa',0,-upper*.40,0,front?.074:.12,upper*.60,front?.085:.14);
   S(knee,'#ead6b6',0,-lower*.45,0,front?.05:.065,lower+.035);
   E(paw,front?'#f5e4c6':'#e7ceaa',0,.015,.035,front?.13:.14,.09,.22);
   for(let toe=-1;toe<=1;toe++)E(paw,'#f4e4c9',toe*.055,.025,.202,.025,.027,.025);
   paws.push({socket,leg,knee,paw,front,side,upper,lower,wasStance:false,previousU:0,anchor:0});
  }
  for(let n=0;n<4;n++){const stripe=E(body,'#ccb08b',side*.36,.33,-.58+n*.23,.07,.12,.055);stripe.rotation.z=-side*.35;}
 }
 E(head,'#bf8a7c',0,-.064,.348,.044,.028,.025);E(head,'#a17d67',0,-.126,.322,.012,.033,.01);
 const tail=[];let anchor=J(body,'tailBase',0,.29,-.75);
 for(let i=0;i<6;i++){
  const link=J(anchor,'tailJoint'+i,0,i?0:.03,i?-.17:0);
  E(link,i>3?'#f3e3c7':'#dcc19b',0,0,-.09,.13+(i<4?.035:0),.13,.20);
  tail.push(link);anchor=link;
 }
 const inverseBody=new T.Matrix4(),inverseRotation=new T.Quaternion(),target=new T.Vector3();
 function update(p={}){
  const {x=0,y=0,z=0,t=0,preview=false,angle=0,bank=0,visible=true,distance=0,speed=16}=p;
  const motion=p.motion||sampleRideMotion(p),{gait,duck,jump,tuck,launch,reach,impact,stage}=motion;
  root.visible=visible;root.position.set(x,y+(preview?Math.sin(t*2)*.012:0),z-(preview?0:(1-motion.mount)*1.4));
  root.rotation.set(0,angle,motion.roll);body.position.y=motion.bodyY;body.rotation.x=motion.pitch;
  body.scale.set(1,1,motion.stretch);body.updateMatrix();inverseBody.copy(body.matrix).invert();inverseRotation.copy(root.quaternion).invert();
  for(const limb of paws){
   const {front,side,socket,leg,knee,paw,upper,lower}=limb,baseZ=front?.51:-.60;
   let footY=.10,footZ=baseZ;
   if(preview){limb.wasStance=false;}
   else if(jump){
    footY=front?.14+tuck*.11:.17+tuck*.06;
    footZ=front?baseZ+launch*.16-tuck*.25+reach*.13:baseZ-launch*.12+tuck*.22+reach*.06;
    limb.wasStance=false;
   }else{
    const offset=(front?0:.48)+(side>0?.12:0),u=((gait/(Math.PI*2)+offset)%1+1)%1;
    const stride=.18+stage*.02,stance=Math.min(.18,2*stride/Math.max(1,speed)*motion.frequency),planted=u<stance;
    if(planted){
     if(!limb.wasStance||u<limb.previousU)limb.anchor=distance+baseZ+stride-speed*u/motion.frequency;
     footZ=limb.anchor-distance;
    }else{
     const swing=(u-stance)/(1-stance),v=swing*swing*(3-2*swing);
     footZ=baseZ-stride+2*stride*v;footY+=Math.sin(swing*Math.PI)*(.12+stage*.015)*(1-duck*.55);
    }
    limb.wasStance=planted;limb.previousU=u;
   }
   const crossStep=preview||jump?0:bank*Math.sin(gait+(front?0:Math.PI))*.055;
   target.set(side*.31+crossStep,footY,footZ).applyQuaternion(inverseRotation).applyMatrix4(inverseBody).sub(socket.position);
   const length=Math.max(.09,Math.min(upper+lower-.001,target.length())),bend=(front?1:-1)*(Math.PI-Math.acos(Math.max(-1,Math.min(1,(upper*upper+lower*lower-length*length)/(2*upper*lower)))));
   const down=Math.hypot(target.x,target.y);
   leg.rotation.set(Math.atan2(-target.z,down)-Math.atan2(lower*Math.sin(bend),upper+lower*Math.cos(bend)),0,Math.atan2(target.x,-target.y),'ZXY');
   knee.rotation.x=bend;paw.rotation.set(-leg.rotation.x-bend-motion.pitch,0,-leg.rotation.z-motion.roll);
  }
  head.rotation.y=preview?Math.sin(t*1.4)*.08:-bank*.16;
  head.rotation.x=preview?Math.sin(t*2.3)*.025:-motion.pitch*.65+duck*.12-launch*.08+impact*.10;
  for(const {ear,side} of ears){ear.rotation.z=-side*(.18+duck*.15+tuck*.10);ear.rotation.x=preview?0:duck*.22+launch*.13;}
  tail.forEach((node,i)=>{
   node.rotation.y=preview?Math.sin(t*2.4-i*.35)*.15:Math.sin(gait*.5-i*.38)*.12-bank*.16;
   node.rotation.x=preview?.10+Math.sin(t*1.5-i*.2)*.06:.04+Math.sin(gait-i*.35)*.045-duck*.05-launch*.13+tuck*.08;
  });
  root.userData.rideAction=motion.action;
 }
 return {root,update};
}
