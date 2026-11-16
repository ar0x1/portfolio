import { useEffect, useRef, useState } from 'react';
import { site } from '../data/content';
import MagicBento from './MagicBento';

/**
 * Work interlude — visible in the empty gap between the Marble and Fluid phases.
 *
 * The grid is react-bits `MagicBento` (vendored in `./MagicBento.tsx`), wearing
 * the site palette through its `violet` theme: pointer spotlight, border glow,
 * click wave and the intro stagger are all the component's own; the copy is this
 * site's (`data/content.ts`).
 *
 * Layout is a 4-column bento: the first project gets a 2×2 tile, the other two
 * take 2×1 each, so three projects still read as one composition.
 *
 * `intro` (from the pasted props) is gated on the band itself appearing: the
 * bento is not mounted until `#work-band` goes `.active`, so the staggered
 * entrance plays as the work phase opens — once — instead of firing while the
 * band is still hidden.
 */

const TILE = [
  { colSpan: 2, rowSpan: 2 },
  { colSpan: 2, rowSpan: 1 },
  { colSpan: 2, rowSpan: 1 }
];

export function WorkInterlude() {
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

  const items = site.projects.map((project, i) => {
    const span = TILE[i] ?? { colSpan: 1, rowSpan: 1 };
    return {
      id: project.title,
      href: project.href,
      colSpan: span.colSpan,
      rowSpan: span.rowSpan,
      onClick: (event: MouseEvent) => {
        // the placeholder href is "#" — don't let it reset the scroll phase
        if (!project.href || project.href === '#') event.preventDefault();
      },
      content: (
        <>
          <div className="magic-bento__header">
            <span className="magic-bento__label">
              {project.index} · {project.year}
            </span>
          </div>
          <div className="magic-bento__text">
            <h3 className="magic-bento__title">{project.title}</h3>
            <p className="magic-bento__description">{project.tag}</p>
          </div>
          <span className="work-bento__arrow" aria-hidden="true">
            ↗
          </span>
        </>
      )
    };
  });

  return (
    <section id="work-band" aria-label="Selected work" ref={sectionRef}>
      <div className="work-panel">
        <div className="work-head">
          <span>Selected Work</span>
          <span>01 — {String(site.projects.length).padStart(2, '0')}</span>
        </div>

        <div className="work-bento">
          {armed && (
            <MagicBento
              items={items}
              columns={4}
              rowHeight={200}
              gap={12}
              radius={20}
              theme="dark"
              glowColor="#ffffff"
              enableBorderGlow
              enableSpotlight
              spotlightRadius={300}
              clickEffect
              enableStars={false}
              particleCount={24}
              enableTilt={false}
              enableMagnetism={false}
              textAutoHide
              intro
            />
          )}
        </div>

        <div className="work-stats">
          {site.stats.map((stat) => (
            <div className="stat" key={stat.label}>
              {/* InterludeController prints the final value the moment the band is
                  on screen (it reads data-value / data-suffix) */}
              <span className="stat-value" data-value={stat.value} data-suffix={stat.suffix}>
                0{stat.suffix}
              </span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
