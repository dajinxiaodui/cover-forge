// The cover's state: one object the whole app reads and writes. A panel holds one
// photo (an image, or null) plus a crop: zoom scales the photo inside its frame and
// ox/oy slide it, both in fractions of the frame. Layouts and sizes are plain tables
// so the renderer never has to guess a shape.

export const SIZES = {
  square: { label: 'Square 1080 x 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', width: 1080, height: 1350 },
  landscape: { label: 'Landscape 1920 x 1080', width: 1920, height: 1080 },
};

export const STYLES = {
  sunset: { label: 'Sunset', accent: '#ff7a3c', chip: '#ff9a3c' },
  neon: { label: 'Neon Night', accent: '#ff2e88', chip: '#22d3ee' },
  retro: { label: 'Retro', accent: '#e8b34b', chip: '#f2d492' },
};

// Each layout is a list of panel frames, in fractions of the cover's width and
// height. The first frame is the hero panel.
export const LAYOUTS = {
  hero2: {
    label: 'Hero + 2 panels',
    frames: [
      [0, 0, 1, 0.64],
      [0, 0.64, 0.5, 0.36],
      [0.5, 0.64, 0.5, 0.36],
    ],
  },
  hero3: {
    label: 'Hero + 3 panels',
    frames: [
      [0, 0, 0.6, 1],
      [0.6, 0, 0.4, 0.34],
      [0.6, 0.34, 0.4, 0.33],
      [0.6, 0.67, 0.4, 0.33],
    ],
  },
  grid: {
    label: 'Four panels',
    frames: [
      [0, 0, 0.5, 0.5],
      [0.5, 0, 0.5, 0.5],
      [0, 0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0.5],
    ],
  },
};

/** A fresh panel: no photo yet, filled to its frame. */
export function blankPanel() {
  return { photo: null, name: '', zoom: 1, ox: 0, oy: 0 };
}

/** A fresh cover state, with the hero layout and the sunset grade. */
export function freshState() {
  return {
    size: 'square',
    layout: 'hero2',
    style: 'sunset',
    title: 'NEON HARBOR',
    subtitle: 'A COVER FORGE POSTER',
    panels: LAYOUTS.hero2.frames.map(() => blankPanel()),
    selected: 0,
  };
}

/** Resizes the panel list to the layout's frame count, keeping photos already placed. */
export function applyLayout(state, layoutKey) {
  const frames = LAYOUTS[layoutKey].frames;
  const panels = frames.map((_, i) => state.panels[i] ?? blankPanel());
  return { ...state, layout: layoutKey, panels, selected: Math.min(state.selected, panels.length - 1) };
}

/** The pixel rects of the layout's frames on a cover of width w and height h. */
export function layoutRects(state, w, h) {
  return LAYOUTS[state.layout].frames.map(([fx, fy, fw, fh]) => ({
    x: Math.round(fx * w),
    y: Math.round(fy * h),
    w: Math.round(fw * w),
    h: Math.round(fh * h),
  }));
}

/** The panel whose rect holds point (x, y) in cover pixels, or -1. */
export function panelAt(state, w, h, x, y) {
  const rects = layoutRects(state, w, h);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i;
  }
  return -1;
}
