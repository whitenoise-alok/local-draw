import { PALETTE } from '../utils/colors.js';

const STROKE_WIDTHS = [1, 2, 4, 6, 8];
const STROKE_STYLES = [
  { value: 'solid', label: '—' },
  { value: 'dashed', label: '╌' },
  { value: 'dotted', label: '·····' },
];

export function renderProperties(bar, toolName, tool) {
  bar.innerHTML = '';
  if (toolName === 'rect' && tool) {
    const s = tool.getStyle();
    bar.appendChild(colorGroup('Fill', ['none', ...PALETTE], s.fillColor, c => tool.setStyle({ fillColor: c })));
    bar.appendChild(colorGroup('Stroke', PALETTE, s.strokeColor, c => tool.setStyle({ strokeColor: c })));
    bar.appendChild(widthGroup(s.strokeWidth, w => tool.setStyle({ strokeWidth: w })));
    bar.appendChild(strokeStyleGroup(s.strokeStyle, ss => tool.setStyle({ strokeStyle: ss })));
  }
}

function colorGroup(label, colors, current, onChange) {
  const g = el('div', 'prop-group');
  g.appendChild(el('span', 'prop-label', label));
  const row = el('div', 'prop-swatches');
  colors.forEach(c => {
    const btn = el('button', 'prop-swatch' + (c === current ? ' active' : '') + (c === 'none' ? ' swatch-none' : ''));
    if (c !== 'none') btn.style.background = c;
    btn.title = c === 'none' ? 'No fill' : c;
    btn.addEventListener('click', () => {
      row.querySelectorAll('.prop-swatch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(c);
    });
    row.appendChild(btn);
  });
  g.appendChild(row);
  return g;
}

function widthGroup(current, onChange) {
  const g = el('div', 'prop-group');
  g.appendChild(el('span', 'prop-label', 'Width'));
  const row = el('div', 'prop-buttons');
  STROKE_WIDTHS.forEach(w => {
    const btn = el('button', 'prop-btn' + (w === current ? ' active' : ''), String(w));
    btn.addEventListener('click', () => {
      row.querySelectorAll('.prop-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(w);
    });
    row.appendChild(btn);
  });
  g.appendChild(row);
  return g;
}

function strokeStyleGroup(current, onChange) {
  const g = el('div', 'prop-group');
  g.appendChild(el('span', 'prop-label', 'Style'));
  const row = el('div', 'prop-buttons');
  STROKE_STYLES.forEach(({ value, label }) => {
    const btn = el('button', 'prop-btn' + (value === current ? ' active' : ''), label);
    btn.title = value;
    btn.addEventListener('click', () => {
      row.querySelectorAll('.prop-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(value);
    });
    row.appendChild(btn);
  });
  g.appendChild(row);
  return g;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
