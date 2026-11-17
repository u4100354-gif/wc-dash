// Five authored destinations. Marathon keeps its own endless district generator.
const levelCatalog=[
 {name:'Солнечное депо',meters:720,theme:'depot',sections:['Солнечное депо','Экспресс-платформа','Грузовая станция'],summary:'720 м · электрички, экспрессы и первые прыжки по крышам.'},
 {name:'Большой коллектор',meters:1800,theme:'sewer',sections:['Насосная станция','Открытый канал','Большой коллектор'],summary:'1 800 м · каскады потоков, насосные станции и передышки под открытым небом.'},
 {name:'Портовый экспресс',meters:900,theme:'harbor',sections:['Контейнерный двор','Морская набережная','Портовый экспресс'],summary:'900 м · контейнеры, портовые краны и связки встречных составов.'},
 {name:'Зелёная линия',meters:1080,theme:'garden',sections:['Ботанический сад','Оранжерея','Зелёная линия'],summary:'1 080 м · сады, арочные павильоны и ритмичные связки прыжков и подкатов.'},
 {name:'Центральный вокзал',meters:1260,theme:'terminal',sections:['Городской проспект','Часовая башня','Центральный вокзал'],summary:'1 260 м · длинные составы, пересадки по крышам и финальный рывок к WC.'},
 {name:'Марафон',meters:Infinity,theme:'marathon',summary:'Парк, рынок и вокзал без конца. Каждые 1 000 м — новое слово и новый шанс на рекорд.'}
];
function buildDestinationRoute(index){
 if(index===0)return buildShowcaseRoute();
 const spec=levelCatalog[index],trains=[],obstacles=[],sewers=[],flowEncounters=[];
 // Each 180 m chapter reserves a ground escape lane, then offers an optional
 // ramp → roof → six-metre gap → roof sequence on a different lane.
 const rhythms=[[[12,0,'crate'],[29,1,'hurdle'],[44,0,'bar']],[[12,1,'bar'],[31,0,'crate'],[47,1,'hurdle']],[[14,0,'hurdle'],[30,1,'bar'],[46,0,'crate']]];
 for(let start=0,chapter=0;start<spec.meters-85;start+=180,chapter++){
  const safe=[0,1,-1][(chapter+index)%3],others=[-1,0,1].filter(l=>l!==safe),roof=others[chapter%2],traffic=others[1-chapter%2];
  const kind=['metro','express','freight'][(chapter+index)%3];
  for(const [offset,l,type] of rhythms[(chapter+index)%rhythms.length])obstacles.push({type,z:start+offset,a:others[l]*2.2,y:0});
  trains.push({z:start+58,a:roof*2.2,entry:7,deck:23,exit:0,kind},
   {z:start+94,a:roof*2.2,entry:0,deck:23,exit:7,kind});
  // The moving convoy meets the player after the obstacle rhythm, with gaps
  // measured in world space and identical speeds for every carriage.
  for(let n=0;n<3;n++)trains.push({z:start+116+n*28,a:traffic*2.2,entry:0,deck:22,exit:0,kind:['express','freight','metro'][(chapter+n)%3],incomingSpeed:7+index*.5,trigger:start+58,relay:n>0});
  const underground=index===1||chapter%3===1;
  if(underground){
   sewers.push({start:start+128,end:Math.min(spec.meters-18,start+177)});
   for(let n=0;n<2;n++)flowEncounters.push({target:start+141+n*11,a:others[n]*2.2,kind:['sludge','foam','surge'][(chapter+n)%3],top:[1.25,1.48,1.8][(chapter+n)%3],size:8,incomingSpeed:6,relay:n>0});
  }else{
   obstacles.push({type:chapter%2?'hurdle':'bar',z:start+143,a:roof*2.2,y:0},
    {type:'crate',z:start+162,a:traffic*2.2,y:0});
  }
 }
 return {length:spec.meters,trains,obstacles,sewers,flowEncounters};
}
function inRouteSewer(sections,z){return sections.some(s=>z>=s.start&&z<=s.end)}
function routeSewerFade(sections,z){
 let blend=0;for(const s of sections)if(z>=s.start&&z<=s.end)blend=Math.max(blend,Math.min(1,(z-s.start)/7,(s.end-z)/7));return blend;
}
if(typeof module!=='undefined')module.exports={levelCatalog,buildDestinationRoute,inRouteSewer,routeSewerFade};
