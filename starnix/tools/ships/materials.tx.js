// loom materials for the StarNix ships and rocks (also the gold of the WWTBANE piggy bank): seamless PBR sets, drawn in
// code. Built by tools/ships/build.mjs; the maps are used only to render the ship sprites (nothing here ships to players).
pal({
  steelD: "#3a424e", steel: "#7a8697", steelL: "#b4c0d2",
  irisD: "#3a2a80", iris: "#6a52d8", irisL: "#a898ff",
  redD: "#4a1a1e", red: "#b5303a", redL: "#ef6a58",
  creamD: "#7d8088", cream: "#c9ccd4", creamL: "#f1f2f6",
  aqua: "#1fdde9", aquaD: "#0a4a52", mantis: "#92dd23", mantisD: "#2c4a0a", orange: "#ff8a2a", orangeD: "#6a2a0a",
  rockD: "#2c2622", rock: "#5a4e44", rockL: "#8f8070", dust: "#b5a48c",
})

// one armour-plate material in a colour scheme: plates with grooves, scratches and lit strips
function plates(name, dark, mid, light, glow, glowD, seed) {
  const t = tiles({ rows: 4, cols: 2, gap: 0.012, bevel: 0.01, vary: 0.06, seed }).as(name + " plates")
  const grooves = stripes({ count: 16, dir: "h", soft: 0.05 }).threshold(0.92, 0.02).mul(t.dist.threshold(0.12, 0.02))
  const strip = t.dist.levels(0.08, 0.1).sub(t.dist.levels(0.12, 0.14)).max(0).mul(t.id.threshold(0.5)).as(name + " strips")
  const scratches = ridged({ scale: [2, 30], octaves: 3, seed: seed + 1 }).threshold(0.88, 0.04).mul(noise({ scale: 6, seed: seed + 2 }).threshold(0.55, 0.2))
  material(name, { size: 512, depth: 0.03 }, {
    height: t.mul(0.6).sub(grooves.mul(0.08)).sub(strip.mul(0.1)),
    color: ramp(t.id.mix(noise({ scale: 12, seed: seed + 3 }), 0.3), [dark, mid, light]).mix(glowD, strip).mix(light, scratches.mul(0.5)),
    rough: scratches.mix(0.34, 0.58).mix(0.2, strip),
    metal: strip.invert().mul(0.85),
    emit: ramp(strip, ["#000000", glow]),
  })
}
plates("hull_steel", "steelD", "steel", "steelL", "aqua", "aquaD", 31)
plates("hull_iris", "irisD", "iris", "irisL", "aqua", "aquaD", 41)
plates("hull_red", "redD", "red", "redL", "orange", "orangeD", 51)
plates("hull_cream", "creamD", "cream", "creamL", "mantis", "mantisD", 61)

// hammered gold (the piggy bank)
{
  const dents = cells({ scale: 14, jitter: 0.9, seed: 71 })
  const hammer = dents.smooth(0, 0.9).mul(0.7).add(noise({ scale: 32, octaves: 3, seed: 72 }).mul(0.15)).as("hammer marks")
  const tarnish = hammer.cavity(0.01, 10).max(noise({ scale: 5, seed: 73 }).threshold(0.68, 0.2).mul(0.5)).as("tarnish")
  material("gold", { size: 512, depth: 0.02 }, {
    height: hammer,
    color: ramp(hammer, ["#8a5a12", "#d9a032", "#ffe08a"]).mix("#4a3410", tarnish.mul(0.6)),
    rough: hammer.levels(0, 1, 0.42, 0.18).mix(0.7, tarnish),
    metal: tarnish.invert().mul(0.25).add(0.75),
  })
}

// cratered rock for the asteroids
{
  const big = cells({ scale: 4, jitter: 1, seed: 81 })
  const craters = big.edge.smooth(0.02, 0.25).as("craters")
  const grit = noise({ scale: 24, octaves: 5, seed: 82 }).as("grit")
  material("rock", { size: 512, depth: 0.06 }, {
    height: craters.mul(0.7).add(grit.mul(0.3)),
    color: ramp(grit.mix(craters, 0.5), ["rockD", "rock", "rockL"]).mix("dust", craters.invert().mul(grit.threshold(0.6, 0.2)).mul(0.5)),
    rough: grit.levels(0, 1, 0.75, 0.95),
    metal: 0.02,
  })
}
