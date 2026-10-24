import { credentials, research } from '../content';
import { MediaRows } from '../lib/media';
import { Icon } from './Icon';

export default function Research() {
  const t = research.thesis;
  return (
    <section className="section research" id="research" aria-labelledby="research-title">
      <div className="container">
        <header className="section-head" data-reveal>
          <p className="eyebrow" data-r>Research</p>
          <h2 id="research-title" className="h2" data-r>Research and credentials</h2>
        </header>

        <article className="thesis" aria-labelledby="thesis-title">
          <div className="thesis__text" data-reveal>
            <p className="label" data-r>{t.where} · {t.dates}</p>
            <h3 id="thesis-title" className="h4" data-r>{t.title}</h3>
            <p data-r>{t.body}</p>
            <p className="thesis__sup" data-r>{t.supervisor}</p>
          </div>
          <div className="thesis__media" data-reveal>
            <div data-r><MediaRows rows={t.rows} /></div>
          </div>
        </article>

        <div className="research__grid">
          <div data-reveal>
            <h3 className="label" data-r>Applied research</h3>
            <ul className="applied">
              {research.applied.map((a) => (
                <li key={a.title} data-r>
                  <h4 className="h5">{a.title}</h4>
                  <p>{a.body}</p>
                </li>
              ))}
            </ul>
            <h3 className="label" data-r>Research interests</h3>
            <ul className="tags tags--soft" data-r>
              {research.interests.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
          <div data-reveal>
            <h3 className="label" data-r>Qualifications and awards</h3>
            <ul className="creds">
              {credentials.map((c) => (
                <li key={c.title} data-r>
                  <div>
                    <p className="creds__title">{c.title}</p>
                    <p className="creds__by">{c.by}</p>
                  </div>
                  {c.href ? (
                    <a className="link" href={c.href} target="_blank" rel="noopener">
                      {c.linkLabel}<Icon name="arrow-up-right" size={15} /><span className="sr-only"> (PDF, opens in a new tab)</span>
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
