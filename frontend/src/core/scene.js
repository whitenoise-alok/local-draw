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
