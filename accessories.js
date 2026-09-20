import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {addDirt} from './accessory-dirt.js';

// Original procedural models: no external model downloads or third-party marks.
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
function cap(){
  const group=new THREE.Group();
  // A fitted six-panel sports cap: tapered oval crown and a bent, narrow bill.
  const profile=(t,a,offset=0)=>{
    const r=Math.pow(Math.sin(t),.78);
    return new THREE.Vector3((.82+offset)*r*Math.cos(a),.73*Math.cos(t)+offset,(1.0+offset)*r*Math.sin(a)-.08*Math.cos(t));
  };
  const geometry=new THREE.SphereGeometry(1,72,36,0,Math.PI*2,0,Math.PI/2);
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    const t=Math.acos(THREE.MathUtils.clamp(positions.getY(i),0,1));
    const a=Math.atan2(positions.getZ(i),positions.getX(i));
    const v=profile(t,a);positions.setXYZ(i,v.x,v.y,v.z);
  }
  // Open arch at the back, as on an adjustable sports cap.
  const original=geometry.index.array,indices=[];
  for(let i=0;i<original.length;i+=3){
    const ids=[original[i],original[i+1],original[i+2]];
    const x=ids.reduce((n,j)=>n+positions.getX(j),0)/3;
    const y=ids.reduce((n,j)=>n+positions.getY(j),0)/3;
    const z=ids.reduce((n,j)=>n+positions.getZ(j),0)/3;
    if(z<-.78 && (x/.30)**2+(y/.28)**2<1)continue;
    indices.push(...ids);
  }
  geometry.setIndex(indices);geometry.computeVertexNormals();
  mesh(group,geometry,0xe4e5e2,{side:THREE.DoubleSide,roughness:.94});
  const hem=[];for(let i=0;i<=100;i++){const a=-Math.PI/2+.37+i/100*(Math.PI*2-.74);hem.push(profile(Math.PI/2,a,.005));}
  seam(group,hem,0xc6c8c2,.022);
  const arch=[];for(let i=0;i<=36;i++){const a=Math.PI*i/36;const x=.30*Math.cos(a);arch.push(new THREE.Vector3(x,.28*Math.sin(a),-Math.sqrt(1-(x/.82)**2)-.008));}
  seam(group,arch,0xd2d4ce,.012);
  const strap=mesh(group,new THREE.BoxGeometry(.53,.075,.035),0xc8cbc3);strap.position.set(.035,.025,-1.012);
  const buckle=mesh(group,new THREE.BoxGeometry(.085,.09,.045),0x666b66,{metalness:.7,roughness:.4});buckle.position.set(.18,.025,-1.036);
  const visor=new THREE.Shape();
  visor.moveTo(-.73,.42);visor.bezierCurveTo(-.86,.89,-.78,1.64,-.48,1.77);
  visor.quadraticCurveTo(0,1.95,.48,1.77);visor.bezierCurveTo(.78,1.64,.86,.89,.73,.42);
  visor.quadraticCurveTo(0,.86,-.73,.42);
  const brimGeometry=new THREE.ExtrudeGeometry(visor,{depth:.026,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:3,steps:1,curveSegments:36});
  const bend=(x,z)=>{const join=Math.sqrt(Math.max(0,1-(x/.82)**2));const extension=Math.max(0,z-join);return .005-(.23*(x/.82)**2+.10)*extension;};
  const bp=brimGeometry.attributes.position;
  for(let i=0;i<bp.count;i++){const x=bp.getX(i),z=bp.getY(i),depth=bp.getZ(i);bp.setXYZ(i,x,bend(x,z)-depth,z);}
  brimGeometry.computeVertexNormals();mesh(group,brimGeometry,0xe3e5e1,{roughness:.95});
  // Fine tonal stitching follows the bend rather than floating above the brim.
  for(let row=0;row<3;row++){
    const pts=[];for(let i=0;i<=60;i++){const a=Math.PI*i/60,x=Math.cos(a)*(.72-row*.06),z=.78+Math.sin(a)*(1.05-row*.075);pts.push(new THREE.Vector3(x,bend(x,z)+.004,z));}
    seam(group,pts,0xcdd0c8,.0025);
  }
  for(let i=0;i<6;i++){
    const a=Math.PI/6+i*Math.PI/3,pts=[];
    for(let j=0;j<=36;j++)pts.push(profile(j/36*Math.PI/2,a,.005));
    seam(group,pts,0xcfd1cb,.004);
    const v=profile(1.02,a,.012);
    const eye=mesh(group,new THREE.TorusGeometry(.018,.005,6,14),0xb5b9b0);
    eye.position.copy(v);eye.lookAt(v.clone().add(new THREE.Vector3(Math.cos(a),.4,Math.sin(a))));
  }
  const button=mesh(group,new THREE.SphereGeometry(.048,20,12),0xd7dad3);button.position.set(0,.735,-.08);button.scale.y=.4;
  // Small unbranded orange embroidery, not a rigid rectangular badge.
  seam(group,[new THREE.Vector3(-.10,.32,.894),new THREE.Vector3(.01,.35,.88),new THREE.Vector3(.10,.40,.854)],0xf05223,.014);
  group.position.set(0,-.25,-.30);group.rotation.x=.08;
  return group;
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
  const observer=new IntersectionObserver(entries=>{
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
        const holder=new THREE.Group(),model=story.dataset.model==='cap'?cap():bag();holder.add(model);scene.add(holder);
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
