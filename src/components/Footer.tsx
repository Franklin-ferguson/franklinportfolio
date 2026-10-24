import { nav, person } from '../content';
import { scrollToId } from '../lib/motion';
import { Wordmark } from './Mark';
import { Icon } from './Icon';

export default function Footer() {
  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId(id);
  };
  return (
    <footer className="footer" data-dark>
      <div className="container footer__inner">
        <Wordmark />
        <nav aria-label="Footer">
          <ul>
            {nav.map((n) => (
              <li key={n.id}><a href={`#${n.id}`} onClick={go(n.id)}>{n.label}</a></li>
            ))}
          </ul>
        </nav>
        <a className="icon-btn" href="#top" onClick={go('top')} aria-label="Back to top">
          <Icon name="arrow-down" size={18} style={{ transform: 'rotate(180deg)' }} />
        </a>
      </div>
      <div className="container footer__base">
        <p>© 2026 {person.fullName}</p>
        <p>Photographs and footage are from my own projects. Diagrams and the 3D flight are illustrations.</p>
      </div>
    </footer>
  );
}
