import { SLIDE_RANGES } from '../three/constants';

const isActive = (value: number, range: readonly [number, number]): boolean =>
  value >= range[0] && value <= range[1];

/**
 * Drives the DOM overlay imperatively at 60fps (no React re-renders).
 * Nodes are queried once, right after React commits the markup.
 */
export class OverlayController {
  private readonly slides: (HTMLElement | null)[];
  private readonly fills: (HTMLElement | null)[];
  private readonly dots: HTMLElement[];
  private readonly mask: HTMLElement | null;

  constructor() {
    this.slides = SLIDE_RANGES.map((_, i) => document.getElementById(`slide-${i + 1}`));
    this.fills = SLIDE_RANGES.map((_, i) => document.getElementById(`dash-fill-${i + 1}`));
    this.dots = Array.from(document.querySelectorAll<HTMLElement>('.grid-dot'));
    this.mask = document.getElementById('slide-2-img');
  }

  update(scroll: number): void {
    // 1. stories-style progress dashes
    this.fills.forEach((fill, i) => {
      if (!fill) return;
      const start = i * 0.25;
      const progress = Math.max(0, Math.min(1, (scroll - start) / 0.25));
      fill.style.height = `${progress * 100}%`;
    });

    // 2. slide reveals + editorial image mask
    this.slides.forEach((slide, i) => {
      const active = isActive(scroll, SLIDE_RANGES[i]);
      slide?.classList.toggle('active', active);
      if (i === 1) this.mask?.classList.toggle('active', active);
    });

    // 3. drifting grid dots
    this.dots.forEach((dot, i) => {
      const startY = (i * 17) % 80 + 10;
      let speed = 90 + (i * 55) % 180;
      if (i % 2 === 0) speed = -speed;
      let y = startY + scroll * speed;
      y = ((y % 100) + 100) % 100;
      dot.style.top = `${y}%`;
    });
  }
}
