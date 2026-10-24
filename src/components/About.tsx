import { about, education, figures, principles } from '../content';
import { Picture } from '../lib/media';

export default function About() {
  return (
    <section className="section about" id="about" aria-labelledby="about-title">
      <div className="container">
        <div className="about__grid">
          <figure className="about__portrait" data-reveal>
            <div className="about__frame">
              <Picture name="portrait-field" alt="Franklin Ferguson in a high-visibility vest holding a drone remote controller" sizes="(max-width: 860px) 90vw, 440px" />
            </div>
            <figcaption>
              <span className="about__name">Franklin Yesutor Ferguson</span>
              <span>{education.degree}, KNUST</span>
            </figcaption>
          </figure>

          <div className="about__text" data-reveal>
            <p className="eyebrow" data-r>About</p>
            <h2 id="about-title" className="h2" data-r>{about.title}</h2>
            {about.paragraphs.map((p) => (
              <p className="body-lg" key={p.slice(0, 20)} data-r>{p}</p>
            ))}
            <ul className="principles" data-r>
              {principles.map((p) => (
                <li key={p.title}>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <dl className="figures" data-reveal>
          {figures.map((f) => (
            <div className="figure" key={f.label} data-r>
              <dt>{f.label}</dt>
              <dd>
                {f.value}
                {f.unit ? <small> {f.unit}</small> : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
