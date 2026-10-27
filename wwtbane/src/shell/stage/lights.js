// lights.js — the lighting rig, and why it is arranged the way it is.
//
//   KEY     warm white, from front-high: the only shadow caster and the only
//           light that decides what skin looks like. It is never tinted.
//   FILL    soft cool, from the opposite side, no shadows: lifts the shadow side
//           so faces are readable without flattening them.
//   RIMS    two spots from behind and either side, tinted by the mood accent:
//           they put a bright edge on shoulders and hair that separates the talent
//           from the dark behind them. This is where the colour lives.
//   SPILL   a wide soft wash from the wall side: the room's coloured ambience on
//           the deck and the backs of chairs.
//   WARM    a low gold kick from the front, like light bouncing off a gold floor.
//   PULSE   a point light used for reveal flashes (correct = mantis, wrong = peach).
//
// A forward renderer pays for every light on every pixel, so there are eight and
// the low tier drops to five. Intensities are in three.js's physical units; the
// numbers are tuned by eye against the deck and the contestants.
import * as THREE from 'three';
import { PAL } from './kit.js';

export function buildLights(scene, tier, accent) {
  const L = {};

  L.hemi = new THREE.HemisphereLight(0x3a3f8a, 0x07050e, 0.22);
  scene.add(L.hemi);

  L.key = new THREE.SpotLight(0xfff0dc, 185, 80, 0.46, 0.6, 1.25);
  L.key.position.set(3.2, 13, 10.5);
  L.key.target.position.set(0, 1.2, 0);
  L.key.castShadow = true;
  L.key.shadow.mapSize.set(tier.shadowMap, tier.shadowMap);
  L.key.shadow.camera.near = 6; L.key.shadow.camera.far = 40;
  L.key.shadow.bias = -0.0005; L.key.shadow.normalBias = 0.02; L.key.shadow.radius = 4;
  scene.add(L.key, L.key.target);

  L.fill = new THREE.SpotLight(0xaab8ff, 20, 60, 0.75, 0.85, 1.2);
  L.fill.position.set(-8.5, 8, 9);
  L.fill.target.position.set(0, 1.3, 0);
  scene.add(L.fill, L.fill.target);

  L.rimA = new THREE.SpotLight(accent.alt, 85, 45, 0.62, 0.7, 1.25);
  L.rimA.position.set(-6.5, 6.5, -7.5);
  L.rimA.target.position.set(-1.4, 1.4, 0.5);
  L.rimB = new THREE.SpotLight(accent.color, 85, 45, 0.62, 0.7, 1.25);
  L.rimB.position.set(6.5, 6.5, -7.5);
  L.rimB.target.position.set(1.4, 1.4, 0.5);
  scene.add(L.rimA, L.rimA.target, L.rimB, L.rimB.target);

  L.pulse = new THREE.PointLight(PAL.mantis, 8, 40);
  L.pulse.position.set(0, 2, 3);
  scene.add(L.pulse);

  if (tier.rimLight) {
    L.spill = new THREE.SpotLight(accent.color, 14, 60, 1.0, 1.0, 1.0);
    L.spill.position.set(0, 9, -12);
    L.spill.target.position.set(0, 0, 0);
    scene.add(L.spill, L.spill.target);

    L.warm = new THREE.PointLight(PAL.gold, 5, 26);
    L.warm.position.set(0, 2.2, 5);
    scene.add(L.warm);
  }

  // Remembered so the lock-in dim can scale from the authored values.
  const base = {
    hemi: L.hemi.intensity, fill: L.fill.intensity,
    rimA: L.rimA.intensity, rimB: L.rimB.intensity,
    spill: L.spill ? L.spill.intensity : 0, warm: L.warm ? L.warm.intensity : 0,
  };

  return {
    ...L,
    // `env` is 1 at full rig and ~0.3 at the lock-in tension pool: fills and
    // wash fall away, the key stays, so the contestant is lit alone.
    // `pulse` is the 0..1 amount of a reveal flash; `pulseColor` its colour.
    update({ env = 1, pulse = 0, pulseColor = null }) {
      L.hemi.intensity = base.hemi * (0.5 + 0.5 * env);
      L.fill.intensity = base.fill * env;
      L.rimA.intensity = base.rimA * (0.5 + 0.5 * env);
      L.rimB.intensity = base.rimB * (0.5 + 0.5 * env);
      L.rimA.color.copy(accent.alt);
      L.rimB.color.copy(accent.color);
      if (L.spill) { L.spill.intensity = base.spill * env; L.spill.color.copy(accent.color); }
      if (L.warm) L.warm.intensity = base.warm * env;
      L.pulse.intensity = 8 + pulse * 90;
      if (pulseColor) L.pulse.color.copy(pulseColor);
    },
  };
}
