// Suciedad procedural en espacio de objeto, con un patrón por tipo de pieza.
// La limpieza sigue siendo una barrida horizontal gobernada por `clean`, igual que en el sneaker.

// cap: sudor y sebo concentrados en la banda frontal y el filo de la visera, de tono ámbar.
// bag: polvo y roce de uso en la base, las esquinas y las asas, de tono gris pardo y manchas más anchas.
const PRESETS = {
  cap: {
    scale: 11.5,
    tintA: [0.46, 0.34, 0.14],
    tintB: [0.62, 0.5, 0.24],
    band: 1.0, // aro de sudor alrededor de la banda
    edge: 0.0, // sin desgaste de esquinas
    speck: 0.16, // salpicaduras finas
    streak: 0.0,
    strength: 1.55,
  },
  bag: {
    scale: 6.2,
    tintA: [0.3, 0.28, 0.26],
    tintB: [0.48, 0.44, 0.39],
    band: 0.0,
    edge: 1.0, // se ensucia por base y extremos
    speck: 0.05,
    streak: 0.85, // rayas verticales de roce
    strength: 1.35,
  },
};

export function addDirt(material, geometry, kind = "bag") {
  const preset = PRESETS[kind] ?? PRESETS.bag;
  geometry.computeBoundingBox();
  const dirtMin = geometry.boundingBox.min.clone();
  const dirtSize = geometry.boundingBox.max.clone().sub(dirtMin);
  dirtSize.set(
    Math.max(dirtSize.x, 1e-5),
    Math.max(dirtSize.y, 1e-5),
    Math.max(dirtSize.z, 1e-5),
  );
  material.onBeforeCompile = (shader) => {
    shader.uniforms.clean = { value: 0 };
    shader.uniforms.dirtMin = { value: dirtMin };
    shader.uniforms.dirtSize = { value: dirtSize };
    material.userData.shader = shader;
    // El ruido en espacio de objeto se mantiene continuo entre islas de UV y acompaña a la pieza.
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 dirtMin;
uniform vec3 dirtSize;
varying vec3 vDirtPosition;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vDirtPosition = (position - dirtMin) / dirtSize - 0.5;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
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
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec3 dirtP = vDirtPosition * ${preset.scale.toFixed(2)};
vec3 warp = vec3(dirtNoise(dirtP + 7.1), dirtNoise(dirtP + 23.4), dirtNoise(dirtP - 11.8));
float soil = dirtFbm(dirtP + warp * 2.6);
float film = 0.06 + smoothstep(0.10, 0.90, dirtFbm(dirtP * 0.55 + 31.0)) * 0.14;
float smudge = smoothstep(0.37, 0.70, soil);

// Aro de sudor: rodea la pieza a la altura de la banda y sube por el frente.
float band = 1.0 - smoothstep(0.0, 0.26, abs(vDirtPosition.y + 0.30));
band *= 0.45 + 0.55 * smoothstep(-0.1, 0.45, vDirtPosition.z);
band *= 0.75 + 0.45 * soil;

// Desgaste de uso: base y extremos laterales, donde la pieza se apoya y roza.
float edge = 1.0 - smoothstep(-0.42, -0.02, vDirtPosition.y);
edge = max(edge, smoothstep(0.30, 0.50, abs(vDirtPosition.x)) * 0.75);
edge *= 0.55 + 0.60 * soil;

// Rayas verticales de roce, alargadas en Y.
float streak = smoothstep(0.55, 0.95, dirtFbm(vec3(dirtP.x * 2.4, dirtP.y * 0.22, dirtP.z * 2.4) + 5.0));

float speck = smoothstep(0.72, 0.99, dirtNoise(vDirtPosition * 150.0));

float dirtMask = film + smudge * 0.42
  + band * ${preset.band.toFixed(2)} * 0.62
  + edge * ${preset.edge.toFixed(2)} * 0.55
  + streak * ${preset.streak.toFixed(2)} * 0.30
  + speck * ${preset.speck.toFixed(2)};
dirtMask = clamp(dirtMask * ${preset.strength.toFixed(2)}, 0.0, 0.93);

float sweep = vDirtPosition.x + 0.5 + (soil - 0.5) * 0.12;
float sweepRemoval = smoothstep(sweep - 0.10, sweep + 0.10, clean * 1.20 - 0.10);
float dirtOpacity = dirtMask * (1.0 - sweepRemoval);
if (clean <= 0.0) dirtOpacity = dirtMask;
if (clean >= 1.0) dirtOpacity = 0.0;
vec3 soilTint = mix(vec3(${preset.tintA.map((v) => v.toFixed(3)).join(", ")}), vec3(${preset.tintB.map((v) => v.toFixed(3)).join(", ")}), soil);
diffuseColor.rgb *= mix(vec3(1.0), soilTint, dirtOpacity);`,
      );
  };
}
