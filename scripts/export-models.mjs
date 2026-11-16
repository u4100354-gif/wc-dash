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
vm.runInContext(await fs.readFile('characters.js','utf8'),context);
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
const animations=[
 clip(hero,'Run',Math.PI*2/14.5,t=>({t,phase:t*14.5,speed:13})),
 clip(hero,'FastRun',Math.PI*2/17.5,t=>({t,phase:t*17.5,speed:17})),
 clip(hero,'Sprint',Math.PI*2/21,t=>({t,phase:t*21,speed:21})),
 clip(hero,'Idle',3,t=>({t,idle:true})),
 clip(hero,'Jump',1,t=>({t,jump:true,phase:0,y:Math.max(0,8.25*t-8.5*t*t),velocity:8.25-17*t})),
 clip(hero,'ShoulderRoll',.8,t=>({t,phase:0,slide:Math.min(1,t/.07,(.8-t)/.06),roll:t/.8})),
 clip(hero,'Ride',2,t=>({t,phase:0,riding:true}))
];
hero.update({idle:true});
const heroBuffer=await exporter.parseAsync(hero.root,{binary:true,animations});
await fs.writeFile('assets/models/denis.glb',Buffer.from(heroBuffer));
const cat=context.createMarsCat(new THREE.Group());
const catClips=[clip(cat,'TailSway',2.6,t=>({t,preview:true}))];cat.update({preview:true});
const catBuffer=await exporter.parseAsync(cat.root,{binary:true,animations:catClips});
await fs.writeFile('assets/models/mars.glb',Buffer.from(catBuffer));
console.log('Exported skinned Denis (7 clips) and Mars (1 clip) as editable GLB files.');
