// _three-hook.mjs — a module-resolution hook that maps the bare specifiers the
// browser import map provides ('three', 'three/addons/...') onto the vendored
// build, so modules that import three can be unit-tested in plain Node with no
// node_modules (the unit job installs nothing, by design).
const ROOT = new URL('../vendor/three/', import.meta.url);
export async function resolve(specifier, context, next) {
  if (specifier === 'three') return { url: new URL('build/three.module.min.js', ROOT).href, shortCircuit: true };
  if (specifier.startsWith('three/addons/')) return { url: new URL('examples/jsm/' + specifier.slice('three/addons/'.length), ROOT).href, shortCircuit: true };
  return next(specifier, context);
}
