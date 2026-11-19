// Wires the page: photos in, panels placed, title typed, cover out. The preview
// canvas is the cover itself, drawn small; export draws it again at full size.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { SIZES, STYLES, LAYOUTS, freshState, applyLayout, panelAt, layoutRects } from './state.js';
import { renderCover, exportCanvas } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('preview');
const tray = document.getElementById('tray');
const status = document.getElementById('status');
const state = freshState();
const photos = []; // { img, name, url }

function say(text) {
  status.textContent = text;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** The preview resolution: the export shape, shrunk to at most 900 on a side. */
function previewSize() {
  const size = SIZES[state.size];
  const scale = Math.min(1, 900 / Math.max(size.width, size.height));
  return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
}

function redraw() {
  const size = previewSize();
  if (canvas.width !== size.width || canvas.height !== size.height) {
    canvas.width = size.width;
    canvas.height = size.height;
  }
  renderCover(canvas, state);
  // A dashed outline marks the panel the sliders and the tray act on.
  const rects = layoutRects(state, canvas.width, canvas.height);
  const rect = rects[state.selected];
  if (rect) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = STYLES[state.style].accent;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    ctx.restore();
  }
}

/** Adds a loaded photo to the tray and, when it is the first, to the hero panel. */
function addPhoto(img, name) {
  photos.push({ img, name });
  const index = photos.length - 1;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'thumb';
  button.title = name;
  const thumb = document.createElement('img');
  thumb.src = img.src;
  thumb.alt = name;
  button.appendChild(thumb);
  button.addEventListener('click', () => {
    placePhoto(index);
  });
  tray.appendChild(button);
  if (state.panels.every((p) => !p.photo)) {
    state.panels[0].photo = img;
    state.panels[0].name = name;
  }
  redraw();
}

/** Puts tray photo `index` into the selected panel, cropped to fill. */
function placePhoto(index) {
  const photo = photos[index];
  if (!photo) return;
  const panel = state.panels[state.selected];
  panel.photo = photo.img;
  panel.name = photo.name;
  panel.zoom = 1;
  panel.ox = 0;
  panel.oy = 0;
  say(`Placed ${photo.name} in panel ${state.selected + 1}.`);
  redraw();
}

async function addFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  try {
    const img = await loadImage(URL.createObjectURL(file));
    addPhoto(img, file.name);
    say(`Loaded ${file.name}. Click it, then a panel, to place it.`);
  } catch {
    say(`Could not read ${file.name}.`);
  }
}

async function addSample(name) {
  if (photos.some((p) => p.name === name)) {
    say(`${name} is already in the tray.`);
    return;
  }
  try {
    const img = await loadImage(`samples/${name}.jpg`);
    addPhoto(img, name);
    say(`Loaded sample ${name}.`);
  } catch {
    say(`Could not load sample ${name}.`);
  }
}

// --- Controls ---------------------------------------------------------------

document.getElementById('photoInput').addEventListener('change', async (e) => {
  for (const file of e.target.files) await addFile(file);
  e.target.value = '';
});
document.getElementById('sampleBoulevard').addEventListener('click', () => addSample('boulevard'));
document.getElementById('samplePier').addEventListener('click', () => addSample('pier'));

const dropZone = document.getElementById('dropZone');
['dragover', 'dragenter'].forEach((name) => dropZone.addEventListener(name, (e) => {
  e.preventDefault();
  dropZone.classList.add('over');
}));
['dragleave', 'drop'].forEach((name) => dropZone.addEventListener(name, (e) => {
  e.preventDefault();
  dropZone.classList.remove('over');
}));
dropZone.addEventListener('drop', async (e) => {
  for (const file of e.dataTransfer.files) await addFile(file);
});

document.getElementById('titleInput').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
document.getElementById('subtitleInput').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});

document.querySelectorAll('input[name="layout"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    Object.assign(state, applyLayout(state, radio.value));
    syncPanelControls();
    redraw();
  });
});
document.querySelectorAll('input[name="style"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.style = radio.value;
    redraw();
  });
});
document.querySelectorAll('input[name="size"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.size = radio.value;
    redraw();
  });
});

// --- Selected panel ---------------------------------------------------------

const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panX');
const panYInput = document.getElementById('panY');

function syncPanelControls() {
  const panel = state.panels[state.selected];
  zoomInput.value = panel.zoom;
  panXInput.value = Math.round(panel.ox * 100);
  panYInput.value = Math.round(panel.oy * 100);
  document.getElementById('panelLabel').textContent = `Panel ${state.selected + 1} of ${state.panels.length}`;
}

zoomInput.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(zoomInput.value);
  redraw();
});
panXInput.addEventListener('input', () => {
  state.panels[state.selected].ox = Number(panXInput.value) / 100;
  redraw();
});
panYInput.addEventListener('input', () => {
  state.panels[state.selected].oy = Number(panYInput.value) / 100;
  redraw();
});
document.getElementById('fillPanel').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  panel.zoom = 1;
  panel.ox = 0;
  panel.oy = 0;
  syncPanelControls();
  redraw();
});
document.getElementById('clearPanel').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  panel.photo = null;
  panel.name = '';
  redraw();
});

// Drag on the preview to slide the photo inside its panel; wheel to zoom it.
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const hit = panelAt(state, canvas.width, canvas.height, x, y);
  if (hit < 0) return;
  state.selected = hit;
  syncPanelControls();
  drag = { x, y, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const panelRect = layoutRects(state, canvas.width, canvas.height)[state.selected];
  const panel = state.panels[state.selected];
  panel.ox = Math.max(-0.5, Math.min(0.5, drag.ox + (x - drag.x) / panelRect.w));
  panel.oy = Math.max(-0.5, Math.min(0.5, drag.oy + (y - drag.y) / panelRect.h));
  syncPanelControls();
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  panel.zoom = Math.max(1, Math.min(4, panel.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
  syncPanelControls();
  redraw();
}, { passive: false });

// --- Export -----------------------------------------------------------------

function exportPNG(sizeKey) {
  return new Promise((resolve, reject) => {
    const out = exportCanvas(state, sizeKey ?? state.size);
    out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('export failed'))), 'image/png');
  });
}

document.getElementById('export').addEventListener('click', async () => {
  const size = SIZES[state.size];
  try {
    const blob = await exportPNG(state.size);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-forge-${size.width}x${size.height}.png`;
    a.click();
    say(`Saved cover-forge-${size.width}x${size.height}.png (${Math.round(blob.size / 1024)} KiB).`);
  } catch {
    say('Export failed.');
  }
});

// --- Shot mode and test hooks -------------------------------------------------

window.__coverForge = { state, photos, loadImage, addPhoto, placePhoto, redraw, exportPNG };

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, {
    loadSample: async (name) => {
      const img = await loadImage(`samples/${name}.jpg`);
      addPhoto(img, name);
      return img;
    },
    state,
    canvas,
    redraw,
    say,
  });
} else {
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  syncPanelControls();
  redraw();
}
