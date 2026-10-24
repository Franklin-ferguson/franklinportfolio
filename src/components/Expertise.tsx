import { expertise, platforms } from '../content';
import { Icon } from './Icon';

export default function Expertise() {
  return (
    <section className="section expertise" id="expertise" aria-labelledby="expertise-title">
      <div className="container">
        <header className="section-head section-head--split" data-reveal>
          <div>
            <p className="eyebrow" data-r>Expertise</p>
            <h2 id="expertise-title" className="h2" data-r>What I bring to a team</h2>
          </div>
          <p className="section-intro" data-r>
            Six areas I work in every week, from tuning an autopilot to briefing the people who rely on the results.
          </p>
        </header>
        <div className="skills" data-reveal>
          {expertise.map((s) => (
            <article className="skill" key={s.id} data-r>
              <span className="skill__icon"><Icon name={s.icon} size={22} /></span>
              <h3 className="h5">{s.title}</h3>
              <p className="skill__summary">{s.summary}</p>
              <ul>
                {s.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </article>
          ))}
        </div>
        <div className="platforms" data-reveal>
          <p className="label" data-r>Aircraft I have operated</p>
          <ul data-r>
            {platforms.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
