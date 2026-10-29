// film.js — a film look that costs the GPU nothing it can get wrong.
//
// The real post chain (post.js: half-float targets, MSAA, bloom, grade) is what some Mac GPUs draw black, so those
// tiers are off by default there and the picture is rendered straight to the canvas. Straight to the canvas has no
// glow and no grade, which is most of why it reads as a game from another decade. This puts back the three things
// that matter, using the browser's compositor instead of the GPU pipeline:
//
//   bloom      a tiny copy of the frame, thresholded by a CSS contrast curve, blurred by CSS and screen-blended
//              over the picture (bright neon bleeds, darks stay dark)
//   grade      one CSS filter on the canvas: contrast and saturation
//   vignette   a radial gradient
//   grain      a tiled noise image, overlay-blended, stepped a few times a second
//
// All the styling is in styles/main.css (the page's CSP forbids inline styles). Nothing here touches WebGL state: it
// only reads the finished frame with drawImage, which every browser supports for a WebGL canvas drawn this task.
export function createFilm({ canvas, container, reduced = false }) {
  const mk = (cls, tag = 'div') => { const e = document.createElement(tag); e.className = cls; e.setAttribute('aria-hidden', 'true'); return e; };
  const bloom = mk('film-bloom', 'canvas');
  const vignette = mk('film-vignette');
  const grain = mk('film-grain');
  container.append(bloom, vignette, grain);
  let bctx = null; try { bctx = bloom.getContext('2d', { alpha: false }); } catch { bctx = null; }
  let on = false, skip = 0, steps = 0, t = 0, failed = false;

  const fit = () => {
    const w = 224, h = Math.max(48, Math.round(w * (canvas.height || 9) / (canvas.width || 16)));
    if (bloom.width !== w || bloom.height !== h) { bloom.width = w; bloom.height = h; }
  };
  fit();

  const film = {
    get enabled() { return on; },
    // Turn the look on or off as a whole (it is only wanted when the real post chain is not running).
    setEnabled(v) {
      on = !!v && !!bctx && !failed;
      canvas.classList.toggle('film-graded', on);
      for (const e of [bloom, vignette, grain]) e.classList.toggle('film-on', on);
    },
    resize: fit,
    // Call once per frame, right after the scene has been rendered.
    frame(dt) {
      if (!on) return;
      t += dt;
      if (!reduced && t * 6 > steps + 1) { steps++; grain.dataset.step = String(steps % 4); } // jump the noise tile a few times a second
      if ((skip++ & 1) === 0) return; // the glow is soft: every other frame is plenty
      try { bctx.drawImage(canvas, 0, 0, bloom.width, bloom.height); }
      catch { failed = true; film.setEnabled(false); } // a browser that refuses to copy a WebGL canvas just goes without
    },
    dispose() { bloom.remove(); vignette.remove(); grain.remove(); canvas.classList.remove('film-graded'); },
  };
  return film;
}
