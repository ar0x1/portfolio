import { Fragment } from 'react';
import { SLIDE_RANGES } from '../three/constants';

export function GridOverlay() {
  return (
    <>
      <div className="grid-horizontal-line" />
      <div className="grid-lines">
        {Array.from({ length: 5 }, (_, lineIndex) => (
          <div
            className={`grid-line${lineIndex === 4 ? ' story-progress-container' : ''}`}
            key={lineIndex}
          >
            <div className="grid-dot top" />
            <div className="grid-dot bottom" />
            {lineIndex === 4 && (
              <div className="story-dashes">
                {SLIDE_RANGES.map((_, dashIndex) => (
                  <Fragment key={dashIndex}>
                    <div className="story-dash">
                      <div className="story-dash-fill" id={`dash-fill-${dashIndex + 1}`} />
                    </div>
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
