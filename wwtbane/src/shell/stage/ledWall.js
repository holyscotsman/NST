// ledWall.js — the curved video wall behind the audience.
//
// The old wall was a random grid of brightly coloured squares. It was the
// loudest thing in the room, so it competed with the quiz text for attention and
// read as a screensaver. A real LED wall in a broadcast set is the OPPOSITE:
// slow, low-contrast motion in the show's colours, so everything in front of it
// pops. That is what this draws:
//
//   - a gradient from black at the foot to an accent-tinted haze at the top
//   - three slow aurora ribbons, two in the accent's colours and one touched
//     with gold, drifting at different speeds
//   - a physical pixel mask: each cell a rounded square with a dark gap, so it
//     reads as hardware rather than a gradient
//   - rare "data sparks" that light a single cell, the only fast thing on it
//   - the show wordmark, as part of the display
//
// It is one unlit shader: its values go above 1.0 on purpose so bloom gives it a
// glow, and it recolours with the mood through the shared Accent.
import * as THREE from 'three';

const VERT = [
  'varying vec2 vUv;',
  'void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
].join('\n');

const FRAG = [
  'uniform float uTime, uLevel, uPulse, uMarkOn, uCells, uW, uH;',
  'uniform vec3 uA, uB, uGold;',
  'uniform sampler2D uMark;',
  'uniform float uMarkW;',
  'varying vec2 vUv;',
  'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
  'void main(){',
  '  vec2 w = vec2(vUv.x * uW, vUv.y * uH);',
  '  float t = uTime, y = vUv.y;',
  '  vec3 col = mix(vec3(0.004, 0.005, 0.012), uA * 0.15, pow(y, 1.6));',
  '  for (int i = 0; i < 3; i++) {',
  '    float fi = float(i);',
  '    float yc = 0.30 + 0.20 * fi + 0.11 * sin(w.x * (0.16 + 0.05 * fi) + t * (0.12 + 0.035 * fi) + fi * 2.0)',
  '                                + 0.05 * sin(w.x * 0.43 - t * 0.21 + fi);',
  '    float d = y - yc;',
  '    float band = exp(-d * d * (55.0 + 25.0 * fi));',
  '    vec3 c = (i == 1) ? uB : uA;',
  '    if (i == 2) c = mix(uA, uGold, 0.35);',
  '    col += c * band * (0.62 - 0.12 * fi);',
  '  }',
  '  vec2 cell = w * uCells;',
  '  vec2 f = fract(cell);',
  '  float m = smoothstep(0.0, 0.14, f.x) * smoothstep(1.0, 0.86, f.x) * smoothstep(0.0, 0.14, f.y) * smoothstep(1.0, 0.86, f.y);',
  '  float h = hash(floor(cell) + floor(t * 1.5));',
  '  float spark = step(0.9965, h) * (0.5 + 0.5 * sin(t * 6.0 + h * 40.0));',
  '  col += mix(uB, vec3(1.0), 0.5) * spark * 1.6;',
  '  col *= 0.7 + 0.3 * m;',
  // viewed from inside the cylinder U runs backwards, so mirror it or the title reads reversed
  '  float mx = 0.5 - (vUv.x - 0.5) / uMarkW;',
  '  if (mx > 0.0 && mx < 1.0) {',
  '    vec4 mk = texture2D(uMark, vec2(mx, y));',
  '    col = mix(col, mk.rgb * 1.55, mk.a * uMarkOn);',
  '  }',
  '  col += uA * (smoothstep(0.035, 0.0, y) + smoothstep(0.965, 1.0, y)) * 1.4;',
  '  col *= uLevel * (1.0 + uPulse * 0.6);',
  '  gl_FragColor = vec4(col, 1.0);',
  '  #include <tonemapping_fragment>',
  '  #include <colorspace_fragment>',
  '}',
].join('\n');

export function buildLedWall({ accent, markTexture, radius = 16, height = 4.6, thetaStart = Math.PI * 0.12, thetaLength = Math.PI * 1.76, y = 7.6 }) {
  const arc = radius * thetaLength;
  const material = new THREE.ShaderMaterial({
    name: 'LedWall',
    uniforms: {
      uTime: { value: 0 }, uLevel: { value: 1 }, uPulse: { value: 0 }, uMarkOn: { value: 0 },
      uCells: { value: 3.4 }, uW: { value: arc }, uH: { value: height },
      uA: { value: accent.color }, uB: { value: accent.alt }, uGold: { value: accent.gold },
      uMark: { value: markTexture }, uMarkW: { value: 0.16 },
    },
    vertexShader: VERT, fragmentShader: FRAG, side: THREE.BackSide,
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 96, 1, true, thetaStart, thetaLength), material);
  mesh.position.set(0, y, 0);
  let markTarget = 0;
  return {
    mesh,
    // The wordmark shows during play and gives way to the title / result / green
    // room screens, which carry their own. Eased so it fades rather than pops.
    showMark(on) { markTarget = on ? 1 : 0; },
    update(t, dt, { level = 1, pulse = 0, reduced = false } = {}) {
      const u = material.uniforms;
      u.uTime.value = reduced ? 0 : t; u.uLevel.value = level; u.uPulse.value = pulse;
      u.uMarkOn.value += (markTarget - u.uMarkOn.value) * (reduced ? 1 : Math.min(1, dt * 4));
    },
    dispose() { mesh.geometry.dispose(); material.dispose(); if (material.uniforms.uMark.value) material.uniforms.uMark.value.dispose(); },
  };
}
