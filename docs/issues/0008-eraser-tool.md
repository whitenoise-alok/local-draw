# 0008 — Eraser tool

## What to build

An object eraser tool that deletes entire elements on click or drag. Pressing `E` activates the eraser. Clicking an element deletes it immediately. Dragging the eraser across the canvas deletes every element the cursor passes over. Deletion triggers the auto-save debounce.

## Acceptance criteria

- [ ] Pressing `E` activates the eraser tool; cursor changes to indicate eraser mode
- [ ] Clicking an element deletes it; the canvas redraws immediately
- [ ] Dragging across multiple elements deletes all elements touched during the drag
- [ ] Deleting elements triggers auto-save
- [ ] Deleted elements do not reappear after reopen

## Blocked by

- 0004
