import { hitTestText } from './text.js';
import { hitTestImage } from './image.js';

export function hitTestRect(pt, el) {
  return pt.x >= el.x && pt.x <= el.x + el.width
    && pt.y >= el.y && pt.y <= el.y + el.height;
}

export function hitTestLine(pt, el, thresh = 8) {
  const steps = 20;
  if (!el.cp1 || !el.cp2) {
    const dx = el.x2 - el.x1, dy = el.y2 - el.y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(pt.x - el.x1, pt.y - el.y1) <= thresh;
    const t = Math.max(0, Math.min(1, ((pt.x - el.x1) * dx + (pt.y - el.y1) * dy) / len2));
    return Math.hypot(pt.x - (el.x1 + t * dx), pt.y - (el.y1 + t * dy)) <= thresh;
  }
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, mt = 1 - t;
    const bx = mt*mt*mt*el.x1 + 3*mt*mt*t*el.cp1.x + 3*mt*t*t*el.cp2.x + t*t*t*el.x2;
    const by = mt*mt*mt*el.y1 + 3*mt*mt*t*el.cp1.y + 3*mt*t*t*el.cp2.y + t*t*t*el.y2;
    if (Math.hypot(pt.x - bx, pt.y - by) <= thresh) return true;
  }
  return false;
}

export function topElementAtPoint(scene, pt) {
  const hits = scene.elements.filter(el => hitTestElement(pt, el));
  if (hits.length === 0) return null;
  return hits.reduce((top, el) => (el.order ?? 0) > (top.order ?? 0) ? el : top);
}

export function hitTestElement(pt, el) {
  if (el.type === 'rect') return hitTestRect(pt, el);
  if (el.type === 'line' || el.type === 'arrow') return hitTestLine(pt, el);
  if (el.type === 'text') return hitTestText(pt, el);
  if (el.type === 'image') return hitTestImage(pt, el);
  return false;
}

export function createEraserTool({ getScene, onDeleteElement, onCommit }) {
  let dragging = false;
  let erasedAny = false;

  function tryErase(pt) {
    const el = topElementAtPoint(getScene(), pt);
    if (el) {
      onDeleteElement(el.id);
      erasedAny = true;
    }
  }

  function pointerdown(pt) {
    dragging = true;
    erasedAny = false;
    tryErase(pt);
  }

  function pointermove(pt) {
    if (!dragging) return;
    tryErase(pt);
  }

  function pointerup() {
    dragging = false;
    if (erasedAny) onCommit();
    erasedAny = false;
  }

  function cancel() {
    dragging = false;
    if (erasedAny) onCommit();
    erasedAny = false;
  }

  return { pointerdown, pointermove, pointerup, cancel };
}
