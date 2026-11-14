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
function railTrail(cars, z) {
 for (const car of cars) {
  if (car.parallel) continue;
  const edge = trainEnd(car);
  if (car.gap && z >= edge-4 && z <= edge+car.gap+5) {
   const u = (z-edge+4)/(car.gap+9);
   return {a:car.a, y:roofHeight+.64+1.65*Math.sin(Math.PI*u)};
  }
  if (z >= car.z-2 && z <= edge) return {a:car.a, y:roofAt(car,z)+.64};
 }
 return null;
}
