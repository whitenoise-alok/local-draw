const DEFAULT_STYLE = {
  fillColor: '#dee2e6',
  strokeColor: '#1a1a1a',
  strokeWidth: 2,
  strokeStyle: 'solid',
  opacity: 1,
};

export function createRectTool() {
  const style = { ...DEFAULT_STYLE };
  let drawing = false;
  let startPt = null;
  let curPt = null;

  function pointerdown(pt) {
    drawing = true;
    startPt = pt;
    curPt = pt;
  }

  function pointermove(pt) {
    if (!drawing) return false;
    curPt = pt;
    return true;
  }

  function pointerup(pt, onCommit) {
    if (!drawing) return;
    drawing = false;
    const r = toRect(startPt, pt);
    if (r.width > 2 || r.height > 2) {
      onCommit({
        id: crypto.randomUUID(),
        type: 'rect',
        x: r.x, y: r.y, width: r.width, height: r.height,
        fillColor: style.fillColor,
        strokeColor: style.strokeColor,
        strokeWidth: style.strokeWidth,
        strokeStyle: style.strokeStyle,
        opacity: style.opacity,
      });
    }
    startPt = null;
    curPt = null;
  }

  function cancel() {
    drawing = false;
    startPt = null;
    curPt = null;
  }

  function renderPreview(ctx) {
    if (!drawing || !startPt || !curPt) return;
    drawRect(ctx, toRect(startPt, curPt), style);
  }

  function getStyle() { return { ...style }; }
  function setStyle(props) { Object.assign(style, props); }

  return { pointerdown, pointermove, pointerup, cancel, renderPreview, getStyle, setStyle };
}

export function toRect(a, b) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

export function drawRect(ctx, rect, style) {
  const { x, y, width, height } = rect;
  ctx.save();
  ctx.globalAlpha = style.opacity ?? 1;
  if (style.fillColor && style.fillColor !== 'none') {
    ctx.fillStyle = style.fillColor;
    ctx.fillRect(x, y, width, height);
  }
  if (style.strokeColor && style.strokeWidth > 0) {
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.strokeWidth;
    applyLineDash(ctx, style.strokeStyle, style.strokeWidth);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

export function applyLineDash(ctx, strokeStyle, width) {
  if (strokeStyle === 'dashed') ctx.setLineDash([width * 4, width * 2]);
  else if (strokeStyle === 'dotted') ctx.setLineDash([width, width * 2]);
  else ctx.setLineDash([]);
}
