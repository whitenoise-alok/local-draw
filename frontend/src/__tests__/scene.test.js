import { describe, it, expect } from 'vitest';
import {
  createScene, addElement, removeElement, updateElement,
  nextOrder, bringToFront, sendToBack, bringForward, sendBackward,
} from '../core/scene.js';

const el = (id, order = 0) => ({ id, type: 'rect', order });

describe('createScene', () => {
  it('starts with empty elements when called with no args', () => {
    expect(createScene().elements).toEqual([]);
  });

  it('copies provided elements', () => {
    const orig = [el('a')];
    const scene = createScene(orig);
    expect(scene.elements).toEqual(orig);
    expect(scene.elements).not.toBe(orig);
  });
});

describe('addElement', () => {
  it('appends element to scene', () => {
    const s = addElement(createScene(), el('a'));
    expect(s.elements).toHaveLength(1);
    expect(s.elements[0].id).toBe('a');
  });

  it('does not mutate original scene', () => {
    const orig = createScene();
    addElement(orig, el('a'));
    expect(orig.elements).toHaveLength(0);
  });
});

describe('removeElement', () => {
  it('removes element by id', () => {
    const s = createScene([el('a'), el('b')]);
    expect(removeElement(s, 'a').elements.map(e => e.id)).toEqual(['b']);
  });

  it('is a no-op for unknown id', () => {
    const s = createScene([el('a')]);
    expect(removeElement(s, 'z').elements).toHaveLength(1);
  });
});

describe('updateElement', () => {
  it('merges props onto matching element', () => {
    const s = createScene([el('a', 0)]);
    const updated = updateElement(s, 'a', { order: 5, type: 'line' });
    expect(updated.elements[0]).toMatchObject({ id: 'a', order: 5, type: 'line' });
  });

  it('leaves other elements unchanged', () => {
    const s = createScene([el('a'), el('b')]);
    const updated = updateElement(s, 'a', { order: 9 });
    expect(updated.elements[1]).toEqual(el('b'));
  });
});

describe('nextOrder', () => {
  it('returns 0 for empty scene', () => {
    expect(nextOrder(createScene())).toBe(0);
  });

  it('returns max order + 1', () => {
    const s = createScene([el('a', 3), el('b', 7), el('c', 1)]);
    expect(nextOrder(s)).toBe(8);
  });
});

describe('bringToFront', () => {
  it('gives element an order higher than all others', () => {
    const s = createScene([el('a', 0), el('b', 1), el('c', 2)]);
    const updated = bringToFront(s, 'a');
    const aOrder = updated.elements.find(e => e.id === 'a').order;
    const others = updated.elements.filter(e => e.id !== 'a').map(e => e.order);
    expect(others.every(o => aOrder > o)).toBe(true);
  });
});

describe('sendToBack', () => {
  it('gives element an order lower than all others', () => {
    const s = createScene([el('a', 0), el('b', 1), el('c', 2)]);
    const updated = sendToBack(s, 'c');
    const cOrder = updated.elements.find(e => e.id === 'c').order;
    const others = updated.elements.filter(e => e.id !== 'c').map(e => e.order);
    expect(others.every(o => cOrder < o)).toBe(true);
  });
});

describe('bringForward', () => {
  it('swaps orders with the next element in stack', () => {
    const s = createScene([el('a', 0), el('b', 1)]);
    const updated = bringForward(s, 'a');
    expect(updated.elements.find(e => e.id === 'a').order).toBe(1);
    expect(updated.elements.find(e => e.id === 'b').order).toBe(0);
  });

  it('is a no-op when element is already on top', () => {
    const s = createScene([el('a', 0), el('b', 1)]);
    expect(bringForward(s, 'b')).toBe(s);
  });
});

describe('sendBackward', () => {
  it('swaps orders with the previous element in stack', () => {
    const s = createScene([el('a', 0), el('b', 1)]);
    const updated = sendBackward(s, 'b');
    expect(updated.elements.find(e => e.id === 'b').order).toBe(0);
    expect(updated.elements.find(e => e.id === 'a').order).toBe(1);
  });

  it('is a no-op when element is already at bottom', () => {
    const s = createScene([el('a', 0), el('b', 1)]);
    expect(sendBackward(s, 'a')).toBe(s);
  });
});
