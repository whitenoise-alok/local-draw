import { describe, it, expect, vi } from 'vitest';
import { toRect, applyLineDash } from '../tools/rect.js';

describe('toRect', () => {
  it('produces correct rect when dragging top-left to bottom-right', () => {
    expect(toRect({ x: 10, y: 20 }, { x: 50, y: 80 })).toEqual({ x: 10, y: 20, width: 40, height: 60 });
  });

  it('normalizes when dragging bottom-right to top-left', () => {
    expect(toRect({ x: 50, y: 80 }, { x: 10, y: 20 })).toEqual({ x: 10, y: 20, width: 40, height: 60 });
  });

  it('handles vertical drag (zero width)', () => {
    expect(toRect({ x: 5, y: 0 }, { x: 5, y: 10 })).toEqual({ x: 5, y: 0, width: 0, height: 10 });
  });
});

describe('applyLineDash', () => {
  it('sets empty dash for solid stroke', () => {
    const ctx = { setLineDash: vi.fn() };
    applyLineDash(ctx, 'solid', 2);
    expect(ctx.setLineDash).toHaveBeenCalledWith([]);
  });

  it('sets dashed pattern scaled to stroke width', () => {
    const ctx = { setLineDash: vi.fn() };
    applyLineDash(ctx, 'dashed', 2);
    expect(ctx.setLineDash).toHaveBeenCalledWith([8, 4]);
  });

  it('sets dotted pattern scaled to stroke width', () => {
    const ctx = { setLineDash: vi.fn() };
    applyLineDash(ctx, 'dotted', 2);
    expect(ctx.setLineDash).toHaveBeenCalledWith([2, 4]);
  });
});
