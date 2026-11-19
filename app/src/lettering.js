// The cover's lettering: a huge outlined title and a small subtitle chip, drawn
// with the heaviest system sans available, so no font file is ever loaded. The
// title sits in a dark scrim along the foot, the way poster lettering does.

const TITLE_FONT = '"Arial Black", "Noto Sans Black", "Helvetica Neue", sans-serif';
const CHIP_FONT = '"Arial Black", "Noto Sans Black", "Helvetica Neue", sans-serif';

/** The font size that fits `text` inside `maxWidth`, starting from `size`. */
function fitSize(ctx, text, size, maxWidth) {
  let s = size;
  ctx.font = `900 ${s}px ${TITLE_FONT}`;
  while (s > 12 && ctx.measureText(text).width > maxWidth) {
    s -= Math.max(2, Math.round(s * 0.04));
    ctx.font = `900 ${s}px ${TITLE_FONT}`;
  }
  return s;
}

/** A dark scrim along the foot of the cover, for the title to sit on. */
function footScrim(ctx, w, h, depth) {
  const g = ctx.createLinearGradient(0, h - depth, 0, h);
  g.addColorStop(0, 'rgba(8, 6, 16, 0)');
  g.addColorStop(0.45, 'rgba(8, 6, 16, 0.55)');
  g.addColorStop(1, 'rgba(8, 6, 16, 0.88)');
  ctx.fillStyle = g;
  ctx.fillRect(0, h - depth, w, depth);
}

/** Draws the title and subtitle onto the cover's context. */
export function drawLettering(ctx, w, h, title, subtitle, accent) {
  const text = (title ?? '').trim().toUpperCase();
  const sub = (subtitle ?? '').trim().toUpperCase();
  if (!text && !sub) return;
  const pad = Math.round(w * 0.045);
  const band = Math.round(h * 0.26);
  footScrim(ctx, w, h, band);

  let titleSize = 0;
  if (text) {
    titleSize = fitSize(ctx, text, Math.round(h * 0.115), w - pad * 2);
    const baseline = h - Math.round(h * 0.055);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeStyle = '#0b0714';
    ctx.lineWidth = Math.max(3, Math.round(titleSize * 0.16));
    ctx.strokeText(text, pad, baseline);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, pad, baseline);
    // A short accent bar under the title, in the style's colour.
    const barW = Math.min(ctx.measureText(text).width, w - pad * 2);
    ctx.fillStyle = accent;
    ctx.fillRect(pad, baseline + Math.round(titleSize * 0.16), Math.round(barW * 0.42), Math.max(4, Math.round(h * 0.008)));
  }

  if (sub) {
    const chipSize = Math.max(12, Math.round(h * 0.026));
    ctx.font = `900 ${chipSize}px ${CHIP_FONT}`;
    const gap = Math.round(w * 0.012);
    const tw = ctx.measureText(sub).width;
    const chipW = tw + gap * 4;
    const chipH = Math.round(chipSize * 2.1);
    const chipY = h - Math.round(h * 0.055) - (text ? titleSize + Math.round(h * 0.045) : Math.round(h * 0.02)) - chipH;
    ctx.fillStyle = accent;
    ctx.fillRect(pad, chipY, chipW, chipH);
    ctx.fillStyle = '#0b0714';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(sub, pad + gap * 2, chipY + chipH / 2 + 1);
  }
}
