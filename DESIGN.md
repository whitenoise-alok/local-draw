# Local Draw — Design Document

## Overview
A local, browser-based drawing and diagramming tool (like Excalidraw) for creating diagrams and notes. Data is persisted in a local MongoDB instance via a Python/FastAPI backend. No cloud, no accounts.

---

## Platform & Stack
- **Frontend:** HTML/CSS/vanilla JS with ES modules — served as static files by FastAPI
- **Backend:** Python + FastAPI, PyMongo (sync, run in FastAPI's thread pool)
- **Database:** MongoDB at `mongodb://localhost:27017/local-draw` (overridable via `MONGO_URL` env var)
- **Rendering:** HTML5 Canvas 2D with a retained scene graph
- **No frontend build step** — JS is served as-is; no bundler required

---

## Project Structure
```
local-draw/
  start.sh                  — starts mongod (if not running) + uvicorn, prints URL
  frontend/
    index.html              — canvas list page
    canvas.html             — canvas editor
    styles.css              — all styles
    src/
      core/
        scene.js            — scene graph (elements array, CRUD)
        history.js          — undo/redo stack
        api.js              — fetch wrappers for all API calls
        export.js           — SVG export/import
      tools/
        select.js           — select, move, resize
        pan.js              — pan + zoom
        rect.js             — rectangle drawing
        text.js             — text box + inline editing
        line.js             — line + arrow drawing
        image.js            — image insertion
        eraser.js           — object eraser
      ui/
        toolbar.js          — left sidebar tool buttons
        properties.js       — top bar context-sensitive controls
        list.js             — canvas list page logic
      utils/
        geometry.js         — hit-testing, point-in-rect, point-to-curve
        colors.js           — palette definitions
        fonts.js            — font list and sizes
  backend/
    main.py                 — FastAPI app (API routes + static file mount)
    requirements.txt
    uploads/                — image asset files (git-ignored)
```

---

## Starting the App
```
./start.sh
```
`start.sh` checks if `mongod` is already running, starts it if not, then starts `uvicorn backend.main:app`. The app is available at `http://localhost:8000`.

---

## Navigation
- **Separate HTML pages:** `index.html` (list page) and `canvas.html?id=<id>` (canvas editor)
- Both served by FastAPI's static file mount at `/`
- Browser back button and bookmarkable URLs work naturally

---

## API
All API routes are under `/api`. FastAPI also mounts `frontend/` as static files at `/`, and `backend/uploads/` at `/uploads`.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/canvases` | List all canvases — returns `id`, `name`, `thumbnail`, `updatedAt` only (no elements) |
| POST | `/api/canvases` | Create a new canvas |
| GET | `/api/canvases/:id` | Load a single canvas with full elements array |
| PUT | `/api/canvases/:id` | Full save — replaces elements array and thumbnail |
| DELETE | `/api/canvases/:id` | Delete a canvas |
| POST | `/api/uploads` | Upload an image file — returns `{ filename }` |
| GET | `/uploads/:filename` | Serve an image asset file |

---

## MongoDB Document Shape

### Canvas document
```json
{
  "_id": "<ObjectId>",
  "name": "string",
  "createdAt": "ISODate",
  "updatedAt": "ISODate",
  "thumbnail": "base64 string",
  "elements": [ /* embedded element objects */ ]
}
```

Elements are embedded directly in the canvas document. The full document is replaced on every save (no partial updates).

---

## List Page
- Shows all canvases sorted by `updatedAt` descending
- Each entry displays: **name** (editable inline), **thumbnail**, **last modified date**
- Actions: **rename**, **delete** (with confirmation), **create new canvas**
- Thumbnail is a base64-encoded low-resolution preview rendered from the scene

---

## Canvas Editor

### Infinite Canvas
- Pan: spacebar + drag
- Zoom: Ctrl+scroll / pinch
- **Dot grid background** for spatial orientation (scales with zoom)
- Coordinate system uses `screenToCanvas` / `canvasToScreen` conversions accounting for pan offset and zoom scale

### Toolbar Layout
- **Left sidebar:** tool icon buttons (select, pan, rect, text, line, arrow, image, eraser)
- **Top bar:** context-sensitive property controls for selected tool/element, plus undo/redo and export buttons

---

## Element Model
Flat array of element objects embedded in the canvas document. Each element shares a base set of fields with type-specific extensions.

### Base Fields (all elements)
| Field   | Type   | Description                                          |
|---------|--------|------------------------------------------------------|
| id      | string | Unique identifier                                    |
| type    | string | `"rect"`, `"text"`, `"line"`, `"arrow"`, `"image"`  |
| x       | number | X position                                           |
| y       | number | Y position                                           |
| width   | number | Width (not used for line/arrow)                      |
| height  | number | Height (not used for line/arrow)                     |
| order   | number | Z-index for layering                                 |
| opacity | number | 0 to 1                                               |

### No rotation in v1.

### Type-Specific Fields

**Rectangle (`rect`)**
- `fillColor` — from 12-16 preset palette
- `strokeColor` — from 12-16 preset palette
- `strokeWidth` — from fixed presets: 1px, 2px, 4px, 6px, 8px
- `strokeStyle` — `"solid"`, `"dashed"`, `"dotted"`

**Text (`text`)**
- `text` — string content
- `fontFamily` — one of 20 system/web-safe fonts (see Fonts section)
- `fontSize` — one of 8 fixed size options
- `color` — from 12-16 preset palette

**Line / Arrow (`line`, `arrow`)**
- `x1`, `y1` — start point
- `x2`, `y2` — end point
- `cp1` — `null` or `{x, y}` — first cubic bezier control point
- `cp2` — `null` or `{x, y}` — second cubic bezier control point
- `strokeColor`, `strokeWidth`, `strokeStyle` — same as rect
- When `cp1`/`cp2` are `null`, renders as a straight line; when present, renders as a cubic bezier curve
- Arrow type renders an arrowhead at the end point
- Users can drag the midpoint to bend a straight line into a curve

**Image (`image`)**
- `filename` — name of the file in `backend/uploads/`
- Rendered by the browser via `<img src="/uploads/<filename>">`

---

## Tools

### Select Tool (V)
- Click to select an element
- Drag to move selected element(s)
- Resize handles: 4 corners (proportional) + 4 edge midpoints (free resize)
- For lines/arrows: drag endpoints and control point handles instead

### Pan Tool (H / Space+drag)
- Drag to pan the canvas

### Rectangle Tool (R)
- Click and drag to draw a rectangle

### Text Tool (T)
- Click to place a text box
- Inline editing via overlaid `<textarea>` positioned over the canvas
- Font and size selectable from top property bar when text is selected

### Line Tool (L)
- Click and drag to draw a straight line
- After creation, drag midpoint to curve it (creates bezier control points)

### Arrow Tool (A)
- Same as line tool but renders an arrowhead at the end point

### Image Tool (I)
- Opens file picker, POSTs the file to `/api/uploads`, inserts an image element referencing the returned filename

### Eraser Tool (E)
- Object eraser — click or drag across elements to delete entire elements

---

## Multi-Select
- Draw a selection box to select multiple elements
- Operations: **move**, **delete**, **change shared properties**, **copy/paste**

---

## Copy/Paste
- **Internal clipboard only** (in-memory JS variable)
- Ctrl+C: snapshot selected elements
- Ctrl+V: deep-clone with new IDs, offset by ~10px

---

## Ordering
- All elements have an `order` field controlling z-index
- Operations: Bring to Front, Send to Back, Bring Forward, Send Backward
- Exposed via: **top property bar buttons** + keyboard shortcuts

---

## Undo/Redo
- Full scene snapshot on every action
- **50-step history limit**
- Session-only (resets on canvas close/reopen)
- Ctrl+Z / Ctrl+Shift+Z

---

## Auto-Save
- **500ms debounce** after last change — sends a full `PUT /api/canvases/:id` with the complete elements array and updated thumbnail
- No `beforeunload` save (async fetch cannot reliably complete on tab close; 500ms debounce makes it unnecessary)

---

## SVG Export/Import
- **Round-trip own SVGs only** (not arbitrary SVG import)
- Export: generate valid SVG from scene graph + embed full scene JSON in `<metadata>` tag
- Import: parse `<metadata>` to reconstruct editable elements
- Exported SVGs are valid, viewable in other tools

---

## Colors
- **12-16 preset color palette** (no custom color picker)
- Applied to: fill, stroke, text color

## Fonts
**20 system/web-safe fonts** — no external font loading:

| Category | Fonts |
|----------|-------|
| Sans-serif | Arial, Helvetica, Verdana, Trebuchet MS, Gill Sans |
| Serif | Georgia, Times New Roman, Palatino, Garamond, Book Antiqua |
| Monospace | Courier New, Lucida Console, Monaco, Consolas |
| Display/Cursive | Impact, Comic Sans MS, Brush Script MT, Copperplate, Papyrus, Luminari |

**8 fixed font size options** (e.g. 10, 12, 14, 18, 24, 32, 48, 64px — exact values TBD during implementation)

## Stroke
- **Widths:** 5 fixed presets — 1px, 2px, 4px, 6px, 8px
- **Styles:** solid, dashed, dotted

---

## Data Safety

### Journaling
MongoDB journaling is enabled by default. Crashes and power loss will not corrupt canvas data.

### Backups
A `backup.sh` script at the project root creates a timestamped `mongodump` snapshot:
```bash
mongodump --uri="mongodb://localhost:27017/local-draw" --out="./backups/$(date +%Y-%m-%d_%H-%M-%S)"
```
Run manually before anything risky, or schedule with `crontab -e` for daily automated backups. Restore with `mongorestore`.

### SVG Export
Each canvas can be exported as a self-contained `.svg` file with the full scene JSON embedded in `<metadata>`. These files are readable in any SVG viewer and can be reimported into the app — a portable backup that is independent of MongoDB entirely.

---

## Canvas Background
- **Dot grid** — small dots at regular intervals, scales with zoom level

---

## Keyboard Shortcuts
| Key              | Action              |
|------------------|---------------------|
| V                | Select tool         |
| H / Space+drag   | Pan tool            |
| R                | Rectangle tool      |
| T                | Text tool           |
| L                | Line tool           |
| A                | Arrow tool          |
| I                | Insert image        |
| E                | Eraser tool         |
| Delete/Backspace | Delete selection    |
| Ctrl+C           | Copy                |
| Ctrl+V           | Paste               |
| Ctrl+Z           | Undo                |
| Ctrl+Shift+Z     | Redo                |
| Ctrl+]           | Bring forward       |
| Ctrl+[           | Send backward       |
| Ctrl+Shift+]     | Bring to front      |
| Ctrl+Shift+[     | Send to back        |
