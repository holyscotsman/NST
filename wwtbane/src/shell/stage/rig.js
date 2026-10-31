// rig.js — the lighting truss, the moving-head fixtures hanging from it, and the
// volumetric beams they throw.
//
// The old "beams" were four flat translucent cones at a constant 3% opacity,
// which read as plastic funnels. Light in haze looks different: it is brightest
// at the source, fades as it spreads, has soft edges (you see it through the
// thickest part of the cone, not the rim), and is faintly grainy where dust
// catches it. The beam shader does exactly those four things.
//
// Each fixture is a real object — yoke, barrel, glowing lens — that actually
// turns to point at where its beam lands, and a soft pool of light is laid on
// the deck where the beam meets it (and, on the mirror tier, doubled in the glass).
import * as THREE from 'three';
import { pbr } from './pbr.js';
import { PAL } from './kit.js';

const BEAM_VERT = [
  'uniform float uLen;',
  'varying float vT; varying vec3 vN; varying vec3 vV;',
  'void main(){',
  '  vT = clamp(position.z / uLen, 0.0, 1.0);',
  '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
  '  vN = normalize(normalMatrix * normal);',
  '  vV = normalize(-mv.xyz);',
  '  gl_Position = projectionMatrix * mv;',
  '}',
].join('\n');

const BEAM_FRAG = [
  'uniform vec3 uColor; uniform float uOpacity, uTime, uSeed;',
  'varying float vT; varying vec3 vN; varying vec3 vV;',
  'void main(){',
  // soft edges: look THROUGH the cone, so the middle is densest
  '  float edge = pow(clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.4);',
  // brightest at the lens, fading as it spreads
  '  float along = smoothstep(0.0, 0.07, vT) * pow(1.0 - vT, 1.5);',
  // a little drift where dust catches it
  '  float dust = 0.86 + 0.14 * sin(vT * 38.0 - uTime * 1.6 + uSeed * 6.0);',
  '  float a = edge * along * dust * uOpacity;',
  '  gl_FragColor = vec4(uColor * 1.7, a);',
  '}',
].join('\n');

const POOL_FRAG = [
  'uniform vec3 uColor; uniform float uOpacity;',
  'varying vec2 vUv;',
  'void main(){',
  '  float d = length(vUv - 0.5) * 2.0;',
  '  float a = pow(clamp(1.0 - d, 0.0, 1.0), 2.2) * uOpacity;',
  '  gl_FragColor = vec4(uColor * 1.4, a);',
  '}',
].join('\n');
const POOL_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

export function buildRig({ tier, accent, radius = 8, y = 6.4 }) {
  const group = new THREE.Group();
  const dark = pbr(new THREE.MeshStandardMaterial({ color: 0x14151d, metalness: 0.85, roughness: 0.42 }), 'steel', { repeat: [3, 1], color: 0x6a6a76, rough: 1, metal: 0.9 });

  // ---- truss: two chords and a lattice of diagonals between them ----
  const chordGeo = (yy) => { const g = new THREE.TorusGeometry(radius, 0.06, 8, 96); g.rotateX(Math.PI / 2); g.translate(0, yy, 0); return g; };
  const top = new THREE.Mesh(chordGeo(y), dark); const bot = new THREE.Mesh(chordGeo(y - 0.55), dark);
  group.add(top, bot);
  const N = 64, diag = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.035, 1), dark, N);
  const d = new THREE.Object3D(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const a1 = (i / N) * Math.PI * 2, a2 = ((i + 1) / N) * Math.PI * 2;
    const lowFirst = i % 2 === 0;
    p1.set(Math.cos(a1) * radius, lowFirst ? y - 0.55 : y, Math.sin(a1) * radius);
    p2.set(Math.cos(a2) * radius, lowFirst ? y : y - 0.55, Math.sin(a2) * radius);
    d.position.copy(p1).add(p2).multiplyScalar(0.5);
    d.lookAt(p2); d.scale.set(1, 1, p1.distanceTo(p2)); d.updateMatrix();
    diag.setMatrixAt(i, d.matrix);
  }
  diag.instanceMatrix.needsUpdate = true; group.add(diag);
  // LED strip along the truss's inner lower edge, in the accent colour
  const strip = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.08, 0.025, 6, 96),
    accent.track(new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x000000, emissiveIntensity: 1 }), 2.2));
  strip.rotation.x = Math.PI / 2; strip.position.y = y - 0.62; group.add(strip);

  // ---- fixtures ----
  const NF = 12;
  const fixtures = [];
  const lensMatA = accent.track(new THREE.MeshStandardMaterial({ color: 0x000000, emissiveIntensity: 1 }), 3.0);
  const lensMatB = accent.track(new THREE.MeshStandardMaterial({ color: 0x000000, emissiveIntensity: 1 }), 3.0, true);
  const beamCount = Math.min(NF, tier.beams);
  const BEAM_LEN = 15;
  const beamGeo = new THREE.CylinderGeometry(1.05, 0.05, BEAM_LEN, 40, 1, true);
  beamGeo.translate(0, BEAM_LEN / 2, 0); beamGeo.rotateX(Math.PI / 2); // apex at origin, opening along +z
  const poolGeo = new THREE.PlaneGeometry(1, 1);

  for (let i = 0; i < NF; i++) {
    const a = (i / NF) * Math.PI * 2 + Math.PI / NF;
    const fx = new THREE.Group();
    fx.position.set(Math.cos(a) * (radius - 0.25), y - 0.62, Math.sin(a) * (radius - 0.25));
    const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.1), dark); yoke.position.y = 0.05; fx.add(yoke);
    const head = new THREE.Group(); head.position.y = -0.1; fx.add(head);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.36, 20), dark);
    barrel.rotation.x = Math.PI / 2; head.add(barrel);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), i % 2 ? lensMatA : lensMatB);
    lens.position.z = 0.185; head.add(lens);

    let beam = null, pool = null;
    if (i < beamCount) {
      const mat = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: i % 2 ? accent.color : accent.alt }, uOpacity: { value: 0.11 }, uTime: { value: 0 }, uSeed: { value: i * 0.37 }, uLen: { value: BEAM_LEN } },
        vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      beam = new THREE.Mesh(beamGeo, mat); beam.position.z = 0.19; head.add(beam);
      const pmat = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: i % 2 ? accent.color : accent.alt }, uOpacity: { value: 0.3 } },
        vertexShader: POOL_VERT, fragmentShader: POOL_FRAG,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      pool = new THREE.Mesh(poolGeo, pmat); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.012;
      group.add(pool);
    }
    group.add(fx);
    // each fixture has its own wander around a base mark on the deck
    const ba = (i / NF) * Math.PI * 2 * 1.7 + 0.6;
    fixtures.push({ fx, head, beam, pool, base: new THREE.Vector3(Math.cos(ba) * 2.4, 0.2, Math.sin(ba) * 2.4), seed: i * 1.73, wp: new THREE.Vector3(), dir: new THREE.Vector3() });
  }

  const tgt = new THREE.Vector3(), wpos = new THREE.Vector3();
  return {
    group, beams: fixtures.filter((f) => f.beam).map((f) => f.beam),
    // `spin` speeds the sweep (a win bumps it); reduced motion freezes the aim.
    update(t, { spin = 1, reduced = false, level = 1 } = {}) {
      const tt = reduced ? 0 : t * 0.32 * spin;
      for (const f of fixtures) {
        const s = f.seed;
        tgt.set(f.base.x + Math.sin(tt + s) * 1.6, 0.1, f.base.z + Math.cos(tt * 0.83 + s * 1.3) * 1.6);
        f.head.lookAt(tgt);
        if (f.beam) {
          f.beam.material.uniforms.uTime.value = reduced ? 0 : t;
          f.beam.material.uniforms.uOpacity.value = 0.11 * level;
          // where the beam meets the deck
          f.head.getWorldPosition(wpos);
          f.dir.copy(tgt).sub(wpos).normalize();
          if (f.dir.y < -0.05) {
            const k = -wpos.y / f.dir.y;
            f.pool.position.set(wpos.x + f.dir.x * k, 0.012, wpos.z + f.dir.z * k);
            const r = 0.4 + 1.05 * (k / BEAM_LEN) * 1.5;
            f.pool.scale.set(r * 2, r * 2, 1);
            f.pool.material.uniforms.uOpacity.value = 0.3 * level;
            f.pool.visible = true;
          } else f.pool.visible = false;
        }
      }
    },
    dispose() { beamGeo.dispose(); poolGeo.dispose(); },
  };
}
