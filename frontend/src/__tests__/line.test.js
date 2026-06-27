import { describe, it, expect, vi } from 'vitest';
import { midpointHandle, drawLine, drawArrow, arrowhead, createLineTool, createArrowTool } from '../tools/line.js';

describe('createLineTool', () => {
  it('pointerdown→pointermove→pointerup commits a line element', () => {
    const tool = createLineTool();
    const onCommit = vi.fn();
    tool.pointerdown({ x: 10, y: 20 });
    tool.pointermove({ x: 50, y: 60 });
    tool.pointerup({ x: 50, y: 60 }, onCommit);
    expect(onCommit).toHaveBeenCalledOnce();
    const el = onCommit.mock.calls[0][0];
    expect(el.type).toBe('line');
    expect(el.x1).toBe(10); expect(el.y1).toBe(20);
    expect(el.x2).toBe(50); expect(el.y2).toBe(60);
    expect(el.cp1).toBeNull();
    expect(el.cp2).toBeNull();
  });

  it('does not commit when drag is too short (< 3px)', () => {
    const tool = createLineTool();
    const onCommit = vi.fn();
    tool.pointerdown({ x: 0, y: 0 });
    tool.pointerup({ x: 1, y: 1 }, onCommit);
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe('createArrowTool', () => {
  it('commits an element with type arrow', () => {
    const tool = createArrowTool();
    const onCommit = vi.fn();
    tool.pointerdown({ x: 0, y: 0 });
    tool.pointerup({ x: 80, y: 0 }, onCommit);
    expect(onCommit.mock.calls[0][0].type).toBe('arrow');
  });
});

describe('midpointHandle', () => {
  it('returns segment midpoint when control points are null (straight line)', () => {
    expect(midpointHandle(0, 0, 100, 100, null, null)).toEqual({ x: 50, y: 50 });
  });

  it('returns bezier midpoint at t=0.5 when control points are set', () => {
    // Symmetric control points on a horizontal line → midpoint pulls up to cp y
    const result = midpointHandle(0, 0, 100, 0, { x: 25, y: 50 }, { x: 75, y: 50 });
    // t=0.5: 0.125*0 + 0.375*50 + 0.375*50 + 0.125*0 = 37.5
    expect(result.y).toBeCloseTo(37.5);
    expect(result.x).toBeCloseTo(50);
  });
});

function makeCtx() {
  return {
    save: vi.fn(), restore: vi.fn(),
    beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    bezierCurveTo: vi.fn(), closePath: vi.fn(), fill: vi.fn(),
    stroke: vi.fn(), setLineDash: vi.fn(),
    strokeStyle: '', lineWidth: 0, fillStyle: '',
  };
}

const straightEl = { x1: 0, y1: 0, x2: 100, y2: 0, cp1: null, cp2: null, strokeColor: '#000', strokeWidth: 2, strokeStyle: 'solid' };
const curvedEl   = { x1: 0, y1: 0, x2: 100, y2: 0, cp1: { x: 25, y: 50 }, cp2: { x: 75, y: 50 }, strokeColor: '#000', strokeWidth: 2, strokeStyle: 'solid' };

describe('arrowhead', () => {
  it('starts path at the endpoint and closes it (triangle)', () => {
    const ctx = makeCtx();
    arrowhead(ctx, 0, 0, 100, 0);
    expect(ctx.moveTo).toHaveBeenCalledWith(100, 0);
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });
});

describe('drawArrow', () => {
  it('draws the stroke and then fills an arrowhead triangle', () => {
    const ctx = makeCtx();
    drawArrow(ctx, straightEl);
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.fillStyle).toBe('#000');
  });
});

describe('drawLine', () => {
  it('uses lineTo for straight line (null control points)', () => {
    const ctx = makeCtx();
    drawLine(ctx, straightEl);
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 0);
    expect(ctx.bezierCurveTo).not.toHaveBeenCalled();
  });

  it('uses bezierCurveTo for curved line', () => {
    const ctx = makeCtx();
    drawLine(ctx, curvedEl);
    expect(ctx.bezierCurveTo).toHaveBeenCalledWith(25, 50, 75, 50, 100, 0);
    expect(ctx.lineTo).not.toHaveBeenCalled();
  });
});
