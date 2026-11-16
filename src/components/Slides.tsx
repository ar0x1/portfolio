import { Fragment } from 'react';
import { EDITORIAL_IMAGE, site } from '../data/content';
import { SplitTitle } from './SplitTitle';
import { HeroStrokeTitle } from './HeroStrokeTitle';
/** `heroReady` is false until the entrance overlay has finished revealing the site. */
export function Slides({ heroReady = false }: { heroReady?: boolean }) {
  return (
    <>
      {site.slides.map((slide, index) => (
        <Fragment key={slide.id}>
          <div className="slide" id={slide.id}>
            {index === 0 ? (
              /* the hero line: the VectorWordmark effect, entering as a stroke draw → fill wipe */
              <HeroStrokeTitle show={heroReady} />
            ) : (
              <SplitTitle text={slide.title} />
            )}
            {/* A slide with no paragraphs renders none — the hero slide now shows
                the animated headline on its own. */}
            {slide.paragraphs.length > 0 &&
              (slide.variant === 'split' ? (
                <div className="desc-row">
                  <p className="slide-desc col-1">{slide.paragraphs[0]}</p>
                  <p className="slide-desc col-2">{slide.paragraphs[1]}</p>
                </div>
              ) : (
                <p className="slide-desc">{slide.paragraphs[0]}</p>
              ))}
          </div>

          {/* Editorial image mask sits between slide 1 and slide 2 in the DOM. */}
          {index === 0 && (
            <div className="slide-image-mask" id="slide-2-img">
              <img src={EDITORIAL_IMAGE} alt={site.editorialImageAlt} />
            </div>
          )}
        </Fragment>
      ))}
    </>
  );
}
