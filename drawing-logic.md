Drawing Logic — Smooth, Low‑Latency Strokes

This app uses an imperative, rAF‑batched drawing pipeline to keep pointer input smooth and to avoid layout/re-render jank. The key ideas mirror what high‑performance whiteboards (like PW’s) do: minimize work per pointer event, batch actual painting to animation frames, and avoid any framework state updates inside pointermove.

1) Input path (zero React/Vue re‑renders)
- Pointer events go directly to the canvas, not to component state.
- We capture the pointer so the stream is continuous even if it leaves the canvas.
- We do not call expensive functions inside pointermove; we only append points to an array.

Flow
- pointerdown: startStroke() creates a stroke record and seeds the first point.
- pointermove: push x/y into pendingPoints.
- requestAnimationFrame: flushStroke() drains pendingPoints and paints.
- pointerup: flushStroke() finalizes the stroke, then the stroke is committed to history.

2) rAF‑batched rendering (no per‑event painting)
- Each pointermove only enqueues points and schedules a single rAF flush.
- This caps rendering to the display refresh rate (60fps) and keeps the main thread stable.
- Code path in App.vue:
  - state.pendingPoints collects points.
  - scheduleFlush() + flushStroke() paint on rAF.

3) Smoothing with quadratic mid‑points
- To smooth jagged lines, we draw quadratic segments between mid‑points:
  - Given three points (p0, p1, p2), we draw a quadratic curve from the midpoint of p0‑p1 to the midpoint of p1‑p2 with p1 as the control point.
- This produces visually smooth strokes without heavy math.
- Code path:
  - drawSegment(x0,y0,x1,y1,x2,y2) uses quadraticCurveTo().

4) Low‑latency canvas settings
- Context is created with { desynchronized: true } to reduce latency.
- We avoid transforms and layout changes during drawing.
- No DOM writes on pointermove.

5) Composite operations for tools
- Pen/Highlighter: source‑over with alpha (highlighter is low alpha).
- Eraser: destination‑out (hardware‑accelerated cutout).
- This avoids expensive path subtraction.

6) Overlay canvas for cursor + previews
- The cursor ring, selection rectangle, and shape previews are drawn on an overlay canvas.
- The ink canvas only receives permanent strokes, so redraw cost is minimal.

7) Bounding boxes and hit‑testing
- Each stroke tracks bbox to avoid O(n) point scans on selection.
- Selection checks intersection vs bbox (cheap).

Why it feels smooth
- Input sampling is continuous (pointer capture).
- Rendering is frame‑bounded (rAF batching).
- Smoothing happens in GPU‑accelerated path drawing (quadratic curves).
- No component re-renders on pointermove.
- Desynchronized context reduces the input‑to‑pixel delay.

Where to look in code
- `src/App.vue`
  - `handlePointerDown/Move/Up`
  - `scheduleFlush` / `flushStroke`
  - `drawSegment` and `renderStroke`
  - `renderOverlay`

If you want even smoother strokes:
- Add point simplification (Ramer–Douglas–Peucker) on pointerup.
- Use velocity‑based width (pressure/velocity curves).
- Use worker‑side smoothing for very long strokes.
