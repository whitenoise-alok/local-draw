import { describe, it, expect } from 'vitest';
import {
  createHistory, historyPush, historyUndo, historyRedo, canUndo, canRedo,
} from '../core/history.js';

const scene = (n) => ({ elements: [{ id: String(n) }] });

describe('createHistory', () => {
  it('starts with empty past and future', () => {
    const h = createHistory(scene(0));
    expect(h.past).toEqual([]);
    expect(h.future).toEqual([]);
    expect(h.present).toEqual(scene(0));
  });
});

describe('historyPush', () => {
  it('moves present to past and sets new present', () => {
    const h = historyPush(createHistory(scene(0)), scene(1));
    expect(h.past).toEqual([scene(0)]);
    expect(h.present).toEqual(scene(1));
  });

  it('clears future on push', () => {
    let h = createHistory(scene(0));
    h = historyPush(h, scene(1));
    h = historyUndo(h);
    h = historyPush(h, scene(2));
    expect(h.future).toEqual([]);
  });

  it('caps past at 50 entries', () => {
    let h = createHistory(scene(0));
    for (let i = 1; i <= 55; i++) h = historyPush(h, scene(i));
    expect(h.past.length).toBe(50);
  });
});

describe('historyUndo', () => {
  it('moves present to future and restores previous present', () => {
    let h = createHistory(scene(0));
    h = historyPush(h, scene(1));
    h = historyUndo(h);
    expect(h.present).toEqual(scene(0));
    expect(h.future).toEqual([scene(1)]);
  });

  it('is a no-op when past is empty', () => {
    const h = createHistory(scene(0));
    expect(historyUndo(h)).toBe(h);
  });
});

describe('historyRedo', () => {
  it('moves present to past and restores next scene', () => {
    let h = createHistory(scene(0));
    h = historyPush(h, scene(1));
    h = historyUndo(h);
    h = historyRedo(h);
    expect(h.present).toEqual(scene(1));
    expect(h.past[h.past.length - 1]).toEqual(scene(0));
  });

  it('is a no-op when future is empty', () => {
    const h = createHistory(scene(0));
    expect(historyRedo(h)).toBe(h);
  });
});

describe('canUndo / canRedo', () => {
  it('canUndo is false at start', () => {
    expect(canUndo(createHistory(scene(0)))).toBe(false);
  });

  it('canUndo is true after push', () => {
    const h = historyPush(createHistory(scene(0)), scene(1));
    expect(canUndo(h)).toBe(true);
  });

  it('canRedo is false at start', () => {
    expect(canRedo(createHistory(scene(0)))).toBe(false);
  });

  it('canRedo is true after undo', () => {
    let h = historyPush(createHistory(scene(0)), scene(1));
    h = historyUndo(h);
    expect(canRedo(h)).toBe(true);
  });
});
