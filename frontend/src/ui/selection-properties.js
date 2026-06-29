import { PALETTE } from '../utils/colors.js';
import { colorGroup, widthGroup, strokeStyleGroup, opacityGroup, el } from './properties.js';

// Property bar for an active selection (one or more elements). Each shared-style
// control is shown only when at least one selected element carries that
// property, and edits flow to every selected element that owns it. Ordering and
// delete controls always apply to the whole group.
export function renderSelectionProperties(bar, api) {
  bar.innerHTML = '';
  const els = api.elements;
  const has = (key) => els.some(e => key in e);
  const first = (key) => els.find(e => key in e)?.[key];

  if (has('fillColor')) {
    bar.appendChild(colorGroup('Fill', ['none', ...PALETTE], first('fillColor'), c => api.onSetProp('fillColor', c)));
  }
  if (has('strokeColor')) {
    bar.appendChild(colorGroup('Stroke', PALETTE, first('strokeColor'), c => api.onSetProp('strokeColor', c)));
  }
  if (has('color')) {
    bar.appendChild(colorGroup('Color', PALETTE, first('color'), c => api.onSetProp('color', c)));
  }
  if (has('strokeWidth')) {
    bar.appendChild(widthGroup(first('strokeWidth'), w => api.onSetProp('strokeWidth', w)));
  }
  if (has('strokeStyle')) {
    bar.appendChild(strokeStyleGroup(first('strokeStyle'), s => api.onSetProp('strokeStyle', s)));
  }
  if (has('opacity')) {
    bar.appendChild(opacityGroup(first('opacity'), o => api.onSetProp('opacity', o)));
  }

  bar.appendChild(orderingGroup(api));
  bar.appendChild(deleteGroup(api));
}

function orderingGroup(api) {
  const g = el('div', 'prop-group');
  g.appendChild(el('span', 'prop-label', 'Order'));
  const row = el('div', 'prop-buttons');
  const buttons = [
    ['⤒', 'Bring to front', api.onBringToFront],
    ['↑', 'Bring forward', api.onBringForward],
    ['↓', 'Send backward', api.onSendBackward],
    ['⤓', 'Send to back', api.onSendToBack],
  ];
  buttons.forEach(([label, title, handler]) => {
    const btn = el('button', 'prop-btn', label);
    btn.title = title;
    btn.addEventListener('click', handler);
    row.appendChild(btn);
  });
  g.appendChild(row);
  return g;
}

function deleteGroup(api) {
  const g = el('div', 'prop-group');
  const btn = el('button', 'prop-btn', '🗑');
  btn.title = 'Delete selection (Del)';
  btn.addEventListener('click', api.onDelete);
  g.appendChild(btn);
  return g;
}
