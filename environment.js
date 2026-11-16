// Station landmarks are decorative: all collision geometry stays in the route.
function createDepotDecor(stage){
 const {box,round,put,sphere}=stage;
 const ball=(...a)=>put(sphere,...a);
 const signs=[];
 function label(text,color){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;
  const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,768,192);
  ctx.strokeStyle='#ffffff88';ctx.lineWidth=5;ctx.strokeRect(12,12,744,168);
  ctx.fillStyle='#fff8dd';ctx.font='bold 74px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,101);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(3.8,.95),new THREE.MeshStandardMaterial({map:texture,roughness:.7,side:THREE.DoubleSide}));
  mesh.rotation.y=Math.PI;stage.content.add(mesh);return mesh;
 }
 for(const [z,text,color] of [[8,'СОЛНЕЧНОЕ ДЕПО','#187e8d'],[174,'ЭКСПРЕСС  •  02','#df6248'],[354,'МАРС  •  ПЛАТФОРМА 3','#237e7a'],[525,'ГРУЗОВАЯ СТАНЦИЯ','#bd7d30'],[701,'WC  •  ВЫХОД →','#26775f']])signs.push({z,mesh:label(text,color)});
 function draw(d,menu){
  for(const sign of signs){sign.mesh.visible=sign.z-d>-18&&sign.z-d<110;sign.mesh.position.set(0,9.8,sign.z-d);}
  const from=Math.floor((d-20)/24),to=Math.ceil((d+110)/24);
  for(let i=from;i<=to;i++){
   const z=i*24-d;
   for(const side of [-1,1]){
    const a=side*6.2;
    // Chunky, colorful street façades beyond the safety fence.
    const height=4.5+((i*i+3)%4)*.9,paint=['e7b36f','ea9977','78b7ac','91b4d1'][(i%4+4)%4];
    box(side*10.5,height/2,z,4,height,13,paint);box(side*10.5,height+.13,z,4.3,.28,13.3,'fff1d1');
    for(let floor=1;floor<height-.5;floor+=1.5)for(let w=-2;w<=2;w++){
     box(side*8.46,floor,z+w*2,.12,.93,1.25,'f8ebd0');
     box(side*8.38,floor+.025,z+w*2,.06,.72,1.00,'367b92');
     box(side*8.33,floor-.04,z+w*2,.035,.045,1.02,'dfefdb');
    }
    // Platforms, support columns and alternating striped awnings.
    if((i%5+5)%5<3){
     box(a,.16,z,3.1,.35,16,'d8d1bc');box(side*4.72,.36,z,.20,.05,15.9,'ffd062');
     for(const end of [-1,1]){box(side*7.2,2.15,z+end*6,.18,4.3,.18,'277e88');box(side*6.1,4.24,z+end*6,2.5,.17,.22,'277e88');}
     for(let stripe=-6;stripe<=6;stripe++)box(a,4.37,z+stripe*1.1,3.7,.15,1.1,stripe%2?'e77b4f':'fff1cf',0,0,-side*.045);
     box(side*4.4,4.18,z,.08,.30,14.4,'f5d9a4');
    }
    if(i%2===0){
     // Signal lamps and trackside equipment establish a railway silhouette.
     box(side*3.7,1.65,z,.12,3.3,.12,'365766');box(side*3.7,3.0,z,.43,.95,.29,'253f4e');
     for(let n=0;n<2;n++)ball(side*3.7,3.18-n*.36,z-.17,.22,.22,.09,n?'ffc857':'80e9b5');
     box(side*3.7,1.4,z,.50,.32,.08,'efb84e');
    }
    if(i%3===0){
     box(side*5.1,.75,z+7,1.0,1.5,.75,'42a3ad');box(side*5.1,1.54,z+7,1.07,.10,.82,'f8db99');
     box(side*5.1,1.13,z+6.60,.65,.24,.035,'24586d');
     ball(side*6.4,.7,z+8,.9,1.2,.9,'77a764');ball(side*6.65,1.0,z+8.1,.75,.8,.7,'8fc57a');
    }
   }
  }
  // Gantries are safely above the highest flight pose.
  for(const sign of signs){const z=sign.z-d;if(z<-18||z>110)continue;
   for(const side of [-1,1]){box(side*3.85,5.3,z,.17,10.6,.2,'2a7d87');box(side*3.85,.25,z,.5,.5,.55,'e2c99c');}
   box(0,10.5,z,7.9,.24,.27,'277582');box(0,10.70,z,7.9,.08,.28,'ffcf7a');
  }
 }
 return {draw};
}
