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
 const destinationSigns=levelCatalog.map((route,index)=>index===0?signs:[
  {z:9,mesh:label(route.name.toUpperCase(),'#287d85')},
  ...[.34,.68].map((fraction,i)=>({z:Number.isFinite(route.meters)?route.meters*fraction:300+i*300,mesh:label(route.sections?.[i+1]?.toUpperCase()||'МАРАФОН','#347461')})),
  ...(Number.isFinite(route.meters)?[{z:route.meters-19,mesh:label('WC  •  ВЫХОД →','#26775f')}]:[])
 ]);
 const allSigns=destinationSigns.flat();
 function landscape(d,theme,t){
  // Three depth layers: readable track furniture, a lived-in neighbourhood,
  // then a continuous skyline. All of it stays outside the playable lanes.
  for(let i=Math.floor((d-36)/36);i<=Math.ceil((d+145)/36);i++){
   const z=i*36-d,seed=Math.abs(i*17+11),h=7+seed%7;
   for(const side of [-1,1]){
    const water=theme==='harbor'&&side<0;
    box(side*41,-.50,z,42,.60,36.1,water?'548f9d':theme==='garden'?'83ad7b':'9bb5a0');
    if(water){
     box(-34,-.14,z,41,.12,36.1,'579fac');
     for(let n=0;n<8;n++)box(-19-n%3*9,-.07,z-15+n*4,3+n%2*3,.025,.08,'a4d4cc');
     // Cargo launch with cabin, windows, fenders and a mast.
     box(-30,.5,z+6,3,1.1,9,'355b6c');box(-30,1.1,z+4,2.3,.14,5,'e9d8ae');
     box(-30,1.9,z+3,1.9,1.5,2,'edc487');box(-30,2.2,z+1.98,1.45,.55,.04,'33758b');
     box(-30,3,z+4,.08,3.6,.08,'dfd6b5');
    }else{
     const col=theme==='terminal'?['b99e94','d0b6a0','859da8'][seed%3]:['a9c3b5','d7c7ad','adc7cf'][seed%3];
     box(side*(28+seed%3*3),h/2,z,7,h,12,col);box(side*(28+seed%3*3),h+.1,z,7.4,.25,12.4,'e7dfc5');
     for(let floor=1;floor<h;floor+=1.8)for(let n=-2;n<=2;n++)box(side*(24.45+seed%3*3),floor,z+n*2,.05,.8,.85,theme==='terminal'?'f9d78c':'65959e');
     // Rounded distant hills close the horizon behind the buildings.
     ball(side*58,-2,z+14,43,16+seed%4*3,38,theme==='garden'?'71a384':'91b5a9');
    }
   }
   if(theme==='harbor'){
    for(let n=0;n<3;n++){
     const x=15+n*2.6;box(x,.95,z,2.5,1.9,9,['cc7550','467f91','bba04e'][n]);
     for(let r=-3;r<=3;r++)box(x+1.26,1,z+r,.025,1.5,.05,'edd6a3');
    }
    // Quayside gantry with cables, a hanging container and a moving flag.
    box(-16,7,z,.65,14,.65,'dfb04d');box(-12.5,13.5,z,13,.55,.65,'edc264');
    box(-19,10,z,.09,7,.09,'466c71');box(-19,6.1,z,3,1.9,5,'ce7750');
    box(-15.7,14.8,z,.06,3,.06,'f0dfb8');box(-15.1,15.5,z,.95,.55,.045,'e47853',0,0,Math.sin(t*3+i)*.05);
   }else if(theme==='sewer'){
    for(const side of [-1,1]){
     round(side*18,2.9,z,4.3,5.8,4.3,'a7b5a0');round(side*18,5.85,z,4.6,.18,4.6,'d4c8a7');
     box(side*18,6.8,z,.14,2,.14,'bcbda5');
     round(side*14,1,z,.8,12,.8,'957c52',0,Math.PI/2);
     for(let n=0;n<4;n++)box(side*16,1.1+n*.7,z-2.25,.9,.08,.10,'d3d1b4');
    }
   }else if(theme==='garden'){
    for(const side of [-1,1]){
     box(side*18,.25,z,6,.5,15,'c3bd96');box(side*18,.52,z,5.7,.06,14.7,'668b60');
     for(let n=-2;n<=2;n++){
      ball(side*(18+Math.sin(n*8)*1.4),2.6,z+n*2.5,2.6,3.4,2.8,n%2?'91b67c':'baad9e');
      round(side*(18+Math.sin(n*8)*1.4),1,z+n*2.5,.22,2,.22,'8b795a');
     }
     if(i%2===0){
      for(const end of [-1,1])box(side*12,2,z+end*3,.2,4,.2,'e7d7ad');
      for(let slat=-3;slat<=3;slat++)box(side*12,4.1,z+slat,.12,.18,7,'e7d7ad',Math.PI/2);
      ball(side*12,4.2,z,4,.5,7,'85b77c');
     }
    }
   }else if(theme==='terminal'&&i%2===0){
    // Distinct clock tower and lit station concourse beyond the fence.
    box(18,5,z,5,10,5,'c9a27e');box(18,10.2,z,5.6,.5,5.6,'f5dfb2');box(18,11,z,3,1.3,3,'3f7775');
    round(18,8.25,z-2.55,2.2,.12,2.2,'f8e9bb',0,Math.PI/2);
    box(18,8.6,z-2.63,.07,.72,.04,'315d63');box(18.28,8.25,z-2.64,.64,.07,.04,'315d63');
    box(-18,2,z,8,4,15,'78a6aa');box(-18,4.2,z,8.5,.4,15.5,'e6d8b5');
    for(let n=-3;n<=3;n++)box(-13.9,1.9,z+n*2,.08,2.7,1.4,'f1d18c');
   }else if(theme==='depot'||theme==='marathon'){
    // Small courtyards, parked vehicles and terraces make the depot inhabited.
    box(-20,.15,z,8,.25,17,'d3c8a8');
    for(let n=-1;n<=1;n++){
     box(-20+n*2.4,.65,z,1.65,.85,3.4,['d28f65','548fa3','b8bc7f'][n+1]);
     box(-20+n*2.4,1.24,z,1.35,.62,1.7,'b9d1c1');
     box(-20+n*2.4,1.23,z-.87,1.15,.40,.03,'376c81');
    }
   }
  }
 }
 function draw(d,menu){
  const visibleSigns=destinationSigns[level],theme=levelCatalog[level].theme;
  landscape(d,theme,menu?clock:elapsed);
  for(const sign of allSigns){sign.mesh.visible=visibleSigns.includes(sign)&&sign.z-d>-18&&sign.z-d<110;if(sign.mesh.visible)sign.mesh.position.set(0,9.8,sign.z-d);}
  const from=Math.floor((d-20)/24),to=Math.ceil((d+110)/24);
  for(let i=from;i<=to;i++){
   const z=i*24-d;
   if(!menu&&routeSewerAt(i*24))continue;
   for(const side of [-1,1]){
    const a=side*6.2;
    // Chunky, colorful street façades beyond the safety fence.
    const height=4.5+((i*i+3)%4)*.9,paint=(theme==='sewer'?['a7ab91','a6b8a4','8dafa8','b1b59d']:theme==='harbor'?['bba879','c8ad8c','78a3a3','a3b3aa']:['e7b36f','ea9977','78b7ac','91b4d1'])[(i%4+4)%4];
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
  for(const sign of visibleSigns){const z=sign.z-d;if(z<-18||z>110)continue;
   for(const side of [-1,1]){box(side*3.85,5.3,z,.17,10.6,.2,'2a7d87');box(side*3.85,.25,z,.5,.5,.55,'e2c99c');}
   box(0,10.5,z,7.9,.24,.27,'277582');box(0,10.70,z,7.9,.08,.28,'ffcf7a');
  }
 }
 return {draw};
}
