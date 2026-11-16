// Flow silhouettes deliberately share the collision surface height. Moving foam
// stays close to that surface so a foot planted on it has a visible support.
function drawSewerFlow(stage,flow,front,t){
 const {box,put}=stage,ball=(...args)=>put(stage.fluid||stage.sphere,...args);
 const top=flow.top??1.48,a=flow.a,kind=flow.kind||'sludge';
 const colors=kind==='foam'?['705035','967045','dbc581']:kind==='surge'?['49372b','765034','b38a4d']:['64432b','926038','bd8c4d'];
 for(let n=.5;n<flow.size;n+=.7){
  const ripple=Math.sin(n*2.3-t*5)*.035;
  // The deck is broad and continuous, with an animated organic skirt.
  ball(a,top*.48,front+n,1.88,top*.97,1.28,colors[0]);
  ball(a,top-.10,front+n,1.86,.24,.95,colors[1]);
  for(const side of [-1,1])ball(a+side*(.70+ripple),top*.44,front+n,.52,top*.91,.96,colors[0]);
  if(kind==='foam'||n%2<.8)for(let j=0;j<3;j++){
   const side=Math.sin(n*4+j*8),size=.09+(j%2)*.04;
   ball(a+side*.63,top+.015+ripple*.30,front+n+j*.15,size,.035,size*1.4,colors[2]);
  }
  if(kind==='surge'&&n<2.5)ball(a,top-.08,front+n,1.9,.24,.9,'b28b56');
 }
 for(let j=0;j<7;j++){
  const u=(t*1.7+j/7)%1,s=j%2?1:-1;
  ball(a+s*(.66+u*.48),top*.7+Math.sin(u*Math.PI)*.37,front-.12-u*.8,.09*(1-u),.17*(1-u),.09*(1-u),colors[1]);
 }
}
function drawSewerSection(stage,z,index){
 const {box,round,put,sphere}=stage,ball=(...a)=>put(sphere,...a);
 box(0,-.15,z,8.9,.30,5.02,'526359');
 for(const side of [-1,1]){
  box(side*3.9,.10,z,1.1,.20,5.02,'7d8b77');
  box(side*4.7,2.25,z,.35,4.5,5.02,index%2?'60736a':'697a6d');
  round(side*4.4,1.1,z,.48,5.02,.48,'8b6947',0,Math.PI/2);
  box(side*4.4,1.10,z+2.3,.65,.14,.65,'af8756');
  for(let brick=-2;brick<=2;brick++)box(side*4.49,2.5+(brick%2)*.65,z+brick,.08,.025,.94,'8e9b80');
  if(index%2===0){
   box(side*4.24,3.1,z,.18,.8,.38,'2b4742');ball(side*4.10,3.1,z,.20,.47,.30,'dfedaa');
   box(side*4.15,2.35,z,.12,.5,.55,'b8a951');
  }
 }
 for(let n=0;n<16;n++){
  const angle=(n+.5)/16*Math.PI;
  box(Math.cos(angle)*4.7,4.4+Math.sin(angle)*4.7,z,.98,.25,5.02,'687d70',0,0,angle+Math.PI/2);
  if(index%3===0)box(Math.cos(angle)*4.5,4.4+Math.sin(angle)*4.5,z-.1,.94,.22,.20,'99aa8b',0,0,angle+Math.PI/2);
 }
 for(let lane=-1;lane<=1;lane++){
  box(lane*2.2,.01,z,1.82,.025,4.97,'607565');
  for(let grate=-2;grate<=2;grate++)box(lane*2.2,.031,z+grate*.9,1.4,.025,.035,'9b9b72');
 }
}
