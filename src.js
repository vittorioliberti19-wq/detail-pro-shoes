import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import './style.css';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const stage=document.querySelector('#shoe-stage');
const loading=document.querySelector('#loading');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer,shoe;
let target=0,current=0;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(32,1,.01,100);
camera.position.set(0,.45,4.6);
const materials=[];
function resize(){if(!renderer)return;const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.position.z=camera.aspect<1?7:4.6;camera.lookAt(0,0,0);camera.updateProjectionMatrix();}
function onScroll(){const story=document.querySelector('.scroll-story');target=THREE.MathUtils.clamp(-story.getBoundingClientRect().top/(story.offsetHeight-innerHeight),0,1);document.querySelector('#progress').style.width=`${target*100}%`;document.querySelector('#percent').textContent=`${Math.round(target*100)}%`;document.querySelector('#phase').textContent=target<.3?'01 — ANTES':target<.8?'02 — EL CUIDADO':'03 — COMO NUEVOS';}
try{
renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
stage.appendChild(renderer.domElement);
const environment=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(environment,.04).texture;environment.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xffffff,0x444b35,2));
const light=new THREE.DirectionalLight(0xffeee2,4);light.position.set(2,4,4);scene.add(light);
new GLTFLoader().load('/assets/sneaker.glb',async gltf=>{
const lightMaterial=await gltf.parser.getDependency('material',1);
gltf.scene.traverse(mesh=>{if(mesh.isMesh)mesh.material=lightMaterial;});
shoe=gltf.scene;const box=new THREE.Box3().setFromObject(shoe);const center=box.getCenter(new THREE.Vector3());const size=box.getSize(new THREE.Vector3());shoe.position.sub(center);const holder=new THREE.Group();holder.add(shoe);holder.scale.setScalar(2.75/Math.max(size.x,size.y,size.z));shoe=holder;scene.add(shoe);
shoe.traverse(mesh=>{
if(!mesh.isMesh)return;
mesh.material=mesh.material.clone();
const mat=mesh.material;
materials.push(mat);
mat.onBeforeCompile=shader=>{
shader.uniforms.clean={value:0};
shader.uniforms.dirtOrigin={value:center};
shader.uniforms.dirtScale={value:1/Math.max(size.x,size.y,size.z)};
mat.userData.shader=shader;
// Object-space noise stays continuous across UV islands and follows the shoe.
shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
uniform vec3 dirtOrigin;
uniform float dirtScale;
varying vec3 vDirtPosition;`).replace('#include <begin_vertex>',`#include <begin_vertex>
vDirtPosition = (position - dirtOrigin) * dirtScale;`);
shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
uniform float clean;
varying vec3 vDirtPosition;
float dirtHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.11, 0.37, 0.73));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float dirtNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dirtHash(i), dirtHash(i+vec3(1,0,0)), f.x),
                 mix(dirtHash(i+vec3(0,1,0)), dirtHash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(dirtHash(i+vec3(0,0,1)), dirtHash(i+vec3(1,0,1)), f.x),
                 mix(dirtHash(i+vec3(0,1,1)), dirtHash(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float dirtFbm(vec3 p) {
  float n = 0.0, weight = 0.55;
  for(int i=0; i<4; i++) {
    n += weight * dirtNoise(p);
    p = p * 2.13 + vec3(4.7, 9.2, 2.8);
    weight *= 0.48;
  }
  return n;
}`).replace('#include <color_fragment>',`#include <color_fragment>
float shade = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
diffuseColor.rgb = vec3(mix(0.62, 0.96, shade));
vec3 dirtP = vDirtPosition * 8.0;
vec3 warp = vec3(dirtNoise(dirtP + 7.1), dirtNoise(dirtP + 23.4), dirtNoise(dirtP - 11.8));
float soil = dirtFbm(dirtP + warp * 2.6);
float lowEdge = 1.0 - smoothstep(-0.16, 0.13, vDirtPosition.y);
float smudge = smoothstep(0.37, 0.70, soil);
float dust = smoothstep(0.24, 0.63, soil) * 0.15;
float grain = dirtNoise(vDirtPosition * 190.0);
float dirtMask = clamp(smudge * (0.48 + lowEdge * 0.45) + dust + lowEdge * grain * 0.07, 0.0, 0.84);
float sweep = vDirtPosition.x + 0.5 + (soil - 0.5) * 0.12;
float reveal = smoothstep(clean - 0.10, clean + 0.10, sweep);
vec3 soilTint = mix(vec3(0.35, 0.27, 0.19), vec3(0.53, 0.43, 0.31), soil);
diffuseColor.rgb *= mix(vec3(1.0), soilTint, dirtMask * reveal);`);
};
});loading.remove();resize();
},undefined,()=>{loading.textContent='No se pudo cargar el sneaker 3D. Recarga para intentarlo de nuevo.';});
resize();addEventListener('resize',resize);addEventListener('scroll',onScroll,{passive:true});onScroll();
renderer.setAnimationLoop(()=>{if(document.hidden)return;current+=(target-current)*.065;if(shoe){const p=reduced.matches?1:current;shoe.rotation.set(.12+Math.sin(p*Math.PI)*.14,-.65+p*1.35,-.28+p*.32);shoe.position.y=Math.sin(p*Math.PI)*.08;materials.forEach(m=>{if(m.userData.shader)m.userData.shader.uniforms.clean.value=p*1.3-.15;});}renderer.render(scene,camera);});
}catch{loading.textContent='La vista 3D no está disponible en este navegador. Puedes explorar nuestros servicios abajo.';}
