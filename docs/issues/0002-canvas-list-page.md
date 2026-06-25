# 0002 — Canvas list page

## What to build

A working list page where the user can manage their canvases. The page loads all canvases from `GET /api/canvases` (metadata only — id, name, updatedAt; no thumbnail yet, that comes with auto-save in issue 0004) and displays them sorted by most-recently-modified. The user can create a new canvas, rename an existing one inline, delete one with a confirmation prompt, and click one to open it in the canvas editor.

The backend needs `POST /api/canvases`, `DELETE /api/canvases/:id`, and a rename endpoint (either `PUT /api/canvases/:id` or a dedicated `PATCH`).

## Acceptance criteria

- [ ] List page loads at `http://localhost:8000` and shows all saved canvases
- [ ] Canvases are sorted by `updatedAt` descending (most recent first)
- [ ] "New canvas" button creates a canvas and navigates to the editor
- [ ] Canvas name is editable inline; rename persists after blur
- [ ] Delete button shows a confirmation prompt before deleting
- [ ] Deleted canvas disappears from the list without a page reload
- [ ] Clicking a canvas navigates to `canvas.html?id=<id>`
- [ ] `GET /api/canvases` returns only metadata fields — no `elements` array in the response

## Blocked by

- 0001
