// looks.js — which of the five drawn people (host, player, op, stage, fan) a request for a person means.
export const LOOKS = ['host', 'player', 'op', 'stage', 'fan'];

// An explicit opts.look wins; otherwise guess from the outfit and sex the 3D actors were given.
export function pickLook(opts = {}) {
  if (opts.look && LOOKS.includes(opts.look)) return opts.look;
  const top = opts.outfit?.top;
  if (top === 'jacket') return 'host';
  if (top === 'hoodie') return 'player';
  if (top === 'shirt') return 'stage';
  return opts.sex === 'f' ? 'stage' : 'op';
}
