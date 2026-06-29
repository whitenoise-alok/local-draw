import { translateElement } from './selection.js';

// Deep-clones the given elements into a clipboard snapshot, decoupled from the
// live scene so later edits to the originals can't leak into a future paste.
export function copyElements(elements) {
  return elements.map(el => structuredClone(el));
}

// Produces a fresh set of elements from a clipboard snapshot: each is deep-cloned,
// given a new id, and offset by (dx, dy) — geometry-aware, so lines move every
// point. The clones share nothing with the snapshot, so editing one is safe.
export function pasteElements(snapshot, { newId, offset = { x: 10, y: 10 } }) {
  return snapshot.map((el) => {
    const moved = translateElement(structuredClone(el), offset.x, offset.y);
    return { ...moved, id: newId() };
  });
}
