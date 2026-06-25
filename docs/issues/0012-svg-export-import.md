# 0012 — SVG export/import

## What to build

Export a canvas as a valid SVG file and reimport it to restore a fully editable scene. On export, the full scene JSON is embedded in an SVG `<metadata>` tag. The exported file is a valid SVG viewable in any browser or design tool. On import, the app parses the `<metadata>` to reconstruct all elements exactly as they were — this is a round-trip format, not arbitrary SVG import.

The export button lives in the top bar of the canvas editor. Import is triggered from the canvas list page or a menu option.

All element types must survive the round-trip: rect, text, line, arrow, and image. For image elements, the embedded metadata stores the filename; the image file itself must exist in `backend/uploads/` on the machine where the SVG is imported.

## Acceptance criteria

- [ ] Clicking Export downloads a `.svg` file named after the canvas
- [ ] The exported SVG is valid and renders correctly when opened in a browser
- [ ] The exported SVG contains a `<metadata>` block with the full scene JSON
- [ ] Importing the SVG into the app restores all elements (rect, text, line, arrow, image) with their exact properties
- [ ] A round-trip export → import produces a scene visually identical to the original
- [ ] The imported scene is fully editable (elements can be moved, resized, deleted)
- [ ] Attempting to import an SVG without `<metadata>` shows a clear error

## Blocked by

- 0004
- 0005
- 0006
- 0007
