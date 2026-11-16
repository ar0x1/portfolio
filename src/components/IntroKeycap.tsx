import { useCallback, useRef, useState } from 'react';
import IsometricButton from './IsometricButton';
import '../styles/keycap.css';

/**
 * The EXPLORE key, centred on a pure black screen.
 *
 * It is the Originkit `IsometricButton` (DesignPass.dev / Ernest Liu) dressed in
 * the site's monochrome palette: a near-black face, ivory label, and a white
 * prism light so it reads as a lit key floating on black.
 *
 * The key is focusable and answers Enter / Space as well as a click or tap.
 */
export function IntroKeycap({ onPress }: { onPress: () => void }) {
  const [gone, setGone] = useState(false);
  const fired = useRef(false);

  const press = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    setGone(true);
    onPress();
  }, [onPress]);

  return (
    <div className="intro-keycap" data-gone={gone ? 'true' : undefined}>
      {/* the click rides the bubble from the keycap's own hit target, so hover
          and press on the key still behave exactly as the drop intends */}
      <div
        className="intro-keycap__frame"
        onClick={press}
        role="button"
        tabIndex={0}
        aria-label="Explore"
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            press();
          }
        }}
      >
        <IsometricButton
          label="Explore"
          showText
          /* no icon: the label carries the key on its own */
          gap={0}
          /* monochrome: near-black face, ivory label, white prism.
             `intensity` is the drop's one dial across the underside light AND its
             floor bloom — it is what makes the key glow on black. */
          colors={{ fill: '#0d0d0d', textColor: '#f5f5f5', hoverTextColor: '#ffffff' }}
          prism={{ color: '#ffffff', float: 11, hoverFloat: 7, thickness: 18, intensity: 125 }}
          camera={{ tilt: 55, rotate: 0 }}
          padding="22px 46px 22px 46px"
          rounded={70}
          font={{
            /* the site's pixel face — the same one the hero headline is set in,
               so the key belongs to the same type system. Pixel fonts are drawn
               on a coarse grid: they need almost no tracking and no weight. */
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, mass: 0.9 }}
        />
      </div>
    </div>
  );
}
