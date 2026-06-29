import { describe, it, expect } from 'vitest';
import { copyElements, pasteElements } from '../core/clipboard.js';

describe('copyElements', () => {
  it('snapshots a deep clone, decoupled from later edits to the originals', () => {
    const original = { id: 'a', type: 'rect', x: 0, y: 0, width: 5, height: 5 };
    const snapshot = copyElements([original]);
    original.x = 999;
    expect(snapshot[0].x).toBe(0);
  });
});

describe('pasteElements', () => {
  const ids = () => { let n = 0; return () => `new-${n++}`; };

  it('gives each pasted element a new id and offsets it by ~10px', () => {
    const snapshot = [{ id: 'a', type: 'rect', x: 0, y: 0, width: 5, height: 5 }];
    const [pasted] = pasteElements(snapshot, { newId: ids() });
    expect(pasted.id).toBe('new-0');
    expect(pasted.x).toBe(10);
    expect(pasted.y).toBe(10);
  });

  it('gives every element in the group a distinct id', () => {
    const snapshot = [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 0, y: 0 }];
    const pasted = pasteElements(snapshot, { newId: ids() });
    expect(pasted.map(e => e.id)).toEqual(['new-0', 'new-1']);
  });

  it('offsets a line at every point, leaving the original untouched', () => {
    const snapshot = [{
      id: 'a', type: 'line', x1: 0, y1: 0, x2: 10, y2: 10,
      cp1: { x: 2, y: 2 }, cp2: { x: 8, y: 8 },
    }];
    const [pasted] = pasteElements(snapshot, { newId: ids() });
    expect(pasted).toMatchObject({
      x1: 10, y1: 10, x2: 20, y2: 20,
      cp1: { x: 12, y: 12 }, cp2: { x: 18, y: 18 },
    });
    // Mutating the paste must not reach back into the snapshot.
    pasted.cp1.x = 999;
    expect(snapshot[0].cp1.x).toBe(2);
  });
});
