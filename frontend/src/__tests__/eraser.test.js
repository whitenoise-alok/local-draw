import { describe, it, expect, vi } from 'vitest';
import { hitTestRect, hitTestLine, hitTestElement, topElementAtPoint, createEraserTool } from '../tools/eraser.js';
import { createScene, addElement } from '../core/scene.js';

describe('hitTestRect', () => {
  it('returns true when point is inside rect', () => {
    const el = { x: 10, y: 10, width: 100, height: 80 };
    expect(hitTestRect({ x: 50, y: 50 }, el)).toBe(true);
  });

  it('returns false when point is outside rect', () => {
    const el = { x: 10, y: 10, width: 100, height: 80 };
    expect(hitTestRect({ x: 5, y: 5 }, el)).toBe(false);
  });

  it('returns true when point is on the boundary', () => {
    const el = { x: 10, y: 10, width: 100, height: 80 };
    expect(hitTestRect({ x: 10, y: 10 }, el)).toBe(true);
    expect(hitTestRect({ x: 110, y: 90 }, el)).toBe(true);
  });
});

describe('hitTestLine', () => {
  it('returns true when point is near a straight line', () => {
    const el = { x1: 0, y1: 0, x2: 100, y2: 0, cp1: null, cp2: null };
    expect(hitTestLine({ x: 50, y: 5 }, el)).toBe(true);
  });

  it('returns false when point is far from a straight line', () => {
    const el = { x1: 0, y1: 0, x2: 100, y2: 0, cp1: null, cp2: null };
    expect(hitTestLine({ x: 50, y: 50 }, el)).toBe(false);
  });

  it('returns true when point is near a bezier curve', () => {
    // Cubic bezier: start (0,0), end (100,0), control points bulging upward
    // Midpoint at t=0.5 is approximately (50, -45)
    const el = { x1: 0, y1: 0, x2: 100, y2: 0, cp1: { x: 33, y: -60 }, cp2: { x: 67, y: -60 } };
    expect(hitTestLine({ x: 50, y: -40 }, el)).toBe(true);
  });
});

describe('hitTestElement', () => {
  it('delegates to hitTestRect for rect elements', () => {
    const el = { type: 'rect', x: 0, y: 0, width: 100, height: 100 };
    expect(hitTestElement({ x: 50, y: 50 }, el)).toBe(true);
    expect(hitTestElement({ x: 200, y: 200 }, el)).toBe(false);
  });

  it('delegates to hitTestLine for line elements', () => {
    const el = { type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, cp1: null, cp2: null };
    expect(hitTestElement({ x: 50, y: 3 }, el)).toBe(true);
    expect(hitTestElement({ x: 50, y: 50 }, el)).toBe(false);
  });

  it('delegates to hitTestLine for arrow elements', () => {
    const el = { type: 'arrow', x1: 0, y1: 0, x2: 100, y2: 0, cp1: null, cp2: null };
    expect(hitTestElement({ x: 50, y: 3 }, el)).toBe(true);
  });

  it('delegates to a bounds check for image elements', () => {
    const el = { type: 'image', x: 0, y: 0, width: 100, height: 100 };
    expect(hitTestElement({ x: 50, y: 50 }, el)).toBe(true);
    expect(hitTestElement({ x: 200, y: 200 }, el)).toBe(false);
  });

  it('delegates to hitTestText for text elements', () => {
    // hitTestText checks x >= el.x, y >= el.y, x <= el.x+400, y <= el.y + fontSize*1.4*lines
    const el = { type: 'text', x: 10, y: 10, fontSize: 18, content: 'hi' };
    expect(hitTestElement({ x: 20, y: 20 }, el)).toBe(true);
    expect(hitTestElement({ x: 5, y: 5 }, el)).toBe(false);
  });
});

describe('topElementAtPoint', () => {
  const rect = (id, order, x = 0, y = 0) => ({ id, type: 'rect', x, y, width: 100, height: 100, order });

  it('returns null for an empty scene', () => {
    expect(topElementAtPoint(createScene(), { x: 50, y: 50 })).toBeNull();
  });

  it('returns null when no element is at the point', () => {
    const scene = createScene([rect('a', 0, 200, 200)]);
    expect(topElementAtPoint(scene, { x: 50, y: 50 })).toBeNull();
  });

  it('returns the element when a single element is at the point', () => {
    const scene = createScene([rect('a', 0)]);
    expect(topElementAtPoint(scene, { x: 50, y: 50 })?.id).toBe('a');
  });

  it('returns the highest-order element when multiple elements overlap at the point', () => {
    const scene = createScene([rect('low', 0), rect('high', 5)]);
    expect(topElementAtPoint(scene, { x: 50, y: 50 })?.id).toBe('high');
  });
});

describe('createEraserTool', () => {
  const makeRect = (id, order = 0, x = 0, y = 0) => ({ id, type: 'rect', x, y, width: 100, height: 100, order });

  function makeEraser(elements = []) {
    let scene = createScene(elements);
    const onDeleteElement = vi.fn((id) => {
      scene = { elements: scene.elements.filter(el => el.id !== id) };
    });
    const onCommit = vi.fn();
    const eraser = createEraserTool({ getScene: () => scene, onDeleteElement, onCommit });
    return { eraser, onDeleteElement, onCommit };
  }

  it('does not call onDeleteElement when pointerdown hits no element', () => {
    const { eraser, onDeleteElement } = makeEraser([makeRect('a')]);
    eraser.pointerdown({ x: 200, y: 200 });
    expect(onDeleteElement).not.toHaveBeenCalled();
  });

  it('calls onDeleteElement with the element id when pointerdown hits an element', () => {
    const { eraser, onDeleteElement } = makeEraser([makeRect('a')]);
    eraser.pointerdown({ x: 50, y: 50 });
    expect(onDeleteElement).toHaveBeenCalledWith('a');
  });

  it('does not call onDeleteElement on pointermove when not dragging', () => {
    const { eraser, onDeleteElement } = makeEraser([makeRect('a')]);
    eraser.pointermove({ x: 50, y: 50 });
    expect(onDeleteElement).not.toHaveBeenCalled();
  });

  it('calls onDeleteElement during pointermove while dragging', () => {
    const { eraser, onDeleteElement } = makeEraser([makeRect('a'), makeRect('b', 1, 200, 200)]);
    eraser.pointerdown({ x: 500, y: 500 }); // miss — starts drag
    eraser.pointermove({ x: 50, y: 50 });   // hits 'a'
    expect(onDeleteElement).toHaveBeenCalledWith('a');
  });

  it('does not erase the same element twice during one drag', () => {
    const { eraser, onDeleteElement } = makeEraser([makeRect('a')]);
    eraser.pointerdown({ x: 50, y: 50 }); // erases 'a'
    eraser.pointermove({ x: 60, y: 60 }); // would hit 'a' again, but it's already erased and removed from scene
    expect(onDeleteElement).toHaveBeenCalledTimes(1);
  });

  it('calls onCommit on pointerup when elements were erased', () => {
    const { eraser, onCommit } = makeEraser([makeRect('a')]);
    eraser.pointerdown({ x: 50, y: 50 });
    eraser.pointerup();
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('does not call onCommit on pointerup when nothing was erased', () => {
    const { eraser, onCommit } = makeEraser([makeRect('a')]);
    eraser.pointerdown({ x: 200, y: 200 }); // miss
    eraser.pointerup();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('ends the drag and does not commit on cancel when nothing was erased', () => {
    const { eraser, onCommit, onDeleteElement } = makeEraser([makeRect('a')]);
    eraser.pointerdown({ x: 500, y: 500 }); // miss, starts drag
    eraser.cancel();
    eraser.pointermove({ x: 50, y: 50 }); // drag is over, should not erase
    expect(onDeleteElement).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('calls onCommit on cancel when elements were already erased mid-drag', () => {
    const { eraser, onCommit, onDeleteElement } = makeEraser([makeRect('a')]);
    eraser.pointerdown({ x: 50, y: 50 }); // erases 'a'
    eraser.cancel();                       // tool switched mid-drag
    expect(onDeleteElement).toHaveBeenCalledWith('a');
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});
