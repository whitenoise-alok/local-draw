const MAX_INITIAL_SIZE = 400;
const MIN_SIZE = 10;

export function createImageElement(filename, naturalW, naturalH, center, maxSize = MAX_INITIAL_SIZE) {
  let w = naturalW;
  let h = naturalH;
  if (w > maxSize || h > maxSize) {
    const scale = Math.min(maxSize / w, maxSize / h);
    w = w * scale;
    h = h * scale;
  }
  return {
    id: crypto.randomUUID(),
    type: 'image',
    filename,
    x: center.x - w / 2,
    y: center.y - h / 2,
    width: w,
    height: h,
    opacity: 1,
  };
}

// The image tool has no canvas drag interaction — activating it opens the
// system file picker, and onPick receives the chosen File.
export function createImageTool({ onPick }) {
  function openPicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.remove();
      if (file) onPick(file);
    });
    document.body.appendChild(input);
    input.click();
  }
  return { openPicker };
}

export function hitTestImage(pt, el) {
  return pt.x >= el.x && pt.x <= el.x + el.width
    && pt.y >= el.y && pt.y <= el.y + el.height;
}

export function imageHandles(el) {
  return {
    nw: { x: el.x, y: el.y },
    ne: { x: el.x + el.width, y: el.y },
    sw: { x: el.x, y: el.y + el.height },
    se: { x: el.x + el.width, y: el.y + el.height },
  };
}

export function drawImage(ctx, el, img) {
  if (!img) return;
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  ctx.drawImage(img, el.x, el.y, el.width, el.height);
  ctx.restore();
}

// Resize proportionally by dragging a corner handle; the opposite corner stays
// anchored. Aspect ratio is preserved by driving the scale from whichever axis
// the pointer moved further along.
export function resizeImage(el, handle, pt) {
  const anchor = {
    nw: { x: el.x + el.width, y: el.y + el.height },
    ne: { x: el.x,            y: el.y + el.height },
    sw: { x: el.x + el.width, y: el.y },
    se: { x: el.x,            y: el.y },
  }[handle];
  const dw = Math.abs(pt.x - anchor.x);
  const dh = Math.abs(pt.y - anchor.y);
  const minScale = MIN_SIZE / Math.min(el.width, el.height);
  const scale = Math.max(dw / el.width, dh / el.height, minScale);
  const width = el.width * scale;
  const height = el.height * scale;
  const left = handle === 'nw' || handle === 'sw';
  const top = handle === 'nw' || handle === 'ne';
  return {
    x: left ? anchor.x - width : anchor.x,
    y: top ? anchor.y - height : anchor.y,
    width,
    height,
  };
}
