import { getCanvas, saveCanvas, uploadImage } from './core/api.js';
import { createScene, addElement, removeElement, updateElement, nextOrder } from './core/scene.js';
import { createHistory, historyPush, historyUndo, historyRedo, canUndo, canRedo } from './core/history.js';
import { createRectTool, drawRect } from './tools/rect.js';
import { createTextTool, drawText, hitTestText } from './tools/text.js';
import { createLineTool, createArrowTool, drawLine, drawArrow, midpointHandle } from './tools/line.js';
import { createEraserTool } from './tools/eraser.js';
import { createImageTool, createImageElement, drawImage, hitTestImage, imageHandles, resizeImage } from './tools/image.js';
import {
  elementBounds, selectInBox, translateElements, removeElements, applySharedProp,
  bringToFrontMany, sendToBackMany, bringForwardMany, sendBackwardMany,
} from './core/selection.js';
import { renderProperties } from './ui/properties.js';
import { renderSelectionProperties } from './ui/selection-properties.js';
import { toRect } from './tools/rect.js';

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

// ── Image asset cache ─────────────────────────────────────────
// Caches the HTMLImageElement per filename. Returns it only once loaded so
// drawImage never receives an incomplete image; triggers a re-render on load.
const imageCache = new Map();

function getImage(filename) {
  let img = imageCache.get(filename);
  if (!img) {
    img = new Image();
    img.addEventListener('load', render);
    img.src = `/uploads/${filename}`;
    imageCache.set(filename, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ── State ─────────────────────────────────────────────────────
let scene = createScene();
let hist = createHistory(scene);

// ── Tools ─────────────────────────────────────────────────────
const tools = {
  rect: createRectTool(),
  line: createLineTool(),
  arrow: createArrowTool(),
  eraser: createEraserTool({
    getScene: () => scene,
    onDeleteElement: (id) => {
      scene = removeElement(scene, id);
      render();
    },
    onCommit: () => {
      hist = historyPush(hist, scene);
      updateHistoryButtons();
      scheduleAutoSave();
    },
  }),
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

// Image tool: opens the file picker, uploads the chosen image asset, then
// inserts an image element at the centre of the viewport.
const imageTool = createImageTool({
  onPick: async (file) => {
    try {
      const filename = await uploadImage(file);
      const img = await loadImageEl(`/uploads/${filename}`);
      imageCache.set(filename, img);
      const center = screenToCanvas(canvasEl.width / 2, canvasEl.height / 2);
      const el = createImageElement(filename, img.naturalWidth, img.naturalHeight, center);
      commitElement(el);
      setTool('select');
      selectedIds = [el.id];
      syncSelectionUI();
      render();
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image.');
    }
  },
});

let activeToolName = 'select';
let prevTool = null;
let spaceDown = false;

// ── Selection state ───────────────────────────────────────────
const HANDLE_R = 6;
let selectedIds = [];      // ids of every currently selected element
let draggingHandle = null; // line: 'start'|'end'|'mid' — image: 'nw'|'ne'|'sw'|'se'
let movingSelection = null; // { lastPt, moved } while dragging the selection as a group
let marquee = null;        // { start, cur } while drawing a selection box

function selectedElements() {
  const set = new Set(selectedIds);
  return scene.elements.filter(el => set.has(el.id));
}

// The single live element when exactly one is selected — drives the per-type
// resize handles (line endpoints, image corners). Null for empty/multi selects.
function singleSelected() {
  if (selectedIds.length !== 1) return null;
  return scene.elements.find(el => el.id === selectedIds[0]) ?? null;
}

function hitTestElement(pt, el) {
  if (el.type === 'image') return hitTestImage(pt, el);
  if (el.type === 'text') return hitTestText(pt, el);
  if (el.type === 'line' || el.type === 'arrow') return hitTestLine(pt, el);
  if (el.type === 'rect') {
    return pt.x >= el.x && pt.x <= el.x + el.width && pt.y >= el.y && pt.y <= el.y + el.height;
  }
  return false;
}

// Topmost non-text element under the pointer (text is handled separately so a
// click opens its editor). Highest order wins.
function topmostHit(pt) {
  return [...scene.elements]
    .sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
    .find(el => el.type !== 'text' && hitTestElement(pt, el)) ?? null;
}

function hitAnySelected(pt) {
  return selectedElements().some(el => hitTestElement(pt, el));
}

function hitImageHandle(pt, el) {
  const handles = imageHandles(el);
  for (const [name, h] of Object.entries(handles)) {
    if (Math.abs(pt.x - h.x) <= HANDLE_R + 2 && Math.abs(pt.y - h.y) <= HANDLE_R + 2) return name;
  }
  return null;
}

function drawImageSelection(c, el) {
  c.save();
  c.strokeStyle = '#0066ff';
  c.lineWidth = 1.5;
  c.setLineDash([]);
  c.strokeRect(el.x, el.y, el.width, el.height);
  c.fillStyle = '#fff';
  Object.values(imageHandles(el)).forEach(h => {
    c.beginPath();
    c.rect(h.x - HANDLE_R, h.y - HANDLE_R, HANDLE_R * 2, HANDLE_R * 2);
    c.fill();
    c.stroke();
  });
  c.restore();
}

function hitHandle(pt, el) {
  const handles = lineHandles(el);
  const hit = (hx, hy) => Math.hypot(pt.x - hx, pt.y - hy) <= HANDLE_R + 2;
  if (hit(handles.start.x, handles.start.y)) return 'start';
  if (hit(handles.end.x, handles.end.y)) return 'end';
  if (hit(handles.mid.x, handles.mid.y)) return 'mid';
  return null;
}

function lineHandles(el) {
  const mid = midpointHandle(el.x1, el.y1, el.x2, el.y2, el.cp1, el.cp2);
  return { start: { x: el.x1, y: el.y1 }, end: { x: el.x2, y: el.y2 }, mid };
}

function hitTestLine(pt, el) {
  const THRESH = 8;
  const steps = 20;
  if (!el.cp1 || !el.cp2) {
    // Straight line: distance from point to segment
    const dx = el.x2 - el.x1, dy = el.y2 - el.y1;
    const len2 = dx*dx + dy*dy;
    if (len2 === 0) return Math.hypot(pt.x - el.x1, pt.y - el.y1) <= THRESH;
    const t = Math.max(0, Math.min(1, ((pt.x - el.x1)*dx + (pt.y - el.y1)*dy) / len2));
    return Math.hypot(pt.x - (el.x1 + t*dx), pt.y - (el.y1 + t*dy)) <= THRESH;
  }
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, mt = 1 - t;
    const bx = mt*mt*mt*el.x1 + 3*mt*mt*t*el.cp1.x + 3*mt*t*t*el.cp2.x + t*t*t*el.x2;
    const by = mt*mt*mt*el.y1 + 3*mt*mt*t*el.cp1.y + 3*mt*t*t*el.cp2.y + t*t*t*el.y2;
    if (Math.hypot(pt.x - bx, pt.y - by) <= THRESH) return true;
  }
  return false;
}

function drawHandles(c, el) {
  const handles = lineHandles(el);
  c.save();
  c.fillStyle = '#fff';
  c.strokeStyle = '#0066ff';
  c.lineWidth = 1.5;
  [handles.start, handles.end].forEach(h => {
    c.beginPath();
    c.arc(h.x, h.y, HANDLE_R, 0, Math.PI * 2);
    c.fill(); c.stroke();
  });
  c.fillStyle = '#0066ff';
  c.beginPath();
  c.arc(handles.mid.x, handles.mid.y, HANDLE_R - 1, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ── Element rendering ─────────────────────────────────────────
function renderElement(c, el) {
  if (tools.text.getEditingId() === el.id) return;
  if (el.type === 'rect') drawRect(c, el, el);
  if (el.type === 'text') drawText(c, el);
  if (el.type === 'line') drawLine(c, el);
  if (el.type === 'arrow') drawArrow(c, el);
  if (el.type === 'image') drawImage(c, el, getImage(el.filename));
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

  drawSelection(ctx);

  if (marquee) drawMarquee(ctx, toRect(marquee.start, marquee.cur));

  ctx.restore();
}

function drawSelection(c) {
  const sel = selectedElements();
  if (sel.length === 1) {
    const el = sel[0];
    if (el.type === 'line' || el.type === 'arrow') drawHandles(c, el);
    else if (el.type === 'image') drawImageSelection(c, el);
    else drawOutline(c, el);
  } else if (sel.length > 1) {
    sel.forEach(el => drawOutline(c, el));
    drawGroupBox(c, sel);
  }
}

function drawOutline(c, el) {
  const b = elementBounds(el);
  c.save();
  c.strokeStyle = '#0066ff';
  c.lineWidth = 1;
  c.setLineDash([4, 3]);
  c.strokeRect(b.x, b.y, b.width, b.height);
  c.restore();
}

function drawGroupBox(c, els) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  els.forEach(el => {
    const b = elementBounds(el);
    minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height);
  });
  c.save();
  c.strokeStyle = '#0066ff';
  c.lineWidth = 1.5;
  c.setLineDash([]);
  c.strokeRect(minX, minY, maxX - minX, maxY - minY);
  c.restore();
}

function drawMarquee(c, box) {
  c.save();
  c.strokeStyle = '#0066ff';
  c.fillStyle = 'rgba(0, 102, 255, 0.08)';
  c.lineWidth = 1;
  c.setLineDash([4, 3]);
  c.fillRect(box.x, box.y, box.width, box.height);
  c.strokeRect(box.x, box.y, box.width, box.height);
  c.restore();
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
  if (el.type === 'line' || el.type === 'arrow') {
    setTool('select');
    selectedIds = [el.id];
    syncSelectionUI();
  }
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
  if (name === 'image') {
    // Image insertion is a one-shot file picker, not a persistent canvas mode.
    imageTool.openPicker();
    return;
  }
  tools[activeToolName]?.cancel?.();
  activeToolName = name;
  if (name !== 'select') { selectedIds = []; draggingHandle = null; movingSelection = null; marquee = null; }
  canvasEl.style.cursor = CURSOR[name] ?? 'default';
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === name);
  });
  renderProperties(propertiesBar, name, tools[name]);
  if (name === 'select') syncSelectionUI();
}

// ── Selection plumbing ────────────────────────────────────────
// Refreshes the property bar to match the current selection: the shared-style /
// ordering / delete controls when something is selected, empty otherwise.
function syncSelectionUI() {
  if (activeToolName !== 'select') return;
  if (selectedIds.length === 0) { propertiesBar.innerHTML = ''; return; }
  renderSelectionProperties(propertiesBar, selectionApi());
}

function commitSelectionChange() {
  hist = historyPush(hist, scene);
  updateHistoryButtons();
  scheduleAutoSave();
  render();
}

function selectionApi() {
  const order = (fn) => () => { scene = fn(scene, selectedIds); commitSelectionChange(); };
  return {
    elements: selectedElements(),
    onSetProp: (key, value) => {
      scene = applySharedProp(scene, selectedIds, key, value);
      commitSelectionChange();
    },
    onBringToFront: order(bringToFrontMany),
    onSendToBack: order(sendToBackMany),
    onBringForward: order(bringForwardMany),
    onSendBackward: order(sendBackwardMany),
    onDelete: () => {
      scene = removeElements(scene, selectedIds);
      selectedIds = [];
      syncSelectionUI();
      commitSelectionChange();
    },
  };
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
    return;
  }
  if (activeToolName === 'select') {
    // Resize handles on a lone selection (handles can sit outside the body).
    const single = singleSelected();
    if (single && (single.type === 'line' || single.type === 'arrow')) {
      const h = hitHandle(pt, single);
      if (h) { draggingHandle = h; return; }
    }
    if (single && single.type === 'image') {
      const h = hitImageHandle(pt, single);
      if (h) { draggingHandle = h; return; }
    }
    // Dragging an existing selection moves the whole group. Checked before the
    // text-edit shortcut so grouped text can be dragged rather than opened.
    if (selectedIds.length && hitAnySelected(pt)) {
      movingSelection = { lastPt: pt, moved: false };
      return;
    }
    // Click a text element → edit it.
    const textHit = scene.elements.find(el => el.type === 'text' && hitTestText(pt, el));
    if (textHit) {
      setTool('text');
      tools.text.editExisting(textHit, r);
      return;
    }
    // Click any other element → select it and start moving.
    const hit = topmostHit(pt);
    if (hit) {
      selectedIds = [hit.id];
      movingSelection = { lastPt: pt, moved: false };
      syncSelectionUI();
      render();
      return;
    }
    // Empty canvas → begin a selection box.
    selectedIds = [];
    marquee = { start: pt, cur: pt };
    syncSelectionUI();
    render();
    return;
  }
  // Non-select tools: clicking a text element still opens its editor.
  const textHit = activeToolName !== 'eraser'
    && scene.elements.find(el => el.type === 'text' && hitTestText(pt, el));
  if (textHit) {
    if (activeToolName !== 'text') setTool('text');
    tools.text.editExisting(textHit, r);
    return;
  }
  tools[activeToolName]?.pointerdown(pt);
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
  if (marquee) {
    marquee.cur = pt;
    render();
    return;
  }
  if (movingSelection) {
    const dx = pt.x - movingSelection.lastPt.x;
    const dy = pt.y - movingSelection.lastPt.y;
    movingSelection.lastPt = pt;
    if (dx !== 0 || dy !== 0) {
      movingSelection.moved = true;
      scene = translateElements(scene, selectedIds, dx, dy);
      render();
    }
    return;
  }
  if (draggingHandle) {
    const live = singleSelected();
    if (live) {
      if (live.type === 'image') {
        scene = updateElement(scene, live.id, resizeImage(live, draggingHandle, pt));
      } else if (draggingHandle === 'start') {
        scene = updateElement(scene, live.id, { x1: pt.x, y1: pt.y });
      } else if (draggingHandle === 'end') {
        scene = updateElement(scene, live.id, { x2: pt.x, y2: pt.y });
      } else if (draggingHandle === 'mid') {
        // B(0.5) = M + (3/2)*d where CP1=P0+2d, CP2=P3+2d → d = (pt-M)*(2/3)
        const mx = (live.x1 + live.x2) / 2;
        const my = (live.y1 + live.y2) / 2;
        const dx = (pt.x - mx) * (4 / 3);
        const dy = (pt.y - my) * (4 / 3);
        scene = updateElement(scene, live.id, {
          cp1: { x: live.x1 + dx, y: live.y1 + dy },
          cp2: { x: live.x2 + dx, y: live.y2 + dy },
        });
      }
      render();
    }
    return;
  }
  if (tools[activeToolName]?.pointermove(pt)) render();
});

window.addEventListener('mouseup', (e) => {
  if (panning) {
    panning = false;
    canvasEl.style.cursor = spaceDown ? 'grab' : (CURSOR[activeToolName] ?? 'default');
    return;
  }
  if (draggingHandle) {
    draggingHandle = null;
    hist = historyPush(hist, scene);
    updateHistoryButtons();
    scheduleAutoSave();
    render();
    return;
  }
  if (movingSelection) {
    const moved = movingSelection.moved;
    movingSelection = null;
    if (moved) {
      hist = historyPush(hist, scene);
      updateHistoryButtons();
      scheduleAutoSave();
    }
    render();
    return;
  }
  if (marquee) {
    const box = toRect(marquee.start, marquee.cur);
    marquee = null;
    if (box.width > 2 || box.height > 2) {
      selectedIds = selectInBox(scene.elements, box);
    }
    syncSelectionUI();
    render();
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
  if ((e.key === 'Delete' || e.key === 'Backspace') && activeToolName === 'select' && selectedIds.length) {
    e.preventDefault();
    scene = removeElements(scene, selectedIds);
    selectedIds = [];
    hist = historyPush(hist, scene);
    updateHistoryButtons();
    scheduleAutoSave();
    syncSelectionUI();
    render();
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
