import { MARQUEE_RANGE, WORK_RANGE } from '../three/constants';

const inRange = (value: number, range: readonly [number, number]): boolean =>
  value >= range[0] && value <= range[1];

/** Ease-out-expo: fast start, long settle — reads as "counting up and landing". */
const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Drives the two interlude bands imperatively:
 *  - work band:     reveal + count-up stats (scroll 0.42 -> 0.55)
 *  - carousel band: reveal only (scroll 0.70 -> 0.83). The band used to hold a
 *    velocity-reactive marquee track; it now holds the FlexCarousel, whose motion
 *    is its own (spring track, drag, lens), so nothing here is translated.
 */
export class InterludeController {
  private readonly workBand: HTMLElement | null;
  private readonly carouselBand: HTMLElement | null;
  private readonly statValues: HTMLElement[];

  private workActive = false;
  private carouselActive = false;

  constructor() {
    this.workBand = document.getElementById('work-band');
    this.carouselBand = document.getElementById('carousel-band');
    this.statValues = Array.from(document.querySelectorAll<HTMLElement>('.stat-value'));
  }

  update(scroll: number): void {
    this.updateWork(scroll);
    this.updateCarouselBand(scroll);
  }

  private updateWork(scroll: number): void {
    const active = inRange(scroll, WORK_RANGE);
    if (active !== this.workActive) {
      this.workActive = active;
      this.workBand?.classList.toggle('active', active);
      if (!active) {
        // reset so the numbers are printed fresh on the next pass
        this.statValues.forEach((el) => {
          el.textContent = `0${el.dataset.suffix ?? ''}`;
        });
      }
    }

    if (!this.workActive || this.statValues.length === 0) return;

    // No count-up animation: the numbers are printed at their final value the
    // moment the band is on screen, like every other piece of copy here.
    const progress = 1;
    const eased = easeOutExpo(progress);

    this.statValues.forEach((el) => {
      const target = Number(el.dataset.value ?? 0);
      const suffix = el.dataset.suffix ?? '';
      el.textContent = `${Math.round(target * eased)}${suffix}`;
    });
  }

  private updateCarouselBand(scroll: number): void {
    const active = inRange(scroll, MARQUEE_RANGE);
    if (active === this.carouselActive) return;
    this.carouselActive = active;
    this.carouselBand?.classList.toggle('active', active);
  }

  dispose(): void {
    // nothing to detach: no listeners, no measured widths
  }
}
