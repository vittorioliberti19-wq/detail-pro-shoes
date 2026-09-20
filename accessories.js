import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {addDirt} from './accessory-dirt.js';

// El bolso es un modelo propio. La gorra es "Baseball Cap" de jomalon (CC BY 4.0),
// decimada a 32,6k triangulos y comprimida con Draco; el credito esta en el pie.
let capPromise;
function loadCap(){
  if(!capPromise){
    const draco=new DRACOLoader().setDecoderPath('/draco/');
    const loader=new GLTFLoader().setDRACOLoader(draco);
    capPromise=loader.loadAsync('/assets/cap.glb').then(gltf=>{
      const model=gltf.scene;
      // El modelo no trae texturas: material propio, del mismo tono que el resto de la escena.
      model.traverse(o=>{
        if(!o.isMesh)return;
        o.material=new THREE.MeshStandardMaterial({color:0xe8e5dc,roughness:.78,metalness:0});
        addDirt(o.material,o.geometry);
      });
      const box=new THREE.Box3().setFromObject(model);
      const size=box.getSize(new THREE.Vector3());
      model.position.sub(box.getCenter(new THREE.Vector3()));
      const wrap=new THREE.Group();
      wrap.add(model);
      wrap.scale.setScalar(2.45/Math.max(size.x,size.y,size.z));
      return wrap;
    });
  }
  return capPromise.then(w=>w.clone(true));
}
function mesh(group, geometry, color, options={}) {
  const material=new THREE.MeshStandardMaterial({color,roughness:.72,...options});
  addDirt(material,geometry);
  const object=new THREE.Mesh(geometry,material);
  group.add(object);
  return object;
}
function seam(group,points,color=0xc9c5b9,radius=.008){
  return mesh(group,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,radius,6,false),color);
}
function bag(){
  const group=new THREE.Group();
  const outline=new THREE.Shape();
  outline.moveTo(-.94,-.74);outline.quadraticCurveTo(-1.11,-.72,-1.09,-.49);
  outline.lineTo(-.84,.67);outline.quadraticCurveTo(-.81,.78,-.65,.78);
  outline.lineTo(.65,.78);outline.quadraticCurveTo(.81,.78,.84,.67);
  outline.lineTo(1.09,-.49);outline.quadraticCurveTo(1.11,-.72,.94,-.74);outline.closePath();
  const body=mesh(group,new THREE.ExtrudeGeometry(outline,{depth:.64,bevelEnabled:true,bevelSize:.12,bevelThickness:.10,bevelSegments:5,curveSegments:24}),0xd9c9ad);
  body.position.z=-.32;
  for(const z of [-.43,.43]){
    seam(group,[new THREE.Vector3(-.91,-.65,z),new THREE.Vector3(-1,-.5,z),new THREE.Vector3(-.78,.65,z),new THREE.Vector3(0,.7,z),new THREE.Vector3(.78,.65,z),new THREE.Vector3(1,-.5,z),new THREE.Vector3(.91,-.65,z),new THREE.Vector3(0,-.69,z),new THREE.Vector3(-.91,-.65,z)],0xb9a788,.009);
    // Two raised leather handles, attached with brushed brass rings.
    seam(group,[new THREE.Vector3(-.52,.58,z),new THREE.Vector3(-.52,1.18,z),new THREE.Vector3(0,1.58,z),new THREE.Vector3(.52,1.18,z),new THREE.Vector3(.52,.58,z)],0xb39a76,.047);
    for(const x of [-.52,.52]){
      const ring=mesh(group,new THREE.TorusGeometry(.075,.016,10,24),0xd7b775,{metalness:.78,roughness:.26});ring.position.set(x,.62,z+.018);
      const tab=mesh(group,new THREE.BoxGeometry(.13,.29,.035),0xb9a17f);tab.position.set(x,.42,z);
    }
  }
  const zip=mesh(group,new THREE.BoxGeometry(1.40,.022,.065),0x9a794a,{metalness:.65,roughness:.3});zip.position.set(0,.885,0);
  for(let i=0;i<26;i++){
    const tooth=mesh(group,new THREE.BoxGeometry(.025,.024,.07),0xd0b782,{metalness:.75,roughness:.28});tooth.position.set(-.65+i*.052,.897,0);
  }
  const plaque=mesh(group,new THREE.BoxGeometry(.3,.09,.025),0xd0b782,{metalness:.7,roughness:.25});plaque.position.set(0,.22,.436);
  group.position.y=-.35;
  return group;
}

export function initAccessories(){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const panels=[...document.querySelectorAll('.accessory-story')];
  const observer=new IntersectionObserver(async entries=>{
    for(const entry of entries){
      const state=entry.target.accessory;
      if(state){state.visible=entry.isIntersecting;continue;}
      if(!entry.isIntersecting)continue;
      const story=entry.target,stage=story.querySelector('.accessory-stage');
      try{
        const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
        renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
        stage.append(renderer.domElement);
        const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,50);
        const env=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);
        scene.environment=pmrem.fromScene(env,.04).texture;env.dispose();pmrem.dispose();
        scene.add(new THREE.HemisphereLight(0xffffff,0x545846,1.3));
        const key=new THREE.DirectionalLight(0xfff3e7,2);key.position.set(3,5,4);scene.add(key);
        const holder=new THREE.Group(),model=story.dataset.model==='cap'?await loadCap():bag();holder.add(model);scene.add(holder);
        const materials=[];model.traverse(o=>{if(o.isMesh)materials.push(o.material);});
        const state={visible:true};story.accessory=state;
        const resize=()=>{const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.set(0,.85,camera.aspect<1?7.5:5.7);camera.lookAt(0,.1,0);camera.updateProjectionMatrix();};
        new ResizeObserver(resize).observe(stage);resize();
        let current=0;
        const meter=story.querySelector('.accessory-percent'),bar=story.querySelector('.accessory-progress'),phase=story.querySelector('.accessory-phase');
        renderer.setAnimationLoop(()=>{
          if(document.hidden||!state.visible)return;
          const sticky=story.querySelector('.accessory-sticky');
          const p=THREE.MathUtils.clamp((110-story.getBoundingClientRect().top)/Math.max(1,story.offsetHeight-sticky.offsetHeight),0,1);
          current=reduced.matches?p:Math.abs(current-p)<.001?p:THREE.MathUtils.lerp(current,p,.09);
          holder.rotation.set(.03,reduced.matches?-.45:-.65+current*(Math.PI*2+.30),reduced.matches?0:Math.sin(current*Math.PI)*.035);
          materials.forEach(m=>{if(m.userData.shader)m.userData.shader.uniforms.clean.value=current;});
          meter.textContent=`${Math.round(current*100)}%`;bar.style.width=`${current*100}%`;phase.textContent=current<.25?'01 — ANTES':current<.98?'02 — EL CUIDADO':'03 — LIMPIO';
          renderer.render(scene,camera);
        });
        stage.querySelector('.accessory-loading').remove();
      }catch{stage.querySelector('.accessory-loading').textContent='Explora nuestro cuidado profesional en esta sección.';}
    }
  },{rootMargin:'250px'});
  panels.forEach(panel=>observer.observe(panel));
}
