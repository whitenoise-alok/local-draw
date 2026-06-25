# PRD: Local Draw

## Problem Statement

Creating diagrams and visual notes during reading or research requires either a cloud tool (Excalidraw, Figma, Miro) that sends data to external servers, or a desktop app with a heavyweight install. The user wants a fast, private, local drawing tool that persists everything on their own machine with no accounts, no cloud, and no friction.

---

## Solution

A browser-based infinite canvas drawing tool backed by a local Python/FastAPI server and MongoDB. The user runs one command (`./start.sh`), opens `http://localhost:8000`, and gets a full diagramming environment — text boxes, rectangles, lines, arrows, images — with auto-save, undo/redo, SVG export, and a canvas list page for managing multiple drawings.

---

## User Stories

### Canvas List Page

1. As a user, I want to see all my canvases on a list page, so that I can pick up where I left off.
2. As a user, I want each canvas entry to show a thumbnail preview, so that I can visually identify a canvas without opening it.
3. As a user, I want each canvas entry to show a name and last modified date, so that I can find recent work quickly.
4. As a user, I want canvases sorted by most recently modified, so that my active work appears at the top.
5. As a user, I want to create a new canvas from the list page, so that I can start a fresh drawing.
6. As a user, I want to rename a canvas inline from the list page, so that I can keep my canvases organised.
7. As a user, I want to delete a canvas from the list page with a confirmation prompt, so that I don't lose work by accident.
8. As a user, I want to click a canvas on the list page to open it in the editor, so that I can resume editing.

### App Startup

9. As a user, I want to run a single command (`./start.sh`) to start the app, so that I don't have to manually start MongoDB and the server separately.
10. As a user, I want the start script to check if MongoDB is already running before starting it, so that I don't get port conflicts.
11. As a user, I want the start script to print the URL when the app is ready, so that I know where to open the browser.

### Infinite Canvas

12. As a user, I want an infinite canvas with no visible edges, so that I can draw diagrams of any size.
13. As a user, I want to pan the canvas by holding spacebar and dragging, so that I can navigate large diagrams.
14. As a user, I want to zoom the canvas with Ctrl+scroll or a pinch gesture, so that I can see detail or get an overview.
15. As a user, I want a dot grid background that scales with zoom, so that I can orient myself spatially on the canvas.
16. As a user, I want the URL to include the canvas ID, so that I can bookmark or share a specific canvas.

### Select Tool

17. As a user, I want to click an element to select it, so that I can move or modify it.
18. As a user, I want to drag a selected element to move it, so that I can reposition elements.
19. As a user, I want resize handles on a selected element (4 corners + 4 edge midpoints), so that I can change its size.
20. As a user, I want corner handles to resize proportionally, so that I can scale without distorting the element.
21. As a user, I want edge handles to resize freely in one axis, so that I can stretch an element horizontally or vertically.
22. As a user, I want to draw a selection box to select multiple elements at once, so that I can operate on groups.
23. As a user, I want to move all selected elements together, so that I can reposition a group.
24. As a user, I want to delete all selected elements with Delete/Backspace, so that I can clear a group quickly.
25. As a user, I want to change a shared property (e.g. stroke colour) on a multi-selection, so that I can restyle a group at once.
26. As a user, I want to select line/arrow endpoints and control point handles independently, so that I can reshape curves precisely.

### Rectangle Tool

27. As a user, I want to click and drag to draw a rectangle, so that I can create boxes for diagrams.
28. As a user, I want to pick a fill colour from a preset palette for a rectangle, so that I can colour-code diagrams.
29. As a user, I want to pick a stroke colour from a preset palette for a rectangle, so that I can style borders.
30. As a user, I want to choose stroke width from 5 presets (1px, 2px, 4px, 6px, 8px) for a rectangle, so that I can control border weight.
31. As a user, I want to choose stroke style (solid, dashed, dotted) for a rectangle, so that I can distinguish between element types visually.
32. As a user, I want to control the opacity of a rectangle, so that I can layer elements transparently.
33. As a user, I want to control the order (z-index) of a rectangle relative to other elements, so that I can decide what renders on top.

### Text Tool

34. As a user, I want to click on the canvas to place a text box, so that I can add labels and notes.
35. As a user, I want to type text inline directly on the canvas via an overlaid textarea, so that editing feels natural.
36. As a user, I want to choose from 20 font families, so that I can match the tone of my diagram.
37. As a user, I want to choose from 8 font size options, so that I can control text hierarchy.
38. As a user, I want to pick a text colour from a preset palette, so that I can colour-code labels.
39. As a user, I want to control the opacity of a text box, so that I can layer text transparently.
40. As a user, I want to control the order of a text box relative to other elements, so that I can place text in front of or behind shapes.

### Line Tool

41. As a user, I want to click and drag to draw a straight line, so that I can connect elements.
42. As a user, I want to drag the midpoint of a straight line to bend it into a curve, so that I can route connections around other elements.
43. As a user, I want to pick stroke colour, width, and style for a line, so that I can distinguish between connection types.

### Arrow Tool

44. As a user, I want to draw an arrow with the same interactions as a line, so that I can show directed relationships.
45. As a user, I want the arrowhead to appear at the endpoint, so that the direction is clear.
46. As a user, I want to pick stroke colour, width, and style for an arrow, so that I can style directed connections.

### Image Tool

47. As a user, I want to click the image tool to open a file picker, so that I can select an image from my local disk.
48. As a user, I want the selected image to appear on the canvas immediately after upload, so that I can position it.
49. As a user, I want image files to be stored on the server (not in the database), so that large images don't hit document size limits.
50. As a user, I want images to persist across sessions, so that canvases with images look the same when I reopen them.

### Eraser Tool

51. As a user, I want to click an element with the eraser tool to delete it, so that I can remove individual elements.
52. As a user, I want to drag the eraser across elements to delete all elements it touches, so that I can clear large areas quickly.

### Ordering

53. As a user, I want to bring an element to the front, so that it renders above all other elements.
54. As a user, I want to send an element to the back, so that it renders below all other elements.
55. As a user, I want to bring an element forward by one step, so that I can fine-tune layering.
56. As a user, I want to send an element backward by one step, so that I can fine-tune layering.
57. As a user, I want ordering controls accessible from the top property bar and via keyboard shortcuts, so that I can change order quickly.

### Undo/Redo

58. As a user, I want to undo my last action with Ctrl+Z, so that I can recover from mistakes.
59. As a user, I want to redo an undone action with Ctrl+Shift+Z, so that I can reapply changes.
60. As a user, I want up to 50 undo steps, so that I have enough history for a working session.

### Copy/Paste

61. As a user, I want to copy selected elements with Ctrl+C, so that I can duplicate parts of a diagram.
62. As a user, I want to paste copied elements with Ctrl+V, offset slightly from the original, so that the paste is visible immediately.
63. As a user, I want pasted elements to have new unique IDs, so that they are independent from their source.

### Auto-Save

64. As a user, I want my canvas to save automatically 500ms after I stop making changes, so that I never have to think about saving.
65. As a user, I want the full canvas (all elements) to be saved on each auto-save, so that the saved state is always consistent.

### SVG Export/Import

66. As a user, I want to export a canvas as an SVG file, so that I can use the diagram in documents or presentations.
67. As a user, I want exported SVGs to be valid and viewable in any SVG viewer, so that they are useful outside the app.
68. As a user, I want to import a previously exported SVG to restore a fully editable canvas, so that SVG files act as a portable backup format.

### Data Safety

69. As a user, I want MongoDB journaling to protect my data against crashes and power loss, so that I don't lose work unexpectedly.
70. As a user, I want a `backup.sh` script that runs `mongodump` to create a timestamped backup, so that I can snapshot my data before risky operations.
71. As a user, I want the backup script to store snapshots in a `./backups/` directory with the date and time in the folder name, so that I can identify and restore a specific snapshot.

---

## Implementation Decisions

- **Backend:** Python + FastAPI. Route handlers are regular `def` functions (not `async def`); FastAPI runs them automatically in a thread pool.
- **Database driver:** PyMongo (sync). Motor (async) was rejected in favour of PyMongo's simpler, better-documented API — concurrency is not a concern for a single-user local tool.
- **MongoDB:** Runs locally at `mongodb://localhost:27017/local-draw`. Connection URI is overridable via the `MONGO_URL` environment variable; no `.env` file required.
- **Canvas document shape:** Elements are embedded directly in the canvas document as a JSON array. The full array is replaced on every save — no partial updates, no diffing.
- **Thumbnail:** Stored as a base64 string in the canvas document. The list-page endpoint returns only metadata fields (id, name, thumbnail, updatedAt) — never the elements array.
- **Image assets:** Stored as files in `backend/uploads/`. The canvas element stores only the filename. FastAPI serves image files at `GET /uploads/:filename`. GridFS was rejected as unnecessary complexity.
- **Auto-save:** 500ms debounce. Sends a full `PUT /api/canvases/:id` with the complete elements array and updated thumbnail. No `beforeunload` save — async fetch cannot reliably complete on tab close, and the 500ms debounce makes it unnecessary.
- **Static file serving:** FastAPI serves `frontend/` as static files at `/` and the API at `/api`. One process, no CORS issues.
- **Project layout:** `backend/` for all Python/server code, `frontend/` for all HTML/CSS/JS. `start.sh` at the root starts everything.
- **Fonts:** Exactly 20 system/web-safe fonts across four categories (sans-serif, serif, monospace, display/cursive). No external font loading.
- **Undo/redo:** Full scene-graph snapshot on every action, 50-step limit, session-only (resets on canvas close).
- **Rendering:** HTML5 Canvas 2D with a retained scene graph in memory. No framework, no build step.
- **Lines/arrows:** Represented as cubic bezier curves with two optional control points (`cp1`, `cp2`). When both are null, renders as a straight line. Dragging the midpoint creates control points and bends the line into a curve.
- **Copy/paste:** In-memory only (JS variable). Paste deep-clones elements with new IDs, offset by ~10px.

### API Contract

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/canvases` | List all canvases — metadata only, no elements |
| POST | `/api/canvases` | Create a new canvas |
| GET | `/api/canvases/:id` | Load a single canvas with full elements array |
| PUT | `/api/canvases/:id` | Full save — replaces elements array and thumbnail |
| DELETE | `/api/canvases/:id` | Delete a canvas |
| POST | `/api/uploads` | Upload an image file — returns `{ filename }` |
| GET | `/uploads/:filename` | Serve an image asset file |

---

## Testing Decisions

Good tests verify external behaviour through stable interfaces — not internal implementation details. A test should not break when a function is renamed or an internal data structure changes; it should only break when observable behaviour changes.

### Seam 1: FastAPI API Routes (highest seam)

Integration tests using `pytest` + `httpx` (FastAPI's test client) against a real local MongoDB instance (test database, distinct from `local-draw`). Each test sets up its own data, runs an API call, and asserts on the HTTP response and database state.

What to test:
- Creating a canvas returns 201 with an id
- Listing canvases returns metadata only (no elements array in the response)
- Loading a canvas by id returns the full elements array
- Saving a canvas (PUT) replaces the elements array and updates `updatedAt`
- Deleting a canvas removes it from the list
- Uploading an image stores the file in `backend/uploads/` and returns a filename
- Fetching a stored image by filename returns the file

### Seam 2: Scene Graph Module (`scene.js`)

Unit tests for the in-memory scene graph — the core logic that all tools build on. Run with a test runner that works without a browser (e.g. Node.js + a minimal test harness, or Vitest with jsdom disabled).

What to test:
- Adding an element returns the updated scene with the new element
- Removing an element by id returns the updated scene without it
- Updating an element's properties returns the correct updated element
- Ordering operations (bring to front, send to back, bring forward, send backward) produce the correct `order` values
- Undo returns the previous scene snapshot
- Redo returns the next scene snapshot after undo
- Undo past 50 steps does not error

---

## Out of Scope

- **Element rotation** — no rotation in v1
- **Custom colour picker** — preset palette only; no hex/RGB input
- **External font loading** — system/web-safe fonts only
- **Cloud sync or remote persistence** — local only
- **Multi-user collaboration** — single user, local machine
- **Arbitrary SVG import** — only SVGs exported by this tool can be reimported
- **Mobile or touch-first UI** — desktop browser only (pinch zoom is supported but no dedicated mobile layout)
- **Authentication or access control** — no accounts, no login
- **Version history or branching** — undo/redo is session-only; no persistent version history
- **Rich text in text boxes** — plain text only

---

## Further Notes

- MongoDB journaling is enabled by default; no special configuration is needed to protect against crash-induced corruption.
- The `backup.sh` script (`mongodump` to `./backups/<timestamp>/`) is the recommended manual backup path. The SVG export/import is a secondary, MongoDB-independent backup format.
- The domain glossary in `CONTEXT.md` defines canonical terms for this project. Key terms: **Canvas**, **Scene**, **Element**, **Order**, **Viewport**, **Tool**, **Selection**, **Thumbnail**, **Image Asset**.
- Architecture decisions are recorded in `docs/adr/` — notably the choice of MongoDB over IndexedDB (ADR-0001), PyMongo over Motor (ADR-0002), and on-disk image storage over GridFS (ADR-0003).
