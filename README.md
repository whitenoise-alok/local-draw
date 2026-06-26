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

## Project structure

```
local-draw/
  start.sh                    — starts mongod + uvicorn
  frontend/
    index.html                — canvas list page
    canvas.html               — canvas editor (placeholder until issue #3)
    styles.css
    src/
      core/
        api.js                — fetch wrappers for all API calls
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
