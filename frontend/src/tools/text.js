export const FONT_SIZES = [10, 12, 14, 18, 24, 32, 48, 64];

export const FONT_FAMILIES = [
  'Inter', 'Arial', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Palatino',
  'Garamond', 'Bookman', 'Tahoma', 'Helvetica', 'Geneva',
  'Lucida Console', 'Monaco', 'Brush Script MT', 'Copperplate', 'Papyrus',
];

export function fontString(el) {
  const family = el.fontFamily.includes(' ') ? `"${el.fontFamily}"` : el.fontFamily;
  return `${el.fontSize}px ${family}`;
}

export function drawText(ctx, el) {
  if (!el.content) return;
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  ctx.fillStyle = el.color ?? '#000000';
  ctx.font = fontString(el);
  ctx.textBaseline = 'top';
  const lineH = el.fontSize * 1.4;
  el.content.split('\n').forEach((line, i) => {
    ctx.fillText(line, el.x, el.y + i * lineH);
  });
  ctx.restore();
}

export function createTextElement(pt, style) {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    x: pt.x,
    y: pt.y,
    content: '',
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    color: style.color,
    opacity: style.opacity,
  };
}

const DEFAULT_STYLE = {
  fontFamily: 'Inter',
  fontSize: 18,
  color: '#000000',
  opacity: 1,
};

export function createTextTool({ getVp, onOpen, onFinalize, onReplace, onCancel, onUpdate }) {
  const style = { ...DEFAULT_STYLE };
  let activeEl = null;
  let textarea = null;
  let isNew = false;

  function openTextarea(el, canvasRect) {
    removeTextarea();

    const vp = getVp();
    const sx = el.x * vp.zoom + vp.pan.x + canvasRect.left;
    const sy = el.y * vp.zoom + vp.pan.y + canvasRect.top;

    textarea = document.createElement('textarea');
    textarea.className = 'text-editor-overlay';
    textarea.value = el.content;
    textarea.style.left = `${sx}px`;
    textarea.style.top = `${sy}px`;
    textarea.style.fontSize = `${el.fontSize * vp.zoom}px`;
    textarea.style.fontFamily = el.fontFamily;
    textarea.style.color = el.color;
    textarea.style.opacity = String(el.opacity);

    textarea.addEventListener('input', () => {
      onUpdate(el.id, { content: textarea.value });
    });
    textarea.addEventListener('blur', () => commit());
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); commit(); }
    });

    document.body.appendChild(textarea);
    // rAF needed: focus() on a freshly-appended element is unreliable before paint in some browsers
    requestAnimationFrame(() => textarea?.focus());
  }

  function commit() {
    if (!activeEl) return;
    const content = textarea?.value ?? activeEl.content;
    const el = { ...activeEl, content };
    const wasNew = isNew;
    activeEl = null;  // null BEFORE removeTextarea() — prevents synchronous blur re-entry
    isNew = false;
    removeTextarea();
    if (wasNew) {
      if (content.trim()) {
        onFinalize();      // element already in scene via onOpen; push history + save
      } else {
        onCancel(el.id);   // discard the pre-added placeholder element
      }
    } else {
      onReplace(el);       // update existing element in scene, push history, save
    }
  }

  function removeTextarea() {
    textarea?.remove();
    textarea = null;
  }

  function pointerdown(pt, canvasRect) {
    commit();
    const el = createTextElement(pt, style);
    activeEl = el;
    isNew = true;
    onOpen(el);  // adds to scene immediately so live canvas preview works
    openTextarea(el, canvasRect);
  }

  function cancel() {
    if (activeEl && isNew) onCancel(activeEl.id);
    removeTextarea();
    activeEl = null;
    isNew = false;
  }

  function editExisting(el, canvasRect) {
    commit();
    activeEl = { ...el };
    isNew = false;
    openTextarea({ ...el }, canvasRect);
  }

  function getEditingId() { return activeEl?.id ?? null; }
  function getStyle() { return { ...style }; }
  function setStyle(props) { Object.assign(style, props); }

  return { pointerdown, cancel, editExisting, getEditingId, getStyle, setStyle };
}
