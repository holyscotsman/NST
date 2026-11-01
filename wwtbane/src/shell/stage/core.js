// core.js — the centre of the deck.
//
// The old centre was a tall pole with two grid monitors on arms, directly
// between the host and the contestant: the single biggest thing blocking the
// two-shot. This replaces it with something airy that frames the shot instead of
// cutting it: a low plinth carrying three slow interlocking rings, a ring of
// orbiting nodes, a faint light column, and two thin glass panels either side.
//
// It also gets a job. The rings tighten at the lock-in beat (tension), pulse on a
// reveal, and the panels power down on 50:50 — the beat the camera was already
// looking at the old monitors for, which then did nothing.
import * as THREE from 'three';
import { PAL, mat } from './kit.js';
import { pbr } from './pbr.js';

export function buildCore({ accent }) {
  const group = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.64, 0.34, 56),
    pbr(new THREE.MeshStandardMaterial({ color: 0x0a0b14, metalness: 0.92, roughness: 0.28 }), 'onyx', { repeat: [3, 1], color: 0x8a8aa8, rough: 0.7, metal: 0.55 }));
  plinth.position.y = 0.17; group.add(plinth);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.016, 8, 72),
    accent.track(new THREE.MeshStandardMaterial({ color: 0x000000, emissiveIntensity: 1 }), 3.2));
  lip.rotation.x = Math.PI / 2; lip.position.y = 0.345; group.add(lip);

  const ringMat = (partner, scale) => accent.track(new THREE.MeshStandardMaterial({ color: 0x000000, emissiveIntensity: 1, transparent: true, opacity: 0.95 }), scale, partner);
  const rings = [
    { m: new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.018, 10, 120), ringMat(false, 3.0)), ax: [1, 0.2, 0], sp: 0.5 },
    { m: new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.016, 10, 120), ringMat(true, 3.0)), ax: [0.1, 1, 0.3], sp: -0.7 },
    { m: new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.014, 10, 120), ringMat(false, 3.4)), ax: [0.3, 0.2, 1], sp: 0.95 },
  ];
  const spin = new THREE.Group(); spin.position.y = 1.18; group.add(spin);
  for (const r of rings) { r.m.userData.ax = new THREE.Vector3(...r.ax).normalize(); spin.add(r.m); }

  // the crystal at the heart of it
  // a faceted glass crystal with a bright core, and a thin wireframe cage around it
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0),
    new THREE.MeshStandardMaterial({ color: 0xbfe8ff, metalness: 0.1, roughness: 0.08, transparent: true, opacity: 0.55, flatShading: true, emissive: 0x4fd8ff, emissiveIntensity: 0.55 }));
  crystal.scale.set(0.8, 1.25, 0.8);
  const heart = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35, toneMapped: false }));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14),
    accent.track(new THREE.MeshStandardMaterial({ color: 0x000000, emissiveIntensity: 1 }), 4.0));
  spin.add(heart, glow, crystal);

  // orbiting nodes
  const NN = 9;
  const nodes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), NN);
  const nc = new THREE.Color(); for (let i = 0; i < NN; i++) nodes.setColorAt(i, nc.setRGB(2.2, 2.2, 2.6));
  spin.add(nodes);

  // a column of light from the plinth, brightest at the base and gone by the top
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 2.4, 16, 1, true),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: accent.alt }, uOpacity: { value: 0.5 } },
      vertexShader: 'varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; varying float vY; void main(){ float a = pow(1.0 - vY, 1.6) * uOpacity; gl_FragColor = vec4(uColor * 1.6, a); }',
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }));
  column.position.y = 1.55; group.add(column);

  // two thin glass panels either side (the 50:50 beat powers these down). Not a
  // texture: a small shader, so the border follows the mood colour and a few
  // data bars slide along it.
  const panelUniforms = { uTime: { value: 0 }, uLevel: { value: 1 }, uAccent: { value: accent.color } };
  const panelMat = new THREE.ShaderMaterial({
    uniforms: panelUniforms,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform float uTime, uLevel; uniform vec3 uAccent; varying vec2 vUv;',
      'float hash(float n){ return fract(sin(n) * 43758.5453); }',
      'void main(){',
      '  vec2 uv = vUv;',
      '  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));',
      '  float border = smoothstep(0.035, 0.0, edge);',
      '  float scan = 0.5 + 0.5 * sin(uv.y * 110.0 - uTime * 1.2);',
      '  vec3 col = vec3(0.012, 0.02, 0.045) + uAccent * (0.05 + 0.04 * scan) * smoothstep(0.0, 0.5, uv.y);',
      '  for (int i = 0; i < 5; i++) {',
      '    float fi = float(i);',
      '    float y = 0.16 + fi * 0.16;',
      '    float len = 0.12 + 0.62 * hash(fi * 7.1 + floor(uTime * 0.5 + fi));',
      '    col += uAccent * 1.5 * step(abs(uv.y - y), 0.012) * step(0.1, uv.x) * step(uv.x, 0.1 + len);',
      '  }',
      '  col += uAccent * border * 2.4;',
      '  gl_FragColor = vec4(col * uLevel, 1.0);',
      '  #include <tonemapping_fragment>',
      '  #include <colorspace_fragment>',
      '}',
    ].join('\n'),
  });
  const panels = [];
  for (const sx of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.56), panelMat);
    panel.position.set(sx * 1.12, 1.32, 0.15); panel.rotation.y = -sx * 0.42; group.add(panel);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x0b0c16, metalness: 0.9, roughness: 0.3 }));
    frame.position.copy(panel.position); frame.position.z -= 0.02; frame.rotation.copy(panel.rotation); group.add(frame);
    panels.push(panel);
  }
  let panelTarget = 1, panelLevel = 1, tension = 0, tensionTarget = 0, flash = 0;
  const d = new THREE.Object3D();

  return {
    group, panels,
    // 50:50: the panels go dark. `true` restores them for the next question.
    powerPanels(on) { panelTarget = on ? 1 : 0; },
    setTension(on) { tensionTarget = on ? 1 : 0; },
    flash() { flash = 1; },
    update(t, dt, { reduced = false } = {}) {
      const k = reduced ? 1 : Math.min(1, dt * 3);
      tension += (tensionTarget - tension) * k;
      panelLevel += (panelTarget - panelLevel) * (reduced ? 1 : Math.min(1, dt * 5));
      flash = Math.max(0, flash - dt * 1.8);
      const tt = reduced ? 0 : t;
      rings.forEach((r, i) => { r.m.rotation.set(0, 0, 0); r.m.rotateOnAxis(r.m.userData.ax, tt * r.sp + i); r.m.scale.setScalar(1 - tension * 0.34 + flash * 0.25); });
      heart.rotation.y = tt * 0.8; heart.rotation.x = tt * 0.5;
      glow.scale.setScalar(1 + tension * 0.8 + flash * 1.4);
      for (let i = 0; i < NN; i++) {
        const a = tt * (0.6 + (i % 3) * 0.2) + (i / NN) * Math.PI * 2, rr = (0.34 + (i % 3) * 0.14) * (1 - tension * 0.34);
        d.position.set(Math.cos(a) * rr, Math.sin(a * 1.3) * 0.16, Math.sin(a) * rr); d.updateMatrix(); nodes.setMatrixAt(i, d.matrix);
      }
      nodes.instanceMatrix.needsUpdate = true;
      panelUniforms.uLevel.value = panelLevel; panelUniforms.uTime.value = tt;
      column.material.uniforms.uOpacity.value = 0.5 + tension * 0.5 + flash * 0.8;
    },
  };
}
