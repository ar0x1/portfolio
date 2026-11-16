import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import VectorWordmark, { measureWordmark } from './VectorWordmark';
/* The hero's own layout rules live in this sheet. It used to arrive through
   `StrokeText.tsx`, which the hero no longer renders — an unused import is
   tree-shaken away *with its CSS*, so the `.hero-stroke` block lost its
   margins. Importing it here keeps the headline exactly where it was. */
import '../styles/stroke-text.css';

/**
 * The portfolio's hero line.
 *
 * It used to be react-bits `StrokeText`'s stroke-draw + fill wipe with a
 * GradientText palette and a ShinyText gloss band running over it. That triple
 * is gone: the *look* is now the Originkit `VectorWordmark` effect — the type is
 * drawn in WebGL as a solid fill plus a dotted vector path, and a drifting 3-point
 * rig frames the pointer, which reveals the path inside its radius.
 *
 * What was deliberately KEPT is the entry animation, because it is the gesture
 * the hero is built around: the dotted path draws on left-to-right, then the solid
 * fill wipes in over it from the same edge. `draw` / `wipe` on `VectorWordmark`
 * are the two numbers that drive it, and the timings below are the old
 * StrokeText ones (`drawDuration 1.7`, `fillDelay 0.22`, fill = `drawDuration ×
 * 0.5`, `power2.out`) so the hero still enters the way it always did.
 *
 * What was REMOVED is the colour gradient animation — the site is monochrome, so
 * the only ramp left is the effect's own static `shade → text` vertical one.
 *
 * Two lines of headline, one GL context: `text` is an array and the vendored
 * atlas stacks it ("Hi..! I'm" / "Aryan Kumar"), left-aligned, 0.3em apart.
 *
 * `show` gates the mount: the entrance overlay owns the screen for the first
 * ~10s, so the draw starts only once the site is actually revealed.
 *
 * Scroll exit (unchanged): the block leaves on a motion blur. As the page scrolls,
 * the headline blurs, lifts and stretches, then fades — the same "it is travelling
 * away from you" read a fast pan has. Driven per frame from the shared scroll
 * position (no scroll listeners, no CSS transitions).
 */

const LINES = ["Hi..! I'm", 'Aryan Kumar'];
/** Reference size in css px — the effect quotes its font size against 1200 px. */
const SIZE = 44;
const FAMILY = "'Press Start 2P', monospace";
const LINE_GAP = 0.3; // em
/** StrokeText's own numbers, kept. */
const DRAW_MS = 1700;
const FILL_DELAY_MS = 1920;
const FILL_MS = 850;

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 2); // power2.out

export function HeroStrokeTitle({ show }: { show: boolean }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // The box is measured in the pixel face, so the face has to be loaded first —
  // `document.fonts.ready` alone is not enough (it can settle before anything on
  // the page has asked for 'Press Start 2P', and the atlas would then be sized to
  // the fallback). `load()` asks for it explicitly, then we measure.
  const [fontReady, setFontReady] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const bump = () => {
      if (!cancelled) setFontReady(t => t + 1);
    };
    try {
      document.fonts
        .load(`400 ${SIZE}px "Press Start 2P"`, LINES.join(' '))
        .then(bump, bump);
    } catch {
      bump();
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // The canvas is a fixed pixel wordmark, so it does not scale with the frame the
  // way the old SVG did. The size therefore follows the viewport: 44 px until the
  // frame is too narrow for "Aryan Kumar" (11 monospace cells), then down to fit —
  // 22 px floor, which is the smallest a Press Start 2P glyph still reads at.
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const fontPx = useMemo(() => {
    // ≤900px the slide is inset 28px a side and the block sits 14px further in
    const gutter = vw <= 900 ? 70 : 120;
    return Math.max(22, Math.min(SIZE, (vw - gutter) / 11));
  }, [vw]);

  const box = useMemo(
    () =>
      measureWordmark(LINES, {
        fontPx,
        family: FAMILY,
        weight: 400,
        letterSpacing: '0px',
        lineGap: LINE_GAP
      }),
    // `fontReady` is the trigger: the metrics change when the pixel face lands.
    [fontReady, fontPx]
  );

  // The entry: 0..1 for the path, 0..1 for the fill.
  const [entry, setEntry] = useState({ draw: 0, wipe: 0 });
  useEffect(() => {
    if (!show) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) {
      setEntry({ draw: 1, wipe: 1 });
      return undefined;
    }

    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = now - t0;
      const draw = ease(t / DRAW_MS);
      const wipe = ease((t - FILL_DELAY_MS) / FILL_MS);
      setEntry({ draw, wipe });
      if (draw < 1 || wipe < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [show]);

  // ---- scroll exit (unchanged from the StrokeText version)
  useEffect(() => {
    if (!show) return undefined;
    const el = wrapRef.current;
    if (!el) return undefined;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let raf = 0;
    let smooth = -1;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;

      // 0 at the top, 1 once the page has scrolled 80% of a viewport — long
      // enough that the blur is actually seen travelling, not a snap
      const raw = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight * 0.8)));
      smooth = smooth < 0 ? raw : smooth + (raw - smooth) * (1 - Math.exp(-dt * 14));
      const p = Math.min(1, Math.max(0, smooth));

      // eased so the blur ramps in before the opacity does
      const blurT = p * p * (3 - 2 * p);
      const gone = p >= 0.985;

      el.style.visibility = gone ? 'hidden' : '';
      el.style.filter = reduced || p < 0.01 ? '' : `blur(${(blurT * 22).toFixed(2)}px)`;
      el.style.transform = reduced
        ? ''
        : `translate3d(${(-38 * p).toFixed(2)}px, ${(-52 * p).toFixed(2)}px, 0) scale(${(1 + 0.06 * p).toFixed(3)}, ${(1 - 0.04 * p).toFixed(3)})`;
      el.style.opacity = String(Math.max(0, 1 - Math.pow(p, 0.72) * 1.15));
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [show]);

  if (!show || !box) return null;

  // The effect quotes its font size against a 1200 px host, so this is the size
  // that comes back out as exactly SIZE css px in a box this narrow.
  const fontSize = (fontPx * 1200) / box.w;

  return (
    <div
      ref={wrapRef}
      className="hero-stroke"
      aria-label="Hi..! I'm Aryan Kumar"
      /* the entry state, surfaced as custom properties: the same two numbers go
         to the shader, so this is also how the animation can be inspected */
      style={
        {
          '--hero-draw': entry.draw.toFixed(3),
          '--hero-wipe': entry.wipe.toFixed(3)
        } as CSSProperties
      }
    >
      <VectorWordmark
        text={LINES}
        lineGap={LINE_GAP}
        font={{
          fontFamily: FAMILY,
          fontWeight: 400,
          fontSize: `${fontSize.toFixed(2)}px`,
          lineHeight: '1em',
          letterSpacing: '0px'
        }}
        background="transparent"
        /* monochrome: ivory fill, a static grey ramp at its foot, white rig */
        textColor="#ffffff"
        /* the source ramps shade -> text up the atlas; on a two-line block that
           would dim the whole second line, so the ramp is kept but nearly flat */
        shade="#dedede"
        accent="rgba(255, 255, 255, 0.36)"
        /* the reference reveal radius is ≈24% of the wordmark's width, in the
           same proportion at any size */
        reach={Math.round(box.w * 0.24)}
        speed={50}
        damping={60}
        handles={{ size: Math.max(12, Math.round(box.h * 0.16)), spread: 55, labels: false }}
        /* the source's "foot melts into the page" (blur + fade at the bottom of the
           atlas) would smear the second line of a stacked headline, so it is off:
           crisp type, and the effect's signature stays the dotted path + the rig */
        melt={0}
        draw={entry.draw}
        wipe={entry.wipe}
        style={{ width: box.w, height: box.h, minWidth: 0, minHeight: 0 }}
      />
    </div>
  );
}
