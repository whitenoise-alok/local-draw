import { getCanvas, saveCanvas } from './core/api.js';
import { createScene, addElement, removeElement, updateElement, nextOrder } from './core/scene.js';
import { createHistory, historyPush, historyUndo, historyRedo, canUndo, canRedo } from './core/history.js';
import { createRectTool, drawRect } from './tools/rect.js';
import { createTextTool, drawText } from './tools/text.js';
import { renderProperties } from './ui/properties.js';

// ── Bootstrap ─────────────────────────────────────────────────
const params = new URLSearchParams(location.search);
const canvasId = params.get('id');
if (!canvasId) { location.href = '/'; throw new Error('No canvas id'); }

const canvasEl = document.getElementById('canvas');
const ctx = canvasEl.getContext('2d');
const wrap = document.getElementById('canvas-wrap');
const propertiesBar = document.getElementById('properties-bar');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

// ── Viewport ──────────────────────────────────────────────────
const vp = { pan: { x: 0, y: 0 }, zoom: 1 };

function screenToCanvas(sx, sy) {
  return { x: (sx - vp.pan.x) / vp.zoom, y: (sy - vp.pan.y) / vp.zoom };
}

// ── State ─────────────────────────────────────────────────────
let scene = createScene();
let hist = createHistory(scene);

// ── Tools ─────────────────────────────────────────────────────
const tools = {
  rect: createRectTool(),
  text: createTextTool({
    getVp: () => vp,
    onOpen: (el) => {
      scene = addElement(scene, { ...el, order: nextOrder(scene) });
      render();
    },
    onFinalize: () => {
      hist = historyPush(hist, scene);
      updateHistoryButtons();
      scheduleAutoSave();
    },
    onReplace: (el) => {
      scene = updateElement(scene, el.id, el);
      hist = historyPush(hist, scene);
      updateHistoryButtons();
      scheduleAutoSave();
      render();
    },
    onCancel: (id) => {
      scene = removeElement(scene, id);
      render();
    },
    onUpdate: (id, props) => {
      scene = updateElement(scene, id, props);
      render();
    },
  }),
};

let activeToolName = 'select';
let prevTool = null;
let spaceDown = false;

// ── Element rendering ─────────────────────────────────────────
function renderElement(c, el) {
  if (tools.text.getEditingId() === el.id) return;
  if (el.type === 'rect') drawRect(c, el, el);
  if (el.type === 'text') drawText(c, el);
}

// ── Grid ──────────────────────────────────────────────────────
const GRID = 24;

function drawGrid() {
  const { pan, zoom } = vp;
  const w = canvasEl.width;
  const h = canvasEl.height;
  const r = Math.max(0.5, zoom * 0.8);
  const x0 = Math.floor(-pan.x / zoom / GRID) * GRID;
  const y0 = Math.floor(-pan.y / zoom / GRID) * GRID;
  const x1 = (w - pan.x) / zoom;
  const y1 = (h - pan.y) / zoom;
  ctx.fillStyle = '#c8c8c8';
  for (let gx = x0; gx <= x1; gx += GRID) {
    for (let gy = y0; gy <= y1; gy += GRID) {
      ctx.beginPath();
      ctx.arc(gx * zoom + pan.x, gy * zoom + pan.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── Render ────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  drawGrid();

  ctx.save();
  ctx.translate(vp.pan.x, vp.pan.y);
  ctx.scale(vp.zoom, vp.zoom);

  const sorted = [...scene.elements].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  sorted.forEach(el => renderElement(ctx, el));

  tools[activeToolName]?.renderPreview?.(ctx);

  ctx.restore();
}

function resize() {
  canvasEl.width = wrap.clientWidth;
  canvasEl.height = wrap.clientHeight;
  render();
}
new ResizeObserver(resize).observe(wrap);

// ── Commit element ────────────────────────────────────────────
function commitElement(el) {
  const order = nextOrder(scene);
  scene = addElement(scene, { ...el, order });
  hist = historyPush(hist, scene);
  updateHistoryButtons();
  scheduleAutoSave();
  render();
}

// ── History ───────────────────────────────────────────────────
function updateHistoryButtons() {
  undoBtn.disabled = !canUndo(hist);
  redoBtn.disabled = !canRedo(hist);
}

function applyHistory(newHist) {
  hist = newHist;
  scene = hist.present;
  updateHistoryButtons();
  scheduleAutoSave();
  render();
}

undoBtn.addEventListener('click', () => applyHistory(historyUndo(hist)));
redoBtn.addEventListener('click', () => applyHistory(historyRedo(hist)));

// ── Auto-save ─────────────────────────────────────────────────
let saveTimer = null;

function scheduleAutoSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, 500);
}

function generateThumbnail() {
  if (scene.elements.length === 0) return '';
  const TW = 280, TH = 180;
  const off = document.createElement('canvas');
  off.width = TW;
  off.height = TH;
  const tc = off.getContext('2d');

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  scene.elements.forEach(el => {
    const w = el.width ?? (el.type === 'text' ? 200 : null);
    const h = el.height ?? (el.type === 'text' ? el.fontSize * 1.4 : null);
    if (el.x != null && w != null) {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + w);
      maxY = Math.max(maxY, el.y + h);
    }
  });
  if (!isFinite(minX)) return '';

  const PAD = 12;
  const sw = maxX - minX || 1;
  const sh = maxY - minY || 1;
  const scale = Math.min((TW - PAD * 2) / sw, (TH - PAD * 2) / sh);
  const tx = PAD + (TW - PAD * 2 - sw * scale) / 2 - minX * scale;
  const ty = PAD + (TH - PAD * 2 - sh * scale) / 2 - minY * scale;

  tc.save();
  tc.translate(tx, ty);
  tc.scale(scale, scale);
  const sorted = [...scene.elements].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  sorted.forEach(el => renderElement(tc, el));
  tc.restore();

  return off.toDataURL('image/png');
}

async function doSave() {
  try {
    await saveCanvas(canvasId, scene.elements, generateThumbnail());
  } catch (err) {
    console.error('Auto-save failed:', err);
  }
}

// ── Export placeholder ────────────────────────────────────────
document.getElementById('export-btn').addEventListener('click', () => {
  alert('SVG export coming soon.');
});

// ── Tool switching ────────────────────────────────────────────
const CURSOR = {
  select: 'default', pan: 'grab', rect: 'crosshair',
  text: 'text', line: 'crosshair', arrow: 'crosshair',
  image: 'crosshair', eraser: 'cell',
};

function setTool(name) {
  tools[activeToolName]?.cancel?.();
  activeToolName = name;
  canvasEl.style.cursor = CURSOR[name] ?? 'default';
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === name);
  });
  renderProperties(propertiesBar, name, tools[name]);
}

document.getElementById('toolbar').addEventListener('click', (e) => {
  const btn = e.target.closest('.tool-btn');
  if (btn?.dataset.tool) setTool(btn.dataset.tool);
});

// ── Pan ───────────────────────────────────────────────────────
let panning = false;
let panLast = null;

// ── Pointer events ────────────────────────────────────────────
canvasEl.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  if (activeToolName === 'pan' || spaceDown) {
    panning = true;
    panLast = { x: e.clientX, y: e.clientY };
    canvasEl.style.cursor = 'grabbing';
    return;
  }
  const r = canvasEl.getBoundingClientRect();
  const pt = screenToCanvas(e.clientX - r.left, e.clientY - r.top);
  if (activeToolName === 'text') {
    tools.text.pointerdown(pt, r);
  } else {
    tools[activeToolName]?.pointerdown(pt);
  }
});

canvasEl.addEventListener('dblclick', (e) => {
  const r = canvasEl.getBoundingClientRect();
  const pt = screenToCanvas(e.clientX - r.left, e.clientY - r.top);
  const hit = [...scene.elements]
    .filter(el => el.type === 'text')
    .find(el => {
      const lines = el.content?.split('\n').length ?? 1;
      return pt.x >= el.x && pt.y >= el.y
        && pt.x <= el.x + 400
        && pt.y <= el.y + el.fontSize * 1.4 * lines;
    });
  if (hit) {
    if (activeToolName !== 'text') setTool('text');  // skip cancel() if already in text mode
    tools.text.editExisting(hit, r);
  }
});

window.addEventListener('mousemove', (e) => {
  if (panning) {
    vp.pan.x += e.clientX - panLast.x;
    vp.pan.y += e.clientY - panLast.y;
    panLast = { x: e.clientX, y: e.clientY };
    render();
    return;
  }
  const r = canvasEl.getBoundingClientRect();
  const pt = screenToCanvas(e.clientX - r.left, e.clientY - r.top);
  if (tools[activeToolName]?.pointermove(pt)) render();
});

window.addEventListener('mouseup', (e) => {
  if (panning) {
    panning = false;
    canvasEl.style.cursor = spaceDown ? 'grab' : (CURSOR[activeToolName] ?? 'default');
    return;
  }
  const r = canvasEl.getBoundingClientRect();
  const pt = screenToCanvas(e.clientX - r.left, e.clientY - r.top);
  tools[activeToolName]?.pointerup(pt, commitElement);
  render();
});

// ── Zoom ──────────────────────────────────────────────────────
canvasEl.addEventListener('wheel', (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  const newZoom = Math.min(10, Math.max(0.1, vp.zoom * factor));
  const r = canvasEl.getBoundingClientRect();
  const sx = e.clientX - r.left;
  const sy = e.clientY - r.top;
  const cx = (sx - vp.pan.x) / vp.zoom;
  const cy = (sy - vp.pan.y) / vp.zoom;
  vp.pan.x = sx - cx * newZoom;
  vp.pan.y = sy - cy * newZoom;
  vp.zoom = newZoom;
  render();
}, { passive: false });

// ── Keyboard ──────────────────────────────────────────────────
function isTyping() {
  const el = document.activeElement;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

const KEY_TOOL = { v: 'select', h: 'pan', r: 'rect', t: 'text', l: 'line', a: 'arrow', i: 'image', e: 'eraser' };

window.addEventListener('keydown', (e) => {
  if (isTyping()) return;
  if (e.code === 'Space' && !spaceDown) {
    e.preventDefault();
    spaceDown = true;
    prevTool = activeToolName;
    setTool('pan');
    return;
  }
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      applyHistory(historyUndo(hist));
    } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
      e.preventDefault();
      applyHistory(historyRedo(hist));
    }
    return;
  }
  const tool = KEY_TOOL[e.key.toLowerCase()];
  if (tool) setTool(tool);
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space' && spaceDown) {
    spaceDown = false;
    panning = false;
    setTool(prevTool ?? 'select');
    prevTool = null;
  }
});

// ── Init ──────────────────────────────────────────────────────
async function init() {
  try {
    const data = await getCanvas(canvasId);
    document.getElementById('canvas-name').textContent = data.name;
    document.title = `${data.name} — Local Draw`;
    scene = createScene(data.elements || []);
    hist = createHistory(scene);
    updateHistoryButtons();
    setTool('select');
    render();
  } catch {
    location.href = '/';
  }
}

init();
