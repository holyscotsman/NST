// fpsMeter.js — a tiny dev-only FPS/frame-time overlay for verifying the
// graphics performance budget on real hardware. OFF by default; enabled with
// ?fps=1 in the URL or toggled with Alt+F. It uses its own lightweight rAF only
// to sample timing — it renders nothing to the GL canvas, so the game's single
// render RAF (studio.js) stays the only draw loop.

export function installFpsMeter() {
  let on = false;
  let raf = null;
  let el = null;
  let frames = 0;
  let last = performance.now();
  let acc = 0;
  let worst = 0; // worst frame time in the window (ms)

  const tick = (now) => {
    frames += 1;
    const dt = now - last;
    last = now;
    acc += dt;
    if (dt > worst) worst = dt;
    if (acc >= 500) {
      const fps = Math.round((frames * 1000) / acc);
      if (el) {
        const bad = fps < 45;
        el.textContent = `${fps} fps · ${(acc / frames).toFixed(1)} ms avg · ${worst.toFixed(0)} ms worst`;
        el.style.color = bad ? '#FF6B5B' : fps < 58 ? '#FFC857' : '#92DD23';
      }
      frames = 0; acc = 0; worst = 0;
    }
    raf = requestAnimationFrame(tick);
  };

  const show = () => {
    if (on) return;
    on = true;
    el = document.createElement('div');
    el.className = 'fps-meter';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    frames = 0; acc = 0; worst = 0; last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const hide = () => {
    if (!on) return;
    on = false;
    if (raf) cancelAnimationFrame(raf);
    if (el) el.remove();
    el = null;
  };

  // Alt+F toggles the meter at any time (dev aid).
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'f' || e.key === 'F')) { on ? hide() : show(); e.preventDefault(); }
  });

  try {
    if (new URLSearchParams(window.location.search).get('fps') === '1') show();
  } catch { /* ignore */ }

  return { show, hide };
}
