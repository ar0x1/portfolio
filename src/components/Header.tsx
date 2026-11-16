import { Fragment, type MouseEvent as ReactMouseEvent } from 'react';
import { site } from '../data/content';
import { NAV_TARGETS } from '../three/constants';

export function Header() {
  const goTo = (event: ReactMouseEvent<HTMLAnchorElement>, index: number) => {
    event.preventDefault();
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: maxScroll * NAV_TARGETS[index], behavior: 'smooth' });
  };

  return (
    <div className="main-header">
      {/* The LAOCOÖN wordmark was removed. An empty slot keeps the header's
          three-column balance, so the nav and the contact button stay exactly
          where they were. */}
      <div className="brand-slot" aria-hidden="true" />
      <nav className="header-nav">
        {site.nav.map((item, index) => (
          <Fragment key={item.href}>
            {index > 0 && <span className="nav-dot" />}
            <a href={item.href} className="nav-link" onClick={(event) => goTo(event, index)}>
              {item.label}
            </a>
          </Fragment>
        ))}
      </nav>
      <div className="header-actions">
        <a
          href={site.contact.href}
          className="contact-btn"
          onClick={(event) => { if (site.contact.href === '#') event.preventDefault(); }}
        >
          {site.contact.label} <span className="btn-circle" />
        </a>
      </div>
    </div>
  );
}
