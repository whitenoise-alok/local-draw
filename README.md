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
# Install Python dependencies
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

Open `http://localhost:8000` in your browser — you should see the placeholder page.

---

## Testing the acceptance criteria (Issue #1)

With the app running (`./start.sh`), open a second terminal and run:

**1. Placeholder page loads**
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/
# expect: 200
```

**2. `GET /api/canvases` returns an empty array**
```bash
curl -s http://localhost:8000/api/canvases
# expect: []
```

**3. MongoDB connection is live (create and list a canvas)**
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

**5. Re-running `./start.sh` when MongoDB is already running**
```bash
./start.sh
# expect: "MongoDB is already running." — no error or port conflict
```

---

## Project structure

```
local-draw/
  start.sh                  — starts mongod + uvicorn
  frontend/
    index.html              — canvas list page (placeholder for now)
    styles.css
    src/                    — JS modules (populated in later issues)
  backend/
    main.py                 — FastAPI app
    pyproject.toml          — uv project config
    uv.lock
    uploads/                — image assets (git-ignored, auto-created)
```

---

## Stopping the app

`Ctrl+C` stops uvicorn. To also stop MongoDB:

```bash
brew services stop mongodb-community
# or, if started with --fork:
mongod --shutdown --dbpath ~/data/db
```
