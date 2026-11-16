import { useCallback, useEffect, useRef } from 'react';
import { IntroKeycap } from './IntroKeycap';

interface IntroOverlayProps {
  /** 'leaving' begins the fade-out. */
  state: 'shown' | 'leaving';
  /**
   * Called once when EXPLORE is pressed. Returns a promise that settles when the
   * stage behind the intro is safe to reveal (assets streamed in, or the wait cap
   * elapsed), so the visitor never lands on an empty page.
   */
  onExplore: () => Promise<void> | void;
  /** Start dissolving the intro. */
  onReveal: () => void;
}

/** Short beat so the button can fade out before the black dissolves. */
const PRESS_BEAT_MS = 450;

/**
 * Front page: pure black, one EXPLORE button in the centre. Nothing else.
 * Pressing it opens the portfolio.
 */
export function IntroOverlay({ state, onExplore, onReveal }: IntroOverlayProps) {
  const timer = useRef<number>(0);
  const pressed = useRef(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleExplore = useCallback(() => {
    if (pressed.current) return;
    pressed.current = true;

    const beat = new Promise<void>(resolve => {
      timer.current = window.setTimeout(resolve, PRESS_BEAT_MS);
    });

    Promise.all([beat, Promise.resolve(onExplore()).catch(() => undefined)]).then(onReveal);
  }, [onExplore, onReveal]);

  return (
    <div className="intro" data-state={state} role="dialog" aria-label="Introduction">
      <IntroKeycap onPress={handleExplore} />
    </div>
  );
}
