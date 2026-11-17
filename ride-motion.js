// Shared timing and contact frame for Mars and his rider. Sampling is based on
// simulation time only: inspecting a frozen frame must never advance a gait.
function sampleRideMotion(p={}){
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
 const {t=0,phase=t*17.5,speed=16,jump=false,velocity=0,slide=0,landing=0,bank=0,preview=false,reaction=0}=p;
 const effort=clamp((speed-13)/8),stage=effort<.33?0:effort<.70?1:2;
 const mount=clamp(p.mount??1),duck=clamp(slide),impact=clamp(landing),gait=phase*1.1;
 const jumpMax=8.25*(p.boots?Math.sqrt(1.5):1);
 const launch=jump?clamp(velocity/jumpMax):0;
 const tuck=jump?smooth(1-Math.abs(velocity)/jumpMax):0;
 const reach=jump&&velocity<0?smooth(1-(p.supportGap??1)/.85):0;
 const bob=preview?0:jump?0:Math.sin(gait*2)*(.023+stage*.005)*(1-duck);
 const bodyY=preview?0:.065+bob-duck*.09-impact*.045;
 const pitch=preview?0:(jump?-launch*.12+tuck*.025+reach*.08:Math.sin(gait)*(.04+stage*.01)*(1-duck))+duck*.035+reaction*.10;
 const stretch=preview?1:jump?1+launch*.045-tuck*.025:1+Math.sin(gait)*.035*(1-duck);
 const roll=preview?0:-bank*.12;
 // Saddle point is transformed with the cat's back, rather than placing the
 // human a fixed distance above an independently bobbing animal.
 const seatY=bodyY+.51*Math.cos(pitch)+.10*stretch*Math.sin(pitch)+.145;
 const seatZ=.51*Math.sin(pitch)-.10*stretch*Math.cos(pitch);
 let action=preview?'idle':duck>.15?'duck':jump?(velocity>1?'jump-launch':velocity< -1?'jump-fall':'jump-apex'):impact>.15?'land':Math.abs(bank)>.15?'lane-change':['gallop','fast-gallop','sprint'][stage];
 if(!preview&&mount<.98)action=p.departing?'dismount':'mount';
 if(reaction>.15)action='recoil';
 return {stage,gait,frequency:[14.5,17.5,21][stage]*1.1/(Math.PI*2),mount,duck,impact,launch,tuck,reach,jump,bank,reaction,action,
  bodyY,pitch,roll,stretch,seatY,seatZ,torso:duck*1.32+(jump?.16:.20+stage*.025)*(1-duck)-impact*.06-reaction*.12,
  hipAngle:-.72-duck*.30-tuck*.12+launch*.08,hipSpread:.72+duck*.08+tuck*.08,
  knee:1.58+duck*.22+tuck*.20-launch*.12,
  arm:-.28-duck*.55-launch*.12+tuck*.10+reaction*.28,elbow:-.95+duck*.15-tuck*.12+reaction*.2,
  transitionHop:Math.sin(mount*Math.PI)*.10};
}
if(typeof module!=='undefined')module.exports={sampleRideMotion};
