# 0010 — Multi-select and ordering

## What to build

The ability to select multiple elements at once by drawing a selection box, and to operate on the group. When the select tool is active and the user drags on empty canvas space, a selection rectangle appears. All elements fully or partially within the box are selected when the drag ends. The group can then be moved together, deleted together, or have a shared property changed (e.g. changing stroke colour applies to all selected elements that have a stroke colour).

Ordering controls (Bring to Front, Send to Back, Bring Forward, Send Backward) should also work on multi-selections — all selected elements shift in order together.

All group operations trigger auto-save.

## Acceptance criteria

- [ ] Dragging on empty canvas space draws a visible selection box
- [ ] Releasing the drag selects all elements within (or intersecting) the selection box
- [ ] Dragging any selected element moves the entire selection together
- [ ] Delete/Backspace deletes all selected elements at once
- [ ] Changing a shared property in the property bar applies it to all selected elements
- [ ] Ordering controls (Bring to Front, etc.) apply to all selected elements
- [ ] All multi-select operations trigger auto-save

## Blocked by

- 0004
