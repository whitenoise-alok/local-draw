import { describe, it, expect, vi } from 'vitest';
import { createImageElement, hitTestImage, imageHandles, resizeImage, drawImage } from '../tools/image.js';

describe('createImageElement', () => {
  it('centers the element at the given point and keeps natural size when small', () => {
    const el = createImageElement('a.png', 100, 80, { x: 200, y: 200 });
    expect(el.type).toBe('image');
    expect(el.filename).toBe('a.png');
    expect(el.width).toBe(100);
    expect(el.height).toBe(80);
    expect(el.x).toBe(150); // 200 - 100/2
    expect(el.y).toBe(160); // 200 - 80/2
    expect(el.opacity).toBe(1);
    expect(typeof el.id).toBe('string');
  });

  it('scales a large image down to maxSize preserving aspect ratio', () => {
    const el = createImageElement('big.png', 2000, 1000, { x: 0, y: 0 }, 400);
    expect(el.width).toBe(400);
    expect(el.height).toBe(200);
  });
});

describe('hitTestImage', () => {
  const el = { x: 10, y: 20, width: 100, height: 50 };

  it('returns true for a point inside the bounds', () => {
    expect(hitTestImage({ x: 50, y: 40 }, el)).toBe(true);
  });

  it('returns false for a point outside the bounds', () => {
    expect(hitTestImage({ x: 5, y: 40 }, el)).toBe(false);
    expect(hitTestImage({ x: 50, y: 80 }, el)).toBe(false);
  });
});

describe('imageHandles', () => {
  it('returns the four corner positions', () => {
    const el = { x: 10, y: 20, width: 100, height: 50 };
    expect(imageHandles(el)).toEqual({
      nw: { x: 10, y: 20 },
      ne: { x: 110, y: 20 },
      sw: { x: 10, y: 70 },
      se: { x: 110, y: 70 },
    });
  });
});

describe('resizeImage', () => {
  const el = { x: 0, y: 0, width: 100, height: 50 };

  it('dragging the SE corner keeps the NW corner anchored and preserves aspect ratio', () => {
    const r = resizeImage(el, 'se', { x: 200, y: 60 });
    expect(r).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });

  it('dragging the NW corner keeps the SE corner anchored and preserves aspect ratio', () => {
    const r = resizeImage(el, 'nw', { x: -100, y: 30 });
    expect(r).toEqual({ x: -100, y: -50, width: 200, height: 100 });
  });

  it('clamps to a minimum size instead of collapsing', () => {
    const r = resizeImage(el, 'se', { x: 1, y: 1 });
    expect(r.width).toBeGreaterThanOrEqual(20);
    expect(r.height).toBeGreaterThanOrEqual(10);
    // aspect ratio still 2:1
    expect(r.width / r.height).toBeCloseTo(2);
  });
});

describe('drawImage', () => {
  function makeCtx() {
    return { save: vi.fn(), restore: vi.fn(), drawImage: vi.fn(), globalAlpha: 1 };
  }

  it('draws the loaded image at the element bounds', () => {
    const ctx = makeCtx();
    const img = { complete: true };
    drawImage(ctx, { x: 10, y: 20, width: 100, height: 50, opacity: 1 }, img);
    expect(ctx.drawImage).toHaveBeenCalledWith(img, 10, 20, 100, 50);
  });

  it('does nothing when the image is not yet loaded', () => {
    const ctx = makeCtx();
    drawImage(ctx, { x: 0, y: 0, width: 10, height: 10 }, null);
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });
});
