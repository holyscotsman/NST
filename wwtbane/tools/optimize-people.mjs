/* optimize-people.mjs — how the files in assets/people/ were made from the original Quaternius downloads.
 *
 * Dev-only: it needs packages the repo does not install (npm i @gltf-transform/core @gltf-transform/extensions
 * @gltf-transform/functions sharp meshoptimizer) and the original CC0 zips, and it is not run by CI. It is here so the
 * assets can be rebuilt, not because the game needs it.
 *
 *   body   <in.gltf> <out.gltf> <texture px>   resize + WebP the textures, dedupe, prune
 *   anims  <in.glb>  <out.glb>  <clip names..> keep only the named clips (and their samplers), resample, prune
 *
 * Meshopt/quantisation are deliberately NOT used on meshes: a quantised skinned mesh carries its scale on the node,
 * which glTF ignores for skinned meshes, and the decoder needs WebAssembly, which the page's CSP does not allow.
 * Textures stay as separate .webp files (not embedded in a .glb) so they load as ordinary same-origin images
 * under `img-src 'self'`, with no blob: URLs.
 */
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRTextureTransform } from '@gltf-transform/extensions';
import { textureCompress, prune, dedup, resample, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import sharp from 'sharp';
const [,, kind, input, output, ...rest] = process.argv;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(input);
const root = doc.getRoot();
if (kind === 'anims') {
  const keep = new Set(rest);
  for (const a of root.listAnimations()) if (!keep.has(a.getName())) { for (const c of a.listChannels()) c.dispose(); for (const s of a.listSamplers()) s.dispose(); a.dispose(); }
  for (const m of root.listMeshes()) m.dispose();
  for (const s of root.listSkins()) s.dispose();
  await doc.transform(resample({ tolerance: 0.0008 }), prune({ keepLeaves: true }));
} else {
  const size = Number(rest[0] || 1024);
  await doc.transform(
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [size, size], quality: 82 }),
    dedup(), prune());
}
await io.write(output, doc);
const fs = await import('node:fs'); console.log(output.split('/').pop(), (fs.statSync(output).size / 1024).toFixed(0) + ' KB');
