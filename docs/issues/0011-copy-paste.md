# 0011 — Copy/paste

## What to build

In-memory copy/paste for selected elements. Ctrl+C snapshots the current selection into a JS variable (internal clipboard only — no system clipboard). Ctrl+V deep-clones those elements with new unique IDs, offsets them by ~10px in both axes, and adds them to the scene as the new selection. Paste triggers auto-save.

## Acceptance criteria

- [ ] Ctrl+C with one or more elements selected stores a snapshot of those elements
- [ ] Ctrl+V pastes deep-cloned elements with new IDs, offset by ~10px from the originals
- [ ] Pasted elements become the new selection immediately after paste
- [ ] Modifying a pasted element does not affect the original
- [ ] Pressing Ctrl+V multiple times produces multiple independent copies, each offset from the previous paste
- [ ] Ctrl+C with nothing selected does nothing
- [ ] Ctrl+V with nothing on the clipboard does nothing
- [ ] Paste triggers auto-save

## Blocked by

- 0004
