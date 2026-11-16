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
function createRunner(parent){
 const {T,material,ellipsoid:E,segment:S,joint:J}=characterKit();
 const root=J(parent,'Denis',0,0,0),hips=J(root,'hips',0,.85,0),torso=J(hips,'torso',0,.06,0);
 const coat=E(torso,'#ed7541',0,.27,0,.31,.37,.21);
 E(torso,'#ff9e60',0,.04,.03,.29,.11,.21);E(torso,'#da5935',0,.47,-.11,.27,.18,.18);
 // Hoodie seam, zipper and pocket; front points in the direction of travel.
 S(torso,'#ffcf8a',0,.27,.205,.014,.38);
 for(const side of [-1,1])S(torso,'#f6c47c',side*.075,.43,.20,.012,.16);
 E(torso,'#ca563b',0,.14,.193,.20,.075,.035);
 const neck=E(torso,'#f3bd93',0,.66,0,.12,.15,.12);
 const head=J(torso,'head',0,.82,0);
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
 E(torso,'#246e72',0,.26,-.245,.235,.28,.09);E(torso,'#389799',0,.25,-.322,.16,.19,.025);
 for(const side of [-1,1]){const strap=S(torso,'#254c53',side*.205,.30,-.08,.027,.51);strap.rotation.x=-.35;}
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const label=side<0?'left':'right';
  const arm=J(torso,label+'Shoulder',side*.31,.49,0);
  S(arm,'#ed7541',0,-.15,0,.09,.30);
  const elbow=J(arm,label+'Elbow',0,-.30,0);S(elbow,'#f6864c',0,-.13,0,.08,.27);
  E(elbow,'#f4bf94',0,-.30,0,.081,.095,.085);arms.push({arm,elbow,side});
  const leg=J(hips,label+'Hip',side*.14,0,0);S(leg,'#294d65',0,-.18,0,.10,.36);
  const knee=J(leg,label+'Knee',0,-.36,0);const shin=S(knee,'#365b72',0,-.16,0,.085,.32);
  const shoe=J(knee,label+'Shoe',0,-.32,.055);
  E(shoe,'#fff5db',0,-.038,.045,.125,.065,.22);E(shoe,'#edb84e',0,.019,.04,.117,.073,.20);
  for(let i=0;i<3;i++)E(shoe,'#fff8e5',0,.076,.045+i*.037,.077,.012,.012);
  legs.push({leg,knee,shoe,shin,side});
 }
 let palette='';
 function update(p){
  const {x=0,y=0,z=0,t=0,phase=t*8,idle=false,jump=false,velocity=0,slide=0,bank=0,landing=0,riding=false,finish=0,skin,boots=false}=p;
  root.position.set(x,y+(riding?.36:0),z);root.rotation.y=p.angle||0;root.rotation.z=-bank*.18;
  const crouch=Math.max(slide,finish*.65),bob=idle?Math.sin(t*2)*.012:jump?0:Math.abs(Math.cos(phase))*.038;
  hips.position.y=.85-crouch*.36-landing*.10+bob;torso.rotation.x=crouch*.65+(jump?-.12:.08);
  head.rotation.y=idle?Math.sin(t*.65)*.24:-bank*.16;head.rotation.x=jump?-.08:Math.sin(t*2)*.025;
  const stride=idle?0:jump?.12:riding?0:.67;
  for(const {leg,knee,shoe,shin,side} of legs){
   const wave=Math.sin(phase+(side<0?0:Math.PI));
   leg.rotation.x=wave*stride-(jump?.55:0)-crouch*1.2-(riding?1.1:0);
   knee.rotation.x=Math.max(0,-wave)*stride*1.2+(jump?.8:0)+crouch*1.6+(riding?1.45:0);
   shoe.rotation.x=-knee.rotation.x*.20;shin.material=material(boots?'#419ed8':'#365b72');
  }
  for(const {arm,elbow,side} of arms){arm.rotation.x=-Math.sin(phase+(side<0?0:Math.PI))*stride*.7-(jump?.45:0)-(riding?.65:0);arm.rotation.z=side*(.10+crouch*.28);elbow.rotation.x=-.45-crouch*.6-(jump?.45:0);}
  if(skin&&skin.jacket!==palette){coat.material=material('#'+skin.jacket);palette=skin.jacket;}
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
  E(link,i>3?'#f3e3c7':'#dcc19b',0,0,-.09,.13+(i<4?.035:0),.13,-.20*-1);
  tail.push(link);anchor=link;
 }
 function update({x=0,y=0,z=0,t=0,preview=false,angle=0,bank=0,visible=true}){
  root.visible=visible;root.position.set(x,y+Math.sin(t*(preview?2:8))*.012,z);root.rotation.y=angle;root.rotation.z=-bank*.14;
  head.rotation.y=Math.sin(t*1.4)*.08;head.rotation.x=Math.sin(t*2.3)*.025;
  tail.forEach((node,i)=>{node.rotation.y=Math.sin(t*2.4-i*.35)*.15;node.rotation.x=.10+Math.sin(t*1.5-i*.2)*.06;});
 }
 return {root,update};
}
