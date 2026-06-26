import { getCanvas } from './core/api.js';

// ── Bootstrap ─────────────────────────────────────────────────
const params = new URLSearchParams(location.search);
const canvasId = params.get('id');
if (!canvasId) { location.href = '/'; throw new Error('No canvas id'); }

const canvasEl = document.getElementById('canvas');
const ctx = canvasEl.getContext('2d');
const wrap = document.getElementById('canvas-wrap');

// ── Viewport ──────────────────────────────────────────────────
const vp = { pan: { x: 0, y: 0 }, zoom: 1 };

export function screenToCanvas(sx, sy) {
  return { x: (sx - vp.pan.x) / vp.zoom, y: (sy - vp.pan.y) / vp.zoom };
}

export function canvasToScreen(cx, cy) {
  return { x: cx * vp.zoom + vp.pan.x, y: cy * vp.zoom + vp.pan.y };
}

// ── Resize ────────────────────────────────────────────────────
function resize() {
  canvasEl.width = wrap.clientWidth;
  canvasEl.height = wrap.clientHeight;
  render();
}
new ResizeObserver(resize).observe(wrap);

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
  for (let cx = x0; cx <= x1; cx += GRID) {
    for (let cy = y0; cy <= y1; cy += GRID) {
      ctx.beginPath();
      ctx.arc(cx * zoom + pan.x, cy * zoom + pan.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── Render ────────────────────────────────────────────────────
export function render() {
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  drawGrid();
  // scene elements rendered here in later issues
}

// ── Tool management ───────────────────────────────────────────
const CURSOR = {
  select: 'default',
  pan: 'grab',
  rect: 'crosshair',
  text: 'text',
  line: 'crosshair',
  arrow: 'crosshair',
  image: 'crosshair',
  eraser: 'cell',
};

let activeTool = 'select';
let prevTool = null;
let spaceDown = false;

function setTool(name) {
  activeTool = name;
  canvasEl.style.cursor = CURSOR[name] ?? 'default';
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === name);
  });
}

// ── Pan ───────────────────────────────────────────────────────
let panning = false;
let panLast = null;

canvasEl.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || activeTool !== 'pan') return;
  panning = true;
  panLast = { x: e.clientX, y: e.clientY };
  canvasEl.style.cursor = 'grabbing';
});

// Use window so panning continues if mouse briefly leaves the canvas
window.addEventListener('mousemove', (e) => {
  if (!panning) return;
  vp.pan.x += e.clientX - panLast.x;
  vp.pan.y += e.clientY - panLast.y;
  panLast = { x: e.clientX, y: e.clientY };
  render();
});

window.addEventListener('mouseup', () => {
  if (!panning) return;
  panning = false;
  canvasEl.style.cursor = CURSOR[activeTool] ?? 'default';
});

// ── Zoom ──────────────────────────────────────────────────────
// Handles both Ctrl+scroll and macOS trackpad pinch (fires as wheel + ctrlKey)
canvasEl.addEventListener('wheel', (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  const newZoom = Math.min(10, Math.max(0.1, vp.zoom * factor));
  const rect = canvasEl.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  // Keep the canvas point under the cursor fixed
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
    prevTool = activeTool;
    setTool('pan');
    return;
  }
  if (e.ctrlKey || e.metaKey) return;
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

// ── Toolbar clicks ────────────────────────────────────────────
document.getElementById('toolbar').addEventListener('click', (e) => {
  const btn = e.target.closest('.tool-btn');
  if (btn?.dataset.tool) setTool(btn.dataset.tool);
});

// ── Init ──────────────────────────────────────────────────────
async function init() {
  try {
    const data = await getCanvas(canvasId);
    document.getElementById('canvas-name').textContent = data.name;
    document.title = `${data.name} — Local Draw`;
  } catch {
    location.href = '/';
  }
}

init();
