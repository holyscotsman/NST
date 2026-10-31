// floor.js — the stage deck: black glass with light inlaid in it.
//
// The old floor was a flat dark disc with a texture. The signature of a produced
// game-show set is a deck you can see the whole room in: the wall, the beams and
// the talent doubled in glossy black. That is a planar mirror, and a mirror is
// expensive, so there are two paths and ONE shader:
//
//   high    a real-time Reflector, rendered at half resolution and blurred with a
//           9-tap disc in the shader (a dead-sharp mirror looks like a bathroom
//           tile; the blur is what makes it read as polished glass)
//   others  no second render: the same shader fakes the sheen from the accent
//           colour, strongest at grazing angles where a real mirror would be
//
// Everything glowing on the deck is drawn in the shader as inlay — rings, dashed
// gold track, spokes and a ring of "cluster nodes" (a nod to what the product
// actually is) — so it costs no geometry, bloom picks it up, and it recolours
// with the mood for free.
import * as THREE from 'three';
import { pbrTexture } from './pbr.js';

const COMMON_VERT = [
  'varying vec3 vWorld; varying vec2 vLocal;',
  '#ifdef MIRROR',
  'uniform mat4 textureMatrix; varying vec4 vProj;',
  '#endif',
  'void main(){',
  '  vLocal = position.xy;',
  '  vec4 w = modelMatrix * vec4(position, 1.0);',
  '  vWorld = w.xyz;',
  '#ifdef MIRROR',
  '  vProj = textureMatrix * vec4(position, 1.0);',
  '#endif',
  '  gl_Position = projectionMatrix * viewMatrix * w;',
  '}',
].join('\n');

const COMMON_FRAG = [
  'uniform vec3 color; uniform sampler2D tDiffuse; uniform mat4 textureMatrix;',
  'uniform vec3 uAccent, uAlt, uGold;',
  'uniform sampler2D tMarble; uniform float uMarble;',
  'uniform float uTime, uLevel, uPulse;',
  'varying vec3 vWorld; varying vec2 vLocal;',
  '#ifdef MIRROR',
  'varying vec4 vProj;',
  '#endif',
  'const float TAU = 6.2831853;',
  'float ring(float r, float r0, float w){ return smoothstep(w, 0.0, abs(r - r0)); }',
  'void main(){',
  '  float r = length(vLocal);',
  '  float ang = atan(vLocal.y, vLocal.x);',
  '  vec3 V = normalize(cameraPosition - vWorld);',
  '  float up = clamp(V.y, 0.0, 1.0);',
  '  float F = 0.05 + 0.95 * pow(1.0 - up, 4.0);',
  '  vec3 base = mix(vec3(0.004, 0.005, 0.012), vec3(0.016, 0.018, 0.040), smoothstep(8.5, 0.0, r));',
  // fine radial brushing: breaks the reflection up so it is glass, not a mirror
  '  float brush = 0.58 + 0.42 * sin(ang * 260.0 + r * 1.7) * sin(ang * 61.0 - r * 0.9);',
  '#ifdef MIRROR',
  '  float dist = length(cameraPosition - vWorld);',
  '  float blur = 0.0025 + 0.0016 * dist;',
  '  vec3 refl = vec3(0.0);',
  '  for (int i = 0; i < 9; i++) {',
  '    float a = float(i) * 2.399963;',
  '    float rr = sqrt((float(i) + 0.5) / 9.0);',
  '    vec2 o = vec2(cos(a), sin(a)) * rr * blur;',
  '    refl += texture2DProj(tDiffuse, vec4(vProj.xy + o * vProj.w, vProj.zw)).rgb;',
  '  }',
  '  refl /= 9.0;',
  '#else',
  '  vec3 refl = mix(vec3(0.004, 0.005, 0.012), uAccent * 0.30 + vec3(0.02, 0.03, 0.07), pow(1.0 - up, 1.4));',
  '#endif',
  '  vec3 emit = vec3(0.0);',
  '  emit += uAccent * ring(r, 2.62, 0.022) * 3.0;',
  // dashed gold track
  '  emit += uGold * ring(r, 3.05, 0.012) * 1.6 * step(0.42, fract(ang / TAU * 18.0));',
  '  emit += uAlt * ring(r, 5.30, 0.020) * 2.0;',
  // spokes
  '  float sd = abs(fract(ang / TAU * 24.0 + 0.5) - 0.5) * (TAU / 24.0) * r;',
  '  emit += uGold * smoothstep(0.016, 0.0, sd) * smoothstep(3.3, 3.55, r) * smoothstep(7.8, 7.5, r) * 0.55;',
  // twelve cluster nodes on a hairline ring
  '  float ns = abs(fract(ang / TAU * 12.0 + 0.5) - 0.5) * (TAU / 12.0) * r;',
  '  emit += uAlt * smoothstep(0.15, 0.05, length(vec2(ns, r - 6.4))) * 3.2;',
  '  emit += uAlt * ring(r, 6.4, 0.007) * 0.7;',
  // deck edge strip + its halo
  '  emit += uAccent * ring(r, 8.92, 0.035) * 3.4;',
  '  emit += uAccent * 0.4 * smoothstep(0.4, 0.0, abs(r - 8.92));',
  // dark veined marble under the glass: the veins catch a little light and break the reflection up
  '  vec3 mt = texture2D(tMarble, vWorld.xz * 0.11).rgb;',
  '  float vein = smoothstep(0.12, 0.65, dot(mt, vec3(0.333)));',
  '  base += uMarble * (mt * mt * 0.10 + vein * vec3(0.012, 0.014, 0.03));',
  '  float polish = mix(1.0, 0.62 + 0.55 * (1.0 - vein), uMarble);',
  '  vec3 col = base + refl * F * brush * polish + emit * uLevel * (1.0 + uPulse * 1.6);',
  '  col *= smoothstep(9.3, 7.2, r) * 0.25 + 0.75;',
  '  gl_FragColor = vec4(col, 1.0);',
  '  #include <tonemapping_fragment>',
  '  #include <colorspace_fragment>',
  '}',
].join('\n');

const WHITE = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
WHITE.needsUpdate = true;

function uniforms(accent) {
  return {
    color: { value: new THREE.Color(0x7f7f7f) },
    tDiffuse: { value: null },
    textureMatrix: { value: new THREE.Matrix4() },
    uAccent: { value: accent.color },   // by reference: the mood recolours the deck for free
    uAlt: { value: accent.alt },
    uGold: { value: accent.gold },
    uTime: { value: 0 }, uLevel: { value: 1 }, uPulse: { value: 0 },
    tMarble: { value: WHITE }, uMarble: { value: 0 },        // the marble maps arrive a moment after the stage (see buildFloor)
  };
}

export async function buildFloor({ tier, accent, radius = 9 }) {
  const group = new THREE.Group();
  const geo = new THREE.CircleGeometry(radius, 128);
  let deck, reflector = null, material;

  if (tier.mirror) {
    const { Reflector } = await import('three/addons/objects/Reflector.js');
    const scale = 0.5;
    reflector = new Reflector(geo, {
      textureWidth: Math.max(256, Math.round(window.innerWidth * Math.min(window.devicePixelRatio || 1, tier.dpr) * scale)),
      textureHeight: Math.max(256, Math.round(window.innerHeight * Math.min(window.devicePixelRatio || 1, tier.dpr) * scale)),
      clipBias: 0.003,
      multisample: 0, // the blur hides aliasing; MSAA on a half-res target is wasted
      shader: {
        name: 'StageDeck',
        uniforms: uniforms(accent),
        vertexShader: '#define MIRROR\n' + COMMON_VERT,
        fragmentShader: '#define MIRROR\n' + COMMON_FRAG,
      },
    });
    deck = reflector;
    material = reflector.material;
  } else {
    material = new THREE.ShaderMaterial({
      name: 'StageDeck', uniforms: uniforms(accent),
      vertexShader: COMMON_VERT, fragmentShader: COMMON_FRAG,
    });
    deck = new THREE.Mesh(geo, material);
  }
  pbrTexture('marble', 'color').then((t) => { if (t) { material.uniforms.tMarble.value = t; material.uniforms.uMarble.value = 1; } });
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = 0;
  group.add(deck);

  // Glass does not receive shadows, so the deck gets a separate, transparent
  // catcher on top: the contact shadow under the chairs and the talent. Without
  // it everything floats.
  const catcher = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), new THREE.ShadowMaterial({ opacity: 0.55 }));
  catcher.rotation.x = -Math.PI / 2; catcher.position.y = 0.004; catcher.receiveShadow = true;
  group.add(catcher);

  // The deck's edge: a dark skirt and a lit lip.
  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(radius + 0.02, radius + 0.25, 0.5, 128, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x07080f, roughness: 0.35, metalness: 0.85 }));
  skirt.position.y = -0.25; group.add(skirt);

  // The pit beyond the deck, out to the audience risers.
  const pit = new THREE.Mesh(new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({ color: 0x05060c, roughness: 0.9, metalness: 0.1 }));
  pit.rotation.x = -Math.PI / 2; pit.position.y = -0.5; group.add(pit);

  const hide = []; // objects not worth a second render in the mirror (the crowd)
  if (reflector) {
    const orig = reflector.onBeforeRender;
    reflector.onBeforeRender = function (renderer, scene, camera) {
      for (const o of hide) { o.userData._v = o.visible; o.visible = false; }
      orig.call(this, renderer, scene, camera);
      for (const o of hide) o.visible = o.userData._v;
    };
  }

  return {
    group, deck, catcher, hide, reflector,
    update(t, { level = 1, pulse = 0 } = {}) {
      const u = material.uniforms;
      u.uTime.value = t; u.uLevel.value = level; u.uPulse.value = pulse;
    },
    resize(w, h, dpr) {
      if (!reflector) return;
      const rt = reflector.getRenderTarget();
      rt.setSize(Math.max(256, Math.round(w * dpr * 0.5)), Math.max(256, Math.round(h * dpr * 0.5)));
    },
    dispose() {
      geo.dispose(); material.dispose();
      if (reflector) reflector.dispose();
    },
  };
}
