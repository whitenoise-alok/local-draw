# 0003 — Canvas editor shell and infinite canvas

## What to build

The canvas editor page (`canvas.html?id=<id>`) with a working infinite canvas, pan, zoom, dot grid, and toolbar shell. The page loads the canvas by ID from `GET /api/canvases/:id` and renders its (initially empty) scene. No drawing tools are functional yet — the toolbar shows tool buttons but most are no-ops. This slice establishes the viewport, coordinate system, and rendering loop that all tools build on.

Pan activates on spacebar+drag (or with the pan tool). Zoom works via Ctrl+scroll and pinch. The dot grid scales with zoom. The coordinate system handles `screenToCanvas` and `canvasToScreen` conversions correctly accounting for both pan offset and zoom scale.

The left sidebar shows tool buttons (select, pan, rect, text, line, arrow, image, eraser). The top bar shows placeholder property controls plus undo/redo and export buttons (non-functional until later slices).

## Acceptance criteria

- [ ] `canvas.html?id=<id>` loads and displays the canvas editor for the given canvas id
- [ ] The canvas is infinite — panning reveals no edge or boundary
- [ ] Spacebar+drag pans the canvas; releasing spacebar returns to the previous tool
- [ ] Ctrl+scroll zooms in and out around the cursor position
- [ ] The dot grid is visible and scales correctly as zoom changes
- [ ] A point drawn at canvas coordinate (100, 100) appears at the correct screen position after pan and zoom
- [ ] The toolbar renders all tool icons in the left sidebar
- [ ] Pressing `H` activates the pan tool; pressing `V` activates the select tool

## Blocked by

- 0001
