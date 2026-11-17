// Authored route: timed encounters, with at least one open ground lane throughout.
const showcaseSewerSections=[{start:130,end:196},{start:280,end:354},{start:438,end:522},{start:608,end:704}];
function buildShowcaseRoute() {
 const trains=[],obstacles=[];
 const car=(z,lane,deck,kind,entry=0,exit=0)=>trains.push({z,a:lane*2.2,deck,kind,entry,exit});
 const gate=(type,z,lane)=>obstacles.push({type,z,a:lane*2.2,y:0});
 car(62,-1,23,'metro',7,0);car(99,-1,22,'metro',0,7);
 car(108,1,22,'freight');Object.assign(trains.at(-1),{incomingSpeed:8,trigger:40});
 car(208,1,24,'express',7,0);car(246,1,24,'express',0,7);
 car(275,0,22,'freight');Object.assign(trains.at(-1),{incomingSpeed:8,trigger:205});
 car(365,0,25,'metro',7,0);car(404,0,23,'metro',0,7);
 car(425,-1,24,'express');Object.assign(trains.at(-1),{incomingSpeed:8,trigger:365});
 car(532,-1,25,'freight',7,0);car(571,-1,25,'freight',0,7);
 car(590,1,28,'metro');Object.assign(trains.at(-1),{incomingSpeed:8,trigger:530});
 // Matching speeds keep the roof gaps stable for successive jumps.
 for(const lead of [...trains].filter(c=>c.incomingSpeed))for(let n=1;n<=2;n++){
  trains.push({...lead,z:lead.z+n*(lead.deck+6),deck:lead.deck,entry:0,exit:0,relay:true});
 }
 for (const [type,z,lane] of [
  ['crate',28,0],['hurdle',44,-1],['bar',139,0],['crate',162,-1],
  ['hurdle',184,0],['bar',286,1],['crate',309,0],['hurdle',332,1],
  ['crate',443,-1],['bar',463,0],['hurdle',485,-1],
  ['bar',613,1],['crate',635,-1],['hurdle',669,1],['bar',690,0]
 ]) gate(type,z,lane);
 const sewers=showcaseSewerSections;
 const flowEncounters=[
  {target:152,a:0,kind:'sludge',top:1.25,size:11,incomingSpeed:7},
  {target:169,a:2.2,kind:'surge',top:1.8,size:8,incomingSpeed:10},
  {target:306,a:-2.2,kind:'foam',top:1.48,size:15,incomingSpeed:6},
  {target:324,a:2.2,kind:'sludge',top:1.25,size:11,incomingSpeed:7},
  {target:464,a:0,kind:'surge',top:1.8,size:8,incomingSpeed:10},
  {target:491,a:-2.2,kind:'foam',top:1.48,size:15,incomingSpeed:6},
  {target:638,a:2.2,kind:'sludge',top:1.25,size:11,incomingSpeed:7},
  {target:677,a:0,kind:'surge',top:1.8,size:8,incomingSpeed:10}
 ];
 for(const lead of [...flowEncounters].filter((_,i)=>i%2===0))flowEncounters.push({...lead,target:lead.target+10,relay:true});
 return {length:720,trains,obstacles,sewers,flowEncounters};
}
function sewerAt(z){return showcaseSewerSections.some(section=>z>=section.start&&z<=section.end)}
function sewerBlendAt(z){
 let blend=0;for(const section of showcaseSewerSections)if(z>=section.start&&z<=section.end)blend=Math.max(blend,Math.min(1,(z-section.start)/7,(section.end-z)/7));return blend;
}
function advanceShowcaseTraffic(cars,dt,distance) {
 for (const car of cars) if(car.incomingSpeed && distance>=car.trigger) car.z-=car.incomingSpeed*dt;
}
if(typeof module!=='undefined') module.exports={buildShowcaseRoute,advanceShowcaseTraffic,sewerAt,sewerBlendAt};
