// One finish timeline shared by physics, character posing and camera framing.
const toiletSeatHeight=.46,toiletCenterZ=1.12;
const forwardRollDuration=.8,sideRollDuration=.5;
const rollDuration=direction=>direction?sideRollDuration:forwardRollDuration;
function finishMotion(time,entryHeight=0){
 const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)};
 const u=Math.max(0,Math.min(1,(time-.55)/.78));
 const hopping=time>.55&&time<1.33,settle=Math.max(0,Math.min(1,time/.55));
 const airborne=hopping||(entryHeight>0&&time<.55);
 return {y:entryHeight*(1-smooth(settle))+(hopping?Math.sin(Math.PI*u)*.68:0),z:toiletCenterZ*smooth(u),
  angle:Math.PI*smooth((time-.25)/.55),seat:smooth((time-.92)/.41),
  anticipation:time<.55?Math.sin(Math.PI*smooth(time/.55)):0,
  airborne,velocity:hopping?Math.cos(Math.PI*u)*.68*Math.PI/.78:-entryHeight*6*settle*(1-settle)/.55};
}
function chaseCamera({mobile,x,lift=0,cinema=0}){
 // Keep the three-lane corridor centred in portrait. Partial horizontal follow
 // used to drift the road sideways; all three player positions still fit.
 return {eye:[(mobile?0:x*.16)-3.55*cinema,3.15+lift*1.07-.89*cinema,-6.25-lift*.30+2.15*cinema],
  yaw:cinema*.70,pitch:.13+lift*.015,offsetX:0,offsetY:-.05};
}
function tunnelRoofVisible(z,flying){return !flying||z>28}
if(typeof module!=='undefined')module.exports={finishMotion,chaseCamera,tunnelRoofVisible,toiletSeatHeight,toiletCenterZ};
