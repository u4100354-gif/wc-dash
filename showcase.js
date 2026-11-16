// Authored route: timed encounters, with at least one open ground lane throughout.
function buildShowcaseRoute() {
 const trains=[],obstacles=[];
 const car=(z,lane,deck,kind,entry=0,exit=0)=>trains.push({z,a:lane*2.2,deck,kind,entry,exit});
 const gate=(type,z,lane)=>obstacles.push({type,z,a:lane*2.2,y:0});
 car(62,-1,23,'metro',7,0);car(99,-1,22,'metro',0,7);
 car(78,1,27,'freight');
 car(208,1,24,'express',7,0);car(246,1,24,'express',0,7);
 car(231,0,22,'freight');
 car(365,0,25,'metro',7,0);car(404,0,23,'metro',0,7);
 car(386,-1,24,'express');
 car(532,-1,25,'freight',7,0);car(571,-1,25,'freight',0,7);
 car(550,1,28,'metro');
 for (const [z,lane,trigger,kind] of [[183,1,118,'express'],[340,-1,274,'metro'],[505,1,438,'express'],[679,0,605,'metro']]) {
  car(z,lane,20,kind);Object.assign(trains.at(-1),{incomingSpeed:8,trigger});
 }
 for (const [type,z,lane] of [
  ['crate',28,0],['hurdle',44,-1],['bar',139,0],['crate',162,-1],
  ['hurdle',184,0],['bar',286,1],['crate',309,0],['hurdle',332,1],
  ['crate',443,-1],['bar',463,0],['hurdle',485,-1],
  ['bar',613,1],['crate',635,-1],['hurdle',669,1],['bar',690,0]
 ]) gate(type,z,lane);
 return {length:720,trains,obstacles};
}
function advanceShowcaseTraffic(cars,dt,distance) {
 for (const car of cars) if(car.incomingSpeed && distance>=car.trigger) car.z-=car.incomingSpeed*dt;
}
if(typeof module!=='undefined') module.exports={buildShowcaseRoute,advanceShowcaseTraffic};
