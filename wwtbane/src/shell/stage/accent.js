// accent.js — the set's colour script.
//
// The old studio drove the KEY light with the mood colour, so every face was
// washed in saturated purple or aqua and nothing read as skin. Real broadcast
// sets do the opposite: the key on the talent stays a clean warm white, and the
// mood lives in everything BEHIND them — the wall, the floor inlays, the rim
// lights, the beams.
//
// An Accent is that mood colour. It is one shared, eased Color: shaders hold a
// reference to it as a uniform (so updating it in place recolours them all for
// free), and standard materials register with track() so their emissive follows.
import * as THREE from 'three';
import { PAL } from './kit.js';

// What sits beside a mood colour so the set never goes single-hue. Gold (the
// money colour) is the one the rest of the brand has to survive against.
const PARTNER = {
  [PAL.iris]: PAL.aqua,
  [PAL.aqua]: PAL.iris,
  [PAL.gold]: PAL.iris,
  [PAL.peach]: PAL.iris,
  [PAL.mantis]: PAL.aqua,
};

export class Accent {
  constructor(hex = PAL.iris) {
    this.color = new THREE.Color(hex);
    this.alt = new THREE.Color(PARTNER[hex] || PAL.aqua);
    this.gold = new THREE.Color(PAL.gold);
    this.level = 1;               // overall brightness of the accent (0.5 = dimmed set)
    this._to = new THREE.Color(hex);
    this._toAlt = new THREE.Color(this.alt);
    this._toLevel = 1;
    this._tracked = [];
  }

  // Where the mood is heading. `snap` skips the ease (reduced motion, first frame).
  set(hex, level = 1, snap = false) {
    this._to.setHex(hex);
    this._toAlt.setHex(PARTNER[hex] || PAL.aqua);
    this._toLevel = level;
    if (snap) { this.color.copy(this._to); this.alt.copy(this._toAlt); this.level = level; this._apply(); }
  }

  // A material whose emissive colour follows the accent (or its partner),
  // scaled by `scale`. Returns the material so it can be used inline.
  track(material, scale = 1, partner = false) {
    this._tracked.push({ m: material, s: scale, p: partner });
    material.emissive.copy(partner ? this.alt : this.color).multiplyScalar(scale * this.level);
    return material;
  }

  update(dt, reduced) {
    const k = reduced ? 1 : Math.min(1, dt * 2.4);
    this.color.lerp(this._to, k);
    this.alt.lerp(this._toAlt, k);
    this.level += (this._toLevel - this.level) * k;
    this._apply();
  }

  _apply() {
    for (const t of this._tracked) t.m.emissive.copy(t.p ? this.alt : this.color).multiplyScalar(t.s * this.level);
  }
}
