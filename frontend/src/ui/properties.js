import { PALETTE } from '../utils/colors.js';
import { FONT_FAMILIES, FONT_SIZES } from '../tools/text.js';

const OPACITIES = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
];
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
  if (toolName === 'text' && tool) {
    const s = tool.getStyle();
    bar.appendChild(fontFamilyGroup(s.fontFamily, f => tool.setStyle({ fontFamily: f })));
    bar.appendChild(fontSizeGroup(s.fontSize, sz => tool.setStyle({ fontSize: sz })));
    bar.appendChild(colorGroup('Color', PALETTE, s.color, c => tool.setStyle({ color: c })));
    bar.appendChild(opacityGroup(s.opacity, o => tool.setStyle({ opacity: o })));
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

function opacityGroup(current, onChange) {
  const g = el('div', 'prop-group');
  g.appendChild(el('span', 'prop-label', 'Opacity'));
  const row = el('div', 'prop-buttons');
  OPACITIES.forEach(({ label, value }) => {
    const btn = el('button', 'prop-btn' + (value === current ? ' active' : ''), label);
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

function fontFamilyGroup(current, onChange) {
  const g = el('div', 'prop-group');
  g.appendChild(el('span', 'prop-label', 'Font'));
  const select = document.createElement('select');
  select.className = 'prop-select';
  FONT_FAMILIES.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f;
    opt.selected = f === current;
    select.appendChild(opt);
  });
  select.addEventListener('change', () => onChange(select.value));
  g.appendChild(select);
  return g;
}

function fontSizeGroup(current, onChange) {
  const g = el('div', 'prop-group');
  g.appendChild(el('span', 'prop-label', 'Size'));
  const row = el('div', 'prop-buttons');
  FONT_SIZES.forEach(sz => {
    const btn = el('button', 'prop-btn' + (sz === current ? ' active' : ''), String(sz));
    btn.addEventListener('click', () => {
      row.querySelectorAll('.prop-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(sz);
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
