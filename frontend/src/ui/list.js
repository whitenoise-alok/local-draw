import { listCanvases, createCanvas, saveCanvas, renameCanvas, deleteCanvas } from '../core/api.js';
import { svgToScene } from '../core/svg.js';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function checkEmpty(listEl, emptyEl) {
  emptyEl.hidden = listEl.children.length > 0;
}

function makeItem(canvas, listEl, emptyEl) {
  const li = document.createElement('li');
  li.className = 'canvas-item';

  const info = document.createElement('div');
  info.className = 'canvas-info';

  const nameEl = document.createElement('span');
  nameEl.className = 'canvas-name';
  nameEl.textContent = canvas.name;
  nameEl.title = 'Click to rename';

  const dateEl = document.createElement('span');
  dateEl.className = 'canvas-date';
  dateEl.textContent = formatDate(canvas.updatedAt);

  // Inline rename
  nameEl.addEventListener('click', (e) => {
    e.stopPropagation();
    nameEl.contentEditable = 'true';
    nameEl.classList.add('editing');
    nameEl.focus();
    const range = document.createRange();
    range.selectNodeContents(nameEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });

  nameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
    if (e.key === 'Escape') { nameEl.textContent = canvas.name; nameEl.blur(); }
  });

  nameEl.addEventListener('blur', async () => {
    nameEl.contentEditable = 'false';
    nameEl.classList.remove('editing');
    const newName = nameEl.textContent.trim() || canvas.name;
    nameEl.textContent = newName;
    if (newName !== canvas.name) {
      canvas.name = newName;
      await renameCanvas(canvas.id, newName);
    }
  });

  info.append(nameEl, dateEl);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-delete';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${canvas.name}"?`)) return;
    await deleteCanvas(canvas.id);
    li.remove();
    checkEmpty(listEl, emptyEl);
  });

  li.append(info, deleteBtn);
  li.addEventListener('click', () => {
    window.location.href = `/canvas.html?id=${canvas.id}`;
  });

  return li;
}

async function init() {
  const listEl = document.getElementById('canvas-list');
  const emptyEl = document.getElementById('empty-state');
  const newBtn = document.getElementById('new-canvas-btn');

  const canvases = await listCanvases();
  canvases.forEach(c => listEl.appendChild(makeItem(c, listEl, emptyEl)));
  checkEmpty(listEl, emptyEl);

  newBtn.addEventListener('click', async () => {
    const canvas = await createCanvas('Untitled');
    window.location.href = `/canvas.html?id=${canvas.id}`;
  });

  // Import: parse the SVG's embedded scene metadata, create a canvas from it,
  // and open it. Errors (e.g. an SVG with no metadata) surface to the user.
  const importBtn = document.getElementById('import-svg-btn');
  const importInput = document.getElementById('import-svg-input');
  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    importInput.value = '';  // allow re-importing the same file later
    if (!file) return;
    try {
      const { name, elements } = svgToScene(await file.text());
      const canvas = await createCanvas(name || file.name.replace(/\.svg$/i, ''));
      await saveCanvas(canvas.id, elements, '');
      window.location.href = `/canvas.html?id=${canvas.id}`;
    } catch (err) {
      alert(err.message || 'Failed to import SVG.');
    }
  });
}

init();
