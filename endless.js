// Append one district at a time, discarding scenery and pickups behind the camera.
let nextDistrict=0,routeSeed=0,districts=[],biomeOrder=[];
function biomeAt(z){return districts.find(d=>z>=d.start&&z<d.end)?.biome??0}
function randomRoute(){
 routeSeed=(Math.imul(routeSeed,1664525)+1013904223)>>>0;return routeSeed/4294967296
}
function resetDistricts(){
 nextDistrict=0;routeSeed=crypto.getRandomValues(new Uint32Array(1))[0];
 districts=[];biomeOrder=[];trains=[];flows=[];items=[];firstNearby=0;extendDistricts()
}
function extendDistricts(){
 if(nextDistrict>distance+115)return;
 items=items.filter(it=>it.z>=distance-4);firstNearby=0;
 trains=trains.filter(tr=>tr.z+35>=distance-5);
 flows=flows.filter(f=>!f.passed);districts=districts.filter(d=>d.end>distance-18);
 while(nextDistrict<=distance+115){
  const start=nextDistrict,span=144+Math.floor(randomRoute()*4)*8;
  if(!biomeOrder.length){biomeOrder=[0,1,2];for(let j=2;j>0;j--){const k=Math.floor(randomRoute()*(j+1));[biomeOrder[j],biomeOrder[k]]=[biomeOrder[k],biomeOrder[j]]}}
  districts.push({start,end:start+span,biome:biomeOrder.pop()});
  const lateral=()=>2.2*(Math.floor(randomRoute()*3)-1);
  const train={z:start+43,a:lateral()};trains.push(train);
  const gateLane=lateral(),lowGate=randomRoute()<.5;
  items.push({type:lowGate?'bar':'crate',a:gateLane,z:start+24,y:0});
  if(start>=1000){const other=gateLane===0?2.2:0;items.push({type:lowGate?'crate':'bar',a:other,z:start+24,y:0})}
  if(start>=2000)items.push({type:lowGate?'crate':'bar',a:lateral(),z:start+36,y:0});
  flows.push({trigger:start+80,a:lateral(),size:12+Math.floor(randomRoute()*4)*2,front:null,passed:false});
  let road=lateral();
  for(let n=4;n<span-2;n+=2){
   if(n%16===4)road=lateral();
   const roof=n>=39&&n<=75,gate=Math.abs(n-24)<7;
   const y=roof?roofAt(train,start+n)+.64:gate?(lowGate?.35:.65+1.35*Math.max(0,1-((n-24)/6)**2)):.65;
   const a=roof?train.a:gate?gateLane:road;
   items.push({type:'poo',z:start+n,a,y});
   if(n%18===4&&start+n+.8>=1000)items.push({type:'letter',z:start+n+.8,a,y:roof?roofAt(train,start+n+.8):0})
  }
  items.push({type:['shield','magnet','boots'][Math.floor(randomRoute()*3)],z:start+11,a:0,y:0});
  nextDistrict+=span
 }
 items.sort((a,b)=>a.z-b.z)
}
