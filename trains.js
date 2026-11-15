const roofHeight = 1.9, rampLength = 7;
// The ramp leads to a pair of roofs separated by a jump. A third car runs alongside.
function trainGroup(start, lane, side) {
 const a = lane * 2.2, beside = (lane === 0 ? side : 0) * 2.2;
 return [
  {z:start, a, deck:18, entry:rampLength, exit:0, gap:5.5},
  {z:start+30.5, a, deck:18, entry:0, exit:rampLength},
  {z:start+13, a:beside, deck:22, entry:0, exit:rampLength, parallel:true}
 ];
}
function trainEnd(car) {
 return car.z + car.entry + car.deck + car.exit;
}
function roofAt(car, z) {
 if (z < car.z || z > trainEnd(car)) return 0;
 if (car.entry && z < car.z + car.entry) return roofHeight * (z-car.z)/car.entry;
 if (car.exit && z > trainEnd(car)-car.exit) return roofHeight * (trainEnd(car)-z)/car.exit;
 return roofHeight;
}
function railFloor(cars, z, x) {
 for (const car of cars) {
  if (Math.abs(x-car.a) < 1 && z >= car.z && z <= trainEnd(car)) return roofAt(car,z);
 }
 return 0;
}
// Sample the same 120 Hz vertical and forward integration as gameplay.
// Centre the apex over the coupling; faster routes get a longer coin arc.
function roofJumpArc(car){
 const edge=trainEnd(car),pace=speedAt(edge),cached=car.jumpArc;
 if(cached&&cached.pace===pace)return cached;
 const dt=1/120,apexSteps=Math.round(jumpVelocity/gravity/dt-.5);
 let start=edge+car.gap/2;
 for(let n=0;n<apexSteps;n++){
  const next=start;let previous=next-pace*dt;
  for(let k=0;k<5;k++)previous=next-speedAt(previous)*dt;
  start=previous
 }
 let z=start,y=0,v=jumpVelocity;const samples=[{z,y:roofHeight+.64}];
 for(let n=0;n<240;n++){
  z+=speedAt(z)*dt;v-=gravity*dt;y=Math.max(0,y+v*dt);
  samples.push({z,y:roofHeight+.64+y});if(y===0)break
 }
 return car.jumpArc={pace,start,end:z,samples}
}
function railTrail(cars,z){
 for(const car of cars){
  if(car.parallel)continue;
  if(car.gap){
   const arc=roofJumpArc(car);
   if(z>=arc.start&&z<=arc.end){
    let lo=0,hi=arc.samples.length-1;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(arc.samples[mid].z<=z)lo=mid;else hi=mid}
    const a=arc.samples[lo],b=arc.samples[hi],t=(z-a.z)/(b.z-a.z);
    return {a:car.a,y:a.y+(b.y-a.y)*t}
   }
  }
  if(z>=car.z-2&&z<=trainEnd(car))return {a:car.a,y:roofAt(car,z)+.64}
 }
 return null
}
