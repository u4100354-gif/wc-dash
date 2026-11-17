import * as THREE from './vendor/three/three.module.js';
import {RoundedBoxGeometry} from './vendor/three/RoundedBoxGeometry.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';
window.THREE=THREE;window.RoundedBoxGeometry=RoundedBoxGeometry;window.OrbitControls=OrbitControls;
const scripts=['inspector','showcase','routes','presentation','ride-motion','trains','three-stage','characters','sewer','environment','world','sound','endless','shop','game'];
try {
 for(const name of scripts) await new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=`${name}.js?v=6.6.0`;
  script.onload=resolve;script.onerror=()=>reject(new Error(`Не удалось загрузить ${name}.js`));document.body.append(script);
 });
} catch(error){
 console.error(error);
 const summary=document.getElementById('summary');summary.textContent='Не удалось запустить игру. '+error.message;
 document.getElementById('start').disabled=true;
}
