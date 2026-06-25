# 0007 — Image tool

## What to build

An image tool that lets the user insert an image from their local disk onto the canvas. Pressing `I` or clicking the image toolbar button opens a file picker. The selected file is uploaded via `POST /api/uploads`, which stores it in `backend/uploads/` and returns the filename. An image element is inserted at the centre of the viewport, referencing the filename. The browser renders the image by fetching it from `GET /uploads/<filename>`.

Image elements are selectable, movable, and resizable (proportional corner handles). They persist via the existing auto-save infrastructure — the element stores only the filename; the file itself lives on disk.

## Acceptance criteria

- [ ] Pressing `I` opens the system file picker
- [ ] Selecting an image file uploads it to the server and inserts the image element on the canvas
- [ ] The image renders correctly at its initial position
- [ ] The image element can be selected, moved, and resized proportionally
- [ ] Closing and reopening the canvas shows the image in its saved position (file still served from `GET /uploads/<filename>`)
- [ ] Uploading a large image (e.g. 5MB) completes without error
- [ ] `backend/uploads/` is git-ignored

## Blocked by

- 0004
