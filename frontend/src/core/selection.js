import { nextOrder } from './scene.js';

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

// Raises the selected elements above every unselected element. Their order
// relative to one another is preserved.
export function bringToFrontMany(scene, ids) {
  const set = new Set(ids);
  const base = nextOrder(scene); // one above the current top
  const lift = new Map();
  scene.elements.filter(el => set.has(el.id)).sort(byOrder)
    .forEach((el, i) => lift.set(el.id, base + i));
  return {
    elements: scene.elements.map(el => lift.has(el.id) ? { ...el, order: lift.get(el.id) } : el),
  };
}

// Lowers the selected elements below every unselected element, preserving their
// relative order.
export function sendToBackMany(scene, ids) {
  const set = new Set(ids);
  if (scene.elements.length === 0) return scene;
  const min = Math.min(...scene.elements.map(el => el.order ?? 0));
  const selected = scene.elements.filter(el => set.has(el.id)).sort(byOrder);
  const drop = new Map();
  selected.forEach((el, i) => drop.set(el.id, min - selected.length + i));
  return {
    elements: scene.elements.map(el => drop.has(el.id) ? { ...el, order: drop.get(el.id) } : el),
  };
}

// Shifts the selected elements one step toward the top, as a group: each
// selected element swaps z-position with the unselected element directly above
// it. Working top-down keeps selected elements from leapfrogging each other.
export function bringForwardMany(scene, ids) {
  const set = new Set(ids);
  const sorted = scene.elements.map(el => ({ ...el })).sort(byOrder);
  for (let i = sorted.length - 2; i >= 0; i--) {
    if (set.has(sorted[i].id) && !set.has(sorted[i + 1].id)) {
      [sorted[i].order, sorted[i + 1].order] = [sorted[i + 1].order, sorted[i].order];
      [sorted[i], sorted[i + 1]] = [sorted[i + 1], sorted[i]];
    }
  }
  return rebuild(scene, sorted);
}

// Mirror of bringForwardMany, working bottom-up toward the back.
export function sendBackwardMany(scene, ids) {
  const set = new Set(ids);
  const sorted = scene.elements.map(el => ({ ...el })).sort(byOrder);
  for (let i = 1; i < sorted.length; i++) {
    if (set.has(sorted[i].id) && !set.has(sorted[i - 1].id)) {
      [sorted[i].order, sorted[i - 1].order] = [sorted[i - 1].order, sorted[i].order];
      [sorted[i], sorted[i - 1]] = [sorted[i - 1], sorted[i]];
    }
  }
  return rebuild(scene, sorted);
}

function rebuild(scene, sorted) {
  const orders = new Map(sorted.map(el => [el.id, el.order]));
  return {
    elements: scene.elements.map(el => ({ ...el, order: orders.get(el.id) })),
  };
}

export function elementBounds(el) {
  if (el.type === 'line' || el.type === 'arrow') {
    const xs = [el.x1, el.x2];
    const ys = [el.y1, el.y2];
    if (el.cp1 && el.cp2) {
      xs.push(el.cp1.x, el.cp2.x);
      ys.push(el.cp1.y, el.cp2.y);
    }
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
  }
  if (el.type === 'text') {
    const lines = (el.content ?? '').split('\n');
    const cols = Math.max(1, ...lines.map(l => l.length));
    return {
      x: el.x,
      y: el.y,
      width: cols * el.fontSize * 0.6,
      height: lines.length * el.fontSize * 1.4,
    };
  }
  return { x: el.x, y: el.y, width: el.width, height: el.height };
}

// Translates every element in `ids` by (dx, dy), leaving the rest untouched.
export function translateElements(scene, ids, dx, dy) {
  const set = new Set(ids);
  return {
    elements: scene.elements.map(el => set.has(el.id) ? translateElement(el, dx, dy) : el),
  };
}

// Removes every element whose id is in `ids`.
export function removeElements(scene, ids) {
  const set = new Set(ids);
  return { elements: scene.elements.filter(el => !set.has(el.id)) };
}

// Sets `key` to `value` on every selected element that already owns that key —
// e.g. a stroke colour change skips elements that have no stroke colour.
export function applySharedProp(scene, ids, key, value) {
  const set = new Set(ids);
  return {
    elements: scene.elements.map(el =>
      set.has(el.id) && Object.prototype.hasOwnProperty.call(el, key)
        ? { ...el, [key]: value }
        : el
    ),
  };
}

// Returns a copy of the element shifted by (dx, dy), respecting its geometry:
// lines/arrows move every point, everything else moves its x/y origin.
export function translateElement(el, dx, dy) {
  if (el.type === 'line' || el.type === 'arrow') {
    return {
      ...el,
      x1: el.x1 + dx, y1: el.y1 + dy,
      x2: el.x2 + dx, y2: el.y2 + dy,
      cp1: el.cp1 ? { x: el.cp1.x + dx, y: el.cp1.y + dy } : el.cp1,
      cp2: el.cp2 ? { x: el.cp2.x + dx, y: el.cp2.y + dy } : el.cp2,
    };
  }
  return { ...el, x: el.x + dx, y: el.y + dy };
}

// Axis-aligned overlap test between two { x, y, width, height } boxes.
export function boxIntersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x
    && a.y < b.y + b.height && a.y + a.height > b.y;
}

// Ids of every element whose bounds overlap the selection box (full or partial).
export function selectInBox(elements, box) {
  return elements
    .filter(el => boxIntersects(box, elementBounds(el)))
    .map(el => el.id);
}
