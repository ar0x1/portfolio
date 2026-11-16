/**
 * Every fixed design value from the original single-file build.
 * These are locked: changing them changes the choreography.
 */
export const RENDERER = {
  fov: 50,
  near: 0.1,
  far: 100,
  exposure: 2.2,
  maxPixelRatio: 2,
  fogDensity: 0.01,
  startPosition: [0, 0.2, 3.0] as const,
} as const;

export const MOTION = {
  scrollLerp: 0.025,
  mouseLerp: 0.05,
  cursorLerp: 0.2,
  cameraLerp: 0.025,
  mouseTiltY: 0.25,
  mouseTiltX: 0.15,
  framingEaseEnd: 0.28,
  lookAtXOffset: -0.9,
  lookAtY: -0.15,
  /** Full 360° turns across the whole scroll. 2 = 720° of travel. */
  orbitTurns: 2,
  /** Vertical sine cycles across the scroll (lifts the camera twice). */
  orbitYCycles: 2,
  orbit: { radius: 4.2, radiusDip: 0.6, baseY: 0.35, yArc: 0.8 },
} as const;

export const MODEL = {
  maxDimension: 3.5,
  pivotY: -0.4,
  roughness: 0.42,
  metalness: 0.92,
  anisotropy: 16,
} as const;

export const SPARKS = {
  count: 450,
  size: 0.025,
  opacity: 0.85,
  orangeRatio: 0.6,
} as const;

export const SLIDE_RANGES = [
  [-0.10, 0.12],
  [0.28, 0.40],
  [0.56, 0.68],
  [0.84, 1.05],
] as const;

export const NAV_TARGETS = [0.0, 0.34, 0.62, 0.94] as const;
export const CHAR_STAGGER = 0.035;

/**
 * Interludes live inside the empty gaps between slide windows,
 * so no phase loses its moment:
 *   slides: 0.00-0.12 | 0.28-0.40 | 0.56-0.68 | 0.84-1.00
 *   work:           0.42-0.55
 *   marquee:                                0.70-0.83
 */
export const WORK_RANGE: readonly [number, number] = [0.42, 0.55];
export const MARQUEE_RANGE: readonly [number, number] = [0.70, 0.83];

export const MARQUEE = {
  /** Idle drift in px/s. */
  baseSpeed: 46,
  /** Extra px/s per unit of normalized scroll velocity (very fast flicks get dramatic). */
  velocityBoost: 2600,
} as const;

export const CARD_TILT = {
  /** Maximum rotation in degrees at the card edge. */
  maxDeg: 9,
  /** 0..1 lerp factor per frame. */
  lerp: 0.12,
  /** Perspective in px. */
  perspective: 900,
} as const;

export const COUNTERS = {
  /** Count-up duration in ms. */
  duration: 1400,
} as const;
