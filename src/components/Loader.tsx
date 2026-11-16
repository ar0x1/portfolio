import { useCallback, useEffect, useRef, useState } from 'react';
import OrbConverge from './OrbConverge';
import { preloadFonts, preloadImages, SITE_ASSETS } from '../lib/preload';
import '../styles/loader.css';

/**
 * The loading screen.
 *
 * It exists for three reasons, in this order:
 *   1. **It loads.** Images (id-card faces, strap, portrait, the editorial plate),
 *      the faces those screens set type in, and the 3D stage — `stageUp` comes
 *      from `App.tsx`, which already knows when the WebGL scene is live.
 *   2. **It is the first animation the visitor sees.** The Originkit
 *      `OrbConverge` loop — a Fibonacci sphere that collapses to a ring on a
 *      raised cosine and holds, then opens back up — rendered in ivory dots on
 *      the site's black. Drag is off: a loading screen must not be draggable.
 *   3. **It ends, quietly.** Five seconds — exactly one full converge loop, since
 *      the loop's period is 4.8 s at Speed 50 and the speed below is 48 — and then
 *      the ball simply dissolves: it eases up a hair and fades while the black
 *      sheet under it cross-fades onto the intro. No rings, no flash, no
 *      explosion; the sheet *becomes* the next screen.
 *
 * The intro is mounted at the start of that cross-fade (`onReveal`), not after it,
 * so the light rays and the craft bloom through the dissolving black instead of
 * popping in once it is gone.
 *
 * Timings: `MIN_MS` is the design duration; if the network is slower the screen
 * waits (that is the point of a loader), but never past `MAX_MS` — a visitor must
 * not be trapped.
 */

const MIN_MS = 5000; // the promised duration — one whole converge loop
const MAX_MS = 8000; // hard cap, even if an asset never arrives
/** How long after the release the sheet starts its own fade. */
const HANDOVER_MS = 240;
/** The sheet's cross-fade. */
const OUT_MS = 820;

type Phase = 'loading' | 'release' | 'out';

export function Loader({
  stageUp = false,
  onReveal,
  onDone
}: {
  stageUp?: boolean;
  /** fired when the sheet starts cross-fading onto the intro */
  onReveal?: () => void;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [images, setImages] = useState({ loaded: 0, total: SITE_ASSETS.length });
  const [fontsUp, setFontsUp] = useState(0);
  const startedAt = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const fired = useRef(false);
  /** 0 → 1 across `MIN_MS`; the progress rule's clock. */
  const [clock, setClock] = useState(0);

  // ---- what we are waiting for
  useEffect(() => {
    let cancelled = false;
    preloadImages(SITE_ASSETS, (loaded, total) => {
      if (!cancelled) setImages({ loaded, total });
    });
    preloadFonts().then(() => {
      if (!cancelled) setFontsUp(1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = images.loaded >= images.total && fontsUp === 1 && stageUp;

  /**
   * The progress rule is timed, not counted.
   *
   * Assets on a local connection land in ~100 ms, so a rule wired to the real
   * load fraction sits at 100% for five seconds — which reads as a broken screen.
   * It is therefore driven by the clock instead: `clock` runs 0 → 1 across
   * `MIN_MS`, the curve is *slightly* decelerating (`t^0.9`, so it is behind the
   * clock early and arrives on it at the end), and the rule touches full exactly
   * as the release starts.
   *
   * The real load still gets a veto: until everything is decoded the rule may not
   * pass `STALL_CAP`, so a slow network shows an honest hold instead of a full
   * bar stuck in place.
   */
  const STALL_CAP = 0.94;
  const eased = Math.pow(clock, 0.9);
  const progress = Math.max(0.04, Math.min(ready ? 1 : STALL_CAP, eased));

  // ---- the end: let go, then hand the screen over
  // the clock the progress rule reads — 100 ms ticks, the CSS transition smooths
  useEffect(() => {
    if (fired.current) return undefined;
    const id = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - startedAt.current) / MIN_MS);
      setClock(t);
      if (t >= 1) window.clearInterval(id);
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  const release = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    setClock(1);
    setPhase('release'); // the ball fades out over its own 900 ms
    window.setTimeout(() => {
      setPhase('out'); // the sheet cross-fades onto the intro
      onReveal?.();
    }, HANDOVER_MS);
    window.setTimeout(onDone, HANDOVER_MS + OUT_MS);
  }, [onDone, onReveal]);

  // assets ready and the design duration has passed → go; if they land early,
  // hold until the three seconds are up rather than cutting the animation short
  useEffect(() => {
    if (!ready || fired.current) return undefined;
    const elapsed = performance.now() - startedAt.current;
    if (elapsed >= MIN_MS) {
      release();
      return undefined;
    }
    const t = window.setTimeout(release, MIN_MS - elapsed);
    return () => window.clearTimeout(t);
  }, [ready, release]);

  // the cap: nothing may hold the visitor past MAX_MS
  useEffect(() => {
    const t = window.setTimeout(release, MAX_MS);
    return () => window.clearTimeout(t);
  }, [release]);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className="loader"
      data-state={phase}
      data-reduced={reduced ? 'true' : undefined}
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <div className="loader__inner">
        <div className="loader__orb">
          <OrbConverge
            /* monochrome: ivory dots, no accent — the site has one ink */
            dotColor="#ffffff"
            density={300}
            dotSize={150}
            /* 4.8 s at Speed 50, so 48 makes one converge loop exactly 5.0 s —
               the ball finishes its breath in the same frame it is released */
            speed={48}
            spinTurns={1}
            ball={{ spread: 100, turn: 0, tilt: 0 }}
            /* a loader is not a toy: the drag is switched off */
            pointer={{ drag: 0, damping: 20 }}
            width={260}
            height={260}
          />
        </div>

        <div className="loader__meta" aria-hidden="true">
          <span className="loader__label">Loading</span>
          <span className="loader__bar">
            <span className="loader__bar-fill" style={{ width: `${(progress * 100).toFixed(1)}%` }} />
          </span>
        </div>
      </div>
    </div>
  );
}
