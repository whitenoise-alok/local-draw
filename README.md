# Local Draw

A local, browser-based drawing tool backed by FastAPI and MongoDB. No cloud, no accounts — everything stays on your machine.

---

## Prerequisites

- **Python 3.12+**
- **uv** — `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **MongoDB** — see options below

### Install MongoDB (macOS)

```bash
brew tap mongodb/brew
brew install mongodb-community
```

Or download from https://www.mongodb.com/try/download/community.

---

## Setup

```bash
cd backend
uv sync
cd ..
```

---

## Running the app

```bash
./start.sh
```

This will:
1. Start `mongod` if it isn't already running
2. Launch the server at `http://localhost:8000`

Open `http://localhost:8000` in your browser.

---

## Testing the acceptance criteria

### Issue #1 — Project scaffold

With the app running, open a second terminal:

**1. Page loads**
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/
# expect: 200
```

**2. `GET /api/canvases` returns an empty array**
```bash
curl -s http://localhost:8000/api/canvases
# expect: []
```

**3. MongoDB connection is live**
```bash
curl -s -X POST http://localhost:8000/api/canvases \
  -H "Content-Type: application/json" \
  -d '{"name": "test"}' | python3 -m json.tool

curl -s http://localhost:8000/api/canvases | python3 -m json.tool
# expect: array with one entry, no "elements" field
```

**4. `backend/uploads/` directory exists**
```bash
ls backend/uploads/
# expect: empty directory (no error)
```

**5. No conflict when MongoDB is already running**
```bash
./start.sh
# expect: "MongoDB is already running." — no error
```

---

### Issue #2 — Canvas list page

Open `http://localhost:8000` in a browser, then:

**1. List page renders**
- You should see the "Local Draw" header and a "+ New canvas" button.
- If no canvases exist, the empty-state message appears.

**2. Create a canvas**
- Click **+ New canvas** — you should be taken to `canvas.html?id=<id>`.
- Click the back link to return to the list.
- The new canvas appears in the list with the name "Untitled".

**3. Rename a canvas**
- Click the canvas name — it becomes editable (blue outline).
- Type a new name and press **Enter** or click away.
- The new name persists after a page reload.

**4. Delete a canvas**
- Hover over a canvas item to reveal the **Delete** button.
- Click **Delete** — confirm the prompt.
- The item disappears without a page reload.

**5. Canvases are sorted by most recently modified**
```bash
# Create two canvases and rename the first — it should move to the top
curl -s -X POST http://localhost:8000/api/canvases \
  -H "Content-Type: application/json" -d '{"name": "A"}' | python3 -m json.tool

curl -s -X POST http://localhost:8000/api/canvases \
  -H "Content-Type: application/json" -d '{"name": "B"}' | python3 -m json.tool

curl -s http://localhost:8000/api/canvases | python3 -m json.tool
# expect: B first, A second (B was created last)
```

**6. API — no `elements` field in list response**
```bash
curl -s http://localhost:8000/api/canvases | python3 -m json.tool
# expect: each object has id, name, updatedAt, thumbnail — no "elements" key
```

---

### Issue #3 — Canvas editor shell and infinite canvas

Create a canvas first if you don't have one:
```bash
curl -s -X POST http://localhost:8000/api/canvases \
  -H "Content-Type: application/json" -d '{"name": "Test"}' | python3 -m json.tool
# copy the "id" from the response
```

Open `http://localhost:8000/canvas.html?id=<id>` in a browser, then:

**1. Editor loads**
- You should see the topbar with the canvas name, undo/redo/export buttons, and the left toolbar.
- The canvas area shows a dot grid.

**2. Toolbar — all 8 tools visible**
- Left sidebar has: Select (↖), Pan (hand), Rectangle, Text, Line, Arrow, Image, Eraser.
- Clicking a tool highlights it in blue.

**3. Keyboard shortcuts**
- Press `V` — Select tool becomes active.
- Press `H` — Pan tool becomes active.

**4. Pan with the pan tool**
- Click the pan tool (or press `H`).
- Click and drag anywhere on the canvas — the dot grid moves with the mouse.
- Release — grid stays at the new position.

**5. Spacebar pan**
- While on any tool, hold `Space` — cursor changes to a hand.
- Drag to pan.
- Release `Space` — returns to the previous tool.

**6. Zoom**
- Ctrl+scroll (or pinch on trackpad) — canvas zooms in/out around the cursor.
- The dot grid scales with zoom (dots get further apart as you zoom in).

**7. Coordinate system**
- Open the browser console and run:
  ```js
  import('/src/editor.js').then(m => console.log(m.canvasToScreen(100, 100)))
  ```
- Pan and zoom, run again — the screen coordinates change correctly relative to pan/zoom.

**8. No edge or boundary**
- Pan in any direction indefinitely — no edge, no boundary, no scroll bar.

---

## Project structure

```
local-draw/
  start.sh                    — starts mongod + uvicorn
  frontend/
    index.html                — canvas list page
    canvas.html               — canvas editor
    styles.css
    src/
      editor.js               — viewport, pan, zoom, grid, tool management
      core/
        api.js                — fetch wrappers for all API calls
        scene.js              — scene graph (elements CRUD)
      ui/
        list.js               — canvas list page logic
  backend/
    main.py                   — FastAPI app
    pyproject.toml            — uv project config
    uv.lock
    uploads/                  — image assets (git-ignored, auto-created)
```

---

## Stopping the app

`Ctrl+C` stops uvicorn. To also stop MongoDB:

```bash
brew services stop mongodb-community
# or, if started with --fork:
mongod --shutdown --dbpath ~/data/db
```
