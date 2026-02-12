/**
 * PipeScanner Web - Configuration & Constants
 * @module config
 */

/** Application version */
export const APP_VERSION = '1.0.0';

/** Application name */
export const APP_NAME = 'PipeScanner Web';

// ─── Coordinate Constraints (FR-P1A-002) ─────────────────────

/** Minimum coordinate value (meters) */
export const COORD_MIN = -100.000;

/** Maximum coordinate value (meters) */
export const COORD_MAX = 100.000;

/** Coordinate decimal places */
export const COORD_PRECISION = 3;

// ─── Point Constraints ───────────────────────────────────────

/** Maximum number of feature points (NFR-P1A-007) */
export const MAX_POINTS = 100;

/** Maximum memo length (FR-P1A-002) */
export const MEMO_MAX_LENGTH = 50;

// ─── 3D Viewer Settings (FR-P1A-005, FR-P1A-006, FR-P1A-007) ─

/** Feature point sphere diameter (meters) */
export const POINT_DIAMETER = 0.05;

/** Feature point color - yellow (FR-P1A-005) */
export const POINT_COLOR = 0xFFD700;

/** Route line color - red (FR-P1A-005) */
export const ROUTE_COLOR = 0xFF0000;

/** Route line width (pixels) */
export const ROUTE_LINE_WIDTH = 2;

/** Grid interval (meters) */
export const GRID_SIZE = 1;

/** Grid divisions count */
export const GRID_DIVISIONS = 20;

/** Camera field of view */
export const CAMERA_FOV = 60;

/** Camera near plane */
export const CAMERA_NEAR = 0.1;

/** Camera far plane */
export const CAMERA_FAR = 1000;

/** Ambient light color & intensity (FR-P1A-005) */
export const AMBIENT_LIGHT_COLOR = 0xffffff;
export const AMBIENT_LIGHT_INTENSITY = 0.6;

/** Directional light color, intensity & position (FR-P1A-005) */
export const DIR_LIGHT_COLOR = 0xffffff;
export const DIR_LIGHT_INTENSITY = 0.8;
export const DIR_LIGHT_POSITION = { x: 5, y: 5, z: 5 };

/** Axis helper length (meters) */
export const AXIS_LENGTH = 1;

// ─── View Presets (FR-P1A-007) ───────────────────────────────

export const VIEW_PRESETS = {
  front: { x: 0, y: 0, z: 5 },
  top:   { x: 0, y: 5, z: 0 },
  side:  { x: 5, y: 0, z: 0 },
  iso:   { x: 3, y: 3, z: 3 }
};

// ─── LocalStorage (FR-P1A-010) ───────────────────────────────

/** LocalStorage key for project data */
export const STORAGE_KEY = 'pipe_scanner_project';

// ─── Export Settings (FR-P1A-008, FR-P1A-009) ────────────────

/** CSV character encoding (UTF-8 BOM for Excel) */
export const CSV_BOM = '\uFEFF';

/** DXF layer name */
export const DXF_LAYER_NAME = 'PIPE_ROUTE';

/** Export filename prefix */
export const EXPORT_FILENAME_PREFIX = 'pipe_route';
