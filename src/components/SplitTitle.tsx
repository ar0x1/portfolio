import { Fragment, type ReactNode } from 'react';
import { CHAR_STAGGER } from '../three/constants';

interface SplitTitleProps {
  text: string; // '\n' = line break
}

/** Renders per-character spans with the staggered blur-up reveal. */
export function SplitTitle({ text }: SplitTitleProps) {
  const nodes: ReactNode[] = [];
  let delayCounter = 0;

  text.split('\n').forEach((line, lineIndex) => {
    if (lineIndex > 0) nodes.push(<br key={`br-${lineIndex}`} />);
    Array.from(line).forEach((char, charIndex) => {
      const key = `${lineIndex}-${charIndex}`;
      if (char === ' ') {
        nodes.push(<Fragment key={key}>{' '}</Fragment>);
      } else {
        nodes.push(
          <span className="char" key={key} style={{ transitionDelay: `${delayCounter * CHAR_STAGGER}s` }}>
            {char}
          </span>,
        );
        delayCounter += 1;
      }
    });
  });

  return <h2 className="slide-title">{nodes}</h2>;
}
