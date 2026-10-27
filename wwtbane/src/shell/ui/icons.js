// icons.js — the UI's few glyphs, drawn as inline SVG strokes (24 px grid,
// 1.6 stroke, round caps, currentColor) instead of emoji. Emoji render
// differently on every platform and read as placeholder art; these take the text
// colour, scale with the font and stay crisp. Original drawings, no icon font.
const NS = 'http://www.w3.org/2000/svg';
const P = {
  coin: ['circle:12,12,8.6', 'circle:12,12,5'],
  shield: ['M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9.5-4.1-1.9-7-5.3-7-9.5V6l7-3z'],
  phone: ['M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'],
  audience: ['circle:9,8,3', 'circle:17.2,9.2,2.4', 'M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1', 'M17 14.2a4 4 0 0 1 4 3.8v2'],
  trophy: ['M8 4h8v5a4 4 0 0 1-8 0V4z', 'M8 6H5v1a3 3 0 0 0 3 3', 'M16 6h3v1a3 3 0 0 1-3 3', 'M12 13v4', 'M9 20h6', 'M10 17h4'],
  sound: ['M4 9v6h4l5 4V5L8 9H4z', 'M16.5 8.5a5 5 0 0 1 0 7'],
  mute: ['M4 9v6h4l5 4V5L8 9H4z', 'M17 9l5 6', 'M22 9l-5 6'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  burst: ['M12 3l1.8 5.2L19 6.5l-2.2 5 4.2 2.3-5 .8L14 20l-2-4.6L8.5 20 8 14.6 3 13.8l4.2-2.3-2.2-5 5.2 1.7z'],
  tools: ['M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2-.5-.5-2z'],
};

// icon('coin') -> an <svg class="ico"> sized by CSS (1em by default).
export function icon(name, cls = '') {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'ico' + (cls ? ' ' + cls : ''));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const s of P[name] || []) {
    if (s.startsWith('circle:')) {
      const [cx, cy, r] = s.slice(7).split(',');
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
      svg.appendChild(c);
    } else {
      const p = document.createElementNS(NS, 'path'); p.setAttribute('d', s); svg.appendChild(p);
    }
  }
  return svg;
}
