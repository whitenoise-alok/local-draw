# 0004 — Rectangle tool and auto-save (golden path)

## What to build

The first complete tool plus the first full persistence round-trip. Drawing a rectangle, selecting and resizing it, changing its properties, and reopening the canvas should all work end-to-end.

**Rectangle tool (R):** Click and drag to draw a rectangle on the canvas.

**Select tool (V):** Click a rectangle to select it. Drag to move it. Resize via 8 handles — 4 corners (proportional) and 4 edge midpoints (free axis). The top property bar shows fill colour, stroke colour, stroke width, stroke style, opacity, and order controls for the selected rectangle.

**Ordering:** Bring to Front, Send to Back, Bring Forward, Send Backward — via property bar buttons and keyboard shortcuts (Ctrl+], Ctrl+[, Ctrl+Shift+], Ctrl+Shift+[).

**Auto-save:** 500ms after the last change, the full elements array is sent via `PUT /api/canvases/:id`. A thumbnail is rendered from the scene and included in the save payload. The list page then shows the thumbnail.

This slice closes the thumbnail gap left by issue 0002 — once auto-save is in place, the list page will show canvas previews.

## Acceptance criteria

- [ ] Pressing `R` activates the rectangle tool; click and drag draws a rectangle
- [ ] Pressing `V` selects a rectangle; drag moves it; 8 resize handles appear
- [ ] Corner handles resize proportionally; edge handles resize on one axis
- [ ] Property bar shows fill colour (preset palette), stroke colour, stroke width (5 presets), stroke style (solid/dashed/dotted), opacity slider, and order buttons
- [ ] Changes to any property update the rectangle immediately on canvas
- [ ] Ordering controls change the element's z-index correctly
- [ ] 500ms after the last change, a `PUT /api/canvases/:id` request is made with the full elements array
- [ ] Closing and reopening the canvas restores all rectangles in their saved state
- [ ] The list page shows a thumbnail preview after the first auto-save

## Blocked by

- 0002
- 0003
