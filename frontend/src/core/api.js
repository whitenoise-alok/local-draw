const BASE = '/api';

export async function listCanvases() {
  const res = await fetch(`${BASE}/canvases`);
  if (!res.ok) throw new Error('Failed to load canvases');
  return res.json();
}

export async function createCanvas(name = 'Untitled') {
  const res = await fetch(`${BASE}/canvases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create canvas');
  return res.json();
}

export async function getCanvas(id) {
  const res = await fetch(`${BASE}/canvases/${id}`);
  if (!res.ok) throw new Error('Canvas not found');
  return res.json();
}

export async function saveCanvas(id, elements, thumbnail) {
  const res = await fetch(`${BASE}/canvases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elements, thumbnail }),
  });
  if (!res.ok) throw new Error('Failed to save canvas');
}

export async function renameCanvas(id, name) {
  const res = await fetch(`${BASE}/canvases/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to rename canvas');
}

export async function deleteCanvas(id) {
  const res = await fetch(`${BASE}/canvases/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete canvas');
}
