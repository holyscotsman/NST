// HD-2D art for StarNix's Acropolis Rescue (top-down, nose up) and the shared player ship. Drawn as the left half and
// mirrored (mx). Built by tools/hd2d/build-arm.mjs, which scales each to the size of the painted art it replaces.
pal({ Z: "#0d0a1c", w: "#f4f1ea", y: "#ffe08a", z: "#1b1830" })
shades("abcd", "#8d93ab")           // steel
shades("efgh", "#7855fa")           // iris
shades("ijkl", "#1fdde9")           // aqua
shades("mnop", "#92dd23")           // mantis
shades("qrst", "#ff6b5b")           // red
shades("uvwx", "#ffc857")           // gold
shades("ABCD", "#3a3550")           // dark hull (BCM)
ramps("abcd", "efgh", "ijkl", "mnop", "qrst", "uvwx", "ABCD")

// ---- the squad's fighter ----
sprite("armHero", { w: 64, h: 64, mx: true, selout: "Z" },
  poly([32, 3, 30, 9, 28, 20, 27, 40, 28, 54, 32, 58], "c"),
  poly([32, 6, 30.5, 11, 29.5, 22, 29, 40, 30, 52, 32, 55], "d"),
  poly([28, 22, 4, 40, 2, 47, 9, 47, 28, 43], "b"), poly([28, 24, 6, 40, 5, 42, 28, 38], "c"),
  line(28, 22, 3, 41, "g"), line(28, 23, 4, 42, "f"),
  poly([30, 12, 29, 21, 32, 21, 32, 12], "A"), rect(31, 14, 1, 7, "j"),
  rect(31, 25, 1, 22, "j"), rect(30, 25, 1, 22, "k"),
  rect(26, 53, 4, 4, "Z"), rect(27, 54, 3, 4, "l"), rect(28, 55, 2, 4, "w"),
  glow("lj", { r: 5, strength: 0.5 }))
sprite("armWarp", { base: "armHero" })
sprite("ccShip", { base: "armHero" })

// ---- BCM fighter (red) and its dive variant (black) ----
sprite("armEnemy", { w: 64, h: 64, mx: true, selout: "Z" },
  poly([32, 2, 30, 12, 29, 36, 27, 56, 32, 54], "b"),
  poly([32, 5, 30.5, 14, 30, 36, 29, 52, 32, 50], "c"),
  poly([28, 26, 8, 46, 2, 56, 12, 52, 28, 46], "q"), poly([28, 28, 10, 46, 6, 52, 28, 44], "r"),
  poly([29, 14, 14, 30, 10, 38, 26, 30], "s"), line(29, 14, 12, 34, "t"),
  rect(31, 12, 1, 30, "u"), rect(30, 14, 1, 22, "t"), rect(31, 18, 1, 6, "x"),
  rect(26, 52, 3, 5, "Z"), rect(27, 54, 2, 5, "v"), rect(28, 56, 1, 4, "x"),
  glow("uxv", { r: 5, strength: 0.45 }))
sprite("armEnemyDive", { base: "armEnemy", swap: { b: "A", c: "B", q: "A", r: "B", s: "B", t: "r" } })

// ---- the Acropolis station: a ring habitat with a spire and solar wings (seen from above) ----
sprite("armStation", { w: 64, h: 64, selout: "Z" },
  rect(1, 31, 10, 10, "f"), rect(53, 31, 10, 10, "f"), rect(2, 32, 8, 8, "g"), rect(54, 32, 8, 8, "g"),
  hline(2, 36, 8, "e"), hline(54, 36, 8, "e"), vline(6, 32, 8, "e"), vline(58, 32, 8, "e"),
  rect(11, 35, 8, 2, "b"), rect(45, 35, 8, 2, "b"),
  circ(32, 37, 22, "b"), circ(32, 37, 19, "c"), circ(32, 37, 16, "A"),
  rect(31, 21, 2, 32, "b"), rect(16, 36, 32, 2, "b"),
  circ(32, 37, 7, "d"), circ(32, 37, 5, "c"), circ(32, 37, 3, "j"), px(32, 36, "w"),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => px(Math.round(32 + Math.cos(i / 12 * 6.2832) * 17.5), Math.round(37 + Math.sin(i / 12 * 6.2832) * 17.5), i % 3 ? "l" : "y")),
  rect(31, 4, 2, 18, "j"), rect(31, 6, 1, 14, "l"), rect(30, 14, 4, 2, "i"), px(31, 2, "w"), px(32, 2, "w"), rect(31, 3, 2, 1, "y"),
  glow("jlwy", { r: 5, strength: 0.45 }))

// ---- BCM warship: a wide wedge ----
sprite("armBoss", { w: 100, h: 66, mx: true, selout: "Z" },
  poly([50, 64, 2, 10, 2, 4, 50, 4], "A"),
  poly([50, 62, 6, 12, 6, 7, 50, 7], "B"),
  poly([50, 56, 12, 14, 12, 12, 50, 12], "C"),
  line(50, 62, 4, 9, "a"),
  ...[16, 22, 28, 34, 40, 46].map((x, i) => rect(x, 16 + i * 0, 1, 1, "u")),
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => px(14 + i * 5 + (i % 2), 18 + i * 6, "v")),
  ...[0, 1, 2, 3, 4].map((i) => px(20 + i * 6, 30 + i * 4, "x")),
  rect(46, 50, 4, 4, "q"), rect(47, 51, 3, 2, "u"),
  glow("uvx", { r: 4, strength: 0.5 }))
