import { startTransition, useEffect, useRef, useState } from 'react';
import { categories, gallery, projects, type Category, type Project } from '../content';
import { MediaRows, Picture } from '../lib/media';
import { gsap, reducedMotion, stopScroll } from '../lib/motion';
import Diagram from './Diagram';
import { Icon } from './Icon';

const label = (c: Category) => categories.find((x) => x.id === c)?.label ?? '';

function Cover({ p }: { p: Project }) {
  if (p.cover.kind === 'diagram') {
    return <div className="pcard__diagram" data-dark><Diagram variant={p.cover.variant} caption="" /></div>;
  }
  const it = p.cover.item;
  const style = p.cover.position ? { objectPosition: p.cover.position } : undefined;
  return (
    <div className="pcard__img" style={style ? ({ '--pos': p.cover.position } as React.CSSProperties) : undefined}>
      <Picture name={it.kind === 'video' ? it.poster : it.src} alt="" sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 420px" />
    </div>
  );
}

function CaseStudy({ p, onClose }: { p: Project; onClose: () => void }) {
  // the text appears with the dialog; pictures follow a frame later so opening stays instant
  const [media, setMedia] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setTimeout(() => startTransition(() => setMedia(true)), 0));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <dialog className="case" id={`case-${p.id}`} aria-labelledby={`case-${p.id}-title`} onClose={onClose} onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
      <div className="case__inner">
        <header className="case__head">
          <p className="eyebrow">{label(p.category)} · {p.year}</p>
          <h3 id={`case-${p.id}-title`} className="h3">{p.title}</h3>
          <p className="case__lead">{p.summary}</p>
          <form method="dialog">
            <button className="case__close icon-btn" aria-label="Close case study"><Icon name="x" size={18} /></button>
          </form>
        </header>
        <dl className="case__facts">
          <div><dt>Organisation</dt><dd>{p.org}</dd></div>
          {p.place ? <div><dt>Location</dt><dd>{p.place}</dd></div> : null}
          {p.role ? <div><dt>My role</dt><dd>{p.role}</dd></div> : null}
          <div><dt>Years</dt><dd>{p.year}</dd></div>
        </dl>
        <div className="case__body">
          <div>
            {p.challenge ? (<><h4 className="label">The challenge</h4><p>{p.challenge}</p></>) : null}
            <h4 className="label">What I did</h4>
            <ul className="ticks">{p.did.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
          <div>
            <div className="outcome"><h4 className="label">Outcome</h4><p>{p.outcome}</p></div>
            <h4 className="label">Tools</h4>
            <ul className="tags">{p.tools.map((t) => <li key={t}>{t}</li>)}</ul>
            {p.links?.map((l) => (
              <a key={l.href} className="link case__link" href={l.href} target="_blank" rel="noopener">
                {l.label}<Icon name="arrow-up-right" size={15} /><span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))}
          </div>
        </div>
        {p.rows && media ? <div className="case__media"><MediaRows rows={p.rows} /></div> : null}
        {p.diagram && media ? <div className="case__media case__media--diagram" data-dark><Diagram variant={p.diagram} caption={p.caption ?? ''} /></div> : null}
      </div>
    </dialog>
  );
}

export default function Work() {
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  // open/close the native dialog; deep links (#case-id) open a case study directly
  useEffect(() => {
    const fromHash = () => {
      const m = location.hash.match(/^#case-([\w-]+)$/);
      if (m && projects.some((p) => p.id === m[1])) setOpenId(m[1]);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);
  useEffect(() => {
    if (!openId) return;
    const d = document.getElementById(`case-${openId}`) as HTMLDialogElement | null;
    if (!d) return;
    if (!d.open) d.showModal();
    d.scrollTop = 0;
    stopScroll(true);
    if (!reducedMotion()) gsap.fromTo(d, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' });
    if (location.hash !== `#case-${openId}`) history.replaceState(null, '', `#case-${openId}`);
  }, [openId]);
  const onClose = () => {
    stopScroll(false);
    setOpenId(null);
    if (location.hash.startsWith('#case-')) history.replaceState(null, '', '#work');
    lastTrigger.current?.focus();
  };

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || reducedMotion()) return;
    gsap.fromTo(grid.querySelectorAll('.pcard:not([hidden])'), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.04, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
  }, [filter]);

  const count = (c: Category | 'all') => (c === 'all' ? projects.length : projects.filter((p) => p.category === c).length);

  return (
    <section className="section work" id="work" aria-labelledby="work-title">
      <div className="container">
        <header className="section-head section-head--split" data-reveal>
          <div>
            <p className="eyebrow" data-r>Selected work</p>
            <h2 id="work-title" className="h2" data-r>Projects</h2>
          </div>
          <p className="section-intro" data-r>
            Nine projects across payload design, survey campaigns, field operations, mine security, software and training. Open any of them for the full case study.
          </p>
        </header>

        <div className="filters" role="group" aria-label="Filter projects" data-reveal>
          {categories.map((c) => (
            <button key={c.id} type="button" className="chip" aria-pressed={filter === c.id} onClick={() => startTransition(() => setFilter(c.id))} data-r>
              {c.label}<span className="chip__n">{count(c.id)}</span>
            </button>
          ))}
        </div>

        <ul className="pgrid" ref={gridRef}>
          {projects.map((p) => (
            <li key={p.id} className="pcard" hidden={filter !== 'all' && p.category !== filter}>
              <article className="pcard__inner">
                <div className="pcard__cover"><Cover p={p} /></div>
                <p className="pcard__meta">{p.org} · {p.year}</p>
                <h3 className="pcard__title">
                  <button
                    type="button"
                    className="pcard__btn"
                    data-case={p.id}
                    onClick={(e) => { lastTrigger.current = e.currentTarget; const id = p.id; startTransition(() => setOpenId(id)); }}
                    aria-haspopup="dialog"
                  >
                    {p.title}
                  </button>
                </h3>
                <p className="pcard__sum">{p.summary}</p>
                <p className="pcard__more" aria-hidden="true">Read case study <Icon name="arrow-right" size={15} /></p>
              </article>
            </li>
          ))}
        </ul>

        <div className="strip" data-reveal>
          <h3 className="label" data-r>{gallery.title}</h3>
          <div data-r><MediaRows rows={gallery.rows} /></div>
        </div>
      </div>
      {projects.map((p) => (openId === p.id ? <CaseStudy key={p.id} p={p} onClose={onClose} /> : null))}
    </section>
  );
}
