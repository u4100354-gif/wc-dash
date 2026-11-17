// Rebuild editable GLB assets from the same original meshes used by the game.
// Usage: node scripts/export-models.mjs D:\WC-Dash\tools
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
const toolsDir=path.resolve(process.argv[2]||'D:/WC-Dash/tools');
const threeDir=path.join(toolsDir,'node_modules/three');
const THREE=await import(pathToFileURL(path.join(threeDir,'build/three.module.js')));
const {GLTFExporter}=await import(pathToFileURL(path.join(threeDir,'examples/jsm/exporters/GLTFExporter.js')));
// GLTFExporter also supports browser Blobs. This adapter provides the two read
// operations it needs when exporting binary meshes from Node.
globalThis.FileReader=class{
 readAsArrayBuffer(blob){blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}
 readAsDataURL(blob){blob.arrayBuffer().then(value=>{this.result=`data:${blob.type};base64,${Buffer.from(value).toString('base64')}`;this.onloadend?.();});}
};
const context=vm.createContext({THREE,Math});
vm.runInContext(await fs.readFile('ride-motion.js','utf8'),context);
vm.runInContext(await fs.readFile('characters.js','utf8'),context);
vm.runInContext(await fs.readFile('presentation.js','utf8'),context);
function clip(model,name,duration,pose){
 const nodes=[];model.root.traverseVisible(node=>{if((node.isGroup||node.isBone)&&node.name)nodes.push(node);});
 const times=[],samples=nodes.map(()=>({position:[],quaternion:[],scale:[]})),frames=Math.round(duration*60);
 for(let frame=0;frame<=frames;frame++){
  const t=frame/frames*duration;times.push(t);model.update(pose(t));
  nodes.forEach((node,i)=>{samples[i].position.push(...node.position);samples[i].quaternion.push(...node.quaternion);samples[i].scale.push(...node.scale);});
 }
 const tracks=nodes.flatMap((node,i)=>[
  new THREE.VectorKeyframeTrack(node.name+'.position',times,samples[i].position),
  new THREE.QuaternionKeyframeTrack(node.name+'.quaternion',times,samples[i].quaternion),
  new THREE.VectorKeyframeTrack(node.name+'.scale',times,samples[i].scale)
 ]);
 return new THREE.AnimationClip(name,duration,tracks);
}
const exporter=new GLTFExporter();
await fs.mkdir('assets/models',{recursive:true});
const hero=context.createRunner(new THREE.Group());
const rideGait=(speed,cadence)=>t=>({t,speed,phase:t*cadence,distance:t*speed,mount:1});
const jumpPose=boots=>t=>{
 const velocity=8.25*(boots?Math.sqrt(1.5):1),y=Math.max(0,velocity*t-8.5*t*t);
 return {...rideGait(17,17.5)(t),jump:true,y,supportGap:y,velocity:velocity-17*t,boots};
};
// Identical names and sample clocks make the two exported rigs a matched pair.
const rideClips=[
 ['RideSlow',4*Math.PI/(14.5*1.1),rideGait(13,14.5)],
 ['Ride',4*Math.PI/(17.5*1.1),rideGait(17,17.5)],
 ['RideSprint',4*Math.PI/(21*1.1),rideGait(21,21)],
 ['RideTurnLeft',.6,t=>({...rideGait(17,17.5)(t),bank:-Math.sin(Math.PI*t/.6)})],
 ['RideTurnRight',.6,t=>({...rideGait(17,17.5)(t),bank:Math.sin(Math.PI*t/.6)})],
 ['RideJump',2*8.25/17,jumpPose(false)],
 ['RideBoostJump',2*8.25*Math.sqrt(1.5)/17,jumpPose(true)],
 ['RideLand',.4,t=>({...rideGait(17,17.5)(t),landing:Math.exp(-11*t)})],
 ['RideDuck',.8,t=>({...rideGait(17,17.5)(t),slide:Math.max(0,Math.min(1,t/.10,(.8-t)/.15))})],
 ['RideMount',.45,t=>({...rideGait(17,17.5)(t),mount:1-Math.exp(-16*t)})],
 ['RideDismount',.45,t=>({...rideGait(17,17.5)(t),mount:Math.exp(-16*t),departing:true})],
 ['RideRecoil',.45,t=>({...rideGait(17,17.5)(t),reaction:Math.exp(-8*t)})]
];
const animations=[
 clip(hero,'Run',Math.PI*2/14.5,t=>({t,phase:t*14.5,speed:13})),
 clip(hero,'FastRun',Math.PI*2/17.5,t=>({t,phase:t*17.5,speed:17})),
 clip(hero,'Sprint',Math.PI*2/21,t=>({t,phase:t*21,speed:21})),
 clip(hero,'Idle',3,t=>({t,idle:true})),
 clip(hero,'Jump',1,t=>({t,jump:true,phase:0,takeoffPhase:0,speed:17,y:Math.max(0,8.25*t-8.5*t*t),supportGap:Math.max(0,8.25*t-8.5*t*t),velocity:8.25-17*t})),
 clip(hero,'ShoulderRoll',.8,t=>({t,phase:0,slide:Math.min(1,t/.07,(.8-t)/.06),roll:t/.8})),
 clip(hero,'SideRollLeft',.8,t=>({t,phase:0,slide:Math.min(1,t/.07,(.8-t)/.06),roll:t/.8,rollDirection:-1})),
 clip(hero,'SideRollRight',.8,t=>({t,phase:0,slide:Math.min(1,t/.07,(.8-t)/.06),roll:t/.8,rollDirection:1})),
 ...rideClips.map(([name,duration,pose])=>clip(hero,name,duration,t=>({...pose(t),riding:true}))),
 clip(hero,'ToiletFinish',2,t=>{const p=context.finishMotion(t);return {t,phase:0,y:p.y,z:p.z,angle:p.angle,jump:p.airborne,velocity:p.velocity,finish:p.seat,anticipation:p.anticipation};})
];
hero.update({idle:true});
const heroBuffer=await exporter.parseAsync(hero.root,{binary:true,animations});
await fs.writeFile('assets/models/denis.glb',Buffer.from(heroBuffer));
const cat=context.createMarsCat(new THREE.Group());
const catClips=[clip(cat,'TailSway',2.6,t=>({t,preview:true})),...rideClips.map(([name,duration,pose])=>clip(cat,name,duration,t=>({...pose(t),z:-.2})))];cat.update({preview:true});
const catBuffer=await exporter.parseAsync(cat.root,{binary:true,animations:catClips});
await fs.writeFile('assets/models/mars.glb',Buffer.from(catBuffer));
console.log(`Exported Denis (${animations.length} clips) and Mars (${catClips.length} clips), including ${rideClips.length} matching riding animations.`);
