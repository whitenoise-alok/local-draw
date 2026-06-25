# 0006 — Line and Arrow tool

## What to build

Two tools for drawing connections. The line tool draws a straight line; the arrow tool draws the same but with an arrowhead at the endpoint. Both are represented as cubic bezier curves internally — when both control points are null the element renders as a straight line; dragging the midpoint creates control points and bends it into a curve.

**Line tool (L):** Click and drag to draw a straight line. After creation, the user can drag the midpoint handle to bend the line into a bezier curve.

**Arrow tool (A):** Identical to the line tool but renders an arrowhead at the end point.

When a line or arrow is selected, the select tool shows endpoint handles and (if curved) control point handles rather than corner/edge resize handles. The property bar shows stroke colour, stroke width, and stroke style.

Lines and arrows persist via the existing auto-save infrastructure.

## Acceptance criteria

- [ ] Pressing `L` activates the line tool; click and drag draws a straight line
- [ ] Pressing `A` activates the arrow tool; produces an identical line with an arrowhead at the endpoint
- [ ] After drawing, dragging the midpoint handle bends the line into a smooth curve
- [ ] The curve remains smooth (cubic bezier) and the midpoint handle stays draggable after bending
- [ ] Selecting a line/arrow shows endpoint handles; dragging an endpoint moves it
- [ ] Property bar shows stroke colour, stroke width (5 presets), and stroke style (solid/dashed/dotted)
- [ ] Lines and arrows survive a canvas close and reopen in their saved state

## Blocked by

- 0004
