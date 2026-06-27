import { applyLineDash } from './rect.js';

const DEFAULT_STYLE = {
  strokeColor: '#1a1a1a',
  strokeWidth: 2,
  strokeStyle: 'solid',
};

export function drawLine(ctx, el) {
  ctx.save();
  ctx.strokeStyle = el.strokeColor;
  ctx.lineWidth = el.strokeWidth;
  applyLineDash(ctx, el.strokeStyle, el.strokeWidth);
  ctx.beginPath();
  ctx.moveTo(el.x1, el.y1);
  if (el.cp1 && el.cp2) {
    ctx.bezierCurveTo(el.cp1.x, el.cp1.y, el.cp2.x, el.cp2.y, el.x2, el.y2);
  } else {
    ctx.lineTo(el.x2, el.y2);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

export function arrowhead(ctx, x1, y1, x2, y2) {
  const SIZE = 12;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const a1 = angle + Math.PI * 0.8;
  const a2 = angle - Math.PI * 0.8;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 + SIZE * Math.cos(a1), y2 + SIZE * Math.sin(a1));
  ctx.lineTo(x2 + SIZE * Math.cos(a2), y2 + SIZE * Math.sin(a2));
  ctx.closePath();
  ctx.fill();
}

export function drawArrow(ctx, el) {
  drawLine(ctx, el);
  ctx.save();
  ctx.fillStyle = el.strokeColor;
  // For a bezier, tangent at t=1 is cp2→end; for straight line it's start→end
  const tx = el.cp2 ? el.x2 - el.cp2.x : el.x2 - el.x1;
  const ty = el.cp2 ? el.y2 - el.cp2.y : el.y2 - el.y1;
  arrowhead(ctx, el.x2 - tx, el.y2 - ty, el.x2, el.y2);
  ctx.restore();
}

function createTool(type) {
  const style = { ...DEFAULT_STYLE };
  let drawing = false;
  let startPt = null;
  let curPt = null;

  function pointerdown(pt) { drawing = true; startPt = pt; curPt = pt; }

  function pointermove(pt) {
    if (!drawing) return false;
    curPt = pt;
    return true;
  }

  function pointerup(pt, onCommit) {
    if (!drawing) return;
    drawing = false;
    const dx = pt.x - startPt.x, dy = pt.y - startPt.y;
    if (Math.sqrt(dx*dx + dy*dy) > 3) {
      onCommit({
        id: crypto.randomUUID(),
        type,
        x1: startPt.x, y1: startPt.y,
        x2: pt.x, y2: pt.y,
        cp1: null, cp2: null,
        strokeColor: style.strokeColor,
        strokeWidth: style.strokeWidth,
        strokeStyle: style.strokeStyle,
      });
    }
    startPt = null;
  }

  function cancel() { drawing = false; startPt = null; curPt = null; }

  function renderPreview(ctx) {
    if (!drawing || !startPt || !curPt) return;
    const el = { x1: startPt.x, y1: startPt.y, x2: curPt.x, y2: curPt.y, cp1: null, cp2: null, ...style };
    if (type === 'arrow') drawArrow(ctx, el); else drawLine(ctx, el);
  }

  function getStyle() { return { ...style }; }
  function setStyle(props) { Object.assign(style, props); }

  return { pointerdown, pointermove, pointerup, cancel, renderPreview, getStyle, setStyle };
}

export function createLineTool() { return createTool('line'); }
export function createArrowTool() { return createTool('arrow'); }

export function midpointHandle(x1, y1, x2, y2, cp1, cp2) {
  if (!cp1 || !cp2) return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  // Midpoint on cubic bezier at t=0.5
  const t = 0.5;
  const mt = 1 - t;
  const x = mt*mt*mt*x1 + 3*mt*mt*t*cp1.x + 3*mt*t*t*cp2.x + t*t*t*x2;
  const y = mt*mt*mt*y1 + 3*mt*mt*t*cp1.y + 3*mt*t*t*cp2.y + t*t*t*y2;
  return { x, y };
}
