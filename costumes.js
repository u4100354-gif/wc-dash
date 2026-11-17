// Fittings share the new head, torso and limb anchors. Every garment has a
// palette role; selecting a skin never leaves details in the classic orange.
function createRunnerWardrobe(a){
 const {T,material,E,S,J,head,torso,arms,hair,headEars,hood,backpack,strings,pocket}=a;
 const groups=new Map(),capes=[],ribbons=[],bareHands=arms.flatMap(l=>[...l.hand.children]);
 const defaults={jacket:'ed7541',trim:'ff9e60',accent:'edb84e',hat:'216660',hatTop:'369486',pants:'294d65'};
 const role=(mesh,key)=>{mesh.userData.clothingRole=key;return mesh};
 const ell=(p,key,...v)=>role(E(p,'#'+defaults[key],...v),key);
 const box=(p,key,x,y,z,w,h,d)=>{
  const geo=typeof RoundedBoxGeometry==='function'?new RoundedBoxGeometry(w,h,d,2,.012):new T.BoxGeometry(w,h,d);
  const mesh=role(new T.Mesh(geo,material('#'+defaults[key])),key);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;p.add(mesh);return mesh;
 };
 const ring=(p,key,x,y,z,r,t,sy=1)=>{
  const mesh=role(new T.Mesh(new T.TorusGeometry(r,t,10,40),material('#'+defaults[key])),key);
  mesh.position.set(x,y,z);mesh.scale.y=sy;p.add(mesh);return mesh;
 };
 function group(kind,parent,suffix=''){
  const node=J(parent,'outfit-'+kind+suffix,0,0,0);node.visible=false;
  if(!groups.has(kind))groups.set(kind,[]);groups.get(kind).push(node);return node;
 }
 function panel(p,key,y0,y1,halfAngle=Math.PI){
  const positions=[],indices=[];
  for(let row=0;row<2;row++)for(let i=0;i<=40;i++){
   const y=row?y1:y0,u=-halfAngle+2*halfAngle*i/40,r=Math.sqrt(Math.max(0,1-((y-.27)/.35)**2));
   positions.push((.25*r+.005)*Math.sin(u),y,(.165*r+.008)*Math.cos(u));
   if(row===0&&i<40){const n=i;indices.push(n,n+1,n+41,n+1,n+42,n+41);}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=role(new T.Mesh(geo,material('#'+defaults[key])),key);mesh.castShadow=true;p.add(mesh);return mesh;
 }
 function gloves(kind){
  for(const {hand,side} of arms){const g=group(kind,hand,side<0?'-glove-left':'-glove-right');
   ell(g,'trim',0,-.027,0,.060,.088,.045);ell(g,'trim',-side*.052,-.012,.025,.029,.049,.031);
  }
 }
 for(const kind of ['courier','space','ninja','fire','polar','punk','chef','cyber','pirate','royal']){
  const h=group(kind,head),body=group(kind,torso,'-body');
  if(kind==='courier'){
   ell(h,'hat',0,.205,-.025,.257,.125,.226);ell(h,'hatTop',0,.168,.205,.26,.026,.19);
   box(h,'accent',0,.235,.204,.11,.065,.025);box(body,'accent',-.12,.38,.16,.095,.10,.018);
   panel(body,'trim',.06,.10);
  }else if(kind==='space'){
   ell(h,'hat',0,.025,-.055,.285,.305,.235);
   ring(h,'hatTop',0,.025,.13,.272,.027,1.08);
   const glass=new T.Mesh(new T.SphereGeometry(.285,40,28,0,Math.PI),new T.MeshPhysicalMaterial({color:'#9bd7e2',transparent:true,opacity:.24,roughness:.10,metalness:.08,depthWrite:false,side:T.DoubleSide}));
   glass.name='helmetVisor';glass.position.set(0,.025,.11);glass.scale.set(1,1.08,.90);h.add(glass);
   for(const side of [-1,1])ell(h,'accent',side*.285,.025,.015,.032,.073,.078);
   box(body,'hat',0,.31,.165,.23,.20,.035);
   for(let n=0;n<3;n++)box(body,n===2?'accent':'hatTop',-.065+n*.065,.33,.19,.035,.035,.014);
   for(const side of [-1,1]){const tank=S(body,'#d9e3dd',side*.095,.29,-.245,.067,.36);tank.userData.clothingRole='hat';}
   panel(body,'accent',.075,.11);gloves(kind);
  }else if(kind==='ninja'){
   ell(h,'hat',0,.015,-.065,.259,.286,.216);ell(h,'jacket',0,-.115,.183,.228,.108,.075);
   box(h,'accent',0,.12,.205,.42,.047,.035);
   for(const side of [-1,1]){const r=box(h,'accent',side*.06,.10,-.24,.07,.21,.018);r.rotation.z=side*.25;ribbons.push({node:r,side});}
   panel(body,'accent',.06,.11);gloves(kind);
  }else if(kind==='fire'){
   ell(h,'hat',0,.205,-.025,.273,.162,.245);ell(h,'hatTop',0,.14,0,.312,.025,.285);
   ell(h,'hat',0,.005,-.232,.235,.15,.04);box(h,'accent',0,.22,.222,.095,.10,.022);
   panel(body,'accent',.15,.205);panel(body,'accent',.39,.425);
   for(const {arm,side} of arms){const g=group(kind,arm,side<0?'-sleeve-left':'-sleeve-right');box(g,'accent',side*.095,-.12,.018,.025,.08,.13);}
   gloves(kind);
  }else if(kind==='polar'){
   ell(h,'hat',0,.015,-.045,.28,.31,.255);ring(h,'accent',0,.01,.16,.267,.038,1.11);
   for(const side of [-1,1])ell(body,'accent',side*.13,.59,-.015,.11,.055,.135);
   box(body,'hatTop',-.12,.36,.16,.075,.085,.018);panel(body,'trim',.07,.115);gloves(kind);
  }else if(kind==='punk'){
   for(let i=0;i<6;i++)ell(h,'accent',0,.285,-.18+i*.065,.044,.11+(i%2)*.025,.052);
   for(const side of [-1,1]){
    ring(h,'accent',side*.263,-.07,0,.042,.009);
    const g=group(kind,arms.find(l=>l.side===side).arm,side<0?'-studs-left':'-studs-right');
    for(let n=0;n<3;n++)ell(g,'hatTop',side*.105,-.03-n*.055,.045,.018,.018,.018);
   }
   panel(body,'hat',.075,.115);box(body,'accent',-.11,.36,.165,.065,.13,.016).rotation.z=-.25;
  }else if(kind==='chef'){
   ell(h,'hat',0,.207,-.025,.251,.073,.227);
   for(const side of [-1,0,1])ell(h,'hatTop',side*.12,.315,-.01,.145,.145,.205);
   panel(body,'hatTop',.08,.49,.78);
   for(let n=0;n<3;n++)for(const side of [-1,1])ell(body,'accent',side*.066,.21+n*.08,.178,.014,.014,.01);
   panel(body,'accent',.08,.11);
  }else if(kind==='cyber'){
   ell(h,'hat',0,.035,.215,.238,.072,.035);
   const glass=new T.Mesh(new T.SphereGeometry(1,24,12),new T.MeshStandardMaterial({color:'#6ce4c7',transparent:true,opacity:.48,roughness:.15,depthWrite:false}));
   glass.position.set(0,.035,.252);glass.scale.set(.217,.045,.022);h.add(glass);
   box(h,'accent',0,.074,.252,.40,.009,.012);
   for(const {arm,side} of arms){const g=group(kind,arm,side<0?'-arm-left':'-arm-right');ell(g,'hat',side*.083,-.10,0,.04,.14,.105);box(g,'accent',side*.118,-.10,.02,.012,.11,.04);}
   for(const side of [-1,1])box(body,'accent',side*.14,.35,.152,.019,.18,.014).rotation.z=side*.20;
   gloves(kind);
  }else if(kind==='pirate'){
   const positions=[],indices=[];
   for(let row=0;row<2;row++)for(let i=0;i<=48;i++){
    const angle=i/48*Math.PI*2,fold=(1-Math.cos(angle*3))/2,r=row?.30+.055*Math.cos(angle*3):.17;
    positions.push(Math.sin(angle)*r,.205+(row?fold*.065:0),Math.cos(angle)*r-.015);
    if(row===0&&i<48)indices.push(i,i+49,i+1,i+1,i+49,i+50);
   }
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
   const brim=role(new T.Mesh(geo,material('#'+defaults.hat).clone()),'hat');brim.material.side=T.DoubleSide;h.add(brim);
   ell(h,'hatTop',0,.268,-.035,.228,.115,.205);box(h,'accent',0,.25,.176,.07,.055,.022);
   E(h,'#30333b',-.087,.025,.244,.063,.063,.026);const strap=S(h,'#30333b',-.04,.055,.205,.009,.39);strap.rotation.z=-.48;
   const belt=box(body,'hat',0,.29,.169,.073,.44,.018);belt.rotation.z=-.37;
   panel(body,'accent',.08,.105);
  }else{
   const band=ring(h,'hat',0,.248,.005,.252,.026,1);band.rotation.x=Math.PI/2;
   for(let i=0;i<7;i++){
    const angle=i/7*Math.PI*2;
    const point=role(new T.Mesh(new T.ConeGeometry(.046,.15,4),material('#'+defaults.hatTop)),'hatTop');point.position.set(Math.sin(angle)*.252,.32,Math.cos(angle)*.252+.005);h.add(point);
   }
   ell(h,'accent',0,.255,.278,.028,.036,.015);
   const positions=[],indices=[];
   for(let row=0;row<=8;row++)for(let col=0;col<=8;col++){
    const v=row/8,u=col/8;positions.push((u-.5)*(.38+v*.17),.55-v*.63,-.205-v*.07);
    if(row<8&&col<8){const n=row*9+col;indices.push(n,n+1,n+9,n+1,n+10,n+9);}
   }
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
   const cape=role(new T.Mesh(geo,material('#'+defaults.trim)),'trim');cape.material=cape.material.clone();cape.material.side=T.DoubleSide;body.add(cape);capes.push(cape);
   for(const side of [-1,0,1])ell(body,'accent',side*.13,.55,-.13,.10,.05,.105);
  }
 }
 function update(skin={},p={}){
  const kind=skin.kind||'classic';
  for(const [name,nodes] of groups)for(const node of nodes)node.visible=name===kind;
  hair.visible=['classic','cyber','royal'].includes(kind);
  for(const ear of headEars)ear.visible=!['space','ninja','polar'].includes(kind);
  hood.visible=['classic','courier','punk','pirate'].includes(kind);
  for(const node of backpack)node.visible=['classic','courier','polar','cyber'].includes(kind);
  for(const node of strings)node.visible=['classic','courier','polar'].includes(kind);
  pocket.visible=!['space','ninja','chef','cyber','royal'].includes(kind);
  for(const node of bareHands)node.visible=!['space','ninja','polar','fire','cyber'].includes(kind);
  const phase=p.idle?(p.t||0)*2:(p.phase??(p.t||0)*17);
  for(const {node,side} of ribbons)node.rotation.x=.25+Math.sin(phase*.4+side)*.10;
  if(kind==='royal')for(const cape of capes){
   const pos=cape.geometry.attributes.position;
   for(let row=0;row<=8;row++)for(let col=0;col<=8;col++){const v=row/8;pos.setZ(row*9+col,-.205-v*.07+Math.sin(phase*.4-v*3+col*.25)*.022*v);}
   pos.needsUpdate=true;cape.geometry.computeVertexNormals();
  }
 }
 update();return {update};
}
