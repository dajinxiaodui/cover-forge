// The colour grades: three overlays painted over the finished panels, each in the
// style's own palette. They only ever add translucent colour on top of the photos,
// so a grade can never hide the pictures underneath it.

/** Darkens the cover's edges so the middle reads brighter. */
function vignette(ctx, w, h, strength) {
  const g = ctx.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, `rgba(0, 0, 0, ${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** A warm sunset: orange light from the top, pink heat along the foot. */
function sunsetGrade(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, 'rgba(255, 170, 60, 0.22)');
  sky.addColorStop(0.55, 'rgba(255, 120, 80, 0.05)');
  sky.addColorStop(1, 'rgba(220, 40, 120, 0.30)');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const sun = ctx.createRadialGradient(w * 0.78, h * 0.16, 0, w * 0.78, h * 0.16, Math.min(w, h) * 0.45);
  sun.addColorStop(0, 'rgba(255, 220, 130, 0.55)');
  sun.addColorStop(1, 'rgba(255, 220, 130, 0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  vignette(ctx, w, h, 0.28);
}

/** A neon night: magenta from one corner, cyan from the other, deep blue shade. */
function neonGrade(ctx, w, h) {
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, 'rgba(255, 46, 136, 0.20)');
  wash.addColorStop(0.5, 'rgba(40, 20, 90, 0.05)');
  wash.addColorStop(1, 'rgba(34, 211, 238, 0.20)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.15, h * 0.9, 0, w * 0.15, h * 0.9, Math.min(w, h) * 0.5);
  glow.addColorStop(0, 'rgba(255, 46, 136, 0.35)');
  glow.addColorStop(1, 'rgba(255, 46, 136, 0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  vignette(ctx, w, h, 0.38);
}

/** A retro print: pulled-back colour, a warm paper tone, and soft edges. */
function retroGrade(ctx, w, h) {
  ctx.globalCompositeOperation = 'saturation';
  ctx.fillStyle = 'rgba(128, 128, 128, 0.45)';
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  const paper = ctx.createLinearGradient(0, 0, 0, h);
  paper.addColorStop(0, 'rgba(232, 179, 75, 0.10)');
  paper.addColorStop(1, 'rgba(180, 110, 40, 0.22)');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);
  vignette(ctx, w, h, 0.22);
}

const GRADES = { sunset: sunsetGrade, neon: neonGrade, retro: retroGrade };

/** Paints the named grade over the whole cover. Unknown names grade nothing. */
export function applyGrade(ctx, w, h, style) {
  const grade = GRADES[style];
  if (grade) grade(ctx, w, h);
}
