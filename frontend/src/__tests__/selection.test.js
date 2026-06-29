import { describe, it, expect } from 'vitest';
import {
  elementBounds, selectInBox, translateElement,
  translateElements, removeElements, applySharedProp,
  bringToFrontMany, sendToBackMany, bringForwardMany, sendBackwardMany,
} from '../core/selection.js';
import { createScene } from '../core/scene.js';

const stackOrder = (scene) =>
  [...scene.elements].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(e => e.id);

describe('elementBounds', () => {
  it('returns the axis-aligned box of a rect', () => {
    const el = { type: 'rect', x: 10, y: 20, width: 30, height: 40 };
    expect(elementBounds(el)).toEqual({ x: 10, y: 20, width: 30, height: 40 });
  });

  it('returns the axis-aligned box of an image', () => {
    const el = { type: 'image', x: 5, y: 5, width: 100, height: 50 };
    expect(elementBounds(el)).toEqual({ x: 5, y: 5, width: 100, height: 50 });
  });

  it('spans a straight line from its endpoints regardless of direction', () => {
    const el = { type: 'line', x1: 40, y1: 50, x2: 10, y2: 20, cp1: null, cp2: null };
    expect(elementBounds(el)).toEqual({ x: 10, y: 20, width: 30, height: 30 });
  });

  it('includes bezier control points in a curved line box', () => {
    const el = {
      type: 'arrow', x1: 0, y1: 0, x2: 10, y2: 0,
      cp1: { x: 5, y: 20 }, cp2: { x: 5, y: -10 },
    };
    expect(elementBounds(el)).toEqual({ x: 0, y: -10, width: 10, height: 30 });
  });

  it('estimates a text box from its content and font size', () => {
    const el = { type: 'text', x: 0, y: 0, content: 'ab\nc', fontSize: 10 };
    // 2 lines tall, widest line is 2 chars
    const b = elementBounds(el);
    expect(b.x).toBe(0);
    expect(b.y).toBe(0);
    expect(b.height).toBeCloseTo(2 * 10 * 1.4);
    expect(b.width).toBeGreaterThan(0);
  });
});

describe('selectInBox', () => {
  const inside = { id: 'in', type: 'rect', x: 20, y: 20, width: 10, height: 10 };
  const partial = { id: 'edge', type: 'rect', x: 45, y: 45, width: 20, height: 20 };
  const outside = { id: 'out', type: 'rect', x: 200, y: 200, width: 10, height: 10 };
  const box = { x: 0, y: 0, width: 50, height: 50 };

  it('selects elements fully inside the box', () => {
    expect(selectInBox([inside], box)).toEqual(['in']);
  });

  it('selects elements that partially intersect the box', () => {
    expect(selectInBox([partial], box)).toEqual(['edge']);
  });

  it('excludes elements entirely outside the box', () => {
    expect(selectInBox([outside], box)).toEqual([]);
  });

  it('returns the ids of every intersecting element', () => {
    expect(selectInBox([inside, partial, outside], box).sort()).toEqual(['edge', 'in']);
  });
});

describe('translateElement', () => {
  it('shifts an x/y element by the delta', () => {
    const el = { type: 'rect', x: 10, y: 20, width: 5, height: 5 };
    expect(translateElement(el, 3, -4)).toMatchObject({ x: 13, y: 16, width: 5, height: 5 });
  });

  it('shifts every point of a curved line including control points', () => {
    const el = {
      type: 'line', x1: 0, y1: 0, x2: 10, y2: 10,
      cp1: { x: 2, y: 2 }, cp2: { x: 8, y: 8 },
    };
    expect(translateElement(el, 5, 5)).toMatchObject({
      x1: 5, y1: 5, x2: 15, y2: 15,
      cp1: { x: 7, y: 7 }, cp2: { x: 13, y: 13 },
    });
  });

  it('leaves null control points untouched', () => {
    const el = { type: 'line', x1: 0, y1: 0, x2: 10, y2: 10, cp1: null, cp2: null };
    expect(translateElement(el, 1, 1)).toMatchObject({ x1: 1, y1: 1, x2: 11, y2: 11, cp1: null, cp2: null });
  });
});

describe('translateElements', () => {
  it('shifts only the selected elements, leaving others in place', () => {
    const s = createScene([
      { id: 'a', type: 'rect', x: 0, y: 0, width: 1, height: 1 },
      { id: 'b', type: 'rect', x: 10, y: 10, width: 1, height: 1 },
    ]);
    const moved = translateElements(s, ['a'], 5, 5);
    expect(moved.elements.find(e => e.id === 'a')).toMatchObject({ x: 5, y: 5 });
    expect(moved.elements.find(e => e.id === 'b')).toMatchObject({ x: 10, y: 10 });
  });
});

describe('removeElements', () => {
  it('removes all elements whose ids are in the set', () => {
    const s = createScene([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect(removeElements(s, ['a', 'c']).elements.map(e => e.id)).toEqual(['b']);
  });
});

describe('applySharedProp', () => {
  it('updates only selected elements that already have the property', () => {
    const s = createScene([
      { id: 'a', type: 'rect', strokeColor: '#000' },
      { id: 'b', type: 'image' }, // no strokeColor
      { id: 'c', type: 'line', strokeColor: '#000' },
    ]);
    const out = applySharedProp(s, ['a', 'b', 'c'], 'strokeColor', '#f00');
    expect(out.elements.find(e => e.id === 'a').strokeColor).toBe('#f00');
    expect(out.elements.find(e => e.id === 'c').strokeColor).toBe('#f00');
    expect(out.elements.find(e => e.id === 'b')).not.toHaveProperty('strokeColor');
  });

  it('leaves unselected elements untouched even if they have the property', () => {
    const s = createScene([
      { id: 'a', type: 'rect', strokeColor: '#000' },
      { id: 'b', type: 'rect', strokeColor: '#000' },
    ]);
    const out = applySharedProp(s, ['a'], 'strokeColor', '#f00');
    expect(out.elements.find(e => e.id === 'b').strokeColor).toBe('#000');
  });
});

const ordered = () => createScene([
  { id: 'a', order: 0 },
  { id: 'b', order: 1 },
  { id: 'c', order: 2 },
  { id: 'd', order: 3 },
]);

describe('bringToFrontMany', () => {
  it('moves the group above all others, preserving their relative order', () => {
    expect(stackOrder(bringToFrontMany(ordered(), ['a', 'c']))).toEqual(['b', 'd', 'a', 'c']);
  });
});

describe('sendToBackMany', () => {
  it('moves the group below all others, preserving their relative order', () => {
    expect(stackOrder(sendToBackMany(ordered(), ['b', 'd']))).toEqual(['b', 'd', 'a', 'c']);
  });
});

describe('bringForwardMany', () => {
  it('moves the group up one step past the nearest unselected neighbour', () => {
    // [a b c d], raise {a,b}: they hop above c → [c a b d]
    expect(stackOrder(bringForwardMany(ordered(), ['a', 'b']))).toEqual(['c', 'a', 'b', 'd']);
  });

  it('is a no-op when the group is already at the top', () => {
    expect(stackOrder(bringForwardMany(ordered(), ['c', 'd']))).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('sendBackwardMany', () => {
  it('moves the group down one step past the nearest unselected neighbour', () => {
    // [a b c d], lower {c,d}: they hop below b → [a c d b]
    expect(stackOrder(sendBackwardMany(ordered(), ['c', 'd']))).toEqual(['a', 'c', 'd', 'b']);
  });

  it('is a no-op when the group is already at the bottom', () => {
    expect(stackOrder(sendBackwardMany(ordered(), ['a', 'b']))).toEqual(['a', 'b', 'c', 'd']);
  });
});
