// Round-trip SVG export/import. The exported file is a valid SVG that renders in
// any browser, with the full scene JSON embedded in a <metadata> block. Import
// reconstructs the scene from that metadata — this is a round-trip format, not a
// general SVG importer.

const METADATA_TYPE = 'application/json+localdraw';

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function unescapeXml(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// Canvas line dashes (see tools/rect.js applyLineDash) translated to SVG.
function dashArray(strokeStyle, width) {
  if (strokeStyle === 'dashed') return `${width * 4} ${width * 2}`;
  if (strokeStyle === 'dotted') return `${width} ${width * 2}`;
  return null;
}

function attrs(pairs) {
  return Object.entries(pairs)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}="${escapeXml(v)}"`)
    .join(' ');
}

function rectSvg(el) {
  const a = {
    x: el.x, y: el.y, width: el.width, height: el.height,
    fill: el.fillColor && el.fillColor !== 'none' ? el.fillColor : 'none',
    stroke: el.strokeWidth > 0 ? el.strokeColor : null,
    'stroke-width': el.strokeWidth > 0 ? el.strokeWidth : null,
    'stroke-dasharray': el.strokeWidth > 0 ? dashArray(el.strokeStyle, el.strokeWidth) : null,
    opacity: el.opacity ?? 1,
  };
  return `<rect ${attrs(a)} />`;
}

function textSvg(el) {
  const lineH = el.fontSize * 1.4;
  const lines = (el.content ?? '').split('\n');
  // SVG text y is the baseline; "hanging" anchors el.y to the top edge to match
  // the canvas renderer (textBaseline 'top').
  const a = {
    x: el.x, y: el.y,
    'font-family': el.fontFamily,
    'font-size': el.fontSize,
    fill: el.color ?? '#000000',
    'dominant-baseline': 'hanging',
    opacity: el.opacity ?? 1,
  };
  const tspans = lines.map((line, i) =>
    `<tspan x="${el.x}" dy="${i === 0 ? 0 : lineH}">${escapeXml(line)}</tspan>`
  ).join('');
  return `<text ${attrs(a)}>${tspans}</text>`;
}

function linePathD(el) {
  if (el.cp1 && el.cp2) {
    return `M ${el.x1} ${el.y1} C ${el.cp1.x} ${el.cp1.y} ${el.cp2.x} ${el.cp2.y} ${el.x2} ${el.y2}`;
  }
  return `M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`;
}

function lineSvg(el) {
  const a = {
    d: linePathD(el),
    fill: 'none',
    stroke: el.strokeColor,
    'stroke-width': el.strokeWidth,
    'stroke-dasharray': dashArray(el.strokeStyle, el.strokeWidth),
  };
  return `<path ${attrs(a)} />`;
}

// Arrowhead geometry matches the canvas renderer (tools/line.js arrowhead).
function arrowheadPolygon(el) {
  const SIZE = 12;
  const tx = el.cp2 ? el.x2 - el.cp2.x : el.x2 - el.x1;
  const ty = el.cp2 ? el.y2 - el.cp2.y : el.y2 - el.y1;
  const angle = Math.atan2(ty, tx);
  const a1 = angle + Math.PI * 0.8;
  const a2 = angle - Math.PI * 0.8;
  const pts = [
    [el.x2, el.y2],
    [el.x2 + SIZE * Math.cos(a1), el.y2 + SIZE * Math.sin(a1)],
    [el.x2 + SIZE * Math.cos(a2), el.y2 + SIZE * Math.sin(a2)],
  ].map(([x, y]) => `${x},${y}`).join(' ');
  return `<polygon points="${pts}" fill="${escapeXml(el.strokeColor)}" />`;
}

function arrowSvg(el) {
  return `${lineSvg(el)}\n  ${arrowheadPolygon(el)}`;
}

function imageSvg(el) {
  const a = {
    x: el.x, y: el.y, width: el.width, height: el.height,
    href: `/uploads/${el.filename}`,
    opacity: el.opacity ?? 1,
  };
  return `<image ${attrs(a)} />`;
}

function elementSvg(el) {
  if (el.type === 'rect') return rectSvg(el);
  if (el.type === 'text') return textSvg(el);
  if (el.type === 'line') return lineSvg(el);
  if (el.type === 'arrow') return arrowSvg(el);
  if (el.type === 'image') return imageSvg(el);
  return '';
}

// Axis-aligned extent of a single element, in canvas coordinates. Text width is
// estimated (no canvas measureText here) — generous enough that the viewBox
// won't clip it.
function elementExtent(el) {
  if (el.type === 'line' || el.type === 'arrow') {
    const xs = [el.x1, el.x2, el.cp1?.x, el.cp2?.x].filter(v => v != null);
    const ys = [el.y1, el.y2, el.cp1?.y, el.cp2?.y].filter(v => v != null);
    return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
  }
  if (el.type === 'text') {
    const lines = (el.content ?? '').split('\n');
    const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
    const w = longest * el.fontSize * 0.6;
    const h = lines.length * el.fontSize * 1.4;
    return { minX: el.x, minY: el.y, maxX: el.x + w, maxY: el.y + h };
  }
  const w = el.width ?? 0;
  const h = el.height ?? 0;
  return { minX: el.x, minY: el.y, maxX: el.x + w, maxY: el.y + h };
}

const PAD = 20;

// Bounding box over every element, padded. Handles negative coordinates (the
// canvas can be panned) so nothing is clipped by the SVG viewport.
function sceneBounds(elements) {
  if (elements.length === 0) return { minX: 0, minY: 0, width: 100, height: 100 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of elements) {
    const e = elementExtent(el);
    minX = Math.min(minX, e.minX); minY = Math.min(minY, e.minY);
    maxX = Math.max(maxX, e.maxX); maxY = Math.max(maxY, e.maxY);
  }
  return {
    minX: Math.floor(minX) - PAD,
    minY: Math.floor(minY) - PAD,
    width: Math.max(1, Math.ceil(maxX - minX) + PAD * 2),
    height: Math.max(1, Math.ceil(maxY - minY) + PAD * 2),
  };
}

export function sceneToSvg({ name = 'Untitled', elements = [] }) {
  const metaJson = escapeXml(JSON.stringify({ name, elements }));
  const { minX, minY, width, height } = sceneBounds(elements);
  const sorted = [...elements].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const body = sorted.map(el => `  ${elementSvg(el)}`).filter(s => s.trim()).join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">`,
    `  <metadata type="${METADATA_TYPE}">${metaJson}</metadata>`,
    body,
    '</svg>',
  ].filter(Boolean).join('\n');
}

export function svgToScene(svgText) {
  const match = /<metadata\b[^>]*>([\s\S]*?)<\/metadata>/.exec(svgText);
  if (!match) {
    throw new Error('This SVG was not exported from Local Draw (no scene metadata found).');
  }
  let scene;
  try {
    scene = JSON.parse(unescapeXml(match[1]));
  } catch {
    throw new Error('This SVG was not exported from Local Draw (scene metadata is corrupt).');
  }
  return { name: scene.name ?? 'Untitled', elements: scene.elements ?? [] };
}
