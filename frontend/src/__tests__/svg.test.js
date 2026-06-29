import { describe, it, expect } from 'vitest';
import { sceneToSvg, svgToScene } from '../core/svg.js';

const rect = {
  id: 'r1', type: 'rect', x: 10, y: 20, width: 100, height: 50,
  fillColor: '#dee2e6', strokeColor: '#1a1a1a', strokeWidth: 2,
  strokeStyle: 'solid', opacity: 1, order: 0,
};

describe('round-trip via metadata', () => {
  it('restores a rect element exactly', () => {
    const svg = sceneToSvg({ name: 'My Canvas', elements: [rect] });
    const scene = svgToScene(svg);
    expect(scene.elements).toEqual([rect]);
  });

  it('preserves the canvas name', () => {
    const svg = sceneToSvg({ name: 'My Canvas', elements: [rect] });
    expect(svgToScene(svg).name).toBe('My Canvas');
  });
});

describe('visible SVG body', () => {
  it('renders a rect element with its geometry and fill/stroke', () => {
    const svg = sceneToSvg({ name: 'c', elements: [rect] });
    expect(svg).toMatch(/<rect\b[^>]*\bx="10"[^>]*\by="20"[^>]*\bwidth="100"[^>]*\bheight="50"/);
    expect(svg).toContain('fill="#dee2e6"');
    expect(svg).toContain('stroke="#1a1a1a"');
    expect(svg).toContain('stroke-width="2"');
  });

  it('renders a transparent rect fill as fill="none"', () => {
    const el = { ...rect, fillColor: 'none' };
    const svg = sceneToSvg({ name: 'c', elements: [el] });
    expect(svg).toMatch(/<rect\b[^>]*fill="none"/);
  });

  it('emits a stroke-dasharray for a dashed rect', () => {
    const el = { ...rect, strokeStyle: 'dashed' };
    const svg = sceneToSvg({ name: 'c', elements: [el] });
    expect(svg).toMatch(/<rect\b[^>]*stroke-dasharray="8 4"/);
  });
});

describe('text rendering', () => {
  const text = {
    id: 't1', type: 'text', x: 5, y: 8, content: 'hello\nworld',
    fontFamily: 'Inter', fontSize: 18, color: '#222222', opacity: 1, order: 0,
  };

  it('renders a <text> with font and fill, one <tspan> per line', () => {
    const svg = sceneToSvg({ name: 'c', elements: [text] });
    expect(svg).toMatch(/<text\b[^>]*font-family="Inter"[^>]*font-size="18"/);
    expect(svg).toContain('fill="#222222"');
    expect((svg.match(/<tspan\b/g) || []).length).toBe(2);
    expect(svg).toContain('>hello</tspan>');
    expect(svg).toContain('>world</tspan>');
  });

  it('escapes XML-special characters in text content', () => {
    const el = { ...text, content: 'a < b & "c"' };
    const svg = sceneToSvg({ name: 'c', elements: [el] });
    expect(svg).toContain('a &lt; b &amp; &quot;c&quot;');
    expect(svgToScene(svg).elements[0].content).toBe('a < b & "c"');
  });
});

describe('line and arrow rendering', () => {
  const line = {
    id: 'l1', type: 'line', x1: 0, y1: 0, x2: 30, y2: 40,
    cp1: null, cp2: null, strokeColor: '#1a1a1a', strokeWidth: 2, strokeStyle: 'solid', order: 0,
  };

  it('renders a straight line as a path with fill none', () => {
    const svg = sceneToSvg({ name: 'c', elements: [line] });
    expect(svg).toMatch(/<path\b[^>]*\bd="M 0 0 L 30 40"/);
    expect(svg).toMatch(/<path\b[^>]*fill="none"/);
    expect(svg).toContain('stroke="#1a1a1a"');
  });

  it('renders a curved line as a cubic bezier path', () => {
    const el = { ...line, cp1: { x: 5, y: 10 }, cp2: { x: 20, y: 25 } };
    const svg = sceneToSvg({ name: 'c', elements: [el] });
    expect(svg).toMatch(/\bd="M 0 0 C 5 10 20 25 30 40"/);
  });

  it('renders an arrow as a path plus a filled arrowhead polygon', () => {
    const el = { ...line, type: 'arrow' };
    const svg = sceneToSvg({ name: 'c', elements: [el] });
    expect(svg).toMatch(/<path\b/);
    expect(svg).toMatch(/<polygon\b[^>]*fill="#1a1a1a"/);
  });
});

describe('image rendering', () => {
  const image = {
    id: 'i1', type: 'image', filename: 'abc123.png',
    x: 4, y: 6, width: 80, height: 60, opacity: 1, order: 0,
  };

  it('renders an <image> referencing the uploads path', () => {
    const svg = sceneToSvg({ name: 'c', elements: [image] });
    expect(svg).toMatch(/<image\b[^>]*\bx="4"[^>]*\bwidth="80"[^>]*\bheight="60"/);
    expect(svg).toMatch(/href="\/uploads\/abc123\.png"/);
  });

  it('round-trips the image element by filename', () => {
    const svg = sceneToSvg({ name: 'c', elements: [image] });
    expect(svgToScene(svg).elements[0]).toEqual(image);
  });
});

describe('full scene round-trip', () => {
  it('restores every element type, preserving order', () => {
    const elements = [
      rect,
      { id: 't', type: 'text', x: 5, y: 8, content: 'hi', fontFamily: 'Inter', fontSize: 18, color: '#000', opacity: 1, order: 1 },
      { id: 'l', type: 'line', x1: 0, y1: 0, x2: 9, y2: 9, cp1: { x: 2, y: 2 }, cp2: { x: 7, y: 7 }, strokeColor: '#1a1a1a', strokeWidth: 2, strokeStyle: 'dotted', order: 2 },
      { id: 'a', type: 'arrow', x1: 1, y1: 1, x2: 5, y2: 5, cp1: null, cp2: null, strokeColor: '#1a1a1a', strokeWidth: 3, strokeStyle: 'solid', order: 3 },
      { id: 'i', type: 'image', filename: 'p.png', x: 4, y: 6, width: 80, height: 60, opacity: 0.5, order: 4 },
    ];
    const scene = svgToScene(sceneToSvg({ name: 'Mixed', elements }));
    expect(scene).toEqual({ name: 'Mixed', elements });
  });
});

describe('viewBox sizing', () => {
  it('encloses elements positioned at negative coordinates', () => {
    const el = { ...rect, x: -100, y: -50 }; // right/bottom edges land at 0
    const svg = sceneToSvg({ name: 'c', elements: [el] });
    const m = /viewBox="(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+)"/.exec(svg);
    expect(m).not.toBeNull();
    const [, minX, minY, w, h] = m.map(Number);
    expect(minX).toBeLessThanOrEqual(-100);
    expect(minY).toBeLessThanOrEqual(-50);
    expect(minX + w).toBeGreaterThanOrEqual(0);
    expect(minY + h).toBeGreaterThanOrEqual(0);
  });
});

describe('import errors', () => {
  it('throws a clear error when there is no metadata block', () => {
    const plain = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
    expect(() => svgToScene(plain)).toThrow(/Local Draw/);
  });
});
