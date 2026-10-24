import { useEffect, useRef, useState } from 'react';
import { nav, person } from '../content';
import { gsap, reducedMotion, scrollToId, stopScroll } from '../lib/motion';
import { Wordmark } from './Mark';
import { Icon } from './Icon';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Transparent over the hero, a solid bar afterwards; light text while over a dark section.
  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > 24);
      let over = false;
      document.querySelectorAll<HTMLElement>('[data-dark]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= 36 && r.bottom >= 36) over = true;
      });
      setDark(over);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-40% 0px -55% 0px' },
    );
    ['top', ...nav.map((n) => n.id)].forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  // Mobile sheet: focus, Escape, scroll lock.
  useEffect(() => {
    stopScroll(open);
    document.body.classList.toggle('menu-open', open);
    if (!open) return;
    const sheet = sheetRef.current;
    sheet?.querySelector<HTMLElement>('a')?.focus();
    if (sheet && !reducedMotion()) {
      gsap.fromTo(sheet.querySelectorAll('[data-sheet-in]'), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.04, ease: 'power3.out' });
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (e.key === 'Tab' && sheet) {
        const f = Array.from(sheet.querySelectorAll<HTMLElement>('a, button'));
        const all = [buttonRef.current!, ...f];
        const i = all.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); all[all.length - 1].focus(); }
        else if (!e.shiftKey && i === all.length - 1) { e.preventDefault(); all[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    scrollToId(id);
  };

  const cls = ['bar', solid && 'is-solid', (dark || open) && 'is-dark', open && 'is-open'].filter(Boolean).join(' ');

  return (
    <header className={cls}>
      <a className="skip" href="#main">Skip to content</a>
      <div className="bar__inner container">
        <a className="bar__home" href="#top" onClick={go('top')} aria-label="Franklin Ferguson, back to top">
          <Wordmark />
        </a>
        <nav className="bar__nav" aria-label="Main">
          <ul>
            {nav.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} onClick={go(n.id)} aria-current={active === n.id ? 'location' : undefined}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a className="btn btn--accent btn--small bar__cta" href={person.cv} download>
          <Icon name="download" size={16} />
          <span>Download CV</span>
        </a>
        <button
          ref={buttonRef}
          className="bar__menu"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? 'x' : 'menu'} size={22} />
        </button>
      </div>
      <div className="sheet" id="mobile-menu" ref={sheetRef} hidden={!open}>
        <nav aria-label="Mobile">
          <ul>
            {nav.map((n) => (
              <li key={n.id} data-sheet-in>
                <a href={`#${n.id}`} onClick={go(n.id)}>{n.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sheet__foot" data-sheet-in>
          <a className="btn btn--accent" href={person.cv} download><Icon name="download" /><span>Download CV</span></a>
          <a className="sheet__mail" href={`mailto:${person.email}`}>{person.email}</a>
        </div>
      </div>
    </header>
  );
}
