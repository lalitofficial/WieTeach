/**
 * Stroke type constants to replace magic strings
 * Usage: if (stroke.type === STROKE_TYPES.ICON) { ... }
 */
export const STROKE_TYPES = {
  ICON: "icon",
  SHAPE: "shape",
  PATH: "path",
};

/**
 * Shape type constants for geometric shapes
 */
export const SHAPE_TYPES = {
  LINE: "line",
  ELLIPSE: "ellipse",
  RECTANGLE: "rectangle",
  ICON: "icon", // Legacy icon shape
};

/**
 * Transform mode constants
 */
export const TRANSFORM_MODES = {
  MOVE: "move",
  SCALE: "scale",
  ROTATE: "rotate",
};

/**
 * Selection rectangle modes
 */
export const SELECTION_MODES = {
  SELECT: "select",
  ERASE: "erase",
};

/**
 * Scale handle positions
 */
export const SCALE_HANDLES = {
  TOP_LEFT: "tl",
  TOP_RIGHT: "tr",
  BOTTOM_LEFT: "bl",
  BOTTOM_RIGHT: "br",
  TOP: "t",
  BOTTOM: "b",
  LEFT: "l",
  RIGHT: "r",
  ROTATE: "rot",
};
