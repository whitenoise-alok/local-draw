# 0009 — Undo/redo

## What to build

A 50-step undo/redo stack based on full scene snapshots. Every action that mutates the scene (draw, move, resize, delete, property change) pushes a snapshot onto the stack. Ctrl+Z restores the previous snapshot; Ctrl+Shift+Z reapplies the next one. The stack is session-only — it resets when the canvas is closed or reopened. Undo/redo triggers auto-save so the restored state is persisted.

## Acceptance criteria

- [ ] Ctrl+Z undoes the last action and redraws the canvas to the previous state
- [ ] Ctrl+Shift+Z redoes an undone action
- [ ] Up to 50 undo steps are available; steps beyond 50 are silently dropped (oldest first)
- [ ] Pressing Ctrl+Z at the beginning of history does nothing (no error)
- [ ] Pressing Ctrl+Shift+Z at the end of history does nothing (no error)
- [ ] Performing a new action after undo clears the redo stack
- [ ] Undo/redo triggers auto-save; the restored state persists across reopen

## Blocked by

- 0004
