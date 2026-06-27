import { describe, it, expect, vi } from 'vitest';
import { FONT_FAMILIES, FONT_SIZES, createTextElement, fontString, drawText, hitTestText } from '../tools/text.js';

describe('FONT_FAMILIES', () => {
  it('has exactly 20 entries', () => {
    expect(FONT_FAMILIES).toHaveLength(20);
  });
});

describe('drawText', () => {
  function makeCtx() {
    return {
      save: vi.fn(), restore: vi.fn(), fillText: vi.fn(),
      globalAlpha: 1, fillStyle: '', font: '', textBaseline: '',
      measureText: vi.fn(str => ({ width: str.length * 10 })),
      setLineDash: vi.fn(), strokeRect: vi.fn(),
      strokeStyle: '', lineWidth: 1,
    };
  }

  it('sets font from fontString', () => {
    const ctx = makeCtx();
    drawText(ctx, { x: 0, y: 0, content: 'hi', fontSize: 18, fontFamily: 'Inter', color: '#000', opacity: 1 });
    expect(ctx.font).toBe('18px Inter');
  });

  it('sets fill color from element color', () => {
    const ctx = makeCtx();
    drawText(ctx, { x: 0, y: 0, content: 'hi', fontSize: 18, fontFamily: 'Inter', color: '#ff0000', opacity: 1 });
    expect(ctx.fillStyle).toBe('#ff0000');
  });

  it('sets globalAlpha from opacity', () => {
    const ctx = makeCtx();
    drawText(ctx, { x: 0, y: 0, content: 'hi', fontSize: 18, fontFamily: 'Inter', color: '#000', opacity: 0.5 });
    expect(ctx.globalAlpha).toBe(0.5);
  });

  it('calls fillText for each line of content', () => {
    const ctx = makeCtx();
    drawText(ctx, { x: 10, y: 20, content: 'line1\nline2', fontSize: 18, fontFamily: 'Inter', color: '#000', opacity: 1 });
    expect(ctx.fillText).toHaveBeenCalledTimes(2);
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, 'line1', 10, 20);
  });

  it('does not call fillText for empty content', () => {
    const ctx = makeCtx();
    drawText(ctx, { x: 0, y: 0, content: '', fontSize: 18, fontFamily: 'Inter', color: '#000', opacity: 1 });
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('draws a dashed boundary rect sized to the measured text width', () => {
    const ctx = makeCtx();
    // measureText returns str.length * 10, so 'hello' → 50px wide
    drawText(ctx, { x: 10, y: 20, content: 'hello', fontSize: 18, fontFamily: 'Inter', color: '#000', opacity: 1 });
    expect(ctx.setLineDash).toHaveBeenCalledWith([4, 4]);
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 50, 18 * 1.4);
  });

  it('draws boundary even when content is empty', () => {
    const ctx = makeCtx();
    drawText(ctx, { x: 5, y: 5, content: '', fontSize: 16, fontFamily: 'Inter', color: '#000', opacity: 1 });
    expect(ctx.strokeRect).toHaveBeenCalled();
  });

  it('sizes boundary to the widest line in multi-line text', () => {
    const ctx = makeCtx();
    // 'ab' → 20px, 'abcde' → 50px; boundary width should be 50
    drawText(ctx, { x: 0, y: 0, content: 'ab\nabcde', fontSize: 18, fontFamily: 'Inter', color: '#000', opacity: 1 });
    const [,, w] = ctx.strokeRect.mock.calls[0];
    expect(w).toBe(50);
  });
});

describe('FONT_SIZES', () => {
  it('has exactly 8 entries', () => {
    expect(FONT_SIZES).toHaveLength(8);
  });
});

describe('fontString', () => {
  it('returns a CSS font string with size and family', () => {
    expect(fontString({ fontSize: 24, fontFamily: 'Georgia' })).toBe('24px Georgia');
  });

  it('quotes font families that contain spaces', () => {
    expect(fontString({ fontSize: 16, fontFamily: 'Times New Roman' })).toBe('16px "Times New Roman"');
  });
});

describe('hitTestText', () => {
  const el = { x: 10, y: 20, fontSize: 18, content: 'hello' };

  it('returns true for a point inside the text bounds', () => {
    expect(hitTestText({ x: 15, y: 30 }, el)).toBe(true);
  });

  it('returns false for a point above the element', () => {
    expect(hitTestText({ x: 15, y: 10 }, el)).toBe(false);
  });

  it('returns false for a point to the left of the element', () => {
    expect(hitTestText({ x: 5, y: 30 }, el)).toBe(false);
  });

  it('returns false for a point farther than 400px to the right', () => {
    expect(hitTestText({ x: 420, y: 30 }, el)).toBe(false);
  });

  it('accounts for multi-line content height', () => {
    const multiline = { x: 0, y: 0, fontSize: 20, content: 'a\nb\nc' };
    const lineH = 20 * 1.4;
    expect(hitTestText({ x: 5, y: lineH * 2.5 }, multiline)).toBe(true);
    expect(hitTestText({ x: 5, y: lineH * 3 + 1 }, multiline)).toBe(false);
  });
});

describe('createTextElement', () => {
  const style = { fontFamily: 'Inter', fontSize: 20, color: '#000000', opacity: 1 };

  it('produces a text element at the given point', () => {
    const el = createTextElement({ x: 50, y: 80 }, style);
    expect(el.type).toBe('text');
    expect(el.x).toBe(50);
    expect(el.y).toBe(80);
  });

  it('starts with empty content', () => {
    const el = createTextElement({ x: 0, y: 0 }, style);
    expect(el.content).toBe('');
  });

  it('copies style fields onto the element', () => {
    const el = createTextElement({ x: 0, y: 0 }, style);
    expect(el.fontFamily).toBe('Inter');
    expect(el.fontSize).toBe(20);
    expect(el.color).toBe('#000000');
    expect(el.opacity).toBe(1);
  });

  it('assigns a unique id each time', () => {
    const a = createTextElement({ x: 0, y: 0 }, style);
    const b = createTextElement({ x: 0, y: 0 }, style);
    expect(a.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
  });
});
