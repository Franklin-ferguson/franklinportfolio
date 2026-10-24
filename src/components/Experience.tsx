import { useRef, useState } from 'react';
import { education, experience } from '../content';
import { Icon } from './Icon';

export default function Experience() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = experience.length;
    let j = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % n;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + n) % n;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = n - 1;
    if (j >= 0) {
      e.preventDefault();
      setActive(j);
      tabs.current[j]?.focus();
    }
  };
  return (
    <section className="section experience" id="experience" aria-labelledby="experience-title">
      <div className="container">
        <header className="section-head section-head--split" data-reveal>
          <div>
            <p className="eyebrow" data-r>Experience</p>
            <h2 id="experience-title" className="h2" data-r>Seven years, four teams</h2>
          </div>
          <p className="section-intro" data-r>
            From aircraft maintenance with the Ghana Air Force to co-founding a start-up, leading R&amp;D, and now a mine’s UAS and aerostat operation.
          </p>
        </header>

        <div className="xp" data-reveal>
          <div className="xp__tabs" role="tablist" aria-label="Roles" aria-orientation="vertical" data-r>
            {experience.map((r, i) => (
              <button
                key={r.org}
                ref={(el) => { tabs.current[i] = el; }}
                role="tab"
                id={`xp-tab-${i}`}
                aria-selected={active === i}
                aria-controls={`xp-panel-${i}`}
                tabIndex={active === i ? 0 : -1}
                className="xp__tab"
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKey(e, i)}
              >
                <span className="xp__org">{r.org}</span>
                <span className="xp__dates">{r.from} – {r.to}</span>
              </button>
            ))}
          </div>
          {experience.map((r, i) => (
            <div
              key={r.org}
              role="tabpanel"
              id={`xp-panel-${i}`}
              aria-labelledby={`xp-tab-${i}`}
              className="xp__panel"
              hidden={active !== i}
              tabIndex={0}
            >
              <p className="xp__when">{r.from} – {r.to} · {r.where}</p>
              <h3 className="h4">{r.title}</h3>
              <p className="xp__company">
                {r.org}
                {r.orgNote ? <span> ({r.orgNote})</span> : null}
                {r.relation ? <span> · {r.relation}</span> : null}
              </p>
              <ul className="ticks">
                {r.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="edu" data-reveal>
          <span className="edu__icon" data-r><Icon name="graduation-cap" size={24} /></span>
          <div data-r>
            <p className="label">Education</p>
            <h3 className="h5">{education.degree}</h3>
            <p>{education.school} · {education.dates}</p>
            <p className="edu__honours">{education.honours}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
