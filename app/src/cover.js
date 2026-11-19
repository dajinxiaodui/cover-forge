// Renders the cover: the panels with their photos, the white gutters between them,
// the style grade, and the title lettering. One function draws to any canvas at any
// size, so the live preview and the exported PNG are the same picture.

import { STYLES, layoutRects } from './state.js';
import { applyGrade } from './grade.js';
import { drawLettering } from './lettering.js';

/** Draws one photo into a frame, cover-fit, slid by the panel's crop. */
function drawPanelPhoto(ctx, rect, panel) {
  const img = panel.photo;
  if (!img || !img.naturalWidth) return false;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * (panel.zoom || 1);
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - pw) / 2 + (panel.ox || 0) * rect.w;
  const dy = rect.y + (rect.h - ph) / 2 + (panel.oy || 0) * rect.h;
  // Cover-fit always leaves slack on one axis and none on the other: clamp the
  // slide to the slack, so a photo can never be dragged off its frame's edge.
  const cx = Math.max(rect.x + rect.w - pw, Math.min(rect.x, dx));
  const cy = Math.max(rect.y + rect.h - ph, Math.min(rect.y, dy));
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, cx, cy, pw, ph);
  ctx.restore();
  return true;
}

/** An empty panel: diagonal stripes and a hint, so the layout reads even unfilled. */
function drawEmptyPanel(ctx, rect, index) {
  ctx.fillStyle = index % 2 ? '#241b33' : '#1c1626';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = Math.max(2, rect.w * 0.01);
  const step = Math.max(24, rect.w * 0.12);
  for (let x = -rect.h; x < rect.w + rect.h; x += step) {
    ctx.beginPath();
    ctx.moveTo(rect.x + x, rect.y);
    ctx.lineTo(rect.x + x + rect.h, rect.y + rect.h);
    ctx.stroke();
  }
  ctx.restore();
  const size = Math.max(11, Math.round(Math.min(rect.w, rect.h) * 0.055));
  ctx.font = `900 ${size}px "Arial Black", "Noto Sans Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
}

/** Renders the whole cover onto the canvas's 2D context at its own pixel size. */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const style = STYLES[state.style] ?? STYLES.sunset;
  const gutter = Math.max(2, Math.round(Math.min(w, h) * 0.012));

  // The paper: a dark sheet the panels sit on, its edge the cover's frame.
  ctx.fillStyle = '#0b0714';
  ctx.fillRect(0, 0, w, h);

  const rects = layoutRects(state, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    const inset = {
      x: rect.x + (rect.x === 0 ? gutter : gutter / 2),
      y: rect.y + (rect.y === 0 ? gutter : gutter / 2),
      w: rect.w - (rect.x === 0 ? gutter : gutter / 2) - (rect.x + rect.w >= w ? gutter : gutter / 2),
      h: rect.h - (rect.y === 0 ? gutter : gutter / 2) - (rect.y + rect.h >= h ? gutter : gutter / 2),
    };
    if (!drawPanelPhoto(ctx, inset, panel)) drawEmptyPanel(ctx, inset, i);
    // A thin white keyline around each panel.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = Math.max(1, Math.round(gutter * 0.28));
    ctx.strokeRect(inset.x, inset.y, inset.w, inset.h);
  });

  applyGrade(ctx, w, h, state.style);
  drawLettering(ctx, w, h, state.title, state.subtitle, style.accent);
}

/** Renders the cover at its export size on a fresh canvas, for download. */
export function exportCanvas(state, sizeKey) {
  const size = { width: 1080, height: 1080 };
  if (sizeKey === 'portrait') { size.width = 1080; size.height = 1350; }
  if (sizeKey === 'landscape') { size.width = 1920; size.height = 1080; }
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  renderCover(canvas, { ...state, size: sizeKey });
  return canvas;
}
