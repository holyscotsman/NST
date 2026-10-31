// Voxel people for WWTBANE, built with kiln: one model per look, each made of named parts (head, torso, armL, armR,
// legL, legR) so the studio can pose them (see wwtbane/src/shell/stage/voxelActors.js). Every part is evaluated on the
// same grid in model coordinates (metres, +Z the front, x to the figure's left is +x... see the preview), 2.5 cm voxels.
const S = 0.025, NX = 48, NY = 76, NZ = 30, HS = 1.3        // 2.5 cm voxels; HS makes the head a little big, which is what lets a face read

const LOOKS = {
  host:   { skin: "#dba37e", hair: "#aab0bf", hairStyle: "short", top: "suit",   topC: "#252a4a", innerC: "#eef0f8", tieC: "#c8323c", legs: "#191c30", shoe: "#0e0e14", sex: "m" },
  player: { skin: "#c68a63", hair: "#3a2414", hairStyle: "bun",   top: "hoodie", topC: "#3e7a3a", innerC: "#3e7a3a", tieC: null,      legs: "#2b3340", shoe: "#dcdce4", sex: "f" },
  op:     { skin: "#b9805a", hair: "#1a140e", hairStyle: "buzz",  top: "tee",    topC: "#2a2a3a", innerC: "#2a2a3a", tieC: null,      legs: "#1f1f2a", shoe: "#0e0e14", sex: "m" },
  stage:  { skin: "#e0b08c", hair: "#4a2c6a", hairStyle: "long",  top: "shirt",  topC: "#2c4a70", innerC: "#dfe6f2", tieC: null,      legs: "#1d1d28", shoe: "#0e0e14", sex: "f" },
  fan:    { skin: "#cf9a73", hair: "#33271a", hairStyle: "short", top: "tee",    topC: "#d9d9e8", innerC: "#d9d9e8", tieC: null,      legs: "#22223a", shoe: "#0e0e14", sex: "m" },
}

const ell = (x, y, z, cx, cy, cz, rx, ry, rz) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 <= 1
const box = (x, y, z, x0, x1, y0, y1, z0, z1) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1
// distance from a point to a segment (for limbs)
function seg(x, y, z, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l2 = dx * dx + dy * dy + dz * dz
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy + (z - a[2]) * dz) / l2))
  return Math.hypot(x - (a[0] + dx * t), y - (a[1] + dy * t), z - (a[2] + dz * t))
}
// a small deterministic speckle, so flat colours carry a little texture
const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }

function palette(L) {
  const p = { k: "#14101f", w: "#f4f1ea", e: "#2b2230", m: "#b0505c", y: "#6e2c3a", b: "#d98c8c" }
  p.s = L.skin; p.S = shade(L.skin, 0.84); p.t = shade(L.skin, 1.1)
  p.h = L.hair; p.H = shade(L.hair, 0.72); p.g = shade(L.hair, 1.25)
  p.c = L.topC; p.C = shade(L.topC, 0.78); p.d = shade(L.topC, 1.18)
  p.i = L.innerC; p.I = shade(L.innerC, 0.85)
  p.r = L.tieC || L.topC
  p.p = L.legs; p.P = shade(L.legs, 0.8); p.q = shade(L.legs, 1.2)
  p.o = L.shoe; p.O = shade(L.shoe, 0.7); p.u = shade(L.shoe, 1.3)
  return p
}
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = (v) => Math.max(0, Math.min(255, Math.round(v * f)))
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, "0")).join("")
}
const pick = (ix, iy, iz, base, dark, light) => { const r = hash(ix, iy, iz); return r < 0.12 ? dark : r > 0.9 ? light : base }

// ---- the parts: each returns a palette key for the point (x, y, z) in metres, or null ----
function head(x0, y0, z0, L, ix, iy, iz) {
  // the head is built at natural size around its neck and sampled scaled up by HS
  const x = x0 / HS, z = z0 / HS, y = 1.4 + (y0 - 1.4) / HS
  const ax = Math.abs(x)
  // neck
  if (ell(x, y, z, 0, 1.4, -0.005, 0.045, 0.05, 0.045)) return pick(ix, iy, iz, "S", "S", "S")
  // skull: a rounded head, jaw a little narrower
  const skull = ell(x, y, z, 0, 1.58, 0, 0.088, 0.108, 0.098) && (y > 1.53 || ell(x, y, z, 0, 1.58, 0, 0.085, 0.108, 0.095))
  const ear = ell(x, y, z, x < 0 ? -0.09 : 0.09, 1.56, -0.005, 0.014, 0.024, 0.02)
  const hs = L.hairStyle
  // ---- hair ----
  const crown = ell(x, y, z, 0, 1.585, -0.008, 0.098, 0.116, 0.108) && y > 1.575 && !(z > 0.055 && y < 1.645)        // cap with a bare forehead
  const back = ell(x, y, z, 0, 1.56, -0.03, 0.098, 0.105, 0.085) && z < -0.02 && y > 1.47
  const side = ax > 0.075 && y > 1.545 && ell(x, y, z, 0, 1.58, 0, 0.1, 0.118, 0.1) && z < 0.045
  let hair = false
  if (hs === "buzz") hair = ell(x, y, z, 0, 1.585, -0.005, 0.092, 0.112, 0.102) && y > 1.595 && !(z > 0.06 && y < 1.64)
  else if (hs === "short") hair = crown || back || side || (z > 0.05 && y > 1.645 && ell(x, y, z, 0, 1.6, 0.01, 0.1, 0.12, 0.105))
  else if (hs === "bun") hair = crown || back || side || ell(x, y, z, 0, 1.73, -0.04, 0.045, 0.04, 0.045)
  else if (hs === "long") hair = crown || back || side || (z < 0.02 && ax > 0.07 && ax < 0.115 && y > 1.2 && y < 1.55 && z > -0.1) || (z < -0.02 && ax < 0.1 && y > 1.22 && y < 1.5 && z > -0.1)
  if (hair) return pick(ix, iy, iz, "h", "H", "g")
  if (!skull && !ear) return null
  // ---- face ----
  if (z > 0.06) {
    const eyeY = 1.585
    if (Math.abs(y - eyeY) < 0.016 && ax > 0.026 && ax < 0.058) return ax > 0.04 && ax < 0.052 ? "e" : "w"
    if (Math.abs(y - 1.622) < 0.011 && ax > 0.024 && ax < 0.062) return L.hairStyle === "buzz" ? "H" : "H"          // brows
    if (z > 0.07 && Math.abs(y - 1.56) < 0.014 && ax < 0.012) return "t"                                          // nose
    if (Math.abs(y - 1.515) < 0.008 && ax < 0.03) return "m"                                                       // mouth
    if (L.sex === "f" && Math.abs(y - 1.545) < 0.011 && ax > 0.045 && ax < 0.066) return "b"                       // cheeks
  }
  return pick(ix, iy, iz, "s", "S", "t")
}

function torso(x, y, z, L, ix, iy, iz) {
  const ax = Math.abs(x), F = L.sex === "f"
  // body: tapered, shoulders 0.2 wide each side, waist 0.15
  const w = 0.15 + (y - 0.86) * (F ? 0.09 : 0.12), d = 0.095
  if (y < 0.86 || y > 1.36 || ax > w || Math.abs(z) > d * (1 - Math.max(0, (y - 1.3)) * 2)) return null
  const front = z > 0.05
  if (L.top === "suit") {
    // jacket with a white shirt V and a tie
    if (front && y > 1.0 && ax < 0.055 * (1 - (1.36 - y) / 0.5) + 0.01) {
      if (ax < 0.014 && y < 1.3 && y > 1.0) return "r"
      return "i"
    }
    if (front && Math.abs(ax - (0.07 * (1 - (1.36 - y) / 0.45) + 0.04)) < 0.011 && y > 1.05) return "C"          // lapel
    if (y < 0.9 && front && ax < 0.01) return "C"
    return pick(ix, iy, iz, "c", "C", "d")
  }
  if (L.top === "hoodie") {
    if (y > 1.31 && ax < 0.085) return "C"                                                                         // hood at the neck
    if (front && y > 0.92 && y < 1.07 && ax < 0.1) return "C"                                                      // pocket
    if (front && y > 1.12 && y < 1.3 && (Math.abs(ax - 0.022) < 0.008)) return "w"                                // drawstrings
    return pick(ix, iy, iz, "c", "C", "d")
  }
  if (L.top === "shirt") {
    if (front && ax < 0.008) return "I"
    if (front && y > 1.3 && ax < 0.06) return ax > 0.03 ? "i" : "s"
    return pick(ix, iy, iz, "c", "C", "d")
  }
  return y > 1.325 && front && ax < 0.05 ? "s" : pick(ix, iy, iz, "c", "C", "d")                                   // tee, crew neck
}

function arm(side) {                                                                                               // side: +1 = figure's left (+x)
  return (x, y, z, L, ix, iy, iz) => {
    const sx = side * 0.222, a = [sx, 1.3, 0], b = [side * 0.236, 1.04, 0.01], c = [side * 0.244, 0.78, 0.03]
    const r = 0.054
    const d1 = seg(x, y, z, a, b), d2 = seg(x, y, z, b, c)
    const hand = ell(x, y, z, c[0], 0.74, c[2] + 0.005, 0.04, 0.055, 0.032)
    if (hand) return pick(ix, iy, iz, "s", "S", "t")
    if (Math.min(d1, d2 * 0.96) > r) return null
    const sleeveEnd = L.top === "tee" ? 1.12 : 0.8
    if (y > sleeveEnd) return L.top === "suit" ? pick(ix, iy, iz, "c", "C", "d") : pick(ix, iy, iz, "c", "C", "d")
    if (L.top === "suit" && y < 0.84) return "i"                                                                  // shirt cuff
    return pick(ix, iy, iz, "s", "S", "t")
  }
}

// legs are two parts each: the thigh (hip to knee) and the shin with its shoe (knee down), so a seated person's lower legs hang
const KNEE = 0.49
function leg(side, shin) {
  return (x, y, z, L, ix, iy, iz) => {
    const hx = side * 0.088
    if (shin ? y >= KNEE : y < KNEE) return null
    const upper = seg(x, y, z, [hx, 0.9, 0], [hx * 1.02, 0.1, 0])
    const r = 0.082 - (0.9 - y) * 0.024
    if (y > 0.075 && upper <= r) return y > 0.8 && Math.abs(x - hx) > r * 0.8 ? "P" : pick(ix, iy, iz, "p", "P", "q")
    // shoes: a rounded box a little longer than the foot, with a lighter sole
    if (y <= 0.085 && x * side > 0.012 && x * side < 0.15 && z > -0.07 && z < 0.15 + (0.085 - y) * 0.3 && ell(x, y, z, hx, 0.04, 0.035, 0.07, 0.056, 0.115)) return y < 0.02 ? "u" : pick(ix, iy, iz, "o", "O", "u")
    return null
  }
}

for (const [name, L] of Object.entries(LOOKS)) {
  const mk = (fn) => voxfn([NX, NY, NZ], (ix, iy, iz) => fn((ix - NX / 2 + 0.5) * S, (iy + 0.5) * S, (iz - NZ / 2 + 0.5) * S, L, ix, iy, iz), { size: S })
  pal(palette(L))
  model("vox_" + name,
    part("legL", { pivot: [0.088, 0.9, 0] }, mk(leg(1, false)), part("shinL", { pivot: [0.09, KNEE, 0] }, mk(leg(1, true)))),
    part("legR", { pivot: [-0.088, 0.9, 0] }, mk(leg(-1, false)), part("shinR", { pivot: [-0.09, KNEE, 0] }, mk(leg(-1, true)))),
    part("torso", { pivot: [0, 0.9, 0] },
      mk(torso),
      part("head", { pivot: [0, 1.4, 0] }, mk(head)),
      part("armL", { pivot: [0.222, 1.3, 0] }, mk(arm(1))),
      part("armR", { pivot: [-0.222, 1.3, 0] }, mk(arm(-1)))))
}
pack("people", Object.keys(LOOKS).map((n) => "vox_" + n))
