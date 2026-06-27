export function createScene(elements = []) {
  return { elements: [...elements] };
}

export function addElement(scene, element) {
  return { elements: [...scene.elements, element] };
}

export function removeElement(scene, id) {
  return { elements: scene.elements.filter(el => el.id !== id) };
}

export function updateElement(scene, id, props) {
  return {
    elements: scene.elements.map(el => el.id === id ? { ...el, ...props } : el),
  };
}

export function nextOrder(scene) {
  if (scene.elements.length === 0) return 0;
  return Math.max(...scene.elements.map(e => e.order ?? 0)) + 1;
}

export function bringToFront(scene, id) {
  return updateElement(scene, id, { order: nextOrder(scene) });
}

export function sendToBack(scene, id) {
  if (scene.elements.length === 0) return scene;
  const min = Math.min(...scene.elements.map(e => e.order ?? 0));
  return updateElement(scene, id, { order: min - 1 });
}

export function bringForward(scene, id) {
  const sorted = [...scene.elements].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const idx = sorted.findIndex(e => e.id === id);
  if (idx === -1 || idx === sorted.length - 1) return scene;
  const aOrder = sorted[idx].order ?? 0;
  const bOrder = sorted[idx + 1].order ?? 0;
  const nextId = sorted[idx + 1].id;
  return {
    elements: scene.elements.map(el => {
      if (el.id === id) return { ...el, order: bOrder };
      if (el.id === nextId) return { ...el, order: aOrder };
      return el;
    }),
  };
}

export function sendBackward(scene, id) {
  const sorted = [...scene.elements].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const idx = sorted.findIndex(e => e.id === id);
  if (idx === -1 || idx === 0) return scene;
  const aOrder = sorted[idx - 1].order ?? 0;
  const bOrder = sorted[idx].order ?? 0;
  const prevId = sorted[idx - 1].id;
  return {
    elements: scene.elements.map(el => {
      if (el.id === id) return { ...el, order: aOrder };
      if (el.id === prevId) return { ...el, order: bOrder };
      return el;
    }),
  };
}
