// post.js — the render pipeline: scene -> (AO) -> bloom -> tone map -> grade.
//
// One chain, built once, reconfigured by quality tier. Everything that is not
// the scene itself lives here so studio.js can ask for "a frame" without
// knowing what it costs:
//
//   RenderPass        scene into a multisampled half-float target (MSAA is the
//                     anti-aliasing: no blurry FXAA, no extra pass)
//   GTAOPass          ground-truth ambient occlusion — contact shadow under
//                     chairs, hands and the crowd (high tier only)
//   UnrealBloomPass   the neon glow, at half resolution (the glow is soft by
//                     nature; half-res is invisible and a 4x saving)
//   OutputPass        tone mapping + sRGB encode
//   Grade             one display-space pass: contrast, split-toning,
//                     chromatic aberration, vignette, grain and dithering
//
// The grade is a single ShaderPass on purpose: five small effects as five
// passes is five full-screen reads; as one shader it is one.
import * as THREE from 'three';

const GRADE = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.035 },
    uVignette: { value: 0.42 },
    uAberration: { value: 0.0016 },
    uSaturation: { value: 1.08 },
    uContrast: { value: 1.07 },
    uSplit: { value: 0.05 },
    uShadow: { value: new THREE.Color(0x1a1450) },    // indigo in the blacks
    uHighlight: { value: new THREE.Color(0xffd9a0) }, // warm in the whites
  },
  vertexShader: [
    'varying vec2 vUv;',
    'void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  ].join('\n'),
  fragmentShader: [
    'uniform sampler2D tDiffuse;',
    'uniform float uTime, uGrain, uVignette, uAberration, uSaturation, uContrast, uSplit;',
    'uniform vec3 uShadow, uHighlight;',
    'varying vec2 vUv;',
    'float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }',
    'void main(){',
    '  vec2 d = vUv - 0.5;',
    '  float r2 = dot(d, d);',
    // Lens fringing grows toward the frame edge and is zero at the centre, so
    // text-sized detail in the middle of the picture is never softened.
    '  vec2 off = d * r2 * uAberration * 6.0;',
    '  vec3 col;',
    '  col.r = texture2D(tDiffuse, vUv - off).r;',
    '  col.g = texture2D(tDiffuse, vUv).g;',
    '  col.b = texture2D(tDiffuse, vUv + off).b;',
    '  col = (col - 0.5) * uContrast + 0.5;',
    '  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));',
    '  col = mix(vec3(l), col, uSaturation);',
    '  col += (uShadow * (1.0 - smoothstep(0.0, 0.5, l)) + uHighlight * smoothstep(0.45, 1.0, l)) * uSplit;',
    '  col *= mix(1.0 - uVignette, 1.0, smoothstep(0.85, 0.22, r2 * 2.2));',
    '  float g = hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;',
    '  col += g * uGrain;',
    // 1/255 triangular-ish dither: dark gradients (the whole set) band badly
    // on 8-bit output without it.
    '  col += (hash(gl_FragCoord.xy * 1.37) - 0.5) / 255.0;',
    '  gl_FragColor = vec4(max(col, 0.0), 1.0);',
    '}',
  ].join('\n'),
};

export async function createPipeline({ renderer, scene, camera, tier, width, height }) {
  const [
    { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }, { ShaderPass },
  ] = await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/OutputPass.js'),
    import('three/addons/postprocessing/ShaderPass.js'),
  ]);

  const composer = new EffectComposer(renderer);
  // MSAA on the ping-pong targets. Must be set before first use.
  composer.renderTarget1.samples = tier.msaa;
  composer.renderTarget2.samples = tier.msaa;

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  let aoPass = null;
  if (tier.ao) {
    try {
      const { GTAOPass } = await import('three/addons/postprocessing/GTAOPass.js');
      aoPass = new GTAOPass(scene, camera, width, height);
      aoPass.output = GTAOPass.OUTPUT.Default;
      aoPass.blendIntensity = 0.85;
      aoPass.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.6, thickness: 1.2, scale: 1.1, samples: 12 });
      aoPass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      composer.addPass(aoPass);
    } catch (e) { aoPass = null; /* AO is a luxury: carry on without it */ }
  }

  let bloom = null;
  if (tier.bloom) {
    bloom = new UnrealBloomPass(new THREE.Vector2(Math.max(2, width >> 1), Math.max(2, height >> 1)), 0.42, 0.5, 0.32);
    composer.addPass(bloom);
  }

  composer.addPass(new OutputPass());

  let grade = null;
  if (tier.grade) {
    grade = new ShaderPass({
      uniforms: THREE.UniformsUtils.clone(GRADE.uniforms),
      vertexShader: GRADE.vertexShader,
      fragmentShader: GRADE.fragmentShader,
    });
    composer.addPass(grade);
  }

  const pipeline = {
    composer, renderPass, aoPass, bloom, grade,
    setScene(s) {
      renderPass.scene = s;
      if (aoPass) aoPass.scene = s;
    },
    setCamera(c) {
      renderPass.camera = c;
      if (aoPass) aoPass.camera = c;
    },
    setSize(w, h) {
      composer.setSize(w, h);
      if (bloom) bloom.resolution.set(Math.max(2, w >> 1), Math.max(2, h >> 1));
    },
    setPixelRatio(r) { composer.setPixelRatio(r); },
    // Per-frame knobs. `time` is frozen (not zero) under reduced motion so the
    // grain field does not shuffle — reshuffling per-pixel noise every frame is
    // continuous motion.
    update({ time, bloomStrength, animateGrain }) {
      if (grade && animateGrain) grade.uniforms.uTime.value = time;
      if (bloom && bloomStrength != null) bloom.strength = bloomStrength;
    },
    render() { composer.render(); },
    dispose() {
      composer.passes.forEach((p) => { if (p && typeof p.dispose === 'function') p.dispose(); });
      if (composer.dispose) composer.dispose();
    },
  };
  return pipeline;
}
