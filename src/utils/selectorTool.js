/**
 * SelectorTool - Utility for handling selection logic
 * Encapsulates selection operations to reduce code duplication
 * between pointer and select tool handlers
 */

export class SelectorTool {
  /**
   * Check if point is within an existing selection bounds
   * @param {Object} point - {x, y}
   * @param {Object} selectionBounds - {x, y, w, h, right, bottom}
   * @returns {boolean}
   */
  static canSelectAt(point, selectionBounds) {
    if (!selectionBounds) return false;
    return (
      point.x >= selectionBounds.x &&
      point.x <= selectionBounds.right &&
      point.y >= selectionBounds.y &&
      point.y <= selectionBounds.bottom
    );
  }

  /**
   * Get resize handle at point (if any)
   * Must be implemented in App.vue context with getSelectionHandleAt
   * This is a placeholder that should be injected
   * @param {Object} point - {x, y}
   * @param {Function} getHandleAtFn - function to detect handle at point
   * @returns {string|null} - handle name or null
   */
  static getHandleAt(point, getHandleAtFn) {
    if (!getHandleAtFn) return null;
    return getHandleAtFn(point);
  }

  /**
   * Create new selection rectangle from point
   * @param {Object} point - {x, y}
   * @param {string} mode - "select" or "erase"
   * @returns {Object} - {mode, x0, y0, x1, y1}
   */
  static beginSelection(point, mode = "select") {
    return {
      mode,
      x0: point.x,
      y0: point.y,
      x1: point.x,
      y1: point.y,
    };
  }

  /**
   * Normalize selection rectangle and return selected stroke IDs
   * Must be implemented in App.vue context
   * This is a wrapper signature for documentation
   * @param {Object} selectionRect - {mode, x0, y0, x1, y1}
   * @param {Array} strokes - all strokes in slide
   * @param {Function} normalizeRectFn - function to normalize rect
   * @param {Function} rectsIntersectFn - function to test rect intersection
   * @param {Function} getStrokeBoundsFn - function to get bounds
   * @param {Function} toRectFn - function to convert bounds to rect
   * @returns {Array} - selected stroke IDs
   */
  static finalizeSelection(
    selectionRect,
    strokes,
    normalizeRectFn,
    rectsIntersectFn,
    getStrokeBoundsFn,
    toRectFn,
  ) {
    const rect = normalizeRectFn(
      selectionRect.x0,
      selectionRect.y0,
      selectionRect.x1,
      selectionRect.y1,
    );

    if (selectionRect.mode === "select") {
      return strokes
        .filter(
          (stroke) =>
            stroke.tool !== "eraser" &&
            rectsIntersectFn(rect, toRectFn(getStrokeBoundsFn(stroke))),
        )
        .map((stroke) => stroke.id);
    }

    // For erase mode, just return empty array - erase is handled separately
    return [];
  }

  /**
   * Check if we should handle selection (for tool routing)
   * @param {string} tool - current tool name
   * @returns {boolean}
   */
  static isSelectionTool(tool) {
    return tool === "pointer" || tool === "select";
  }
}
