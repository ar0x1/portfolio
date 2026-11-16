/**
 * Entrance timeline — the single source of truth for the whole welcome sequence.
 *
 * Nothing else in the app may hardcode a duration, an easing or the target anchor.
 * Tune the numbers here and the animation, the reveal and the QA instrumentation all
 * follow.
 *
 * Timeline (ms from click):
 *
 *   0 ─────────── 520        launch        a slow ignite + first lift
 *   520 ─────── 5520        flight        a 5 s climb that carries the craft
 *                                          out through the TOP of the screen
 *   ~3620 ───── 5520        fade          it dissolves while it leaves
 *   5520 ────── 5920        blackout      rays fade out, the room goes pure black
 *   5920 ────── 8920        hold          a full 3 s of solid black
 *   8920 ────── 9960        transition    the portfolio opens
 *
 * There is no arrival and no landing: the craft leaves upwards, fades out and is
 * gone before the site is revealed.
 */

export interface EntranceTimeline {
  /** Ignite → first lift, while the button's own physics is still in charge. */
  launch: { ms: number };
  /** Our choreography: rest slot → out of the top of the viewport. */
  flight: {
    ms: number;
    /** Lateral sway amplitude, px. */
    drift: number;
    /** Peak rotation, radians. */
    tilt: number;
    /**
     * How far past the top edge the craft ends, as a viewport fraction of its own
     * centre. 0.12 puts the centre above the screen, so nothing is left visible.
     */
    overshoot: number;
  };
  /** The craft dissolves on the way out instead of vanishing at the edge. */
  fade: {
    /** Fraction of the flight where the fade starts / finishes. */
    from: number;
    to: number;
  };
  /** The black beat between the craft leaving and the site opening. */
  blackout: {
    /** How long the screen stays completely black before the reveal. */
    holdMs: number;
    /** Cross-fade into black once the craft is gone. */
    fadeMs: number;
  };
  /** Reveal choreography. `at` is when the intro starts dissolving. */
  transition: {
    at: number;
    ms: number;
  };
  /** Reduced-motion fallback: one short cross-fade, no flight. */
  reduced: { ms: number };
}

// Local building blocks, so the reveal time is derived instead of typed twice.
const LAUNCH = 520;
const FLIGHT = 5000;
const BLACKOUT = { fadeMs: 400, holdMs: 3000 };

export const ENTRANCE: EntranceTimeline = {
  launch: { ms: LAUNCH },
  flight: {
    ms: FLIGHT,
    drift: 26,
    tilt: 0.14,
    overshoot: 0.12
  },
  fade: {
    // starts ~1.9 s before the craft clears the top edge
    from: 0.62,
    to: 1
  },
  blackout: BLACKOUT,
  transition: {
    // craft gone at 5520 → 0.4 s cross-fade to black → 3 s of SOLID black →
    // then the site opens
    at: LAUNCH + FLIGHT + BLACKOUT.fadeMs + BLACKOUT.holdMs,
    ms: 1040
  },
  reduced: { ms: 250 }
};

/** Convenience derivations so App/IntroOverlay never re-do the arithmetic. */
export const LAUNCH_MS = ENTRANCE.launch.ms;
export const FLIGHT_MS = ENTRANCE.flight.ms;
/** When the craft has fully left the screen (and is invisible). */
export const FLIGHT_END = LAUNCH_MS + FLIGHT_MS;
/** When the room has finished going black (the 3 s hold starts here). */
export const BLACKOUT_AT = FLIGHT_END + ENTRANCE.blackout.fadeMs;
/** When the overlay starts dissolving. */
export const REVEAL_AT = ENTRANCE.transition.at;
/** When the intro is fully gone. */
export const REVEAL_DONE_AT = REVEAL_AT + ENTRANCE.transition.ms;

/* ---------------------------------------------------------------- easings */
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
export const easeInCubic = (t: number) => t * t * t;
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeInOutQuint = (t: number) =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Normalised progress of `now` inside a [start, start + ms] window. */
export const windowT = (now: number, start: number, ms: number) =>
  clamp01((now - start) / Math.max(1, ms));
