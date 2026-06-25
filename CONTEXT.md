# Local Draw

A local diagramming and note-taking tool. All data lives on the user's own machine — no cloud, no accounts.

## Language

### Canvas

**Canvas**:
A named, persistent drawing surface that contains a collection of elements. Each canvas has its own infinite coordinate space and is stored as a single document in MongoDB.
_Avoid_: Document, board, diagram, file

**Scene**:
The complete ordered collection of elements belonging to a canvas at a point in time. The scene is what gets saved and restored.
_Avoid_: Drawing, content, state

**Thumbnail**:
A small low-resolution preview of a canvas, rendered from the scene and stored as a base64 string alongside the canvas in MongoDB. Used on the list page — never for editing.
_Avoid_: Preview, snapshot

### Elements

**Element**:
A single drawable object on a canvas. Every element has a type (`rect`, `text`, `line`, `arrow`, `image`), a position, an order, and an opacity.
_Avoid_: Shape, object, node, item

**Order**:
A numeric z-index field on every element that determines rendering depth when elements overlap. Higher order renders on top.
_Avoid_: Z-index, layer, depth, stacking order

**Image Asset**:
A binary file uploaded from the user's local disk, stored in `backend/uploads/` on the server filesystem. An element of type `image` references an image asset by its filename.
_Avoid_: Blob, attachment, upload

### Interaction

**Viewport**:
The visible window into the canvas coordinate space, defined by a pan offset and a zoom scale. Changing the viewport does not modify the scene.
_Avoid_: View, camera, frame

**Tool**:
The active interaction mode that determines how pointer events on the canvas are interpreted (e.g. select, pan, rect, text, line, arrow, image, eraser). Only one tool is active at a time.
_Avoid_: Mode, cursor

**Selection**:
The set of elements currently targeted for operations such as move, resize, delete, or property change. Selection is session-only and never persisted.
_Avoid_: Focus, highlight, active elements
