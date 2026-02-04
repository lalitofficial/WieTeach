/**
 * Migration utilities for strokes
 * Handles conversion from legacy icon format to new icon type system
 */

/**
 * Migrate legacy icon shapes to new type:"icon" system
 * Called when loading slides to ensure all icons use consistent format
 *
 * Legacy format: type:"shape", shape:"icon", iconId:"star", w, h
 * New format: type:"icon", icon:"star", width, height, rotation, color, alpha
 *
 * @param {Object} slide - slide object with strokes array
 * @returns {Object} - same slide object with migrated strokes
 */
export function migrateIconShapes(slide) {
  if (!slide || !slide.strokes) return slide;

  slide.strokes = slide.strokes.map((stroke) => {
    // Check for legacy icon format
    if (stroke.type === "shape" && stroke.shape === "icon") {
      const migratedStroke = {
        ...stroke,
        type: "icon",
        icon: stroke.iconId || "star",
        width: stroke.w || 32,
        height: stroke.h || 32,
        rotation: stroke.rotation || 0,
        // Preserve existing properties
        color: stroke.color || "#000000",
        alpha: stroke.alpha || 1,
        size: stroke.size || 2,
      };

      // Remove old properties
      delete migratedStroke.shape;
      delete migratedStroke.iconId;
      delete migratedStroke.w;
      delete migratedStroke.h;
      delete migratedStroke.x2; // Remove line-specific property if present
      delete migratedStroke.y2;

      console.log(
        `[Migration] Converted icon shape ${stroke.id} to new type:icon format`,
      );
      return migratedStroke;
    }

    return stroke;
  });

  return slide;
}

/**
 * Validate stroke structure and fix common issues
 * @param {Object} stroke - stroke to validate
 * @returns {Object} - validated stroke
 */
export function validateStroke(stroke) {
  if (!stroke) return stroke;

  // Ensure required properties exist
  if (!stroke.id) stroke.id = `stroke_${Date.now()}_${Math.random()}`;
  if (!stroke.tool) stroke.tool = "draw";
  if (!stroke.color) stroke.color = "#000000";
  if (stroke.alpha === undefined) stroke.alpha = 1;

  // Validate type-specific properties
  if (stroke.type === "icon") {
    if (!stroke.icon) stroke.icon = "star";
    if (stroke.width === undefined) stroke.width = 32;
    if (stroke.height === undefined) stroke.height = 32;
    if (stroke.rotation === undefined) stroke.rotation = 0;
    if (stroke.size === undefined) stroke.size = 2;
    // Clean up old properties if they exist
    delete stroke.shape;
    delete stroke.iconId;
  } else if (stroke.type === "shape") {
    if (!stroke.shape) stroke.shape = "rectangle";
    if (stroke.x === undefined) stroke.x = 0;
    if (stroke.y === undefined) stroke.y = 0;
    if (stroke.w === undefined) stroke.w = 32;
    if (stroke.h === undefined) stroke.h = 32;
    if (stroke.size === undefined) stroke.size = 2;
  } else {
    // Path type (default)
    if (!Array.isArray(stroke.points)) stroke.points = [];
    if (stroke.size === undefined) stroke.size = 2;
  }

  return stroke;
}

/**
 * Check if a stroke needs migration
 * @param {Object} stroke - stroke to check
 * @returns {boolean}
 */
export function needsMigration(stroke) {
  return stroke.type === "shape" && stroke.shape === "icon";
}

/**
 * Migrate entire deck if needed
 * @param {Object} deck - deck object with slides array
 * @returns {Object} - same deck with migrated slides
 */
export function migrateDeck(deck) {
  if (!deck || !deck.slides) return deck;

  console.log("[Migration] Starting deck migration...");
  const migratedCount = deck.slides.reduce((count, slide) => {
    const beforeCount =
      slide.strokes?.filter((s) => needsMigration(s)).length || 0;
    migrateIconShapes(slide);
    return count + beforeCount;
  }, 0);

  if (migratedCount > 0) {
    console.log(
      `[Migration] Migrated ${migratedCount} icon shapes to new format`,
    );
  }

  return deck;
}
