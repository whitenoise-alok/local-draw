# 0005 — Text tool

## What to build

A text tool that lets the user place a text box on the canvas and type into it inline. Clicking the canvas with the text tool active places a text element and immediately opens it for editing via an overlaid `<textarea>` positioned and sized to match the element on screen. Clicking away or pressing Escape confirms the text.

When a text element is selected, the top property bar shows: font family (20 options), font size (8 fixed options), text colour (preset palette), opacity, and order controls.

Text elements persist via the existing auto-save infrastructure from issue 0004.

## Acceptance criteria

- [ ] Pressing `T` activates the text tool
- [ ] Clicking the canvas places a text element and opens an inline textarea immediately
- [ ] Text typed in the textarea appears on the canvas
- [ ] Clicking away or pressing Escape confirms the text and closes the textarea
- [ ] Double-clicking an existing text element reopens it for editing
- [ ] Property bar shows 20 font family options; changing font updates the element immediately
- [ ] Property bar shows 8 font size options; changing size updates the element immediately
- [ ] Colour, opacity, and order controls work the same as for rectangles
- [ ] Text elements survive a canvas close and reopen

## Blocked by

- 0004
