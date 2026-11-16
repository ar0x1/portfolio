import { useEffect, useRef, useState } from 'react';
import FlexCarousel from './FlexCarousel';

/**
 * Carousel band — replaces the old velocity-reactive marquee ribbon.
 *
 * The ribbon (`#marquee-band`, a rotated strip of outlined words) is gone; in its
 * slot sits react-bits `FlexCarousel` (vendored in `./FlexCarousel.tsx`): a WebGL2
 * lens that bends a strip of photographs, with drag, arrow keys, click-to-focus
 * and the `rise` intro.
 *
 * Two site-specific decisions:
 *
 *  1. **Mounted on first reveal, then kept.** The band is only `.active` between
 *     `MARQUEE_RANGE` (scroll 0.70 -> 0.83). Mounting the WebGL engine there every
 *     time would re-download and re-upload every texture on each pass, so the band
 *     is armed once — by a class observer, not by scroll — and then simply shown
 *     or hidden by the existing `.active` toggle. The intro therefore plays as the
 *     band opens for the first time.
 *  2. **`captureWheel={false}`.** This site *is* a scroll timeline: the wheel must
 *     keep driving the page. The carousel still takes horizontal wheel, drag,
 *     arrows, Home/End and Enter/Space — only the vertical wheel is left to the
 *     page.
 */

const photo = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=80&auto=format&fit=max`;

const ITEMS = [
  {
    src: photo('photo-1737071371043-761e02b1ef95'),
    alt: 'An iridescent chrome sculpture of a head',
    title: 'Bronze',
    subtitle: 'Oxide study'
  },
  {
    src: photo('photo-1739056238917-d89cd05c48d5'),
    alt: 'A twisted chrome form on black',
    title: 'Patina',
    subtitle: 'Surface 04'
  },
  {
    src: photo('photo-1495462911434-be47104d70fa'),
    alt: 'A figure framed by a wide brim',
    title: 'Time',
    subtitle: 'Archive'
  },
  {
    src: photo('photo-1747191092806-c7da11881986'),
    alt: 'A clay bust shown in profile',
    title: 'Form',
    subtitle: 'Cast profile'
  },
  {
    src: photo('photo-1786835568925-20cd20007ed0'),
    alt: 'Three swirling forms in white, gold and silver',
    title: 'Light',
    subtitle: 'Studio 07'
  },
  {
    src: photo('photo-1787181875088-087d612262a7'),
    alt: 'A black textured sculpture with an opening at its centre',
    title: 'Matter',
    subtitle: 'Raw clay'
  }
];

export function CarouselBand() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    if (el.classList.contains('active')) {
      setArmed(true);
      return undefined;
    }
    const observer = new MutationObserver(() => {
      if (!el.classList.contains('active')) return;
      setArmed(true);
      observer.disconnect();
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <section id="carousel-band" aria-label="Selected work in motion" ref={sectionRef}>
      {armed && (
        <div className="carousel-band__stage">
          <FlexCarousel
            items={ITEMS}
            preset="liquid"
            intro="rise"
            cardHeight={0.5}
            gap={12}
            squeeze={0.2}
            focusOnClick
            captions
            fit="natural"
            radius={0}
            lensWidth={0.74}
            lensHeight={1.18}
            tilt={62}
            roundness={1}
            bend={0.34}
            reach={0.38}
            curl="twist"
            dispersion={0.45}
            liquid={0}
            followCursor={false}
            autoplay={false}
            interval={4}
            captureWheel={false}
          />
        </div>
      )}
    </section>
  );
}
