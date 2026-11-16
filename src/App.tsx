import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Slides } from './components/Slides';
import { GridOverlay } from './components/GridOverlay';
import { WorkInterlude } from './components/WorkInterlude';
import { CarouselBand } from './components/CarouselBand';
import { Loader } from './components/Loader';
import { IntroOverlay } from './components/IntroOverlay';
import { OverlayController } from './lib/overlay';
import { InterludeController } from './lib/interlude';
import { BronzeScene } from './three/BronzeScene';
import { EDITORIAL_IMAGE } from './data/content';
import { ENTRANCE } from './timeline/entranceTimeline';

/** Never hold the visitor hostage longer than this, even on a slow network. */
const MAX_WAIT_MS = 6000;
/** Matches the .intro CSS transition — the timeline's transition window. */
const FADE_MS = ENTRANCE.transition.ms;

type IntroState = 'shown' | 'leaving' | 'done';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [intro, setIntro] = useState<IntroState>('shown');

  /** The loading screen owns the first ~6 s and hands over to the intro. */
  const [loaderDone, setLoaderDone] = useState(false);
  /** True from the moment the loader's sheet starts cross-fading. */
  const [revealing, setRevealing] = useState(false);
  /** True once the WebGL stage is live — the loader waits on it. */
  const [stageUp, setStageUp] = useState(false);

  const loadedRef = useRef({ model: false, fonts: false, image: false });
  const readyRef = useRef(false);
  const exploringRef = useRef(false);

  /** Critical-asset tracker. `model` is now just the 3D stage being up (no GLB). */
  const markLoaded = useCallback((key: keyof typeof loadedRef.current) => {
    if (loadedRef.current[key]) return;
    loadedRef.current[key] = true;
    const done = Object.values(loadedRef.current).filter(Boolean).length;
    if (done === 3) {
      readyRef.current = true;
    }
  }, []);

  // ---- Three.js stage (the ember field; no GLB is loaded any more)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const overlay = new OverlayController();
    const interlude = new InterludeController();
    const engine = new BronzeScene(canvas, {
      onReady: () => {
        setStageUp(true);
        markLoaded('model');
      },
      onFrame: (scroll) => {
        overlay.update(scroll);
        interlude.update(scroll);
      },
    });
    engine.start();

    return () => {
      interlude.dispose();
      engine.dispose();
    };
  }, [markLoaded]);

  // ---- fonts
  useEffect(() => {
    let cancelled = false;
    const settle = () => { if (!cancelled) markLoaded('fonts'); };
    try {
      Promise.all([
        document.fonts.load('16px Italiana'),
        document.fonts.load('300 16px Outfit'),
        document.fonts.load('italic 500 16px "Playfair Display"'),
      ])
        .then(settle)
        .catch(settle);
    } catch {
      settle(); // very old browsers without the FontFaceSet API
    }
    return () => { cancelled = true; };
  }, [markLoaded]);

  // ---- editorial image
  useEffect(() => {
    const img = new Image();
    img.onload = () => markLoaded('image');
    img.onerror = () => markLoaded('image'); // a missing image must not block entry
    img.src = EDITORIAL_IMAGE;
    return () => { img.onload = null; img.onerror = null; };
  }, [markLoaded]);

  // ---- freeze the page behind the intro; `site-ready` marks the reveal as done
  useEffect(() => {
    const root = document.documentElement;
    if (intro === 'done') {
      root.style.overflow = '';
      document.body.style.overflow = '';
      document.body.classList.remove('intro-active');
      document.body.classList.add('site-ready');
      return;
    }
    document.body.classList.remove('site-ready');
    document.body.classList.add('intro-active');
    root.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => {
      root.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [intro]);

  /**
   * Fired by the intro the instant EXPLORE is pressed. Returns a promise that
   * settles once the stage behind the glass can be revealed: the entrance
   * timeline uses it to hold the particle text, never the flight itself.
   */
  const handleExplore = useCallback(() => {
    if (exploringRef.current) return Promise.resolve();
    exploringRef.current = true;

    if (readyRef.current) return Promise.resolve();

    return new Promise<void>(resolve => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearInterval(poll);
        window.clearTimeout(cap);
        resolve();
      };
      // assets still streaming: hold the reveal until they land (or the cap)
      const poll = window.setInterval(() => {
        if (readyRef.current) finish();
      }, 120);
      const cap = window.setTimeout(finish, MAX_WAIT_MS);
    });
  }, []);

  /** The timeline's own cue — the burst has landed, so the glass can dissolve. */
  const handleReveal = useCallback(() => {
    setIntro('leaving');
    window.setTimeout(() => setIntro('done'), FADE_MS);
  }, []);

  return (
    <>
      <div className="cinematic-container">
        <Header />
        <Slides heroReady={intro === 'done'} />
      </div>
      <CarouselBand />
      <WorkInterlude />
      <GridOverlay />
      <canvas id="webgl" ref={canvasRef} />
      {/* The loading screen. It owns the screen until its burst has faded, and
          the intro below is not even mounted until then. */}
      {!loaderDone && (
        <Loader
          stageUp={stageUp}
          onReveal={() => setRevealing(true)}
          onDone={() => setLoaderDone(true)}
        />
      )}
      {revealing && intro !== 'done' && (
        <IntroOverlay
          state={intro === 'leaving' ? 'leaving' : 'shown'}
          onExplore={handleExplore}
          onReveal={handleReveal}
        />
      )}
    </>
  );
}
