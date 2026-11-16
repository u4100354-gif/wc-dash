// Scene geometry uses Three.js; gameplay coordinates remain unchanged.
function createWorld(canvas) {
 const stage=createThreeStage(canvas);
 const {cube,puck,bowl,shapes,put,box,round}=stage;
 const runner=createRunner(stage.content),mars=createMarsCat(stage.content);
 const decor=typeof createDepotDecor==='function'?createDepotDecor(stage):{draw(){}};
 const font={K:['101','110','100','110','101'],F:['111','100','110','100','100'],W:['10101','10101','10101','11011','10001'],C:['111','100','100','100','111'],'Л':['011','101','101','101','101'],'И':['101','101','111','111','101'],'Ф':['010','111','111','010','010'],'Т':['111','010','010','010','010'],'М':['10001','11011','10101','10001','10001'],'А':['010','101','111','101','101'],'Р':['110','101','110','100','100'],'С':['111','100','100','100','111'],'У':['101','101','011','001','110'],'П':['111','101','101','101','101'],'Е':['111','100','111','100','111'], '→':['00100','00010','11111','00010','00100']};
 function glyph(ch,a,b,z,p,color,ry=0){const rows=font[ch];if(!rows)return;rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1'){const dx=(i-(row.length-1)/2)*p;box(a+dx*Math.cos(ry),b+(2-j)*p,z-dx*Math.sin(ry),p*.98,p*.98,p*.36,color,ry)}}))}
 function person(a,b,z,angle,t,jump,idle){
  const closing=state==='finish'||state==='win';
  runner.update({x:a,y:b,z,angle,t,phase:runCycle,idle,jump,velocity,
   slide:idle?0:poseSlide,roll:idle?0:rollAge>=0?clamp(rollAge/.8,0,1):0,bank:idle?0:poseBank,landing:idle?0:landing,
   speed:speed(),distance,dirty:!idle&&flowHits>0,
   riding:!idle&&catTime>0&&!flight&&!closing,
   finish:closing?ease((toiletTime-1.28)/.70):0,skin:currentSkin(),boots:bootsTime>0});
 }
 function wc(a,z){
  // Seat height and front edge match the seated hip and the knee clearance.
  round(a,.07,z,.99,.126,1.35,'b4d5ce');round(a,.273,z+.14,.71,.35,.97,'cee2d9');
  put(bowl,a,.315,z,1.64,.504,2.05,'f5f4e6');round(a,.581,z,.66,.021,.91,'69b8b0');
  box(a,.868,z+.80,1.20,.602,.40,'dedfd1');box(a,1.19,z+.8,1.29,.077,.47,'fff8d9');box(a+.33,1.239,z+.78,.19,.035,.1,'69908c');
  box(a,2.69,z+.94,1.62,.74,.16,'124b48');glyph('W',a-.30,2.69,z+.846,.104,'deffa0');glyph('C',a+.32,2.69,z+.846,.104,'deffa0')
 }
 function token(a,z,t,y=.65){const b=y+Math.sin(t*3+z*.08)*.085;round(a,b-.15,z,.77,.13,.77,'fab844');
  for(const [i,r,dy] of [[0,.62,-.01],[-.025,.47,.14],[.035,.32,.27],[.075,.15,.38]])round(a+i,b+dy,z,r,.16,r,'a75c35');
  for(const s of [-1,1]){box(a+s*.11,b+.06,z-.25,.07,.087,.055,'fff2cf');box(a+s*.11,b+.06,z-.28,.032,.045,.024,'372a26')}
 }
 function cat(a,z,t){
  box(a,.32,z,.34,.43,.54,'ce8c4c');box(a,.62,z-.16,.39,.36,.34,'df9d59');
  for(const k of [-1,1]){box(a+.14*k,.84,z-.14,.11,.15,.14,'af7241');box(a+.10*k,.65,z-.345,.045,.064,.03,'32483a');box(a+.13*k,.10,z-.17,.13,.17,.15,'f6d8a2')}
  box(a,.53,z-.35,.17,.09,.03,'f6d8a2');box(a+.16,.54,z+.33,.12,.54,.14,'cb8747',0,.26+.12*Math.sin(t*2))
 }
 function denisCat(a,b,z,t,preview=false){
  mars.update({x:a,y:b,z,t,preview,angle:preview?-2.12:clamp((lane*2.2-x)*.15,-.25,.25),bank:preview?0:poseBank});
 }
 function elevator(side,z){
  const a=side*4.02;
  box(a,1.84,z,.25,3.63,2.89,'394e55');
  for(const k of [-1,1]){box(a-side*.15,1.58,z+k*.64,.14,3.02,1.24,'a2b2ab');box(a-side*.23,1.56,z+k*.48,.035,2.84,.055,'cad6c9')}
  box(a-side*.16,3.27,z,.12,.27,.72,'243c3d');box(a-side*.24,3.27,z,.04,.08,.29,'edac53');
  box(a-side*.16,1.27,z+1.68,.12,.44,.24,'546968');box(a-side*.24,1.31,z+1.68,.04,.09,.10,'d8ed9a')
 }
 function bench(side,z){
  const a=side*3.73;for(const k of [-1,1])box(a,.25,z+k*.74,.48,.45,.13,'375552');
  for(let k=-1;k<=1;k++)box(a+k*.17,.51,z,.15,.13,1.99,'b98050');
  box(a+side*.21,.86,z,.13,.38,1.99,'c59260')
 }
 // Seeded silhouettes keep the courtyard fixed while the player advances.
 function tree(a,z,scale,i){
  round(a-.72,.013,z-.37,3.5*scale,.014,2.1*scale,'9eb78c');
  round(a-.31,.021,z-.18,2.5*scale,.012,1.5*scale,'94af88');
  const trunk='927755',leaf=['71a36e','59986c','8ab473'];
  round(a,1.18*scale,z,.32*scale,2.36*scale,.32*scale,trunk);
  for(let n=0;n<3;n++){
   const dx=(n-1)*.73*scale,dz=Math.sin(i+n)*.45*scale;
   put(stage.sphere,a+dx,(2.24+n%2*.74)*scale,z+dz,(1.8+n%2*.60)*scale,2.0*scale,1.85*scale,leaf[n]);
   put(stage.sphere,a+dx,(2.91+n%2*.74)*scale,z+dz,1.35*scale,.8*scale,1.42*scale,'a9c781')
  }
 }
 function garden(a,z){
  box(a,.25,z,.83,.50,2.10,'b68a67');box(a,.52,z,.91,.10,2.21,'e5c395');
  box(a,.58,z,.72,.05,1.90,'756f51');
  for(let n=0;n<5;n++){const nz=z-.74+n*.37,s=n%2?1:-1;
   box(a+s*.11,.84+n%2*.09,nz,.18,.60,.16,n%2?'799f63':'547e5b',0,s*.30,s*.32);
   box(a-s*.12,.76,nz+.08,.13,.40,.17,'a4bd74',0,-s*.55);
   round(a+s*.13,1.10+n%2*.10,nz,.16,.14,.16,n%3?'e1b269':'cd8b66')
  }
 }
 function atrium(z,i,zone){
  // Open glazing, stone sills, brass transoms and distant courtyard buildings.
  box(4.49,2.89,z,.16,3.86,.10,'58867f');box(4.48,3.66,z,.15,.083,5.01,'688e84');
  box(4.33,1.00,z,.53,.17,4.98,'e2cead');box(4.47,4.64,z,.26,.17,5,'678c80');
  box(4.50,2.73,z-2.45,.23,3.84,.19,'487b72');
  if(i%2===0){const rise=3.0+Math.abs(Math.sin(i*1.72))*4;
   box(16+zone, rise/2,z,3.8,rise,8.8,['d4af90','c99985','d9c4a5'][zone]);
   for(let n=0;n<3;n++)for(let k=0;k<2;k++)box(14.07+zone,1.35+k*1.55,z-2.8+n*2,.06,.75,.86,'7fada8')
  }
  box(10,-.26,z,12,.45,5.01,'b0c793');if(i%2===0)tree(7+(i%3)*.65,z,zone===1?1.11:.88,i)
 }
 function carriage(train,d){
  const z=train.z-d,end=trainEnd(train)-d,a=train.a;
  if(z>110||end < -rearMargin)return;
  const nose=z+train.entry,tail=nose+train.deck,mid=(nose+tail)/2;
  const kind=train.kind||(train.parallel?'freight':train.a<0?'express':'metro');
  const paint=kind==='freight'?'eaa43d':kind==='express'?'ec654a':'299eae';
  box(a,.92,mid,1.92,1.62,train.deck,paint);
  box(a,roofHeight-.10,mid,2.02,.20,train.deck,'e5d6b3');
  if(kind==='freight'){
   for(let rib=nose+.6;rib<tail;rib+=.65)box(a,1.15,rib,1.94,.98,.09,'bd7f32');
   for(const side of [-1,1])box(a+side*.98,1.05,mid,.04,.15,train.deck-.3,'ffdb79');
  }
  if(kind==='express'){
   box(a,1.13,nose-.16,1.67,.65,.19,'243d59');
   box(a,.54,nose-.27,1.70,.25,.30,'f2e8d4');
   box(a,1.73,nose-.10,1.60,.07,.20,'fff1bf');
  }
  for(let rib=nose+1;rib<tail-.5;rib+=1.7)box(a,roofHeight+.012,rib,1.45,.023,.055,'cab78e');
  box(a,1.65,mid,1.94,.06,train.deck,'b5d3b8');
  for(const side of [-1,1]){
   box(a+side*.74,roofHeight+.009,mid,.065,.018,train.deck-.20,'b58e5c');
   for(let windowZ=nose+1.5;kind!=='freight'&&windowZ<tail-.9;windowZ+=2.8){
    box(a+side*.969,1.19,windowZ,.045,.63,1.96,'263f52');
    box(a+side*.996,1.32,windowZ,.03,.19,1.77,'74afb2')
   }
   box(a+side*.98,.64,mid,.055,.095,train.deck,'efba69');
   for(const bogie of [nose+2.2,tail-2.2])box(a+side*.89,.20,bogie,.20,.39,1.4,'353e42');
   for(const endZ of [nose-.055,tail+.055]){
    box(a+side*.42,1.28,endZ,.70,.49,.10,'294955');
    box(a+side*.61,.78,endZ,.22,.15,.12,'ffe4a1')
   }
  }
  for(const back of [false,true]){
   const reach=back?train.exit:train.entry,lip=back?tail:nose;
   if(!reach){
    box(a,roofHeight+.012,lip+(back?-.16:.16),1.90,.024,.22,'e6ac4c');
    for(let i=-2;i<=2;i++)box(a+i*.37,roofHeight+.027,lip+(back?-.16:.16),.16,.012,.21,'644e43');
    continue
   }
   const center=lip+(back?reach:-reach)/2,tilt=(back?1:-1)*Math.atan2(roofHeight,reach);
   box(a,roofHeight/2-.07,center,1.99,.14,Math.hypot(roofHeight,reach),'d4ae6c',0,tilt);
   for(let k=1;k<=5;k++){
    const u=k/6;box(a,roofHeight*(back?1-u:u)+.012,center+(u-.5)*reach,1.92,.030,.090,'765d44',0,tilt)
   }
  }
 }
 function magnetParts(draw){
  draw(0,-.24,.58,.19,'ac3640');draw(0,-.18,.39,.15,'e45354');
  for(const side of [-1,1]){
   draw(side*.22,-.10,.19,.30,'dc5054');draw(side*.22,.11,.19,.21,'f36761');
   draw(side*.22,.27,.20,.14,'f4eed5')
  }
 }
 function powerModel(it,z,t){
  const y=it.y+1.13+.11*Math.sin(3*t+it.z),a=it.a,turn=.30*Math.sin(2*t);
  if(it.type==='key'){
   for(const side of [-1,1])box(a+side*.19,y+.25,z,.10,.40,.11,'45aaf0',turn);
   for(const top of [-1,1])box(a,y+.25+top*.19,z,.38,.10,.11,'73d6ff',turn);
   box(a,y-.18,z,.10,.53,.11,'4ebafa',turn);
   box(a+.10,y-.38,z,.24,.09,.11,'86e3ff',turn);box(a+.08,y-.24,z,.20,.08,.11,'64c9ff',turn)
  }else if(it.type==='boots'){for(const side of [-1,1]){const bx=a+side*.20;box(bx,y,z,.30,.34,.31,'3887bf',turn);box(bx,y-.15,z-.09,.34,.19,.55,'479ccd',turn);box(bx,y-.25,z-.09,.35,.06,.56,'ffdb73',turn)}}else if(it.type==='magnet'){
   magnetParts((dx,dy,w,h,color)=>box(a+dx*Math.cos(turn),y+dy,z-dx*Math.sin(turn),w,h,.20,color,turn))
  }else if(it.type==='wings'){
   round(a,y-.06,z,.87,.66,.81,'f9edd4');round(a,y+.28,z,.96,.09,.90,'fdf4df');
   for(let k=0;k<8;k++){
    const angle=k*Math.PI/4;box(a+.38*Math.sin(angle),y-.07,z+.36*Math.cos(angle),.18,.59,.16,'c94736',angle)
   }
   box(a,y-.02,z-.435,.68,.31,.035,'bd3c31');
   glyph('K',a-.22,y-.02,z-.462,.065,'fff2d6');glyph('F',a,y-.02,z-.462,.065,'fff2d6');glyph('C',a+.22,y-.02,z-.462,.065,'fff2d6');
   for(let k=0;k<4;k++){
    const dx=(k%2-.5)*.34,dz=(Math.floor(k/2)-.5)*.30;
    round(a+dx,y+.37+(k%2)*.06,z+dz,.33,.25,.23,k%2?'d98d3e':'c77732',k*.7,.25);
    box(a+dx+.08,y+.47,z+dz,.10,.19,.10,'f6dcaa',0,0,-.45)
   }
  }else{
   box(a,y,z,.70,.52,.17,'389cab',turn);box(a,y-.29,z,.43,.18,.16,'3598a7',turn);
   box(a,y+.02,z-.11,.10,.37,.04,'e5ffcd');box(a,y+.02,z-.11,.32,.10,.04,'e5ffcd')
  }
 }
 function jetTrail(t){
  const strength=clamp((height+.2)/2,.1,1);
  for(let j=0;j<14;j++){
   const u=(t*1.7+j/14)%1,swirl=u*8+j*.16;
   const width=(.18+.36*Math.sin(u*Math.PI))*(1-.53*u)*strength;
   round(x+.10*Math.sin(swirl)*u,height+.64-u*(1.65*strength+.21),-.23-u*u*2.6,
    width,width*(1.48-.5*u),width,j%3?'fca34e':'e66b37',swirl, .25+u*.59)
  }
 }
 function world(d,menu){
  const start=Math.floor((d-20)/5),end=Math.floor((d+110)/5);
  for(let i=start;i<=end;i++){const z=i*5-d,zone=marathon()?biomeAt(i*5):Math.min(2,Math.max(0,Math.floor(i*5/(length/3))));
   if(level===0&&!menu&&sewerAt(i*5)){drawSewerSection(stage,z,i);continue;}
   const covered=menu?false:((i%48+48)%48>=35&&(i%48+48)%48<39);
   const ceramic=['7aada4','88b5a6','91b587'][zone],wall=['efe6c9','e7e9d9','ebe4c8'][zone];
   for(let l=-1;l<=1;l++){
    box(l*2.2,-.16,z,2.18,.25,5.01,'8e9b9b');
    for(let sleeper=-2;sleeper<=2;sleeper++)box(l*2.2,-.018,z+sleeper*.94,1.82,.12,.24,'716b61');
    for(const side of [-1,1]){
     box(l*2.2+side*.64,.027,z,.09,.14,5.02,'aebdc4');
     box(l*2.2+side*.64,.105,z,.12,.025,5.02,'e1e8dc');
    }
   }
   if(!covered&&i%7===2)for(const side of [-1,1]){
    box(side*4.02,1.72,z,.105,3.44,.105,'43685f');
    box(side*3.68,3.40,z,.74,.10,.16,'43685f');
    round(side*3.35,3.35,z,.47,.13,.42,'f7d08c');
    box(side*4.02,2.43,z-.09,.55,.40,.09,'285e54');glyph('→',side*4.02,2.43,z-.15,.065,'f4dc9a');
   }
   for(const s of [-1,1]){
    box(s*3.9,-.13,z,1.2,.25,4.99,'95aba4');if(s<0&&covered)box(s*4.55,3.25,z,.28,6.5,5,wall);
    else if(s===1&&covered)atrium(z,i,zone);
    else {box(s*17,-.32,z,25.5,.55,5.01,'b3cb91');if((i+(s>0?1:0))%3===0)tree(s*(7.3+.4*Math.cos(i)),z,.91+zone*.12,i);if(i%6===0){
     const rise=4+Math.abs(Math.sin(i*2.3))*4;
     box(s*16,rise/2,z,5,rise,8,['d2b296','d2a18c','c3baa0'][zone]);
     box(s*16,rise+.15,z,5.3,.3,8.3,'ece0c0');
     for(let floor=1;floor<rise-.6;floor+=1.4)for(let w=-1;w<=1;w++)box(s*13.47,floor,z+w*2,.035,.67,.94,'6c9792')
    }}
    box(s*4.36,s>0?.46:.77,z,.12,s>0?.92:1.55,4.95,ceramic);box(s*4.24,s>0?.9:1.48,z,.16,.095,5,'d7b46d');box(s*4.24,.10,z,.17,.16,5,'475d5e');
    for(let n=-2;n<=2;n++)box(s*3.34,.008,z+n*.86,.084,.016,.53,'dbad60');
    if(covered&&s<0&&i%3===0){
     box(s*4.22,1.54,z,.28,3.03,2.01,'365351');box(s*4.04,1.46,z,.14,2.86,1.77,'678688');
     box(s*3.94,1.93,z,.06,.58,1.04,'263f47');box(s*3.92,1.10,z+.56,.1,.13,.27,'e7ba6d');
    }else if(covered&&s<0&&i%3===1){
     box(s*4.10,2.64,z,.22,1.01,1.75,'385e61');box(s*3.95,2.64,z,.082,.83,1.56,'ebb06e');
     for(let n=-1;n<=1;n++)box(s*3.89,2.55+n*.17,z+.1*n,.03,.055,.95-.18*Math.abs(n),'936345')
    }
    if(covered&&i%2===0){box(s*4.12,2.65,z-2.34,.44,5.3,.22,'547575');box(s*3.9,4.25,z-2.34,.06,.63,.27,'ffe3a8')}
   }
   if(covered&&i%2===0)elevator(-1,z+.5);
   if(i%8===4)bench(1,z);
   if(i%(zone===2?2:5)===1)garden(3.91,z);
   if(i%16===6)cat(-3.7,z,clock);
   if(marathon()&&zone===0){
    if(i%8===2){round(-6.2,.25,z,2.5,.46,2.5,'d9d6bf');round(-6.2,.50,z,2.14,.08,2.14,'73cece');round(-6.2,.87,z,.16,.74,.16,'a7e3dc');round(-6.2,1.29+.07*Math.sin(clock*3),z,.28,.19,.28,'d8f6ef')}
    if(i%8===5||i%8===6){box(0,.016,z,7,.045,4.98,'bb9361');for(let plank=-2;plank<=2;plank++)box(0,.041,z+plank,7,.016,.042,'956f4f');for(const side of [-1,1]){box(side*9,-.004,z,8.8,.12,4.99,'72bab8');box(side*3.6,.66,z,.12,.14,5.02,'a57d52');box(side*3.6,.35,z-2.3,.16,.74,.18,'98764f')}}
   }
   if(marathon()&&zone===2){
    box(-5.8,.22,z,3,.42,5.0,'a3b7b1');box(-4.38,.45,z,.19,.05,4.95,'efc361');
    if(i%7===0){box(-3.9,1.83,z,.14,3.65,.15,'456b66');round(-3.9,3.52,z,.97,.15,.97,'2f5350',0,Math.PI/2);round(-3.9,3.52,z-.09,.82,.03,.82,'f5e6bd',0,Math.PI/2);box(-3.98,3.58,z-.12,.21,.057,.03,'35534c',0,0,.55);box(-3.9,3.66,z-.13,.046,.30,.04,'35534c')}
   }
   if(marathon()&&zone===1&&i%3===0){
    const a=i%2?4.3:-4.3;
    for(const k of [-1,1])box(a,1.34,z+k*1.70,.14,2.68,.14,'a17654');
    box(a,.86,z,.94,.24,3.62,'aa8056');
    for(let k=-2;k<=2;k++){box(a,2.64,z+k*.70,1.52,.12,.70,k%2?'dd975a':'f1dcaa');round(a,1.07,z+k*.54,.35,.32,.35,k%2?'a7b36d':'cf804b')}
   }
   if(!covered)continue;
   // Awnings stay over the sidewalks, leaving the roof and flight routes open.
   if(i>=3){
    for(const side of [-1,1]){
     box(side*4.74,5.43,z,1.32,.20,5.01,'a9bfad');
     if(i%2===0)box(side*4.64,5.22,z,.61,.11,1.45,'fff1ba')
    }
    continue
   }
   if(zone===0)box(0,5.50,z,9.2,.24,5.01,'abc1b4');
   else{box(-2.65,5.50,z,3.9,.22,5.01,'ced2b7');box(.78,5.55,z,.13,.16,5.01,'719e94');box(3.32,5.55,z,.13,.16,5.01,'719e94')}
   if(zone===2&&i%4===0){for(const side of [-1,1]){box(side*3.92,2.34,z,.24,4.68,.44,'b69369');box(side*2.90,4.55,z,2.16,.24,.46,'c6a47c',0,0,-side*.23)}box(0,4.85,z,4.04,.23,.46,'d0ad82')}

   if(i%2===0){box(0,5.19,z-2.3,8.5,.35,.25,'475f5d');box(0,5.11,z,2.9,.17,1.04,'344e50');box(0,5.0,z,2.7,.065,.85,'fff2c6')}
   box(-3.40,4.84,z,.19,.19,5.03,'a76c49');box(-3.12,4.86,z,.12,.12,5.03,'c89462');
  }
 }
 function render(wallDt=1/60){
  const w=canvas.clientWidth,h=canvas.clientHeight,ratio=Math.min(devicePixelRatio||1,w<680?2:1.75);
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}
  const menu=state==='menu',mobile=w<680,t=menu?clock:elapsed,d=menu?0:distance;
  const closing=state==='finish'||state==='win',cinema=closing?ease(toiletTime/1.7):0;
  const yaw=menu?.46:cinema*.70, pitch=menu?.10:.13+cameraLift*.015;
  let f=menu?Math.min(h*1.24,w*1.50):Math.min(h*.92,w*1.10);
  const eye=[menu?(mobile?-3.0:-2.15):x*(mobile?.38:.16)-3.55*cinema,menu?(mobile?2.0:1.77):3.15+cameraLift*1.07-.89*cinema,menu?(mobile?(h<600?-8.2:-6.6):-4.20):-6.25-cameraLift*.30+2.15*cinema],offsetX=menu?(mobile?.22:.40):0,offsetY=menu?(mobile?(h<600?.64:.52):-.04):-.05;
  shapes.forEach(sh=>sh.used=0);mars.root.visible=false;world(d,menu);decor.draw(d,menu);
  stage.setSewer?.(level===0&&!menu?sewerBlendAt(d):0);
  const heroX=menu?0:x,heroZ=closing?.16*ease(toiletTime/.80)+.65*ease((toiletTime-1.94)/.54):0;
  person(heroX,menu?0:height,heroZ,menu?-2.32:closing?Math.PI*ease((toiletTime-.66)/.61):clamp((lane*2.2-x)*.15,-.25,.25),t,!grounded(),menu);
  if(menu){denisCat(.84,0,.05,t,true);wc(mobile?1.70:2.25,3.85);token(-1.3,1.8,t)}
  else{
   for(const f of flows){
    if(f.passed)continue;
    if(f.front===null){
     if(f.warned&&!flight)for(let n=2;n<19;n+=3)box(f.a,.034,n,1.28,.027,.24,'e78a46');
     continue
    }
    const front=f.front-d;
    drawSewerFlow(stage,f,front,t);
    for(const pickup of f.tokens||[])if(!pickup.done)token(f.a,front+pickup.offset,t,(f.top??1.48)+.65);
   }
   for(const train of trains)carriage(train,d);
   if(!closing&&!flight&&catTime>0)denisCat(x,height,-.2,t);
   if(flight)jetTrail(t);
   if(length-d<66)wc(0,length-d+1.65);
   for(let idx=firstNearby;idx<items.length&&items[idx].z<d+90;idx++){const it=items[idx],z=it.z-d,a=it.a;
    if((it.done&&!isBarrier(it.type))||(it.type==='letter'&&!activeWord()))continue;
    if(it.type==='letter'){let ch=letterFor(it);if(!ch)continue;let b=it.y+1.28+.06*Math.sin(t*3+z*.07),turn=.30*Math.sin(t*1.6+it.z);
     box(a,b,z,.70,.74,.21,'127668',turn);box(a-.125*Math.sin(turn),b,z-.125*Math.cos(turn),.62,.65,.052,'cdf194',turn);
     glyph(ch,a-.17*Math.sin(turn),b,z-.17*Math.cos(turn),.093,'204f4b',turn)
    }else if(it.type==='poo'){
     const pull=!flight&&magnet>0&&Math.abs(height+.70-it.y)<2.9&&z>=-2.2?clamp((7-z)/5,0,1):0;
     token(a+(x-a)*pull,z,t,it.y+(height+.70-it.y)*pull);
    }else if(!isBarrier(it.type))powerModel(it,z,t);
    else if(it.type==='crate'){
     box(a,.43,z,1.42,.85,1.08,'ca925d');box(a,.862,z,.23,.025,1.09,'eed099');box(a,.45,z-.55,.23,.83,.024,'e6be88');box(a-.37,.26,z-.558,.27,.22,.026,'fae4bf')
    }else if(it.type==='wall'){
     box(a,2.5,z,2.0,5,.32,'b3835a');
     box(a,2.5,z-.17,1.7,3.8,.04,'e3b979');
    }else if(it.type==='hurdle'){
     const middle=(hurdleBottom+hurdleTop)/2;
     for(const side of [-1,1]){
      box(a+side*.99,.070,z,.22,.14,.47,'354e55');
      box(a+side*.99,middle*.50,z,.105,middle,.15,'427b78')
     }
     box(a,middle,z,2.07,hurdleTop-hurdleBottom,.18,'e3a744');
     for(let k=-2;k<=2;k++)box(a+k*.40,middle,z-.093,.19,.21,.026,'f8e4a8',0,0,-.35)
    }else{
     const middle=(barBottom+barTop)/2;
     for(const side of [-1,1]){box(a+side*.92,.1,z,.32,.18,.55,'345054');box(a+side*.92,barTop/2,z,.14,barTop,.15,'597471')}
     box(a,middle,z,2.04,barTop-barBottom,.29,'ecaa48');
     for(let k=-2;k<=2;k++)box(a+k*.39,middle,z-.16,.19,barTop-barBottom-.10,.045,'584d40');
     box(a,barTop+.04,z,2.12,.08,.34,'f7d58b')
    }
   }
  }
  if(!menu&&grounded()&&poseSlide>.2&&state==='run'){
   for(let j=0;j<6;j++){const u=(t*3+j/6)%1;const k=(1-u)*poseSlide;
    round(x+Math.sin(j*4)*(.22+.32*u),ground+.09+u*.14,-.38-u*1.15,.16*k,.09*k,.24*k,'daceab')}
  }
  if(closing&&toiletTime>2.36&&toiletTime<3.70){
   for(let j=0;j<7;j++){const u=(toiletTime-2.36+j/7)%1,ph=j*2.4+u*3;
    round(Math.cos(ph)*.69,1.06+.40*Math.sin(u*Math.PI),1.65+Math.sin(ph)*.72,.086,.12,.086,'9ce0d7')}
  }
  if(!menu)for(const e of flecks){
   const age=elapsed-e.at;if(age<0||age>.43)continue;
   const k=1-age/.43,sz=.082*k;
   box(e.x+e.vx*age,e.y+e.vy*age-3.5*age*age,e.z-d+e.vz*age,sz,sz*1.6,sz,e.color,age*6,age*4)
  }
  stage.draw({w,h,f,eye,yaw,pitch,offsetX,offsetY,wallDt});
 }
 render.engine='three.js';render.stage=stage;
 return render;
}
