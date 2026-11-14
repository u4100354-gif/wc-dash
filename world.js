// Geometric meshes share one instance buffer per shape. Camera looks down +Z.
function createWorld(canvas) {
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'high-performance'});
 const soft=gl?null:canvas.getContext('2d');
 function shader(type,source){
  const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;
 }
 let U;
 if(gl){
 const program=gl.createProgram();
 gl.attachShader(program,shader(gl.VERTEX_SHADER,`#version 300 es
 layout(location=0) in vec3 pos; layout(location=1) in vec3 norm;
 layout(location=2) in vec3 origin;layout(location=3) in vec3 size;
 layout(location=4) in vec4 turn;layout(location=5) in vec3 pigment;
 uniform vec3 eye;uniform vec4 basis;uniform vec4 lens;
 out vec3 color;out float depth;
 vec3 rotatePart(vec3 p){p.yz=mat2(turn.w,turn.z,-turn.z,turn.w)*p.yz;
 return vec3(p.x*turn.y+p.z*turn.x,p.y,-p.x*turn.x+p.z*turn.y);}
 void main(){
 vec3 world=origin+rotatePart(pos*size),d=world-eye;
 float z=dot(d.xz,basis.xy),cx=dot(d.xz,vec2(basis.y,-basis.x));
 float cy=d.y*basis.w+z*basis.z; depth=z*basis.w-d.y*basis.z;
 gl_Position=vec4(cx*lens.x+depth*lens.z,cy*lens.y+depth*lens.w,depth*1.002-0.18,depth);
 vec3 n=normalize(rotatePart(norm/size));
 float light=.74+.34*max(dot(n,normalize(vec3(-.65,.92,-.46))),0.);
 float pool=.92+.06*cos(world.z*.6283185)+.045*cos(world.x*.58);
 color=pigment*light*pool+vec3(.06,.036,.014)*max(0.,-n.z);
 }`));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`#version 300 es
 precision mediump float;in vec3 color;in float depth;out vec4 outColor;
 void main(){outColor=vec4(mix(color,vec3(.26,.36,.36),smoothstep(17.,74.,depth)*.9),1.);}`));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 gl.useProgram(program);gl.enable(gl.DEPTH_TEST);
 U=Object.fromEntries(['eye','basis','lens'].map(n=>[n,gl.getUniformLocation(program,n)]));
 }
 function mesh(surfaces){
  if(!gl)return {surfaces:surfaces.map(vertices=>({vertices})),data:new Float32Array(4096*13),used:0};
  const data=[];
  for(const f of surfaces){const [a,b,c]=f,ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]);
   const n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
   for(let i=1;i+1<f.length;i++)for(const v of [a,f[i],f[i+1]])data.push(...v,...n);
  }
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
  for(let i=0;i<2;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,24,i*12)}
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [loc,sz,off] of [[2,3,0],[3,3,3],[4,4,6],[5,3,10]]){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,sz,gl.FLOAT,false,52,off*4);gl.vertexAttribDivisor(loc,1)}
  return {vao,buffer,count:data.length/6,data:new Float32Array(4096*13),used:0}
 }
 const cube=mesh([[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],[[0,0,1],[0,1,1],[0,1,0],[0,0,0]],[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],[[1,0,1],[1,1,1],[0,1,1],[0,0,1]],[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]].map(face=>face.map(v=>v.map(n=>n-.5))));
 // A revolved profile produces the solid pedestal, open porcelain bowl and coils.
 function lathe(profile,sides){
  const faces=[],pt=(i,[r,y])=>[r*Math.cos(i*Math.PI*2/sides),y,r*Math.sin(i*Math.PI*2/sides)];
  for(let j=0;j+1<profile.length;j++)for(let i=0;i<sides;i++){
   let a=pt(i,profile[j]),b=pt(i,profile[j+1]),c=pt(i+1,profile[j+1]),d=pt(i+1,profile[j]);
   faces.push(profile[j][0]===0?[a,b,c]:profile[j+1][0]===0?[a,b,d]:[a,b,c,d]);
  }return mesh(faces)
 }
 const puck=lathe([[0,-.5],[.5,-.5],[.5,.5],[0,.5]],12);
 const bowl=lathe([[0,0],[.25,.035],[.34,.2],[.49,.75],[.50,.88],[.46,1],[.38,.98],[.34,.72],[.15,.40],[0,.39]],20);
 const shapes=[cube,puck,bowl],colors=new Map();
 function put(sh,a,b,z,sx,sy,sz,col,ry=0,rx=0){
  if(!colors.has(col)){const v=parseInt(col,16);colors.set(col,[(v>>16)/255,((v>>8)&255)/255,(v&255)/255])}
  let k=sh.used*13;if(k+13>sh.data.length){let next=new Float32Array(sh.data.length*2);next.set(sh.data);sh.data=next}
  sh.data.set([a,b,z,sx,sy,sz,Math.sin(ry),Math.cos(ry),Math.sin(rx),Math.cos(rx),...colors.get(col)],k);sh.used++
 }
 const box=(...args)=>put(cube,...args),round=(...args)=>put(puck,...args);
 const font={W:['10101','10101','10101','11011','10001'],C:['111','100','100','100','111'],'Л':['011','101','101','101','101'],'И':['101','101','111','111','101'],'Ф':['010','111','111','010','010'],'Т':['111','010','010','010','010'],'М':['10001','11011','10101','10001','10001'],'А':['010','101','111','101','101'],'Р':['110','101','110','100','100'],'С':['111','100','100','100','111'],'У':['101','101','011','001','110'],'П':['111','101','101','101','101'],'Е':['111','100','111','100','111'], '→':['00100','00010','11111','00010','00100']};
 function glyph(ch,a,b,z,p,color,ry=0){const rows=font[ch];if(!rows)return;rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1'){const dx=(i-(row.length-1)/2)*p;box(a+dx*Math.cos(ry),b+(2-j)*p,z-dx*Math.sin(ry),p*.98,p*.98,p*.36,color,ry)}}))}
 function person(a,b,z,angle,t,duck,jump,idle){
  const sn=Math.sin(angle),cs=Math.cos(angle),stride=idle?.07:jump?.22:.78,phase=t*(idle?2:11.2),bob=idle?.018*Math.sin(phase):.055*Math.abs(Math.cos(phase));
  const lean=duck?.64:1;
  function part(i,j,k,w,h,d,c,tilt=0){box(a+i*cs+k*sn,b+j*lean+bob,z+k*cs-i*sn,w,h*lean,d,c,angle,tilt)}
  for(const s of [-1,1]){
   const step=Math.sin(phase)*stride*s,foot=duck?.33:step*.32;
   part(s*.2,.55,foot*.5,.30,.63,.34,'28374c',duck?.55:step*.48);
   part(s*.2,.22,foot,.26,.35,.29,'36465a',duck?-.65:-step*.3);
   part(s*.2,.12,foot+.07,.33,.22,.46,'cd7543');part(s*.2,.045,foot+.08,.35,.08,.49,'252e38');
   part(s*.46,1.32,-step*.16,.23,.46,.30,'df6033',-step*.55);part(s*.47,1.09,-step*.28+.05,.22,.28,.27,'ef8650',-step*.6-.28);
   part(s*.47,.96,-step*.31+.08,.19,.17,.23,'f3b282');
  }
  part(0,1.18,0,.74,.74,.53,'ec7440');part(0,1.51,.012,.78,.18,.54,'f58d51');part(0,.85,0,.70,.13,.49,'ad4e32');
  part(0,1.22,.279,.045,.57,.035,'673e34');for(const s of [-1,1])part(s*.22,1.07,.29,.18,.055,.03,'ffd299');
  part(0,1.34,-.31,.49,.56,.20,'224b52');part(0,1.15,-.43,.36,.19,.09,'387178');part(0,1.43,-.426,.22,.08,.04,'f8be63');
  for(const s of [-1,1])part(s*.27,1.40,.25,.074,.43,.10,'334c4c');
  part(0,1.73,.015,.53,.48,.50,'e7a475');part(0,1.78,-.238,.52,.25,.06,'563e39');
  part(0,1.75,.30,.13,.105,.11,'f8be90');for(const s of [-1,1]){part(s*.13,1.84,.275,.065,.066,.031,'342c32');part(s*.29,1.74,.02,.095,.12,.13,'eeae7c')}
  part(0,2.01,0,.64,.18,.60,'216660');part(0,2.14,-.005,.55,.17,.51,'369486');part(0,2.26,-.015,.24,.13,.24,'f3bc69');
  part(0,1.58,.015,.57,.115,.52,'dcad62');part(.23,1.45,.295,.145,.27,.05,'eebd76');
  part(-.16,2.01,.329,.135,.095,.029,'e6cda3');part(-.16,2.015,.348,.074,.026,.014,'725d49');
  for(let i=-2;i<=2;i++)part(i*.108,2.01,.305,.035,.15,.022,'308079');
 }
 function wc(a,z){round(a,.10,z,.99,.18,1.35,'b4d5ce');round(a,.39,z+.14,.71,.50,.97,'cee2d9');put(bowl,a,.45,z,1.64,.72,2.05,'f5f4e6');round(a,.83,z,.66,.03,.91,'69b8b0');
  box(a,1.24,z+.80,1.20,.86,.40,'dedfd1');box(a,1.70,z+.8,1.29,.11,.47,'fff8d9');box(a+.33,1.77,z+.78,.19,.05,.1,'69908c');
  box(a,2.69,z+.94,1.62,.74,.16,'124b48');glyph('W',a-.30,2.69,z+.846,.104,'deffa0');glyph('C',a+.32,2.69,z+.846,.104,'deffa0')
 }
 function token(a,z,t){const b=.65+Math.sin(t*3+z*.08)*.085;round(a,b-.15,z,.77,.13,.77,'fab844');
  for(const [i,r,dy] of [[0,.62,-.01],[-.025,.47,.14],[.035,.32,.27],[.075,.15,.38]])round(a+i,b+dy,z,r,.16,r,'a75c35');
  for(const s of [-1,1]){box(a+s*.11,b+.06,z-.25,.07,.087,.055,'fff2cf');box(a+s*.11,b+.06,z-.28,.032,.045,.024,'372a26')}
 }
 function cat(a,z,t){
  box(a,.32,z,.34,.43,.54,'ce8c4c');box(a,.62,z-.16,.39,.36,.34,'df9d59');
  for(const k of [-1,1]){box(a+.14*k,.84,z-.14,.11,.15,.14,'af7241');box(a+.10*k,.65,z-.345,.045,.064,.03,'32483a');box(a+.13*k,.10,z-.17,.13,.17,.15,'f6d8a2')}
  box(a,.53,z-.35,.17,.09,.03,'f6d8a2');box(a+.16,.54,z+.33,.12,.54,.14,'cb8747',0,.26+.12*Math.sin(t*2))
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
 function world(d,menu){
  const start=Math.floor((d-12)/5),end=Math.floor((d+66)/5);
  for(let i=start;i<=end;i++){const z=i*5-d,zone=((Math.floor(i/8)%3)+3)%3;
   const ceramic=['5caaa3','8097ae','80ab8c'][zone],wall=['dddac5','ccd1cb','e2d6ba'][zone];
   for(let l=-1;l<=1;l++)box(l*2.2,-.13,z,2.186,.25,4.98,(i+l)%2?'c2c9b7':'cbd1bf');
   for(const s of [-1,1]){
    box(s*3.9,-.13,z,1.2,.25,4.99,'95aba4');box(s*4.55,3.25,z,.28,6.5,5,wall);
    box(s*4.36,.77,z,.12,1.55,4.95,ceramic);box(s*4.24,1.48,z,.16,.095,5,'d7b46d');box(s*4.24,.10,z,.17,.16,5,'475d5e');
    for(let n=-2;n<=2;n++)box(s*3.34,.008,z+n*.86,.084,.016,.53,'dbad60');
    if((i+(s===1?1:0))%3===0){
     box(s*4.22,1.54,z,.28,3.03,2.01,'365351');box(s*4.04,1.46,z,.14,2.86,1.77,'678688');
     box(s*3.94,1.93,z,.06,.58,1.04,'263f47');box(s*3.92,1.10,z+.56,.1,.13,.27,'e7ba6d');
    }else if(i%3===1){
     box(s*4.10,2.64,z,.22,1.01,1.75,'385e61');box(s*3.95,2.64,z,.082,.83,1.56,'ebb06e');
     for(let n=-1;n<=1;n++)box(s*3.89,2.55+n*.17,z+.1*n,.03,.055,.95-.18*Math.abs(n),'936345')
    }
    if(i%2===0){box(s*4.12,2.65,z-2.34,.44,5.3,.22,'547575');box(s*3.9,4.25,z-2.34,.06,.63,.27,'ffe3a8')}
   }
   if(i%12===0)elevator(-1,z+.5);
   if(i%8===4)bench(1,z);
   if(i%16===6)cat(-3.7,z,clock);
   box(0,5.50,z,9.2,.24,5.01,'607772');
   if(i%2===0){box(0,5.19,z-2.3,8.5,.35,.25,'475f5d');box(0,5.11,z,2.9,.17,1.04,'344e50');box(0,5.0,z,2.7,.065,.85,'fff2c6')}
   box(-3.40,4.84,z,.19,.19,5.03,'a76c49');box(-3.12,4.86,z,.12,.12,5.03,'c89462');
  }
 }
 function render(){
  const w=canvas.clientWidth,h=canvas.clientHeight,ratio=Math.min(devicePixelRatio||1,1.65);
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}
  if(gl){gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.27,.36,.36,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)}
  const menu=state==='menu',mobile=w<680,t=menu?clock:elapsed,d=menu?0:distance;
  const yaw=menu?-.35:0, pitch=menu?.11:.17;
  let f=menu?Math.min(h*1.24,w*1.50):Math.min(h*.96,w*1.18);
  const eye=[menu?1.8:x*.20,menu?1.77:2.82,menu?-4.20:-5.5],offsetX=menu?(mobile?.02:.40):0,offsetY=menu?(mobile?-.32:-.04):-.05;
  if(gl){gl.uniform3f(U.eye,...eye);
  gl.uniform4f(U.basis,Math.sin(yaw),Math.cos(yaw),Math.sin(pitch),Math.cos(pitch));
  gl.uniform4f(U.lens,2*f/w,2*f/h,offsetX,offsetY);}
  shapes.forEach(sh=>sh.used=0);world(d,menu);
  const heroX=menu?0:x,heroZ=menu?0:state==='finish'?toiletTime*.45:0;
  round(heroX,.013,heroZ,.91,.020,1.10,'889d90');
  person(heroX,menu?0:height,heroZ,menu?2.05:clamp((lane*2.2-x)*.15,-.25,.25),t,slide>0&&height===0&&!menu,height>.04,menu);
  if(menu){cat(-.93,.55,t);wc(mobile?.30:1.1,4.1);token(-1.3,1.8,t)}
  else{
   if(length-d<66)wc(0,length-d);
   for(const it of items){let z=it.z-d;if(it.done||z< -2||z>60)continue;let a=it.a;
    if(it.type==='letter'){let ch=letterFor(it);if(!ch)continue;let b=1.28+.06*Math.sin(t*3+z*.07),turn=.30*Math.sin(t*1.6+it.z);
     box(a,b,z,.70,.74,.21,'127668',turn);box(a-.125*Math.sin(turn),b,z-.125*Math.cos(turn),.62,.65,.052,'cdf194',turn);
     glyph(ch,a-.17*Math.sin(turn),b,z-.17*Math.cos(turn),.093,'204f4b',turn)
    }else if(it.type==='poo')token(a,z,t);
    else if(it.type==='crate'){
     box(a,.43,z,1.42,.85,1.08,'ca925d');box(a,.862,z,.23,.025,1.09,'eed099');box(a,.45,z-.55,.23,.83,.024,'e6be88');box(a-.37,.26,z-.558,.27,.22,.026,'fae4bf')
    }else{
     for(const s of [-1,1]){box(a+s*.92,.1,z,.32,.18,.55,'345054');box(a+s*.92,1,z,.14,1.84,.15,'597471')}
     box(a,1.71,z,2.04,.64,.29,'ecaa48');for(let k=-2;k<=2;k++)box(a+k*.39,1.72,z-.16,.19,.53,.045,'584d40')
    }
   }
  }
  if(!gl){paintMeshes(eye,yaw,pitch,f,offsetX,offsetY,w,h);return}
  for(const sh of shapes){gl.bindVertexArray(sh.vao);gl.bindBuffer(gl.ARRAY_BUFFER,sh.buffer);gl.bufferData(gl.ARRAY_BUFFER,sh.data.subarray(0,sh.used*13),gl.DYNAMIC_DRAW);gl.drawArraysInstanced(gl.TRIANGLES,0,sh.count,sh.used)}
 }
 // Canvas fallback uses the same mesh vertices, model transforms and perspective.
 function paintMeshes(eye,yaw,pitch,f,ox,oy,w,h){
  const out=[],sn=Math.sin(yaw),cs=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
  soft.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);soft.fillStyle='#455c5c';soft.fillRect(0,0,w,h);
  for(const shape of shapes)for(let i=0;i<shape.used;i++){
   const [a,b,z,sx,sy,sz,rs,rc,ps,pc,r,g,bl]=shape.data.subarray(i*13,i*13+13);
   if(z>48)continue;
   for(const {vertices} of shape.surfaces){
    const pts=vertices.map(([xx,yy,zz])=>{
     const u=xx*sx,v=yy*sy*pc-zz*sz*ps,q=yy*sy*ps+zz*sz*pc;
     const dx=u*rc+q*rs+a-eye[0],dy=v+b-eye[1],dz=q*rc-u*rs+z-eye[2],depth0=dx*sn+dz*cs;
     return [dx*cs-dz*sn,dy*cp+depth0*sp,depth0*cp-dy*sp]
    });
    const clipped=[];
    for(let j=0;j<pts.length;j++){const p=pts[j],q=pts[(j+1)%pts.length];if(p[2]>=.10)clipped.push(p);
     if((p[2]>=.10)!==(q[2]>=.10)){const k=(.10-p[2])/(q[2]-p[2]);clipped.push([p[0]+(q[0]-p[0])*k,p[1]+(q[1]-p[1])*k,.10])}}
    if(clipped.length<3)continue;
    const screen=clipped.map(([x,y,z])=>[(1+ox)*w/2+f*x/z,(1-oy)*h/2-f*y/z]);
    const area=screen.reduce((s,p,j)=>{const q=screen[(j+1)%screen.length];return s+p[0]*q[1]-p[1]*q[0]},0);
    if(area<.02||screen.every(p=>p[0]<0)||screen.every(p=>p[0]>w)||screen.every(p=>p[1]<0)||screen.every(p=>p[1]>h))continue;
    const [p,q,k]=pts,A=q.map((n,i)=>n-p[i]),B=k.map((n,i)=>n-p[i]),n=[A[1]*B[2]-A[2]*B[1],A[2]*B[0]-A[0]*B[2],A[0]*B[1]-A[1]*B[0]];
    const light=.70+.36*Math.max(0,(-.55*n[0]+.76*n[1]-.35*n[2])/(Math.hypot(...n)||1));
    out.push([clipped.reduce((sum,p)=>sum+p[2],0)/clipped.length,screen,'rgb('+[r,g,bl].map(v=>Math.round(v*light*255)).join(',')+')'])
   }
  }
  out.sort((a,b)=>b[0]-a[0]);for(const [,points,color] of out){soft.fillStyle=color;soft.beginPath();points.forEach(([x,y],i)=>i?soft.lineTo(x,y):soft.moveTo(x,y));soft.closePath();soft.fill()}
 }
 return render
}
