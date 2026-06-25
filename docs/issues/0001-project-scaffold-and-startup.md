# 0001 — Project scaffold and startup

## What to build

Set up the complete project skeleton so every subsequent slice has a working foundation to build on. This includes the `backend/` + `frontend/` directory layout, a FastAPI app that serves the frontend as static files and exposes API routes at `/api`, a MongoDB connection using PyMongo with a hardcoded default URI (`mongodb://localhost:27017/local-draw`, overridable via `MONGO_URL`), an `uploads/` directory for image assets, and a `start.sh` script that checks whether `mongod` is already running before starting it, then launches `uvicorn` and prints the URL.

The app should start, load `http://localhost:8000` in a browser, and show a minimal placeholder page. No features yet — just the skeleton.

## Acceptance criteria

- [ ] `./start.sh` starts the app without error when MongoDB is not yet running
- [ ] `./start.sh` does not conflict when MongoDB is already running
- [ ] `http://localhost:8000` responds with an HTML page
- [ ] `GET /api/canvases` returns an empty JSON array (MongoDB connection is live)
- [ ] `backend/uploads/` directory exists and is git-ignored
- [ ] `backend/` and `frontend/` are clearly separated; no Python files in `frontend/`, no HTML/JS in `backend/`

## Blocked by

None — can start immediately.
