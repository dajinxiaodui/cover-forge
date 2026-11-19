// Fixed scenes for screenshots: ?shot=cover shows the cover alone, full screen, at
// its export size; ?shot=editor shows the page with photos loaded. `size`, `style`,
// `layout`, `photo`, `photo2`, `title` and `subtitle` pick the scene. The hero
// panel takes `photo`, the rest take `photo2`. window.__shotReady is set once painted.
import { SIZES, LAYOUTS, applyLayout, layoutRects } from './state.js';
import { renderCover } from './cover.js';

async function setupScene(query, api) {
  const { state } = api;
  const sizeKey = query.get('size') ?? 'square';
  const styleKey = query.get('style') ?? 'sunset';
  const layoutKey = query.get('layout') ?? 'hero2';
  if (SIZES[sizeKey]) state.size = sizeKey;
  if (styleKey === 'sunset' || styleKey === 'neon' || styleKey === 'retro') state.style = styleKey;
  if (LAYOUTS[layoutKey]) Object.assign(state, applyLayout(state, layoutKey));
  state.title = query.get('title') ?? state.title;
  state.subtitle = query.get('subtitle') ?? state.subtitle;
  const hero = await api.loadSample(query.get('photo') ?? 'pier');
  const other = await api.loadSample(query.get('photo2') ?? 'boulevard');
  // Frame aspects must come from the real export size: square stand-ins would
  // call every panel square and slide photos along the wrong axis, opening gaps.
  const exportSize = SIZES[state.size];
  const rects = layoutRects(state, exportSize.width, exportSize.height);
  state.panels.forEach((panel, i) => {
    panel.photo = i === 0 ? hero : other;
    panel.name = i === 0 ? (query.get('photo') ?? 'pier') : (query.get('photo2') ?? 'boulevard');
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
    // Spread repeated photos across their frames: slide along the axis that has
    // slack (the photo's long side against the frame), so no panel repeats the
    // same crop and no slide ever opens a gap at the frame's edge.
    const frameAspect = rects[i].w / rects[i].h;
    const imgAspect = panel.photo.naturalWidth / panel.photo.naturalHeight;
    if (i === 0) {
      const oy = parseFloat(query.get('oy') ?? '0');
      if (imgAspect < frameAspect) panel.oy = oy;
    } else {
      const spread = (i - 1) * 0.14 - 0.07;
      if (imgAspect > frameAspect) panel.ox = spread;
      else panel.oy = spread;
    }
  });
  // Keep the editor's inputs honest about the scene, so a screenshot of it reads true.
  const titleInput = document.getElementById('titleInput');
  if (titleInput) titleInput.value = state.title;
  const subtitleInput = document.getElementById('subtitleInput');
  if (subtitleInput) subtitleInput.value = state.subtitle;
  for (const [name, value] of [['layout', state.layout], ['style', state.style], ['size', state.size]]) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((radio) => {
      radio.checked = radio.value === value;
    });
  }
  return state;
}

/** Fits the cover canvas into the viewport, keeping its aspect, and paints it. */
function showCoverAlone(api) {
  const { state, canvas } = api;
  const size = SIZES[state.size];
  document.body.classList.add('shot-cover');
  canvas.width = size.width;
  canvas.height = size.height;
  const scale = Math.min(window.innerWidth / size.width, window.innerHeight / size.height);
  canvas.style.width = `${Math.floor(size.width * scale)}px`;
  canvas.style.height = `${Math.floor(size.height * scale)}px`;
  renderCover(canvas, state);
}

export async function runShot(shot, query, api) {
  await setupScene(query, api);
  if (shot === 'cover') {
    showCoverAlone(api);
  } else {
    api.redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
