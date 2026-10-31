// HD-2D art for StarNix's Kuiper Belt Battle: three heroes, the BCM raider and boss, and the rocks, 64x64 each.
// Heroes point right; the raider and boss point left (as the art they replace did). Built by tools/hd2d/build-kbb.mjs.
pal({ Z: "#0d0a1c", w: "#f4f1ea", y: "#ffe08a" })     // Z is the outline key (k belongs to the aqua ramp)
shades("abcd", "#8d93ab")           // steel hull       a dark -> d light
shades("efgh", "#7855fa")           // iris
shades("ijkl", "#1fdde9")           // aqua
shades("mnop", "#92dd23")           // mantis
shades("qrst", "#ff6b5b")           // peach / BCM red
shades("uvwx", "#ffc857")           // gold
shades("ABCD", "#8a6a4a")           // rock
ramps("abcd", "efgh", "ijkl", "mnop", "qrst", "uvwx", "ABCD")

// ---- Talon: the damage dealer, a slim swept dart ----
sprite("kbbHero1", { w: 64, h: 64, selout: "Z" },
  poly([62, 32, 46, 27, 16, 25, 5, 29, 5, 35, 16, 39, 46, 37], "b"),
  poly([60, 32, 46, 28, 20, 27, 12, 30, 12, 34, 20, 37, 46, 36], "c"),
  poly([44, 31, 22, 29, 12, 31, 12, 33, 22, 35, 44, 33], "d"),
  poly([32, 26, 20, 15, 9, 15, 19, 27], "f"), poly([32, 38, 20, 49, 9, 49, 19, 37], "f"),
  poly([30, 26, 21, 18, 14, 18, 20, 27], "g"), poly([30, 38, 21, 46, 14, 46, 20, 37], "g"),
  rect(46, 22, 8, 2, "c"), rect(46, 40, 8, 2, "c"), px(54, 22, "y"), px(54, 41, "y"),
  ellipse(40, 30, 4, 2, "j"), px(39, 29, "l"), px(41, 29, "w"),
  hline(8, 32, 38, "r"), hline(8, 33, 30, "q"),
  rect(1, 30, 4, 4, "Z"), rect(2, 31, 3, 2, "l"), px(1, 32, "j"),
  glow("l", { r: 5, strength: 0.5 }))

// ---- Aegis: the tank, a heavy hull behind a shield arc ----
sprite("kbbHero2", { w: 64, h: 64, selout: "Z" },
  poly([53, 26, 57, 32, 53, 38, 14, 41, 5, 36, 5, 28, 14, 23], "b"),
  poly([51, 27, 55, 32, 51, 37, 16, 39, 8, 35, 8, 29, 16, 25], "c"),
  rect(14, 25, 34, 3, "d"), rect(14, 36, 34, 3, "a"),
  poly([26, 23, 18, 15, 10, 16, 14, 24], "f"), poly([26, 41, 18, 49, 10, 48, 14, 40], "f"),
  rect(20, 30, 28, 4, "n"), rect(20, 31, 28, 2, "p"),
  ellipse(42, 32, 3, 2, "j"), px(41, 31, "l"),
  rect(1, 28, 4, 3, "Z"), rect(1, 33, 4, 3, "Z"), rect(2, 29, 3, 1, "l"), rect(2, 34, 3, 1, "l"),
  clip([56, 6, 8, 52], ring(38, 32, 21, "o"), ring(38, 32, 23, "n")),
  glow("pn", { r: 5, strength: 0.4 }))

// ---- Mender: the healer, a rounded pod with a cross ----
sprite("kbbHero3", { w: 64, h: 64, selout: "Z" },
  ellipse(32, 33, 28, 11, "c"), ellipse(32, 31, 27, 9, "d"),
  poly([6, 36, 58, 36, 54, 41, 10, 41], "b"), hline(10, 40, 44, "a"),
  ellipse(42, 28, 9, 5, "j"), ellipse(41, 27, 6, 3, "l"), px(38, 26, "w"),
  rect(20, 29, 3, 9, "m"), rect(17, 32, 9, 3, "m"), rect(21, 30, 1, 7, "p"), rect(18, 33, 7, 1, "p"),
  rect(1, 31, 5, 5, "Z"), rect(2, 32, 4, 3, "l"),
  poly([58, 33, 62, 34, 58, 36], "n"),
  glow("ml", { r: 5, strength: 0.45 }))

// ---- BCM raider: a red dart (points left) ----
sprite("kbbEnemy", { w: 64, h: 64, selout: "Z" },
  poly([3, 32, 26, 24, 40, 27, 52, 14, 56, 24, 60, 32, 56, 40, 52, 50, 40, 37, 26, 40], "r"),
  poly([5, 32, 26, 26, 40, 29, 52, 18, 54, 26, 56, 32, 54, 38, 52, 46, 40, 35, 26, 38], "s"),
  poly([5, 32, 24, 28, 36, 30, 36, 34, 24, 36], "t"),
  poly([52, 14, 56, 24, 52, 24], "q"), poly([52, 50, 56, 40, 52, 40], "q"),
  circ(34, 32, 3, "u"), px(33, 31, "x"), hline(10, 32, 22, "t"),
  rect(58, 31, 4, 3, "v"), px(61, 32, "x"),
  glow("u", { r: 4, strength: 0.3 }))

// ---- BCM warship: the section boss (points left) ----
sprite("kbbBoss", { w: 64, h: 64, selout: "Z" },
  poly([4, 22, 14, 12, 40, 12, 46, 22, 46, 42, 40, 52, 14, 52, 4, 42], "q"),
  poly([6, 23, 15, 14, 39, 14, 44, 23, 44, 41, 39, 50, 15, 50, 6, 41], "r"),
  rect(10, 20, 30, 24, "s"), rect(10, 20, 30, 3, "t"), rect(10, 41, 30, 3, "q"),
  vline(24, 14, 36, "q"), vline(25, 14, 36, "t"),
  circ(20, 32, 6, "u"), circ(20, 32, 4, "v"), px(18, 30, "x"),
  poly([46, 24, 60, 14, 62, 20, 50, 28], "q"), poly([46, 40, 60, 50, 62, 44, 50, 36], "q"),
  poly([46, 29, 58, 29, 62, 32, 58, 35, 46, 35], "v"), rect(50, 31, 10, 2, "x"),
  glow("uvx", { r: 6, strength: 0.5 }))

// ---- Rocks ----
for (const [name, seed, tone] of [["kbbAsteroid1", 11, 0], ["kbbAsteroid2", 23, 1], ["kbbAsteroid3", 37, 2]]) {
  sprite(name, { w: 64, h: 64, selout: "Z" }, (c) => {
    const r = c.rng(seed), pts = [], n = 11
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, d = 23 + r() * 7 - (tone === 1 && i % 3 === 0 ? 5 : 0); pts.push(Math.round(32 + Math.cos(a) * d), Math.round(32 + Math.sin(a) * d * (0.86 + tone * 0.04))) }
    c.poly(pts, "B")
    c.clip(pts, () => {})
    for (let i = 0; i < 10 + tone * 3; i++) { const x = 14 + r() * 36, y = 14 + r() * 36, rr = 2 + r() * 4.5; c.ellipse(x, y, rr, rr * 0.8, "A"); c.ellipse(x - 1, y - 1, rr * 0.7, rr * 0.55, "B") }
    c.light([21, 21, 16], 1, 0.5); c.shade([42, 46, 20], 1, 0.55)
    for (let i = 0; i < 16; i++) c.px(Math.round(14 + r() * 36), Math.round(14 + r() * 36), r() > 0.5 ? "C" : "A")
  })
}
