// HD-2D people for WWTBANE: front-facing 36x60 figures, one anim per (look, pose). Looks are palette + style choices.
// Run through tools/build-people.mjs, which packs the anims into one sheet per look.
pal({ k: "#14101f", w: "#f4f1ea", e: "#2b2230", m: "#b0505c", y: "#6e2c3a", z: "#ffffff" })

const LOOKS = {
  host:   { sex: "m", skin: "#dba37e", hair: "#aab0bf", hairStyle: "short", top: "suit",   topC: "#252a4a", shirt: "#eef0f8", legs: "#191c30", shoe: "#0e0e14", tie: "#c8323c" },
  player: { sex: "f", skin: "#c68a63", hair: "#3a2414", hairStyle: "bun",   top: "hoodie", topC: "#3e7a3a", shirt: "#3e7a3a", legs: "#2b3340", shoe: "#dcdce4", tie: null },
  op:     { sex: "m", skin: "#b9805a", hair: "#1a140e", hairStyle: "buzz",  top: "tee",    topC: "#2a2a3a", shirt: "#2a2a3a", legs: "#1f1f2a", shoe: "#0e0e14", tie: null },
  stage:  { sex: "f", skin: "#e0b08c", hair: "#4a2c6a", hairStyle: "long",  top: "shirt",  topC: "#2c4a70", shirt: "#dfe6f2", legs: "#1d1d28", shoe: "#0e0e14", tie: null },
  fan:    { sex: "m", skin: "#cf9a73", hair: "#33271a", hairStyle: "short", top: "tee",    topC: "#d9d9e8", shirt: "#d9d9e8", legs: "#22223a", shoe: "#0e0e14", tie: null },
}
const BASE = { skin: "ABCD", hair: "EFGH", top: "IJKL", shirt: "MNOP", legs: "QRST", shoe: "UVWX" }
function defineLook(L) {
  shades(BASE.skin, L.skin, { spread: 0.42, shift: 14, sat: 0.9 })
  shades(BASE.hair, L.hair); shades(BASE.top, L.topC); shades(BASE.shirt, L.shirt)
  shades(BASE.legs, L.legs); shades(BASE.shoe, L.shoe)
  pal({ t: L.tie || L.topC })
}

function figure(c, L, pose, f) {
  const F = L.sex === "f", br = f === 1 && pose === "idle" ? 1 : 0
  const sx = F ? 1 : 0                                        // women: a pixel narrower at the shoulders
  const longSleeve = L.top !== "tee"
  const arm = (x0, y0, x1, y1) => {
    c.line(x0, y0, x1, y1, longSleeve ? "J" : "C", 3)
    if (!longSleeve) { const dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy) || 1, s = Math.min(1, 5 / n); c.line(x0, y0, Math.round(x0 + dx * s), Math.round(y0 + dy * s), "J", 3) }
    c.rect(x1 - 1, y1 + (y1 >= y0 ? 0 : -2), 3, 3, "C"); c.px(x1 - 1, y1 + (y1 >= y0 ? 3 : 0), "B"); c.px(x1 + 1, y1 + (y1 >= y0 ? 3 : 0), "B")
  }
  // legs and shoes
  c.rect(12, 40, 5, 16, "R"); c.rect(19, 40, 5, 16, "R"); c.rect(12, 40, 1, 16, "Q"); c.rect(23, 40, 1, 16, "Q"); c.vline(17, 40, 16, "Q")
  c.rect(11, 55, 6, 3, "V"); c.rect(19, 55, 6, 3, "V"); c.hline(11, 55, 6, "X"); c.hline(19, 55, 6, "X")
  // torso (a jacket is longer than a tee)
  const ty = 19 + br, th = L.top === "suit" ? 21 : 20
  c.poly([9 + sx, ty + 1, 11, ty, 25, ty, 27 - sx, ty + 1, 26, ty + th, 10, ty + th], "J")
  c.rect(10, ty + 1, 3, th - 1, "I"); c.rect(24, ty + 1, 2, th - 1, "K"); c.hline(11, ty, 14, "K")
  if (F) { c.hline(13, ty + 6, 4, "K"); c.hline(19, ty + 6, 4, "K"); c.hline(13, ty + 8, 10, "I") }         // a little shape
  // neckline per outfit
  if (L.top === "suit") {
    c.poly([15, ty, 21, ty, 18, ty + 9], "P"); c.poly([15, ty, 17, ty, 16, ty + 3], "O"); c.poly([19, ty, 21, ty, 20, ty + 3], "O")
    c.rect(17, ty + 1, 2, 3, "t"); c.poly([17, ty + 4, 19, ty + 4, 20, ty + 11, 18, ty + 13, 16, ty + 11], "t")
    c.line(14, ty + 4, 17, ty + 11, "I"); c.line(22, ty + 4, 19, ty + 11, "I")
  } else if (L.top === "hoodie") {
    c.ellipse(18, ty + 1, 6, 2, "K"); c.rect(12, ty + 12, 12, 6, "I"); c.hline(12, ty + 12, 12, "K")           // hood rim and pocket
    c.vline(16, ty + 3, 6, "w"); c.vline(20, ty + 3, 6, "w")
  } else if (L.top === "shirt") {
    c.poly([15, ty, 21, ty, 18, ty + 5], "B"); c.poly([14, ty, 17, ty, 17, ty + 3], "P"); c.poly([19, ty, 22, ty, 19, ty + 3], "P")
    c.vline(18, ty + 5, th - 5, "N"); for (let i = 0; i < 4; i++) c.px(18, ty + 7 + i * 4, "K")
  } else c.rect(15, ty, 6, 2, "B")                                                                              // tee: crew neck
  c.hline(10, ty + th - 1, 16, "I")
  // arms
  const sy = ty + 3, ax0 = 9 + sx, ax1 = 27 - sx
  if (pose === "cheer") { arm(ax0, sy, 4, 5 + br); arm(ax1, sy, 32, 5 + br) }
  else if (pose === "wave") { arm(ax0, sy, 7, sy + 16); arm(ax1, sy, 31, 10 + f * 3) }
  else if (pose === "worry") { arm(ax0, sy, 7, sy + 16); arm(ax1, sy, 23, ty - 3) }
  else if (pose === "talk") { arm(ax0, sy, 7, sy + 16); arm(ax1, sy, f ? 32 : 29, sy + (f ? 7 : 13)) }
  else { arm(ax0, sy, 7, sy + 16 + br); arm(ax1, sy, 29, sy + 16 + br) }
  // neck and head (centre 18,10)
  const hy = 9 + br
  c.rect(16, hy + 7, 4, 4, "B")
  c.ellipse(18, hy + 1, 6, 7, "C")
  c.rect(12, hy + 1, 2, 7, "B"); c.rect(22, hy + 1, 2, 7, "D"); c.px(12, hy + 6, "A")
  c.px(11, hy + 3, "B"); c.px(24, hy + 3, "B")                           // ears
  // hair
  const hs = L.hairStyle
  if (hs === "buzz") { c.ellipse(18, hy - 1, 6, 5, "F"); c.hline(12, hy - 5, 12, "G") }
  else {
    c.ellipse(18, hy - 2, 7, 5, "F"); c.rect(11, hy - 3, 14, 4, "F"); c.hline(12, hy - 6, 12, "G"); c.hline(13, hy - 5, 4, "H")
    c.rect(11, hy, 2, hs === "short" ? 4 : 7, "F"); c.rect(23, hy, 2, hs === "short" ? 4 : 7, "F")
    c.hline(13, hy + 1, 3, "F"); c.hline(20, hy + 1, 4, "F")
    if (hs === "bun") { c.circ(18, hy - 8, 3, "F"); c.px(17, hy - 9, "H"); c.hline(14, hy - 4, 8, "F") }
    if (hs === "long") { c.rect(9, hy + 1, 3, 20 + br, "F"); c.rect(24, hy + 1, 3, 20 + br, "F"); c.vline(9, hy + 3, 16, "E"); c.vline(26, hy + 3, 16, "E") }
  }
  // face
  if (!(hs === "buzz")) { c.hline(14, hy + 2, 3, "E"); c.hline(20, hy + 2, 3, "E") } else { c.hline(14, hy + 2, 3, "F"); c.hline(20, hy + 2, 3, "F") }
  c.rect(14, hy + 4, 3, 2, "w"); c.rect(20, hy + 4, 3, 2, "w"); c.px(15, hy + 4, "e"); c.px(15, hy + 5, "e"); c.px(21, hy + 4, "e"); c.px(21, hy + 5, "e"); c.px(16, hy + 5, "e"); c.px(22, hy + 5, "e")
  if (F) { c.px(14, hy + 3, "e"); c.px(22, hy + 3, "e") }                // lashes
  c.px(18, hy + 6, "B"); c.px(18, hy + 7, "B")
  const open = (pose === "talk" && f === 1) || pose === "cheer"
  if (open) { c.rect(16, hy + 9, 5, 2, "y"); c.hline(16, hy + 9, 5, "w") } else if (pose === "worry") c.hline(16, hy + 10, 4, "m"); else c.hline(16, hy + 9, 5, "m")
}

const POSES = [["idle", 2], ["talk", 2], ["cheer", 2], ["wave", 2], ["worry", 1]]
for (const [name, L] of Object.entries(LOOKS)) {
  defineLook(L)
  for (const [pose, frames] of POSES)
    anim(`${name}_${pose}`, { w: 36, h: 60, frames, fps: pose === "idle" ? 2 : 6, selout: "k" }, (c) => figure(c, L, pose, c.frame))
}
