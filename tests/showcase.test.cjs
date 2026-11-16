const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const context = fs.existsSync('showcase.js') ? require('../showcase.js') : {};
function route() {
  assert.equal(typeof context.buildShowcaseRoute, 'function', 'A playable showcase route must be available');
  return context.buildShowcaseRoute();
}
test('showcase lasts 30–60 seconds at the actual acceleration curve', () => {
  const plan = route();
  let seconds = 0;
  for (let z = 0; z < plan.length; z += 0.25) seconds += 0.25 / (13 + 8*z/plan.length);
  assert.ok(seconds >= 30 && seconds <= 60, `duration ${seconds}`);
});
test('route includes three distinct train types and approaching traffic', () => {
  const plan = route();
  assert.equal(new Set(plan.trains.map(t => t.kind)).size, 3);
  assert.ok(plan.trains.some(t => t.incomingSpeed > 0));
  assert.ok(plan.trains.some(t => t.entry > 0));
});
test('every ground section leaves an escape lane, including all traffic positions', () => {
  const plan = route();
  for (let distance = 0; distance < plan.length; distance += 0.5) {
    const timeAt = z => plan.length / 8 * Math.log((13+8*z/plan.length)/13);
    const blocked = new Set();
    for (const t of plan.trains) {
      const shift = t.incomingSpeed ? Math.max(0, timeAt(distance)-timeAt(t.trigger))*t.incomingSpeed : 0;
      const start=t.z-shift, end=start+t.entry+t.deck+t.exit;
      if (distance >= start-2 && distance <= end+2) blocked.add(t.a);
    }
    for (const item of plan.obstacles) if (Math.abs(item.z-distance)<2) blocked.add(item.a);
    assert.ok(blocked.size < 3, `all lanes blocked at ${distance}m`);
  }
});
test('traffic advances only after its warning point and keeps its length', () => {
  route();
  const cars=[{z:100,deck:18,trigger:40,incomingSpeed:8}];
  context.advanceShowcaseTraffic(cars, 1, 39);
  assert.equal(cars[0].z,100);
  context.advanceShowcaseTraffic(cars, 0.5, 40);
  assert.equal(cars[0].z,96);
  assert.equal(cars[0].deck,18);
});
test('sewer atmosphere fades at the entrance and exit, leaving stations outside',()=>{
 assert.equal(context.sewerAt(100),false);assert.equal(context.sewerAt(150),true);
 assert.equal(context.sewerBlendAt(100),0);assert.equal(context.sewerBlendAt(130),0);
 assert.equal(context.sewerBlendAt(133.5),.5);assert.equal(context.sewerBlendAt(150),1);
 assert.equal(context.sewerBlendAt(196),0);
});
